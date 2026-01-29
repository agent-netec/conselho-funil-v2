import { Timestamp } from 'firebase/firestore';
import { AdPlatform, UnifiedAdsMetrics } from './performance';

/**
 * @fileoverview Schema para unificação de métricas Cross-Channel.
 * Suporta a visão holística de performance unificando Meta, Google e TikTok.
 */

/**
 * Representa um snapshot de performance consolidado de múltiplos canais.
 * Collection: brands/{brandId}/cross_channel_metrics
 */
export interface CrossChannelMetricDoc {
  id: string; // Format: `ccm_{brandId}_{periodStart}_{periodEnd}`
  brandId: string;
  period: {
    start: Timestamp;
    end: Timestamp;
    type: 'daily' | 'weekly' | 'monthly';
  };
  
  // Agregado Global
  totals: UnifiedAdsMetrics & {
    blendedRoas: number;
    blendedCpa: number;
  };

  // Quebra por Canal
  channels: {
    [key in AdPlatform]?: {
      metrics: UnifiedAdsMetrics;
      shareOfSpend: number; // % do gasto total
      shareOfConversions: number; // % das conversões totais
    };
  };

  updatedAt: Timestamp;
}

/**
 * Schema para análise de Overlap de Canais (ST-28.3)
 */
export interface ChannelOverlapDoc {
  brandId: string;
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  overlaps: {
    path: string[]; // Ex: ['meta', 'google', 'direct']
    conversions: number;
    revenue: number;
    percentage: number;
  }[];
}
