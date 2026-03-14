export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * GET /api/intelligence/offer/list?brandId=xxx
 * Lista todas as ofertas de uma brand, ordenadas por createdAt desc.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    const adminDb = getAdminFirestore();
    const snapshot = await adminDb.collection('brands').doc(safeBrandId).collection('offers')
      .orderBy('createdAt', 'desc')
      .get();

    const offers = snapshot.docs.map(d => ({
      id: d.id,
      ...d.data(),
    }));

    return createApiSuccess({ offers });
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[OFFER_LIST_API_ERROR]:', error);
    return createApiError(500, 'Erro ao listar ofertas.');
  }
}

/**
 * PATCH /api/intelligence/offer/list
 * Body: { brandId, offerId, action: 'activate' | 'archive' | 'duplicate' }
 *
 * - activate: set this offer to 'active', archive the previous active
 * - archive: set this offer to 'archived'
 * - duplicate: create a draft copy of the offer
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, offerId, action } = body;

    if (!brandId || !offerId || !action) {
      return createApiError(400, 'brandId, offerId e action são obrigatórios.');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    const adminDb = getAdminFirestore();

    if (action === 'activate') {
      // Deactivate current active offers, then activate this one
      const allSnap = await adminDb.collection('brands').doc(safeBrandId).collection('offers').get();
      const batch = adminDb.batch();

      for (const d of allSnap.docs) {
        const data = d.data();
        if (data.status === 'active') {
          batch.update(d.ref, { status: 'archived', updatedAt: new Date() });
        }
      }

      const targetRef = adminDb.collection('brands').doc(safeBrandId).collection('offers').doc(offerId);
      batch.update(targetRef, { status: 'active', updatedAt: new Date() });

      await batch.commit();
      return createApiSuccess({ status: 'active' });
    }

    if (action === 'archive') {
      const { Timestamp: AdminTimestamp } = await import('firebase-admin/firestore');
      const targetRef = adminDb.collection('brands').doc(safeBrandId).collection('offers').doc(offerId);
      await targetRef.update({ status: 'archived', updatedAt: AdminTimestamp.now() });
      return createApiSuccess({ status: 'archived' });
    }

    if (action === 'duplicate') {
      const { Timestamp: AdminTimestamp } = await import('firebase-admin/firestore');
      const { v4: uuidv4 } = await import('uuid');
      const srcRef = adminDb.collection('brands').doc(safeBrandId).collection('offers').doc(offerId);
      const srcSnap = await srcRef.get();

      if (!srcSnap.exists) {
        return createApiError(404, 'Oferta não encontrada.');
      }

      const srcData = srcSnap.data() as any;
      const newId = `off_${uuidv4()}`;
      const now = AdminTimestamp.now();
      const { aiEvaluation: _removed, ...srcDataClean } = srcData as Record<string, any>;
      const newDoc = {
        ...srcDataClean,
        id: newId,
        name: `${srcData.name || 'Oferta'} (cópia)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };

      const newRef = adminDb.collection('brands').doc(safeBrandId).collection('offers').doc(newId);
      await newRef.set(newDoc);

      return createApiSuccess({ offer: newDoc });
    }

    return createApiError(400, `Ação desconhecida: ${action}`);
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[OFFER_ACTION_API_ERROR]:', error);
    return createApiError(500, 'Erro ao executar ação na oferta.');
  }
}
