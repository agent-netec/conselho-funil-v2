import { AdsPlatformAdapter, RawAdsData, AdCredentials, isGoogleCredentials } from './base-adapter';
import { AdPlatform } from '../../../types/performance';
import { fetchWithRetry } from '../../integrations/ads/api-helpers';
import { GOOGLE_ADS_API } from '../../integrations/ads/constants';
import { getServiceAccountToken } from '../../integrations/ads/google-service-account';

/**
 * @fileoverview GoogleMetricsAdapter (S30-GOOG-01)
 * Busca métricas reais via Google Ads API v18 searchStream com GAQL.
 * Renomeado de GoogleAdsAdapter (DT-02) para evitar collision com automation adapter.
 */

export class GoogleMetricsAdapter extends AdsPlatformAdapter {
  platform: AdPlatform = 'google';

  /**
   * Busca métricas de campanhas via Google Ads API v18 searchStream.
   * Endpoint: POST /customers/{customerId}/googleAds:searchStream
   * Usa GAQL para selecionar campos: campaign.id, campaign.name, metrics.*
   * Converte cost_micros → reais (/ 1_000_000).
   */
  async fetchMetrics(credentials: AdCredentials, period: { start: Date; end: Date }): Promise<RawAdsData[]> {
    if (!isGoogleCredentials(credentials)) {
      throw new Error('GoogleMetricsAdapter requires Google credentials');
    }

    const startDate = period.start.toISOString().split('T')[0];
    const endDate = period.end.toISOString().split('T')[0];

    const gaqlQuery = [
      'SELECT campaign.id, campaign.name,',
      'metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions',
      'FROM campaign',
      `WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`,
    ].join(' ');

    const url = `${GOOGLE_ADS_API.BASE_URL}/customers/${credentials.customerId}/googleAds:searchStream`;

    // Use OAuth token if present, otherwise fall back to platform service account
    const accessToken = credentials.accessToken || await getServiceAccountToken();

    console.log(`[GoogleMetricsAdapter] Fetching metrics for customer=${credentials.customerId} period=${startDate}..${endDate} method=${credentials.accessToken ? 'oauth' : 'service_account'}`);

    const response = await fetchWithRetry(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': credentials.developerToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: gaqlQuery }),
    }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || response.statusText;
      throw new Error(`Google Ads API Error (${response.status}): ${errorMsg}`);
    }

    const data = await response.json();

    // searchStream retorna array de batchs, cada batch contém results[]
    const allResults = flatMapGoogleResults(data);

    console.log(`[GoogleMetricsAdapter] Received ${allResults.length} campaign results`);

    return allResults;
  }
}

/**
 * Flatten dos resultados do searchStream (que pode conter múltiplos batches)
 * e mapeia cada row para o formato RawAdsData.
 *
 * Estrutura Google searchStream:
 * [{results: [{campaign: {id, name}, metrics: {cost_micros, clicks, impressions, conversions}}]}]
 */
function flatMapGoogleResults(data: any): RawAdsData[] {
  // data pode ser um array de batches ou um objeto com results direto
  const batches = Array.isArray(data) ? data : [data];

  return batches.flatMap((batch: any) => {
    const results = batch?.results || [];
    return results.map((row: any) => mapGoogleRowToRawAds(row));
  });
}

/**
 * Converte uma row GAQL para o formato RawAdsData.
 * cost_micros é dividido por 1_000_000 para obter o valor real em moeda.
 */
function mapGoogleRowToRawAds(row: any): RawAdsData {
  const campaign = row?.campaign || {};
  const metrics = row?.metrics || {};

  const costMicros = parseInt(metrics.costMicros || metrics.cost_micros || '0', 10);

  return {
    platform: 'google',
    externalId: campaign.id || '',
    name: campaign.name || '',
    spend: costMicros / 1_000_000,
    clicks: parseInt(metrics.clicks || '0', 10),
    impressions: parseInt(metrics.impressions || '0', 10),
    conversions: parseFloat(metrics.conversions || '0'),
  };
}
