import crypto from 'crypto';
import { JourneyLead } from '../../../types/journey';

/**
 * @fileoverview CAPI Sync Engine (ST-25.4)
 * Implementa a sincronização de conversões offline com Meta e Google Ads.
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
  private readonly MAX_RETRIES = 3;

  /**
   * Dispara o evento de conversão para as plataformas configuradas.
   */
  public async syncOfflineConversion(payload: CAPIPayload, lead: JourneyLead): Promise<{ success: boolean; platform: string; error?: string }[]> {
    const results = [];

    // 1. Preparar dados PII (Hashing SHA256)
    const userData = this.prepareUserData(lead);

    // 2. Disparar para Meta CAPI
    const metaResult = await this.sendToMetaCAPI(payload, userData);
    results.push({ platform: 'Meta', ...metaResult });

    // 3. TODO: Disparar para Google Ads Offline Conversions
    // results.push({ platform: 'Google', success: true });

    return results;
  }

  /**
   * Envia a conversão para a Conversions API da Meta.
   */
  private async sendToMetaCAPI(payload: CAPIPayload, userData: any) {
    const metaPayload = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'system',
        external_id: payload.transactionId, // Deduplicação
        user_data: userData,
        custom_data: {
          value: payload.value,
          currency: payload.currency,
          event_source: payload.eventSource
        }
      }]
    };

    return this.executeWithRetry(async () => {
      // Nota: Em produção, usaríamos as variáveis de ambiente para ACCESS_TOKEN e PIXEL_ID
      const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
      const pixelId = process.env.META_CAPI_PIXEL_ID;

      if (!accessToken || !pixelId) {
        throw new Error('Configurações da Meta CAPI ausentes.');
      }

      const response = await fetch(`https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${accessToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaPayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Meta CAPI Error: ${errorData.error?.message || response.statusText}`);
      }

      return { success: true };
    });
  }

  /**
   * Prepara os dados do usuário com hashing SHA256 obrigatório.
   */
  private prepareUserData(lead: JourneyLead) {
    // Nota: O lead.pii pode estar criptografado no Firestore (AES). 
    // Aqui assumimos que os dados já foram descriptografados pela camada de serviço/repository.
    return {
      em: lead.pii.email ? [this.sha256(lead.pii.email.toLowerCase().trim())] : [],
      ph: lead.pii.phone ? [this.sha256(lead.pii.phone.replace(/\D/g, ''))] : [],
      // fbc e fbp são essenciais para atribuição precisa
      fbc: lead.attribution?.adId || null, // Simplificação: adId pode conter fbc
      // fbp: lead.session?.fbp || null
    };
  }

  /**
   * Gera hash SHA256.
   */
  private sha256(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Lógica de retentativa para erros transientes (5xx).
   */
  private async executeWithRetry<T>(fn: () => Promise<T>, retries = this.MAX_RETRIES): Promise<T | { success: false; error: string }> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0) {
        console.warn(`[CAPI] Erro detectado. Tentando novamente... (${retries} restantes). Erro: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (this.MAX_RETRIES - retries + 1)));
        return this.executeWithRetry(fn, retries - 1);
      }
      console.error(`[CAPI] Falha definitiva após ${this.MAX_RETRIES} tentativas:`, error.message);
      return { success: false, error: error.message };
    }
  }
}
