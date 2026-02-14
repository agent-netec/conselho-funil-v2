/**
 * @fileoverview Tipos para o módulo Conversion Predictor
 * @module types/prediction
 * @version 1.0.0 — Sprint 25
 * @contract arch-sprint-25-predictive-creative-engine.md § 3 & 6.1
 */

// ═══════════════════════════════════════════════════════
// DIMENSÕES DE SCORING
// ═══════════════════════════════════════════════════════

export type ConversionDimension =
  | 'headline_strength'
  | 'cta_effectiveness'
  | 'hook_quality'
  | 'offer_structure'
  | 'funnel_coherence'
  | 'trust_signals';

export type ConversionGrade = 'S' | 'A' | 'B' | 'C' | 'D' | 'F';

// ═══════════════════════════════════════════════════════
// CONFIGURAÇÃO DE PESOS
// ═══════════════════════════════════════════════════════

export interface DimensionWeights {
  headlineStrength: number;   // Default: 0.20
  ctaEffectiveness: number;   // Default: 0.20
  hookQuality: number;        // Default: 0.15
  offerStructure: number;     // Default: 0.20
  funnelCoherence: number;    // Default: 0.15
  trustSignals: number;       // Default: 0.10
}

/** Pesos default para dimensões (soma = 1.0) */
export const DEFAULT_DIMENSION_WEIGHTS: DimensionWeights = {
  headlineStrength: 0.20,
  ctaEffectiveness: 0.20,
  hookQuality: 0.15,
  offerStructure: 0.20,
  funnelCoherence: 0.15,
  trustSignals: 0.10,
};

/** Thresholds de grading por faixa de CPS */
export const CPS_GRADE_THRESHOLDS: Record<ConversionGrade, [number, number]> = {
  S: [90, 100],
  A: [75, 89],
  B: [60, 74],
  C: [45, 59],
  D: [30, 44],
  F: [0, 29],
};

// ═══════════════════════════════════════════════════════
// RESULTADO DE SCORING
// ═══════════════════════════════════════════════════════

export interface DimensionScore {
  dimension: ConversionDimension;
  score: number;               // 0-100
  label: string;               // Ex: "Headline Strength"
  explanation: string;         // Justificativa textual
  evidence: string[];          // Elementos que justificam o score
  suggestions?: string[];      // Sugestões de melhoria (score < 60)
  confidence?: 'high' | 'medium' | 'low';
}

// ═══════════════════════════════════════════════════════
// OPINIÃO DO CONSELHO (Sprint B)
// ═══════════════════════════════════════════════════════

export interface CounselorOpinion {
  counselorId: string;
  counselorName: string;
  dimension: ConversionDimension;
  score: number;
  opinion: string;
  redFlagsTriggered: string[];
  goldStandardsHit: string[];
}

// ═══════════════════════════════════════════════════════
// BENCHMARK COMPARATIVO
// ═══════════════════════════════════════════════════════

export interface BenchmarkComparison {
  totalFunnelsInBase: number;
  averageCPS: number;
  percentileRank: number;      // Ex: 85 = "Top 15%"
  topPerformersCPS: number;    // Média do top 10%
  nicheAverage?: number;       // Média do nicho (se identificável)
  comparisonLabel: string;     // Ex: "Acima da média (Top 15%)"
}

// ═══════════════════════════════════════════════════════
// RECOMENDAÇÕES
// ═══════════════════════════════════════════════════════

export interface Recommendation {
  dimension: ConversionDimension;
  priority: 'critical' | 'high' | 'medium' | 'low';
  currentScore: number;
  issue: string;               // O problema detectado
  suggestion: string;          // Sugestão concreta
  rewrittenAsset?: string;     // Asset reescrito (quando aplicável)
  framework?: string;          // Schwartz, Brunson, Halbert, etc.
  basedOnEliteAsset?: boolean; // Se inspirado em Elite Asset da base
}

// ═══════════════════════════════════════════════════════
// REQUEST / RESPONSE (API Contract)
// ═══════════════════════════════════════════════════════

export interface PredictScoreRequest {
  brandId: string;
  funnelUrl?: string;
  funnelData?: import('./intelligence').UXIntelligence;
  options?: {
    includeRecommendations?: boolean;
    includeBenchmark?: boolean;
    nicheWeights?: Partial<DimensionWeights>;
  };
}

export interface PredictScoreResponse {
  success: true;
  brandId: string;
  score: number;
  grade: ConversionGrade;
  breakdown: DimensionScore[];
  counselorOpinions?: CounselorOpinion[];
  recommendations: Recommendation[];
  benchmark: BenchmarkComparison;
  metadata: {
    processedAt: string;
    modelUsed: string;
    tokensUsed: number;
    processingTimeMs: number;
    weightsApplied: DimensionWeights;
  };
}

// ═══════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════

/** Converte CPS numérico em grade qualitativa */
export function cpsToGrade(score: number): ConversionGrade {
  if (score >= 90) return 'S';
  if (score >= 75) return 'A';
  if (score >= 60) return 'B';
  if (score >= 45) return 'C';
  if (score >= 30) return 'D';
  return 'F';
}

/** Valida que os pesos somam ~1.0 (com tolerância de 0.01) */
export function validateWeights(weights: DimensionWeights): boolean {
  const sum =
    weights.headlineStrength +
    weights.ctaEffectiveness +
    weights.hookQuality +
    weights.offerStructure +
    weights.funnelCoherence +
    weights.trustSignals;
  return Math.abs(sum - 1.0) < 0.01;
}
