import { NextResponse } from 'next/server';
import { OfferScoringEngine } from '@/lib/intelligence/offer-lab/scoring';

/**
 * Handler para cálculo do Irresistibility Score da oferta.
 * POST /api/intelligence/offer/calculate-score
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brandId, offerData } = body;

    if (!brandId || !offerData) {
      return NextResponse.json(
        { error: 'Parâmetros obrigatórios ausentes (brandId, offerData).' },
        { status: 400 }
      );
    }

    // Executar o motor de scoring
    const scoringResult = OfferScoringEngine.calculateScore(offerData);

    return NextResponse.json({
      success: true,
      scoring: scoringResult
    });
  } catch (error: any) {
    console.error('[OFFER_SCORING_API_ERROR]:', error);
    return NextResponse.json(
      { error: 'Erro interno ao calcular o score da oferta.' },
      { status: 500 }
    );
  }
}
