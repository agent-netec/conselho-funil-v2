/**
 * API Route para Biblioteca de Templates
 * 
 * GET /api/library - Lista templates
 * POST /api/library - Salva novo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import type { LibraryTemplate, Funnel, Proposal } from '@/types/database';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const vertical = searchParams.get('vertical');
    const objective = searchParams.get('objective');

    const adminDb = getAdminFirestore();
    const snapshot = await adminDb.collection('library').orderBy('usageCount', 'desc').get();
    let templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as LibraryTemplate[];

    // Client-side filtering
    if (type) {
      templates = templates.filter(t => t.type === type);
    }
    if (vertical) {
      templates = templates.filter(t => t.metadata?.vertical === vertical);
    }
    if (objective) {
      templates = templates.filter(t => t.metadata?.objective === objective);
    }

    return createApiSuccess({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return createApiError(500, 'Failed to list templates');
  }
}

// POST - Save funnel as template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, proposalId, name, description, tags } = body;

    if (!funnelId || !proposalId) {
      return createApiError(400, 'funnelId and proposalId are required');
    }

    const adminDb = getAdminFirestore();

    // Get funnel data
    const funnelDoc = await adminDb.collection('funnels').doc(funnelId).get();
    if (!funnelDoc.exists) {
      return createApiError(404, 'Funnel not found');
    }
    const funnel = { id: funnelDoc.id, ...funnelDoc.data() } as Funnel;

    // Auth guard: derive brandId from funnel, then verify access
    if ((funnel as any).brandId) {
      try {
        await requireBrandAccess(request, (funnel as any).brandId);
      } catch (err: any) {
        return handleSecurityError(err);
      }
    }

    // Get proposal data
    const proposalDoc = await adminDb.collection('funnels').doc(funnelId).collection('proposals').doc(proposalId).get();
    if (!proposalDoc.exists) {
      return createApiError(404, 'Proposal not found');
    }
    const proposal = { id: proposalDoc.id, ...proposalDoc.data() } as Proposal;

    // Create template - filter out undefined values (Firestore doesn't accept them)
    const template: Record<string, unknown> = {
      type: 'funnel',
      name: name || proposal.name || funnel.name,
      description: description || proposal.summary || '',
      content: proposal.architecture || null,
      metadata: {
        objective: funnel.context.objective || null,
        vertical: funnel.context.market || null,
        ticket: funnel.context.offer?.ticket || null,
        tags: tags || [],
        originalFunnelId: funnelId,
        originalProposalId: proposalId,
        channel: funnel.context.channel?.main || null,
        stages: proposal.architecture?.stages?.length || 0,
        scorecard: proposal.scorecard || null,
        strategy: proposal.strategy || null,
        assets: proposal.assets || null,
      },
      usageCount: 0,
      createdAt: Timestamp.now(),
    };

    // Only add optional fields if they have values
    if (funnel.tenantId) {
      template.tenantId = funnel.tenantId;
    }
    if (funnel.userId) {
      template.createdBy = funnel.userId;
    }

    const templateRef = await adminDb.collection('library').add(template);

    console.log(`📚 Template salvo: ${templateRef.id}`);

    return createApiSuccess({
      templateId: templateRef.id,
      template: {
        id: templateRef.id,
        ...template,
      },
    });
  } catch (error) {
    console.error('Error saving template:', error);
    return createApiError(500, 'Failed to save template', { details: String(error) });
  }
}
