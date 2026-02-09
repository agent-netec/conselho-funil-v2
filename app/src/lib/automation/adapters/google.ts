import { IAdsAdapter, AdsActionResponse } from './types';
import { fetchWithRetry } from '../../integrations/ads/api-helpers';
import { GOOGLE_ADS_API } from '../../integrations/ads/constants';

/**
 * @fileoverview Google Ads Adapter (S30-GOOG-00 a GOOG-04)
 * Conecta o Maestro ao Google Ads API v18 para gestão de campanhas, budgets e status.
 * Todas as chamadas são reais (REST) — zero mocks.
 *
 * DT-07 FIX: Constructor agora aceita 3 params (accessToken, developerToken, customerId).
 */

export class GoogleAdsAdapter implements IAdsAdapter {
  private accessToken: string;
  private developerToken: string;
  private customerId: string;

  /**
   * S30-GOOG-00 (DT-07): Constructor refatorado com accessToken.
   * Sem accessToken nenhuma chamada ao Google Ads API funciona.
   */
  constructor(accessToken: string, developerToken: string, customerId: string) {
    this.accessToken = accessToken;
    this.developerToken = developerToken;
    this.customerId = customerId;
  }

  /**
   * Headers padrão para todas as chamadas ao Google Ads API v18.
   * Inclui Authorization, developer-token e login-customer-id.
   */
  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'developer-token': this.developerToken,
      'login-customer-id': this.customerId,
      'Content-Type': 'application/json',
    };
  }

  /**
   * S30-GOOG-02: Pausa uma campanha via Google Ads API real.
   * Endpoint: POST /customers/{id}/campaigns:mutate
   * Body: operations[].update.status = "PAUSED"
   */
  async pauseAdEntity(entityId: string, type: 'campaign' | 'adset'): Promise<AdsActionResponse> {
    try {
      const resourceName = `customers/${this.customerId}/campaigns/${entityId}`;
      const url = `${GOOGLE_ADS_API.BASE_URL}/customers/${this.customerId}/campaigns:mutate`;

      console.log(`[GoogleAdsAdapter] Pausing ${type} ${entityId} for customer=${this.customerId}`);

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          operations: [{
            update: {
              resourceName,
              status: 'PAUSED',
            },
            updateMask: 'status',
          }],
        }),
      }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;

        return {
          success: false,
          externalId: entityId,
          platform: 'google',
          actionTaken: 'pause',
          error: {
            code: `GOOGLE_API_${response.status}`,
            message: errorMsg,
            retryable: response.status >= 500 || response.status === 429,
          },
        };
      }

      const result = await response.json();
      console.log(`[GoogleAdsAdapter] Campaign ${entityId} paused successfully`);

      return {
        success: true,
        externalId: entityId,
        platform: 'google',
        actionTaken: 'pause',
        details: { resourceName: result?.results?.[0]?.resourceName || resourceName },
      };
    } catch (error: any) {
      console.error(`[GoogleAdsAdapter] pauseAdEntity error:`, error.message);
      return {
        success: false,
        externalId: entityId,
        platform: 'google',
        actionTaken: 'pause',
        error: {
          code: 'GOOGLE_PAUSE_ERROR',
          message: error.message,
          retryable: true,
        },
      };
    }
  }

  /**
   * S30-GOOG-03: Ajusta budget de campanha via Google Ads API real.
   * Endpoint: POST /customers/{id}/campaignBudgets:mutate
   * Converte reais → micros (* 1_000_000)
   */
  async adjustBudget(entityId: string, type: 'campaign' | 'adset', newBudget: number): Promise<AdsActionResponse> {
    try {
      const amountMicros = Math.round(newBudget * 1_000_000).toString();
      const resourceName = `customers/${this.customerId}/campaignBudgets/${entityId}`;
      const url = `${GOOGLE_ADS_API.BASE_URL}/customers/${this.customerId}/campaignBudgets:mutate`;

      console.log(`[GoogleAdsAdapter] Adjusting budget for ${type} ${entityId} to ${newBudget} (${amountMicros} micros)`);

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          operations: [{
            update: {
              resourceName,
              amountMicros,
            },
            updateMask: 'amount_micros',
          }],
        }),
      }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData?.error?.message || response.statusText;

        return {
          success: false,
          externalId: entityId,
          platform: 'google',
          actionTaken: 'adjust_budget',
          error: {
            code: `GOOGLE_API_${response.status}`,
            message: errorMsg,
            retryable: response.status >= 500 || response.status === 429,
          },
        };
      }

      const result = await response.json();
      console.log(`[GoogleAdsAdapter] Budget adjusted for ${entityId}: ${newBudget}`);

      return {
        success: true,
        externalId: entityId,
        platform: 'google',
        actionTaken: 'adjust_budget',
        newValue: newBudget,
        details: { amountMicros, resourceName: result?.results?.[0]?.resourceName || resourceName },
      };
    } catch (error: any) {
      console.error(`[GoogleAdsAdapter] adjustBudget error:`, error.message);
      return {
        success: false,
        externalId: entityId,
        platform: 'google',
        actionTaken: 'adjust_budget',
        error: {
          code: 'GOOGLE_BUDGET_ERROR',
          message: error.message,
          retryable: true,
        },
      };
    }
  }

  /**
   * S30-GOOG-04: Consulta status e budget reais de uma campanha via GAQL.
   * Endpoint: POST /customers/{id}/googleAds:search
   * GAQL: SELECT campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.id = {entityId}
   */
  async getEntityStatus(entityId: string): Promise<{ status: string; currentBudget: number }> {
    try {
      const url = `${GOOGLE_ADS_API.BASE_URL}/customers/${this.customerId}/googleAds:search`;
      const gaqlQuery = `SELECT campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.id = ${entityId}`;

      console.log(`[GoogleAdsAdapter] Getting status for campaign=${entityId} customer=${this.customerId}`);

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ query: gaqlQuery }),
      }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

      if (!response.ok) {
        console.error(`[GoogleAdsAdapter] getEntityStatus failed (${response.status})`);
        return { status: 'UNKNOWN', currentBudget: 0 };
      }

      const data = await response.json();
      const results = data.results || [];

      if (results.length === 0) {
        console.warn(`[GoogleAdsAdapter] No campaign data found for id=${entityId}`);
        return { status: 'NOT_FOUND', currentBudget: 0 };
      }

      const row = results[0];
      const status = row?.campaign?.status || 'UNKNOWN';
      const amountMicros = parseInt(row?.campaignBudget?.amountMicros || '0', 10);
      const currentBudget = amountMicros / 1_000_000;

      console.log(`[GoogleAdsAdapter] Campaign ${entityId}: status=${status} budget=${currentBudget}`);

      return { status, currentBudget };
    } catch (error: any) {
      console.error(`[GoogleAdsAdapter] getEntityStatus error:`, error.message);
      return { status: 'ERROR', currentBudget: 0 };
    }
  }
}
