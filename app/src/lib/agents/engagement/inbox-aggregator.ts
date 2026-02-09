import { 
  SocialInteraction, 
  SocialPlatform, 
  InteractionType, 
  InteractionStatus 
} from '@/types/social-inbox';
import { ScoutAgent } from '../scout/scout-agent';
import { ScoutSourceConfig } from '@/types/intelligence-agents';
import { collectInstagramInteractions } from '@/lib/integrations/social/instagram-adapter';
import { collectLinkedInInteractions } from '@/lib/integrations/social/linkedin-adapter';

/**
 * @fileoverview InboxAggregator - Responsável por coletar e unificar interações de redes sociais.
 * @module lib/agents/engagement/inbox-aggregator
 * @version 1.1.0
 */

export class InboxAggregator {
  private scout: ScoutAgent;

  constructor() {
    this.scout = new ScoutAgent();
  }

  /**
   * Coleta interações do X (Twitter) via Nitter/RSS usando o ScoutAgent.
   * @param brandId ID da marca
   * @param keyword Termo de busca ou handle
   */
  async collectFromX(brandId: string, keyword: string): Promise<SocialInteraction[]> {
    console.log(`[InboxAggregator] Coletando do X para ${brandId} com keyword ${keyword}`);
    
    const result = await this.scout.collectFromX(brandId, keyword);
    
    if (!result.success || !result.items) {
      console.error(`[InboxAggregator] Erro ao coletar do X:`, result.errors);
      return [];
    }

    return this.unify(result.items, 'x');
  }

  /**
   * Coleta interações do LinkedIn.
   * @param brandId ID da marca
   */
  async collectFromLinkedIn(brandId: string): Promise<SocialInteraction[]> {
    console.log(`[InboxAggregator] Coletando do LinkedIn para ${brandId}`);
    return collectLinkedInInteractions(brandId);
  }

  /**
   * Coleta interações do Instagram.
   * @param brandId ID da marca
   */
  async collectFromInstagram(brandId: string): Promise<SocialInteraction[]> {
    console.log(`[InboxAggregator] Coletando do Instagram para ${brandId}`);
    return collectInstagramInteractions(brandId);
  }

  /**
   * Unifica as interações coletadas no modelo SocialInteraction.
   */
  unify(rawItems: any[], platform: SocialPlatform): SocialInteraction[] {
    return rawItems.map(item => {
      const contentText = item.content?.text || item.content?.title || '';
      
      return {
        id: item.id || Math.random().toString(36).substring(7),
        externalId: item.source?.url || item.id,
        platform,
        type: this.inferType(item),
        status: 'pending',
        author: {
          id: item.source?.author || 'unknown',
          handle: item.source?.author || 'unknown',
          name: item.source?.author || 'Unknown User',
          avatarUrl: undefined,
          isFollower: false, // ScoutAgent não provê essa info via RSS
        },
        content: {
          text: contentText,
          mediaUrls: [],
          timestamp: item.content?.publishedAt?.toString() || new Date().toISOString(),
        },
        metadata: {
          sentimentScore: 0,
          sentimentLabel: 'neutral',
          requires_human_review: false,
          tags: [],
          priority: 0,
        },
        threadId: undefined, // RSS não provê threads nativamente
      };
    });
  }

  private inferType(item: any): InteractionType {
    // No RSS do Nitter, quase tudo é mention ou post público
    return 'mention';
  }
}
