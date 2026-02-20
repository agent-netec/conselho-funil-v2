export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { OfferLabEngine } from '@/lib/intelligence/offer/calculator';
import { OfferDocument, OfferWizardState, OfferAIEvaluation } from '@/types/offer';
import { v4 as uuidv4 } from 'uuid';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * Endpoint para salvar ofertas do Offer Lab.
 * POST /api/intelligence/offer/save
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, state, name = 'Nova Oferta', aiEvaluation } = body;

    if (!brandId || !state) {
      return createApiError(400, 'brandId e state são obrigatórios.');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);
    const wizardState = state as OfferWizardState;
    const { total, analysis } = OfferLabEngine.calculateScore(wizardState);

    const offerDoc: OfferDocument = {
      id: `off_${uuidv4()}`,
      brandId: safeBrandId,
      name,
      status: 'draft',
      scoringVersion: 'v2',
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

    // OL-3.8: Persist AI evaluation if provided
    if (aiEvaluation && aiEvaluation.overallQuality > 0) {
      offerDoc.aiEvaluation = {
        overallQuality: aiEvaluation.overallQuality,
        insights: Array.isArray(aiEvaluation.insights) ? aiEvaluation.insights : [],
        summary: aiEvaluation.summary ?? '',
        evaluatedAt: Timestamp.now(),
      };
    }

    // S29-FT-02: Persistir no Firestore — await porque semântica é de "save" (DT-12)
    const offerRef = doc(db, 'brands', safeBrandId, 'offers', offerDoc.id);
    await setDoc(offerRef, offerDoc);

    return createApiSuccess({ offer: offerDoc });
  } catch (error: unknown) {
    console.error('[OFFER_SAVE_API_ERROR]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro ao salvar a oferta.');
  }
}
