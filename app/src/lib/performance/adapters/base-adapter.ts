import { UnifiedAdsMetrics, AdPlatform } from '../../../types/performance';

export interface RawAdsData {
  platform: AdPlatform;
  externalId: string;
  name: string;
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export abstract class AdsPlatformAdapter {
  abstract platform: AdPlatform;

  /**
   * Normaliza dados brutos da API para o schema unificado
   */
  normalize(raw: RawAdsData): UnifiedAdsMetrics {
    const ctr = raw.impressions > 0 ? raw.clicks / raw.impressions : 0;
    const cpc = raw.clicks > 0 ? raw.spend / raw.clicks : 0;
    const cpa = raw.conversions > 0 ? raw.spend / raw.conversions : 0;
    const roas = raw.spend > 0 ? (raw.conversions * 100) / raw.spend : 0; // Exemplo simplificado de ROAS

    return {
      spend: raw.spend,
      clicks: raw.clicks,
      impressions: raw.impressions,
      conversions: raw.conversions,
      ctr,
      cpc,
      cpa,
      roas,
    };
  }

  /**
   * Método abstrato para buscar dados da API (a ser implementado por cada plataforma)
   */
  abstract fetchMetrics(credentials: any, period: { start: Date; end: Date }): Promise<RawAdsData[]>;
}
