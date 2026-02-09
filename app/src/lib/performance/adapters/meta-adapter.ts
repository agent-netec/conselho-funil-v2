import { AdsPlatformAdapter, RawAdsData, AdCredentials, isMetaCredentials } from './base-adapter';
import { AdPlatform } from '../../../types/performance';
import { fetchWithRetry, sanitizeForLog } from '../../integrations/ads/api-helpers';
import { META_API } from '../../integrations/ads/constants';

/**
 * @fileoverview MetaMetricsAdapter (S30-META-01)
 * Busca métricas reais via Meta Graph API v21.0 /act_{adAccountId}/insights.
 * Renomeado de MetaAdsAdapter (DT-02) para evitar collision com automation adapter.
 */

export class MetaMetricsAdapter extends AdsPlatformAdapter {
  platform: AdPlatform = 'meta';

  /**
   * Busca métricas reais do Meta Graph API v21.0.
   * Endpoint: GET /act_{adAccountId}/insights
   * Usa fetchWithRetry (PA-05) e isMetaCredentials para narrowing (DT-05).
   */
  async fetchMetrics(credentials: AdCredentials, period: { start: Date; end: Date }): Promise<RawAdsData[]> {
    if (!isMetaCredentials(credentials)) {
      throw new Error('MetaMetricsAdapter requires Meta credentials');
    }

    const timeRange = JSON.stringify({
      since: period.start.toISOString().split('T')[0],
      until: period.end.toISOString().split('T')[0],
    });

    const fields = 'campaign_id,campaign_name,spend,impressions,clicks,actions,cpc,ctr';
    const adAccountId = credentials.adAccountId.startsWith('act_') 
      ? credentials.adAccountId.replace('act_', '') 
      : credentials.adAccountId;

    const url = `${META_API.BASE_URL}/act_${adAccountId}/insights?fields=${fields}&time_range=${encodeURIComponent(timeRange)}&level=campaign&limit=100`;

    console.log(`[MetaMetricsAdapter] Fetching metrics for adAccount=act_${adAccountId} period=${timeRange}`);

    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${credentials.accessToken}` },
    }, { timeoutMs: META_API.TIMEOUT_MS });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || response.statusText;
      throw new Error(`Meta Graph API Error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();
    const insights = data.data || [];

    console.log(`[MetaMetricsAdapter] Received ${insights.length} campaign insights`);

    return insights.map(mapMetaInsightToRawAds);
  }
}

/**
 * Converte um insight da Graph API para o formato RawAdsData normalizado.
 */
function mapMetaInsightToRawAds(insight: any): RawAdsData {
  // Extrair conversões do array 'actions' (offsite_conversion.fb_pixel_purchase)
  const conversions = (insight.actions || [])
    .filter((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')
    .reduce((sum: number, a: any) => sum + parseInt(a.value || '0', 10), 0);

  return {
    platform: 'meta',
    externalId: insight.campaign_id || '',
    name: insight.campaign_name || '',
    spend: parseFloat(insight.spend || '0'),
    clicks: parseInt(insight.clicks || '0', 10),
    impressions: parseInt(insight.impressions || '0', 10),
    conversions,
  };
}
