export const dynamic = 'force-dynamic';

/**
 * POST /api/vault/publish
 * Execute a real publisher job: publish vault content to social platforms.
 * Updates PublisherJob status and enriches CopyDNA with performance data.
 *
 * @story V-3.1, V-3.2
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import {
  createPublisherJob,
  updatePublisherJob,
  queryVaultLibrary,
} from '@/lib/firebase/vault';
import { publishToInstagram } from '@/lib/integrations/social/instagram-graph';
import { publishToLinkedIn } from '@/lib/integrations/social/linkedin-graph';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface PublishVaultRequest {
  brandId: string;
  contentId: string;
  platforms: ('instagram' | 'linkedin')[];
  toneOverride?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PublishVaultRequest;
    const { brandId, contentId, platforms, toneOverride } = body;

    if (!brandId || !contentId || !platforms?.length) {
      return createApiError(400, 'Missing required fields: brandId, contentId, platforms[]');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Fetch content from vault library
    const contentRef = doc(db, 'brands', brandId, 'vault', 'library', contentId);
    const contentSnap = await getDoc(contentRef);

    if (!contentSnap.exists()) {
      return createApiError(404, 'Vault content not found');
    }

    const vaultContent = contentSnap.data();
    const variants = vaultContent.variants || [];

    // Create publisher job
    const jobId = await createPublisherJob(brandId, {
      insightId: vaultContent.sourceInsightId || contentId,
      status: 'pending',
      config: {
        platforms: platforms as any[],
        toneOverride,
      },
    });

    // Update to "adapting"
    await updatePublisherJob(brandId, jobId, { status: 'adapting' });

    const publishResults: Array<{
      platform: string;
      success: boolean;
      externalId?: string;
      error?: string;
    }> = [];

    for (const platform of platforms) {
      // Find matching variant
      const variant = variants.find((v: any) => v.platform === platform);
      const copy = variant?.copy || vaultContent.content || '';

      if (!copy) {
        publishResults.push({ platform, success: false, error: 'No content for this platform' });
        continue;
      }

      try {
        if (platform === 'instagram') {
          const mediaRef = variant?.mediaRefs?.[0];
          // Fetch asset URL if we have a media reference
          let imageUrl: string | undefined;
          if (mediaRef) {
            const assetRef = doc(db, 'brands', brandId, 'vault', 'assets', mediaRef);
            const assetSnap = await getDoc(assetRef);
            if (assetSnap.exists()) {
              imageUrl = assetSnap.data().url;
            }
          }

          if (!imageUrl) {
            publishResults.push({ platform, success: false, error: 'No media asset for Instagram publishing' });
            continue;
          }

          const result = await publishToInstagram(brandId, {
            caption: copy,
            imageUrl,
            mediaType: 'IMAGE',
          });
          publishResults.push({ platform, success: true, externalId: result.mediaId });
        } else if (platform === 'linkedin') {
          const result = await publishToLinkedIn(brandId, { text: copy });
          publishResults.push({ platform, success: true, externalId: result.postId });
        }
      } catch (err) {
        publishResults.push({
          platform,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    // Determine final status
    const allSuccess = publishResults.every((r) => r.success);
    const anySuccess = publishResults.some((r) => r.success);
    const finalStatus = allSuccess ? 'completed' : anySuccess ? 'completed' : 'failed';
    const errors = publishResults.filter((r) => !r.success).map((r) => `${r.platform}: ${r.error}`);

    await updatePublisherJob(brandId, jobId, {
      status: finalStatus,
      outputContentId: contentId,
      errors: errors.length > 0 ? errors : undefined,
    });

    return createApiSuccess({
      jobId,
      status: finalStatus,
      results: publishResults,
    });
  } catch (error) {
    console.error('[Vault Publish] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Failed to publish');
  }
}
