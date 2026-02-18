import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  const { brandId, contentPlan, hooks, platform, campaignType } = body;

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    if (!hooks || !Array.isArray(hooks) || hooks.length === 0) {
      return createApiError(400, 'hooks array is required');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) {
      return createApiError(500, 'AI API key not configured');
    }

    const prompt = `Você é um especialista em marketing de conteúdo social.

Dado o seguinte hook/conteúdo original para ${platform || 'redes sociais'} (campanha tipo: ${campaignType || 'orgânico'}):

${hooks.map((h: any, i: number) => `Hook ${i + 1}: "${h.content || h}"`).join('\n')}

${contentPlan ? `Plano de conteúdo: ${JSON.stringify(contentPlan)}` : ''}

Gere 3 variações A/B para CADA hook. Cada variação deve ter:
- Uma abordagem/ângulo diferente
- Um score preditivo de engajamento (0-100)
- Uma justificativa curta

Responda APENAS em JSON válido:
{
  "variations": [
    {
      "originalHookIndex": 0,
      "variants": [
        { "content": "...", "angle": "...", "predictedScore": 85, "reasoning": "..." },
        { "content": "...", "angle": "...", "predictedScore": 78, "reasoning": "..." },
        { "content": "...", "angle": "...", "predictedScore": 72, "reasoning": "..." }
      ]
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[social/ab-variations] Gemini API error:', errText);
      return createApiError(502, 'Erro ao processar com IA. Tente novamente.');
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = jsonMatch ? jsonMatch[1].trim() : text.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      parsed = { variations: [], rawText: text };
    }

    return createApiSuccess(parsed);
  } catch (error: any) {
    console.error('[Social A/B] Error:', error);
    return createApiError(500, error.message || 'Failed to generate A/B variations');
  }
}
