export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { PerformanceMetric, UnifiedAdsMetrics } from '@/types/performance';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import { MetaMetricsAdapter } from '@/lib/performance/adapters/meta-adapter';
import { GoogleMetricsAdapter } from '@/lib/performance/adapters/google-adapter';
import { ensureFreshToken, tokenToCredentials } from '@/lib/integrations/ads/token-refresh';
import { CACHE_TTL_MS } from '@/lib/integrations/ads/constants';
import { db } from '@/lib/firebase/config';

/**
 * GET /api/performance/metrics
 * Retorna métricas agregadas para o dashboard.
 * Query Params: brandId, startDate, endDate, period, mock?
 *
 * S30-PERF-01: Fetch real de métricas Meta + Google com cache Firestore 15min.
 * P-08: mock=true continua funcionando para dev.
 * DT-12: Hybrid cache strategy para evitar rate limit abuse.
 */
async function handleGET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const mock = searchParams.get('mock') === 'true';
    const period = (searchParams.get('period') || 'daily') as 'hourly' | 'daily' | 'weekly';

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
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

    // S30-PERF-01: Fetch real com hybrid cache
    const today = new Date().toISOString().split('T')[0];
    const startDate = searchParams.get('startDate') || getDefaultStartDate();
    const endDate = searchParams.get('endDate') || today;

    // 1. Check cache (DT-12: 15min TTL)
    const cacheRef = doc(db, 'brands', brandId, 'performance_cache', today);
    const cacheSnap = await getDoc(cacheRef);

    if (cacheSnap.exists()) {
      const cacheData = cacheSnap.data();
      const updatedAt = cacheData?.updatedAt?.toDate?.() || new Date(0);
      const cacheAge = Date.now() - updatedAt.getTime();

      if (cacheAge < CACHE_TTL_MS) {
        console.log(`[PerfMetrics] Cache hit for brand=${brandId} (age=${Math.round(cacheAge / 1000)}s)`);
        return createApiSuccess({ metrics: cacheData.metrics, cached: true });
      }
    }

    // 2. Fetch real via adapters
    try {
      const metrics = await fetchRealMetrics(brandId, { start: new Date(startDate), end: new Date(endDate) }, period);

      // 3. Persist cache fire-and-forget (P-06)
      persistCache(cacheRef, metrics).catch(err =>
        console.warn(`[PerfMetrics] Cache persist failed:`, err.message)
      );

      return createApiSuccess({ metrics, cached: false });
    } catch (fetchError: any) {
      console.error(`[PerfMetrics] Real fetch failed for brand=${brandId}:`, fetchError.message);

      // P-05: Graceful degradation — retornar cache stale + warning (não 500)
      if (cacheSnap.exists()) {
        const cacheData = cacheSnap.data();
        console.log(`[PerfMetrics] Returning stale cache for brand=${brandId}`);
        return createApiSuccess({
          metrics: cacheData?.metrics || [],
          cached: true,
          warning: 'Dados podem estar desatualizados. APIs externas temporariamente indisponíveis.',
        });
      }

      // Nenhum cache disponível — retornar 502 Bad Gateway (falha externa)
      return createApiError(502, 'APIs externas indisponíveis e sem cache disponível.', {
        details: fetchError.message,
      });
    }

  } catch (error) {
    console.error('[API Performance Metrics] Erro:', error);
    return createApiError(500, 'Erro interno ao buscar métricas.');
  }
}

/**
 * Busca métricas reais de Meta + Google em paralelo.
 */
async function fetchRealMetrics(
  brandId: string,
  periodRange: { start: Date; end: Date },
  period: 'hourly' | 'daily' | 'weekly'
): Promise<PerformanceMetric[]> {
  const metaAdapter = new MetaMetricsAdapter();
  const googleAdapter = new GoogleMetricsAdapter();
  const now = Timestamp.now();

  // Obter tokens e converter para credentials
  const [metaToken, googleToken] = await Promise.all([
    ensureFreshToken(brandId, 'meta').catch(err => {
      console.warn(`[PerfMetrics] Meta token unavailable:`, err.message);
      return null;
    }),
    ensureFreshToken(brandId, 'google').catch(err => {
      console.warn(`[PerfMetrics] Google token unavailable:`, err.message);
      return null;
    }),
  ]);

  // Fetch em paralelo (apenas plataformas com token válido)
  const fetchPromises: Promise<{ source: 'meta' | 'google'; data: import('@/lib/performance/adapters/base-adapter').RawAdsData[] }>[] = [];

  if (metaToken) {
    const metaCreds = tokenToCredentials(metaToken);
    fetchPromises.push(
      metaAdapter.fetchMetrics(metaCreds, periodRange)
        .then(data => ({ source: 'meta' as const, data }))
        .catch(err => {
          console.warn(`[PerfMetrics] Meta fetch failed:`, err.message);
          return { source: 'meta' as const, data: [] };
        })
    );
  }

  if (googleToken) {
    const googleCreds = tokenToCredentials(googleToken);
    fetchPromises.push(
      googleAdapter.fetchMetrics(googleCreds, periodRange)
        .then(data => ({ source: 'google' as const, data }))
        .catch(err => {
          console.warn(`[PerfMetrics] Google fetch failed:`, err.message);
          return { source: 'google' as const, data: [] };
        })
    );
  }

  if (fetchPromises.length === 0) {
    throw new Error('No platform tokens available for real metrics fetch');
  }

  const results = await Promise.all(fetchPromises);
  const metrics: PerformanceMetric[] = [];

  // Aggregate totals para "aggregated" source
  const aggregated: UnifiedAdsMetrics = {
    spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0,
    ctr: 0, cpc: 0, cac: 0, cpa: 0, roas: 0,
  };

  for (const { source, data } of results) {
    for (const raw of data) {
      const normalized = source === 'meta'
        ? metaAdapter.normalize(raw)
        : googleAdapter.normalize(raw);

      metrics.push({
        id: `metric_${brandId}_${source}_${raw.externalId}`,
        brandId,
        source,
        timestamp: now,
        period,
        data: normalized,
      });

      // Acumular para aggregated
      aggregated.spend += normalized.spend;
      aggregated.clicks += normalized.clicks;
      aggregated.impressions += normalized.impressions;
      aggregated.conversions += normalized.conversions;
    }
  }

  // Calcular métricas derivadas do aggregated
  aggregated.ctr = aggregated.impressions > 0 ? aggregated.clicks / aggregated.impressions : 0;
  aggregated.cpc = aggregated.clicks > 0 ? aggregated.spend / aggregated.clicks : 0;
  aggregated.cpa = aggregated.conversions > 0 ? aggregated.spend / aggregated.conversions : 0;
  aggregated.cac = aggregated.cpa;
  aggregated.roas = aggregated.spend > 0 ? (aggregated.conversions * 100) / aggregated.spend : 0;

  metrics.push({
    id: `metric_${brandId}_aggregated_${Date.now()}`,
    brandId,
    source: 'aggregated',
    timestamp: now,
    period,
    data: aggregated,
  });

  return metrics;
}

/**
 * Persiste métricas no cache Firestore (fire-and-forget).
 */
async function persistCache(cacheRef: any, metrics: PerformanceMetric[]): Promise<void> {
  await setDoc(cacheRef, {
    metrics,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Data de início padrão: 7 dias atrás.
 */
function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
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
