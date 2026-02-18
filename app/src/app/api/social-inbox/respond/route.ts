export const dynamic = 'force-dynamic';

/**
 * POST /api/social-inbox/respond
 * Send a real response to a social interaction via the platform API.
 *
 * @story V-1.3
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { replyToComment } from '@/lib/integrations/social/instagram-graph';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, interactionId, externalId, platform, type, responseText } = body;

    if (!brandId || !interactionId || !responseText) {
      return createApiError(400, 'Missing required fields: brandId, interactionId, responseText');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Validate platform support
    if (platform !== 'instagram') {
      return createApiError(400, `Platform "${platform}" response sending not yet supported. Currently supporting: instagram`);
    }

    // Validate interaction type
    if (type !== 'comment') {
      return createApiError(400, `Response type "${type}" not yet supported. Currently supporting: comment replies`);
    }

    // Send response via Instagram Graph API
    const result = await replyToComment(brandId, externalId, responseText);

    // Update interaction status in Firestore
    try {
      const interactionRef = doc(
        db,
        'brands',
        brandId,
        'social_interactions',
        interactionId
      );
      await updateDoc(interactionRef, {
        status: 'responded',
        response: {
          text: responseText,
          externalId: result.id,
          sentAt: Timestamp.now(),
        },
      });
    } catch (err) {
      // Non-blocking: response was sent successfully even if status update fails
      console.error('[Social Respond] Failed to update interaction status:', err);
    }

    return createApiSuccess({
      sent: true,
      responseId: result.id,
      interactionId,
    });
  } catch (error) {
    console.error('[Social Respond] Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to send response';
    return createApiError(500, message);
  }
}
