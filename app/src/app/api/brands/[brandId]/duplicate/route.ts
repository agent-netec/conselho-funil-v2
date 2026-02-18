/**
 * R-4.4: Brand Duplication — copy brand with new ID.
 * POST /api/brands/[brandId]/duplicate
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, addDoc, collection, getDocs, Timestamp } from 'firebase/firestore';
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

    // Read original brand
    const brandRef = doc(db, 'brands', brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      return createApiError(404, 'Brand não encontrada');
    }

    const original = brandSnap.data();
    const now = Timestamp.now();

    // Create new brand (copy + rename)
    const newBrandRef = await addDoc(collection(db, 'brands'), {
      ...original,
      name: `${original.name} (Cópia)`,
      userId,
      createdAt: now,
      updatedAt: now,
    });

    // Copy subcollections
    for (const sub of SUBCOLLECTIONS_TO_COPY) {
      const subRef = collection(db, 'brands', brandId, sub);
      const snapshot = await getDocs(subRef);
      const newSubRef = collection(db, 'brands', newBrandRef.id, sub);

      for (const docSnap of snapshot.docs) {
        await addDoc(newSubRef, {
          ...docSnap.data(),
          createdAt: now,
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
