/**
 * @fileoverview Tipos para o módulo Multi-Input Text Analyzer
 * @module types/text-analysis
 * @version 1.0.0 — Sprint 25
 * @contract arch-sprint-25-predictive-creative-engine.md § 5 & 6.3
 */

// ═══════════════════════════════════════════════════════
// TIPOS DE INPUT
// ═══════════════════════════════════════════════════════

export type TextInputType =
  | 'vsl_transcript'   // Transcrição de VSL
  | 'ad_copy'          // Texto de anúncio existente
  | 'landing_page'     // Texto de landing page colado
  | 'general';         // Texto genérico

export type TextInputFormat = 'txt' | 'srt' | 'vtt';

// ═══════════════════════════════════════════════════════
// SUGESTÕES DE MELHORIA
// ═══════════════════════════════════════════════════════

export interface TextSuggestion {
  area: 'headline' | 'cta' | 'hook' | 'body' | 'offer' | 'structure';
  severity: 'critical' | 'improvement' | 'optional';
  issue: string;
  suggestion: string;
  rewritten?: string;          // Trecho reescrito
  eliteReference?: string;     // Elite Asset usado como referência
}

// ═══════════════════════════════════════════════════════
// ANÁLISE ESTRUTURAL
// ═══════════════════════════════════════════════════════

export interface VSLStructure {
  hookSegment: string;                    // Primeiros ~30s
  problemSetup?: string;
  solutionPresentation?: string;
  offerDetails?: string;
  closeSegment?: string;
  narrativeArc: 'story_offer_close' | 'problem_solution' | 'aida' | 'custom';
  estimatedDuration?: string;             // Ex: "12:30" (mm:ss)
}

export interface AdCopyAnalysis {
  format: 'short_form' | 'long_form' | 'video_script';
  hasHook: boolean;
  hasCTA: boolean;
  hasOffer: boolean;
  hasUrgency: boolean;
  hasSocialProof: boolean;
  missingElements: string[];
}

export interface StructuralAnalysis {
  wordCount: number;
  readabilityScore: number;               // 0-100 (Flesch adaptado)
  vslStructure?: VSLStructure;
  adCopyAnalysis?: AdCopyAnalysis;
}

// ═══════════════════════════════════════════════════════
// REQUEST / RESPONSE (API Contract)
// ═══════════════════════════════════════════════════════

export interface AnalyzeTextRequest {
  brandId: string;
  text: string;                           // Max 50.000 chars
  textType: TextInputType;
  format?: TextInputFormat;
  options?: {
    includeScoring?: boolean;             // Default: true
    includeSuggestions?: boolean;          // Default: true
    detectLanguage?: boolean;             // Default: true
    persistResult?: boolean;              // Default: true
  };
}

export interface AnalyzeTextResponse {
  success: true;
  brandId: string;
  uxIntelligence: import('./intelligence').UXIntelligence;
  scoring?: import('./prediction').PredictScoreResponse;
  suggestions: TextSuggestion[];
  structuralAnalysis: StructuralAnalysis;
  metadata: {
    textType: TextInputType;
    inputLength: number;
    detectedLanguage?: string;
    tokensUsed: number;
    processingTimeMs: number;
    persistedDocId?: string;
  };
}

// ═══════════════════════════════════════════════════════
// SANITIZAÇÃO (RT-03)
// ═══════════════════════════════════════════════════════

/** Regras de sanitização para inputs de texto */
export const TEXT_SANITIZATION_RULES = {
  maxLength: 50_000,
  minLength: 50,
  blockedPatterns: [
    /<script[\s>]/i,
    /eval\s*\(/i,
    /import\s+/i,
    /require\s*\(/i,
    /process\.env/i,
    /SELECT\s+.*\s+FROM/i,
    /DROP\s+TABLE/i,
  ] as readonly RegExp[],
  stripHtmlTags: true,
  supportedLanguages: ['pt', 'en', 'es'] as const,
} as const;

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════

/** Verifica se o texto contém padrões suspeitos (RT-03) */
export function isSuspiciousInput(text: string): boolean {
  return TEXT_SANITIZATION_RULES.blockedPatterns.some((pattern) =>
    pattern.test(text)
  );
}

/** Estima duração de leitura/fala em mm:ss */
export function estimateDuration(wordCount: number, wordsPerMinute = 150): string {
  const totalMinutes = wordCount / wordsPerMinute;
  const minutes = Math.floor(totalMinutes);
  const seconds = Math.round((totalMinutes - minutes) * 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
