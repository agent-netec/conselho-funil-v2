/**
 * API Route para Histórico de Decisões
 * 
 * GET /api/decisions?funnelId=xxx - Lista decisões de um funil
 * POST /api/decisions - Registra nova decisão
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
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Decision, Funnel, Proposal } from '@/types/database';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET - List decisions for a funnel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
      return NextResponse.json(
        { error: 'funnelId is required' },
        { status: 400 }
      );
    }

    const q = query(
      collection(db, 'decisions'),
      where('funnelId', '==', funnelId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const decisions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Decision[];

    return NextResponse.json({
      decisions,
      total: decisions.length,
    });
  } catch (error) {
    console.error('Error listing decisions:', error);
    return NextResponse.json(
      { error: 'Failed to list decisions' },
      { status: 500 }
    );
  }
}

// POST - Create new decision
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      funnelId, 
      proposalId, 
      type, 
      userId,
      userName,
      reason,
      adjustments,
      scorecard,
    } = body;

    if (!funnelId || !proposalId || !type || !userId) {
      return NextResponse.json(
        { error: 'funnelId, proposalId, type, and userId are required' },
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
    const funnel = funnelDoc.data() as Funnel;

    // Get proposal data
    const proposalDoc = await getDoc(doc(db, 'funnels', funnelId, 'proposals', proposalId));
    if (!proposalDoc.exists()) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      );
    }
    const proposal = proposalDoc.data() as Proposal;

    // Map type to funnel status
    const statusMap: Record<string, string> = {
      'execute': 'approved',
      'adjust': 'adjusting',
      'kill': 'killed',
    };

    // Get score safely
    const proposalScore = typeof proposal.scorecard === 'object' && proposal.scorecard !== null
      ? (proposal.scorecard as any).overall || (proposal.scorecard as any).totalScore || 0
      : 0;

    // Map decision type
    const typeMap: Record<string, 'EXECUTAR' | 'AJUSTAR' | 'MATAR'> = {
      'execute': 'EXECUTAR',
      'adjust': 'AJUSTAR',
      'kill': 'MATAR',
    };

    // Create decision record
    const decision = {
      funnelId,
      proposalId,
      type: typeMap[type] || 'EXECUTAR',
      parecer: {
        counselors: [],
        consolidated: {
          dimensions: [],
          totalScore: proposalScore,
          recommendation: type,
        },
        summary: reason || `Decisão: ${typeMap[type] || type.toUpperCase()}`,
        nextSteps: type === 'execute' 
          ? ['Iniciar implementação', 'Configurar métricas', 'Lançar primeira versão']
          : type === 'adjust'
          ? adjustments || ['Revisar proposta', 'Aplicar ajustes', 'Reavaliar']
          : ['Arquivar proposta', 'Analisar aprendizados'],
      },
      adjustments: type === 'adjust' ? adjustments : undefined,
      createdAt: Timestamp.now(),
      createdBy: userId,
    };

    // Save decision with safe metadata
    const decisionRef = await addDoc(collection(db, 'decisions'), {
      ...decision,
      // Extra metadata for history
      metadata: {
        userName: userName || 'Usuário',
        proposalName: proposal.name || 'Proposta',
        proposalVersion: proposal.version || 1,
        funnelName: funnel.name || 'Funil',
      },
    });
    
    console.log('✅ Decision saved:', decisionRef.id);

    // Update funnel status
    await updateDoc(doc(db, 'funnels', funnelId), {
      status: statusMap[type] || 'review',
      updatedAt: Timestamp.now(),
    });

    // Update proposal status
    await updateDoc(doc(db, 'funnels', funnelId, 'proposals', proposalId), {
      status: type === 'execute' ? 'selected' : type === 'kill' ? 'rejected' : 'evaluated',
    });

    console.log(`📋 Decisão registrada: ${type.toUpperCase()} - Funil: ${funnelId}`);

    return NextResponse.json({
      success: true,
      decisionId: decisionRef.id,
      decision: {
        id: decisionRef.id,
        ...decision,
      },
    });
  } catch (error) {
    console.error('Error creating decision:', error);
    return NextResponse.json(
      { error: 'Failed to create decision', details: String(error) },
      { status: 500 }
    );
  }
}

