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
import { getExpiredTrialUsers, downgradeUsersToFree, getUser } from '@/lib/firebase/firestore';
import { sendTrialExpiringEmail } from '@/lib/email/resend';

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

    // R6.5: Send trial expired emails (non-blocking per user)
    for (const uid of expiredUserIds) {
      try {
        const user = await getUser(uid);
        if (user?.email) {
          const name = user.displayName || 'Usuario';
          await sendTrialExpiringEmail(user.email, name, 0);
        }
      } catch (emailErr) {
        console.error(`[Cron trial-check] Email failed for user ${uid}:`, emailErr);
      }
    }

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
