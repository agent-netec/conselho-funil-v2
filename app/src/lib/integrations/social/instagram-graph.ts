/**
 * Instagram Graph API Client — Sprint V
 * Real API calls for comments, mentions, media, publishing, and metrics.
 * Uses MonaraTokenVault for token management (Sprint U).
 *
 * @module lib/integrations/social/instagram-graph
 * @story V-1.1, V-1.3, V-2.1
 */

import { MonaraTokenVault } from '@/lib/firebase/vault';
import { fetchWithRetry, sanitizeForLog } from '@/lib/integrations/ads/api-helpers';
import { META_API } from '@/lib/integrations/ads/constants';
import type { SocialInteraction } from '@/types/social-inbox';

const IG_GRAPH_BASE = META_API.BASE_URL;

// ─── Types ───

interface IGMedia {
  id: string;
  caption?: string;
  timestamp: string;
  media_type: string;
  media_url?: string;
  permalink?: string;
}

interface IGComment {
  id: string;
  text: string;
  timestamp: string;
  username: string;
  from?: { id: string; username: string };
  media?: { id: string };
}

interface IGMention {
  id: string;
  caption?: string;
  timestamp: string;
  media_type: string;
  permalink?: string;
}

export interface IGPublishResult {
  containerId: string;
  mediaId: string;
  permalink?: string;
}

export interface IGInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  likes: number;
  comments: number;
  shares: number;
}

// ─── Helper: get IG User ID from Meta token ───

async function getIGUserId(brandId: string): Promise<{ userId: string; accessToken: string }> {
  const token = await MonaraTokenVault.getValidToken(brandId, 'meta');

  // Get pages connected to the user
  const pagesRes = await fetchWithRetry(
    `${IG_GRAPH_BASE}/me/accounts?fields=id,instagram_business_account&access_token=${encodeURIComponent(token.accessToken)}`,
    {},
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  if (!pagesRes.ok) {
    throw new Error(`Failed to get pages: ${pagesRes.status}`);
  }

  const pagesData = await pagesRes.json();
  const pages = pagesData.data || [];

  // Find first page with IG business account
  for (const page of pages) {
    if (page.instagram_business_account?.id) {
      return {
        userId: page.instagram_business_account.id,
        accessToken: token.accessToken,
      };
    }
  }

  throw new Error(`No Instagram Business Account found for brand ${brandId}`);
}

// ─── Comments ───

/**
 * Fetch recent comments on brand's media.
 * GET /{ig-user-id}/media → GET /{media-id}/comments
 */
export async function fetchComments(brandId: string, maxMedia: number = 10): Promise<SocialInteraction[]> {
  const { userId, accessToken } = await getIGUserId(brandId);

  // Get recent media
  const mediaRes = await fetchWithRetry(
    `${IG_GRAPH_BASE}/${userId}/media?fields=id,caption,timestamp&limit=${maxMedia}&access_token=${encodeURIComponent(accessToken)}`,
    {},
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  if (!mediaRes.ok) return [];
  const mediaData = await mediaRes.json();
  const mediaList: IGMedia[] = mediaData.data || [];

  const interactions: SocialInteraction[] = [];

  for (const media of mediaList) {
    const commentsRes = await fetchWithRetry(
      `${IG_GRAPH_BASE}/${media.id}/comments?fields=id,text,timestamp,username&limit=50&access_token=${encodeURIComponent(accessToken)}`,
      {},
      { timeoutMs: META_API.TIMEOUT_MS }
    );

    if (!commentsRes.ok) continue;
    const commentsData = await commentsRes.json();
    const comments: IGComment[] = commentsData.data || [];

    for (const comment of comments) {
      interactions.push({
        id: `ig_comment_${comment.id}`,
        externalId: comment.id,
        platform: 'instagram',
        type: 'comment',
        status: 'pending',
        author: {
          id: comment.username,
          handle: comment.username,
          name: comment.username,
          isFollower: false,
        },
        content: {
          text: comment.text,
          timestamp: comment.timestamp,
        },
        metadata: {
          sentimentScore: 0,
          sentimentLabel: 'neutral',
          requires_human_review: false,
          tags: [],
          priority: 0,
        },
        threadId: media.id,
      });
    }
  }

  return interactions;
}

// ─── Mentions ───

/**
 * Fetch mentions (tags) of the brand.
 * GET /{ig-user-id}/tags
 */
export async function fetchMentions(brandId: string): Promise<SocialInteraction[]> {
  const { userId, accessToken } = await getIGUserId(brandId);

  const res = await fetchWithRetry(
    `${IG_GRAPH_BASE}/${userId}/tags?fields=id,caption,timestamp,media_type,permalink&limit=50&access_token=${encodeURIComponent(accessToken)}`,
    {},
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  if (!res.ok) return [];
  const data = await res.json();
  const mentions: IGMention[] = data.data || [];

  return mentions.map((mention) => ({
    id: `ig_mention_${mention.id}`,
    externalId: mention.id,
    platform: 'instagram' as const,
    type: 'mention' as const,
    status: 'pending' as const,
    author: {
      id: 'unknown',
      handle: 'unknown',
      name: 'Unknown',
      isFollower: false,
    },
    content: {
      text: mention.caption || '(media tag)',
      mediaUrls: mention.permalink ? [mention.permalink] : [],
      timestamp: mention.timestamp,
    },
    metadata: {
      sentimentScore: 0,
      sentimentLabel: 'neutral' as const,
      requires_human_review: false,
      tags: ['mention'],
      priority: 3,
    },
  }));
}

// ─── Reply to Comment ───

/**
 * Reply to a comment via Instagram Graph API.
 * POST /{comment-id}/replies
 */
export async function replyToComment(
  brandId: string,
  commentId: string,
  message: string
): Promise<{ id: string }> {
  const { accessToken } = await getIGUserId(brandId);

  const res = await fetchWithRetry(
    `${IG_GRAPH_BASE}/${commentId}/replies`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        access_token: accessToken,
      }),
    },
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Failed to reply to comment: ${errorData?.error?.message || res.statusText}`);
  }

  const data = await res.json();
  return { id: data.id };
}

// ─── Publish Content ───

/**
 * Publish content to Instagram via Content Publishing API.
 * Step 1: POST /{ig-user-id}/media (create container)
 * Step 2: POST /{ig-user-id}/media_publish (publish container)
 */
export async function publishToInstagram(
  brandId: string,
  content: {
    caption: string;
    imageUrl?: string;
    videoUrl?: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
    carouselItems?: Array<{ imageUrl?: string; videoUrl?: string }>;
  }
): Promise<IGPublishResult> {
  const { userId, accessToken } = await getIGUserId(brandId);

  let containerId: string;

  if (content.mediaType === 'CAROUSEL_ALBUM' && content.carouselItems?.length) {
    // Create individual containers for carousel items
    const childIds: string[] = [];
    for (const item of content.carouselItems) {
      const childBody: Record<string, string> = {
        access_token: accessToken,
        is_carousel_item: 'true',
      };
      if (item.imageUrl) childBody.image_url = item.imageUrl;
      if (item.videoUrl) {
        childBody.video_url = item.videoUrl;
        childBody.media_type = 'VIDEO';
      }

      const childRes = await fetchWithRetry(
        `${IG_GRAPH_BASE}/${userId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(childBody),
        },
        { timeoutMs: META_API.TIMEOUT_MS }
      );

      if (!childRes.ok) {
        const err = await childRes.json().catch(() => ({}));
        throw new Error(`Failed to create carousel item: ${err?.error?.message || childRes.statusText}`);
      }

      const childData = await childRes.json();
      childIds.push(childData.id);
    }

    // Create carousel container
    const carouselRes = await fetchWithRetry(
      `${IG_GRAPH_BASE}/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          caption: content.caption,
          children: childIds.join(','),
          access_token: accessToken,
        }),
      },
      { timeoutMs: META_API.TIMEOUT_MS }
    );

    if (!carouselRes.ok) {
      const err = await carouselRes.json().catch(() => ({}));
      throw new Error(`Failed to create carousel: ${err?.error?.message || carouselRes.statusText}`);
    }

    const carouselData = await carouselRes.json();
    containerId = carouselData.id;
  } else {
    // Single media container
    const body: Record<string, string> = {
      caption: content.caption,
      access_token: accessToken,
    };

    if (content.mediaType === 'REELS' && content.videoUrl) {
      body.media_type = 'REELS';
      body.video_url = content.videoUrl;
    } else if (content.videoUrl) {
      body.media_type = 'VIDEO';
      body.video_url = content.videoUrl;
    } else if (content.imageUrl) {
      body.image_url = content.imageUrl;
    }

    const containerRes = await fetchWithRetry(
      `${IG_GRAPH_BASE}/${userId}/media`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      { timeoutMs: META_API.TIMEOUT_MS }
    );

    if (!containerRes.ok) {
      const err = await containerRes.json().catch(() => ({}));
      throw new Error(`Failed to create media container: ${err?.error?.message || containerRes.statusText}`);
    }

    const containerData = await containerRes.json();
    containerId = containerData.id;
  }

  // Publish the container
  const publishRes = await fetchWithRetry(
    `${IG_GRAPH_BASE}/${userId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    },
    { timeoutMs: 30_000 } // Publishing can take longer
  );

  if (!publishRes.ok) {
    const err = await publishRes.json().catch(() => ({}));
    throw new Error(`Failed to publish: ${err?.error?.message || publishRes.statusText}`);
  }

  const publishData = await publishRes.json();

  return {
    containerId,
    mediaId: publishData.id,
    permalink: undefined, // Will be fetched after publish
  };
}

// ─── Media Insights ───

/**
 * Fetch insights for a published media.
 * GET /{media-id}/insights?metric=impressions,reach,engagement,saved
 */
export async function fetchMediaInsights(
  brandId: string,
  mediaId: string
): Promise<IGInsights> {
  const { accessToken } = await getIGUserId(brandId);

  const metrics = 'impressions,reach,saved,likes,comments,shares';
  const res = await fetchWithRetry(
    `${IG_GRAPH_BASE}/${mediaId}/insights?metric=${metrics}&access_token=${encodeURIComponent(accessToken)}`,
    {},
    { timeoutMs: META_API.TIMEOUT_MS }
  );

  const defaultInsights: IGInsights = {
    impressions: 0,
    reach: 0,
    engagement: 0,
    saved: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  };

  if (!res.ok) return defaultInsights;

  const data = await res.json();
  const insights = data.data || [];

  for (const metric of insights) {
    const value = metric.values?.[0]?.value || 0;
    const name = metric.name as keyof IGInsights;
    if (name in defaultInsights) {
      defaultInsights[name] = value;
    }
  }

  defaultInsights.engagement =
    defaultInsights.likes + defaultInsights.comments + defaultInsights.shares + defaultInsights.saved;

  return defaultInsights;
}

/**
 * Fetch all interactions (comments + mentions) for a brand.
 * Used by the social-sync cron.
 */
export async function fetchAllInteractions(brandId: string): Promise<SocialInteraction[]> {
  const [comments, mentions] = await Promise.allSettled([
    fetchComments(brandId),
    fetchMentions(brandId),
  ]);

  const result: SocialInteraction[] = [];

  if (comments.status === 'fulfilled') {
    result.push(...comments.value);
  } else {
    console.error(`[InstagramGraph] Failed to fetch comments for brand ${brandId}:`, comments.reason);
  }

  if (mentions.status === 'fulfilled') {
    result.push(...mentions.value);
  } else {
    console.error(`[InstagramGraph] Failed to fetch mentions for brand ${brandId}:`, mentions.reason);
  }

  return result;
}
