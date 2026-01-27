/**
 * API Admin para listar funis
 */

import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const q = query(
      collection(db, 'funnels'),
      orderBy('updatedAt', 'desc'),
      limit(20)
    );

    const snapshot = await getDocs(q);
    const funnels = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      status: doc.data().status,
    }));

    return NextResponse.json({ funnels, total: funnels.length });
  } catch (error) {
    return handleSecurityError(error);
  }
}



