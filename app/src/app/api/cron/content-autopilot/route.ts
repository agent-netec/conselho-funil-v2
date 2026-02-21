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
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ContentCurationEngine } from '@/lib/agents/publisher/curation-engine';
import { AdaptationPipeline } from '@/lib/agents/publisher/adaptation-pipeline';
import { getBrandDNA } from '@/lib/firebase/vault';
import { queryIntelligence } from '@/lib/firebase/intelligence';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = (process.env.CRON_SECRET || '').trim();

    if (!cronSecret) {
      return createApiError(500, 'Cron configuration error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    const startTime = Date.now();

    // Find all active brands (exclude archived)
    const brandsSnap = await getDocs(collection(db, 'brands'));
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
