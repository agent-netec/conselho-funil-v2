export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/content-metrics
 * Vercel Cron: fetches post-publish metrics for all published calendar items.
 * Runs daily at 6 AM UTC.
 *
 * @story V-2.4
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { collection, getDocs, query, where, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { fetchMediaInsights } from '@/lib/integrations/social/instagram-graph';
import { fetchLinkedInPostMetrics } from '@/lib/integrations/social/linkedin-graph';
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

    // Find all brands
    const brandsSnap = await getDocs(collection(db, 'brands'));
    const brandIds = brandsSnap.docs.map((d) => d.id);

    let totalUpdated = 0;
    let totalErrors = 0;

    for (const brandId of brandIds) {
      try {
        // Find published calendar items with externalId
        const calendarRef = collection(db, 'brands', brandId, 'content_calendar');
        const q = query(calendarRef, where('status', '==', 'published'));
        const snap = await getDocs(q);

        for (const d of snap.docs) {
          const item = d.data();
          const externalId = item.metadata?.externalId;
          const platform = item.metadata?.platform || item.platform;

          if (!externalId) continue;

          try {
            let metrics: Record<string, number> = {};

            if (platform === 'instagram') {
              const igMetrics = await fetchMediaInsights(brandId, externalId);
              metrics = { ...igMetrics };
            } else if (platform === 'linkedin') {
              const liMetrics = await fetchLinkedInPostMetrics(brandId, externalId);
              metrics = { ...liMetrics };
            } else {
              continue;
            }

            // Update calendar item with metrics
            const itemRef = doc(db, 'brands', brandId, 'content_calendar', d.id);
            await updateDoc(itemRef, {
              'metadata.metrics': metrics,
              'metadata.metricsUpdatedAt': Timestamp.now(),
            });
            totalUpdated++;
          } catch (err) {
            totalErrors++;
            console.error(
              `[Cron Content Metrics] Failed to fetch metrics for item ${d.id} brand ${brandId}:`,
              err
            );
          }
        }
      } catch (err) {
        logger.error('[Cron Content Metrics] Failed for brand', {
          error: err instanceof Error ? err.message : 'Unknown',
          meta: { brandId },
        });
      }
    }

    const durationMs = Date.now() - startTime;

    logger.info('[Cron Content Metrics] Completed', {
      route: '/api/cron/content-metrics',
      durationMs,
      meta: { brandsProcessed: brandIds.length, totalUpdated, totalErrors },
    });

    return createApiSuccess({
      brandsProcessed: brandIds.length,
      totalUpdated,
      totalErrors,
      durationMs,
    });
  } catch (error) {
    logger.error('[Cron Content Metrics] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error');
  }
}
