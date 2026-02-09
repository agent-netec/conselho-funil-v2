export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getCreativePerformanceRanking } from '@/lib/firebase/creative-intelligence';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * @fileoverview API Route for Creative Intelligence Ranking
 * @route GET /api/intelligence/creative/ranking
 * @story ST-26.3
 */

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return createApiError(400, 'Missing brandId parameter');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);
    const ranking = await getCreativePerformanceRanking(safeBrandId);

    return createApiSuccess({
      brandId: safeBrandId,
      ranking,
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    console.error('❌ [API Creative Ranking] Error:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return createApiError(500, message);
  }
}
