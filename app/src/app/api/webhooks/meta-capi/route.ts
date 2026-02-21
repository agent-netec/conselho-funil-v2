export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * POST /api/webhooks/meta-capi
 * Receives Meta Conversions API (CAPI) events for server-side tracking.
 * Triggers automation rule evaluation on conversion events.
 *
 * @sprint W — W-3.4
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, events } = body;

    if (!brandId || !events || !Array.isArray(events)) {
      return createApiError(400, 'Missing required fields: brandId, events[]');
    }

    // Validate webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = (process.env.WEBHOOK_SECRET || '').trim();
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return createApiError(401, 'Invalid webhook secret');
    }

    const processed: string[] = [];
    const errors: string[] = [];

    for (const event of events) {
      try {
        const { event_name, event_time, user_data, custom_data } = event;

        // Store conversion event
        await addDoc(collection(db, 'brands', brandId, 'conversion_events'), {
          platform: 'meta',
          eventName: event_name || 'unknown',
          eventTime: event_time ? Timestamp.fromMillis(event_time * 1000) : Timestamp.now(),
          userData: user_data ? { hasEmail: !!user_data.em, hasPhone: !!user_data.ph } : {},
          customData: {
            value: custom_data?.value,
            currency: custom_data?.currency,
            contentType: custom_data?.content_type,
          },
          receivedAt: Timestamp.now(),
        });

        processed.push(event_name || 'unknown');
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    // Trigger async rule evaluation if conversion events received
    if (processed.length > 0) {
      import('@/lib/automation/evaluate').then(({ evaluateBrandRules }) => {
        evaluateBrandRules(brandId).catch(err =>
          console.error('[Meta CAPI] Async evaluation failed:', err)
        );
      });
    }

    return createApiSuccess({
      processed: processed.length,
      errors: errors.length,
      events: processed,
    });
  } catch (error) {
    console.error('[Meta CAPI Webhook]:', error);

    // DLQ: store failed webhook for retry
    try {
      const rawBody = JSON.stringify(await req.clone().json()).substring(0, 10240);
      await addDoc(collection(db, 'brands', 'system', 'dead_letter_queue'), {
        webhookType: 'meta',
        payload: rawBody,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Timestamp.now(),
        retryCount: 0,
        status: 'pending',
      });
    } catch { /* DLQ save best effort */ }

    return createApiError(500, 'Webhook processing failed');
  }
}
