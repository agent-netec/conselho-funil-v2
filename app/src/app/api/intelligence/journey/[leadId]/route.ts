import { NextRequest, NextResponse } from 'next/server';
import { getLead, getLeadEvents } from '@/lib/firebase/journey';
import { decryptSensitiveFields } from '@/lib/utils/encryption';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

/**
 * @fileoverview API Route para buscar a jornada consolidada de um lead.
 * GET /api/intelligence/journey/[leadId]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!leadId) {
      return createApiError(400, 'Lead ID é obrigatório.');
    }

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(request, brandId);

    // 1. Buscar dados do Lead e Eventos em paralelo
    const [lead, events] = await Promise.all([
      getLead(leadId),
      getLeadEvents(leadId, 100) // Limite de 100 eventos para a timeline
    ]);

    if (!lead) {
      return createApiError(404, 'Lead não encontrado.');
    }

    const leadBrandId = (lead as { brandId?: string }).brandId;
    if (!leadBrandId || leadBrandId !== safeBrandId) {
      console.warn('[Security] Lead cross-brand access denied', {
        leadId,
        requestedBrandId: safeBrandId,
        leadBrandId: leadBrandId || 'missing',
      });
      return createApiError(403, 'Acesso negado: lead não pertence à brand informada');
    }

    // 2. Descriptografar campos PII para visualização na UI (Victor/Beto)
    const secureLead = decryptSensitiveFields(lead);
    const secureEvents = events.map(event => decryptSensitiveFields(event));

    // 3. Retornar dados consolidados
    return createApiSuccess({ lead: secureLead, events: secureEvents });

  } catch (error: unknown) {
    console.error('[Journey API Error]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro interno ao buscar jornada do lead.');
  }
}
