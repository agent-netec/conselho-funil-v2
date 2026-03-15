export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

const MAX_KEYWORDS_PER_BRAND = 100;

/**
 * Save a single keyword via Admin SDK.
 * Upserts by term (case-insensitive).
 */
async function saveBrandKeywordAdmin(
  brandId: string,
  keyword: {
    term: string;
    volume: number;
    difficulty: number;
    intent: string;
    opportunityScore: number;
    source: string;
    suggestion?: string;
  }
): Promise<string> {
  const adminDb = getAdminFirestore();
  const keywordsRef = adminDb.collection('brands').doc(brandId).collection('keywords');

  // Check limit
  const existingSnap = await keywordsRef.count().get();
  if (existingSnap.data().count >= MAX_KEYWORDS_PER_BRAND) {
    throw new Error('Limite de 100 keywords por marca atingido.');
  }

  // Check if keyword already exists (by term, case-insensitive)
  const termLower = keyword.term.toLowerCase();
  const existingQuery = await keywordsRef.get();
  const existing = existingQuery.docs.find(
    d => (d.data().term as string).toLowerCase() === termLower
  );

  const data = {
    ...keyword,
    savedAt: Timestamp.now(),
  };

  // Strip undefined values (Firestore rejects them)
  if (data.suggestion === undefined) {
    delete (data as Record<string, unknown>).suggestion;
  }

  if (existing) {
    await keywordsRef.doc(existing.id).set(data, { merge: true });
    return existing.id;
  }

  const docRef = await keywordsRef.add(data);
  return docRef.id;
}

/**
 * POST /api/intelligence/keywords/save
 * Save mined keywords to brands/{brandId}/keywords (Admin SDK)
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
      const id = await saveBrandKeywordAdmin(brandId, {
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
      let saved = 0;
      for (const kw of keywords) {
        try {
          await saveBrandKeywordAdmin(brandId, {
            term: kw.term,
            volume: kw.volume,
            difficulty: kw.difficulty,
            intent: kw.intent,
            opportunityScore: kw.opportunityScore,
            source: 'miner',
            ...(kw.suggestion != null && { suggestion: kw.suggestion }),
          });
          saved++;
        } catch (err) {
          // If limit hit, stop but return what we saved
          console.warn('[keywords/save] Batch stopped:', err instanceof Error ? err.message : err);
          break;
        }
      }
      return createApiSuccess({ saved });
    }

    return createApiError(400, 'keyword ou keywords é obrigatório');
  } catch (error: unknown) {
    console.error('[keywords/save] Error:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Erro ao salvar keywords';
    return createApiError(500, message);
  }
}
