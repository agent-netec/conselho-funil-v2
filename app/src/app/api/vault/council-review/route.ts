import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { buildPartyPrompt } from '@/lib/ai/prompts/party-mode';
import { buildPartyBrainContext } from '@/lib/ai/prompts/party-brain-context';

export const dynamic = 'force-dynamic';

const PRO_GEMINI_MODEL = process.env.GEMINI_PRO_MODEL || 'gemini-3-pro-preview';

const SOCIAL_COUNSELORS = ['rachel_karten', 'lia_haberman', 'nikita_beer', 'justin_welsh'];

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  const { brandId, content, platform, brandContext } = body;

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    if (!content) {
      return createApiError(400, 'content is required for council review');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) return createApiError(500, 'AI API key not configured');

    const brainContext = buildPartyBrainContext(SOCIAL_COUNSELORS);

    const query = `Avalie o seguinte conteúdo que está prestes a ser aprovado para publicação na plataforma ${platform || 'social'}:

CONTEÚDO PARA REVISÃO:
"""
${typeof content === 'string' ? content : JSON.stringify(content)}
"""

Cada conselheiro deve:
1. Avaliar se o conteúdo está pronto para publicação
2. Dar uma nota de 0-10
3. Sugerir melhorias específicas se necessário
4. Dar um veredito: APROVAR, AJUSTAR ou REJEITAR

O veredito final do conselho deve consolidar as opiniões.`;

    const fullPrompt = buildPartyPrompt(
      query,
      brandContext || '',
      SOCIAL_COUNSELORS,
      { intensity: 'debate', brainContext }
    );

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${PRO_GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[vault/council-review] Gemini API error:', errText);
      return createApiError(502, 'Erro ao processar com IA. Tente novamente.');
    }

    const result = await response.json();
    const review = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    return createApiSuccess({
      review,
      counselors: SOCIAL_COUNSELORS,
      model: PRO_GEMINI_MODEL,
    });
  } catch (error: any) {
    console.error('[Vault Council Review] Error:', error);
    return createApiError(500, error.message || 'Failed to generate council review');
  }
}
