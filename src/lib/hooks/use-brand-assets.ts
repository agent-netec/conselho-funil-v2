'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { BrandAsset } from '@/types/database';

/**
 * Hook para monitorar assets de uma marca em tempo real.
 * 
 * @param brandId - O ID da marca para buscar os assets.
 * @returns { assets: BrandAsset[], isLoading: boolean }
 */
export function useBrandAssets(brandId: string | undefined) {
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!brandId) {
      setAssets([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const q = query(
      collection(db, 'brand_assets'),
      where('brandId', '==', brandId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const assetsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BrandAsset[];
      
      // Sort in memory (ST-11.6: Index Resilience INC-004)
      assetsData.sort((a, b) => {
        const dateA = (a.createdAt as any)?.seconds || 0;
        const dateB = (b.createdAt as any)?.seconds || 0;
        return dateB - dateA;
      });

      setAssets(assetsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Erro ao buscar assets:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [brandId]);

  return { assets, isLoading };
}






