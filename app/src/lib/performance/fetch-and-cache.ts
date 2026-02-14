/**
 * Shared Performance Metrics Fetch & Cache Logic
 *
 * Extraído do route handler para ser reutilizado pelo:
 *   - GET /api/performance/metrics (UI dashboard)
 *   - lib/automation/evaluate.ts (cron + manual evaluation)
 *
 * @module lib/performance/fetch-and-cache
 */

import { Timestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { MetaMetricsAdapter } from '@/lib/performance/adapters/meta-adapter';
import { GoogleMetricsAdapter } from '@/lib/performance/adapters/google-adapter';
import { ensureFreshToken, tokenToCredentials } from '@/lib/integrations/ads/token-refresh';
import { CACHE_TTL_MS } from '@/lib/integrations/ads/constants';
import type { PerformanceMetric, UnifiedAdsMetrics } from '@/types/performance';

export interface CacheResult {
  metrics: PerformanceMetric[];
  cached: boolean;
  warning?: string;
}

/**
 * Busca métricas de performance com cache Firestore (DT-12).
 * 1. Se cache fresco (< 15min) → retorna cached
 * 2. Se cache stale → fetch real via adapters, atualiza cache
 * 3. Se fetch falha + cache stale existe → retorna stale com warning
 * 4. Se nada disponível → retorna null
 */
export async function fetchMetricsWithCache(
  brandId: string,
  options?: { forceFresh?: boolean; period?: 'hourly' | 'daily' | 'weekly' }
): Promise<CacheResult | null> {
  const today = new Date().toISOString().split('T')[0];
  const period = options?.period || 'daily';
  const cacheRef = doc(db, 'brands', brandId, 'performance_cache', today);
  const cacheSnap = await getDoc(cacheRef);

  // 1. Check cache freshness
  if (!options?.forceFresh && cacheSnap.exists()) {
    const cacheData = cacheSnap.data();
    const updatedAt = cacheData?.updatedAt?.toDate?.() || new Date(0);
    const cacheAge = Date.now() - updatedAt.getTime();

    if (cacheAge < CACHE_TTL_MS) {
      console.log(`[FetchAndCache] Cache hit for brand=${brandId} (age=${Math.round(cacheAge / 1000)}s)`);
      return { metrics: cacheData.metrics, cached: true };
    }
  }

  // 2. Try real fetch
  try {
    const metrics = await fetchRealMetrics(brandId, period);

    // Persist (fire-and-forget)
    persistCache(cacheRef, metrics).catch(err =>
      console.warn(`[FetchAndCache] Cache persist failed:`, err.message)
    );

    return { metrics, cached: false };
  } catch (fetchError: unknown) {
    const errMsg = fetchError instanceof Error ? fetchError.message : 'Unknown error';
    console.error(`[FetchAndCache] Real fetch failed for brand=${brandId}:`, errMsg);

    // 3. Fallback to stale cache
    if (cacheSnap.exists()) {
      const cacheData = cacheSnap.data();
      console.log(`[FetchAndCache] Returning stale cache for brand=${brandId}`);
      return {
        metrics: cacheData?.metrics || [],
        cached: true,
        warning: 'Dados podem estar desatualizados. APIs externas temporariamente indisponíveis.',
      };
    }

    // 4. Try yesterday's cache as last resort
    const yesterday = new Date(Date.now() - 86400_000).toISOString().split('T')[0];
    const yesterdayCacheRef = doc(db, 'brands', brandId, 'performance_cache', yesterday);
    const yesterdaySnap = await getDoc(yesterdayCacheRef);

    if (yesterdaySnap.exists()) {
      const cacheData = yesterdaySnap.data();
      console.log(`[FetchAndCache] Returning yesterday cache for brand=${brandId}`);
      return {
        metrics: cacheData?.metrics || [],
        cached: true,
        warning: 'Usando métricas de ontem. APIs externas indisponíveis e sem cache de hoje.',
      };
    }

    return null;
  }
}

/**
 * Busca métricas reais de Meta + Google em paralelo.
 * Reutiliza adapters existentes + token refresh.
 */
export async function fetchRealMetrics(
  brandId: string,
  period: 'hourly' | 'daily' | 'weekly' = 'daily'
): Promise<PerformanceMetric[]> {
  const metaAdapter = new MetaMetricsAdapter();
  const googleAdapter = new GoogleMetricsAdapter();
  const now = Timestamp.now();
  const startDate = getDefaultStartDate();
  const endDate = new Date().toISOString().split('T')[0];

  const [metaToken, googleToken] = await Promise.all([
    ensureFreshToken(brandId, 'meta').catch(err => {
      console.warn(`[FetchAndCache] Meta token unavailable:`, err.message);
      return null;
    }),
    ensureFreshToken(brandId, 'google').catch(err => {
      console.warn(`[FetchAndCache] Google token unavailable:`, err.message);
      return null;
    }),
  ]);

  const fetchPromises: Promise<{ source: 'meta' | 'google'; data: import('@/lib/performance/adapters/base-adapter').RawAdsData[] }>[] = [];

  if (metaToken) {
    const metaCreds = tokenToCredentials(metaToken);
    fetchPromises.push(
      metaAdapter.fetchMetrics(metaCreds, { start: new Date(startDate), end: new Date(endDate) })
        .then(data => ({ source: 'meta' as const, data }))
        .catch(err => {
          console.warn(`[FetchAndCache] Meta fetch failed:`, err.message);
          return { source: 'meta' as const, data: [] };
        })
    );
  }

  if (googleToken) {
    const googleCreds = tokenToCredentials(googleToken);
    fetchPromises.push(
      googleAdapter.fetchMetrics(googleCreds, { start: new Date(startDate), end: new Date(endDate) })
        .then(data => ({ source: 'google' as const, data }))
        .catch(err => {
          console.warn(`[FetchAndCache] Google fetch failed:`, err.message);
          return { source: 'google' as const, data: [] };
        })
    );
  }

  if (fetchPromises.length === 0) {
    throw new Error('No platform tokens available for real metrics fetch');
  }

  const results = await Promise.all(fetchPromises);
  const metrics: PerformanceMetric[] = [];

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

      aggregated.spend += normalized.spend;
      aggregated.clicks += normalized.clicks;
      aggregated.impressions += normalized.impressions;
      aggregated.conversions += normalized.conversions;
    }
  }

  // Derived metrics
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

async function persistCache(cacheRef: ReturnType<typeof doc>, metrics: PerformanceMetric[]): Promise<void> {
  await setDoc(cacheRef, {
    metrics,
    updatedAt: Timestamp.now(),
  });
}

function getDefaultStartDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  return d.toISOString().split('T')[0];
}