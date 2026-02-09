import { useCallback, useEffect, useState } from 'react';
import type { AudienceForecast, ChurnBatchResult, LTVBatchResult } from '@/types/predictive';

interface UsePredictiveDataReturn {
  churn: ChurnBatchResult | null;
  ltv: LTVBatchResult | null;
  forecast: AudienceForecast | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function usePredictiveData(brandId: string | null): UsePredictiveDataReturn {
  const [churn, setChurn] = useState<ChurnBatchResult | null>(null);
  const [ltv, setLtv] = useState<LTVBatchResult | null>(null);
  const [forecast, setForecast] = useState<AudienceForecast | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!brandId) return;
    setIsLoading(true);
    setError(null);
    try {
      const body = JSON.stringify({ brandId });
      const headers = { 'Content-Type': 'application/json' };
      const [churnRes, ltvRes, forecastRes] = await Promise.all([
        fetch('/api/intelligence/predictive/churn', { method: 'POST', headers, body }),
        fetch('/api/intelligence/predictive/ltv', { method: 'POST', headers, body }),
        fetch('/api/intelligence/predictive/forecast', { method: 'POST', headers, body }),
      ]);

      if (!churnRes.ok || !ltvRes.ok || !forecastRes.ok) {
        throw new Error('Falha ao carregar dados preditivos');
      }

      const [churnPayload, ltvPayload, forecastPayload] = await Promise.all([
        churnRes.json(),
        ltvRes.json(),
        forecastRes.json(),
      ]);

      setChurn((churnPayload?.data ?? churnPayload) as ChurnBatchResult);
      setLtv((ltvPayload?.data ?? ltvPayload) as LTVBatchResult);
      setForecast((forecastPayload?.data ?? forecastPayload) as AudienceForecast);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados preditivos');
    } finally {
      setIsLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 300000);
    return () => clearInterval(interval);
  }, [refresh]);

  return { churn, ltv, forecast, isLoading, error, refresh };
}
