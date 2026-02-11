export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { PerformanceMetric } from '@/types/performance';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import { fetchMetricsWithCache } from '@/lib/performance/fetch-and-cache';

/**
 * GET /api/performance/metrics
 * Retorna métricas agregadas para o dashboard.
 * Query Params: brandId, startDate, endDate, period, mock?
 *
 * S30-PERF-01: Fetch real de métricas Meta + Google com cache Firestore 15min.
 * P-08: mock=true continua funcionando para dev.
 * DT-12: Hybrid cache strategy via shared fetch-and-cache module.
 */
async function handleGET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const mock = searchParams.get('mock') === 'true';
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
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // P-08: mock=true continua funcionando
    if (mock) {
      const metrics = generateMockMetrics(brandId, period);
      return createApiSuccess({ metrics });
    }

    // S30-PERF-01: Fetch real com hybrid cache (shared module)
    const result = await fetchMetricsWithCache(brandId, { period, startDate, endDate });

    if (!result) {
      return createApiError(502, 'APIs externas indisponíveis e sem cache disponível.');
    }

    return createApiSuccess({
      metrics: result.metrics,
      cached: result.cached,
      ...(result.warning ? { warning: result.warning } : {}),
    });

  } catch (error) {
    console.error('[API Performance Metrics] Erro:', error);
    return createApiError(500, 'Erro interno ao buscar métricas.');
  }
}

/**
 * Gera dados randômicos para o dashboard (Victor UI) — mantido para mock=true.
 */
function generateMockMetrics(brandId: string, period: string): PerformanceMetric[] {
  const sources: ('meta' | 'google' | 'organic' | 'aggregated')[] = ['meta', 'google', 'organic', 'aggregated'];
  const results: PerformanceMetric[] = [];
  const now = new Date();

  sources.forEach(source => {
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      const baseValue = source === 'aggregated' ? 2000 : 500;
      const variance = Math.random() * 0.4 + 0.8;

      results.push({
        id: `metric_${brandId}_${source}_${date.getTime()}`,
        brandId,
        source,
        timestamp: Timestamp.fromDate(date),
        period: period as any,
        data: {
          spend: source === 'organic' ? 0 : baseValue * variance,
          revenue: baseValue * 3 * variance,
          roas: source === 'organic' ? 0 : 3 * variance,
          cac: source === 'organic' ? 0 : 15 * variance,
          ctr: 0.02 * variance,
          cpc: 0.8 * variance,
          cpa: source === 'organic' ? 0 : 10 * variance,
          conversions: 50 * variance,
          clicks: Math.round(1200 * variance),
          impressions: Math.round(50000 * variance),
        }
      });
    }
  });

  return results;
}

// S32-RL-02: Rate limit — 60 req/min por brand
const rateLimitedGET = withRateLimit(handleGET, {
  maxRequests: 60,
  windowMs: 60_000,
  scope: 'performance_metrics',
});

export { rateLimitedGET as GET };
