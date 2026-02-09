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

// ─── AdCredentials: Discriminated Union (DT-05, S30-PRE-02) ───

/** Credenciais Meta Ads (Graph API v21.0) */
export interface MetaAdCredentials {
  platform: 'meta';
  accessToken: string;
  adAccountId: string;       // act_XXXX
  pixelId?: string;          // Para CAPI
}

/** Credenciais Google Ads (REST API v18) */
export interface GoogleAdCredentials {
  platform: 'google';
  accessToken: string;
  developerToken: string;    // Obrigatório
  customerId: string;        // Obrigatório
  managerAccountId?: string; // MCC (opcional)
}

/** Union discriminada por platform */
export type AdCredentials = MetaAdCredentials | GoogleAdCredentials;

/** Type guard: narrowing para MetaAdCredentials */
export function isMetaCredentials(c: AdCredentials): c is MetaAdCredentials {
  return c.platform === 'meta';
}

/** Type guard: narrowing para GoogleAdCredentials */
export function isGoogleCredentials(c: AdCredentials): c is GoogleAdCredentials {
  return c.platform === 'google';
}

// ─── Adapter Base ───

export abstract class AdsPlatformAdapter {
  abstract platform: AdPlatform;

  /**
   * Normaliza dados brutos da API para o schema unificado
   */
  normalize(raw: RawAdsData): UnifiedAdsMetrics {
    const ctr = raw.impressions > 0 ? raw.clicks / raw.impressions : 0;
    const cpc = raw.clicks > 0 ? raw.spend / raw.clicks : 0;
    const cpa = raw.conversions > 0 ? raw.spend / raw.conversions : 0;
    const roas = raw.spend > 0 ? (raw.conversions * 100) / raw.spend : 0;

    return {
      spend: raw.spend,
      revenue: 0,
      clicks: raw.clicks,
      impressions: raw.impressions,
      conversions: raw.conversions,
      ctr,
      cpc,
      cac: cpa,
      cpa,
      roas,
    };
  }

  /**
   * Método abstrato para buscar dados da API (a ser implementado por cada plataforma)
   */
  abstract fetchMetrics(credentials: AdCredentials, period: { start: Date; end: Date }): Promise<RawAdsData[]>;
}
