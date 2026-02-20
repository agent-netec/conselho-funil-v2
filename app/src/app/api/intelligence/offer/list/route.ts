export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { collection, getDocs, query, orderBy, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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

    const offersRef = collection(db, 'brands', safeBrandId, 'offers');
    const q = query(offersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

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

    if (action === 'activate') {
      // Deactivate current active offers, then activate this one
      const offersRef = collection(db, 'brands', safeBrandId, 'offers');
      const allSnap = await getDocs(offersRef);
      const batch = writeBatch(db);

      for (const d of allSnap.docs) {
        const data = d.data();
        if (data.status === 'active') {
          batch.update(d.ref, { status: 'archived', updatedAt: new Date() });
        }
      }

      const targetRef = doc(db, 'brands', safeBrandId, 'offers', offerId);
      batch.update(targetRef, { status: 'active', updatedAt: new Date() });

      await batch.commit();
      return createApiSuccess({ status: 'active' });
    }

    if (action === 'archive') {
      const targetRef = doc(db, 'brands', safeBrandId, 'offers', offerId);
      const { updateDoc, Timestamp } = await import('firebase/firestore');
      await updateDoc(targetRef, { status: 'archived', updatedAt: Timestamp.now() });
      return createApiSuccess({ status: 'archived' });
    }

    if (action === 'duplicate') {
      const { getDoc, setDoc, Timestamp } = await import('firebase/firestore');
      const { v4: uuidv4 } = await import('uuid');
      const srcRef = doc(db, 'brands', safeBrandId, 'offers', offerId);
      const srcSnap = await getDoc(srcRef);

      if (!srcSnap.exists()) {
        return createApiError(404, 'Oferta não encontrada.');
      }

      const srcData = srcSnap.data();
      const newId = `off_${uuidv4()}`;
      const now = Timestamp.now();
      const { aiEvaluation: _removed, ...srcDataClean } = srcData as Record<string, any>;
      const newDoc = {
        ...srcDataClean,
        id: newId,
        name: `${srcData.name || 'Oferta'} (cópia)`,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      };

      const newRef = doc(db, 'brands', safeBrandId, 'offers', newId);
      await setDoc(newRef, newDoc);

      return createApiSuccess({ offer: newDoc });
    }

    return createApiError(400, `Ação desconhecida: ${action}`);
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    console.error('[OFFER_ACTION_API_ERROR]:', error);
    return createApiError(500, 'Erro ao executar ação na oferta.');
  }
}
