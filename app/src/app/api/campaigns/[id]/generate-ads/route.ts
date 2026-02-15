export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { doc, getDoc, updateDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { CampaignContext } from '@/types/campaign';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { updateUserUsage } from '@/lib/firebase/firestore';
import { generateAds } from '@/lib/intelligence/creative-engine/ad-generator';
import { buildAdsBrainContext } from '@/lib/ai/prompts/ads-brain-context';
import { ragQuery, retrieveBrandChunks, formatBrandContextForLLM } from '@/lib/ai/rag';
import { GENERATION_LIMITS } from '@/types/creative-ads';
import type { UXIntelligence } from '@/types/intelligence';

export const runtime = 'nodejs';
export const maxDuration = 90;

/**
 * POST /api/campaigns/[id]/generate-ads
 *
 * Sprint H: Proxy leve que extrai campaign context,
 * chama o pipeline canônico (generateAds) com brain+RAG+brand,
 * e atualiza o doc da campaign.
 *
 * Custo unificado: 5 créditos.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    let userId: string | undefined;
    try {
      const body = await request.json();
      userId = body?.userId;
    } catch {
      // No request body or invalid JSON
    }

    if (!campaignId) {
      return createApiError(400, 'Campaign ID is required');
    }

    // 1. Get campaign context
    const campaignRef = doc(db, 'campaigns', campaignId);
    const campaignSnap = await getDoc(campaignRef);

    if (!campaignSnap.exists()) {
      return createApiError(404, 'Campaign not found');
    }

    const campaign = { id: campaignSnap.id, ...campaignSnap.data() } as CampaignContext;
    const brandId = campaign.brandId;

    // 2. Build synthetic elite assets from campaign data
    const eliteAssets = buildEliteAssetsFromCampaign(campaign);

    // 3. Load brain + RAG + brand context (graceful degradation)
    let brainContext = '';
    let ragContext = '';
    let brandContext = '';

    try {
      brainContext = buildAdsBrainContext();
    } catch (e) {
      console.warn('[Campaigns/GenerateAds] Brain context failed:', e);
    }

    try {
      const ragSearchQuery = `Estratégias de tráfego pago, segmentação e escala para ${campaign.funnel?.mainGoal} focado em ${campaign.funnel?.targetAudience}`;
      const { context } = await ragQuery(ragSearchQuery, {
        topK: 12,
        minSimilarity: 0.2,
        filters: { scope: 'traffic' },
      });
      ragContext = context;
    } catch (e) {
      console.warn('[Campaigns/GenerateAds] RAG context failed:', e);
    }

    if (brandId) {
      try {
        const brandChunks = await retrieveBrandChunks(brandId, 'estratégia de anúncios e conversão', 5);
        if (brandChunks.length > 0) {
          brandContext = formatBrandContextForLLM(brandChunks);
        }
      } catch (e) {
        console.warn('[Campaigns/GenerateAds] Brand context failed:', e);
      }
    }

    // 4. Call canonical generateAds pipeline
    // lightMode: skip CPS PRO scoring + brand voice validation to stay within Vercel timeout
    const result = await generateAds(
      brandId || campaignId,
      eliteAssets,
      ['meta_feed', 'meta_stories'],
      {
        maxVariations: 3,
        minToneMatch: GENERATION_LIMITS.minToneMatchDefault,
        brainContext,
        ragContext,
        brandContext,
        lightMode: true,
      },
      userId || 'system'
    );

    // 5. Update campaign doc with generated ads
    await updateDoc(campaignRef, {
      ads: result.ads,
      adsMetadata: {
        totalGenerated: result.totalGenerated,
        avgCPS: result.avgCPS,
        frameworksApplied: result.frameworksApplied,
      },
      updatedAt: Timestamp.now(),
    });

    // 6. Also persist to brands/{brandId}/generated_ads (unified persistence)
    if (brandId) {
      try {
        const generatedAdsRef = collection(db, 'brands', brandId, 'generated_ads');
        await addDoc(generatedAdsRef, {
          brandId,
          campaignId,
          ads: result.ads,
          metadata: {
            totalGenerated: result.totalGenerated,
            avgCPS: result.avgCPS,
            frameworksApplied: result.frameworksApplied,
          },
          createdAt: Timestamp.now(),
          expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        });
      } catch (e) {
        console.error('[Campaigns/GenerateAds] Persistence to brand collection failed:', e);
      }
    }

    console.log(`[Campaigns/GenerateAds] Ads generated for campaign ${campaignId}`);

    // 7. Sprint H: Decrementar 5 créditos (custo unificado)
    if (userId) {
      try {
        await updateUserUsage(userId, -5);
        console.log(`[Campaigns/GenerateAds] 5 créditos decrementados para usuário: ${userId}`);
      } catch (creditError) {
        console.error('[Campaigns/GenerateAds] Erro ao atualizar créditos:', creditError);
      }
    }

    return createApiSuccess({
      ads: result.ads,
      metadata: {
        totalGenerated: result.totalGenerated,
        avgCPS: result.avgCPS,
        frameworksApplied: result.frameworksApplied,
      },
    });
  } catch (error) {
    console.error('Ads generation error:', error);
    return createApiError(500, 'Failed to generate ads strategy', { details: String(error) });
  }
}

/**
 * Builds synthetic UXIntelligence from campaign context
 * so that the canonical generateAds pipeline can process it.
 */
function buildEliteAssetsFromCampaign(campaign: CampaignContext): UXIntelligence {
  const headlines = (campaign.copywriting?.headlines || []).map((text, i) => ({
    text,
    type: 'headline' as const,
    relevanceScore: 0.9 - i * 0.05,
  }));

  const hooks = (campaign.social?.hooks || []).map((h, i) => ({
    text: typeof h === 'string' ? h : h.content || '',
    type: 'hook' as const,
    relevanceScore: 0.85 - i * 0.05,
  }));

  const ctas = (campaign.copywriting?.keyBenefits || []).slice(0, 3).map((text, i) => ({
    text,
    type: 'cta' as const,
    relevanceScore: 0.8 - i * 0.05,
  }));

  // Ensure at least one asset exists
  if (headlines.length === 0 && hooks.length === 0 && ctas.length === 0) {
    headlines.push({
      text: campaign.copywriting?.bigIdea || campaign.funnel?.mainGoal || 'Descubra mais',
      type: 'headline' as const,
      relevanceScore: 0.7,
    });
  }

  return {
    headlines,
    ctas,
    hooks,
    visualElements: [],
    funnelStructure: campaign.funnel
      ? `${campaign.funnel.type || 'generic'}: ${campaign.funnel.mainGoal || ''}`
      : undefined,
  };
}
