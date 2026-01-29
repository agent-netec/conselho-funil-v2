export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { OfferLabEngine } from '@/lib/intelligence/offer/calculator';
import { OfferDocument, OfferWizardState } from '@/types/offer';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase/firestore';

/**
 * Endpoint para salvar ofertas do Offer Lab.
 * POST /api/intelligence/offer/save
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { brandId, state, name = 'Nova Oferta' } = body;

    if (!brandId || !state) {
      return NextResponse.json(
        { error: 'brandId e state são obrigatórios.' },
        { status: 400 }
      );
    }

    const wizardState = state as OfferWizardState;
    const { total, analysis } = OfferLabEngine.calculateScore(wizardState);

    const offerDoc: OfferDocument = {
      id: `off_${uuidv4()}`,
      brandId,
      name,
      status: 'draft',
      components: {
        coreProduct: {
          name: wizardState.promise.substring(0, 50),
          promise: wizardState.promise,
          price: wizardState.corePrice,
          perceivedValue: wizardState.perceivedValue,
        },
        stacking: wizardState.stacking,
        bonuses: wizardState.bonuses,
        riskReversal: wizardState.riskReversal,
        scarcity: wizardState.scarcity,
      },
      scoring: {
        total,
        factors: wizardState.scoringFactors,
        analysis,
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // TODO: persistir no Firestore
    // await db.collection('brands').doc(brandId).collection('offers').doc(offerDoc.id).set(offerDoc);

    return NextResponse.json({
      success: true,
      offer: offerDoc,
    });
  } catch (error: any) {
    console.error('[OFFER_SAVE_API_ERROR]:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar a oferta.' },
      { status: 500 }
    );
  }
}
