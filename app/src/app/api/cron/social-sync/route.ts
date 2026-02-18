export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/social-sync
 * Vercel Cron: syncs Instagram interactions (comments, mentions) for all brands.
 * Runs every 15 minutes. Auth: CRON_SECRET.
 *
 * @story V-1.4
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { collection, getDocs, query, where, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { fetchAllInteractions } from '@/lib/integrations/social/instagram-graph';
import { analyzeSentimentBatch } from '@/lib/ai/sentiment-analyzer';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron Social Sync] CRON_SECRET env var not configured');
      return createApiError(500, 'Cron configuration error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    const startTime = Date.now();

    // Find all brands with Meta/Instagram integration
    const brandsWithIG = await getBrandsWithInstagram();

    if (brandsWithIG.length === 0) {
      return createApiSuccess({
        message: 'No brands with Instagram configured',
        brandsProcessed: 0,
      });
    }

    const results: Array<{
      brandId: string;
      interactionsFound: number;
      interactionsSaved: number;
      error?: string;
    }> = [];

    for (const brandId of brandsWithIG) {
      try {
        // 1. Fetch interactions from Instagram Graph API
        const interactions = await fetchAllInteractions(brandId);

        if (interactions.length === 0) {
          results.push({ brandId, interactionsFound: 0, interactionsSaved: 0 });
          continue;
        }

        // 2. Analyze sentiment via Gemini (batch, max 20 per brand per cycle)
        const toAnalyze = interactions.slice(0, 20);
        const enriched = await analyzeSentimentBatch(toAnalyze, 3);

        // 3. Save to Firestore
        let saved = 0;
        for (const interaction of enriched) {
          try {
            const interactionRef = doc(
              db,
              'brands',
              brandId,
              'social_interactions',
              interaction.id
            );
            await setDoc(
              interactionRef,
              {
                ...interaction,
                syncedAt: Timestamp.now(),
              },
              { merge: true }
            );
            saved++;
          } catch (err) {
            console.error(`[Cron Social Sync] Failed to save interaction ${interaction.id}:`, err);
          }
        }

        results.push({
          brandId,
          interactionsFound: interactions.length,
          interactionsSaved: saved,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('[Cron Social Sync] Failed for brand', {
          error: message,
          meta: { brandId },
        });
        results.push({
          brandId,
          interactionsFound: 0,
          interactionsSaved: 0,
          error: message,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const totalFound = results.reduce((sum, r) => sum + r.interactionsFound, 0);
    const totalSaved = results.reduce((sum, r) => sum + r.interactionsSaved, 0);

    logger.info('[Cron Social Sync] Completed', {
      route: '/api/cron/social-sync',
      durationMs,
      meta: {
        brandsProcessed: results.length,
        totalFound,
        totalSaved,
      },
    });

    return createApiSuccess({
      brandsProcessed: results.length,
      totalFound,
      totalSaved,
      durationMs,
      results,
    });
  } catch (error) {
    logger.error('[Cron Social Sync] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}

// ─── Helpers ───

async function getBrandsWithInstagram(): Promise<string[]> {
  // Check tenants/{tenantId}/integrations/{provider} for meta or instagram
  const integrationsRef = collection(db, 'integrations');
  const q = query(integrationsRef, where('provider', 'in', ['meta', 'instagram']));
  const snap = await getDocs(q);

  const brandIds = new Set<string>();
  for (const d of snap.docs) {
    const data = d.data();
    if (data.tenantId && data.status !== 'expired') {
      brandIds.add(data.tenantId);
    }
  }

  return Array.from(brandIds);
}
