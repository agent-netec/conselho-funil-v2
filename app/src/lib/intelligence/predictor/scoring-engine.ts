/**
 * Scoring Engine — Conversion Probability Score (CPS)
 * Sprint 25 · S25-ST-01
 *
 * Calcula o CPS (0-100) baseado em 6 dimensões de análise:
 *   headline_strength (0.20), cta_effectiveness (0.20),
 *   hook_quality (0.15), offer_structure (0.20),
 *   funnel_coherence (0.15), trust_signals (0.10)
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 3
 * @token_budget 4.000 tokens (tag: predict_score)
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
import { UXIntelligence } from '@/types/intelligence';
import { generateWithGemini } from '@/lib/ai/gemini';
import { AICostGuard } from '@/lib/ai/cost-guard';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'predict_score';
const TOKEN_BUDGET = 4000;

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
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

interface GeminiDimensionResult {
  dimension: ConversionDimension;
  score: number;
  explanation: string;
  evidence: string[];
  suggestions: string[];
}

interface GeminiScoringResponse {
  dimensions: GeminiDimensionResult[];
}

export interface ScoringResult {
  score: number;
  grade: ConversionGrade;
  breakdown: DimensionScore[];
  tokensUsed: number;
  modelUsed: string;
}

// ═══════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════

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

  return `Você é um especialista em conversão digital e copywriting direto, treinado nas metodologias de Eugene Schwartz, Gary Halbert e Russell Brunson.

Analise os seguintes ativos de um funil de vendas e avalie cada uma das 6 dimensões abaixo com um score de 0 a 100.

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

## Dimensões para Avaliação

1. **headline_strength**: Força e clareza das headlines. Considera: especificidade, benefício claro, curiosidade, urgência.
2. **cta_effectiveness**: Efetividade dos CTAs. Considera: clareza da ação, senso de urgência, benefício implícito.
3. **hook_quality**: Qualidade dos hooks de abertura. Considera: interrupção de padrão, relevância, conexão emocional.
4. **offer_structure**: Estrutura da oferta. Considera: valor percebido, stacking, garantias, bônus, ancoragem de preço.
5. **funnel_coherence**: Coerência narrativa do funil. Considera: fluxo lógico, consistência de mensagem, alinhamento headline→CTA.
6. **trust_signals**: Sinais de confiança. Considera: provas sociais, depoimentos, garantias, autoridade, badges.

## Formato de Resposta (JSON)

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown, no seguinte formato:

{
  "dimensions": [
    {
      "dimension": "headline_strength",
      "score": 0,
      "explanation": "Justificativa detalhada em português",
      "evidence": ["Elemento 1 que justifica o score", "Elemento 2"],
      "suggestions": ["Sugestão de melhoria 1", "Sugestão 2"]
    }
  ]
}

REGRAS:
- Score de 0 a 100 para cada dimensão.
- Se uma dimensão tem score < 60, OBRIGATÓRIO incluir pelo menos 2 suggestions.
- Explanation deve ser em português, concisa (1-3 frases).
- Evidence deve citar elementos reais dos ativos fornecidos.
- Se não houver dados suficientes para avaliar uma dimensão, atribua score entre 20-35 e explique a ausência.
- Retorne EXATAMENTE 6 dimensões, uma para cada dimensão listada acima.`;
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
 * @returns ScoringResult com score, grade e breakdown
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

  // 2. Verificar budget
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
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
    temperature: 0.3, // Baixa temperatura para scoring consistente
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
        });
      }
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
