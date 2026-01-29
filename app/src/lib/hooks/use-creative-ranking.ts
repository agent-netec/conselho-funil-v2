'use client';

import { useState, useEffect } from 'react';
import { CreativePerformance } from '@/types/creative';

/**
 * Hook para buscar o ranking de criativos.
 * @story ST-26.3
 */
export function useCreativeRanking(brandId: string | undefined) {
  const [ranking, setRanking] = useState<CreativePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!brandId) return;

    const fetchRanking = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/intelligence/creative/ranking?brandId=${brandId}`);
        if (!response.ok) throw new Error('Falha ao carregar ranking');
        const data = await response.json();
        setRanking(data.ranking);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRanking();
  }, [brandId]);

  return { ranking, isLoading, error };
}
