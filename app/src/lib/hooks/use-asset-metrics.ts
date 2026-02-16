'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveBrand } from './use-active-brand';

export interface AssetMetric {
  id: string;
  namespace: 'visual' | 'knowledge';
  score: number;
  assetType: string;
  strategicAdvice?: string;
  imageUri?: string;
  name?: string;
  url?: string;
  createdAt: string;
  status?: 'uploaded' | 'processing' | 'ready' | 'error';
  processingError?: string;
  metrics: {
    ctr: string;
    conversion: string;
    roi: string;
  };
  metadata: any;
}

export interface MetricsSummary {
  total: number;
  visualCount: number;
  knowledgeCount: number;
  avgVisualScore: string | number;
}

/**
 * Hook para buscar métricas de performance dos ativos vetorizados.
 * ST-11.3 - "Dashboard de Ativos"
 */
export function useAssetMetrics() {
  const activeBrand = useActiveBrand();
  const [assets, setAssets] = useState<AssetMetric[]>([]);
  const [summary, setSummary] = useState<MetricsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!activeBrand?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/assets/metrics?brandId=${activeBrand.id}`);
      
      if (!response.ok) {
        throw new Error('Falha ao carregar métricas do dashboard');
      }

      const json = await response.json();
      const payload = json.data ?? json;
      setAssets(payload.assets || []);
      setSummary(payload.summary || null);
    } catch (err: any) {
      console.error('[useAssetMetrics] Error:', err);
      setError(err.message || 'Erro desconhecido ao carregar métricas');
    } finally {
      setIsLoading(false);
    }
  }, [activeBrand?.id]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    assets,
    summary,
    isLoading,
    error,
    refresh: fetchMetrics,
    activeBrand
  };
}
