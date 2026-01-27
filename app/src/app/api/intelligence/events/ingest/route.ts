import { NextRequest, NextResponse } from 'next/server';
import { ingestJourneyEvent, IngestEventInput } from '@/lib/intelligence/journey/bridge';
import { handleSecurityError } from '@/lib/utils/api-security';

/**
 * @fileoverview API Route para ingestão de eventos de jornada (Event Bridge).
 * POST /api/intelligence/events/ingest
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Validar Body
    const body = await request.json() as IngestEventInput;
    
    if (!body.email || !body.type || !body.source) {
      return NextResponse.json(
        { error: 'Campos obrigatórios ausentes: email, type, source.' },
        { status: 400 }
      );
    }

    // 2. Ingerir Evento via Bridge
    // Nota: Esta rota é pública para permitir rastreamento de leads externos (trackers),
    // mas em produção deve ter validação de Origin ou API Key simples se necessário.
    const result = await ingestJourneyEvent(body);

    // 3. Retornar Sucesso
    return NextResponse.json({
      success: true,
      ...result
    });

  } catch (error: any) {
    console.error('[Event Ingest Error]:', error);
    
    // Se for um erro de segurança conhecido
    if (error.status) {
      return handleSecurityError(error);
    }

    return NextResponse.json(
      { error: 'Erro interno ao processar evento.' },
      { status: 500 }
    );
  }
}
