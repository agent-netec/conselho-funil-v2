export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { indexCampaignDecision } from '@/lib/ai/campaign-rag';

export const runtime = 'nodejs';

/**
 * POST /api/campaigns/index-decision
 *
 * Fire-and-forget endpoint for client-side components to index
 * campaign decisions into Pinecone RAG.
 *
 * Body: { campaignId, brandId, section }
 */
export async function POST(request: NextRequest) {
  try {
    const { campaignId, brandId, section } = await request.json();

    if (!campaignId || !brandId || !section) {
      return createApiError(400, 'campaignId, brandId, and section are required');
    }

    if (!['copywriting', 'social', 'design', 'ads'].includes(section)) {
      return createApiError(400, 'section must be one of: copywriting, social, design, ads');
    }

    try {
      await requireBrandAccess(request, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Fire-and-forget: don't await, return immediately
    indexCampaignDecision({ campaignId, brandId, section }).catch(err => {
      console.error('[index-decision] Background indexing failed:', err);
    });

    return createApiSuccess({ status: 'indexing' });
  } catch (error) {
    console.error('[index-decision] Error:', error);
    return createApiError(500, 'Failed to start indexing', { details: String(error) });
  }
}
