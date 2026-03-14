'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserFunnels, createFunnel, updateFunnel, deleteFunnel } from '@/lib/firebase/firestore';
import type { Funnel, FunnelContext } from '@/types/database';

export function useFunnels() {
  const { user } = useAuthStore();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFunnels = useCallback(async (retries = 0) => {
    if (!user) {
      setFunnels([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUserFunnels(user.uid);
      setFunnels(data);
      setError(null);
      setIsLoading(false);
    } catch (err: any) {
      if (err?.code === 'permission-denied' && retries < 4) {
        setTimeout(() => loadFunnels(retries + 1), 300 * Math.pow(2, retries));
      } else {
        console.error('Error loading funnels:', err);
        setError('Erro ao carregar funis');
        setIsLoading(false);
      }
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsLoading(true);
    loadFunnels(0);
  }, [loadFunnels]);

  const create = async (data: { name: string; context: FunnelContext; brandId?: string }) => {
    if (!user) throw new Error('User not authenticated');

    const funnelId = await createFunnel({
      userId: user.uid,
      name: data.name,
      context: data.context,
      brandId: data.brandId, // Vincula à marca se fornecido
    });

    await loadFunnels(0);
    return funnelId;
  };

  const update = async (funnelId: string, data: Partial<Funnel>) => {
    await updateFunnel(funnelId, data);
    await loadFunnels(0);
  };

  const remove = async (funnelId: string) => {
    await deleteFunnel(funnelId);
    await loadFunnels(0);
  };

  return {
    funnels,
    isLoading,
    error,
    create,
    update,
    remove,
    refresh: () => loadFunnels(0),
  };
}


