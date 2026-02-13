export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { withRateLimit } from '@/lib/middleware/rate-limiter';
import { fetchMetaLeads } from '@/lib/integrations/ads/meta-leads-fetcher';

/**
 * POST /api/intelligence/audience/import
 * Fetches historical leads from Meta Lead Ads and writes to Firestore.
 */
async function handlePOST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId } = body;

    if (!brandId || typeof brandId !== 'string') {
      return createApiError(400, 'brandId é obrigatório e deve ser uma string.');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(req, brandId);
    const result = await fetchMetaLeads(safeBrandId);

    return createApiSuccess(result);
  } catch (error: unknown) {
    console.error('[API Audience Import] Error:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Erro interno ao importar leads.';
    return createApiError(422, message);
  }
}

const rateLimitedPOST = withRateLimit(handlePOST, {
  maxRequests: 3,
  windowMs: 60_000,
  scope: 'audience_import',
});

export { rateLimitedPOST as POST };
