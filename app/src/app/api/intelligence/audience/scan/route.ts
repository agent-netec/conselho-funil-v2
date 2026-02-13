export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { AudienceIntelligenceEngine } from '@/lib/intelligence/personalization/engine';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';

/**
 * @fileoverview API Route para disparar o Audience Scan (ST-29.1)
 * POST /api/intelligence/audience/scan
 */
/**
 * S28-PS-01: Validação robusta de input + error handling seguro (sem PII leak)
 */
const LEAD_LIMIT_DEFAULT = 50;
const LEAD_LIMIT_MAX = 200;

async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, leadLimit } = body;

    // Validação: brandId obrigatório
    if (!brandId || typeof brandId !== 'string') {
      return createApiError(400, 'brandId é obrigatório e deve ser uma string.');
    }

    // Validação: leadLimit com default e max
    const sanitizedLeadLimit = Math.min(
      Math.max(1, Number(leadLimit) || LEAD_LIMIT_DEFAULT),
      LEAD_LIMIT_MAX
    );

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);
    const scan = await AudienceIntelligenceEngine.runDeepScan(safeBrandId, sanitizedLeadLimit);

    return createApiSuccess({ 
      scanId: scan.id,
      persona: scan.persona,
      propensity: scan.propensity
    });

  } catch (error: unknown) {
    console.error('[API Audience Scan] Error:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    // Mensagem segura — sem PII ou stack trace no response
    if (error instanceof Error && error.message.startsWith('Nenhum lead')) {
      return createApiError(422, 'Nenhum lead encontrado para esta marca. Importe leads ou configure webhooks antes de executar o scan.');
    }
    return createApiError(500, 'Erro interno ao processar scan de audiência.');
  }
}

// S32-RL-02: Rate limit — 10 req/min por brand
const rateLimitedPOST = withRateLimit(handlePOST, {
  maxRequests: 10,
  windowMs: 60_000,
  scope: 'audience_scan',
});

export { rateLimitedPOST as POST };
