export const dynamic = 'force-dynamic';
/**
 * API Route para Decisões de Copy
 * 
 * POST /api/copy/decisions - Criar decisão (aprovar/ajustar/matar)
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import type { CopyDecision } from '@/types/database';
import type { CampaignContext } from '@/types/campaign';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // TASK 3.3: userId comes from verified token, NOT from body
    const { funnelId, campaignId, copyProposalId, type, feedback, adjustments } = body;

    // Validate required fields (userId removed — extracted from token below)
    if (!funnelId || !copyProposalId || !type) {
      return createApiError(400, 'funnelId, copyProposalId, and type are required');
    }

    // Validate type
    if (!['approve', 'adjust', 'kill'].includes(type)) {
      return createApiError(400, 'type must be approve, adjust, or kill');
    }

    const adminDb = getAdminFirestore();

    // Auth guard: derive brandId from funnel, then verify access; get userId from token
    let userId: string = '';
    const funnelGuardSnap = await adminDb.collection('funnels').doc(funnelId).get();
    if (funnelGuardSnap.exists) {
      const funnelBrandId = (funnelGuardSnap.data() as any).brandId;
      if (funnelBrandId) {
        try {
          const access = await requireBrandAccess(request, funnelBrandId);
          userId = access.userId;
        } catch (err: any) {
          return handleSecurityError(err);
        }
      }
    }

    // Verify copy proposal exists
    const copyProposalRef = adminDb.collection('funnels').doc(funnelId).collection('copyProposals').doc(copyProposalId);
    const copyProposalSnap = await copyProposalRef.get();
    
    if (!copyProposalSnap.exists) {
      return createApiError(404, 'Copy proposal not found');
    }

    // Update copy proposal status
    const newStatus = type === 'approve' ? 'approved' : type === 'kill' ? 'rejected' : 'pending';
    await copyProposalRef.update({
      status: newStatus,
      updatedAt: Timestamp.now(),
    });

    // If adjusting, require non-empty adjustments array
    if (type === 'adjust') {
      if (!Array.isArray(adjustments) || adjustments.length === 0) {
        return createApiError(400, 'adjustments must be a non-empty array when type is adjust');
      }
    }

    // Create decision record (Firestore does NOT accept undefined values)
    // Using Record<string, unknown> to avoid Admin/Client Timestamp type conflict
    const decisionData: Record<string, unknown> = {
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
    const decisionsRef = adminDb.collection('copyDecisions');
    const newDecision = await decisionsRef.add(decisionData);

    // If adjusting, trigger regeneration (fire and forget)
    if (type === 'adjust' && adjustments && adjustments.length > 0) {
      const copyProposal = copyProposalSnap.data() as any;
      
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
        const copyProposal = copyProposalSnap.data() as any;
        const docId = campaignId || funnelId;
        const campaignRef = adminDb.collection('campaigns').doc(docId);

        // ST-11.12: Full Handoff - Get funnel data to populate campaign if it's new
        const funnelSnap = await adminDb.collection('funnels').doc(funnelId).get();
        const funnelData: any = funnelSnap.exists ? funnelSnap.data() : {};

        // Load active offer from Offer Lab (if any)
        let offerData: CampaignContext['offer'] | undefined;
        if (funnelData.brandId) {
          try {
            const offersRef = adminDb.collection('brands').doc(funnelData.brandId).collection('offers');
            const activeSnap = await offersRef
              .where('status', '==', 'active')
              .orderBy('updatedAt', 'desc')
              .limit(1)
              .get();
            const offerSnap = activeSnap.empty
              ? await offersRef.orderBy('updatedAt', 'desc').limit(1).get()
              : activeSnap;
            if (!offerSnap.empty) {
              const o = offerSnap.docs[0].data();
              offerData = {
                offerId: offerSnap.docs[0].id,
                name: o.name || 'Oferta',
                score: o.scoring?.total || 0,
                promise: o.components?.coreProduct?.promise || '',
              };
            }
          } catch (err) {
            console.warn('[Golden Thread] Offer Lab load failed:', err);
          }
        }

        const campaignData: Partial<CampaignContext> = {
          funnelId, // ST-11.21: Vínculo obrigatório com funil de origem
          brandId: funnelData.brandId || '',
          userId: funnelData.userId || userId,
          name: funnelData.name || 'Nova Campanha',
          status: 'active',
          ...(offerData ? { offer: offerData } : {}),
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
            counselor_reference: copyProposal.copywriterInsights?.[0]?.copywriterName || 'Copywriting',
          },
          updatedAt: Timestamp.now() as any,
        };

        // Ensure createdAt exists
        const campaignSnap = await campaignRef.get();
        if (!campaignSnap.exists) {
          (campaignData as any).createdAt = Timestamp.now();
        }

        await updateCampaignManifesto(docId, campaignData);
        console.log(`[Golden Thread] Handoff completo: Campanha ${docId} sincronizada.`);
      } catch (err) {
        console.error('[Golden Thread] Falha no handoff de copy para campanha:', err);
      }
    }

    return createApiSuccess({
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
    return createApiError(500, 'Failed to process decision', { details: String(error) });
  }
}



