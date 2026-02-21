export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { withResilience } from '@/lib/firebase/resilience';
import { validateWebhookSignature } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * Webhook para Recebimento de Métricas de Ads (ST-11.19)
 * 
 * Recebe sinais externos de performance (Meta, Google, etc) e atualiza
 * o CampaignContext no Firestore para análise do Conselho.
 *
 * S29-CL-04: Migrado para createApiError/createApiSuccess (padrão Sigma)
 */

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    const primarySecret = (process.env.CAMPAIGN_WEBHOOK_SECRET || '').trim();
    const secondarySecret = (process.env.CAMPAIGN_WEBHOOK_SECRET_SECONDARY || '').trim();

    if (!primarySecret) {
      console.error('[Webhook] CAMPAIGN_WEBHOOK_SECRET não configurada no ambiente');
      return createApiError(500, 'Configuração de segurança incompleta no servidor');
    }

    // 1. Validar Assinatura (Hmac-SHA256) com Graceful Rotation
    if (!signature) {
      return createApiError(401, 'Assinatura x-hub-signature-256 ausente');
    }

    const isValid = validateWebhookSignature(
      rawBody,
      signature,
      primarySecret,
      secondarySecret
    );

    if (!isValid) {
      console.warn('[Webhook] Tentativa de acesso com assinatura inválida');
      return createApiError(401, 'Assinatura inválida');
    }

    // 2. Parsear Payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return createApiError(400, 'Payload JSON inválido');
    }

    const { campaign_id, clicks, impressions, spend, conversions } = payload;

    if (!campaign_id) {
      return createApiError(400, 'campaign_id é obrigatório no payload');
    }

    // 3. Atualizar Campaign no Firestore
    const campaignRef = doc(db, 'campaigns', campaign_id);
    
    // Atualização das métricas reais para o feedback loop da IA
    // Implementa resiliência via retry para suportar picos de carga (ST-11.23)
    await withResilience(async () => {
      await updateDoc(campaignRef, {
        metrics: {
          clicks: Number(clicks || 0),
          impressions: Number(impressions || 0),
          spend: Number(spend || 0),
          conversions: Number(conversions || 0),
          lastUpdated: Timestamp.now()
        },
        updatedAt: Timestamp.now()
      });
    });

    console.log(`[Webhook] ✅ Métricas sincronizadas para campanha: ${campaign_id}`);

    return createApiSuccess({
      message: 'Métricas atualizadas com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Webhook] Erro crítico ao processar webhook:', error);
    return createApiError(500, 'Erro interno ao processar métricas de ads', { details: errorMessage });
  }
}
