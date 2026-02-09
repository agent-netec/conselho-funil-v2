export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ChurnPredictor } from '@/lib/intelligence/predictive/churn-predictor';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { brandId?: string; cursor?: string };
    if (!body.brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    const { brandId } = await requireBrandAccess(req, body.brandId);
    const result = await ChurnPredictor.predictBatch(brandId, body.cursor);
    return createApiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    return createApiError(500, 'Erro interno ao calcular churn.');
  }
}
