export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ChannelOverlapAnalyzer } from '@/lib/intelligence/attribution/overlap';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
/**
 * GET /api/intelligence/attribution/overlap?brandId=X&days=30
 * Consumer para ChannelOverlapAnalyzer (via overlap direto)
 * Sprint 27 — S27-ST-10: Wiring de overlap.ts
 *
 * Response: { success: true, data: { overlaps: ChannelOverlapDoc } }
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

    const overlapData = await ChannelOverlapAnalyzer.analyze(brandId, startDate, endDate);

    // Calcular vendas assistidas
    const assistedSales = ChannelOverlapAnalyzer.calculateAssistedSales(overlapData.overlaps);

    return createApiSuccess({ overlaps: overlapData, assistedSales });
  } catch (error: unknown) {
    console.error('[Attribution Overlap] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error', { code: 'INTERNAL_ERROR' });
  }
}
