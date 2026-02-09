import { SocialInteraction } from '../../../types/social';
import { SocialIngestionNormalizer } from './normalizer';

/**
 * Mocks de ingestão para simular webhooks de plataformas sociais.
 */
export class SocialIngestionMocks {
  /**
   * Simula a chegada de uma interação do Instagram.
   */
  static simulateInstagramComment(sentiment: number = 0.8): SocialInteraction {
    const raw = {
      id: 'ig_comment_123',
      item_type: 'comment',
      user_id: 'user_ig_456',
      username: 'cliente_feliz',
      text: 'Adorei o novo funil de vendas! Muito intuitivo.',
      timestamp: new Date().toISOString(),
      post_id: 'post_789',
      sentiment_score: sentiment,
      is_follower: true
    };

    return SocialIngestionNormalizer.normalizeInstagram(raw);
  }

  /**
   * Simula uma reclamação no Instagram (Sentimento Baixo).
   */
  static simulateInstagramComplaint(): SocialInteraction {
    const raw = {
      id: 'ig_dm_999',
      item_type: 'dm',
      user_id: 'user_ig_777',
      username: 'cliente_irritado',
      text: 'Meu acesso ao dashboard está bloqueado há 2 dias! Absurdo!',
      timestamp: new Date().toISOString(),
      thread_id: 'thread_abc',
      sentiment_score: 0.1, // Deve ativar o gate
      is_follower: true
    };

    return SocialIngestionNormalizer.normalizeInstagram(raw);
  }

  /**
   * Simula uma mensagem de WhatsApp.
   */
  static simulateWhatsAppMessage(text: string = 'Olá, gostaria de saber mais sobre o plano Enterprise.'): SocialInteraction {
    const raw = {
      message_id: 'wa_msg_001',
      from_number: '5511999999999',
      contact_name: 'João Silva',
      body: text,
      timestamp: new Date().toISOString(),
      sentiment_score: 0.5
    };

    return SocialIngestionNormalizer.normalizeWhatsApp(raw);
  }
}
