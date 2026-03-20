export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * POST /api/admin/reset-trials
 *
 * One-time script: resets all existing trial users to 7-day trial from now.
 * Protected by verifyAdminRole.
 *
 * Sprint 00.6: After confirming it works, this endpoint can be deleted.
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAdminRole(request);

    const db = getAdminFirestore();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const newExpiry = Timestamp.fromMillis(now + sevenDaysMs);

    // Find all users with tier = 'trial'
    const trialSnap = await db.collection('users')
      .where('tier', '==', 'trial')
      .get();

    if (trialSnap.empty) {
      return createApiSuccess({ message: 'No trial users found', updated: 0 });
    }

    const batch = db.batch();
    let count = 0;

    for (const doc of trialSnap.docs) {
      const data = doc.data();
      const currentExpiry = data.trialExpiresAt?.toMillis?.() ?? 0;

      // Only reset if trial hasn't expired yet or has more than 7 days remaining
      // (avoid penalizing users who just signed up)
      const remainingMs = currentExpiry - now;
      if (remainingMs > sevenDaysMs) {
        // User has more than 7 days — cap at 7 days from now
        batch.update(doc.ref, { trialExpiresAt: newExpiry });
        count++;
      }
    }

    if (count > 0) {
      await batch.commit();
    }

    return createApiSuccess({
      message: `Reset ${count} trial users to 7-day trial`,
      updated: count,
      totalTrialUsers: trialSnap.size,
      skipped: trialSnap.size - count,
    });
  } catch (error: unknown) {
    if ((error as any)?.statusCode === 403) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Failed to reset trials');
  }
}
