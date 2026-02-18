export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { collection, getDocs, doc, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { fetchMetaAdsInsights, type MetaAdInsight } from '@/lib/ads/meta-client';
import { decryptSensitiveFields } from '@/lib/utils/encryption';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/cron/ads-sync
 * Vercel Cron: syncs Meta Ads insights for all brands with Meta integration.
 * Runs every 6 hours. Auth: CRON_SECRET.
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
          // Mark token as expired in Firestore
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

// --- Helpers ---

interface BrandMetaConfig {
  brandId: string;
  adAccountId: string;
  accessToken: string;
}

async function getBrandsWithMetaAds(): Promise<BrandMetaConfig[]> {
  // We look for integrations with provider='meta' across all tenants
  // The settings page saves to the 'integrations' collection via saveIntegration()
  const integrationsRef = collection(db, 'integrations');
  const q = query(integrationsRef, where('provider', '==', 'meta'));
  const snap = await getDocs(q);

  const configs: BrandMetaConfig[] = [];

  for (const d of snap.docs) {
    const data = d.data();
    const decrypted = decryptSensitiveFields(data.config || {});

    if (decrypted.adAccountId && decrypted.accessToken) {
      // tenantId in integrations maps to brandId
      configs.push({
        brandId: data.tenantId || d.id,
        adAccountId: decrypted.adAccountId,
        accessToken: decrypted.accessToken,
      });
    }
  }

  return configs;
}

async function markTokenExpired(brandId: string) {
  try {
    const integrationsRef = collection(db, 'integrations');
    const q = query(
      integrationsRef,
      where('tenantId', '==', brandId),
      where('provider', '==', 'meta')
    );
    const snap = await getDocs(q);

    for (const d of snap.docs) {
      await updateDoc(d.ref, {
        'status': 'expired',
        'expiredAt': Timestamp.now(),
      });
    }
  } catch (err) {
    logger.error('[Cron Ads Sync] Failed to mark token expired', {
      error: err instanceof Error ? err.message : 'Unknown',
      meta: { brandId },
    });
  }
}

async function saveInsights(brandId: string, insights: MetaAdInsight[]) {
  const now = Timestamp.now();

  for (const insight of insights) {
    // Use campaign_id + date as document ID for idempotency
    const docId = `${insight.campaignId}_${insight.dateStart}`;
    const metricsRef = doc(db, 'brands', brandId, 'performance_metrics', docId);

    await setDoc(metricsRef, {
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
