export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { parseJsonBody } from '@/app/api/_utils/parse-json';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ContentCurationEngine } from '@/lib/agents/publisher/curation-engine';
import { AdaptationPipeline } from '@/lib/agents/publisher/adaptation-pipeline';
import { queryIntelligence } from '@/lib/firebase/intelligence';
import { getBrandDNA } from '@/lib/firebase/vault';
import { updateUserUsage } from '@/lib/firebase/firestore';

/**
 * POST /api/content/autopilot
 * Sprint N-5.1 — Content Autopilot
 *
 * Flow:
 * 1. Fetch insights with relevance > 0.7
 * 2. ContentCurationEngine.runCurationCycle() — creates publisher jobs
 * 3. AdaptationPipeline.adaptInsight() — adapts to multi-platform
 * 4. Results go to Review Queue in Vault
 */
export async function POST(req: NextRequest) {
  try {
    const parsed = await parseJsonBody<{
      brandId?: string;
      userId?: string;
    }>(req);

    if (!parsed.ok) {
      return createApiError(400, parsed.error);
    }

    const { brandId, userId } = parsed.data;

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    await requireBrandAccess(req, brandId);

    // 1. Check for insights with high relevance
    const { documents: insights } = await queryIntelligence({
      brandId,
      status: ['processed'],
      limit: 10,
      orderBy: 'collectedAt',
      orderDirection: 'desc',
    });

    // Filter for relevance > 0.7 (if analysis exists)
    const highRelevance = insights.filter(
      i => (i.analysis?.relevanceScore ?? 0.8) > 0.7
    );

    if (highRelevance.length === 0) {
      return createApiSuccess({
        message: 'Nenhum insight com relevância suficiente encontrado.',
        processed: 0,
        tip: 'Execute o Keywords Miner ou Spy Agent para gerar novos insights.',
      });
    }

    // 2. Run curation cycle
    const curationEngine = new ContentCurationEngine();
    const jobIds = await curationEngine.runCurationCycle(brandId);

    // 3. For each job, run adaptation
    const adaptationPipeline = new AdaptationPipeline();
    const dnaItems = await getBrandDNA(brandId);
    let adapted = 0;

    for (let i = 0; i < Math.min(jobIds.length, highRelevance.length); i++) {
      try {
        const contentId = await adaptationPipeline.adaptInsight(
          brandId,
          highRelevance[i],
          dnaItems,
          jobIds[i]
        );
        if (contentId) adapted++;
      } catch (error) {
        console.error(`[Autopilot] Adaptation failed for job ${jobIds[i]}:`, error);
      }
    }

    // 4. Deduct credits (2 per adapted content)
    if (userId && adapted > 0) {
      try {
        await updateUserUsage(userId, -(adapted * 2));
        console.log(`[Autopilot] ${adapted * 2} créditos decrementados`);
      } catch (creditError) {
        console.error('[Autopilot] Credit error:', creditError);
      }
    }

    return createApiSuccess({
      message: `Autopilot processou ${adapted} conteúdo(s) para a Review Queue.`,
      insightsFound: highRelevance.length,
      jobsCreated: jobIds.length,
      contentAdapted: adapted,
    });
  } catch (error: unknown) {
    console.error('[Autopilot] Error:', error);
    if (error instanceof ApiError) return handleSecurityError(error);
    const message = error instanceof Error ? error.message : 'Erro no Content Autopilot';
    return createApiError(500, message);
  }
}
