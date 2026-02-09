import crypto from 'crypto';
import { JourneyLead } from '../../../types/journey';
import { MonaraTokenVault, type MetaTokenMetadata, type GoogleTokenMetadata } from '../../firebase/vault';
import { fetchWithRetry } from './api-helpers';
import { META_API, GOOGLE_ADS_API } from './constants';

/**
 * @fileoverview CAPI Sync Engine (S30-CAPI-00, S30-PERF-02)
 * Sincroniza conversões offline com Meta CAPI (v21.0) e Google Ads Offline Conversions.
 *
 * DT-04 BLOCKING fix: Migrado de process.env (single-tenant) para MonaraTokenVault (multi-tenant).
 * DT-15 fix: URL atualizada de v18.0 para v21.0.
 * S30-PERF-02: Adicionado Google Offline Conversions via offlineUserDataJobs.
 *
 * @module lib/integrations/ads/capi-sync
 */

export interface CAPIPayload {
  leadId: string;
  value: number;
  currency: string;
  eventSource: string;
  transactionId: string;
}

export class CAPISyncEngine {
  private brandId: string;

  /**
   * S30-CAPI-00 (DT-04): Constructor agora aceita brandId para multi-tenant.
   */
  constructor(brandId: string) {
    this.brandId = brandId;
  }

  /**
   * Dispara o evento de conversão para as plataformas configuradas.
   * S30-PERF-02: Agora inclui Google Offline Conversions após Meta CAPI.
   */
  public async syncOfflineConversion(payload: CAPIPayload, lead: JourneyLead): Promise<{ success: boolean; platform: string; error?: string }[]> {
    const results = [];

    // 1. Preparar dados PII (Hashing SHA256)
    const userData = this.prepareUserData(lead);

    // 2. Disparar para Meta CAPI
    const metaResult = await this.sendToMetaCAPI(payload, userData);
    results.push({ platform: 'Meta', ...metaResult });

    // 3. Disparar para Google Ads Offline Conversions (S30-PERF-02)
    const googleResult = await this.sendToGoogleOfflineConversions(payload, userData);
    results.push({ platform: 'Google', ...googleResult });

    return results;
  }

  /**
   * Busca credenciais Meta do vault, com fallback para env vars (dev local).
   * DT-04: Vault é primário, env vars são fallback.
   */
  private async getMetaCredentials(): Promise<{ accessToken: string; pixelId: string }> {
    try {
      const token = await MonaraTokenVault.getToken(this.brandId, 'meta');
      if (token) {
        const metadata = token.metadata as MetaTokenMetadata;
        const pixelId = (metadata as any)?.pixelId;
        if (pixelId) {
          return { accessToken: token.accessToken, pixelId };
        }
      }
    } catch (err) {
      console.warn(`[CAPI] Vault lookup failed for brand ${this.brandId}, falling back to env vars`);
    }

    // Fallback para dev local (RC-09)
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    const pixelId = process.env.META_CAPI_PIXEL_ID;

    if (!accessToken || !pixelId) {
      throw new Error(`Meta CAPI credentials not found for brand ${this.brandId} (vault or env)`);
    }

    return { accessToken, pixelId };
  }

  /**
   * Envia a conversão para a Conversions API da Meta.
   * DT-15: URL atualizada para v21.0.
   * DT-04: Credenciais vêm do vault (multi-tenant).
   */
  private async sendToMetaCAPI(payload: CAPIPayload, userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const { accessToken, pixelId } = await this.getMetaCredentials();

      const metaPayload = {
        data: [{
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'system',
          external_id: payload.transactionId,
          user_data: userData,
          custom_data: {
            value: payload.value,
            currency: payload.currency,
            event_source: payload.eventSource,
          },
        }],
      };

      // DT-15: v21.0 (não mais v18.0)
      const url = `${META_API.BASE_URL}/${pixelId}/events`;

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metaPayload),
      }, { timeoutMs: META_API.TIMEOUT_MS });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Meta CAPI Error: ${errorData?.error?.message || response.statusText}`);
      }

      return { success: true };
    } catch (error: any) {
      console.error(`[CAPI] Meta CAPI failed for brand ${this.brandId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * S30-PERF-02: Envia conversão offline para Google Ads via offlineUserDataJobs.
   * Endpoint: POST /customers/{customerId}/offlineUserDataJobs
   * Credenciais Google obtidas do vault (não env vars).
   */
  private async sendToGoogleOfflineConversions(payload: CAPIPayload, userData: any): Promise<{ success: boolean; error?: string }> {
    try {
      const token = await MonaraTokenVault.getToken(this.brandId, 'google');
      if (!token) {
        console.warn(`[CAPI] Google token not found for brand ${this.brandId}, skipping Google Offline`);
        return { success: false, error: 'Google token not configured' };
      }

      const metadata = token.metadata as GoogleTokenMetadata;
      const customerId = metadata?.customerId;
      const developerToken = metadata?.developerToken;

      if (!customerId || !developerToken) {
        console.warn(`[CAPI] Google metadata incomplete for brand ${this.brandId}`);
        return { success: false, error: 'Google metadata incomplete (customerId or developerToken missing)' };
      }

      const url = `${GOOGLE_ADS_API.BASE_URL}/customers/${customerId}/offlineUserDataJobs`;

      const googlePayload = {
        job: {
          type: 'STORE_SALES_UPLOAD_FIRST_PARTY',
          storeSalesMetadata: {
            loyaltyFraction: 1.0,
            transactionUploadFraction: 1.0,
          },
        },
        operations: [{
          create: {
            userIdentifiers: [
              ...(userData.em?.length ? [{ hashedEmail: userData.em[0] }] : []),
              ...(userData.ph?.length ? [{ hashedPhoneNumber: userData.ph[0] }] : []),
            ],
            transactionAttribute: {
              conversionAction: `customers/${customerId}/conversionActions/offline_purchase`,
              currencyCode: payload.currency,
              transactionAmountMicros: Math.round(payload.value * 1_000_000).toString(),
              transactionDateTime: new Date().toISOString().replace('T', ' ').split('.')[0] + '+00:00',
            },
          },
        }],
      };

      const response = await fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googlePayload),
      }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Offline Conversions Error: ${errorData?.error?.message || response.statusText}`);
      }

      console.log(`[CAPI] Google Offline Conversion sent for brand ${this.brandId}`);
      return { success: true };
    } catch (error: any) {
      console.error(`[CAPI] Google Offline Conversions failed for brand ${this.brandId}:`, error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Prepara os dados do usuário com hashing SHA256 obrigatório (LGPD).
   */
  private prepareUserData(lead: JourneyLead) {
    return {
      em: lead.pii.email ? [this.sha256(lead.pii.email.toLowerCase().trim())] : [],
      ph: lead.pii.phone ? [this.sha256(lead.pii.phone.replace(/\D/g, ''))] : [],
      fbc: lead.attribution?.adId || null,
    };
  }

  /**
   * Gera hash SHA256.
   */
  private sha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }
}
