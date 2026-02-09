import { SocialInteraction, SocialPlatform, SocialInteractionType } from '../../../types/social';

/**
 * Normalizador base para interações sociais.
 */
export class SocialIngestionNormalizer {
  /**
   * Aplica o Gate de Sentimento.
   * Interações com sentimento < 0.3 são marcadas para revisão humana.
   */
  static applySentimentGate(interaction: SocialInteraction): SocialInteraction {
    const sentiment = interaction.author.sentiment ?? 0.5; // Default neutro se não houver
    return {
      ...interaction,
      requires_human_review: sentiment < 0.3
    };
  }

  /**
   * Mock de normalização para Instagram.
   */
  static normalizeInstagram(raw: any): SocialInteraction {
    const interaction: SocialInteraction = {
      id: `ig_${raw.id}`,
      platform: 'instagram',
      type: raw.item_type === 'comment' ? 'comment' : 'dm',
      externalId: raw.id,
      author: {
        id: raw.user_id,
        username: raw.username,
        isFollower: raw.is_follower ?? false,
        sentiment: raw.sentiment_score // Mockado para vir do "webhook"
      },
      content: {
        text: raw.text,
        mediaUrl: raw.media_url,
        timestamp: raw.timestamp
      },
      context: {
        postId: raw.post_id,
        threadId: raw.thread_id
      },
      requires_human_review: false // Será definido pelo gate
    };

    return this.applySentimentGate(interaction);
  }

  /**
   * Mock de normalização para WhatsApp.
   */
  static normalizeWhatsApp(raw: any): SocialInteraction {
    const interaction: SocialInteraction = {
      id: `wa_${raw.message_id}`,
      platform: 'whatsapp',
      type: 'dm',
      externalId: raw.message_id,
      author: {
        id: raw.from_number,
        username: raw.contact_name,
        isFollower: true, // WhatsApp geralmente é contato direto
        sentiment: raw.sentiment_score
      },
      content: {
        text: raw.body,
        timestamp: raw.timestamp
      },
      context: {
        threadId: raw.from_number
      },
      requires_human_review: false
    };

    return this.applySentimentGate(interaction);
  }
}
