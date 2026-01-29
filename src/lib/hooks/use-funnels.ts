'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserFunnels, createFunnel, updateFunnel, deleteFunnel } from '@/lib/firebase/firestore';
import type { Funnel, FunnelContext } from '@/types/database';

export function useFunnels() {
  const { user } = useAuthStore();
  const [funnels, setFunnels] = useState<Funnel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFunnels = async () => {
    if (!user) {
      setFunnels([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserFunnels(user.uid);
      setFunnels(data);
      setError(null);
    } catch (err) {
      console.error('Error loading funnels:', err);
      setError('Erro ao carregar funis');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFunnels();
  }, [user]);

  const create = async (data: { name: string; context: FunnelContext; brandId?: string }) => {
    if (!user) throw new Error('User not authenticated');

    const funnelId = await createFunnel({
      userId: user.uid,
      name: data.name,
      context: data.context,
      brandId: data.brandId, // Vincula à marca se fornecido
    });

    await loadFunnels();
    return funnelId;
  };

  const update = async (funnelId: string, data: Partial<Funnel>) => {
    await updateFunnel(funnelId, data);
    await loadFunnels();
  };

  const remove = async (funnelId: string) => {
    await deleteFunnel(funnelId);
    await loadFunnels();
  };

  return {
    funnels,
    isLoading,
    error,
    create,
    update,
    remove,
    refresh: loadFunnels,
  };
}


