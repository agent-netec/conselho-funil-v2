export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { InboxAggregator } from '@/lib/agents/engagement/inbox-aggregator';
import { generateSocialResponse } from '@/lib/agents/engagement/response-engine';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, collection, getDocs, query, orderBy, limit as firestoreLimit } from 'firebase/firestore';
import { Brand } from '@/types/database';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import type { SocialInteraction } from '@/types/social-inbox';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

/**
 * API Route para o Social Command Center.
 * GET /api/social-inbox?brandId=...&keyword=...&platform=...&status=...
 *   - First tries Firestore (synced by cron/social-sync — V-1.4)
 *   - Falls back to InboxAggregator if no synced data
 * POST /api/social-inbox — Gera sugestoes reais via Response Engine (S32-RE-02)
 *
 * @story V-1.1 (upgraded from S32)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');
  const keyword = searchParams.get('keyword');
  const platformFilter = searchParams.get('platform');
  const statusFilter = searchParams.get('status');

  if (!brandId) {
    return createApiError(400, 'brandId é obrigatório');
  }

  // Auth guard: verify user has access to this brand
  try {
    await requireBrandAccess(request as NextRequest, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    // 1. Buscar Marca
    const brandRef = doc(db, 'brands', brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      return createApiError(404, 'Marca não encontrada');
    }

    const brandData = brandSnap.data() as Brand;

    // 2. Try Firestore first (synced by cron — V-1.4)
    let interactions: SocialInteraction[] = [];

    try {
      const interactionsRef = collection(db, 'brands', brandId, 'social_interactions');
      const q = query(interactionsRef, orderBy('syncedAt', 'desc'), firestoreLimit(50));

      const snap = await getDocs(q);
      interactions = snap.docs.map((d) => d.data() as SocialInteraction);

      // Apply filters in-memory
      if (platformFilter) {
        interactions = interactions.filter((i) => i.platform === platformFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        interactions = interactions.filter((i) => i.status === statusFilter);
      }
      if (keyword) {
        const kw = keyword.toLowerCase();
        interactions = interactions.filter(
          (i) =>
            i.content.text.toLowerCase().includes(kw) ||
            i.author.handle.toLowerCase().includes(kw) ||
            i.metadata.tags.some((t) => t.toLowerCase().includes(kw))
        );
      }
    } catch (err) {
      console.warn('[API Social Inbox] Firestore query failed, falling back to aggregator:', err);
    }

    // 3. Fallback to InboxAggregator if no synced data
    if (interactions.length === 0 && keyword) {
      const aggregator = new InboxAggregator();
      interactions = await aggregator.collectFromX(brandId, keyword);
    }

    // 4. Generate suggestions for first interaction
    let suggestions = null;
    if (interactions.length > 0) {
      suggestions = await generateSocialResponse(interactions[0], brandId);
    }

    return createApiSuccess({
      brand: brandData.name,
      interactionsCount: interactions.length,
      interactions: interactions.slice(0, 50),
      sampleInteraction: interactions[0] || null,
      sampleSuggestions: suggestions,
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

    // Auth guard: verify user has access to this brand
    try {
      await requireBrandAccess(request as NextRequest, brandId);
    } catch (err: any) {
      return handleSecurityError(err);
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
