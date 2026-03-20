export const dynamic = 'force-dynamic';

/**
 * POST /api/brands/[brandId]/suggest-objections
 *
 * Generates 6-8 common objections based on brand vertical, offer and audience.
 * Uses Gemini Flash — cost ~0 (small prompt, small output).
 */

import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  const { brandId } = await params;

  try {
    await requireBrandAccess(request, brandId);
  } catch (err: any) {
    if (err instanceof ApiError) return handleSecurityError(err);
    return createApiError(401, 'Unauthorized');
  }

  try {
    const body = await request.json().catch(() => null);
    if (!body?.vertical && !body?.offer) {
      return createApiError(400, 'vertical or offer is required');
    }

    const apiKey = (process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || '').trim();
    if (!apiKey) return createApiError(500, 'AI API key not configured');

    const { vertical, offer, audience } = body;

    const prompt = `Você é especialista em copywriting e vendas no mercado brasileiro.

Para o seguinte contexto:
- Nicho/Vertical: ${vertical || 'não informado'}
- Oferta: ${offer || 'não informada'}
- Público-alvo: ${audience || 'não informado'}

Liste as 8 objeções mais comuns que impedem a compra neste nicho.
Cada objeção deve ser curta (máx 8 palavras), na perspectiva do cliente.

Retorne APENAS JSON válido no formato:
{"objections": ["objeção 1", "objeção 2", ...]}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 512,
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return createApiError(429, 'Quota exceeded. Try again in a few minutes.');
      }
      return createApiError(502, 'AI processing error');
    }

    const result = await response.json();
    const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text || '';

    let parsed: { objections: string[] };
    try {
      const jsonMatch = aiText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const cleaned = jsonMatch ? jsonMatch[1].trim() : aiText.trim();
      const firstBrace = cleaned.indexOf('{');
      const lastBrace = cleaned.lastIndexOf('}');
      parsed = JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch {
      parsed = { objections: [] };
    }

    // Ensure array and limit to 8
    const objections = Array.isArray(parsed.objections)
      ? parsed.objections.slice(0, 8).map((o: any) => String(o).trim()).filter(Boolean)
      : [];

    return createApiSuccess({ objections });
  } catch (error: any) {
    console.error('[suggest-objections] Error:', error);
    return createApiError(500, error.message || 'Failed to generate objection suggestions');
  }
}
