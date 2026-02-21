export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { Timestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * POST /api/webhooks/google-conversions
 * Receives Google Ads conversion events for server-side tracking.
 * Triggers automation rule evaluation on conversion events.
 *
 * @sprint W — W-3.4
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, conversions } = body;

    if (!brandId || !conversions || !Array.isArray(conversions)) {
      return createApiError(400, 'Missing required fields: brandId, conversions[]');
    }

    // Validate webhook secret
    const webhookSecret = req.headers.get('x-webhook-secret');
    const expectedSecret = (process.env.WEBHOOK_SECRET || '').trim();
    if (expectedSecret && webhookSecret !== expectedSecret) {
      return createApiError(401, 'Invalid webhook secret');
    }

    const processed: string[] = [];
    const errors: string[] = [];

    for (const conversion of conversions) {
      try {
        const { conversionAction, conversionDateTime, conversionValue, currencyCode, gclid } = conversion;

        await addDoc(collection(db, 'brands', brandId, 'conversion_events'), {
          platform: 'google',
          eventName: conversionAction || 'unknown',
          eventTime: conversionDateTime ? Timestamp.fromDate(new Date(conversionDateTime)) : Timestamp.now(),
          userData: { hasGclid: !!gclid },
          customData: {
            value: conversionValue,
            currency: currencyCode,
            gclid,
          },
          receivedAt: Timestamp.now(),
        });

        processed.push(conversionAction || 'unknown');
      } catch (err: any) {
        errors.push(err.message);
      }
    }

    // Trigger async rule evaluation if conversions received
    if (processed.length > 0) {
      import('@/lib/automation/evaluate').then(({ evaluateBrandRules }) => {
        evaluateBrandRules(brandId).catch(err =>
          console.error('[Google Conversions] Async evaluation failed:', err)
        );
      });
    }

    return createApiSuccess({
      processed: processed.length,
      errors: errors.length,
      conversions: processed,
    });
  } catch (error) {
    console.error('[Google Conversions Webhook]:', error);

    try {
      const rawBody = JSON.stringify(await req.clone().json()).substring(0, 10240);
      await addDoc(collection(db, 'brands', 'system', 'dead_letter_queue'), {
        webhookType: 'google',
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
