/**
 * Hook de assets de inteligência — multi-query paralela em 4 collections
 * Fontes: audience_scans, autopsies, offers, intelligence (keywords)
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, query, orderBy, limit, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { IntelligenceAsset, IntelligenceDocument, KeywordIntelligence } from '@/types/intelligence';
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

const INTENT_LABELS: Record<string, string> = {
  transactional: 'Compra',
  commercial: 'Comparação',
  informational: 'Informativa',
  navigational: 'Navegação',
};

function mapKeywordGroupToAsset(brandId: string, docs: IntelligenceDocument[]): IntelligenceAsset | null {
  if (docs.length === 0) return null;

  // Group keywords by seed term (approximate: use first collected batch)
  const keywords = docs
    .map(d => (d.content as any)?.keywordData as KeywordIntelligence | undefined)
    .filter((kw): kw is KeywordIntelligence => !!kw);

  if (keywords.length === 0) return null;

  // Build summary with intent distribution
  const intentCounts: Record<string, number> = {};
  let totalScore = 0;
  for (const kw of keywords) {
    intentCounts[kw.intent] = (intentCounts[kw.intent] || 0) + 1;
    totalScore += kw.metrics?.opportunityScore ?? 0;
  }
  const avgScore = Math.round(totalScore / keywords.length);

  const intentSummary = Object.entries(intentCounts)
    .map(([intent, count]) => `${INTENT_LABELS[intent] || intent}: ${count}`)
    .join(' | ');

  const topTerms = keywords.slice(0, 5).map(kw => kw.term).join(', ');

  return {
    id: `kw-group-${docs[0].id}`,
    brandId,
    type: 'spy_dossier', // Reuse spy_dossier type for keywords display
    name: `Keywords Mineradas (${keywords.length} termos)`,
    summary: `${intentSummary}\nTop: ${topTerms}`,
    status: 'ready',
    score: avgScore,
    createdAt: docs[0].collectedAt || Timestamp.now(),
    sourceId: docs[0].id,
    metadata: {
      totalKeywords: keywords.length,
      avgOpportunityScore: avgScore,
      intentDistribution: intentCounts,
      topKeywords: keywords.slice(0, 10).map(kw => ({
        term: kw.term,
        intent: kw.intent,
        score: kw.metrics?.opportunityScore,
      })),
    },
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

async function getKeywordDocs(brandId: string): Promise<IntelligenceDocument[]> {
  try {
    const q = query(
      collection(db, 'brands', brandId, 'intelligence'),
      where('type', '==', 'keyword'),
      orderBy('collectedAt', 'desc'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as IntelligenceDocument));
  } catch (err) {
    console.warn('[IntelligenceAssets] Error fetching keywords:', err);
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
      // Multi-query paralela em 4 collections
      const [scans, autopsies, offers, keywordDocs] = await Promise.all([
        getAudienceScans(brandId),
        getAutopsies(brandId),
        getOffers(brandId),
        getKeywordDocs(brandId),
      ]);

      // Normalizar e unificar
      const normalized: IntelligenceAsset[] = [
        ...scans.map(mapScanToAsset),
        ...autopsies.map(mapAutopsyToAsset),
        ...offers.map(mapOfferToAsset),
      ];

      // Add keyword group as a single asset card (if keywords exist)
      const keywordAsset = mapKeywordGroupToAsset(brandId, keywordDocs);
      if (keywordAsset) {
        normalized.push(keywordAsset);
      }

      normalized.sort((a, b) => {
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
