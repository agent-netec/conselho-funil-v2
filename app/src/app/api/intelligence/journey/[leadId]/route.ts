import { NextRequest, NextResponse } from 'next/server';
import { getLead, getLeadEvents } from '@/lib/firebase/journey';
import { decryptSensitiveFields } from '@/lib/utils/encryption';

/**
 * @fileoverview API Route para buscar a jornada consolidada de um lead.
 * GET /api/intelligence/journey/[leadId]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const { leadId } = params;

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID é obrigatório.' },
        { status: 400 }
      );
    }

    // 1. Buscar dados do Lead e Eventos em paralelo
    const [lead, events] = await Promise.all([
      getLead(leadId),
      getLeadEvents(leadId, 100) // Limite de 100 eventos para a timeline
    ]);

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado.' },
        { status: 404 }
      );
    }

    // 2. Descriptografar campos PII para visualização na UI (Victor/Beto)
    const secureLead = decryptSensitiveFields(lead);
    const secureEvents = events.map(event => decryptSensitiveFields(event));

    // 3. Retornar dados consolidados
    return NextResponse.json({
      lead: secureLead,
      events: secureEvents
    });

  } catch (error: any) {
    console.error('[Journey API Error]:', error);
    return NextResponse.json(
      { error: 'Erro interno ao buscar jornada do lead.' },
      { status: 500 }
    );
  }
}
