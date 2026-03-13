export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/content-autopilot
 * Vercel Cron: runs Content Autopilot for all active brands.
 * Every 6 hours — finds high-relevance insights, creates publisher jobs,
 * adapts them to multi-platform copy, and sends to Review Queue.
 *
 * Credits: 2 per adapted content (deducted at brand level).
 *
 * @story V1-CRON
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { ContentCurationEngine } from '@/lib/agents/publisher/curation-engine';
import { AdaptationPipeline } from '@/lib/agents/publisher/adaptation-pipeline';
import { getBrandDNA } from '@/lib/firebase/vault';
import { queryIntelligence } from '@/lib/firebase/intelligence';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = (process.env.CRON_SECRET || '').trim();

    if (!cronSecret || cronSecret.length < 8) {
      return createApiError(500, 'Internal error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    const startTime = Date.now();
    const adminDb = getAdminFirestore();

    // Find all active brands (exclude archived)
    const brandsSnap = await adminDb.collection('brands').get();
    const activeBrands = brandsSnap.docs
      .filter((d) => d.data().status !== 'archived')
      .map((d) => ({ id: d.id, data: d.data() }));

    let totalJobs = 0;
    let totalAdapted = 0;
    let totalErrors = 0;

    const curationEngine = new ContentCurationEngine();
    const adaptationPipeline = new AdaptationPipeline();

    for (const brand of activeBrands) {
      try {
        // Skip brands with autopilot explicitly disabled
        if (brand.data.vaultSettings?.autopilotEnabled === false) continue;

        // 1. Run curation cycle — finds insights + creates publisher jobs
        const jobIds = await curationEngine.runCurationCycle(brand.id);
        totalJobs += jobIds.length;

        if (jobIds.length === 0) continue;

        // 2. Fetch high-relevance insights for adaptation
        const { documents: insights } = await queryIntelligence({
          brandId: brand.id,
          status: ['processed'],
          minRelevance: 0.7,
          limit: 10,
          orderBy: 'relevanceScore',
          orderDirection: 'desc',
        });

        // 3. Fetch brand DNA for adaptation context
        const dnaItems = await getBrandDNA(brand.id);

        // 4. Run adaptation pipeline for each job
        for (let i = 0; i < Math.min(jobIds.length, insights.length); i++) {
          try {
            const contentId = await adaptationPipeline.adaptInsight(
              brand.id,
              insights[i],
              dnaItems,
              jobIds[i]
            );
            if (contentId) totalAdapted++;
          } catch (err) {
            totalErrors++;
            console.error(
              `[Cron Content Autopilot] Adaptation error for job ${jobIds[i]}:`,
              err
            );
          }
        }
      } catch (err) {
        totalErrors++;
        logger.error('[Cron Content Autopilot] Failed for brand', {
          error: err instanceof Error ? err.message : 'Unknown',
          meta: { brandId: brand.id },
        });
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('[Cron Content Autopilot] Completed', {
      route: '/api/cron/content-autopilot',
      durationMs,
      meta: {
        brandsProcessed: activeBrands.length,
        totalJobs,
        totalAdapted,
        totalErrors,
      },
    });

    // ERR-9: Return 500 if failure rate > 50%
    const totalProcessed = totalAdapted + totalErrors;
    if (totalProcessed > 0 && totalErrors / totalProcessed > 0.5) {
      return createApiError(500, `High failure rate: ${totalErrors}/${totalProcessed} failed`);
    }

    return createApiSuccess({
      brandsProcessed: activeBrands.length,
      totalJobs,
      totalAdapted,
      totalErrors,
      durationMs,
    });
  } catch (error) {
    logger.error('[Cron Content Autopilot] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return createApiError(
      500,
      error instanceof Error ? error.message : 'Internal server error'
    );
  }
}
