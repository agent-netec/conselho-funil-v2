export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { fetchMetaAdsInsights, type MetaAdInsight } from '@/lib/ads/meta-client';
import { decrypt } from '@/lib/utils/encryption';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/cron/ads-sync
 * Vercel Cron: syncs Meta Ads insights for all brands with Meta integration.
 * Runs every 6 hours. Auth: CRON_SECRET.
 * Uses Firebase Admin SDK to bypass security rules (server-to-server).
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('Authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cron Ads Sync] CRON_SECRET env var not configured');
      return createApiError(500, 'Cron configuration error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    const startTime = Date.now();

    // Find all brands with Meta Ads integration
    const brandsWithMeta = await getBrandsWithMetaAds();

    if (brandsWithMeta.length === 0) {
      return createApiSuccess({
        message: 'No brands with Meta Ads configured',
        brandsProcessed: 0,
      });
    }

    const results: Array<{
      brandId: string;
      insightsCount: number;
      tokenExpired: boolean;
      error?: string;
    }> = [];

    for (const brand of brandsWithMeta) {
      try {
        const result = await fetchMetaAdsInsights({
          adAccountId: brand.adAccountId,
          accessToken: brand.accessToken,
        });

        if (result.tokenExpired) {
          await markTokenExpired(brand.brandId);
          results.push({
            brandId: brand.brandId,
            insightsCount: 0,
            tokenExpired: true,
            error: 'Token expired',
          });
          continue;
        }

        if (result.error) {
          results.push({
            brandId: brand.brandId,
            insightsCount: 0,
            tokenExpired: false,
            error: result.error,
          });
          continue;
        }

        // Save insights to Firestore
        await saveInsights(brand.brandId, result.insights);

        results.push({
          brandId: brand.brandId,
          insightsCount: result.insights.length,
          tokenExpired: false,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        logger.error('[Cron Ads Sync] Failed for brand', {
          error: message,
          meta: { brandId: brand.brandId },
        });
        results.push({
          brandId: brand.brandId,
          insightsCount: 0,
          tokenExpired: false,
          error: message,
        });
      }
    }

    const durationMs = Date.now() - startTime;
    const totalInsights = results.reduce((sum, r) => sum + r.insightsCount, 0);
    const expiredTokens = results.filter(r => r.tokenExpired).length;

    logger.info('[Cron Ads Sync] Completed', {
      route: '/api/cron/ads-sync',
      durationMs,
      meta: {
        brandsProcessed: results.length,
        totalInsights,
        expiredTokens,
      },
    });

    return createApiSuccess({
      brandsProcessed: results.length,
      totalInsights,
      expiredTokens,
      durationMs,
      results,
    });
  } catch (error) {
    logger.error('[Cron Ads Sync] Fatal error', {
      error: error instanceof Error ? error.message : 'Unknown',
    });
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}

// --- Helpers (all using Admin SDK) ---

interface BrandMetaConfig {
  brandId: string;
  adAccountId: string;
  accessToken: string;
}

async function getBrandsWithMetaAds(): Promise<BrandMetaConfig[]> {
  const db = getAdminFirestore();
  const brandsSnap = await db.collection('brands').get();
  const configs: BrandMetaConfig[] = [];

  for (const brandDoc of brandsSnap.docs) {
    try {
      const tokenSnap = await db.doc(`brands/${brandDoc.id}/secrets/token_meta`).get();
      if (!tokenSnap.exists) continue;

      const data = tokenSnap.data();
      if (!data) continue;

      const accessToken = data.accessToken ? decrypt(data.accessToken) : '';
      const metadata = data.metadata || {};
      const adAccountId = metadata.adAccountId || '';

      // Check if token is expired
      const expiresAt = data.expiresAt?.toMillis?.() || data.expiresAt?._seconds * 1000 || 0;
      if (expiresAt && expiresAt < Date.now()) {
        logger.warn('[Cron Ads Sync] Token expired for brand', {
          meta: { brandId: brandDoc.id },
        });
        continue;
      }

      if (adAccountId && accessToken) {
        configs.push({
          brandId: brandDoc.id,
          adAccountId: String(adAccountId),
          accessToken,
        });
      }
    } catch (err) {
      logger.warn('[Cron Ads Sync] Could not read token for brand', {
        meta: { brandId: brandDoc.id, error: err instanceof Error ? err.message : 'Unknown' },
      });
    }
  }

  return configs;
}

async function markTokenExpired(brandId: string) {
  try {
    const db = getAdminFirestore();
    await db.doc(`brands/${brandId}/secrets/token_meta`).update({
      status: 'expired',
      expiredAt: new Date(),
    });
  } catch (err) {
    logger.error('[Cron Ads Sync] Failed to mark token expired', {
      error: err instanceof Error ? err.message : 'Unknown',
      meta: { brandId },
    });
  }
}

async function saveInsights(brandId: string, insights: MetaAdInsight[]) {
  const db = getAdminFirestore();
  const now = new Date();

  for (const insight of insights) {
    const docId = `${insight.campaignId}_${insight.dateStart}`;
    await db.doc(`brands/${brandId}/performance_metrics/${docId}`).set({
      source: 'meta_ads',
      campaignId: insight.campaignId,
      campaignName: insight.campaignName,
      spend: insight.spend,
      impressions: insight.impressions,
      clicks: insight.clicks,
      conversions: insight.conversions,
      cpc: insight.cpc,
      cpm: insight.cpm,
      ctr: insight.ctr,
      dateStart: insight.dateStart,
      dateStop: insight.dateStop,
      syncedAt: now,
    }, { merge: true });
  }
}
