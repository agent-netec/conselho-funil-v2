/**
 * Ad Copy Analyzer — Element Detection & Suggestions
 * Sprint 25 · S25-ST-09
 *
 * Parser especializado para textos de anúncio existentes (colados da Ads Library).
 * Detecta presença de elementos persuasivos, classifica formato e gera sugestões.
 *
 * @depends S25-ST-07 (text-parser.ts + sanitizer.ts)
 * @contract arch-sprint-25-predictive-creative-engine.md § 5
 * @token_budget 6.000 tokens (tag: analyze_text) — compartilhado com text-parser
 */

import {
  AdCopyAnalysis,
  TextSuggestion,
} from '@/types/text-analysis';
import { generateWithGemini } from '@/lib/ai/gemini';
import { AICostGuard } from '@/lib/ai/cost-guard';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'analyze_text';
const TOKEN_BUDGET = 6000;

/** Limiar de palavras para classificação de formato */
const SHORT_FORM_LIMIT = 200;

/** Cues que indicam video script */
const VIDEO_SCRIPT_CUES = [
  /\[.*?corte.*?\]/i,
  /\[.*?cut.*?\]/i,
  /\[.*?cena.*?\]/i,
  /\[.*?scene.*?\]/i,
  /\[.*?texto.*?tela.*?\]/i,
  /\[.*?text.*?screen.*?\]/i,
  /\[.*?música.*?\]/i,
  /\[.*?music.*?\]/i,
  /\[.*?narração.*?\]/i,
  /\[.*?voiceover.*?\]/i,
  /\[.*?v\.?o\.?\]/i,
  /\bFADE\s+(IN|OUT)\b/i,
  /\bSUPER:\s*/i,
  /\bGFX:\s*/i,
  /\bSFX:\s*/i,
  /\bCUT\s+TO\b/i,
];

/** Elementos de ad copy para detecção */
const AD_ELEMENTS = [
  'hook',
  'cta',
  'offer',
  'urgency',
  'socialProof',
] as const;

/** Nomes legíveis para cada elemento */
const ELEMENT_LABELS: Record<string, string> = {
  hook: 'Hook / Gancho de abertura',
  cta: 'Call to Action (CTA)',
  offer: 'Oferta',
  urgency: 'Urgência / Escassez',
  socialProof: 'Prova Social',
};

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

export interface AdCopyAnalyzerInput {
  /** Texto já sanitizado */
  sanitizedText: string;
  brandId: string;
  userId: string;
  wordCount: number;
}

export interface AdCopyAnalyzerResult {
  adCopyAnalysis: AdCopyAnalysis;
  suggestions: TextSuggestion[];
  tokensUsed: number;
}

interface GeminiAdCopyResponse {
  format: string;
  hasHook: boolean;
  hasCTA: boolean;
  hasOffer: boolean;
  hasUrgency: boolean;
  hasSocialProof: boolean;
  suggestions?: Array<{
    area: string;
    severity: string;
    issue: string;
    suggestion: string;
    rewritten?: string;
    eliteReference?: string;
  }>;
}

// ═══════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════

function buildAdCopyPrompt(text: string, wordCount: number, detectedFormat: string): string {
  return `Você é um especialista em análise de anúncios digitais e copywriting de performance, treinado nas metodologias de Eugene Schwartz, Gary Halbert e Russell Brunson.

Analise o seguinte texto de anúncio e identifique seus elementos persuasivos.

## Dados do Anúncio
- Word count: ${wordCount} palavras
- Formato detectado localmente: ${detectedFormat}

## Texto do Anúncio
---
${text}
---

## Sua Tarefa

Analise o anúncio e identifique:

1. **format**: Classifique o formato:
   - \`short_form\`: Anúncio curto (< 200 palavras, ex: Meta Feed, Google Search)
   - \`long_form\`: Anúncio longo (200+ palavras, ex: advertorial, carta de vendas)
   - \`video_script\`: Roteiro de vídeo (contém cues de edição, narração, cenas)

2. **hasHook** (boolean): O anúncio tem um gancho de abertura forte? (primeiras 1-2 frases que capturam atenção, interrompem padrão, geram curiosidade)

3. **hasCTA** (boolean): O anúncio tem um Call to Action claro? (frase que diz ao leitor o que fazer: "clique", "compre", "saiba mais", "garanta", etc.)

4. **hasOffer** (boolean): O anúncio apresenta uma oferta? (desconto, bônus, preço especial, pacote, value proposition clara)

5. **hasUrgency** (boolean): O anúncio tem elemento de urgência/escassez? ("últimas vagas", "por tempo limitado", "só hoje", countdown, etc.)

6. **hasSocialProof** (boolean): O anúncio tem prova social? (depoimentos, números de clientes, "mais de X pessoas", avaliações, logos de mídia, etc.)

7. **suggestions**: Para cada elemento AUSENTE (false), gere uma sugestão de melhoria prática:
   - area: headline | cta | hook | body | offer | structure
   - severity: critical (CTA/Hook ausente) | improvement (Offer/Urgency ausente) | optional (Social Proof ausente)
   - issue: descrição do problema
   - suggestion: sugestão prática e específica para o contexto do anúncio
   - rewritten: exemplo de trecho reescrito incorporando o elemento ausente
   - eliteReference: se possível, referência a uma técnica de copywriting (Schwartz/Halbert/Brunson)

## Formato de Resposta (JSON)

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown:

{
  "format": "short_form",
  "hasHook": true,
  "hasCTA": true,
  "hasOffer": false,
  "hasUrgency": false,
  "hasSocialProof": false,
  "suggestions": [
    {
      "area": "offer",
      "severity": "improvement",
      "issue": "Anúncio não apresenta oferta clara.",
      "suggestion": "Adicione um value proposition concreto.",
      "rewritten": "Exemplo de trecho com oferta...",
      "eliteReference": "Schwartz — Nível 3 de consciência"
    }
  ]
}

REGRAS:
- Seja rigoroso na detecção de elementos: só marque como \`true\` se o elemento estiver CLARAMENTE presente.
- Para cada elemento marcado como \`false\`, DEVE existir uma sugestão correspondente.
- Suggestions devem ser PRÁTICAS e específicas para o conteúdo do anúncio (não genéricas).
- Se o anúncio for muito curto e faltar contexto, infira o melhor possível e sinalize nas sugestões.
- Retorne SOMENTE JSON válido.`;
}

// ═══════════════════════════════════════════════════════
// AD COPY ANALYZER
// ═══════════════════════════════════════════════════════

/**
 * Analisa um texto de anúncio existente e identifica elementos persuasivos.
 *
 * Pipeline:
 *  1. Classificar formato localmente (heurística de word count + video cues)
 *  2. Verificar budget via cost-guard
 *  3. Enviar para Gemini com prompt especializado em Ad Copy
 *  4. Parsear e validar resposta
 *  5. Montar missingElements[] para itens ausentes
 *  6. Gerar TextSuggestion[] com sugestões práticas
 *  7. Retornar AdCopyAnalysis + sugestões
 *
 * @param input - AdCopyAnalyzerInput com texto sanitizado
 * @returns AdCopyAnalyzerResult com adCopyAnalysis e sugestões
 */
export async function analyzeAdCopy(
  input: AdCopyAnalyzerInput
): Promise<AdCopyAnalyzerResult> {
  const { sanitizedText, brandId, userId, wordCount } = input;

  // 1. Classificação local de formato (heurística)
  const localFormat = detectFormatLocally(sanitizedText, wordCount);

  // 2. Verificar budget
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  const hasBudget = await AICostGuard.checkBudget({
    userId,
    brandId,
    model,
    feature: FEATURE_TAG,
  });

  if (!hasBudget) {
    // Graceful degradation: análise heurística local sem IA
    return buildFallbackResult(sanitizedText, wordCount, localFormat);
  }

  // 3. Montar prompt e chamar Gemini
  const prompt = buildAdCopyPrompt(sanitizedText, wordCount, localFormat);

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
  const parsed = parseGeminiAdCopyResponse(rawResponse, localFormat);

  // 5. Montar missingElements
  const missingElements = buildMissingElements(parsed);

  // 6. Construir AdCopyAnalysis
  const adCopyAnalysis: AdCopyAnalysis = {
    format: normalizeFormat(parsed.format, localFormat),
    hasHook: parsed.hasHook ?? false,
    hasCTA: parsed.hasCTA ?? false,
    hasOffer: parsed.hasOffer ?? false,
    hasUrgency: parsed.hasUrgency ?? false,
    hasSocialProof: parsed.hasSocialProof ?? false,
    missingElements,
  };

  // 7. Construir sugestões
  const suggestions = buildAdCopySuggestions(parsed.suggestions || [], missingElements);

  const tokensUsed = AICostGuard.estimateTokens(prompt + rawResponse);

  return {
    adCopyAnalysis,
    suggestions,
    tokensUsed,
  };
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Detecta formato do ad copy localmente via heurísticas.
 */
function detectFormatLocally(
  text: string,
  wordCount: number
): AdCopyAnalysis['format'] {
  // Detectar video script por cues
  const hasVideoCues = VIDEO_SCRIPT_CUES.some((cue) => cue.test(text));
  if (hasVideoCues) {
    return 'video_script';
  }

  // Classificar por word count
  if (wordCount < SHORT_FORM_LIMIT) {
    return 'short_form';
  }

  return 'long_form';
}

/**
 * Normaliza o formato retornado pelo Gemini.
 */
function normalizeFormat(
  geminiFormat: string,
  fallback: AdCopyAnalysis['format']
): AdCopyAnalysis['format'] {
  const validFormats: AdCopyAnalysis['format'][] = [
    'short_form',
    'long_form',
    'video_script',
  ];
  const normalized = geminiFormat?.toLowerCase().replace(/[\s-]/g, '_');
  if (validFormats.includes(normalized as AdCopyAnalysis['format'])) {
    return normalized as AdCopyAnalysis['format'];
  }
  return fallback;
}

/**
 * Identifica os elementos ausentes no ad copy.
 */
function buildMissingElements(parsed: GeminiAdCopyResponse): string[] {
  const missing: string[] = [];

  if (!parsed.hasHook) missing.push(ELEMENT_LABELS.hook);
  if (!parsed.hasCTA) missing.push(ELEMENT_LABELS.cta);
  if (!parsed.hasOffer) missing.push(ELEMENT_LABELS.offer);
  if (!parsed.hasUrgency) missing.push(ELEMENT_LABELS.urgency);
  if (!parsed.hasSocialProof) missing.push(ELEMENT_LABELS.socialProof);

  return missing;
}

/**
 * Parseia a resposta JSON do Gemini com fallback.
 */
function parseGeminiAdCopyResponse(
  raw: string,
  fallbackFormat: AdCopyAnalysis['format']
): GeminiAdCopyResponse {
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
    const parsed = JSON.parse(jsonStr.trim()) as GeminiAdCopyResponse;

    // Garantir campos obrigatórios
    if (!parsed.format) {
      parsed.format = fallbackFormat;
    }

    return parsed;
  } catch (error) {
    console.error('[AdCopyAnalyzer] Falha ao parsear resposta do Gemini:', raw);
    // Retornar fallback conservador (tudo false → maximiza sugestões)
    return {
      format: fallbackFormat,
      hasHook: false,
      hasCTA: false,
      hasOffer: false,
      hasUrgency: false,
      hasSocialProof: false,
    };
  }
}

/**
 * Converte sugestões do Gemini + missingElements em TextSuggestion[] validadas.
 * Se o Gemini não gerou sugestão para um elemento ausente, gera uma sugestão genérica.
 */
function buildAdCopySuggestions(
  raw: Array<{
    area: string;
    severity: string;
    issue: string;
    suggestion: string;
    rewritten?: string;
    eliteReference?: string;
  }>,
  missingElements: string[]
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

  // Converter sugestões do Gemini
  const geminiSuggestions: TextSuggestion[] = raw
    .filter((s) => s.area && s.issue && s.suggestion)
    .map((s) => ({
      area: (validAreas.includes(s.area as (typeof validAreas)[number])
        ? s.area
        : 'body') as TextSuggestion['area'],
      severity: (validSeverities.includes(
        s.severity as (typeof validSeverities)[number]
      )
        ? s.severity
        : 'improvement') as TextSuggestion['severity'],
      issue: s.issue,
      suggestion: s.suggestion,
      rewritten: s.rewritten,
      eliteReference: s.eliteReference,
    }));

  // Garantir que cada missingElement tem ao menos uma sugestão
  const coveredAreas = new Set(geminiSuggestions.map((s) => s.area));

  const elementToArea: Record<string, TextSuggestion['area']> = {
    [ELEMENT_LABELS.hook]: 'hook',
    [ELEMENT_LABELS.cta]: 'cta',
    [ELEMENT_LABELS.offer]: 'offer',
    [ELEMENT_LABELS.urgency]: 'body',
    [ELEMENT_LABELS.socialProof]: 'body',
  };

  const elementSeverity: Record<string, TextSuggestion['severity']> = {
    [ELEMENT_LABELS.hook]: 'critical',
    [ELEMENT_LABELS.cta]: 'critical',
    [ELEMENT_LABELS.offer]: 'improvement',
    [ELEMENT_LABELS.urgency]: 'improvement',
    [ELEMENT_LABELS.socialProof]: 'optional',
  };

  for (const missing of missingElements) {
    const area = elementToArea[missing] || 'body';
    if (!coveredAreas.has(area)) {
      geminiSuggestions.push({
        area,
        severity: elementSeverity[missing] || 'improvement',
        issue: `Elemento ausente: ${missing}`,
        suggestion: `Considere adicionar ${missing.toLowerCase()} ao anúncio para aumentar a efetividade de conversão.`,
      });
    }
  }

  return geminiSuggestions;
}

/**
 * Fallback quando budget insuficiente: análise heurística local.
 * Usa detecção de padrões simples para identificar elementos.
 */
function buildFallbackResult(
  text: string,
  wordCount: number,
  localFormat: AdCopyAnalysis['format']
): AdCopyAnalyzerResult {
  const textLower = text.toLowerCase();

  // Heurísticas simples de detecção
  const hasHook = /^[^\n]{1,100}[?!]/.test(text) || /^(você|atenção|pare|descubra|imagine)/i.test(text);

  const hasCTA =
    /clique|compre|garanta|saiba mais|inscreva|comece|baixe|acesse|experimente|click|buy|get|start|sign up|learn more/i.test(
      textLower
    );

  const hasOffer =
    /desconto|oferta|grátis|gratuito|bônus|bonus|promoção|% off|r\$|free|deal|special|exclusive/i.test(
      textLower
    );

  const hasUrgency =
    /última|últimas|limitad|por tempo|só hoje|agora|urgente|acaba|restam|last|limited|hurry|now|ending/i.test(
      textLower
    );

  const hasSocialProof =
    /\d+\s*(mil|k|pessoas|clientes|alunos|members|clients|customers|reviews|estrelas|stars)/i.test(
      textLower
    ) || /depoimento|testemunho|resultado|testimonial|review/i.test(textLower);

  const missingElements: string[] = [];
  if (!hasHook) missingElements.push(ELEMENT_LABELS.hook);
  if (!hasCTA) missingElements.push(ELEMENT_LABELS.cta);
  if (!hasOffer) missingElements.push(ELEMENT_LABELS.offer);
  if (!hasUrgency) missingElements.push(ELEMENT_LABELS.urgency);
  if (!hasSocialProof) missingElements.push(ELEMENT_LABELS.socialProof);

  const adCopyAnalysis: AdCopyAnalysis = {
    format: localFormat,
    hasHook,
    hasCTA,
    hasOffer,
    hasUrgency,
    hasSocialProof,
    missingElements,
  };

  const suggestions: TextSuggestion[] = missingElements.map((missing) => ({
    area: (['hook', 'cta', 'offer'].includes(
      Object.entries(ELEMENT_LABELS).find(([, v]) => v === missing)?.[0] || ''
    )
      ? (Object.entries(ELEMENT_LABELS).find(([, v]) => v === missing)?.[0] as TextSuggestion['area']) || 'body'
      : 'body') as TextSuggestion['area'],
    severity: 'improvement' as const,
    issue: `Elemento possivelmente ausente: ${missing} (análise heurística — sem IA)`,
    suggestion: `Considere adicionar ${missing.toLowerCase()} para melhorar a conversão do anúncio.`,
  }));

  return {
    adCopyAnalysis,
    suggestions,
    tokensUsed: 0,
  };
}
