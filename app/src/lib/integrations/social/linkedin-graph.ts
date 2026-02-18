/**
 * LinkedIn API Client — Sprint V
 * Real API calls for publishing and metrics.
 * Uses MonaraTokenVault for token management (Sprint U).
 *
 * @module lib/integrations/social/linkedin-graph
 * @story V-2.2
 */

import { MonaraTokenVault } from '@/lib/firebase/vault';
import { fetchWithRetry } from '@/lib/integrations/ads/api-helpers';

const LINKEDIN_API = 'https://api.linkedin.com';

// ─── Types ───

export interface LinkedInPublishResult {
  postId: string;
  postUrn: string;
}

export interface LinkedInPostMetrics {
  impressions: number;
  clicks: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
}

// ─── Helper: get LinkedIn org/person URN ───

async function getLinkedInAuth(brandId: string): Promise<{
  accessToken: string;
  authorUrn: string;
  isOrganization: boolean;
}> {
  const token = await MonaraTokenVault.getToken(brandId, 'linkedin');
  if (!token) {
    throw new Error(`LinkedIn token not found for brand ${brandId}`);
  }

  const accessToken = token.accessToken;
  const metadata = token.metadata as Record<string, any>;

  // Check if org page or personal profile
  if (metadata?.organizationId) {
    return {
      accessToken,
      authorUrn: `urn:li:organization:${metadata.organizationId}`,
      isOrganization: true,
    };
  }

  // Fallback: get person URN via /v2/me
  const meRes = await fetchWithRetry(
    `${LINKEDIN_API}/v2/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    },
    { timeoutMs: 10_000 }
  );

  if (!meRes.ok) {
    throw new Error(`LinkedIn /v2/me failed: ${meRes.status}`);
  }

  const meData = await meRes.json();
  return {
    accessToken,
    authorUrn: `urn:li:person:${meData.id}`,
    isOrganization: false,
  };
}

// ─── Publish Post ───

/**
 * Publish a post to LinkedIn via UGC Posts API.
 * POST /v2/ugcPosts
 */
export async function publishToLinkedIn(
  brandId: string,
  content: {
    text: string;
    imageUrl?: string;
    articleUrl?: string;
    articleTitle?: string;
  }
): Promise<LinkedInPublishResult> {
  const { accessToken, authorUrn } = await getLinkedInAuth(brandId);

  // Build share content
  const shareContent: Record<string, any> = {
    shareCommentary: { text: content.text },
    shareMediaCategory: 'NONE',
  };

  if (content.articleUrl) {
    shareContent.shareMediaCategory = 'ARTICLE';
    shareContent.media = [
      {
        status: 'READY',
        originalUrl: content.articleUrl,
        title: { text: content.articleTitle || '' },
      },
    ];
  } else if (content.imageUrl) {
    shareContent.shareMediaCategory = 'IMAGE';
    shareContent.media = [
      {
        status: 'READY',
        originalUrl: content.imageUrl,
      },
    ];
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': shareContent,
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  const res = await fetchWithRetry(
    `${LINKEDIN_API}/v2/ugcPosts`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify(body),
    },
    { timeoutMs: 15_000 }
  );

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      `LinkedIn publish failed: ${errorData?.message || errorData?.serviceErrorCode || res.statusText}`
    );
  }

  const postUrn = res.headers.get('x-restli-id') || '';

  return {
    postId: postUrn.split(':').pop() || postUrn,
    postUrn,
  };
}

// ─── Post Metrics ───

/**
 * Fetch metrics for a LinkedIn post.
 * GET /v2/organizationalEntityShareStatistics or /v2/socialMetadata/{urn}
 */
export async function fetchLinkedInPostMetrics(
  brandId: string,
  postUrn: string
): Promise<LinkedInPostMetrics> {
  const { accessToken, authorUrn, isOrganization } = await getLinkedInAuth(brandId);

  const defaultMetrics: LinkedInPostMetrics = {
    impressions: 0,
    clicks: 0,
    engagement: 0,
    likes: 0,
    comments: 0,
    shares: 0,
  };

  if (isOrganization) {
    // Organization share statistics
    const orgId = authorUrn.split(':').pop();
    const res = await fetchWithRetry(
      `${LINKEDIN_API}/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${encodeURIComponent(authorUrn)}&shares[0]=${encodeURIComponent(postUrn)}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0',
        },
      },
      { timeoutMs: 10_000 }
    );

    if (!res.ok) return defaultMetrics;

    const data = await res.json();
    const elements = data.elements || [];
    if (elements.length > 0) {
      const stats = elements[0].totalShareStatistics || {};
      return {
        impressions: stats.impressionCount || 0,
        clicks: stats.clickCount || 0,
        engagement: stats.engagement || 0,
        likes: stats.likeCount || 0,
        comments: stats.commentCount || 0,
        shares: stats.shareCount || 0,
      };
    }
  }

  // Fallback: social metadata
  const res = await fetchWithRetry(
    `${LINKEDIN_API}/v2/socialMetadata/${encodeURIComponent(postUrn)}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    },
    { timeoutMs: 10_000 }
  );

  if (!res.ok) return defaultMetrics;

  const data = await res.json();
  return {
    impressions: 0,
    clicks: 0,
    engagement: (data.likeCount || 0) + (data.commentCount || 0) + (data.shareCount || 0),
    likes: data.likeCount || 0,
    comments: data.commentCount || 0,
    shares: data.shareCount || 0,
  };
}
