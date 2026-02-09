/**
 * API Admin para gerenciar status de funis
 * 
 * PATCH /api/admin/funnel-status
 * Body: { funnelId: string, status: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_STATUSES = [
  'draft',
  'generating', 
  'review',
  'approved',
  'adjusting',
  'executing',
  'completed',
  'killed',
];

export async function PATCH(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const body = await request.json();
    const { funnelId, status } = body;

    if (!funnelId || !status) {
      return createApiError(400, 'funnelId and status are required');
    }

    if (!VALID_STATUSES.includes(status)) {
      return createApiError(400, `Invalid status. Valid: ${VALID_STATUSES.join(', ')}`);
    }

    console.log(`🔧 Admin: Updating funnel ${funnelId} status to ${status}`);

    await updateDoc(doc(db, 'funnels', funnelId), {
      status,
      updatedAt: Timestamp.now(),
    });

    return createApiSuccess({ funnelId, newStatus: status });

  } catch (error) {
    return handleSecurityError(error);
  }
}

// GET - List all funnels with their status (for debugging)
export async function GET(request: NextRequest) {
  try {
    // Hardening: Verificar role de admin
    await verifyAdminRole(request);

    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
      return createApiError(400, 'funnelId query param required');
    }

    const { getDoc } = await import('firebase/firestore');
    const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));

    if (!funnelDoc.exists()) {
      return createApiError(404, 'Funnel not found');
    }

    const data = funnelDoc.data();
    return createApiSuccess({
      id: funnelDoc.id,
      name: data.name,
      status: data.status,
      updatedAt: data.updatedAt?.toDate?.(),
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return createApiError(500, 'Failed to get funnel', { details: String(error) });
  }
}



