export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/content/calendar/publish
 * Publish a calendar item to the real social platform.
 * Supports Instagram (Content Publishing API) and LinkedIn (UGC Posts API).
 *
 * @story V-2.1, V-2.2, V-2.3
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { updateCalendarItem } from '@/lib/firebase/content-calendar';
import { publishToInstagram } from '@/lib/integrations/social/instagram-graph';
import { publishToLinkedIn } from '@/lib/integrations/social/linkedin-graph';
import { Timestamp } from 'firebase/firestore';

interface PublishRequest {
  brandId: string;
  itemId: string;
  platform: 'instagram' | 'linkedin';
  content: string;
  imageUrl?: string;
  videoUrl?: string;
  mediaType?: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  articleUrl?: string;
  articleTitle?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PublishRequest;
    const { brandId, itemId, platform, content, imageUrl, videoUrl, mediaType, articleUrl, articleTitle } = body;

    if (!brandId || !itemId || !platform || !content) {
      return createApiError(400, 'Missing required fields: brandId, itemId, platform, content');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    let externalId: string | undefined;
    let permalink: string | undefined;

    if (platform === 'instagram') {
      if (!imageUrl && !videoUrl) {
        return createApiError(400, 'Instagram publishing requires imageUrl or videoUrl');
      }

      const result = await publishToInstagram(brandId, {
        caption: content,
        imageUrl,
        videoUrl,
        mediaType: mediaType || (videoUrl ? 'VIDEO' : 'IMAGE'),
      });

      externalId = result.mediaId;
      permalink = result.permalink;
    } else if (platform === 'linkedin') {
      const result = await publishToLinkedIn(brandId, {
        text: content,
        imageUrl,
        articleUrl,
        articleTitle,
      });

      externalId = result.postId;
    } else {
      return createApiError(400, `Platform "${platform}" not supported for publishing`);
    }

    // V-2.3: Update calendar item status to "published"
    await updateCalendarItem(brandId, itemId, {
      status: 'published',
      metadata: {
        publishedAt: Timestamp.now(),
        externalId,
        permalink,
        platform,
      } as any,
    });

    return createApiSuccess({
      published: true,
      itemId,
      platform,
      externalId,
      permalink,
    });
  } catch (error) {
    console.error('[Calendar Publish] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to publish content';
    return createApiError(500, message);
  }
}
