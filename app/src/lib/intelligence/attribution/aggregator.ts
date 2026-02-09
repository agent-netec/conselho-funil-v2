import { db } from '../config';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  doc,
  setDoc,
  orderBy
} from 'firebase/firestore';
import { AttributionBridgeService } from './bridge';
import { PerformanceMetricDoc, AdPlatform, UnifiedAdsMetrics } from '../../../types/performance';
import { CrossChannelMetricDoc } from '../../../types/cross-channel';
import { adaptToPerformanceMetricDoc } from './adapters/metric-adapter';

/** Extended metrics including clicks/impressions used by legacy aggregation logic */
type ExtendedMetrics = UnifiedAdsMetrics & { clicks: number; impressions: number; cpa: number };

/**
 * @class CrossChannelAggregator
 * @description Job de consolidação que une dados de performance das plataformas
 * com os dados de atribuição real da Attribution Bridge.
 */
export class CrossChannelAggregator {
  private static METRICS_COLLECTION = 'performance_metrics';
  private static CROSS_CHANNEL_COLLECTION = 'cross_channel_metrics';

  /**
   * Executa a consolidação para uma marca em um período
   */
  public static async aggregate(brandId: string, startDate: Date, endDate: Date): Promise<CrossChannelMetricDoc> {
    const startTs = Timestamp.fromDate(startDate);
    const endTs = Timestamp.fromDate(endDate);

    // 1. Buscar métricas brutas de todas as plataformas no período
    // Collection: brands/{brandId}/performance_metrics
    const metricsRef = collection(db, 'brands', brandId, this.METRICS_COLLECTION);
    const q = query(
      metricsRef,
      where('timestamp', '>=', startTs),
      where('timestamp', '<=', endTs)
    );

    const metricSnaps = await getDocs(q);
    const rawMetrics = metricSnaps.docs.map(d => adaptToPerformanceMetricDoc(d.data() as Record<string, unknown>));

    // 2. Agrupar métricas por plataforma
    const platformTotals: Record<AdPlatform, ExtendedMetrics> = {
      meta: this.emptyMetrics(),
      google: this.emptyMetrics(),
      tiktok: this.emptyMetrics(),
      organic: this.emptyMetrics(),
      aggregated: this.emptyMetrics()
    };

    rawMetrics.forEach(m => {
      const totals = platformTotals[m.platform];
      totals.spend += m.metrics.spend;
      totals.clicks += m.metrics.clicks;
      totals.impressions += m.metrics.impressions;
      // Nota: Conversões aqui são as reportadas pela plataforma (Last Click deles)
      totals.conversions += m.metrics.conversions;
    });

    // 3. Calcular Totais Globais (Blended)
    const globalTotals: ExtendedMetrics & { blendedRoas: number; blendedCpa: number } = {
      ...this.emptyMetrics(),
      blendedRoas: 0,
      blendedCpa: 0
    };

    (Object.keys(platformTotals) as AdPlatform[]).forEach(platform => {
      const m = platformTotals[platform];
      globalTotals.spend += m.spend;
      globalTotals.clicks += m.clicks;
      globalTotals.impressions += m.impressions;
      globalTotals.conversions += m.conversions;
    });

    // 4. Calcular Médias e ROAS Blended
    if (globalTotals.spend > 0) {
      globalTotals.cpc = globalTotals.spend / globalTotals.clicks;
      globalTotals.ctr = (globalTotals.clicks / globalTotals.impressions) * 100;
      // Aqui assumimos que cada conversão tem um valor médio para o ROAS simulado
      // Em produção, usaríamos o revenue real das transações
      const simulatedRevenue = globalTotals.conversions * 10000; // 100.00 por conv
      globalTotals.blendedRoas = simulatedRevenue / globalTotals.spend;
      globalTotals.blendedCpa = globalTotals.spend / globalTotals.conversions;
    }

    // 5. Montar o documento final
    const channels: CrossChannelMetricDoc['channels'] = {};
    (Object.keys(platformTotals) as AdPlatform[]).forEach(platform => {
      const m = platformTotals[platform];
      if (m.spend > 0 || m.conversions > 0) {
        channels[platform] = {
          metrics: m,
          shareOfSpend: (m.spend / globalTotals.spend) * 100,
          shareOfConversions: (m.conversions / globalTotals.conversions) * 100
        };
      }
    });

    const result: CrossChannelMetricDoc = {
      id: `ccm_${brandId}_${startDate.toISOString().split('T')[0]}`,
      brandId,
      period: {
        start: startTs,
        end: endTs,
        type: 'daily'
      },
      totals: globalTotals,
      channels,
      updatedAt: Timestamp.now()
    };

    // 6. Persistir na subcoleção da marca
    const crossChannelRef = doc(db, 'brands', brandId, this.CROSS_CHANNEL_COLLECTION, result.id);
    await setDoc(crossChannelRef, result);

    return result;
  }

  private static emptyMetrics(): ExtendedMetrics {
    return {
      spend: 0,
      revenue: 0,
      clicks: 0,
      impressions: 0,
      conversions: 0,
      ctr: 0,
      cpc: 0,
      cac: 0,
      cpa: 0,
      roas: 0
    };
  }
}
