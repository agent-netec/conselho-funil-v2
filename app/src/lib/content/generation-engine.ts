/**
 * Content Generation Engine
 * Gera conteudo editorial em 4 formatos usando Gemini + Brand Voice.
 *
 * Flow:
 *   1. getBrand(brandId) → dados da marca
 *   2. Selecionar prompt por format
 *   3. Montar system_instruction com Brand Voice
 *   4. generateWithGemini() com responseMimeType: 'application/json'
 *   5. Parse response com Zod schema
 *   6. Retornar { content, metadata, suggestions }
 *
 * @module lib/content/generation-engine
 * @story S33-GEN-01
 */

import { Timestamp } from 'firebase/firestore';
import { generateWithGemini } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/firestore';
import {
  CONTENT_SYSTEM_INSTRUCTION,
  CONTENT_POST_PROMPT,
  CONTENT_STORY_PROMPT,
  CONTENT_CAROUSEL_PROMPT,
  CONTENT_REEL_PROMPT,
} from '@/lib/ai/prompts/content-generation';
import {
  CONTENT_SCHEMAS,
  type ContentFormat,
  type ContentGenerationParams,
  type ContentGenerationResult,
} from '@/types/content';
import { getTopEngagementExamples, formatEngagementContext } from '@/lib/content/engagement-scorer';
import { getBrandKeywords } from '@/lib/firebase/intelligence';

/** Mapa de prompts por formato */
const FORMAT_PROMPTS: Record<ContentFormat, string> = {
  post: CONTENT_POST_PROMPT,
  story: CONTENT_STORY_PROMPT,
  carousel: CONTENT_CAROUSEL_PROMPT,
  reel: CONTENT_REEL_PROMPT,
};

/**
 * Monta o system instruction com Brand Voice injetada.
 * Usa campos reais do tipo Brand (database.ts):
 *   - brand.name
 *   - brand.voiceTone
 *   - brand.positioning
 *   - brand.audience.who (target audience)
 *   - brand.brandKit?.visualStyle
 */
function buildSystemInstruction(brand: {
  name?: string;
  voiceTone?: string;
  positioning?: string;
  audience?: {
    who?: string;
    pain?: string;
  };
  brandKit?: {
    visualStyle?: string;
  };
}): string {
  const parts: string[] = [CONTENT_SYSTEM_INSTRUCTION];

  if (brand.name) parts.push(`Brand Name: ${brand.name}`);
  if (brand.voiceTone) parts.push(`Tone of Voice: ${brand.voiceTone}`);
  if (brand.positioning) parts.push(`Brand Positioning: ${brand.positioning}`);
  if (brand.audience?.who) parts.push(`Target Audience: ${brand.audience.who}`);
  if (brand.audience?.pain) parts.push(`Audience Pain Points: ${brand.audience.pain}`);
  if (brand.brandKit?.visualStyle) parts.push(`Visual Style: ${brand.brandKit.visualStyle}`);

  return parts.join('\n\n');
}

/**
 * Preenche o prompt template com os parametros fornecidos.
 */
function fillPrompt(
  template: string,
  params: ContentGenerationParams,
  brandName: string
): string {
  return template
    .replace('{topic}', params.topic)
    .replace('{platform}', params.platform)
    .replace('{brandName}', brandName)
    .replace('{tone}', params.tone || 'default brand voice')
    .replace('{keywords}', params.keywords?.join(', ') || 'none specified')
    .replace('{targetAudience}', params.targetAudience || 'general audience');
}

/**
 * Gera conteudo editorial para um formato especifico.
 *
 * @param brandId - ID da marca
 * @param params - Parametros de geracao (format, platform, topic, etc.)
 * @returns ContentGenerationResult com content, metadata, suggestions
 */
export async function generateContent(
  brandId: string,
  params: ContentGenerationParams
): Promise<ContentGenerationResult> {
  try {
    // 1. Buscar dados da marca
    const brand = await getBrand(brandId);
    if (!brand) {
      return {
        content: {},
        metadata: {
          format: params.format,
          platform: params.platform,
          model: 'none',
          generatedAt: Timestamp.now().toDate().toISOString(),
          brandId,
        },
        suggestions: ['Brand not found. Please check the brand ID.'],
        generated: false,
        error: 'brand_not_found',
      };
    }

    // 2. Selecionar prompt por formato
    const promptTemplate = FORMAT_PROMPTS[params.format];
    if (!promptTemplate) {
      return {
        content: {},
        metadata: {
          format: params.format,
          platform: params.platform,
          model: 'none',
          generatedAt: Timestamp.now().toDate().toISOString(),
          brandId,
        },
        suggestions: [`Unsupported format: ${params.format}`],
        generated: false,
        error: 'unsupported_format',
      };
    }

    // 3. Montar system instruction com Brand Voice
    const systemInstruction = buildSystemInstruction(brand);

    // 3.1 Enriquecer keywords com Intelligence Miner (se não fornecidas pelo usuário)
    let enrichedParams = params;
    try {
      const intelligenceKeywords = await getBrandKeywords(brandId, 8);
      if (intelligenceKeywords.length > 0) {
        const kwTerms = intelligenceKeywords.map(kw => kw.term);
        enrichedParams = {
          ...params,
          keywords: [...new Set([...(params.keywords || []), ...kwTerms])],
        };
      }
    } catch (err) {
      console.warn('[GenerationEngine] Failed to fetch intelligence keywords:', err);
    }

    // 4. Preencher prompt com parametros
    const filledPrompt = fillPrompt(promptTemplate, enrichedParams, brand.name || 'Brand');

    // 4.1 Injetar exemplos de alta performance (se existirem)
    const engagementExamples = await getTopEngagementExamples(brandId);
    const engagementContext = formatEngagementContext(engagementExamples);
    const enrichedPrompt = filledPrompt + engagementContext;

    // 5. Chamar Gemini com JSON mode
    const result = await generateWithGemini(enrichedPrompt, {
      responseMimeType: 'application/json',
      systemPrompt: systemInstruction,
      temperature: 0.7,
      brandId,
      feature: 'content_generation',
    });

    // 6. Parse response (generateWithGemini retorna string)
    const parsed = JSON.parse(result);

    // 7. Validar com Zod schema
    const schema = CONTENT_SCHEMAS[params.format];
    const validated = schema.parse(parsed);

    return {
      content: validated as Record<string, unknown>,
      metadata: {
        format: params.format,
        platform: params.platform,
        model: 'gemini-2.0-flash',
        generatedAt: Timestamp.now().toDate().toISOString(),
        brandId,
      },
      suggestions: generateSuggestions(params),
      generated: true,
    };
  } catch (error) {
    console.error('[GenerationEngine] Content generation failed:', error);

    // FALLBACK: NAO throw. Retorna resultado com flag generated: false (RNF-33.04)
    return {
      content: {},
      metadata: {
        format: params.format,
        platform: params.platform,
        model: 'gemini-2.0-flash',
        generatedAt: Timestamp.now().toDate().toISOString(),
        brandId,
      },
      suggestions: [
        'AI generation failed. Try again or create content manually.',
        'Consider adjusting your topic or tone for better results.',
      ],
      generated: false,
      error: 'generation_failed',
    };
  }
}

/**
 * Gera sugestoes contextuais baseadas nos parametros.
 */
function generateSuggestions(params: ContentGenerationParams): string[] {
  const suggestions: string[] = [];

  if (params.format === 'carousel' && !params.keywords?.length) {
    suggestions.push('Add keywords to improve slide topic relevance.');
  }
  if (params.format === 'reel' && params.platform !== 'instagram' && params.platform !== 'tiktok') {
    suggestions.push('Reels perform best on Instagram and TikTok.');
  }
  if (!params.tone) {
    suggestions.push('Specify a tone for more targeted content.');
  }

  return suggestions;
}
