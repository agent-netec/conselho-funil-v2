/**
 * API Route para Biblioteca de Templates
 * 
 * GET /api/library - Lista templates
 * POST /api/library - Salva novo template
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  where,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { LibraryTemplate, Funnel, Proposal } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - List templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const vertical = searchParams.get('vertical');
    const objective = searchParams.get('objective');

    let q = query(
      collection(db, 'library'),
      orderBy('usageCount', 'desc')
    );

    const snapshot = await getDocs(q);
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

    return NextResponse.json({
      templates,
      total: templates.length,
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// POST - Save funnel as template
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funnelId, proposalId, name, description, tags } = body;

    if (!funnelId || !proposalId) {
      return NextResponse.json(
        { error: 'funnelId and proposalId are required' },
        { status: 400 }
      );
    }

    // Get funnel data
    const funnelDoc = await getDoc(doc(db, 'funnels', funnelId));
    if (!funnelDoc.exists()) {
      return NextResponse.json(
        { error: 'Funnel not found' },
        { status: 404 }
      );
    }
    const funnel = { id: funnelDoc.id, ...funnelDoc.data() } as Funnel;

    // Get proposal data
    const proposalDoc = await getDoc(doc(db, 'funnels', funnelId, 'proposals', proposalId));
    if (!proposalDoc.exists()) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }
    const proposal = { id: proposalDoc.id, ...proposalDoc.data() } as Proposal;

    // Create template
    const template: Omit<LibraryTemplate, 'id'> = {
      tenantId: funnel.tenantId || undefined,
      type: 'funnel',
      name: name || proposal.name || funnel.name,
      description: description || proposal.summary || '',
      content: proposal.architecture,
      metadata: {
        objective: funnel.context.objective,
        vertical: funnel.context.market,
        ticket: funnel.context.offer?.ticket,
        tags: tags || [],
        // Store additional info
        originalFunnelId: funnelId,
        originalProposalId: proposalId,
        channel: funnel.context.channel?.main,
        stages: proposal.architecture?.stages?.length || 0,
        scorecard: proposal.scorecard,
        strategy: proposal.strategy,
        assets: proposal.assets,
      },
      usageCount: 0,
      createdAt: Timestamp.now(),
      createdBy: funnel.userId,
    };

    const templateRef = await addDoc(collection(db, 'library'), template);

    console.log(`📚 Template salvo: ${templateRef.id}`);

    return NextResponse.json({
      success: true,
      templateId: templateRef.id,
      template: {
        id: templateRef.id,
        ...template,
      },
    });
  } catch (error) {
    console.error('Error saving template:', error);
    return NextResponse.json(
      { error: 'Failed to save template', details: String(error) },
      { status: 500 }
    );
  }
}
