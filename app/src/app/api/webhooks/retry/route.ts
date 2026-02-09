export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard'; // DT-01 FIX
import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { EventNormalizer } from '@/lib/automation/normalizer';

const MAX_RETRY_COUNT = 3;

/**
 * POST /api/webhooks/retry
 * Re-processa um webhook falhado da DLQ.
 *
 * Body: { brandId: string, dlqItemId: string }
 *
 * DT-11: Verifica timestamp vs lead.lastInteraction antes de re-processar.
 * DT-05: Google normalization stub impede retry para Google (throw Error).
 *
 * @story S31-DLQ-02
 */
export async function POST(req: NextRequest) {
  try {
    const { brandId, dlqItemId } = await req.json();

    if (!brandId || !dlqItemId) {
      return createApiError(400, 'brandId and dlqItemId are required');
    }

    await requireBrandAccess(req, brandId);

    // 1. Buscar DLQ item
    const dlqRef = doc(db, 'brands', brandId, 'dead_letter_queue', dlqItemId);
    const dlqSnap = await getDoc(dlqRef);

    if (!dlqSnap.exists()) {
      return createApiError(404, 'DLQ item not found');
    }

    const dlqItem = dlqSnap.data();

    // 2. Verificar retry count (CS-31.16)
    if (dlqItem.retryCount >= MAX_RETRY_COUNT) {
      await updateDoc(dlqRef, { status: 'abandoned' });
      return createApiError(422, `Max retry count (${MAX_RETRY_COUNT}) exceeded. Item abandoned.`);
    }

    // 3. DT-11 (PA-06): Verificar timestamp vs lead.lastInteraction
    const leadRef = doc(db, 'brands', brandId, 'leads', dlqItem.leadId || '');
    const leadSnap = await getDoc(leadRef);
    if (leadSnap.exists()) {
      const lead = leadSnap.data();
      const leadLastInteraction = lead?.lastInteraction?.timestamp;
      if (leadLastInteraction && dlqItem.timestamp &&
          leadLastInteraction.toMillis() > dlqItem.timestamp.toMillis()) {
        // Lead já tem interação mais recente — skip re-processamento
        await updateDoc(dlqRef, { status: 'resolved', resolvedAt: Timestamp.now() });
        return createApiSuccess({
          message: 'DLQ item resolved (lead already has newer interaction)',
          dlqItemId,
          skipped: true,
        });
      }
    }

    // 4. Re-processar
    try {
      const payload = JSON.parse(dlqItem.payload);
      const { leadId, interaction } = EventNormalizer.normalize({
        platform: dlqItem.webhookType,
        brandId,
        payload,
      });

      // Importar PersonalizationMaestro dinamicamente para evitar circular deps
      const { PersonalizationMaestro } = await import(
        '@/lib/intelligence/personalization/maestro'
      );
      await PersonalizationMaestro.processInteraction(brandId, leadId, interaction);

      // 5. Sucesso → marcar como resolved
      await updateDoc(dlqRef, {
        status: 'resolved',
        resolvedAt: Timestamp.now(),
      });

      return createApiSuccess({ message: 'Webhook re-processed successfully', dlqItemId });
    } catch (retryError) {
      // 6. Falha → incrementar retry count
      const errorMsg = retryError instanceof Error ? retryError.message : 'Unknown error';
      await updateDoc(dlqRef, {
        retryCount: dlqItem.retryCount + 1,
        error: errorMsg,
        timestamp: Timestamp.now(),
      });

      return createApiError(502, `Retry failed: ${errorMsg}`);
    }
  } catch (error) {
    console.error('[Webhook Retry Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
