/**
 * GET /api/cron/trial-check — R6.3
 *
 * Vercel Cron: Checks for expired trials and downgrades users to 'free' tier.
 * Runs daily at 00:00 UTC.
 *
 * Auth: CRON_SECRET (Vercel sends Authorization: Bearer <CRON_SECRET>).
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getExpiredTrialUsers, downgradeUsersToFree } from '@/lib/firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify CRON_SECRET
    const authHeader = req.headers.get('Authorization');
    const cronSecret = (process.env.CRON_SECRET || '').trim();

    if (!cronSecret) {
      console.error('[Cron trial-check] CRON_SECRET env var not configured');
      return createApiError(500, 'Cron configuration error');
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return createApiError(401, 'Unauthorized');
    }

    // 2. Get users with expired trials
    const expiredUserIds = await getExpiredTrialUsers();

    if (expiredUserIds.length === 0) {
      console.log('[Cron trial-check] No expired trials found');
      return createApiSuccess({
        checked: true,
        expiredTrialsFound: 0,
        downgradedUsers: 0,
      });
    }

    console.log(`[Cron trial-check] Found ${expiredUserIds.length} expired trials`);

    // 3. Downgrade users to free tier
    const downgradedCount = await downgradeUsersToFree(expiredUserIds);

    console.log(`[Cron trial-check] Downgraded ${downgradedCount} users to free tier`);

    // TODO (R6.5): Send trial expired emails to these users

    return createApiSuccess({
      checked: true,
      expiredTrialsFound: expiredUserIds.length,
      downgradedUsers: downgradedCount,
      userIds: expiredUserIds,
    });
  } catch (error) {
    console.error('[Cron trial-check] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
