import { CrossChannelMetricDoc, ChannelOverlapDoc } from '../../types/cross-channel';
import { OptimizationInsight } from '../../types/automation';
import { Timestamp } from 'firebase/firestore';
import { ChannelOverlapAnalyzer } from '../intelligence/attribution/overlap';

/**
 * @class BudgetOptimizerEngine
 * @description Motor de Recomendação para otimização global de orçamento (ST-28.4).
 * Cruza dados de performance direta com vendas assistidas para sugerir realocações.
 */
export class BudgetOptimizerEngine {
  /**
   * Gera insights de otimização baseados no mix de canais e overlap
   */
  public static async generateInsights(
    metrics: CrossChannelMetricDoc,
    overlap: ChannelOverlapDoc
  ): Promise<OptimizationInsight[]> {
    const insights: OptimizationInsight[] = [];
    const assistedSales = ChannelOverlapAnalyzer.calculateAssistedSales(overlap.overlaps);
    
    const platforms = Object.keys(metrics.channels) as (keyof typeof metrics.channels)[];

    platforms.forEach(platform => {
      const channelData = metrics.channels[platform];
      if (!channelData) return;

      const directConversions = channelData.metrics.conversions || 0;
      const directSpend = channelData.metrics.spend || 0;
      const assistedCount = assistedSales[this.normalizePlatformName(platform)] || 0;
      
      // Cálculo de Eficiência Combinada
      const totalAttributedConversions = directConversions + assistedCount;
      const blendedCpa = totalAttributedConversions > 0 ? directSpend / totalAttributedConversions : 0;
      const directCpa = directConversions > 0 ? directSpend / directConversions : 0;

      // 1. Identificar canais que assistem muito (Top of Funnel Champions)
      const assistanceRatio = totalAttributedConversions > 0 ? assistedCount / totalAttributedConversions : 0;
      
      if (assistanceRatio > 0.3 && blendedCpa < metrics.totals.blendedCpa) {
        insights.push({
          id: `opt_${platform}_assistance_${Date.now()}`,
          type: 'channel_scale',
          platform,
          reasoning: `${platform} é um motor crítico de assistência, sendo responsável por ${Math.round(assistanceRatio * 100)}% das suas conversões totais. Seu CPA Combinado (${blendedCpa.toFixed(2)}) está abaixo da média global.`,
          impact: {
            suggestedChange: 0.15,
            expectedProfitIncrease: channelData.metrics.revenue * 0.1
          },
          confidence: 0.85,
          createdAt: Timestamp.now()
        });
      }

      // 2. Identificar canais com ROI Direto alto mas baixo share de spend
      const roi = channelData.metrics.roas || 0;
      if (roi > metrics.totals.blendedRoas * 1.2 && channelData.shareOfSpend < 0.25) {
        insights.push({
          id: `opt_${platform}_roi_${Date.now()}`,
          type: 'budget_reallocation',
          platform,
          reasoning: `${platform} apresenta um ROI (${roi.toFixed(2)}) 20% superior à média, mas detém apenas ${Math.round(channelData.shareOfSpend * 100)}% do orçamento total. Recomendamos realocação.`,
          impact: {
            suggestedChange: 0.20,
            expectedProfitIncrease: channelData.metrics.revenue * 0.15
          },
          confidence: 0.92,
          createdAt: Timestamp.now()
        });
      }
    });

    return insights;
  }

  private static normalizePlatformName(platform: string): string {
    const p = platform.toLowerCase();
    if (p.includes('meta')) return 'Meta';
    if (p.includes('google')) return 'Google';
    if (p.includes('tiktok')) return 'TikTok';
    return platform;
  }
}
