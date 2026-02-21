export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { saveBrandKeyword, saveBrandKeywordsBatch } from '@/lib/firebase/intelligence';

/**
 * POST /api/intelligence/keywords/save
 * Save mined keywords to brands/{brandId}/keywords
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{
      brandId?: string;
      keywords?: Array<{
        term: string;
        volume: number;
        difficulty: number;
        intent: string;
        opportunityScore: number;
        suggestion?: string;
      }>;
      keyword?: {
        term: string;
        volume: number;
        difficulty: number;
        intent: string;
        opportunityScore: number;
        suggestion?: string;
      };
    }>(req);

    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const { brandId, keywords, keyword } = parsed.data;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    await requireBrandAccess(req, brandId);

    // Single keyword save
    if (keyword) {
      const id = await saveBrandKeyword(brandId, {
        term: keyword.term,
        volume: keyword.volume,
        difficulty: keyword.difficulty,
        intent: keyword.intent,
        opportunityScore: keyword.opportunityScore,
        source: 'miner',
        ...(keyword.suggestion != null && { suggestion: keyword.suggestion }),
      });
      return createApiSuccess({ saved: 1, id });
    }

    // Batch save
    if (keywords && keywords.length > 0) {
      const batch = keywords.map(kw => ({
        term: kw.term,
        volume: kw.volume,
        difficulty: kw.difficulty,
        intent: kw.intent,
        opportunityScore: kw.opportunityScore,
        source: 'miner' as const,
        ...(kw.suggestion != null && { suggestion: kw.suggestion }),
      }));

      const saved = await saveBrandKeywordsBatch(brandId, batch);
      return createApiSuccess({ saved });
    }

    return createApiError(400, 'keyword ou keywords é obrigatório');
  } catch (error: unknown) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Erro ao salvar keywords';
    return createApiError(500, message);
  }
}
