export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { generateWithGemini } from '@/lib/ai/gemini';
import { updateUserUsage } from '@/lib/firebase/firestore';

/**
 * POST /api/intelligence/keywords/related
 * Generate correlated keywords (LSI, longtail, questions) via Gemini
 * Sprint N-1.6
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{
      brandId?: string;
      seedTerm?: string;
      userId?: string;
    }>(req);

    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const { brandId, seedTerm, userId } = parsed.data;

    if (!brandId || !seedTerm) {
      return createApiError(400, 'brandId e seedTerm são obrigatórios');
    }

    await requireBrandAccess(req, brandId);

    const prompt = `Você é um especialista em SEO semântico no Brasil.

Para o termo principal "${seedTerm}", gere 3 categorias de keywords correlacionadas:

1. **LSI (Latent Semantic Indexing):** 8-10 termos semanticamente relacionados que o Google associa a este tema.
2. **Longtail:** 8-10 variações longtail (3-5 palavras) com alta intenção de compra ou pesquisa específica.
3. **Perguntas:** 8-10 perguntas reais que as pessoas fazem no Google sobre este tema (formato "como...", "o que é...", "quando...", "por que...", etc).

Para cada keyword, inclua:
- "term": o termo
- "intent": "transactional" | "commercial" | "informational" | "navigational"
- "estimated_volume": 1-100 (estimativa relativa)

Retorne APENAS um JSON válido neste formato:
{
  "lsi": [{ "term": "...", "intent": "...", "estimated_volume": 50 }],
  "longtail": [{ "term": "...", "intent": "...", "estimated_volume": 30 }],
  "questions": [{ "term": "...", "intent": "...", "estimated_volume": 20 }]
}`;

    const result = await generateWithGemini(prompt, {
      responseMimeType: 'application/json',
      temperature: 0.4,
      feature: 'keyword_related',
    });

    const related = JSON.parse(result);

    // Deduct 1 credit
    if (userId) {
      try {
        await updateUserUsage(userId, -1);
      } catch (creditError) {
        console.error('[Keywords/Related] Credit error:', creditError);
      }
    }

    return createApiSuccess({
      seedTerm,
      lsi: related.lsi || [],
      longtail: related.longtail || [],
      questions: related.questions || [],
    });
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Erro ao gerar keywords correlacionadas';
    return createApiError(500, message);
  }
}
