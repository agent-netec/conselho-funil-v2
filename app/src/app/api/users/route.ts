export const dynamic = 'force-dynamic';
/**
 * POST /api/users — Create user document (first login)
 * PATCH /api/users — Update last login timestamp
 *
 * Uses Admin SDK to avoid client-side Firestore auth race condition.
 * Called right after onAuthStateChanged fires, when Firestore credentialsProvider
 * may not yet have received the auth token.
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';

/** Create user document (first login / new user) */
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser(request);

    const body = await request.json().catch(() => null);
    if (!body) return createApiError(400, 'Request body required');

    const { email, name, role, avatar } = body;
    if (!email || !name) return createApiError(400, 'Missing required user fields');

    const adminDb = getAdminFirestore();
    const now = Timestamp.now();

    const trialExpiresAt = new Date();
    trialExpiresAt.setDate(trialExpiresAt.getDate() + 7);

    const userData: Record<string, unknown> = {
      email,
      name,
      role: 'member',
      credits: 10,
      usage: 0,
      onboardingCompleted: false,
      tier: 'trial',
      trialExpiresAt: Timestamp.fromDate(trialExpiresAt),
      createdAt: now,
      lastLogin: now,
    };
    if (avatar) userData.avatar = avatar;

    await adminDb.collection('users').doc(userId).set(userData);

    return createApiSuccess({ userId });
  } catch (error) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[POST /api/users] Error:', error);
    return createApiError(500, 'Failed to create user');
  }
}

/** Update last login timestamp */
export async function PATCH(request: NextRequest) {
  try {
    const userId = await requireUser(request);

    const adminDb = getAdminFirestore();
    await adminDb.collection('users').doc(userId).update({
      lastLogin: Timestamp.now(),
    });

    return createApiSuccess({ updated: true });
  } catch (error) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[PATCH /api/users] Error:', error);
    return createApiError(500, 'Failed to update last login');
  }
}
