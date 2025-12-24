/**
 * API Admin para gerenciar status de funis
 * 
 * PATCH /api/admin/funnel-status
 * Body: { funnelId: string, status: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

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
    const body = await request.json();
    const { funnelId, status } = body;

    if (!funnelId || !status) {
      return NextResponse.json(
        { error: 'funnelId and status are required' },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Valid: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`🔧 Admin: Updating funnel ${funnelId} status to ${status}`);

    await updateDoc(doc(db, 'funnels', funnelId), {
      status,
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      success: true,
      funnelId,
      newStatus: status,
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to update status', details: String(error) },
      { status: 500 }
    );
  }
}

// GET - List all funnels with their status (for debugging)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId query param required' },
        { status: 400 }
      );
    }

    const { getDoc } = await import('firebase/firestore');
    const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));

    if (!funnelDoc.exists()) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }

    const data = funnelDoc.data();
    return NextResponse.json({
      id: funnelDoc.id,
      name: data.name,
      status: data.status,
      updatedAt: data.updatedAt?.toDate?.(),
    });

  } catch (error) {
    console.error('Admin API error:', error);
    return NextResponse.json(
      { error: 'Failed to get funnel', details: String(error) },
      { status: 500 }
    );
  }
}


