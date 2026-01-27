import { useState, useEffect } from 'react';
import { 
  queryIntelligence, 
  getBrandKeywordsConfig 
} from '@/lib/firebase/intelligence';
import { 
  IntelligenceDocument, 
  IntelligenceQueryFilter,
  KeywordIntelligence
} from '@/types/intelligence';
import { useActiveBrand } from './use-active-brand';

/**
 * Hook para buscar dados de inteligência (mentions, keywords, etc) do Firestore.
 */
export function useIntelligenceData(filters?: Partial<IntelligenceQueryFilter>) {
  const { activeBrand } = useActiveBrand();
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
 */
export function useKeywordIntelligence() {
  const { activeBrand } = useActiveBrand();
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<KeywordIntelligence[]>([]);

  useEffect(() => {
    if (!activeBrand?.id) return;

    async function fetchKeywords() {
      setLoading(true);
      try {
        const result = await queryIntelligence({
          brandId: activeBrand!.id,
          types: ['keyword'],
          limit: 50,
        });
        
        const kws = result.documents
          .filter(doc => doc.content.keywordData)
          .map(doc => doc.content.keywordData!);
          
        setKeywords(kws);
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
  const { activeBrand } = useActiveBrand();
  
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
      const date = doc.collectedAt.toDate().toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
      if (!volumeMap[date]) {
        volumeMap[date] = { date, twitter: 0, reddit: 0, total: 0 };
      }
      
      if (doc.source.platform === 'twitter') volumeMap[date].twitter++;
      if (doc.source.platform === 'reddit') volumeMap[date].reddit++;
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
    stats.sentimentScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

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
