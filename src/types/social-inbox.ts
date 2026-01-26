/**
 * @fileoverview Tipos para o Social Command Center (Social Inbox & Response Engine)
 * @module types/social-inbox
 * @version 1.0.0
 */

export type SocialPlatform = 'x' | 'linkedin' | 'instagram';
export type InteractionType = 'comment' | 'dm' | 'mention';
export type InteractionStatus = 'pending' | 'read' | 'archived' | 'responded';

/**
 * Interface unificada para comentários e DMs de diferentes redes.
 */
export interface SocialInteraction {
  id: string;
  externalId: string; // ID na rede social
  platform: SocialPlatform;
  type: InteractionType;
  status: InteractionStatus;
  author: {
    id: string;
    handle: string;
    name: string;
    avatarUrl?: string;
    isFollower: boolean;
  };
  content: {
    text: string;
    mediaUrls?: string[];
    timestamp: string;
  };
  metadata: {
    sentimentScore: number; // -1 a 1
    sentimentLabel: 'positive' | 'neutral' | 'negative';
    tags: string[]; // ex: "lead", "support", "spam"
    priority: number; // 0 a 10
  };
  threadId?: string; // Para agrupar conversas
}

/**
 * Contrato para o motor de tradução de voz da marca.
 */
export interface BrandVoiceSuggestion {
  id: string;
  interactionId: string;
  options: Array<{
    text: string;
    tone: string; // ex: "professional", "witty", "empathetic"
    goal: string; // ex: "convert", "thank", "defuse"
    confidence: number;
  }>;
  contextUsed: {
    brandKitVersion: string;
    historyDepth: number;
  };
}
