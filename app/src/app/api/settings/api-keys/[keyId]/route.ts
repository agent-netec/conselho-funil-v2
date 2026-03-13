import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { createApiSuccess, createApiError } from '@/lib/utils/api-response';
import { requireUser } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ keyId: string }> }) {
  let userId: string;
  try {
    userId = await requireUser(req);
  } catch (error) {
    return handleSecurityError(error);
  }

  try {
    const { keyId } = await params;
    const adminDb = getAdminFirestore();
    const keyRef = adminDb.collection('users').doc(userId).collection('api_keys').doc(keyId);

    // Verify key exists before deleting
    const keySnap = await keyRef.get();
    if (!keySnap.exists) {
      return createApiError(404, 'API key not found');
    }

    await keyRef.delete();
    return createApiSuccess({ deleted: true });
  } catch (error: any) {
    return createApiError(500, error.message || 'Failed to delete API key');
  }
}
