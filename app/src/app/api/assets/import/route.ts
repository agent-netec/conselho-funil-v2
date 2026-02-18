export const dynamic = 'force-dynamic';

/**
 * POST /api/assets/import
 * Import creatives from Meta Ads or Google Ads into the Assets module.
 * GET /api/assets/import?brandId=...&provider=meta — List available creatives
 *
 * @story V-4.1, V-4.2, V-4.3
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { MonaraTokenVault, type MetaTokenMetadata, type GoogleTokenMetadata } from '@/lib/firebase/vault';
import { fetchWithRetry } from '@/lib/integrations/ads/api-helpers';
import { META_API, GOOGLE_ADS_API } from '@/lib/integrations/ads/constants';
import { createVaultAsset } from '@/lib/firebase/vault';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

// ─── Types ───

interface AdCreative {
  id: string;
  name: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  videoUrl?: string;
  type: 'image' | 'video';
  campaignId?: string;
  campaignName?: string;
  metrics?: {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    conversions: number;
  };
}

// ─── GET: List available creatives ───

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    const provider = req.nextUrl.searchParams.get('provider') as 'meta' | 'google';

    if (!brandId || !provider) {
      return createApiError(400, 'Missing required params: brandId, provider');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    let creatives: AdCreative[] = [];

    if (provider === 'meta') {
      creatives = await listMetaCreatives(brandId);
    } else if (provider === 'google') {
      creatives = await listGoogleCreatives(brandId);
    } else {
      return createApiError(400, `Provider "${provider}" not supported`);
    }

    return createApiSuccess({ creatives, count: creatives.length });
  } catch (error) {
    console.error('[Assets Import GET] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Failed to list creatives');
  }
}

// ─── POST: Import selected creatives ───

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, provider, creativeIds } = body as {
      brandId: string;
      provider: 'meta' | 'google';
      creativeIds: string[];
    };

    if (!brandId || !provider || !creativeIds?.length) {
      return createApiError(400, 'Missing required fields: brandId, provider, creativeIds[]');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // First, list all creatives to get details
    let allCreatives: AdCreative[] = [];
    if (provider === 'meta') {
      allCreatives = await listMetaCreatives(brandId);
    } else if (provider === 'google') {
      allCreatives = await listGoogleCreatives(brandId);
    }

    const selectedCreatives = allCreatives.filter((c) => creativeIds.includes(c.id));
    const imported: Array<{ creativeId: string; assetId: string }> = [];
    const errors: Array<{ creativeId: string; error: string }> = [];

    for (const creative of selectedCreatives) {
      try {
        // Create vault asset
        const assetId = await createVaultAsset(brandId, {
          name: creative.name || `${provider}_creative_${creative.id}`,
          type: creative.type,
          url: creative.imageUrl || creative.thumbnailUrl || '',
          storagePath: `imports/${provider}/${creative.id}`,
          status: 'approved',
          tags: [`${provider}_ads`, 'imported'],
          metadata: {
            source: provider,
            externalId: creative.id,
            campaignId: creative.campaignId,
            campaignName: creative.campaignName,
            importedAt: new Date().toISOString(),
          },
        });

        // V-4.3: Associate asset with campaign metrics
        if (creative.metrics && creative.campaignId) {
          const linkRef = doc(
            db,
            'brands',
            brandId,
            'asset_campaign_links',
            `${assetId}_${creative.campaignId}`
          );
          await setDoc(linkRef, {
            assetId,
            campaignId: creative.campaignId,
            campaignName: creative.campaignName,
            provider,
            metrics: creative.metrics,
            linkedAt: Timestamp.now(),
          });
        }

        imported.push({ creativeId: creative.id, assetId });
      } catch (err) {
        errors.push({
          creativeId: creative.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return createApiSuccess({
      imported: imported.length,
      errors: errors.length,
      details: { imported, errors },
    });
  } catch (error) {
    console.error('[Assets Import POST] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Failed to import creatives');
  }
}

// ─── Meta Ads: List Creatives ───

async function listMetaCreatives(brandId: string): Promise<AdCreative[]> {
  const token = await MonaraTokenVault.getValidToken(brandId, 'meta');
  const metadata = token.metadata as MetaTokenMetadata;

  if (!metadata.adAccountId) {
    throw new Error('Meta adAccountId not configured');
  }

  const adAccountId = metadata.adAccountId.startsWith('act_')
    ? metadata.adAccountId
    : `act_${metadata.adAccountId}`;

  // Fetch ad creatives with thumbnails
  const creativesRes = await fetchWithRetry(
    `${META_API.BASE_URL}/${adAccountId}/adcreatives?fields=id,name,thumbnail_url,effective_object_story_id,object_type&limit=50&access_token=${encodeURIComponent(token.accessToken)}`,
    {},
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  if (!creativesRes.ok) {
    const err = await creativesRes.json().catch(() => ({}));
    throw new Error(`Meta API Error: ${err?.error?.message || creativesRes.statusText}`);
  }

  const creativesData = await creativesRes.json();
  const rawCreatives = creativesData.data || [];

  // Fetch campaign-level insights for metrics
  const insightsRes = await fetchWithRetry(
    `${META_API.BASE_URL}/${adAccountId}/insights?fields=campaign_id,campaign_name,impressions,clicks,spend,ctr,actions&level=ad&limit=50&access_token=${encodeURIComponent(token.accessToken)}`,
    {},
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  const insightsMap = new Map<string, any>();
  if (insightsRes.ok) {
    const insightsData = await insightsRes.json();
    for (const insight of insightsData.data || []) {
      insightsMap.set(insight.campaign_id, insight);
    }
  }

  return rawCreatives.map((creative: any) => ({
    id: creative.id,
    name: creative.name || 'Untitled Creative',
    thumbnailUrl: creative.thumbnail_url,
    imageUrl: creative.thumbnail_url,
    type: creative.object_type === 'VIDEO' ? 'video' as const : 'image' as const,
    campaignId: undefined,
    campaignName: undefined,
    metrics: undefined,
  }));
}

// ─── Google Ads: List Creatives ───

async function listGoogleCreatives(brandId: string): Promise<AdCreative[]> {
  const token = await MonaraTokenVault.getValidToken(brandId, 'google');
  const metadata = token.metadata as GoogleTokenMetadata;

  if (!metadata.customerId || !metadata.developerToken) {
    throw new Error('Google customerId or developerToken not configured');
  }

  const customerId = metadata.customerId.replace(/-/g, '');

  // GAQL query to get ads with metrics
  const gaqlQuery = `
    SELECT
      ad_group_ad.ad.id,
      ad_group_ad.ad.name,
      ad_group_ad.ad.type,
      ad_group_ad.ad.image_ad.image_url,
      campaign.id,
      campaign.name,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.ctr,
      metrics.conversions
    FROM ad_group_ad
    WHERE segments.date DURING LAST_30_DAYS
    ORDER BY metrics.impressions DESC
    LIMIT 50
  `;

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token.accessToken}`,
    'developer-token': metadata.developerToken,
    'Content-Type': 'application/json',
  };

  if (metadata.managerAccountId) {
    headers['login-customer-id'] = metadata.managerAccountId.replace(/-/g, '');
  }

  const res = await fetchWithRetry(
    `${GOOGLE_ADS_API.BASE_URL}/customers/${customerId}/googleAds:searchStream`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ query: gaqlQuery }),
    },
    { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google Ads API Error: ${JSON.stringify(err)}`);
  }

  const data = await res.json();
  const results = data[0]?.results || [];

  return results.map((row: any) => {
    const ad = row.adGroupAd?.ad || {};
    const campaign = row.campaign || {};
    const metrics = row.metrics || {};

    return {
      id: ad.id?.toString() || '',
      name: ad.name || 'Untitled Ad',
      thumbnailUrl: ad.imageAd?.imageUrl,
      imageUrl: ad.imageAd?.imageUrl,
      type: ad.type === 'VIDEO_AD' ? 'video' as const : 'image' as const,
      campaignId: campaign.id?.toString(),
      campaignName: campaign.name,
      metrics: {
        impressions: parseInt(metrics.impressions || '0', 10),
        clicks: parseInt(metrics.clicks || '0', 10),
        spend: (parseInt(metrics.costMicros || '0', 10) / 1_000_000),
        ctr: parseFloat(metrics.ctr || '0'),
        conversions: parseFloat(metrics.conversions || '0'),
      },
    };
  });
}
