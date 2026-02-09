import { MonaraTokenVault } from '../../firebase/vault';
import { AdsActionResponse } from './types';
import { fetchWithRetry, sanitizeForLog } from '../../integrations/ads/api-helpers';
import { META_API } from '../../integrations/ads/constants';
import { createHash } from 'crypto';

/**
 * @fileoverview Meta Ads Adapter (S30-META-02/03)
 * Conecta o Maestro à Meta Ads API para gestão de anúncios e audiências.
 * Chamadas reais ao Graph API v21.0 (não mais mocks).
 */

export interface MetaCreative {
  headline: string;
  body: string;
  image_url?: string;
}

export class MetaAdsAdapter {
  private brandId: string;
  private adAccountId?: string;

  constructor(brandId: string, adAccountId?: string) {
    this.brandId = brandId;
    this.adAccountId = adAccountId;
  }

  /**
   * Obtém access token válido do vault (PA-03: tokens vêm do vault, não de parâmetro).
   */
  private async getAccessToken(): Promise<string> {
    const token = await MonaraTokenVault.getValidToken(this.brandId, 'meta');
    return token.accessToken;
  }

  /**
   * S30-META-02: Atualiza criativo de um anúncio via Graph API real.
   * Endpoint: POST /{adId} com creative fields.
   * CP-02: Reimplementado com error handling completo (não é "descomentar").
   */
  async updateAdCreative(adId: string, creative: MetaCreative): Promise<AdsActionResponse> {
    try {
      const token = await this.getAccessToken();
      const url = `${META_API.BASE_URL}/${adId}`;

      console.log(`[MetaAdsAdapter] Updating creative for ad=${adId} brand=${this.brandId}`);

      const body: Record<string, any> = {};
      if (creative.headline) body.name = creative.headline;
      if (creative.body) body.creative = { body: creative.body };
      if (creative.image_url) {
        body.creative = { ...body.creative, image_url: creative.image_url };
      }

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, { timeoutMs: META_API.TIMEOUT_MS });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;
        const isRetryable = response.status >= 500 || response.status === 429;

        return {
          success: false,
          externalId: adId,
          platform: 'meta',
          actionTaken: 'update_creative',
          error: {
            code: `META_API_${response.status}`,
            message: errorMsg,
            retryable: isRetryable,
          },
        };
      }

      const result = await response.json();
      console.log(`[MetaAdsAdapter] Creative updated for ad=${adId}: success=${result.success !== false}`);

      return {
        success: true,
        externalId: adId,
        platform: 'meta',
        actionTaken: 'update_creative',
        details: { updatedFields: Object.keys(body) },
      };
    } catch (error: any) {
      console.error(`[MetaAdsAdapter] updateAdCreative error for ad=${adId}:`, error.message);
      return {
        success: false,
        externalId: adId,
        platform: 'meta',
        actionTaken: 'update_creative',
        error: {
          code: 'META_UPDATE_ERROR',
          message: error.message,
          retryable: true,
        },
      };
    }
  }

  /**
   * S30-META-03: Sincroniza Custom Audience com dados SHA256 via Graph API.
   * Endpoint: POST /{audienceId}/users com schema EMAIL + dados hashados.
   * LGPD compliance: emails são hashados com SHA256 antes do envio.
   */
  async syncCustomAudience(audienceId: string, leadIds: string[]): Promise<AdsActionResponse> {
    try {
      const token = await this.getAccessToken();
      const url = `${META_API.BASE_URL}/${audienceId}/users`;

      // SHA256 hash dos lead IDs (tratando como emails para Custom Audience)
      const hashedData = leadIds.map(id => [hashSHA256(id.toLowerCase().trim())]);

      console.log(`[MetaAdsAdapter] Syncing ${leadIds.length} leads to audience=${audienceId} brand=${this.brandId}`);

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payload: {
            schema: ['EMAIL'],
            data: hashedData,
          },
        }),
      }, { timeoutMs: META_API.TIMEOUT_MS });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;

        return {
          success: false,
          externalId: audienceId,
          platform: 'meta',
          actionTaken: 'sync_audience',
          error: {
            code: `META_API_${response.status}`,
            message: errorMsg,
            retryable: response.status >= 500 || response.status === 429,
          },
        };
      }

      const result = await response.json();
      const audienceSize = result.num_received || leadIds.length;

      console.log(`[MetaAdsAdapter] Audience sync complete: audience=${audienceId} size=${audienceSize}`);

      return {
        success: true,
        externalId: audienceId,
        platform: 'meta',
        actionTaken: 'sync_audience',
        details: { audienceSize, leadsProcessed: leadIds.length },
      };
    } catch (error: any) {
      console.error(`[MetaAdsAdapter] syncCustomAudience error:`, error.message);
      return {
        success: false,
        externalId: audienceId,
        platform: 'meta',
        actionTaken: 'sync_audience',
        error: {
          code: 'META_AUDIENCE_ERROR',
          message: error.message,
          retryable: true,
        },
      };
    }
  }
}

/**
 * Gera hash SHA256 de uma string (LGPD compliance para Custom Audiences).
 */
function hashSHA256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
