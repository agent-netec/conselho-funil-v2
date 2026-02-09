export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { ingestJourneyEvent, IngestEventInput } from '@/lib/intelligence/journey/bridge';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * @fileoverview API Route para ingestão de eventos de jornada (Event Bridge).
 * POST /api/intelligence/events/ingest
 */

export async function POST(request: NextRequest) {
  try {
    // 1. Validar Body
    const body = await request.json() as IngestEventInput;
    
    if (!body.brandId || !body.email || !body.type || !body.source) {
      return createApiError(400, 'Campos obrigatórios ausentes: brandId, email, type, source.');
    }

    await requireBrandAccess(request, body.brandId);

    // 2. Ingerir Evento via Bridge
    // Nota: Esta rota agora exige autenticação + brandId para isolamento multi-tenant.
    const result = await ingestJourneyEvent(body);

    // 3. Retornar Sucesso
    return createApiSuccess(result);

  } catch (error: unknown) {
    console.error('[Event Ingest Error]:', error);
    
    // Se for um erro de segurança conhecido
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }

    return createApiError(500, 'Erro interno ao processar evento.');
  }
}
