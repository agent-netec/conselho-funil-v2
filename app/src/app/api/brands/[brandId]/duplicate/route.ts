/**
 * R-4.4: Brand Duplication — copy brand with new ID.
 * POST /api/brands/[brandId]/duplicate
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';

const SUBCOLLECTIONS_TO_COPY = [
  'content_calendar',
  'automation_rules',
  'voice_profiles',
  'funnels',
  'keywords',
];

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const { userId } = await requireBrandAccess(req, brandId);

    const adminDb = getAdminFirestore();

    // Read original brand
    const brandRef = adminDb.collection('brands').doc(brandId);
    const brandSnap = await brandRef.get();

    if (!brandSnap.exists) {
      return createApiError(404, 'Brand não encontrada');
    }

    const original = brandSnap.data() as any;
    const now = Timestamp.now();

    // Create new brand (copy + rename)
    const newBrandRef = await adminDb.collection('brands').add({
      ...original,
      name: `${original.name} (Cópia)`,
      userId,
      createdAt: now as any,
      updatedAt: now as any,
    });

    // Copy subcollections
    for (const sub of SUBCOLLECTIONS_TO_COPY) {
      const subRef = adminDb.collection('brands').doc(brandId).collection(sub);
      const snapshot = await subRef.get();
      const newSubRef = adminDb.collection('brands').doc(newBrandRef.id).collection(sub);

      for (const docSnap of snapshot.docs) {
        await newSubRef.add({
          ...docSnap.data(),
          createdAt: now as any,
        });
      }
    }

    return createApiSuccess({
      newBrandId: newBrandRef.id,
      message: 'Brand duplicada com sucesso',
    });
  } catch (error) {
    return handleSecurityError(error);
  }
}
