/**
 * @fileoverview Tipos para o Social Command Center (Social Inbox & Response Engine)
 * @module types/social-inbox
 * @version 1.0.0
 */

import type { SocialPlatform as _SocialPlatform } from './social-platform';
export type SocialPlatform = _SocialPlatform;
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
    sentimentScore: number; // 0.0 a 1.0 (conforme ST-17.1)
    sentimentLabel: 'positive' | 'neutral' | 'negative';
    requires_human_review: boolean; // Flag para sentimento < 0.3
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
