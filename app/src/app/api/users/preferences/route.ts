export const dynamic = 'force-dynamic';
/**
 * PATCH /api/users/preferences
 * Updates user preferences using Admin SDK (bypasses Firestore Security Rules).
 * Fixes client-side auth race condition on onboarding/settings writes.
 */

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';

export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUser(request);

    const body = await request.json().catch(() => null);
    if (!body) {
      return createApiError(400, 'Request body required');
    }

    const adminDb = getAdminFirestore();

    // Build dot-notation update object (same logic as client-side updateUserPreferences)
    const updates: Record<string, unknown> = {};
    if (body.theme !== undefined) updates['preferences.theme'] = body.theme;
    if (body.notifications !== undefined) updates['preferences.notifications'] = body.notifications;
    if (body.branding !== undefined) updates['preferences.branding'] = body.branding;
    if (body.onboardingPhase1AComplete !== undefined) {
      updates['preferences.onboardingPhase1AComplete'] = body.onboardingPhase1AComplete;
    }

    if (Object.keys(updates).length === 0) {
      return createApiError(400, 'No valid preference fields provided');
    }

    await adminDb.collection('users').doc(userId).update(updates);

    return createApiSuccess({ updated: true });
  } catch (error) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[PATCH /api/users/preferences] Error:', error);
    return createApiError(500, 'Failed to update preferences');
  }
}
