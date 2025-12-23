/**
 * API Route para Decisões de Copy
 * 
 * POST /api/copy/decisions - Criar decisão (aprovar/ajustar/matar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  doc, 
  getDoc, 
  updateDoc,
  collection, 
  addDoc, 
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CopyDecision } from '@/types/database';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, copyProposalId, type, userId, feedback, adjustments } = body;

    // Validate required fields
    if (!funnelId || !copyProposalId || !type || !userId) {
      return NextResponse.json(
        { error: 'funnelId, copyProposalId, type, and userId are required' },
        { status: 400 }
      );
    }

    // Validate type
    if (!['approve', 'adjust', 'kill'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be approve, adjust, or kill' },
        { status: 400 }
      );
    }

    // Verify copy proposal exists
    const copyProposalRef = doc(db, 'funnels', funnelId, 'copyProposals', copyProposalId);
    const copyProposalSnap = await getDoc(copyProposalRef);
    
    if (!copyProposalSnap.exists()) {
      return NextResponse.json({ error: 'Copy proposal not found' }, { status: 404 });
    }

    // Update copy proposal status
    const newStatus = type === 'approve' ? 'approved' : type === 'kill' ? 'rejected' : 'pending';
    await updateDoc(copyProposalRef, { 
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // Create decision record
    const decisionData: Omit<CopyDecision, 'id'> = {
      funnelId,
      copyProposalId,
      type,
      userId,
      feedback: feedback || null,
      adjustments: type === 'adjust' && adjustments ? adjustments : undefined,
      createdAt: Timestamp.now(),
    };

    // Save decision
    const decisionsRef = collection(db, 'copyDecisions');
    const newDecision = await addDoc(decisionsRef, decisionData);

    // If adjusting, trigger regeneration (fire and forget)
    if (type === 'adjust' && adjustments && adjustments.length > 0) {
      const copyProposal = copyProposalSnap.data();
      
      fetch(`${request.nextUrl.origin}/api/copy/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          funnelId,
          proposalId: copyProposal.proposalId,
          copyType: copyProposal.type,
          awarenessStage: copyProposal.awarenessStage,
          userId,
          // Pass adjustments context
          parentCopyId: copyProposalId,
          adjustments,
        }),
      }).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      decision: {
        id: newDecision.id,
        ...decisionData,
      },
      message: type === 'approve' 
        ? 'Copy aprovado com sucesso!' 
        : type === 'adjust' 
          ? 'Ajuste solicitado. Nova versão será gerada.' 
          : 'Copy descartado.',
    });

  } catch (error) {
    console.error('Copy decision error:', error);
    return NextResponse.json(
      { error: 'Failed to process decision', details: String(error) },
      { status: 500 }
    );
  }
}

