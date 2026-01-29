'use client';

import { useState, useEffect } from 'react';
import { getCampaign, getBrand } from '@/lib/firebase/firestore';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CampaignContext } from '@/types/campaign';
import type { Brand, BrandAsset } from '@/types/database';

export function useCampaignData(campaignId: string | undefined) {
  const [campaign, setCampaign] = useState<CampaignContext | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // 1. Carregar Campanha
        const campaignData = await getCampaign(campaignId);
        if (!campaignData) throw new Error('Campanha não encontrada');
        setCampaign(campaignData);

        // 2. Carregar Marca (Eixo Estratégico)
        if (campaignData.brandId) {
          const brandData = await getBrand(campaignData.brandId);
          setBrand(brandData);
        }

        // 3. Carregar Ativos Vinculados (Galeria e Copy)
        const q = query(
          collection(db, 'brand_assets'),
          where('metadata.campaignId', '==', campaignId)
        );
        const snapshot = await getDocs(q);
        const assetsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrandAsset));
        setAssets(assetsData);

      } catch (err: any) {
        console.error('Error loading campaign data:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [campaignId]);

  const isCongruent = assets.length > 0 && assets.every(a => (a.metadata as any)?.campaignId === campaignId);

  return { campaign, brand, assets, isCongruent, isLoading, error };
}
