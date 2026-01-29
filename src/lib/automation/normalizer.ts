import { Timestamp } from 'firebase/firestore';
import { LeadContext } from '../intelligence/personalization/maestro';

/**
 * @fileoverview Event Normalizer (ST-20.3)
 * Transforma payloads brutos de webhooks em interações padronizadas.
 */

export interface RawWebhookEvent {
  platform: 'meta' | 'instagram' | 'google' | 'stripe';
  brandId: string;
  payload: any;
}

export class EventNormalizer {
  /**
   * Normaliza um evento bruto para o formato de interação do Maestro.
   */
  static normalize(event: RawWebhookEvent): { leadId: string; interaction: LeadContext['lastInteraction'] } {
    const { platform, payload } = event;

    switch (platform) {
      case 'instagram':
        return this.normalizeInstagram(payload);
      case 'meta':
        return this.normalizeMeta(payload);
      default:
        throw new Error(`Plataforma ${platform} não suportada pelo normalizador.`);
    }
  }

  private static normalizeInstagram(payload: any) {
    // Exemplo de payload Instagram: { entry: [{ messaging: [{ sender: { id: '...' }, message: { text: '...' } }] }] }
    const entry = payload.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const comment = entry?.changes?.[0]?.value;

    if (messaging) {
      return {
        leadId: messaging.sender.id,
        interaction: {
          type: 'dm_received' as const,
          platform: 'instagram' as const,
          timestamp: Timestamp.now(),
          metadata: { text: messaging.message?.text }
        }
      };
    }

    if (comment) {
      return {
        leadId: comment.from.id,
        interaction: {
          type: 'comment_made' as const,
          platform: 'instagram' as const,
          timestamp: Timestamp.now(),
          metadata: { text: comment.text, mediaId: comment.media?.id }
        }
      };
    }

    throw new Error('Payload Instagram inválido ou não reconhecido.');
  }

  private static normalizeMeta(payload: any) {
    // Exemplo de payload Meta Ads: { object: 'page', entry: [{ changes: [{ field: 'leadgen', value: { leadgen_id: '...' } }] }] }
    const change = payload.entry?.[0]?.changes?.[0];
    
    if (change?.field === 'leadgen') {
      return {
        leadId: change.value.leadgen_id,
        interaction: {
          type: 'ad_click' as const,
          platform: 'meta' as const,
          timestamp: Timestamp.now(),
          metadata: { formId: change.value.form_id }
        }
      };
    }

    throw new Error('Payload Meta Ads inválido ou não reconhecido.');
  }
}
