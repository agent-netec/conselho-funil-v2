export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard'; // DT-01 FIX
import { PersonalizationResolver } from '@/lib/intelligence/personalization/resolver';

/**
 * POST /api/personalization/resolve
 * Resolve conteúdo dinâmico para um lead específico.
 *
 * Body: { brandId: string, leadId: string }
 * Response: { leadId, segment, variations, fallback, matchedRuleCount }
 *
 * @story S31-RT-01
 */
export async function POST(req: NextRequest) {
  try {
    const { brandId, leadId } = await req.json();

    if (!brandId || !leadId) {
      return createApiError(400, 'brandId and leadId are required');
    }

    await requireBrandAccess(req, brandId);

    const result = await PersonalizationResolver.resolve(brandId, leadId);

    return createApiSuccess({
      leadId,
      segment: result.segment,
      variations: result.variations,
      fallback: result.fallback,
      matchedRuleCount: result.variations.length,
    });
  } catch (error) {
    console.error('[Personalization Resolve Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return createApiError(500, message);
  }
}
