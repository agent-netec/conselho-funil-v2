'use client';

import { useState, useEffect } from 'react';
import {
  queryIntelligence,
  getBrandKeywordsConfig,
  getSavedBrandKeywords
} from '@/lib/firebase/intelligence';
import {
  IntelligenceDocument,
  IntelligenceQueryFilter,
  KeywordIntelligence,
  SearchIntent
} from '@/types/intelligence';
import { useActiveBrand } from './use-active-brand';

/**
 * Hook para buscar dados de inteligência (mentions, keywords, etc) do Firestore.
 */
export function useIntelligenceData(filters?: Partial<IntelligenceQueryFilter>) {
  const activeBrand = useActiveBrand();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<IntelligenceDocument[]>([]);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!activeBrand?.id) return;

    async function fetchData() {
      setLoading(true);
      try {
        const result = await queryIntelligence({
          brandId: activeBrand!.id,
          ...filters,
        });
        setDocuments(result.documents);
      } catch (err: any) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [activeBrand?.id, JSON.stringify(filters)]);

  return { documents, loading, error };
}

/**
 * Hook específico para buscar keywords mineradas e calculadas.
 * Lê de DUAS fontes: brands/{id}/keywords (salvas pelo usuário) +
 * brands/{id}/intelligence type:keyword (mineradas pelo Miner).
 * Deduplica por term (case-insensitive), priorizando a versão salva.
 */
export function useKeywordIntelligence() {
  const activeBrand = useActiveBrand();
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<KeywordIntelligence[]>([]);

  useEffect(() => {
    if (!activeBrand?.id) return;

    async function fetchKeywords() {
      setLoading(true);
      try {
        // Fetch from both collections in parallel
        const [savedResult, intelligenceResult] = await Promise.allSettled([
          getSavedBrandKeywords(activeBrand!.id, 100),
          queryIntelligence({
            brandId: activeBrand!.id,
            types: ['keyword'],
            limit: 50,
          }),
        ]);

        const seen = new Set<string>();
        const merged: KeywordIntelligence[] = [];

        // 1. Keywords salvas pelo usuário (brands/{id}/keywords) — prioridade
        if (savedResult.status === 'fulfilled') {
          for (const kw of savedResult.value) {
            const key = kw.term.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push({
              term: kw.term,
              intent: (kw.intent as SearchIntent) || 'informational',
              metrics: {
                volume: kw.volume ?? 0,
                difficulty: kw.difficulty ?? 0,
                opportunityScore: kw.opportunityScore ?? 0,
              },
              relatedTerms: [],
              suggestedBy: 'manual',
              suggestion: kw.suggestion,
            });
          }
        }

        // 2. Keywords da collection intelligence (mineradas pelo Miner)
        if (intelligenceResult.status === 'fulfilled') {
          const docs = intelligenceResult.value.documents
            .filter(doc => doc.content.keywordData)
            .map(doc => doc.content.keywordData!);
          for (const kw of docs) {
            const key = kw.term.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            merged.push(kw);
          }
        }

        // Sort by opportunity score
        merged.sort((a, b) => (b.metrics.opportunityScore ?? 0) - (a.metrics.opportunityScore ?? 0));
        setKeywords(merged);
      } catch (err) {
        console.error('Error fetching keywords:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchKeywords();
  }, [activeBrand?.id]);

  return { keywords, loading };
}

/**
 * Hook para extrair estatísticas de volume social e sentimentos.
 */
export function useIntelligenceStats() {
  const { documents, loading } = useIntelligenceData({ limit: 100 });
  const activeBrand = useActiveBrand();
  
  const stats = {
    socialVolume: [] as any[],
    emotions: {
      joy: 0,
      anger: 0,
      sadness: 0,
      surprise: 0,
      fear: 0,
      neutral: 0
    } as Record<string, number>,
    sentimentScore: 0,
    fullStats: null as any
  };

  if (!loading && documents.length > 0) {
    const volumeMap: Record<string, any> = {};
    const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };
    
    documents.forEach(doc => {
      // Handle both Timestamp objects and plain objects with seconds field
      const ts = doc.collectedAt;
      const dateObj = ts && typeof ts.toDate === 'function' ? ts.toDate()
        : ts && (ts as any).seconds ? new Date((ts as any).seconds * 1000)
        : new Date();
      const date = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!volumeMap[date]) {
        volumeMap[date] = { date, twitter: 0, reddit: 0, total: 0 };
      }
      
      if (doc.source.platform === 'twitter') volumeMap[date].twitter++;
      else if (doc.source.platform === 'reddit') volumeMap[date].reddit++;
      else if (doc.source.platform === 'google_news') {
        // Count news as a separate source but group into total
        if (!volumeMap[date].news) volumeMap[date].news = 0;
        volumeMap[date].news++;
      }
      volumeMap[date].total++;

      if (doc.analysis) {
        sentimentCounts[doc.analysis.sentiment]++;
        
        if ((doc.analysis as any).emotion) {
          const emotion = (doc.analysis as any).emotion;
          const emotionMap: Record<string, string> = {
            'alegria': 'joy',
            'raiva': 'anger',
            'tristeza': 'sadness',
            'surpresa': 'surprise',
            'medo': 'fear',
            'neutro': 'neutral'
          };
          const key = emotionMap[emotion] || 'neutral';
          stats.emotions[key]++;
        }
      }
    });

    stats.socialVolume = Object.values(volumeMap).reverse().slice(0, 7);
    
    const scores = documents.filter(d => d.analysis).map(d => d.analysis!.sentimentScore);
    // Raw average is -1 to 1; normalize to 0-10 for display
    const rawAvg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    stats.sentimentScore = Math.round(((rawAvg + 1) / 2) * 10 * 10) / 10; // 0-10 with 1 decimal

    stats.fullStats = {
      brandId: activeBrand?.id || '',
      totalMentions: documents.length,
      byType: {} as any,
      bySentiment: sentimentCounts,
      averageSentimentScore: stats.sentimentScore,
      topKeywords: []
    };
  }

  return { stats, loading };
}
