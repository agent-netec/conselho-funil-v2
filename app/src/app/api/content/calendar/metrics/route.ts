export const dynamic = 'force-dynamic';

/**
 * GET /api/content/calendar/metrics?brandId=...&days=30
 * Dashboard: content performance metrics by format, time, platform.
 *
 * @story V-2.5
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    const days = parseInt(req.nextUrl.searchParams.get('days') || '30', 10);

    if (!brandId) {
      return createApiError(400, 'Missing required param: brandId');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Fetch published items with metrics
    const calendarRef = collection(db, 'brands', brandId, 'content_calendar');
    const q = query(calendarRef, where('status', '==', 'published'));
    const snap = await getDocs(q);

    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Filter by date range
    const sinceMs = Date.now() - days * 24 * 60 * 60 * 1000;
    const filtered = items.filter((item: any) => {
      const publishedAt = item.metadata?.publishedAt;
      if (!publishedAt) return false;
      const ts = publishedAt.toMillis ? publishedAt.toMillis() : publishedAt;
      return ts >= sinceMs;
    });

    // Aggregate by format
    const byFormat: Record<string, { count: number; impressions: number; engagement: number; reach: number }> = {};
    // Aggregate by platform
    const byPlatform: Record<string, { count: number; impressions: number; engagement: number }> = {};
    // Aggregate by hour of day
    const byHour: Record<number, { count: number; engagement: number }> = {};

    let totalImpressions = 0;
    let totalEngagement = 0;
    let totalReach = 0;

    for (const item of filtered as any[]) {
      const metrics = item.metadata?.metrics || {};
      const format = item.format || 'unknown';
      const platform = item.metadata?.platform || item.platform || 'unknown';

      const impressions = metrics.impressions || 0;
      const engagement = metrics.engagement || metrics.likes + metrics.comments + metrics.shares || 0;
      const reach = metrics.reach || 0;

      totalImpressions += impressions;
      totalEngagement += engagement;
      totalReach += reach;

      // By format
      if (!byFormat[format]) byFormat[format] = { count: 0, impressions: 0, engagement: 0, reach: 0 };
      byFormat[format].count++;
      byFormat[format].impressions += impressions;
      byFormat[format].engagement += engagement;
      byFormat[format].reach += reach;

      // By platform
      if (!byPlatform[platform]) byPlatform[platform] = { count: 0, impressions: 0, engagement: 0 };
      byPlatform[platform].count++;
      byPlatform[platform].impressions += impressions;
      byPlatform[platform].engagement += engagement;

      // By hour
      const scheduledDate = item.scheduledDate;
      if (scheduledDate) {
        const date = scheduledDate.toDate ? scheduledDate.toDate() : new Date(scheduledDate);
        const hour = date.getHours();
        if (!byHour[hour]) byHour[hour] = { count: 0, engagement: 0 };
        byHour[hour].count++;
        byHour[hour].engagement += engagement;
      }
    }

    // Find best performing hour
    let bestHour = -1;
    let bestHourEngagement = 0;
    for (const [hour, data] of Object.entries(byHour)) {
      const avgEng = data.count > 0 ? data.engagement / data.count : 0;
      if (avgEng > bestHourEngagement) {
        bestHourEngagement = avgEng;
        bestHour = parseInt(hour, 10);
      }
    }

    // Find best performing format
    let bestFormat = '';
    let bestFormatEngagement = 0;
    for (const [format, data] of Object.entries(byFormat)) {
      const avgEng = data.count > 0 ? data.engagement / data.count : 0;
      if (avgEng > bestFormatEngagement) {
        bestFormatEngagement = avgEng;
        bestFormat = format;
      }
    }

    const avgEngagementRate =
      totalImpressions > 0
        ? Math.round((totalEngagement / totalImpressions) * 10000) / 100
        : 0;

    return createApiSuccess({
      period: { days },
      totalPublished: filtered.length,
      totalImpressions,
      totalEngagement,
      totalReach,
      avgEngagementRate,
      bestHour: bestHour >= 0 ? `${bestHour}:00` : null,
      bestFormat: bestFormat || null,
      byFormat,
      byPlatform,
      byHour,
    });
  } catch (error) {
    console.error('[Calendar Metrics] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Failed to fetch metrics');
  }
}
