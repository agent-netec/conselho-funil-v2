'use client';

import { useState, useCallback } from 'react';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { PredictScoreResponse } from '@/types/prediction';
import type { GenerateAdsResponse, AdFormat } from '@/types/creative-ads';
import type { AnalyzeTextResponse, TextInputType, TextInputFormat } from '@/types/text-analysis';

// ═══════════════════════════════════════════════════════
// ESTADOS GENÉRICOS
// ═══════════════════════════════════════════════════════

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

const initialState = <T>(): AsyncState<T> => ({
  data: null,
  loading: false,
  error: null,
});

// ═══════════════════════════════════════════════════════
// HOOK: PREDICT SCORE (CPS)
// ═══════════════════════════════════════════════════════

export function usePredictScore() {
  const [state, setState] = useState<AsyncState<PredictScoreResponse>>(initialState);

  const predict = useCallback(async (params: {
    brandId: string;
    funnelUrl?: string;
    funnelData?: unknown;
    options?: {
      includeRecommendations?: boolean;
      includeBenchmark?: boolean;
    };
  }) => {
    setState({ data: null, loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/predict/score', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: PredictScoreResponse = await res.json();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao calcular predição';
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, predict, reset };
}

// ═══════════════════════════════════════════════════════
// HOOK: GENERATE ADS
// ═══════════════════════════════════════════════════════

export function useGenerateAds() {
  const [state, setState] = useState<AsyncState<GenerateAdsResponse>>(initialState);

  const generate = useCallback(async (params: {
    brandId: string;
    sourceUrl?: string;
    eliteAssets: unknown;
    formats: AdFormat[];
    options?: {
      maxVariations?: number;
      minToneMatch?: number;
    };
  }) => {
    setState({ data: null, loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/creative/generate-ads', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: GenerateAdsResponse = await res.json();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar anúncios';
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, generate, reset };
}

// ═══════════════════════════════════════════════════════
// HOOK: ANALYZE TEXT
// ═══════════════════════════════════════════════════════

export function useAnalyzeText() {
  const [state, setState] = useState<AsyncState<AnalyzeTextResponse>>(initialState);

  const analyze = useCallback(async (params: {
    brandId: string;
    text: string;
    textType: TextInputType;
    format?: TextInputFormat;
    options?: {
      includeScoring?: boolean;
      includeSuggestions?: boolean;
      persistResult?: boolean;
    };
  }) => {
    setState({ data: null, loading: true, error: null });
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/analyze/text', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data: AnalyzeTextResponse = await res.json();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao analisar texto';
      setState({ data: null, loading: false, error: message });
      return null;
    }
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  return { ...state, analyze, reset };
}
