export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import { fetchMetricsWithCache } from '@/lib/performance/fetch-and-cache';

/**
 * GET /api/performance/metrics
 * Retorna métricas reais agregadas para o dashboard.
 * Sprint 12: Mock data removido — apenas dados reais do Meta/Google + cache.
 * Query Params: brandId, startDate, endDate, period, fresh?
 *
 * DT-12: Hybrid cache strategy via shared fetch-and-cache module.
 */
async function handleGET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const forceFresh = searchParams.get('fresh') === 'true';
    const period = (searchParams.get('period') || 'daily') as 'hourly' | 'daily' | 'weekly';
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (startDate && !isoDateRegex.test(startDate)) {
      return createApiError(400, 'startDate inválido. Use formato YYYY-MM-DD.');
    }
    if (endDate && !isoDateRegex.test(endDate)) {
      return createApiError(400, 'endDate inválido. Use formato YYYY-MM-DD.');
    }

    try {
      const { effectiveTier } = await requireBrandAccess(req, brandId);
      requireMinTier(effectiveTier, 'agency');
    } catch (error) {
      return handleSecurityError(error);
    }

    const result = await fetchMetricsWithCache(brandId, { forceFresh, period });

    if (!result) {
      return createApiError(502, 'APIs externas indisponíveis e sem cache disponível.');
    }

    return createApiSuccess({
      metrics: result.metrics,
      cached: result.cached,
      ...(result.warning ? { warning: result.warning } : {}),
      ...(result.diagnostic ? { diagnostic: result.diagnostic } : {}),
    });

  } catch (error) {
    console.error('[API Performance Metrics] Erro:', error);
    return createApiError(500, 'Erro interno ao buscar métricas.');
  }
}

// S32-RL-02: Rate limit — 60 req/min por brand
const rateLimitedGET = withRateLimit(handleGET, {
  maxRequests: 60,
  windowMs: 60_000,
  scope: 'performance_metrics',
});

export { rateLimitedGET as GET };
