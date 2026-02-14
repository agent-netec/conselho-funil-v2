/**
 * Scoring Engine — Conversion Probability Score (CPS)
 * Sprint 25 · S25-ST-01 / Sprint B · Brain Integration
 *
 * Calcula o CPS (0-100) baseado em 6 dimensões de análise,
 * usando frameworks REAIS dos identity cards dos conselheiros.
 *
 * Dimensão → Experts:
 *   headline_strength  → Halbert (headline_score) + Ogilvy (headline_excellence)
 *   cta_effectiveness  → Bird (simplicity_efficiency) + Kennedy (market_match)
 *   hook_quality       → Carlton (hook_and_fascinations) + Sugarman (slippery_slide)
 *   offer_structure    → Kennedy (offer_architecture) + Brunson (value_ladder_score)
 *   funnel_coherence   → Sugarman (slippery_slide) + Schwartz (awareness_alignment)
 *   trust_signals      → Hopkins (trial_and_proof) + Ogilvy (big_idea_test)
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 3
 * @token_budget 5.000 tokens (tag: predict_score)
 */

import {
  DimensionScore,
  ConversionDimension,
  ConversionGrade,
  DimensionWeights,
  DEFAULT_DIMENSION_WEIGHTS,
  cpsToGrade,
  validateWeights,
} from '@/types/prediction';
import type { CounselorOpinion } from '@/types/prediction';
import { UXIntelligence } from '@/types/intelligence';
import { generateWithGemini, PRO_GEMINI_MODEL } from '@/lib/ai/gemini';
import { AICostGuard } from '@/lib/ai/cost-guard';
import { loadBrain } from '@/lib/intelligence/brains/loader';
import { buildScoringPromptFromBrain } from '@/lib/intelligence/brains/prompt-builder';
import type { CounselorId } from '@/types';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'predict_score';
const TOKEN_BUDGET = 5000;

/** Mapeamento de dimensão para chave nos pesos */
const DIMENSION_WEIGHT_MAP: Record<ConversionDimension, keyof DimensionWeights> = {
  headline_strength: 'headlineStrength',
  cta_effectiveness: 'ctaEffectiveness',
  hook_quality: 'hookQuality',
  offer_structure: 'offerStructure',
  funnel_coherence: 'funnelCoherence',
  trust_signals: 'trustSignals',
};

/** Labels legíveis para cada dimensão */
const DIMENSION_LABELS: Record<ConversionDimension, string> = {
  headline_strength: 'Headline Strength',
  cta_effectiveness: 'CTA Effectiveness',
  hook_quality: 'Hook Quality',
  offer_structure: 'Offer Structure',
  funnel_coherence: 'Funnel Coherence',
  trust_signals: 'Trust Signals',
};

// ═══════════════════════════════════════════════════════
// DIMENSION → EXPERTS MAPPING (Brain Integration)
// ═══════════════════════════════════════════════════════

interface DimensionExpertMapping {
  counselorId: CounselorId;
  frameworkId: string;
}

/** Cada dimensão usa 2 experts específicos com frameworks reais */
const DIMENSION_EXPERT_MAP: Record<ConversionDimension, DimensionExpertMapping[]> = {
  headline_strength: [
    { counselorId: 'gary_halbert', frameworkId: 'headline_score' },
    { counselorId: 'david_ogilvy', frameworkId: 'headline_excellence' },
  ],
  cta_effectiveness: [
    { counselorId: 'drayton_bird', frameworkId: 'simplicity_efficiency' },
    { counselorId: 'dan_kennedy_copy', frameworkId: 'market_match' },
  ],
  hook_quality: [
    { counselorId: 'john_carlton', frameworkId: 'hook_and_fascinations' },
    { counselorId: 'joseph_sugarman', frameworkId: 'slippery_slide' },
  ],
  offer_structure: [
    { counselorId: 'dan_kennedy_copy', frameworkId: 'offer_architecture' },
    { counselorId: 'russell_brunson', frameworkId: 'value_ladder_score' },
  ],
  funnel_coherence: [
    { counselorId: 'joseph_sugarman', frameworkId: 'slippery_slide' },
    { counselorId: 'eugene_schwartz', frameworkId: 'awareness_alignment' },
  ],
  trust_signals: [
    { counselorId: 'claude_hopkins', frameworkId: 'trial_and_proof' },
    { counselorId: 'david_ogilvy', frameworkId: 'big_idea_test' },
  ],
};

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

interface GeminiDimensionResult {
  dimension: ConversionDimension;
  score: number;
  explanation: string;
  evidence: string[];
  suggestions: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface GeminiScoringResponse {
  dimensions: GeminiDimensionResult[];
  counselorOpinions: CounselorOpinion[];
}

export interface ScoringResult {
  score: number;
  grade: ConversionGrade;
  breakdown: DimensionScore[];
  counselorOpinions: CounselorOpinion[];
  tokensUsed: number;
  modelUsed: string;
}

// ═══════════════════════════════════════════════════════
// PROMPT BUILDER (Brain-Powered)
// ═══════════════════════════════════════════════════════

/**
 * Builds the framework context for all dimensions using real identity cards.
 */
function buildFrameworkContext(): string {
  const sections: string[] = [];

  for (const [dimension, experts] of Object.entries(DIMENSION_EXPERT_MAP)) {
    const expertParts: string[] = [];

    for (const { counselorId, frameworkId } of experts) {
      const frameworkJson = buildScoringPromptFromBrain(counselorId, frameworkId);
      if (!frameworkJson) continue;

      const brain = loadBrain(counselorId);
      if (!brain) continue;

      const redFlagIds = brain.redFlags.map(rf => rf.id);
      const goldStandardIds = brain.goldStandards.map(gs => gs.id);

      expertParts.push(
        `#### ${brain.name} — ${frameworkId}\n` +
        `${frameworkJson}\n` +
        `Red Flag IDs: [${redFlagIds.join(', ')}]\n` +
        `Gold Standard IDs: [${goldStandardIds.join(', ')}]`
      );
    }

    if (expertParts.length > 0) {
      sections.push(
        `### ${dimension} (${DIMENSION_LABELS[dimension as ConversionDimension]})\n${expertParts.join('\n\n')}`
      );
    }
  }

  return sections.join('\n\n');
}

/**
 * Builds the list of unique experts and their dimensions for the prompt.
 */
function buildExpertsInstructions(): string {
  const expertDimensions = new Map<string, { name: string; dimensions: string[] }>();

  for (const [dimension, experts] of Object.entries(DIMENSION_EXPERT_MAP)) {
    for (const { counselorId } of experts) {
      if (!expertDimensions.has(counselorId)) {
        const brain = loadBrain(counselorId);
        expertDimensions.set(counselorId, {
          name: brain?.name ?? counselorId,
          dimensions: [],
        });
      }
      expertDimensions.get(counselorId)!.dimensions.push(dimension);
    }
  }

  return Array.from(expertDimensions.entries())
    .map(([id, { name, dimensions }]) => `- ${id} (${name}): avalia ${dimensions.join(', ')}`)
    .join('\n');
}

function buildScoringPrompt(data: UXIntelligence): string {
  const headlines = data.headlines
    .map((h) => `- "${h.text}" (relevance: ${h.relevanceScore})`)
    .join('\n');
  const ctas = data.ctas
    .map((c) => `- "${c.text}" (relevance: ${c.relevanceScore})`)
    .join('\n');
  const hooks = data.hooks
    .map((h) => `- "${h.text}" (relevance: ${h.relevanceScore})`)
    .join('\n');
  const visuals = data.visualElements
    ? data.visualElements.map((v) => `- "${v.text}" (${v.type})`).join('\n')
    : 'Nenhum elemento visual identificado.';
  const structure = data.funnelStructure || 'Estrutura não identificada.';

  const frameworkContext = buildFrameworkContext();
  const expertsInstructions = buildExpertsInstructions();

  return `Você é um painel de especialistas em conversão digital e copywriting direto. Cada dimensão será avaliada usando os frameworks REAIS fornecidos abaixo.

Baseie sua análise EXCLUSIVAMENTE nos dados fornecidos. Se não há dados suficientes para uma dimensão, diga explicitamente e atribua confidence "low".

## Ativos do Funil

### Headlines
${headlines || 'Nenhuma headline identificada.'}

### CTAs (Call to Action)
${ctas || 'Nenhum CTA identificado.'}

### Hooks
${hooks || 'Nenhum hook identificado.'}

### Elementos Visuais
${visuals}

### Estrutura do Funil
${structure}

## Frameworks de Avaliação por Dimensão

${frameworkContext}

## Experts e Dimensões
${expertsInstructions}

## Formato de Resposta (JSON)

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown, no seguinte formato:

{
  "dimensions": [
    {
      "dimension": "headline_strength",
      "score": 75,
      "explanation": "Justificativa baseada nos critérios e pesos dos frameworks acima, em português",
      "evidence": ["Citação LITERAL de elemento do funil"],
      "suggestions": ["Sugestão baseada nos critérios do framework"],
      "confidence": "high"
    }
  ],
  "counselorOpinions": [
    {
      "counselorId": "gary_halbert",
      "counselorName": "Gary Halbert",
      "dimension": "headline_strength",
      "score": 78,
      "opinion": "Opinião na VOZ AUTÊNTICA do expert (1-2 frases, usando seu estilo único)",
      "redFlagsTriggered": ["generic_headline"],
      "goldStandardsHit": []
    }
  ]
}

REGRAS:
- Score de 0 a 100 para cada dimensão, calculado usando os critérios e pesos dos frameworks.
- Se uma dimensão tem score < 60, OBRIGATÓRIO incluir pelo menos 2 suggestions.
- Explanation deve referenciar os critérios específicos do framework usado.
- Evidence deve citar elementos LITERAIS dos ativos fornecidos.
- Se não houver dados suficientes, atribua score 20-35, confidence "low", e explique.
- Retorne EXATAMENTE 6 dimensões.
- counselorOpinions: gere UMA opinião por expert POR dimensão que ele avalia (conforme lista acima).
- A opinion deve ser na VOZ AUTÊNTICA do expert, como se ele estivesse falando diretamente.
- redFlagsTriggered: IDs dos red flags aplicáveis (da lista fornecida). Array vazio se nenhum.
- goldStandardsHit: IDs dos gold standards alcançados. Array vazio se nenhum.`;
}

// ═══════════════════════════════════════════════════════
// SCORING ENGINE
// ═══════════════════════════════════════════════════════

/**
 * Calcula o Conversion Probability Score (CPS) de um funil.
 *
 * @param brandId - ID da brand (para cost-guard e isolamento)
 * @param data - UXIntelligence com assets do funil
 * @param weights - Pesos customizados (default: DEFAULT_DIMENSION_WEIGHTS)
 * @param userId - ID do usuário para cost-guard
 * @returns ScoringResult com score, grade, breakdown e counselorOpinions
 */
export async function calculateCPS(
  brandId: string,
  data: UXIntelligence,
  weights: DimensionWeights = DEFAULT_DIMENSION_WEIGHTS,
  userId: string = 'system'
): Promise<ScoringResult> {
  // 1. Validar pesos
  if (!validateWeights(weights)) {
    throw new Error('INVALID_WEIGHTS: A soma dos pesos deve ser ~1.0 (tolerância: 0.01)');
  }

  // 2. Verificar budget (Scoring usa Pro para máxima qualidade)
  const model = PRO_GEMINI_MODEL;
  const hasBudget = await AICostGuard.checkBudget({
    userId,
    brandId,
    model,
    feature: FEATURE_TAG,
  });

  if (!hasBudget) {
    throw new Error('Budget limit exceeded or no credits available.');
  }

  // 3. Montar e enviar prompt
  const prompt = buildScoringPrompt(data);

  // Estimar tokens do input e verificar budget
  const estimatedInputTokens = AICostGuard.estimateTokens(prompt);
  if (estimatedInputTokens + TOKEN_BUDGET > TOKEN_BUDGET * 2) {
    console.warn(`[ScoringEngine] Input tokens (${estimatedInputTokens}) approaching budget limit.`);
  }

  const rawResponse = await generateWithGemini(prompt, {
    model,
    temperature: 0.1, // Sprint B: Consistência máxima para scoring
    maxOutputTokens: TOKEN_BUDGET,
    responseMimeType: 'application/json',
    userId,
    brandId,
    feature: FEATURE_TAG,
  });

  // 4. Parsear resposta
  const parsed = parseGeminiResponse(rawResponse);

  // 5. Calcular média ponderada
  const breakdown = buildBreakdown(parsed.dimensions);
  const score = calculateWeightedAverage(breakdown, weights);
  const grade = cpsToGrade(score);

  return {
    score: Math.round(score * 100) / 100,
    grade,
    breakdown,
    counselorOpinions: parsed.counselorOpinions || [],
    tokensUsed: AICostGuard.estimateTokens(prompt + rawResponse),
    modelUsed: model,
  };
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Parseia a resposta JSON do Gemini, com fallback para limpeza de markdown.
 */
function parseGeminiResponse(raw: string): GeminiScoringResponse {
  let jsonStr = raw.trim();

  // Remover possíveis wrappers markdown
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7);
  }
  if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3);
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3);
  }

  try {
    const parsed = JSON.parse(jsonStr.trim()) as GeminiScoringResponse;

    if (!parsed.dimensions || !Array.isArray(parsed.dimensions)) {
      throw new Error('Resposta do Gemini sem array "dimensions".');
    }

    // Validar que temos exatamente 6 dimensões
    const validDimensions: ConversionDimension[] = [
      'headline_strength',
      'cta_effectiveness',
      'hook_quality',
      'offer_structure',
      'funnel_coherence',
      'trust_signals',
    ];

    const receivedDimensions = parsed.dimensions.map((d) => d.dimension);
    const missing = validDimensions.filter((d) => !receivedDimensions.includes(d));

    if (missing.length > 0) {
      // Preencher dimensões ausentes com score default
      for (const dim of missing) {
        parsed.dimensions.push({
          dimension: dim,
          score: 25,
          explanation: 'Dados insuficientes para avaliação desta dimensão.',
          evidence: [],
          suggestions: ['Forneça mais dados sobre esta dimensão para uma avaliação precisa.'],
          confidence: 'low',
        });
      }
    }

    // Normalizar counselorOpinions
    if (!parsed.counselorOpinions || !Array.isArray(parsed.counselorOpinions)) {
      parsed.counselorOpinions = [];
    }

    return parsed;
  } catch (error) {
    console.error('[ScoringEngine] Falha ao parsear resposta do Gemini:', raw);
    throw new Error(`SCORING_ERROR: Falha ao processar resposta da IA. ${error instanceof Error ? error.message : ''}`);
  }
}

/**
 * Constrói o array de DimensionScore a partir da resposta do Gemini.
 */
function buildBreakdown(dimensions: GeminiDimensionResult[]): DimensionScore[] {
  return dimensions.map((d) => ({
    dimension: d.dimension,
    score: clamp(d.score, 0, 100),
    label: DIMENSION_LABELS[d.dimension] || d.dimension,
    explanation: d.explanation || '',
    evidence: d.evidence || [],
    suggestions: d.score < 60 ? (d.suggestions?.length ? d.suggestions : ['Considere melhorar esta dimensão.']) : d.suggestions,
    confidence: d.confidence,
  }));
}

/**
 * Calcula a média ponderada do CPS.
 */
function calculateWeightedAverage(
  breakdown: DimensionScore[],
  weights: DimensionWeights
): number {
  let totalScore = 0;
  let totalWeight = 0;

  for (const dim of breakdown) {
    const weightKey = DIMENSION_WEIGHT_MAP[dim.dimension];
    if (weightKey) {
      const weight = weights[weightKey];
      totalScore += dim.score * weight;
      totalWeight += weight;
    }
  }

  // Normalizar caso algum peso esteja faltando
  return totalWeight > 0 ? totalScore / totalWeight : 0;
}

/**
 * Clampa um valor entre min e max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
