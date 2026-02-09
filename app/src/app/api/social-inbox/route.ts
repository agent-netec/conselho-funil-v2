export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { InboxAggregator } from '@/lib/agents/engagement/inbox-aggregator';
import { BrandVoiceTranslator } from '@/lib/agents/engagement/brand-voice-translator';
import { generateSocialResponse } from '@/lib/agents/engagement/response-engine';
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { Brand } from '@/types/database';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import type { SocialInteraction } from '@/types/social-inbox';

/**
 * API Route para o Social Command Center.
 * GET /api/social-inbox?brandId=...&keyword=...
 * POST /api/social-inbox — Gera sugestoes reais via Response Engine (S32-RE-02)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');
  const keyword = searchParams.get('keyword');

  if (!brandId || !keyword) {
    return createApiError(400, 'brandId e keyword são obrigatórios');
  }

  try {
    // 1. Buscar Marca
    const brandRef = doc(db, 'brands', brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      return createApiError(404, 'Marca não encontrada');
    }

    const brandData = brandSnap.data() as Brand;

    // 2. Coletar Interações
    const aggregator = new InboxAggregator();
    const interactions = await aggregator.collectFromX(brandId, keyword);

    // 3. Gerar Sugestões para a primeira interação via Response Engine (S32-RE-02)
    let suggestions = null;

    if (interactions.length > 0) {
      suggestions = await generateSocialResponse(interactions[0], brandId);
    }

    return createApiSuccess({
      brand: brandData.name,
      interactionsCount: interactions.length,
      sampleInteraction: interactions[0] || null,
      sampleSuggestions: suggestions
    });

  } catch (error: unknown) {
    console.error('[API Social Inbox] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return createApiError(500, message);
  }
}

/**
 * POST /api/social-inbox
 * Gera sugestoes de resposta para uma interacao especifica via Response Engine.
 * Body: { brandId: string, interaction: SocialInteraction }
 * @story S32-RE-02
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { brandId, interaction } = body as { brandId?: string; interaction?: SocialInteraction };

    if (!brandId || !interaction) {
      return createApiError(400, 'brandId e interaction são obrigatórios');
    }

    if (!interaction.id) {
      return createApiError(400, 'interaction.id é obrigatório');
    }

    // Gerar sugestoes reais via Response Engine (S32-RE-02)
    const suggestions = await generateSocialResponse(interaction, brandId);

    return createApiSuccess({
      suggestions,
    });
  } catch (error: unknown) {
    console.error('[API Social Inbox POST] Error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno';
    return createApiError(500, message);
  }
}
