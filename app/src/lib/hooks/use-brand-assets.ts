'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuthStore } from '@/lib/stores/auth-store';
import type { BrandAsset } from '@/types/database';

/**
 * Hook para buscar assets de uma marca.
 * Uses getDocs with retry instead of onSnapshot — onSnapshot listeners
 * permanently die on permission-denied (no auto-retry after auth race condition).
 */
export function useBrandAssets(brandId: string | undefined) {
  const { user } = useAuthStore();
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAssets = useCallback(async (retries = 0) => {
    if (!brandId || !user) {
      setAssets([]);
      setIsLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'brand_assets'),
        where('brandId', '==', brandId),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BrandAsset[];

      assetsData.sort((a, b) => {
        const dateA = (a.createdAt as any)?.seconds || 0;
        const dateB = (b.createdAt as any)?.seconds || 0;
        return dateB - dateA;
      });

      setAssets(assetsData);
      setIsLoading(false);
    } catch (error: any) {
      if (error?.code === 'permission-denied' && retries < 4) {
        const delay = 300 * Math.pow(2, retries);
        setTimeout(() => fetchAssets(retries + 1), delay);
      } else {
        console.warn('[useBrandAssets] Could not load assets:', error?.message);
        setAssets([]);
        setIsLoading(false);
      }
    }
  }, [brandId, user?.uid]);

  useEffect(() => {
    setIsLoading(true);
    fetchAssets(0);
  }, [fetchAssets]);

  return { assets, isLoading, refresh: () => fetchAssets(0) };
}
