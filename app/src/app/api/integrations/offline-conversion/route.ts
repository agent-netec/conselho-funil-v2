import { NextRequest, NextResponse } from 'next/server';
import { getLead, createTransaction } from '../../../../lib/firebase/journey';
import { CAPISyncEngine } from '../../../../lib/integrations/ads/capi-sync';

/**
 * @fileoverview Endpoint para ingestão de conversões offline (ST-25.4)
 * Recebe dados de CRM, WhatsApp ou Telefone e dispara para CAPI.
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // 1. Validação básica do payload
    const { leadId, value, currency, eventSource, transactionId } = body;

    if (!leadId || !value || !transactionId) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes: leadId, value, transactionId' }, { status: 400 });
    }

    // 2. Recuperar dados do Lead no Firestore para enriquecimento (CAPI precisa de PII hashed)
    const lead = await getLead(leadId);
    if (!lead) {
      return NextResponse.json({ error: `Lead ${leadId} não encontrado no sistema.` }, { status: 404 });
    }

    // 3. Registrar a transação no Firestore (Histórico do Lead)
    await createTransaction({
      leadId,
      brandId: 'default', // TODO: Obter do contexto se necessário
      amount: value,
      currency: currency || 'BRL',
      product: {
        id: 'offline_sale',
        name: `Venda via ${eventSource || 'offline'}`,
        type: 'core'
      },
      status: 'approved',
      payment: {
        gateway: eventSource || 'crm',
        method: 'credit_card', // Placeholder
        installments: 1
      },
      createdAt: new Date() as any,
      processedAt: new Date() as any
    });

    // 4. Disparar Sincronização CAPI (Meta/Google)
    const capiEngine = new CAPISyncEngine();
    const syncResults = await capiEngine.syncOfflineConversion({
      leadId,
      value,
      currency: currency || 'BRL',
      eventSource: eventSource || 'offline',
      transactionId
    }, lead);

    // 5. Retornar status
    return NextResponse.json({
      message: 'Conversão offline processada com sucesso.',
      syncResults
    });

  } catch (error: any) {
    console.error('[OfflineConversionAPI] Erro no processamento:', error);
    return NextResponse.json({ error: 'Erro interno ao processar conversão offline.', details: error.message }, { status: 500 });
  }
}
