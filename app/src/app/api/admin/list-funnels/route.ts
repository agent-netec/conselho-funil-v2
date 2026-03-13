/**
 * API Admin para listar funis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const adminDb = getAdminFirestore();
    const snapshot = await adminDb.collection('funnels')
      .orderBy('updatedAt', 'desc')
      .limit(20)
      .get();

    const funnels = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      status: doc.data().status,
    }));

    return createApiSuccess({ funnels, total: funnels.length });
  } catch (error) {
    return handleSecurityError(error);
  }
}



