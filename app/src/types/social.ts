/**
 * @fileoverview Tipos oficiais para o Social Command Center (Social Interaction & Ingestion)
 * @module types/social
 * @version 1.0.0
 * @see _netecmt/contracts/social-api-spec.md
 */

export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'whatsapp';
export type SocialInteractionType = 'dm' | 'comment';

export interface SocialInteraction {
  id: string;
  platform: SocialPlatform;
  type: SocialInteractionType;
  externalId: string;      // ID original na plataforma
  author: {
    id: string;
    username: string;
    isFollower: boolean;
    sentiment?: number;    // Calculado na ingestão (0.0 a 1.0)
  };
  content: {
    text: string;
    mediaUrl?: string;
    timestamp: string;
  };
  context?: {
    postId?: string;       // Se for comentário
    threadId?: string;     // Se for DM
  };
  // Flag de controle para o Gate de Sentimento (< 0.3)
  requires_human_review: boolean;
}

export interface SocialResponse {
  interactionId: string;
  rawResponse: string;      // Resposta pura do RAG
  translatedResponse: string; // Resposta após Brand Voice Translator
  metadata: {
    toneMatch: number;      // 0.0 a 1.0
    safetyCheck: boolean;
    counselorId: string;    // Especialista que orientou a resposta
  };
}

/**
 * Contrato para o Brand Voice Translator (ST-17.2)
 * @see _netecmt/contracts/brand-voice-spec.md
 */
export interface VoiceGuidelines {
  tone: string;             // ex: "Sarcástico mas prestativo"
  forbiddenWords: string[]; // ex: ["barato", "promoção"]
  preferredTerms: Record<string, string>; // ex: {"cliente": "membro"}
  formatting: {
    useEmojis: boolean;
    paragraphStyle: 'short' | 'dense';
  };
}

export interface TranslationInput {
  content: string;
  guidelines: VoiceGuidelines;
  platformContext?: string; // ex: "Instagram DM" (ajusta brevidade)
}

export interface TranslationResult {
  translatedText: string;
  metrics: {
    toneMatch: number;      // 0.0 a 1.0
    latencyMs: number;
    forbiddenWordsRemoved: string[];
  };
}
