/**
 * VSL Transcript Parser — Narrative Structure Detector
 * Sprint 25 · S25-ST-08
 *
 * Parser especializado para transcrições de VSL (Video Sales Letter).
 * Detecta estrutura narrativa: hook, problema, solução, oferta, fechamento.
 * Classifica narrativeArc e calcula estimatedDuration.
 *
 * @depends S25-ST-07 (text-parser.ts + sanitizer.ts)
 * @contract arch-sprint-25-predictive-creative-engine.md § 5
 * @token_budget 6.000 tokens (tag: analyze_text) — compartilhado com text-parser
 */

import {
  VSLStructure,
  StructuralAnalysis,
  TextSuggestion,
  estimateDuration,
} from '@/types/text-analysis';
import { UXIntelligence } from '@/types/intelligence';
import { generateWithGemini } from '@/lib/ai/gemini';
import { AICostGuard } from '@/lib/ai/cost-guard';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'analyze_text';
const TOKEN_BUDGET = 6000;

/** Palavras por minuto para estimativa de duração de fala */
const DEFAULT_WPM = 150;

/** Limite de palavras para hook segment (~30 segundos de fala) */
const HOOK_WORD_LIMIT = 200;

/** Tipos válidos de arco narrativo */
const VALID_NARRATIVE_ARCS = [
  'story_offer_close',
  'problem_solution',
  'aida',
  'custom',
] as const;

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

export interface VSLParserInput {
  /** Texto já sanitizado e sem timestamps (SRT/VTT stripping feito no text-parser) */
  sanitizedText: string;
  brandId: string;
  userId: string;
  wordCount: number;
}

export interface VSLParserResult {
  vslStructure: VSLStructure;
  suggestions: TextSuggestion[];
  tokensUsed: number;
}

interface GeminiVSLResponse {
  hookSegment: string;
  problemSetup?: string;
  solutionPresentation?: string;
  offerDetails?: string;
  closeSegment?: string;
  narrativeArc: string;
  suggestions?: Array<{
    area: string;
    severity: string;
    issue: string;
    suggestion: string;
    rewritten?: string;
  }>;
}

// ═══════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════

function buildVSLAnalysisPrompt(text: string, wordCount: number): string {
  const estimatedMinutes = Math.round(wordCount / DEFAULT_WPM);

  return `Você é um especialista em VSLs (Video Sales Letters) e copywriting direto, treinado nas metodologias de Russell Brunson (Story → Offer → Close), Eugene Schwartz (níveis de consciência) e Gary Halbert (AIDA).

Analise a seguinte transcrição de VSL e identifique a estrutura narrativa completa.

## Dados da Transcrição
- Word count: ${wordCount} palavras
- Duração estimada: ~${estimatedMinutes} minutos

## Transcrição
---
${text}
---

## Sua Tarefa

Identifique e extraia os seguintes segmentos da VSL:

1. **hookSegment**: O gancho de abertura (primeiros ~200 palavras ou ~30 segundos). Deve ser o trecho exato que inicia a VSL e captura atenção.

2. **problemSetup**: O segmento onde o problema/dor do público é apresentado e amplificado. Extraia o trecho mais representativo.

3. **solutionPresentation**: O segmento onde a solução é revelada. Identifique o momento de virada (de problema para solução).

4. **offerDetails**: O segmento da oferta — preço, bônus, garantias, value stacking. Se presente, extraia os elementos da oferta.

5. **closeSegment**: O fechamento — urgência final, CTA principal, escassez. Últimas frases persuasivas.

6. **narrativeArc**: Classifique o tipo de arco narrativo da VSL:
   - \`story_offer_close\`: Estrutura clássica Brunson (história pessoal → oferta → fechamento)
   - \`problem_solution\`: Estrutura problema → agitação → solução (PAS)
   - \`aida\`: Attention → Interest → Desire → Action (Halbert/AIDA)
   - \`custom\`: Quando não se encaixa nos padrões acima

7. **suggestions**: 2-5 sugestões de melhoria para a VSL:
   - area: headline | cta | hook | body | offer | structure
   - severity: critical | improvement | optional
   - issue: problema detectado
   - suggestion: sugestão concreta
   - rewritten: trecho reescrito (quando aplicável)

## Formato de Resposta (JSON)

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown:

{
  "hookSegment": "Trecho exato do hook de abertura...",
  "problemSetup": "Trecho representativo do setup do problema...",
  "solutionPresentation": "Trecho da apresentação da solução...",
  "offerDetails": "Trecho dos detalhes da oferta...",
  "closeSegment": "Trecho do fechamento...",
  "narrativeArc": "story_offer_close",
  "suggestions": [
    { "area": "hook", "severity": "improvement", "issue": "...", "suggestion": "...", "rewritten": "..." }
  ]
}

REGRAS:
- Extraia trechos REAIS da transcrição (não invente conteúdo).
- Se um segmento não for identificável, retorne null para ele.
- hookSegment é OBRIGATÓRIO — se a VSL não tiver hook claro, use as primeiras ~200 palavras.
- narrativeArc é OBRIGATÓRIO — se nenhum padrão se encaixar, use "custom".
- suggestions deve ter pelo menos 2 itens.
- Retorne SOMENTE JSON válido.`;
}

// ═══════════════════════════════════════════════════════
// VSL PARSER
// ═══════════════════════════════════════════════════════

/**
 * Analisa uma transcrição de VSL e extrai a estrutura narrativa.
 *
 * Pipeline:
 *  1. Extrair hook segment (primeiros ~200 palavras) como fallback local
 *  2. Verificar budget via cost-guard
 *  3. Enviar para Gemini com prompt especializado em VSL
 *  4. Parsear e validar resposta
 *  5. Calcular estimatedDuration via estimateDuration()
 *  6. Retornar VSLStructure + sugestões
 *
 * @param input - VSLParserInput com texto sanitizado
 * @returns VSLParserResult com vslStructure e sugestões
 */
export async function parseVSLTranscript(
  input: VSLParserInput
): Promise<VSLParserResult> {
  const { sanitizedText, brandId, userId, wordCount } = input;

  // 1. Extrair hook fallback local (primeiras ~200 palavras)
  const localHook = extractLocalHook(sanitizedText);

  // 2. Verificar budget
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const hasBudget = await AICostGuard.checkBudget({
    userId,
    brandId,
    model,
    feature: FEATURE_TAG,
  });

  if (!hasBudget) {
    // Graceful degradation: retornar estrutura básica sem IA
    return buildFallbackResult(sanitizedText, localHook, wordCount);
  }

  // 3. Montar prompt e chamar Gemini
  const prompt = buildVSLAnalysisPrompt(sanitizedText, wordCount);

  const rawResponse = await generateWithGemini(prompt, {
    model,
    temperature: 0.3,
    maxOutputTokens: TOKEN_BUDGET,
    responseMimeType: 'application/json',
    userId,
    brandId,
    feature: FEATURE_TAG,
  });

  // 4. Parsear resposta
  const parsed = parseGeminiVSLResponse(rawResponse, localHook);

  // 5. Construir VSLStructure
  const vslStructure: VSLStructure = {
    hookSegment: parsed.hookSegment || localHook,
    problemSetup: parsed.problemSetup || undefined,
    solutionPresentation: parsed.solutionPresentation || undefined,
    offerDetails: parsed.offerDetails || undefined,
    closeSegment: parsed.closeSegment || undefined,
    narrativeArc: normalizeNarrativeArc(parsed.narrativeArc),
    estimatedDuration: estimateDuration(wordCount, DEFAULT_WPM),
  };

  // 6. Construir sugestões
  const suggestions = buildVSLSuggestions(parsed.suggestions || []);

  const tokensUsed = AICostGuard.estimateTokens(prompt + rawResponse);

  return {
    vslStructure,
    suggestions,
    tokensUsed,
  };
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Extrai o hook local (primeiras ~200 palavras) como fallback.
 */
function extractLocalHook(text: string): string {
  const words = text.split(/\s+/).filter(Boolean);
  const hookWords = words.slice(0, HOOK_WORD_LIMIT);
  return hookWords.join(' ');
}

/**
 * Normaliza o narrativeArc retornado pelo Gemini para valores válidos.
 */
function normalizeNarrativeArc(
  arc: string
): VSLStructure['narrativeArc'] {
  const normalized = arc?.toLowerCase().replace(/[\s-]/g, '_');
  if (
    VALID_NARRATIVE_ARCS.includes(
      normalized as (typeof VALID_NARRATIVE_ARCS)[number]
    )
  ) {
    return normalized as VSLStructure['narrativeArc'];
  }
  return 'custom';
}

/**
 * Parseia a resposta JSON do Gemini com fallback.
 */
function parseGeminiVSLResponse(
  raw: string,
  fallbackHook: string
): GeminiVSLResponse {
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
    const parsed = JSON.parse(jsonStr.trim()) as GeminiVSLResponse;

    // Garantir hookSegment presente
    if (!parsed.hookSegment) {
      parsed.hookSegment = fallbackHook;
    }

    // Garantir narrativeArc presente
    if (!parsed.narrativeArc) {
      parsed.narrativeArc = 'custom';
    }

    return parsed;
  } catch (error) {
    console.error('[VSLParser] Falha ao parsear resposta do Gemini:', raw);
    // Retornar estrutura mínima em caso de falha
    return {
      hookSegment: fallbackHook,
      narrativeArc: 'custom',
    };
  }
}

/**
 * Converte sugestões do Gemini em TextSuggestion[] validadas.
 */
function buildVSLSuggestions(
  raw: Array<{
    area: string;
    severity: string;
    issue: string;
    suggestion: string;
    rewritten?: string;
  }>
): TextSuggestion[] {
  const validAreas = [
    'headline',
    'cta',
    'hook',
    'body',
    'offer',
    'structure',
  ] as const;
  const validSeverities = ['critical', 'improvement', 'optional'] as const;

  return raw
    .filter((s) => s.area && s.issue && s.suggestion)
    .map((s) => ({
      area: (validAreas.includes(s.area as (typeof validAreas)[number])
        ? s.area
        : 'structure') as TextSuggestion['area'],
      severity: (validSeverities.includes(
        s.severity as (typeof validSeverities)[number]
      )
        ? s.severity
        : 'improvement') as TextSuggestion['severity'],
      issue: s.issue,
      suggestion: s.suggestion,
      rewritten: s.rewritten,
    }));
}

/**
 * Fallback quando budget insuficiente: estrutura básica sem IA.
 * Usa heurísticas locais para detectar segmentos.
 */
function buildFallbackResult(
  text: string,
  localHook: string,
  wordCount: number
): VSLParserResult {
  const vslStructure: VSLStructure = {
    hookSegment: localHook,
    narrativeArc: 'custom',
    estimatedDuration: estimateDuration(wordCount, DEFAULT_WPM),
  };

  const suggestions: TextSuggestion[] = [
    {
      area: 'structure',
      severity: 'optional',
      issue:
        'Análise completa da estrutura narrativa não disponível (budget insuficiente).',
      suggestion:
        'Execute a análise novamente quando houver créditos disponíveis para obter detalhamento completo da estrutura da VSL.',
    },
  ];

  return {
    vslStructure,
    suggestions,
    tokensUsed: 0,
  };
}
