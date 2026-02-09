/**
 * @fileoverview Tipos para o módulo Creative Automation Engine
 * @module types/creative-ads
 * @version 1.0.0 — Sprint 25
 * @contract arch-sprint-25-predictive-creative-engine.md § 4 & 6.2
 */

// ═══════════════════════════════════════════════════════
// FORMATOS DE ANÚNCIO
// ═══════════════════════════════════════════════════════

export type AdFormat = 'meta_feed' | 'meta_stories' | 'google_search';

export interface MetaFeedAd {
  type: 'meta_feed';
  headline: string;            // Max 40 chars
  body: string;                // Max 125 chars (primary text)
  description?: string;        // Max 30 chars
  cta: string;                 // Ex: "Saiba Mais", "Comprar Agora"
  imageSuggestion?: string;    // Descrição da imagem sugerida
}

export interface MetaStoriesAd {
  type: 'meta_stories';
  hook: string;                // Texto do hook (3s)
  body: string;                // Texto do body (5s)
  ctaOverlay: string;          // CTA de overlay
  visualDirection?: string;    // Direção visual sugerida
}

export interface GoogleSearchAd {
  type: 'google_search';
  headlines: [string, string, string]; // Exatamente 3, max 30 chars cada
  descriptions: [string, string];      // Exatamente 2, max 90 chars cada
  path?: [string, string?];            // Display path segments
}

export type AdContent = MetaFeedAd | MetaStoriesAd | GoogleSearchAd;

// ═══════════════════════════════════════════════════════
// FRAMEWORKS DE COPYWRITING
// ═══════════════════════════════════════════════════════

export type CopyFramework =
  | 'schwartz'       // Níveis de consciência
  | 'halbert_aida'   // Attention → Interest → Desire → Action
  | 'brunson_story'  // Story → Offer → Close
  | 'cialdini'       // Princípios de persuasão
  | 'ogilvy';        // Copy longo, headline-driven

export type ConsciousnessLevel =
  | 'unaware'         // Nível 1: Não sabe que tem o problema
  | 'problem_aware'   // Nível 2: Sabe do problema, não da solução
  | 'solution_aware'  // Nível 3: Sabe da solução, não do produto
  | 'product_aware'   // Nível 4: Sabe do produto, não convencido
  | 'most_aware';     // Nível 5: Pronto para comprar

// ═══════════════════════════════════════════════════════
// ANÚNCIO GERADO
// ═══════════════════════════════════════════════════════

export interface GeneratedAd {
  id: string;                  // UUID para rastreabilidade
  format: AdFormat;
  content: AdContent;
  
  /** CPS estimado para esta variação (0-100) */
  estimatedCPS: number;
  
  /** Compliance de Brand Voice */
  brandVoice: {
    toneMatch: number;         // 0.0-1.0
    passed: boolean;           // toneMatch >= threshold
    adjustments?: string[];    // Ajustes feitos para compliance
  };
  
  /** Assets de elite usados como base */
  sourceAssets: {
    headlines: string[];
    ctas: string[];
    hooks: string[];
  };
  
  /** Técnica de copywriting aplicada */
  framework: CopyFramework;
  frameworkExplanation: string;
}

// ═══════════════════════════════════════════════════════
// REQUEST / RESPONSE (API Contract)
// ═══════════════════════════════════════════════════════

export interface GenerateAdsRequest {
  brandId: string;
  sourceUrl?: string;
  eliteAssets: import('./intelligence').UXIntelligence;
  formats: AdFormat[];
  audienceLevel?: ConsciousnessLevel;
  options?: {
    maxVariations?: number;            // Default: 3, Max: 5
    minToneMatch?: number;             // Default: 0.75
    preferredFrameworks?: CopyFramework[];
    includeImageSuggestions?: boolean;  // Default: true
  };
}

export interface GenerateAdsResponse {
  success: true;
  brandId: string;
  ads: GeneratedAd[];
  metadata: {
    totalGenerated: number;
    totalRejected: number;
    avgCPS: number;
    eliteAssetsUsed: number;
    tokensUsed: number;
    processingTimeMs: number;
    frameworksApplied: CopyFramework[];
  };
}

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

/** Limites de caracteres por formato de anúncio */
export const AD_CHAR_LIMITS = {
  meta_feed: { headline: 40, body: 125, description: 30 },
  meta_stories: { hook: 50, body: 80, ctaOverlay: 25 },
  google_search: { headline: 30, description: 90 },
} as const;

/** Limites de geração (RT-02) */
export const GENERATION_LIMITS = {
  maxVariationsPerRequest: 5,
  maxRequestsPerMinute: 10,
  tokenBudgetPerGeneration: 8_000,
  minToneMatchDefault: 0.75,
  maxBrandVoiceRetries: 2,
} as const;
