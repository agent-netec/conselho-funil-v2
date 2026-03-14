'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserBrands, createBrand, updateBrand, deleteBrand, getBrand } from '@/lib/firebase/brands';
import type { Brand } from '@/types/database';

export function useBrands() {
  const { user } = useAuthStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = useCallback(async (retries = 0) => {
    if (!user) {
      setBrands([]);
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUserBrands(user.uid);
      setBrands(data);
      setError(null);
      setIsLoading(false);
    } catch (err: any) {
      if (err?.code === 'permission-denied' && retries < 4) {
        setTimeout(() => loadBrands(retries + 1), 300 * Math.pow(2, retries));
      } else {
        console.error('Error loading brands:', err);
        setError('Erro ao carregar marcas');
        setIsLoading(false);
      }
    }
  }, [user?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setIsLoading(true);
    loadBrands(0);
  }, [loadBrands]);

  const create = async (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const brandId = await createBrand({
      ...data,
      userId: user.uid,
    });

    // Don't let loadBrands failure propagate — brand was already created
    loadBrands(0).catch(err => console.warn('[useBrands] loadBrands after create failed:', err));
    return brandId;
  };

  const update = async (brandId: string, data: Partial<Omit<Brand, 'id' | 'userId' | 'createdAt'>>) => {
    await updateBrand(brandId, data);
    loadBrands(0).catch(err => console.warn('[useBrands] loadBrands after update failed:', err));
  };

  const remove = async (brandId: string) => {
    await deleteBrand(brandId);
    await loadBrands(0);
  };

  const getById = async (brandId: string) => {
    return await getBrand(brandId);
  };

  return {
    brands,
    isLoading,
    error,
    create,
    update,
    remove,
    getById,
    refresh: () => loadBrands(0),
  };
}






