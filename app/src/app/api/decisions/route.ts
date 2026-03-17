/**
 * API Route para Histórico de Decisões
 * 
 * GET /api/decisions?funnelId=xxx - Lista decisões de um funil
 * POST /api/decisions - Registra nova decisão
 */

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { Funnel, Proposal } from '@/types/database';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Sanitize an object recursively to remove undefined/NaN/Infinity values
 * Firestore does NOT accept these values
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  
  if (typeof obj === 'number') {
    if (isNaN(obj) || !isFinite(obj)) {
      return 0;
    }
    return obj;
  }
  
  if (typeof obj === 'string') {
    return obj;
  }
  
  if (typeof obj === 'boolean') {
    return obj;
  }
  
  if (obj instanceof Timestamp) {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => sanitizeForFirestore(item));
  }
  
  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        sanitized[key] = sanitizeForFirestore(value);
      }
    }
    return sanitized;
  }
  
  return String(obj);
}

// GET - List decisions for a funnel
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const funnelId = searchParams.get('funnelId');

    if (!funnelId) {
      return createApiError(400, 'funnelId is required');
    }

    const adminDb = getAdminFirestore();

    // Auth guard: derive brandId from funnel, then verify access
    const funnelSnap = await adminDb.collection('funnels').doc(funnelId).get();
    if (funnelSnap.exists) {
      const funnelBrandId = (funnelSnap.data() as any).brandId;
      if (funnelBrandId) {
        try {
          await requireBrandAccess(request, funnelBrandId);
        } catch (err: any) {
          return handleSecurityError(err);
        }
      }
    }

    // ST-11.6: Simplified query to avoid composite index (INC-004)
    const snapshot = await adminDb.collection('decisions').where('funnelId', '==', funnelId).get();
    const decisions = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data() as any,
    }));

    // Sort in memory to avoid needing a composite index
    decisions.sort((a, b) => {
      const dateA = a.createdAt?.seconds || 0;
      const dateB = b.createdAt?.seconds || 0;
      return dateB - dateA;
    });

    return createApiSuccess({ decisions, total: decisions.length });
  } catch (error) {
    console.error('Error listing decisions:', error);
    return createApiError(500, 'Failed to list decisions');
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
    } = body;

    console.log('📝 Creating decision:', { funnelId, proposalId, type, userId });

    // Validate required fields
    if (!funnelId || !proposalId || !type || !userId) {
      return createApiError(400, 'funnelId, proposalId, type, and userId are required');
    }

    const adminDb = getAdminFirestore();

    // Get funnel data
    const funnelDoc = await adminDb.collection('funnels').doc(funnelId).get();
    if (!funnelDoc.exists) {
      return createApiError(404, 'Funnel not found');
    }
    const funnel = funnelDoc.data() as Funnel;

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
    const proposal = proposalDoc.data() as Proposal;

    // Map type to funnel status
    const statusMap: Record<string, string> = {
      'execute': 'approved',
      'adjust': 'adjusting',
      'kill': 'killed',
    };

    // Get score safely - ensure it's a valid number
    let proposalScore = 0;
    if (proposal.scorecard && typeof proposal.scorecard === 'object') {
      const sc = proposal.scorecard as Record<string, any>;
      const rawScore = sc.overall ?? sc.totalScore ?? 0;
      proposalScore = typeof rawScore === 'number' && isFinite(rawScore) ? rawScore : 0;
    }

    // Map decision type
    const typeMap: Record<string, 'EXECUTAR' | 'AJUSTAR' | 'MATAR'> = {
      'execute': 'EXECUTAR',
      'adjust': 'AJUSTAR',
      'kill': 'MATAR',
    };

    // Build nextSteps based on decision type
    let nextSteps: string[] = ['Arquivar proposta', 'Analisar aprendizados'];
    if (type === 'execute') {
      nextSteps = ['Iniciar implementação', 'Configurar métricas', 'Lançar primeira versão'];
    } else if (type === 'adjust') {
      const validAdjustments = Array.isArray(adjustments) 
        ? adjustments.filter((a: unknown): a is string => typeof a === 'string' && a.trim() !== '')
        : [];
      nextSteps = validAdjustments.length > 0 
        ? validAdjustments
        : ['Revisar proposta', 'Aplicar ajustes', 'Reavaliar'];
    }

    // Build the decision object - ALL values must be defined and valid
    const decisionData: Record<string, any> = {
      funnelId: String(funnelId || ''),
      proposalId: String(proposalId || ''),
      type: typeMap[type] || 'EXECUTAR',
      parecer: {
        counselors: [],
        consolidated: {
          dimensions: [],
          totalScore: proposalScore,
          recommendation: String(type || 'execute'),
        },
        summary: String(reason || `Decisão: ${typeMap[type] || 'EXECUTAR'}`),
        nextSteps: nextSteps,
      },
      createdAt: Timestamp.now(),
      createdBy: String(userId || 'anonymous'),
      metadata: {
        userName: String(userName || 'Usuário'),
        proposalName: String(proposal.name || 'Proposta'),
        proposalVersion: typeof proposal.version === 'number' ? proposal.version : 1,
        funnelName: String(funnel.name || 'Funil'),
      },
    };

    // Only add adjustments if valid
    if (type === 'adjust') {
      const validAdjustments = Array.isArray(adjustments)
        ? adjustments.filter((a: unknown): a is string => typeof a === 'string' && a.trim() !== '')
        : [];
      if (validAdjustments.length > 0) {
        decisionData.adjustments = validAdjustments;
      }
    }

    // CRITICAL: Sanitize the entire object to remove any undefined/NaN/Infinity
    const sanitizedData = sanitizeForFirestore(decisionData);

    console.log('📦 Decision data to save:', JSON.stringify(sanitizedData, null, 2));

    // Save decision
    const decisionRef = await adminDb.collection('decisions').add(sanitizedData);

    console.log('✅ Decision saved:', decisionRef.id);

    // Update funnel status
    await adminDb.collection('funnels').doc(funnelId).update({
      status: statusMap[type] || 'review',
      updatedAt: Timestamp.now(),
    });

    // Update proposal status
    const proposalStatus = type === 'execute' ? 'selected' : type === 'kill' ? 'rejected' : 'evaluated';
    await adminDb.collection('funnels').doc(funnelId).collection('proposals').doc(proposalId).update({
      status: proposalStatus,
    });

    console.log(`📋 Decisão registrada: ${typeMap[type] || type} - Funil: ${funnelId}`);

    // If ADJUST, trigger regeneration with adjustments
    let regenerationTriggered = false;
    if (type === 'adjust' && adjustments && adjustments.length > 0) {
      try {
        console.log('🔄 Triggering regeneration with adjustments...');
        
        // Get funnel context for regeneration
        const funnelContext = funnel.context;
        
        // Forward auth headers from original request
        const authHeader = request.headers.get('authorization');
        const cookieHeader = request.headers.get('cookie');
        const regenHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authHeader) regenHeaders['authorization'] = authHeader;
        if (cookieHeader) regenHeaders['cookie'] = cookieHeader;

        // Call generate API with adjustments (fire and forget)
        fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'}/api/funnels/generate`, {
          method: 'POST',
          headers: regenHeaders,
          body: JSON.stringify({
            funnelId,
            context: funnelContext,
            adjustments,
            originalProposalId: proposalId,
            baseVersion: proposal.version || 1,
          }),
        }).catch(err => console.error('Regeneration error:', err));
        
        regenerationTriggered = true;
        console.log('✅ Regeneration triggered');
      } catch (regenError) {
        console.error('Error triggering regeneration:', regenError);
      }
    }

    return createApiSuccess({
      decisionId: decisionRef.id,
      regenerationTriggered,
      decision: {
        id: decisionRef.id,
        ...sanitizedData,
      },
    });
  } catch (error) {
    console.error('Error creating decision:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return createApiError(500, 'Failed to create decision', { details: errorMessage });
  }
}

