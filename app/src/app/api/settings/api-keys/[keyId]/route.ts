import { NextRequest } from 'next/server';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
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
    const keyRef = doc(db, 'users', userId, 'api_keys', keyId);

    // Verify key exists before deleting
    const keySnap = await getDoc(keyRef);
    if (!keySnap.exists()) {
      return createApiError(404, 'API key not found');
    }

    await deleteDoc(keyRef);
    return createApiSuccess({ deleted: true });
  } catch (error: any) {
    return createApiError(500, error.message || 'Failed to delete API key');
  }
}
