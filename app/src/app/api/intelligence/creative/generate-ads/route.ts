export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError } from '@/lib/utils/api-response';
import { generateAds } from '@/lib/intelligence/creative-engine/ad-generator';
import {
  GenerateAdsRequest,
  GenerateAdsResponse,
  AdFormat,
  GENERATION_LIMITS,
} from '@/types/creative-ads';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { buildAdsBrainContext } from '@/lib/ai/prompts/ads-brain-context';
import { ragQuery, retrieveBrandChunks, formatBrandContextForLLM } from '@/lib/ai/rag';
import { updateUserUsage } from '@/lib/firebase/firestore';

/**
 * POST /api/intelligence/creative/generate-ads
 *
 * Gera 3-5 variações de anúncio multi-formato a partir de Elite Assets,
 * com CPS estimado por variação e rastreabilidade de frameworks.
 *
 * @contract arch-sprint-25-predictive-creative-engine.md § 4
 * @token_budget 8.000 tokens (tag: generate_ads)
 * @rate_limit 10 req/min por brandId
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse body
    const parsed = await parseJsonBody<GenerateAdsRequest>(req);
    if (!parsed.ok) {
      return createApiError(400, parsed.error, { code: 'VALIDATION_ERROR' });
    }

    const body = parsed.data;
    const { brandId, sourceUrl, eliteAssets, formats, audienceLevel, options } = body;

    // 2. Validação de campos obrigatórios
    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.', { code: 'VALIDATION_ERROR' });
    }

    if (!eliteAssets) {
      return createApiError(400, 'eliteAssets é obrigatório.', { code: 'VALIDATION_ERROR' });
    }

    // 3. Validar que eliteAssets tem ao menos headlines, CTAs ou hooks
    const hasHeadlines = eliteAssets.headlines?.length > 0;
    const hasCtas = eliteAssets.ctas?.length > 0;
    const hasHooks = eliteAssets.hooks?.length > 0;

    if (!hasHeadlines && !hasCtas && !hasHooks) {
      return createApiError(400, 'eliteAssets deve conter ao menos headlines, CTAs ou hooks.', { code: 'EMPTY_ASSETS' });
    }

    // 4. Validar formatos
    if (!formats || !Array.isArray(formats) || formats.length === 0) {
      return createApiError(400, 'formats é obrigatório e deve conter ao menos um formato.', { code: 'VALIDATION_ERROR' });
    }

    const validFormats: AdFormat[] = ['meta_feed', 'meta_stories', 'google_search'];
    const invalidFormats = formats.filter((f) => !validFormats.includes(f));
    if (invalidFormats.length > 0) {
      return createApiError(400, `Formatos inválidos: ${invalidFormats.join(', ')}. Válidos: ${validFormats.join(', ')}`, { code: 'INVALID_FORMAT' });
    }

    // 5. Auth — requireBrandAccess
    const { userId, brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // 6. Sprint H: Load brain + RAG + brand context
    let brainContext = '';
    let ragContext = '';
    let brandContext = '';

    try {
      brainContext = buildAdsBrainContext();
    } catch (e) {
      console.warn('[GENERATE_ADS] Brain context failed, continuing without:', e);
    }

    try {
      const ragSearchQuery = `Estratégias de anúncios, copywriting e conversão para tráfego pago`;
      const { context } = await ragQuery(ragSearchQuery, {
        topK: 12,
        minSimilarity: 0.2,
        filters: { scope: 'traffic' },
      });
      ragContext = context;
    } catch (e) {
      console.warn('[GENERATE_ADS] RAG context failed, continuing without:', e);
    }

    try {
      const brandChunks = await retrieveBrandChunks(safeBrandId, 'estratégia de anúncios e conversão', 5);
      if (brandChunks.length > 0) {
        brandContext = formatBrandContextForLLM(brandChunks);
      }
    } catch (e) {
      console.warn('[GENERATE_ADS] Brand context failed, continuing without:', e);
    }

    // 7. Executar Ad Generation Pipeline (com brain + RAG + brand)
    const result = await generateAds(
      safeBrandId,
      eliteAssets,
      formats,
      {
        maxVariations: options?.maxVariations,
        audienceLevel,
        minToneMatch: options?.minToneMatch ?? GENERATION_LIMITS.minToneMatchDefault,
        preferredFrameworks: options?.preferredFrameworks,
        includeImageSuggestions: options?.includeImageSuggestions,
        brainContext,
        ragContext,
        brandContext,
      },
      userId
    );

    // 8. Sprint H: Decrementar 5 créditos (custo unificado)
    try {
      await updateUserUsage(userId, -5);
      console.log(`[GENERATE_ADS] 5 créditos decrementados para usuário: ${userId}`);
    } catch (creditError) {
      console.error('[GENERATE_ADS] Erro ao atualizar créditos:', creditError);
    }

    // 9. Persistir no Firestore: brands/{brandId}/generated_ads (TTL: 30 dias)
    await persistGeneratedAds(safeBrandId, sourceUrl, result);

    // 10. Montar resposta
    const processingTimeMs = Date.now() - startTime;

    const response: GenerateAdsResponse = {
      success: true,
      brandId: safeBrandId,
      ads: result.ads,
      metadata: {
        totalGenerated: result.totalGenerated,
        totalRejected: result.totalRejected,
        avgCPS: result.avgCPS,
        eliteAssetsUsed: result.eliteAssetsUsed,
        tokensUsed: result.tokensUsed,
        processingTimeMs,
        frameworksApplied: result.frameworksApplied,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('[GENERATE_ADS_ERROR]:', error);

    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }

    const message = error instanceof Error ? error.message : 'Erro interno ao gerar anúncios.';

    // Mapear erros internos para códigos HTTP
    if (message.includes('EMPTY_ASSETS')) {
      return createApiError(400, message, { code: 'EMPTY_ASSETS' });
    }
    if (message.includes('INVALID_FORMAT')) {
      return createApiError(400, message, { code: 'INVALID_FORMAT' });
    }
    if (message.includes('Budget limit')) {
      return createApiError(429, 'Limite de uso atingido.', { code: 'RATE_LIMITED' });
    }
    if (message.includes('GENERATION_ERROR')) {
      return createApiError(500, message, { code: 'GENERATION_ERROR' });
    }

    return createApiError(500, message, { code: 'GENERATION_ERROR' });
  }
}

// ═══════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════

/**
 * Persiste os anúncios gerados no Firestore.
 * Collection: brands/{brandId}/generated_ads
 * TTL: 30 dias
 */
async function persistGeneratedAds(
  brandId: string,
  sourceUrl: string | undefined,
  result: import('@/lib/intelligence/creative-engine/ad-generator').GenerateAdsResult
): Promise<string> {
  try {
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
    );

    const generatedAdsRef = collection(db, 'brands', brandId, 'generated_ads');
    const docRef = await addDoc(generatedAdsRef, {
      brandId,
      sourceUrl: sourceUrl || null,
      ads: result.ads,
      metadata: {
        totalGenerated: result.totalGenerated,
        avgCPS: result.avgCPS,
        frameworksApplied: result.frameworksApplied,
      },
      createdAt: now,
      expiresAt,
    });

    return docRef.id;
  } catch (error) {
    // Não-bloqueante: se persistência falhar, log e continue
    console.error('[GENERATE_ADS] Erro ao persistir no Firestore:', error);
    return 'persistence-failed';
  }
}
