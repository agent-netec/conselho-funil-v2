'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveBrand } from './use-active-brand';
import { CrossChannelMetricDoc } from '@/types/cross-channel';
import { OptimizationInsight } from '@/types/automation';
import { Timestamp } from 'firebase/firestore';

interface UseCrossChannelMetricsReturn {
  metrics: CrossChannelMetricDoc | null;
  insights: OptimizationInsight[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

/**
 * Hook para buscar métricas cross-channel consolidadas.
 * Consome /api/intelligence/attribution/stats e gera insights rule-based.
 * Sprint G — G1: Substituir MOCK_METRICS por dados reais.
 */
export function useCrossChannelMetrics(days: number = 30): UseCrossChannelMetricsReturn {
  const activeBrand = useActiveBrand();
  const brandId = activeBrand?.id ?? null;

  const [metrics, setMetrics] = useState<CrossChannelMetricDoc | null>(null);
  const [insights, setInsights] = useState<OptimizationInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  useEffect(() => {
    if (!brandId) {
      setLoading(false);
      setMetrics(null);
      setInsights([]);
      return;
    }

    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/intelligence/attribution/stats?brandId=${brandId}&days=${days}`);
        if (!res.ok) {
          throw new Error(`Erro ao buscar métricas cross-channel (${res.status})`);
        }

        const json = await res.json();
        const stats: CrossChannelMetricDoc = json.data?.stats ?? json.data;

        if (cancelled) return;

        setMetrics(stats);
        setInsights(generateInsights(stats));
      } catch (err: unknown) {
        if (cancelled) return;
        console.error('[useCrossChannelMetrics] Error:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        setMetrics(null);
        setInsights([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, [brandId, days, refreshKey]);

  return { metrics, insights, loading, error, refresh };
}

/**
 * Gera insights rule-based a partir das métricas cross-channel.
 * Regras simples: identifica canal com melhor ROAS para escalar,
 * e canais com CPA alto para realocação de budget.
 */
function generateInsights(stats: CrossChannelMetricDoc): OptimizationInsight[] {
  const insights: OptimizationInsight[] = [];
  const channels = stats.channels;

  if (!channels || Object.keys(channels).length === 0) return insights;

  // Collect channel data with ROAS calculation
  const channelEntries = Object.entries(channels)
    .filter(([platform]) => platform !== 'organic' && platform !== 'aggregated')
    .map(([platform, data]) => {
      const m = data!.metrics;
      const roas = m.spend > 0 && m.conversions > 0
        ? (m.conversions * 10000) / m.spend // estimated revenue per conversion
        : 0;
      return { platform, metrics: m, share: data!, roas };
    })
    .filter(c => c.metrics.spend > 0);

  if (channelEntries.length === 0) return insights;

  // Sort by ROAS descending
  channelEntries.sort((a, b) => b.roas - a.roas);

  const blendedCpa = stats.totals.blendedCpa || 0;

  // Insight 1: Best ROAS channel — suggest scaling
  const best = channelEntries[0];
  if (best && best.roas > 0) {
    const bestCpa = best.metrics.spend > 0 && best.metrics.conversions > 0
      ? best.metrics.spend / best.metrics.conversions
      : 0;
    const cpaAdvantage = blendedCpa > 0 ? Math.round((1 - bestCpa / blendedCpa) * 100) : 0;

    insights.push({
      id: `ins_scale_${best.platform}`,
      type: 'channel_scale',
      platform: best.platform,
      reasoning: `O ${best.platform.charAt(0).toUpperCase() + best.platform.slice(1)} apresenta o melhor ROAS entre os canais ativos${cpaAdvantage > 0 ? ` com CPA ${cpaAdvantage}% abaixo da média blended` : ''}. Há potencial para escalar o orçamento neste canal.`,
      impact: {
        suggestedChange: 0.20,
        expectedProfitIncrease: Math.round(best.metrics.spend * 0.20 * best.roas),
      },
      confidence: Math.min(0.95, 0.7 + (best.metrics.conversions / 1000)),
      createdAt: Timestamp.now(),
    });
  }

  // Insight 2: Worst performing channel — suggest reallocation
  if (channelEntries.length >= 2) {
    const worst = channelEntries[channelEntries.length - 1];
    const worstCpa = worst.metrics.spend > 0 && worst.metrics.conversions > 0
      ? worst.metrics.spend / worst.metrics.conversions
      : Infinity;

    if (worstCpa > blendedCpa && blendedCpa > 0) {
      const cpaExcess = Math.round((worstCpa / blendedCpa - 1) * 100);
      insights.push({
        id: `ins_realloc_${worst.platform}`,
        type: 'budget_reallocation',
        platform: worst.platform,
        reasoning: `O CPA no ${worst.platform.charAt(0).toUpperCase() + worst.platform.slice(1)} está ${cpaExcess}% acima da média blended. Recomendamos realocar parte do budget para canais com melhor performance.`,
        impact: {
          suggestedChange: -0.15,
          expectedProfitIncrease: Math.round(worst.metrics.spend * 0.15 * (best?.roas || 1)),
        },
        confidence: Math.min(0.92, 0.6 + (worst.metrics.conversions / 500)),
        createdAt: Timestamp.now(),
      });
    }
  }

  return insights;
}
