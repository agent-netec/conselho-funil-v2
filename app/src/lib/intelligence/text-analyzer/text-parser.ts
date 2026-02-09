/**
 * Text Parser — Generic UXIntelligence Extractor
 * Sprint 25 · S25-ST-07
 *
 * Parser genérico para texto colado pelo usuário.
 * Extrai Headlines, CTAs, Hooks e gera StructuralAnalysis.
 * Detecção de idioma automática (pt/en/es).
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 5
 * @token_budget 6.000 tokens (tag: analyze_text)
 */

import { UXIntelligence, UXAsset } from '@/types/intelligence';
import {
  TextInputType,
  TextInputFormat,
  TextSuggestion,
  StructuralAnalysis,
} from '@/types/text-analysis';
import { generateWithGemini } from '@/lib/ai/gemini';
import { AICostGuard } from '@/lib/ai/cost-guard';
import { sanitizeTextInput, stripSubtitleTimestamps } from './sanitizer';
import { parseVSLTranscript } from './vsl-parser';
import { analyzeAdCopy } from './ad-copy-analyzer';

// ═══════════════════════════════════════════════════════
// CONSTANTES
// ═══════════════════════════════════════════════════════

const FEATURE_TAG = 'analyze_text';
const TOKEN_BUDGET = 6000;

// ═══════════════════════════════════════════════════════
// INTERFACES INTERNAS
// ═══════════════════════════════════════════════════════

export interface TextParserInput {
  text: string;
  textType: TextInputType;
  format?: TextInputFormat;
  brandId: string;
  userId: string;
  options?: {
    includeSuggestions?: boolean;
    detectLanguage?: boolean;
  };
}

export interface TextParserResult {
  uxIntelligence: UXIntelligence;
  suggestions: TextSuggestion[];
  structuralAnalysis: StructuralAnalysis;
  detectedLanguage?: string;
  tokensUsed: number;
  modelUsed: string;
}

interface GeminiTextAnalysisResponse {
  headlines: Array<{
    text: string;
    relevanceScore: number;
    location?: string;
    angle?: string;
    psychologicalTriggers?: string[];
  }>;
  ctas: Array<{
    text: string;
    relevanceScore: number;
    location?: string;
  }>;
  hooks: Array<{
    text: string;
    relevanceScore: number;
    location?: string;
  }>;
  funnelStructure?: string;
  detectedLanguage?: string;
  suggestions?: Array<{
    area: string;
    severity: string;
    issue: string;
    suggestion: string;
    rewritten?: string;
  }>;
  structuralAnalysis: {
    readabilityScore: number;
  };
}

// ═══════════════════════════════════════════════════════
// PROMPT BUILDER
// ═══════════════════════════════════════════════════════

function buildTextAnalysisPrompt(
  text: string,
  textType: TextInputType,
  includeSuggestions: boolean,
  detectLanguage: boolean
): string {
  const typeContext: Record<TextInputType, string> = {
    vsl_transcript:
      'Este texto é uma transcrição de VSL (Video Sales Letter). Foque em identificar o hook de abertura, pontos de oferta e a estrutura narrativa.',
    ad_copy:
      'Este texto é um anúncio existente. Foque em identificar headline, CTA, oferta, urgência e provas sociais.',
    landing_page:
      'Este texto é o conteúdo de uma landing page. Foque em headlines, CTAs, ofertas e estrutura do funil.',
    general:
      'Este é um texto genérico de marketing/copywriting. Extraia os elementos persuasivos presentes.',
  };

  return `Você é um especialista em copywriting e conversão digital, treinado nas metodologias de Eugene Schwartz, Gary Halbert e Russell Brunson.

Analise o seguinte texto e extraia todos os elementos persuasivos relevantes.

## Contexto
Tipo de texto: **${textType}**
${typeContext[textType]}

## Texto para Análise
---
${text}
---

## Sua Tarefa

Extraia e classifique os seguintes elementos:

1. **Headlines**: Títulos, subtítulos, frases de destaque que capturam atenção
2. **CTAs (Call to Action)**: Chamadas para ação explícitas ou implícitas
3. **Hooks**: Ganchos de abertura, frases que interrompem padrão, elementos de curiosidade
4. **Estrutura do Funil**: Descreva brevemente a estrutura narrativa identificada

Para cada elemento:
- Atribua um **relevanceScore** de 0.0 a 1.0 (1.0 = extremamente relevante/efetivo)
- Indique a **location** aproximada (ex: "abertura", "meio", "fechamento")

${detectLanguage ? '5. **Idioma**: Detecte o idioma principal do texto (pt, en, ou es)' : ''}

${
  includeSuggestions
    ? `6. **Sugestões**: Para cada área fraca, gere sugestões de melhoria:
   - area: headline | cta | hook | body | offer | structure
   - severity: critical | improvement | optional
   - issue: o problema detectado
   - suggestion: sugestão concreta
   - rewritten: trecho reescrito (quando aplicável)`
    : ''
}

## Formato de Resposta (JSON)

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown:

{
  "headlines": [
    { "text": "...", "relevanceScore": 0.8, "location": "abertura", "angle": "curiosidade", "psychologicalTriggers": ["scarcity"] }
  ],
  "ctas": [
    { "text": "...", "relevanceScore": 0.9, "location": "fechamento" }
  ],
  "hooks": [
    { "text": "...", "relevanceScore": 0.7, "location": "abertura" }
  ],
  "funnelStructure": "Descrição breve da estrutura narrativa",
  ${detectLanguage ? '"detectedLanguage": "pt",' : ''}
  ${includeSuggestions ? '"suggestions": [ { "area": "headline", "severity": "improvement", "issue": "...", "suggestion": "...", "rewritten": "..." } ],' : ''}
  "structuralAnalysis": {
    "readabilityScore": 72
  }
}

REGRAS:
- Se não encontrar headlines/CTAs/hooks, retorne arrays vazios.
- relevanceScore deve ser realista (não inflar scores).
- readabilityScore: 0-100 (adaptação simplificada do Flesch para o idioma detectado).
- Retorne SOMENTE JSON válido.`;
}

// ═══════════════════════════════════════════════════════
// TEXT PARSER
// ═══════════════════════════════════════════════════════

/**
 * Analisa texto bruto e extrai UXIntelligence + StructuralAnalysis.
 *
 * Pipeline:
 *  1. Pré-processar formato (strip timestamps para SRT/VTT)
 *  2. Sanitizar via sanitizer.ts (RT-03)
 *  3. Calcular word count
 *  4. Verificar budget via cost-guard
 *  5. Enviar para Gemini com prompt especializado
 *  6. Parsear e retornar resultado
 *
 * @param input - TextParserInput com texto e configurações
 * @returns TextParserResult com UXIntelligence, suggestions e analysis
 * @throws Error com código específico (TEXT_TOO_LONG, TEXT_TOO_SHORT, etc.)
 */
export async function parseText(input: TextParserInput): Promise<TextParserResult> {
  const {
    text,
    textType,
    format,
    brandId,
    userId,
    options,
  } = input;

  const includeSuggestions = options?.includeSuggestions !== false;
  const detectLanguage = options?.detectLanguage !== false;

  // 1. Pré-processar formato (SRT/VTT → texto limpo)
  let processedText = text;
  if (format === 'srt' || format === 'vtt') {
    processedText = stripSubtitleTimestamps(processedText);
  }

  // 2. Sanitizar (RT-03) — OBRIGATÓRIO antes de qualquer processamento
  const sanitizeResult = sanitizeTextInput(processedText);
  if (!sanitizeResult.valid) {
    throw new Error(sanitizeResult.error || 'VALIDATION_ERROR');
  }

  const sanitizedText = sanitizeResult.sanitized;

  // 3. Calcular word count
  const wordCount = sanitizedText.split(/\s+/).filter(Boolean).length;

  // 4. Verificar budget
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

  // 5. Montar prompt e chamar Gemini
  const prompt = buildTextAnalysisPrompt(
    sanitizedText,
    textType,
    includeSuggestions,
    detectLanguage
  );

  const rawResponse = await generateWithGemini(prompt, {
    model,
    temperature: 0.3,
    maxOutputTokens: TOKEN_BUDGET,
    responseMimeType: 'application/json',
    userId,
    brandId,
    feature: FEATURE_TAG,
  });

  // 6. Parsear resposta
  const parsed = parseGeminiTextResponse(rawResponse);

  // 7. Construir resultado
  const uxIntelligence = buildUXIntelligence(parsed);

  const suggestions: TextSuggestion[] = includeSuggestions
    ? buildSuggestions(parsed.suggestions || [])
    : [];

  const structuralAnalysis: StructuralAnalysis = {
    wordCount,
    readabilityScore: clamp(parsed.structuralAnalysis?.readabilityScore ?? 50, 0, 100),
  };

  let totalTokensUsed = AICostGuard.estimateTokens(prompt + rawResponse);

  // 8. Parsers especializados — VSL Transcript (ST-08)
  if (textType === 'vsl_transcript') {
    try {
      const vslResult = await parseVSLTranscript({
        sanitizedText,
        brandId,
        userId,
        wordCount,
      });
      structuralAnalysis.vslStructure = vslResult.vslStructure;
      suggestions.push(...vslResult.suggestions);
      totalTokensUsed += vslResult.tokensUsed;
    } catch (vslError) {
      console.warn(
        '[TextParser] VSL parser falhou (graceful degradation):',
        vslError instanceof Error ? vslError.message : vslError
      );
    }
  }

  // 9. Parsers especializados — Ad Copy Analyzer (ST-09)
  if (textType === 'ad_copy') {
    try {
      const adCopyResult = await analyzeAdCopy({
        sanitizedText,
        brandId,
        userId,
        wordCount,
      });
      structuralAnalysis.adCopyAnalysis = adCopyResult.adCopyAnalysis;
      suggestions.push(...adCopyResult.suggestions);
      totalTokensUsed += adCopyResult.tokensUsed;
    } catch (adCopyError) {
      console.warn(
        '[TextParser] Ad Copy analyzer falhou (graceful degradation):',
        adCopyError instanceof Error ? adCopyError.message : adCopyError
      );
    }
  }

  return {
    uxIntelligence,
    suggestions,
    structuralAnalysis,
    detectedLanguage: parsed.detectedLanguage,
    tokensUsed: totalTokensUsed,
    modelUsed: model,
  };
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Parseia a resposta JSON do Gemini com fallback para limpeza.
 */
function parseGeminiTextResponse(raw: string): GeminiTextAnalysisResponse {
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
    const parsed = JSON.parse(jsonStr.trim()) as GeminiTextAnalysisResponse;

    // Garantir arrays existem
    if (!Array.isArray(parsed.headlines)) parsed.headlines = [];
    if (!Array.isArray(parsed.ctas)) parsed.ctas = [];
    if (!Array.isArray(parsed.hooks)) parsed.hooks = [];

    return parsed;
  } catch (error) {
    console.error('[TextParser] Falha ao parsear resposta do Gemini:', raw);
    throw new Error(
      `ANALYSIS_ERROR: Falha ao processar resposta da IA. ${error instanceof Error ? error.message : ''}`
    );
  }
}

/**
 * Converte a resposta do Gemini em UXIntelligence.
 */
function buildUXIntelligence(parsed: GeminiTextAnalysisResponse): UXIntelligence {
  const headlines: UXAsset[] = parsed.headlines.map((h) => ({
    text: h.text,
    type: 'headline' as const,
    location: h.location,
    relevanceScore: clamp(h.relevanceScore, 0, 1),
    copyAnalysis: h.angle
      ? {
          angle: h.angle,
          psychologicalTrigger: h.psychologicalTriggers || [],
        }
      : undefined,
  }));

  const ctas: UXAsset[] = parsed.ctas.map((c) => ({
    text: c.text,
    type: 'cta' as const,
    location: c.location,
    relevanceScore: clamp(c.relevanceScore, 0, 1),
  }));

  const hooks: UXAsset[] = parsed.hooks.map((h) => ({
    text: h.text,
    type: 'hook' as const,
    location: h.location,
    relevanceScore: clamp(h.relevanceScore, 0, 1),
  }));

  return {
    headlines,
    ctas,
    hooks,
    funnelStructure: parsed.funnelStructure,
  };
}

/**
 * Converte sugestões brutas do Gemini em TextSuggestion[].
 */
function buildSuggestions(
  raw: Array<{
    area: string;
    severity: string;
    issue: string;
    suggestion: string;
    rewritten?: string;
  }>
): TextSuggestion[] {
  const validAreas = ['headline', 'cta', 'hook', 'body', 'offer', 'structure'] as const;
  const validSeverities = ['critical', 'improvement', 'optional'] as const;

  return raw
    .filter((s) => s.area && s.issue && s.suggestion)
    .map((s) => ({
      area: (validAreas.includes(s.area as typeof validAreas[number])
        ? s.area
        : 'body') as TextSuggestion['area'],
      severity: (validSeverities.includes(s.severity as typeof validSeverities[number])
        ? s.severity
        : 'improvement') as TextSuggestion['severity'],
      issue: s.issue,
      suggestion: s.suggestion,
      rewritten: s.rewritten,
    }));
}

/**
 * Clampa um valor entre min e max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
