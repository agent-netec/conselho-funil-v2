import { NextRequest, NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/utils/api-security';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { EventNormalizer } from '@/lib/automation/normalizer';
import { PersonalizationMaestro } from '@/lib/intelligence/personalization/maestro';

/**
 * Webhook Dispatcher (ST-20.3)
 * Endpoint central para recebimento e processamento de eventos externos.
 */

export async function POST(req: NextRequest) {
  const platform = req.nextUrl.pathname.split('/').pop() as 'meta' | 'instagram' | 'google';
  const brandId = req.nextUrl.searchParams.get('brandId');

  if (!brandId) {
    return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-hub-signature-256') || req.headers.get('x-hub-signature');

    // 1. Recuperar Secret do MonaraTokenVault para validação
    const tokenData = await MonaraTokenVault.getToken(brandId, platform === 'instagram' ? 'meta' : platform);
    const clientSecret = tokenData?.metadata?.clientSecret;

    if (!clientSecret) {
      console.error(`[Webhook] ClientSecret not found for brand ${brandId} on platform ${platform}`);
      return NextResponse.json({ error: 'Configuration missing' }, { status: 500 });
    }

    // 2. Validar Assinatura (Security First)
    if (signature && !validateWebhookSignature(rawBody, signature, clientSecret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(`[Webhook Error] ${platform}:`, error);
    
    // Registrar erro na DLQ (Dead Letter Queue) conforme contrato
    // TODO: Implementar persistência na DLQ em brands/{brandId}/dead-letter-queue

    return NextResponse.json(
      { error: 'Internal processing error', details: error.message },
      { status: 500 }
    );
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

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
