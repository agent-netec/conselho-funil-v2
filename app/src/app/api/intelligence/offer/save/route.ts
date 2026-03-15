export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { OfferLabEngine } from '@/lib/intelligence/offer/calculator';
import { OfferDocument, OfferWizardState, OfferAIEvaluation } from '@/types/offer';
import { v4 as uuidv4 } from 'uuid';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
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
    const adminDb = getAdminFirestore();
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
      createdAt: Timestamp.now() as any,
      updatedAt: Timestamp.now() as any,
    };

    // OL-3.8: Persist AI evaluation if provided
    if (aiEvaluation && aiEvaluation.overallQuality > 0) {
      offerDoc.aiEvaluation = {
        overallQuality: aiEvaluation.overallQuality,
        insights: Array.isArray(aiEvaluation.insights) ? aiEvaluation.insights : [],
        summary: aiEvaluation.summary ?? '',
        evaluatedAt: Timestamp.now() as any,
      };
    }

    // S29-FT-02: Persistir no Firestore — await porque semântica é de "save" (DT-12)
    const offerRef = adminDb.collection('brands').doc(safeBrandId).collection('offers').doc(offerDoc.id);
    await offerRef.set(offerDoc);

    // Auto-link offer to campaign if campaignId is provided
    const { campaignId } = body;
    if (campaignId) {
      try {
        const campaignRef = adminDb.collection('campaigns').doc(campaignId);
        await campaignRef.update({
          offer: {
            offerId: offerDoc.id,
            name: offerDoc.components.coreProduct.name,
            score: offerDoc.scoring.total,
            promise: offerDoc.components.coreProduct.promise,
          },
          updatedAt: Timestamp.now(),
        });
        console.log(`[OfferSave] Offer ${offerDoc.id} linked to campaign ${campaignId}`);
      } catch (linkErr) {
        console.warn('[OfferSave] Failed to link offer to campaign:', linkErr);
      }
    }

    return createApiSuccess({ offer: offerDoc });
  } catch (error: unknown) {
    console.error('[OFFER_SAVE_API_ERROR]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro ao salvar a oferta.');
  }
}
