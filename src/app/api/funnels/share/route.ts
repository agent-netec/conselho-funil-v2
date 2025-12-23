/**
 * API Route para Compartilhamento de Funis
 * 
 * POST /api/funnels/share - Criar/atualizar link de compartilhamento
 * DELETE /api/funnels/share - Remover compartilhamento
 */

import { NextRequest, NextResponse } from 'next/server';
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function generateShareToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 12; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// POST - Create or update share link
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, expiresIn } = body; // expiresIn in days, 0 = never

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId is required' },
        { status: 400 }
      );
    }

    // Verify funnel exists
    const funnelRef = doc(db, 'funnels', funnelId);
    const funnelSnap = await getDoc(funnelRef);
    
    if (!funnelSnap.exists()) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }

    const shareToken = generateShareToken();
    const expiresAt = expiresIn && expiresIn > 0
      ? Timestamp.fromDate(new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000))
      : null;

    // Update funnel with share settings
    await updateDoc(funnelRef, {
      sharing: {
        enabled: true,
        token: shareToken,
        createdAt: Timestamp.now(),
        expiresAt,
      },
    });

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/shared/${shareToken}`;

    return NextResponse.json({
      success: true,
      shareToken,
      shareUrl,
      expiresAt: expiresAt?.toDate() || null,
    });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: 'Failed to create share link', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE - Remove share link
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId is required' },
        { status: 400 }
      );
    }

    const funnelRef = doc(db, 'funnels', funnelId);
    
    await updateDoc(funnelRef, {
      sharing: {
        enabled: false,
        token: null,
        createdAt: null,
        expiresAt: null,
      },
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json(
      { error: 'Failed to remove share link', details: String(error) },
      { status: 500 }
    );
  }
}

