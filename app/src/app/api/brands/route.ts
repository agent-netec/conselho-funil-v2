export const dynamic = 'force-dynamic';
/**
 * POST /api/brands
 * Creates a new brand document using Admin SDK (bypasses Firestore Security Rules).
 * Fixes client-side auth race condition where request.auth is null despite user being authenticated.
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireUser } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUser(request);

    const body = await request.json().catch(() => null);
    if (!body) {
      return createApiError(400, 'Request body required');
    }

    const { name, vertical, positioning, voiceTone, audience, offer } = body;

    if (!name || !vertical || !positioning || !voiceTone || !audience || !offer) {
      return createApiError(400, 'Missing required brand fields');
    }

    const adminDb = getAdminFirestore();
    const now = Timestamp.now();

    const brandData = {
      userId,
      name,
      vertical,
      positioning,
      voiceTone,
      audience,
      offer,
      createdAt: now,
      updatedAt: now,
    };

    const brandRef = await adminDb.collection('brands').add(brandData);

    return createApiSuccess({ brandId: brandRef.id });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    console.error('[POST /api/brands] Error:', error);
    return createApiError(500, 'Failed to create brand');
  }
}
