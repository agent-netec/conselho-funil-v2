export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { requireBrandAccess, requireMinTier } from '@/lib/auth/brand-guard';
import { consumeCredits, CREDIT_COSTS } from '@/lib/firebase/firestore-server';
import { AudienceForecaster } from '@/lib/intelligence/predictive/audience-forecaster';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { brandId?: string };
    if (!body.brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    const { userId, brandId, effectiveTier } = await requireBrandAccess(req, body.brandId);
    requireMinTier(effectiveTier, 'pro');
    await consumeCredits(userId, CREDIT_COSTS.predict_analyze, 'predict_analyze');
    const result = await AudienceForecaster.forecast(brandId);
    return createApiSuccess(result);
  } catch (error: unknown) {
    if (error instanceof ApiError) return handleSecurityError(error);
    return createApiError(500, 'Erro interno ao gerar forecast.');
  }
}
