export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { CrossChannelAggregator } from '@/lib/intelligence/attribution/aggregator';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
/**
 * GET /api/intelligence/attribution/stats?brandId=X&days=30
 * Consumer server-side para CrossChannelAggregator
 * Sprint 27 — S27-ST-10: Wiring de aggregator.ts
 *
 * Nota (Arch Review): O aggregator usa PerformanceMetricDoc (schema legado).
 * Se dados reais não existirem no schema esperado, retorna resultado vazio.
 * Ativação completa com adapter → Sprint 28 (CL-03).
 *
 * Response: { success: true, data: { stats: CrossChannelMetricDoc, meta: { processed: boolean } } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const days = parseInt(searchParams.get('days') || '30', 10);

    if (!brandId) {
      return createApiError(400, 'brandId is required', { code: 'VALIDATION_ERROR' });
    }

    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const stats = await CrossChannelAggregator.aggregate(brandId, startDate, endDate);

    return createApiSuccess({ stats, meta: { processed: true } });
  } catch (error: unknown) {
    console.error('[Attribution Stats] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error', { code: 'INTERNAL_ERROR' });
  }
}
