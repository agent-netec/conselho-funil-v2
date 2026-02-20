export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { evaluateOfferQuality } from '@/lib/intelligence/offer/evaluator';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * AI-powered offer evaluation with Brain Council (Kennedy + Brunson).
 * POST /api/intelligence/offer/calculate-score
 *
 * Body: { brandId, offerData: { components, scoring } }
 * Returns: { aiEvaluation }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, offerData } = body;

    if (!brandId || !offerData) {
      return createApiError(400, 'Parâmetros obrigatórios ausentes (brandId, offerData).');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // AI evaluation with Brain Council (Pro model)
    const aiEvaluation = await evaluateOfferQuality(offerData);

    return createApiSuccess({
      brandId: safeBrandId,
      aiEvaluation,
    });
  } catch (error: unknown) {
    console.error('[OFFER_SCORING_API_ERROR]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro interno ao calcular o score da oferta.');
  }
}
