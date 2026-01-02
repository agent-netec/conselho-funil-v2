'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth-store';
import { getUserBrands, createBrand, updateBrand, deleteBrand, getBrand } from '@/lib/firebase/brands';
import type { Brand } from '@/types/database';

export function useBrands() {
  const { user } = useAuthStore();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBrands = async () => {
    if (!user) {
      setBrands([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await getUserBrands(user.uid);
      setBrands(data);
      setError(null);
    } catch (err) {
      console.error('Error loading brands:', err);
      setError('Erro ao carregar marcas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [user]);

  const create = async (data: Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('User not authenticated');

    const brandId = await createBrand({
      ...data,
      userId: user.uid,
    });

    await loadBrands();
    return brandId;
  };

  const update = async (brandId: string, data: Partial<Omit<Brand, 'id' | 'userId' | 'createdAt'>>) => {
    await updateBrand(brandId, data);
    await loadBrands();
  };

  const remove = async (brandId: string) => {
    await deleteBrand(brandId);
    await loadBrands();
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
    refresh: loadBrands,
  };
}

