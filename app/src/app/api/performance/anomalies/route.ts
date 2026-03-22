import { NextRequest, NextResponse } from 'next/server';
import { SentryEngine } from '@/lib/performance/sentry-engine';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { handleSecurityError, ApiError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * GET /api/performance/anomalies
 * Lista anomalias reais detectadas para uma marca.
 * Sprint 12: Mock data removido — apenas dados reais do Firestore.
 * Query Params: brandId, status?, limit?
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get('brandId');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório.');
    }

    try {
      const { effectiveTier } = await requireBrandAccess(req, brandId);
      requireMinTier(effectiveTier, 'agency');
    } catch (error) {
      return handleSecurityError(error);
    }

    const anomalies = await SentryEngine.listAnomalies(brandId, status || undefined, limit);

    return createApiSuccess({ anomalies });

  } catch (error) {
    console.error('[API Performance Anomalies] Erro:', error);
    return createApiError(500, 'Erro interno ao buscar anomalias.');
  }
}

/**
 * PATCH /api/performance/anomalies
 * Acknowledge an anomaly (set status to 'acknowledged').
 * Body: { brandId, anomalyId }
 * Sprint 08.6: Real persistence instead of console.log stub.
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, anomalyId } = body as { brandId?: string; anomalyId?: string };

    if (!brandId || !anomalyId) {
      return createApiError(400, 'brandId e anomalyId são obrigatórios');
    }

    const { effectiveTier } = await requireBrandAccess(req, brandId);
    requireMinTier(effectiveTier, 'agency');

    const db = getAdminFirestore();
    const docRef = db.collection('brands').doc(brandId).collection('performance_anomalies').doc(anomalyId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return createApiError(404, 'Anomalia não encontrada');
    }

    await docRef.update({
      status: 'acknowledged',
      acknowledgedAt: Timestamp.now(),
    });

    return createApiSuccess({ id: anomalyId, status: 'acknowledged' });
  } catch (error) {
    console.error('[API Anomalies PATCH] Error:', error);
    return handleSecurityError(error);
  }
}
