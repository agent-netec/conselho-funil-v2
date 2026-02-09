export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/utils/api-security';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { EventNormalizer } from '@/lib/automation/normalizer';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Webhook Dispatcher (ST-20.3)
 * Endpoint central para recebimento e processamento de eventos externos.
 *
 * AUTH: Categoria C — Validação de assinatura HMAC para webhooks externos (Meta, Google, Instagram).
 * Este endpoint NÃO usa Bearer token / requireBrandAccess (PA-03).
 * A autenticação é feita via validateWebhookSignature() com chaves HMAC.
 *
 * S29-CL-04: Migrado para createApiError/createApiSuccess (padrão Sigma)
 */

const VALID_PLATFORMS = ['meta', 'instagram', 'google'] as const;
type WebhookPlatform = typeof VALID_PLATFORMS[number];

export async function POST(req: NextRequest) {
  // S31-DT-03 FIX: Extrair platform de query param (nao do path — .pop() retornava 'dispatcher')
  const platformParam = req.nextUrl.searchParams.get('platform');
  const brandId = req.nextUrl.searchParams.get('brandId');

  if (!brandId) {
    return createApiError(400, 'brandId is required');
  }

  if (!platformParam || !VALID_PLATFORMS.includes(platformParam as WebhookPlatform)) {
    return createApiError(400, `Valid platform query param required (${VALID_PLATFORMS.join('|')})`);
  }

  const platform: WebhookPlatform = platformParam as WebhookPlatform;
  let rawBody = '';

  try {
    rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-hub-signature');

    // 1. Recuperar Secret do MonaraTokenVault para validação
    const tokenData = await MonaraTokenVault.getToken(brandId, platform === 'instagram' ? 'meta' : platform);
    const clientSecret = (tokenData?.metadata as Record<string, any>)?.clientSecret;

    if (!clientSecret) {
      console.error(`[Webhook] ClientSecret not found for brand ${brandId} on platform ${platform}`);
      return createApiError(500, 'Configuration missing');
    }

    // 2. Validar Assinatura (Security First)
    if (signature && !validateWebhookSignature(rawBody, signature, clientSecret)) {
      return createApiError(401, 'Invalid signature');
    }

    // 3. Normalizar Evento
    const payload = JSON.parse(rawBody);
    const { leadId, interaction } = EventNormalizer.normalize({
      platform,
      brandId,
      payload
    });

    // 4. Processar no Maestro (Motor de Estados)
    await PersonalizationMaestro.processInteraction(brandId, leadId, interaction);

    return createApiSuccess({ processed: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Webhook Error] ${platform}:`, error);
    
    // S31-DLQ-01: Persistir na DLQ (fire-and-forget — P-10)
    if (brandId) {
      const dlqRef = collection(db, 'brands', brandId, 'dead_letter_queue'); // DT-04: underscores
      addDoc(dlqRef, {
        webhookType: platform,
        payload: rawBody.substring(0, 10240), // P-13: Truncar a 10KB
        error: errorMessage,
        timestamp: Timestamp.now(), // P-08: Timestamp, NUNCA Date
        retryCount: 0,
        status: 'pending',
      }).catch(dlqErr => console.error('[DLQ] Failed to persist:', dlqErr));
    }

    return createApiError(500, 'Internal processing error', { details: errorMessage });
  }
}

/**
 * Endpoint de Verificação (Meta Webhooks Hub Challenge)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // O verify_token deve ser validado contra o que está no MonaraTokenVault ou env
  if (mode === 'subscribe' && token) {
    return new NextResponse(challenge, { status: 200 });
  }

  return createApiError(403, 'Forbidden');
}
