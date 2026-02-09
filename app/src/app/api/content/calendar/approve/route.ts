/**
 * Content Approval API
 * POST: Transicionar status de um item do calendario
 *
 * Actions: submit_review, approve, reject, schedule
 *
 * @route /api/content/calendar/approve
 * @story S33-APR-02
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { transitionStatus } from '@/lib/content/approval-engine';
import type { ApprovalAction } from '@/types/content';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS: ApprovalAction[] = ['submit_review', 'approve', 'reject', 'schedule'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, itemId, action, comment } = body as {
      brandId: string;
      itemId: string;
      action: ApprovalAction;
      comment?: string;
    };

    if (!brandId || !itemId || !action) {
      return createApiError(400, 'Missing required fields: brandId, itemId, action');
    }

    if (!VALID_ACTIONS.includes(action)) {
      return createApiError(400, `Invalid action: ${action}. Valid: ${VALID_ACTIONS.join(', ')}`);
    }

    await requireBrandAccess(req, brandId);

    const result = await transitionStatus(brandId, itemId, action, comment);

    if (!result.success) {
      return createApiError(422, result.error || 'Transition failed');
    }

    return createApiSuccess({ item: result.item });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentApprove] POST error:', error);
    return createApiError(500, 'Failed to process approval action');
  }
}
