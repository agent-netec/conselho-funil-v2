import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { deleteAsset, getAsset } from '@/lib/firebase/assets';
import { deleteFromPinecone } from '@/lib/ai/pinecone';

export const runtime = 'nodejs';

/**
 * DELETE handler for full asset cleanup (Firestore + Storage + Pinecone vectors).
 * J-2.3: Called by the metrics dashboard delete button.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId, brandId } = body;

    if (!assetId) {
      return createApiError(400, 'assetId is required');
    }

    // Fetch asset to get storageUrl
    const asset = await getAsset(assetId);
    const storageUrl = asset?.url || '';

    // 1. Delete from Firestore + Storage
    await deleteAsset(assetId, storageUrl);

    // 2. Delete vectors from Pinecone (best-effort)
    if (brandId) {
      try {
        await deleteFromPinecone(assetId, brandId);
      } catch (err: any) {
        console.warn('[Asset Delete] Pinecone cleanup failed:', err.message);
      }
    }

    return createApiSuccess({ deleted: true, assetId });
  } catch (error: any) {
    console.error('[Asset Delete] Error:', error);
    return createApiError(500, 'Failed to delete asset', { details: error.message });
  }
}
