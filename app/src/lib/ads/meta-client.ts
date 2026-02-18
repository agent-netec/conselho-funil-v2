/**
 * Meta Ads Marketing API client.
 * Fetches campaign/adset insights (spend, impressions, clicks, conversions).
 * Sprint S-4.
 */

const META_GRAPH_API = 'https://graph.facebook.com/v21.0';

export interface MetaAdInsight {
  campaignId: string;
  campaignName: string;
  adsetId?: string;
  adsetName?: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  cpc: number;
  cpm: number;
  ctr: number;
  dateStart: string;
  dateStop: string;
}

export interface MetaAdsConfig {
  adAccountId: string;
  accessToken: string;
}

export interface MetaAdsResult {
  insights: MetaAdInsight[];
  tokenExpired: boolean;
  error?: string;
}

/**
 * Fetch campaign insights for the last 7 days.
 */
export async function fetchMetaAdsInsights(config: MetaAdsConfig): Promise<MetaAdsResult> {
  const { adAccountId, accessToken } = config;

  if (!adAccountId || !accessToken) {
    return { insights: [], tokenExpired: false, error: 'Missing adAccountId or accessToken' };
  }

  // Ensure ad account ID format
  const accountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

  try {
    const url = new URL(`${META_GRAPH_API}/${accountId}/insights`);
    url.searchParams.set('access_token', accessToken);
    url.searchParams.set('level', 'campaign');
    url.searchParams.set('fields', 'campaign_id,campaign_name,spend,impressions,clicks,conversions,cpc,cpm,ctr,date_start,date_stop');
    url.searchParams.set('date_preset', 'last_7d');
    url.searchParams.set('time_increment', '1');
    url.searchParams.set('limit', '500');

    const response = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      const errorCode = (errorBody as any)?.error?.code;
      const errorMessage = (errorBody as any)?.error?.message || 'Unknown Meta API error';

      // Token expired — code 190
      if (errorCode === 190) {
        return { insights: [], tokenExpired: true, error: 'Access token expired' };
      }

      // Permission error — code 200
      if (errorCode === 200) {
        return { insights: [], tokenExpired: false, error: 'Insufficient permissions (need ads_read + read_insights)' };
      }

      return { insights: [], tokenExpired: false, error: `Meta API error: ${errorMessage}` };
    }

    const data = await response.json();
    const rawInsights = (data as any)?.data || [];

    const insights: MetaAdInsight[] = rawInsights.map((item: any) => ({
      campaignId: item.campaign_id || '',
      campaignName: item.campaign_name || '',
      spend: parseFloat(item.spend || '0'),
      impressions: parseInt(item.impressions || '0', 10),
      clicks: parseInt(item.clicks || '0', 10),
      conversions: parseActions(item.conversions),
      cpc: parseFloat(item.cpc || '0'),
      cpm: parseFloat(item.cpm || '0'),
      ctr: parseFloat(item.ctr || '0'),
      dateStart: item.date_start || '',
      dateStop: item.date_stop || '',
    }));

    return { insights, tokenExpired: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error';
    return { insights: [], tokenExpired: false, error: `Fetch failed: ${message}` };
  }
}

function parseActions(conversions: any): number {
  if (!conversions) return 0;
  if (typeof conversions === 'number') return conversions;
  // Meta returns actions as array of { action_type, value }
  if (Array.isArray(conversions)) {
    const purchase = conversions.find((a: any) => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase');
    return parseInt(purchase?.value || '0', 10);
  }
  return 0;
}
