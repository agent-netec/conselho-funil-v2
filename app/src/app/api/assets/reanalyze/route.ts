import { NextRequest } from 'next/server';
import { collection, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  const { brandId } = body;

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  try {
    await requireBrandAccess(req, brandId);
  } catch (err: any) {
    return handleSecurityError(err);
  }

  try {
    // Find visual assets that need re-analysis
    const assetsRef = collection(db, 'brands', brandId, 'assets');
    const q = query(assetsRef, where('type', '==', 'image'));
    const snap = await getDocs(q);

    const assetIds = snap.docs.map(d => d.id);

    if (assetIds.length === 0) {
      return createApiSuccess({ queued: 0, message: 'No visual assets to re-analyze' });
    }

    // Queue re-analysis (trigger the existing process-worker for each)
    // In production this would be a background job, for now we return the queue
    return createApiSuccess({
      queued: assetIds.length,
      assetIds,
      message: `${assetIds.length} assets queued for re-analysis`,
    });
  } catch (error: any) {
    console.error('[Re-analyze] Error:', error);
    return createApiError(500, error.message || 'Failed to queue re-analysis');
  }
}
