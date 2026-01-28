import { Timestamp } from 'firebase/firestore';
import { MarketTrend, ICPInsight, SemanticSearchResult } from '@/types/intelligence';
import { createScopedData } from '@/lib/firebase/scoped-data';

/**
 * TrendAgent - Especialista em transformar tendências brutas em insights
 */
export class TrendAgent {
  private readonly TTL_DAYS = 7;
  private readonly BREAKOUT_THRESHOLD = 500; // 500% de crescimento

  /**
   * Processa uma tendência bruta e gera insights se necessário
   */
  async processTrend(brandId: string, trendData: Omit<MarketTrend, 'id' | 'expiresAt'>): Promise<MarketTrend> {
    // ... (existing logic)
  }

  /**
   * Processa resultados semânticos do Exa e os converte em MarketTrends (Fallback do Glimpse)
   */
  async processExaTrends(brandId: string, exaResults: SemanticSearchResult): Promise<MarketTrend[]> {
    const trends: MarketTrend[] = [];

    for (const result of exaResults.results) {
      // O Exa não dá volume numérico, então estimamos baseado no score de relevância
      // Score 0.9+ -> High Volume, Score 0.7+ -> Medium, etc.
      const growth = result.score * 600; // Heurística: escala o score para uma % de crescimento
      
      const trend: Omit<MarketTrend, 'id' | 'expiresAt'> = {
        topic: result.title,
        growthPercentage: Math.round(growth),
        searchVolume: result.score > 0.8 ? 'high' : result.score > 0.5 ? 'medium' : 'low',
        relatedKeywords: result.highlights || [],
        platformSource: 'exa',
        region: 'universal',
        timeRange: '24h',
        capturedAt: Timestamp.now(),
        brandId,
        scope: {
          level: 'brand',
          brandId
        }
      };

      const processed = await this.processTrend(brandId, trend);
      trends.push(processed);
    }

    return trends;
  }

  /**
   * Gera um insight de ICP automaticamente para tendências explosivas
   */
  private async generateBreakoutInsight(brandId: string, trend: MarketTrend) {
    const insightData: Omit<ICPInsight, 'id'> = {
      scope: {
        level: 'brand',
        brandId: brandId
      },
      inheritToChildren: true,
      category: 'trend',
      content: `BREAKOUT TREND: O tópico "${trend.topic}" teve um crescimento de ${trend.growthPercentage}% nas buscas. Palavras relacionadas: ${trend.relatedKeywords.join(', ')}.`,
      frequency: 1,
      sentiment: 0.5, // Neutro para positivo por ser tendência de busca
      sources: [{
        platform: trend.platformSource,
        url: '',
        collectedAt: trend.capturedAt,
        snippet: `Trend detected in ${trend.region} with ${trend.searchVolume} volume.`
      }],
      isApprovedForAI: true,
      relevanceScore: 0.9,
      approvedBy: 'auto',
      approvedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      expiresAt: trend.expiresAt // Segue o mesmo TTL da tendência
    };

    await createScopedData<ICPInsight>(
      'icp_insights',
      brandId,
      insightData,
      { syncToPinecone: true, dataType: 'icp_insight' }
    );
  }
}
