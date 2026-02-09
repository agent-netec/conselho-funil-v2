/**
 * Hook useSegmentPerformance
 * Busca breakdown de metricas por segmento (hot/warm/cold).
 * SWR pattern com revalidacao a cada 60s.
 *
 * @story S34-SEG-03
 */

import { useState, useEffect, useCallback } from 'react';
import type { SegmentBreakdownData, TargetSegment } from '@/types/ab-testing';

interface UseSegmentPerformanceReturn {
  breakdown: SegmentBreakdownData | null;
  loading: boolean;
  error: string | null;
  selectedSegment: TargetSegment | 'all';
  setSelectedSegment: (segment: TargetSegment | 'all') => void;
  refresh: () => void;
}

export function useSegmentPerformance(brandId: string | null): UseSegmentPerformanceReturn {
  const [breakdown, setBreakdown] = useState<SegmentBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TargetSegment | 'all'>('all');

  const fetchBreakdown = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);

    try {
      const { getSegmentBreakdown } = await import('@/lib/intelligence/ab-testing/segment-query');
      const data = await getSegmentBreakdown(brandId);
      setBreakdown(data);
    } catch (err) {
      console.error('[useSegmentPerformance] Error:', err);
      setError('Failed to load segment data');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchBreakdown();
    const interval = setInterval(fetchBreakdown, 60_000);
    return () => clearInterval(interval);
  }, [fetchBreakdown]);

  return {
    breakdown,
    loading,
    error,
    selectedSegment,
    setSelectedSegment,
    refresh: fetchBreakdown,
  };
}
