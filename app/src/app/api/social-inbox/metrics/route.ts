export const dynamic = 'force-dynamic';

/**
 * GET /api/social-inbox/metrics?brandId=...
 * Dashboard metrics for social interactions.
 *
 * @story V-1.5
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '7', 10);

    if (!brandId) {
      return createApiError(400, 'Missing required param: brandId');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    const sinceTimestamp = Timestamp.fromMillis(
      Date.now() - days * 24 * 60 * 60 * 1000
    );

    // Fetch all interactions for this brand
    const interactionsRef = collection(db, 'brands', brandId, 'social_interactions');
    const q = query(
      interactionsRef,
      where('syncedAt', '>=', sinceTimestamp)
    );
    const snap = await getDocs(q);

    const interactions = snap.docs.map((d) => d.data());

    // Compute metrics
    const totalInteractions = interactions.length;
    const byType = { comment: 0, dm: 0, mention: 0 };
    const byStatus = { pending: 0, read: 0, responded: 0, archived: 0 };
    const bySentiment = { positive: 0, neutral: 0, negative: 0 };
    const byPlatform: Record<string, number> = {};
    let totalSentimentScore = 0;
    let requiresReview = 0;

    for (const interaction of interactions) {
      const type = interaction.type as keyof typeof byType;
      if (type in byType) byType[type]++;

      const status = interaction.status as keyof typeof byStatus;
      if (status in byStatus) byStatus[status]++;

      const sentiment = interaction.metadata?.sentimentLabel as keyof typeof bySentiment;
      if (sentiment in bySentiment) bySentiment[sentiment]++;

      const platform = interaction.platform || 'unknown';
      byPlatform[platform] = (byPlatform[platform] || 0) + 1;

      totalSentimentScore += interaction.metadata?.sentimentScore || 0;

      if (interaction.metadata?.requires_human_review) {
        requiresReview++;
      }
    }

    const avgSentiment = totalInteractions > 0
      ? totalSentimentScore / totalInteractions
      : 0;

    const responseRate = totalInteractions > 0
      ? byStatus.responded / totalInteractions
      : 0;

    return createApiSuccess({
      period: { days, since: sinceTimestamp.toDate().toISOString() },
      totalInteractions,
      avgSentiment: Math.round(avgSentiment * 100) / 100,
      responseRate: Math.round(responseRate * 100) / 100,
      requiresReview,
      byType,
      byStatus,
      bySentiment,
      byPlatform,
    });
  } catch (error) {
    console.error('[Social Metrics] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch metrics';
    return createApiError(500, message);
  }
}
