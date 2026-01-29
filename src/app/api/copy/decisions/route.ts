export const dynamic = 'force-dynamic';
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
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import type { CopyDecision } from '@/types/database';
import type { CampaignContext } from '@/types/campaign';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, campaignId, copyProposalId, type, userId, feedback, adjustments } = body;

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

    // If adjusting, require non-empty adjustments array
    if (type === 'adjust') {
      if (!Array.isArray(adjustments) || adjustments.length === 0) {
        return NextResponse.json(
          { error: 'adjustments must be a non-empty array when type is adjust' },
          { status: 400 }
        );
      }
    }

    // Create decision record (Firestore does NOT accept undefined values)
    const decisionData: Omit<CopyDecision, 'id'> & Record<string, unknown> = {
      funnelId,
      copyProposalId,
      type,
      userId,
      feedback: feedback || null,
      createdAt: Timestamp.now(),
    };

    if (type === 'adjust' && Array.isArray(adjustments) && adjustments.length > 0) {
      decisionData.adjustments = adjustments;
    }

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

    // If approved, update the Golden Thread (CampaignContext)
    if (type === 'approve') {
      try {
        const copyProposal = copyProposalSnap.data();
        const docId = campaignId || funnelId;
        const campaignRef = doc(db, 'campaigns', docId);
        
        // ST-11.12: Full Handoff - Get funnel data to populate campaign if it's new
        const funnelRef = doc(db, 'funnels', funnelId);
        const funnelSnap = await getDoc(funnelRef);
        const funnelData = funnelSnap.exists() ? funnelSnap.data() : {};

        const campaignData: Partial<CampaignContext> = {
          funnelId, // ST-11.21: Vínculo obrigatório com funil de origem
          brandId: funnelData.brandId || '',
          userId: funnelData.userId || userId,
          name: funnelData.name || 'Nova Campanha',
          status: 'active',
          funnel: {
            type: funnelData.type || '',
            architecture: funnelData.architecture || '',
            targetAudience: funnelData.targetAudience || funnelData.context?.audience?.who || '',
            mainGoal: funnelData.mainGoal || funnelData.context?.objective || '',
            stages: funnelData.stages || [],
            summary: funnelData.summary || '',
          },
          copywriting: {
            bigIdea: copyProposal.content.primary?.slice(0, 500) || 'Big Idea aprovada',
            headlines: copyProposal.content.headlines || [],
            mainScript: copyProposal.content.primary || '',
            tone: copyProposal.awarenessStage || 'problem_aware',
            keyBenefits: [], 
            counselor_reference: copyProposal.copywriterInsights?.[0]?.copywriterName || 'Conselho de Copy',
          },
          updatedAt: Timestamp.now(),
        };

        // Ensure createdAt exists
        const campaignSnap = await getDoc(campaignRef);
        if (!campaignSnap.exists()) {
          (campaignData as any).createdAt = Timestamp.now();
        }

        await updateCampaignManifesto(docId, campaignData);
        console.log(`[Golden Thread] Handoff completo: Campanha ${docId} sincronizada.`);
      } catch (err) {
        console.error('[Golden Thread] Falha no handoff de copy para campanha:', err);
      }
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



