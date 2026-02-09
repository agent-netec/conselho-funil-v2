/**
 * Hook de assets de inteligência — multi-query paralela em 3 collections
 * Sprint 29: S29-FT-01 (DT-05) — NÃO cria collection nova
 * Fontes: audience_scans, autopsies, offers
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { IntelligenceAsset } from '@/types/intelligence';
import type { AudienceScan } from '@/types/personalization';
import type { AutopsyDocument } from '@/types/autopsy';
import type { OfferDocument } from '@/types/offer';

export interface UseIntelligenceAssetsReturn {
  assets: IntelligenceAsset[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// === Mappers: normalizar para IntelligenceAsset ===

function mapScanToAsset(scan: AudienceScan): IntelligenceAsset {
  return {
    id: scan.id,
    brandId: scan.brandId,
    type: 'audience_scan',
    name: scan.name,
    summary: `${scan.propensity.segment.toUpperCase()} — ${scan.metadata.leadCount} leads`,
    status: 'ready',
    score: scan.propensity.score,
    createdAt: scan.metadata.createdAt,
    sourceId: scan.id,
  };
}

function mapAutopsyToAsset(doc: AutopsyDocument): IntelligenceAsset {
  let hostName: string;
  try {
    hostName = new URL(doc.url).hostname;
  } catch {
    hostName = doc.url;
  }
  return {
    id: doc.id,
    brandId: doc.brandId,
    type: 'autopsy',
    name: `Autopsia: ${hostName}`,
    summary: doc.result?.summary || 'Análise em andamento',
    status: doc.status === 'completed' ? 'ready' : doc.status === 'error' ? 'error' : 'processing',
    score: doc.result?.score,
    createdAt: doc.createdAt,
    sourceId: doc.id,
  };
}

function mapOfferToAsset(doc: OfferDocument): IntelligenceAsset {
  return {
    id: doc.id,
    brandId: doc.brandId,
    type: 'offer',
    name: doc.name,
    summary: `Score: ${doc.scoring.total}/10`,
    status: 'ready',
    score: doc.scoring.total,
    createdAt: doc.createdAt,
    sourceId: doc.id,
  };
}

// === Query helpers ===

const MAX_RESULTS = 20;

async function getAudienceScans(brandId: string): Promise<AudienceScan[]> {
  try {
    const q = query(
      collection(db, 'brands', brandId, 'audience_scans'),
      orderBy('metadata.createdAt', 'desc'),
      limit(MAX_RESULTS)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AudienceScan));
  } catch (err) {
    console.warn('[IntelligenceAssets] Error fetching audience_scans:', err);
    return [];
  }
}

async function getAutopsies(brandId: string): Promise<AutopsyDocument[]> {
  try {
    const q = query(
      collection(db, 'brands', brandId, 'autopsies'),
      orderBy('createdAt', 'desc'),
      limit(MAX_RESULTS)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AutopsyDocument));
  } catch (err) {
    console.warn('[IntelligenceAssets] Error fetching autopsies:', err);
    return [];
  }
}

async function getOffers(brandId: string): Promise<OfferDocument[]> {
  try {
    const q = query(
      collection(db, 'brands', brandId, 'offers'),
      orderBy('createdAt', 'desc'),
      limit(MAX_RESULTS)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as OfferDocument));
  } catch (err) {
    console.warn('[IntelligenceAssets] Error fetching offers:', err);
    return [];
  }
}

// === Hook principal ===

export function useIntelligenceAssets(brandId: string): UseIntelligenceAssetsReturn {
  const [assets, setAssets] = useState<IntelligenceAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssets = useCallback(async () => {
    if (!brandId) {
      setAssets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Multi-query paralela em 3 collections (DT-05)
      const [scans, autopsies, offers] = await Promise.all([
        getAudienceScans(brandId),
        getAutopsies(brandId),
        getOffers(brandId),
      ]);

      // Normalizar e unificar
      const normalized: IntelligenceAsset[] = [
        ...scans.map(mapScanToAsset),
        ...autopsies.map(mapAutopsyToAsset),
        ...offers.map(mapOfferToAsset),
      ].sort((a, b) => {
        const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
        return bTime - aTime;
      });

      setAssets(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar assets de inteligência';
      setError(message);
      console.error('[IntelligenceAssets] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return { assets, loading, error, refetch: fetchAssets };
}
