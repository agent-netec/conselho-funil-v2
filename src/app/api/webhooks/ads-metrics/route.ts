import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { withResilience } from '@/lib/firebase/resilience';

/**
 * Webhook para Recebimento de Métricas de Ads (ST-11.19)
 * 
 * Recebe sinais externos de performance (Meta, Google, etc) e atualiza
 * o CampaignContext no Firestore para análise do Conselho.
 */

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    const secret = process.env.CAMPAIGN_WEBHOOK_SECRET;

    if (!secret) {
      console.error('[Webhook] CAMPAIGN_WEBHOOK_SECRET não configurada no ambiente');
      return NextResponse.json(
        { error: 'Configuração de segurança incompleta no servidor' }, 
        { status: 500 }
      );
    }

    // 1. Validar Assinatura (Hmac-SHA256)
    // Padrão de segurança exigido pela Monara (Integrator)
    if (!signature) {
      return NextResponse.json({ error: 'Assinatura x-hub-signature-256 ausente' }, { status: 401 });
    }

    const hmac = createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(rawBody).digest('hex');

    if (signature !== digest) {
      console.warn('[Webhook] Tentativa de acesso com assinatura inválida');
      return NextResponse.json({ error: 'Assinatura inválida' }, { status: 401 });
    }

    // 2. Parsear Payload
    let payload;
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json({ error: 'Payload JSON inválido' }, { status: 400 });
    }

    const { campaign_id, clicks, impressions, spend, conversions } = payload;

    if (!campaign_id) {
      return NextResponse.json({ error: 'campaign_id é obrigatório no payload' }, { status: 400 });
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

    return NextResponse.json({ 
      success: true, 
      message: 'Métricas atualizadas com sucesso',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[Webhook] Erro crítico ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar métricas de ads', details: error.message },
      { status: 500 }
    );
  }
}
