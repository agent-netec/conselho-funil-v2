export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { OfferScoringEngine } from '@/lib/intelligence/offer-lab/scoring';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * Handler para cálculo do Irresistibility Score da oferta.
 * POST /api/intelligence/offer/calculate-score
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, offerData } = body;

    if (!brandId || !offerData) {
      return createApiError(400, 'Parâmetros obrigatórios ausentes (brandId, offerData).');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);

    // Executar o motor de scoring
    const scoringResult = OfferScoringEngine.calculateScore(offerData);

    return createApiSuccess({ scoring: scoringResult, brandId: safeBrandId });
  } catch (error: unknown) {
    console.error('[OFFER_SCORING_API_ERROR]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro interno ao calcular o score da oferta.');
  }
}
