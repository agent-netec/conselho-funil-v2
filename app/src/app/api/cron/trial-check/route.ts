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
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getExpiredTrialUsers, downgradeUsersToFree, getUser } from '@/lib/firebase/firestore';
import type { User } from '@/types/database';
import {
  sendTrialDay1Email,
  sendTrialDay3Email,
  sendTrialDay5Email,
  sendTrialDay7Email,
  sendTrialDay10Email,
  sendTrialDay12Email,
  sendTrialExpiringEmail,
} from '@/lib/email/resend';

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

    // 2. Send nurturing emails to active trial users
    const trialUsersSnapshot = await getDocs(
      query(collection(db, 'users'), where('tier', '==', 'trial'))
    );

    const NURTURE_SCHEDULE = [1, 3, 5, 7, 10, 12] as const;
    let emailsSent = 0;

    for (const userDoc of trialUsersSnapshot.docs) {
      const user = { id: userDoc.id, ...userDoc.data() } as User;
      if (!user.email || !user.createdAt) continue;

      const createdAt = user.createdAt.toDate();
      const now = new Date();
      const trialDay = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

      if (!NURTURE_SCHEDULE.includes(trialDay as any)) continue;
      if (user.lastTrialEmailDay !== undefined && user.lastTrialEmailDay >= trialDay) continue;

      const name = user.name || 'Usuário';
      try {
        let sent = false;

        switch (trialDay) {
          case 1:
            if (!user.onboardingCompleted) {
              await sendTrialDay1Email(user.email, name);
              sent = true;
            }
            break;
          case 3:
            await sendTrialDay3Email(user.email, name);
            sent = true;
            break;
          case 5:
            await sendTrialDay5Email(user.email, name);
            sent = true;
            break;
          case 7:
            await sendTrialDay7Email(user.email, name);
            sent = true;
            break;
          case 10:
            await sendTrialDay10Email(user.email, name);
            sent = true;
            break;
          case 12:
            await sendTrialDay12Email(user.email, name);
            sent = true;
            break;
        }

        if (sent) {
          await updateDoc(doc(db, 'users', user.id), { lastTrialEmailDay: trialDay });
          emailsSent++;
        }
      } catch (err) {
        console.error(`[Cron trial-check] Nurture email failed for ${user.id} (day ${trialDay}):`, err);
      }
    }

    console.log(`[Cron trial-check] Sent ${emailsSent} nurture emails`);

    // 3. Get users with expired trials
    const expiredUserIds = await getExpiredTrialUsers();

    if (expiredUserIds.length === 0) {
      console.log('[Cron trial-check] No expired trials found');
      return createApiSuccess({
        checked: true,
        nurtureEmailsSent: emailsSent,
        expiredTrialsFound: 0,
        downgradedUsers: 0,
      });
    }

    console.log(`[Cron trial-check] Found ${expiredUserIds.length} expired trials`);

    // 4. Downgrade users to free tier
    const downgradedCount = await downgradeUsersToFree(expiredUserIds);

    console.log(`[Cron trial-check] Downgraded ${downgradedCount} users to free tier`);

    // R6.5: Send trial expired emails (non-blocking per user)
    for (const uid of expiredUserIds) {
      try {
        const user = await getUser(uid);
        if (user?.email) {
          const name = user.name || 'Usuario';
          await sendTrialExpiringEmail(user.email, name, 0);
        }
      } catch (emailErr) {
        console.error(`[Cron trial-check] Email failed for user ${uid}:`, emailErr);
      }
    }

    return createApiSuccess({
      checked: true,
      nurtureEmailsSent: emailsSent,
      expiredTrialsFound: expiredUserIds.length,
      downgradedUsers: downgradedCount,
    });
  } catch (error) {
    console.error('[Cron trial-check] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
