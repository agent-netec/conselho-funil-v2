import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { saveCopyDNA } from '@/lib/firebase/vault';

export const dynamic = 'force-dynamic';

const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  const { brandId, text } = body;

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    if (!text || text.trim().length < 20) {
      return createApiError(400, 'Text must be at least 20 characters');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) return createApiError(500, 'AI API key not configured');

    const prompt = `Analise o seguinte texto de copy/conteúdo e extraia o DNA criativo (padrão estrutural).

TEXTO:
"""
${text}
"""

Identifique e retorne em JSON:
{
  "name": "Nome descritivo do padrão (ex: 'Hook Contraste Emocional')",
  "type": "hook" | "structure" | "style_guide" | "template",
  "content": "Descrição detalhada do padrão encontrado, incluindo a estrutura, tom e técnica usada",
  "tags": ["tag1", "tag2", "tag3"],
  "platform_optimization": ["Instagram (Reels)", "TikTok", "LinkedIn", "X (Twitter)", "YouTube Shorts"],
  "hookType": "tipo do hook se aplicável",
  "structure": "estrutura do texto (ex: problema-agitação-solução)",
  "tone": "tom predominante",
  "ctaStyle": "estilo de CTA usado"
}

Responda APENAS em JSON válido.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[vault/dna/extract] Gemini API error:', errText);
      return createApiError(502, 'Erro ao processar com IA. Tente novamente.');
    }

    const result = await response.json();
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed;
    try {
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = jsonMatch ? jsonMatch[1].trim() : aiText.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      return createApiError(502, 'Failed to parse AI response');
    }

    // Save to Firestore + Pinecone via saveCopyDNA
    const dnaId = await saveCopyDNA(brandId, {
      id: '',
      name: parsed.name || 'DNA Extraído',
      type: parsed.type || 'template',
      content: parsed.content || text.substring(0, 500),
      platform_optimization: parsed.platform_optimization || [],
      tags: parsed.tags || [],
      performance_metrics: { avg_engagement: 0, usage_count: 0, posts_using: 0 },
    });

    return createApiSuccess({
      id: dnaId,
      extracted: parsed,
    });
  } catch (error: any) {
    console.error('[DNA Extract] Error:', error);
    return createApiError(500, error.message || 'Failed to extract DNA');
  }
}
