export const dynamic = 'force-dynamic';
/**
 * GET    /api/brands/[brandId] — fetches brand via Admin SDK (no Security Rules race)
 * PATCH  /api/brands/[brandId] — updates brand via Admin SDK
 * DELETE /api/brands/[brandId] — cascade-deletes brand + subcollections via Admin SDK
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const { brandId: safeBrandId } = await requireBrandAccess(request, brandId);

    const adminDb = getAdminFirestore();
    const snap = await adminDb.collection('brands').doc(safeBrandId).get();

    if (!snap.exists) {
      return createApiError(404, 'Brand not found');
    }

    return createApiSuccess({ brand: { id: snap.id, ...snap.data() } });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    console.error('[GET /api/brands/[brandId]] Error:', error);
    return createApiError(500, 'Failed to fetch brand');
  }
}

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

/** Cascade-delete brand and all subcollections via Admin SDK */
const BRAND_SUBCOLLECTIONS = [
  'content_calendar',
  'automation_rules',
  'automation_logs',
  'social_interactions',
  'voice_profiles',
  'funnels',
  'conversations',
  'proposals',
  'research',
  'keywords',
  'rate_limits',
  'performance_metrics',
  'performance_anomalies',
  'transactions',
  'webhook_idempotency',
  'notifications',
  'audit_logs',
  'competitors',
  'intelligence',
  'audience_scans',
  'generated_ads',
  'offers',
  'copy_dna',
  'leads',
  'autopsies',
];

async function deleteSubcollectionAdmin(
  adminDb: FirebaseFirestore.Firestore,
  brandId: string,
  subcollectionName: string
) {
  const subRef = adminDb.collection('brands').doc(brandId).collection(subcollectionName);
  const snapshot = await subRef.limit(500).get();
  if (snapshot.empty) return 0;
  const batch = adminDb.batch();
  snapshot.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snapshot.size;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    await requireBrandAccess(request, brandId);

    const adminDb = getAdminFirestore();

    // Delete all subcollections first
    const results = await Promise.allSettled(
      BRAND_SUBCOLLECTIONS.map((sub) => deleteSubcollectionAdmin(adminDb, brandId, sub))
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      console.warn(`[DELETE /api/brands] ${failures.length} subcollection(s) failed for ${brandId}`);
    }

    // Delete brand document
    await adminDb.collection('brands').doc(brandId).delete();

    return createApiSuccess({ deleted: true, brandId });
  } catch (error) {
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    console.error('[DELETE /api/brands/[brandId]] Error:', error);
    return createApiError(500, 'Failed to delete brand');
  }
}
