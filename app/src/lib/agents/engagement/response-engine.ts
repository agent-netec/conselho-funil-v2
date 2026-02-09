/**
 * Social Response Engine
 * Gera sugestoes de resposta para interacoes sociais usando Gemini + Brand Voice.
 *
 * @module lib/agents/engagement/response-engine
 * @story S32-RE-01
 */

import { z } from 'zod';
import { generateWithGemini } from '@/lib/ai/gemini';
import { SOCIAL_RESPONSE_PROMPT } from '@/lib/ai/prompts/social-generation';
import type { SocialInteraction, BrandVoiceSuggestion } from '@/types/social-inbox';

// Zod schema para validar output do Gemini
const ResponseOptionSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(['friendly', 'professional', 'casual', 'empathetic', 'witty']),
  goal: z.string().min(1),
  confidence: z.number().min(0).max(1),
});

const GeminiResponseSchema = z.object({
  options: z.array(ResponseOptionSchema).min(1).max(5),
});

/**
 * Busca brand voice guidelines usando getBrand().
 * RAG context = APENAS voice guidelines (DT-07 — sem historico de autor).
 */
async function getBrandVoiceContext(brandId: string): Promise<string> {
  try {
    // Import dinamico para evitar circular deps
    const { getBrand } = await import('@/lib/firebase/brands');
    const brand = await getBrand(brandId);

    if (!brand) return 'No brand voice guidelines available. Use a professional, helpful tone.';

    const parts: string[] = [];
    if (brand.voiceTone) parts.push(`Tone: ${brand.voiceTone}`);
    if (brand.positioning) parts.push(`Positioning: ${brand.positioning}`);
    if (brand.audience?.who) parts.push(`Audience: ${brand.audience.who}`);
    if (brand.audience?.pain) parts.push(`Pain points: ${brand.audience.pain}`);
    if (brand.offer?.what) parts.push(`Offer: ${brand.offer.what}`);

    return parts.length > 0
      ? parts.join('\n')
      : 'No specific brand voice defined. Use a professional, helpful tone.';
  } catch (error) {
    console.error('[ResponseEngine] Failed to fetch brand voice context:', error);
    return 'No brand voice guidelines available. Use a professional, helpful tone.';
  }
}

/**
 * Gera sugestoes de resposta para uma interacao social.
 * Usa Gemini com responseMimeType: 'application/json' (DT-06).
 * Valida output com Zod schema.
 * Fallback: se parse falhar, gera sugestao generica com confidence: 0.5.
 *
 * @param interaction - A interacao social para responder
 * @param brandId - ID da marca (para buscar voice guidelines — DT-07)
 * @returns BrandVoiceSuggestion com opcoes de resposta
 */
export async function generateSocialResponse(
  interaction: SocialInteraction,
  brandId: string
): Promise<BrandVoiceSuggestion> {
  const brandVoiceGuidelines = await getBrandVoiceContext(brandId);

  const filledPrompt = SOCIAL_RESPONSE_PROMPT
    .replace('{platform}', interaction.platform || 'unknown')
    .replace('{type}', interaction.type || 'message')
    .replace('{content}', interaction.content?.text || '')
    .replace('{authorName}', interaction.author?.name || 'Unknown')
    .replace('{brandVoiceGuidelines}', brandVoiceGuidelines);

  try {
    const result = await generateWithGemini(filledPrompt, {
      responseMimeType: 'application/json',
    });

    const rawText = typeof result === 'string' ? result : '';
    const parsed = JSON.parse(rawText);
    const validated = GeminiResponseSchema.parse(parsed);

    return {
      id: `suggestion_${interaction.id}_${Date.now()}`,
      interactionId: interaction.id,
      options: validated.options,
      contextUsed: {
        brandKitVersion: 'v1-gemini',
        historyDepth: 0, // DT-07: sem historico de autor
      },
    };
  } catch (error) {
    console.error('[ResponseEngine] Gemini response parse failed, using fallback:', error);

    // Fallback: sugestao generica com confidence 0.5
    return {
      id: `suggestion_${interaction.id}_fallback`,
      interactionId: interaction.id,
      options: [
        {
          text: 'Thank you for reaching out! We appreciate your message and will get back to you shortly.',
          tone: 'professional',
          goal: 'engage',
          confidence: 0.5,
        },
        {
          text: 'Hi there! Thanks for your message. How can we help you today?',
          tone: 'friendly',
          goal: 'engage',
          confidence: 0.5,
        },
        {
          text: 'Hey! Got your message. Let me look into that for you.',
          tone: 'casual',
          goal: 'engage',
          confidence: 0.5,
        },
      ],
      contextUsed: {
        brandKitVersion: 'v1-fallback',
        historyDepth: 0,
      },
    };
  }
}
