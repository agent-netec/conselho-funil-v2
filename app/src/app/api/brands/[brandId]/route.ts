export const dynamic = 'force-dynamic';
/**
 * PATCH /api/brands/[brandId]
 * Updates a brand document using Admin SDK (bypasses Firestore Security Rules).
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    await requireBrandAccess(request, brandId);

    const body = await request.json().catch(() => null);
    if (!body) {
      return createApiError(400, 'Request body required');
    }

    const adminDb = getAdminFirestore();
    await adminDb.collection('brands').doc(brandId).update({
      ...body,
      updatedAt: Timestamp.now(),
    });

    return createApiSuccess({ updated: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    console.error('[PATCH /api/brands/[brandId]] Error:', error);
    return createApiError(500, 'Failed to update brand');
  }
}
