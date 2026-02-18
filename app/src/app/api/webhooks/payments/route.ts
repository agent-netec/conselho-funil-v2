export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { validateWebhookSignature } from '@/lib/utils/api-security';
import { createTransaction, upsertLead, getLead } from '@/lib/firebase/journey';
import { generateLeadId, ingestJourneyEvent } from '@/lib/intelligence/journey/bridge';
import {
  detectProvider,
  normalizeHotmart,
  normalizeKiwify,
  normalizeStripe,
  type NormalizedTransaction,
  type PaymentProvider,
} from '@/lib/webhooks/payment-adapters';
import { logger } from '@/lib/utils/logger';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * POST /api/webhooks/payments?brandId=XXX
 * Generic payment webhook endpoint with provider auto-detection.
 * Supports: Hotmart, Kiwify, Stripe.
 * Public endpoint — authenticated via provider-specific signature validation.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return createApiError(400, 'Invalid request body');
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return createApiError(400, 'Invalid JSON body');
  }

  // Extract brandId from query params
  const { searchParams } = new URL(request.url);
  const brandId = searchParams.get('brandId');

  if (!brandId || !/^[a-zA-Z0-9_-]+$/.test(brandId)) {
    return createApiError(400, 'Missing or invalid brandId query parameter');
  }

  // Detect payment provider
  const provider = detectProvider(request.headers, body);
  if (!provider) {
    logger.warn('[Webhook] Unknown payment provider', { meta: { brandId } });
    return createApiError(400, 'Could not detect payment provider from request');
  }

  // Validate webhook signature
  const signatureValid = await validateProviderSignature(provider, request.headers, rawBody, brandId);
  if (!signatureValid) {
    logger.warn('[Webhook] Invalid signature', { meta: { brandId, provider } });
    return createApiError(401, 'Invalid webhook signature');
  }

  // Normalize the transaction
  const normalized = normalizeEvent(provider, body, brandId);
  if (!normalized) {
    logger.warn('[Webhook] Could not normalize event', { meta: { brandId, provider } });
    return createApiError(422, 'Could not normalize webhook payload');
  }

  // Idempotency check: skip if webhookEventId already processed
  const isDuplicate = await checkIdempotency(brandId, normalized.webhookEventId);
  if (isDuplicate) {
    logger.info('[Webhook] Duplicate event skipped', { meta: { brandId, webhookEventId: normalized.webhookEventId } });
    return createApiSuccess({ status: 'duplicate', webhookEventId: normalized.webhookEventId });
  }

  try {
    // 1. Create transaction in Firestore
    const transactionId = await createTransaction({
      leadId: generateLeadId(normalized.email),
      brandId: normalized.brandId,
      amount: normalized.amount,
      currency: normalized.currency,
      product: normalized.product,
      status: normalized.status,
      payment: normalized.payment,
      webhookEventId: normalized.webhookEventId,
      processedAt: Timestamp.now(),
      createdAt: Timestamp.now(),
    });

    // 2. Update lead metrics if transaction is approved
    if (normalized.status === 'approved') {
      const leadId = generateLeadId(normalized.email);
      const lead = await getLead(leadId);

      if (lead) {
        const newTotalLtv = (lead.metrics?.totalLtv || 0) + normalized.amount;
        const newTxCount = (lead.metrics?.transactionCount || 0) + 1;
        await upsertLead(leadId, {
          status: 'customer',
          metrics: {
            ...lead.metrics,
            totalLtv: newTotalLtv,
            transactionCount: newTxCount,
            averageTicket: Math.round(newTotalLtv / newTxCount),
            lastPurchaseAt: Timestamp.now(),
            firstPurchaseAt: lead.metrics?.firstPurchaseAt || Timestamp.now(),
          },
        });
      } else {
        // Create a new lead from the payment data
        await ingestJourneyEvent({
          brandId,
          email: normalized.email,
          type: 'purchase_complete',
          source: 'webhook',
          payload: {
            amount: normalized.amount,
            productId: normalized.product.id,
            productName: normalized.product.name,
            gateway: normalized.payment.gateway,
          },
        });
      }
    }

    // 3. Also ingest as journey event for timeline
    await ingestJourneyEvent({
      brandId,
      email: normalized.email,
      type: normalized.status === 'refunded' ? 'custom' : 'purchase_complete',
      source: 'webhook',
      payload: {
        amount: normalized.amount,
        productId: normalized.product.id,
        productName: normalized.product.name,
        gateway: normalized.payment.gateway,
        transactionId,
        status: normalized.status,
      },
    });

    const durationMs = Date.now() - startTime;
    logger.info('[Webhook] Transaction processed', {
      route: '/api/webhooks/payments',
      brandId,
      durationMs,
      meta: { provider, transactionId, status: normalized.status },
    });

    return createApiSuccess({
      transactionId,
      status: normalized.status,
      provider,
      webhookEventId: normalized.webhookEventId,
    });
  } catch (error) {
    logger.error('[Webhook] Processing failed', {
      error: error instanceof Error ? error.message : 'Unknown',
      meta: { brandId, provider },
    });
    return createApiError(500, 'Internal error processing webhook');
  }
}

// --- Helpers ---

function normalizeEvent(
  provider: PaymentProvider,
  body: Record<string, unknown>,
  brandId: string
): NormalizedTransaction | null {
  switch (provider) {
    case 'hotmart':
      return normalizeHotmart(body as any, brandId);
    case 'kiwify':
      return normalizeKiwify(body as any, brandId);
    case 'stripe':
      return normalizeStripe(body as any, brandId);
    default:
      return null;
  }
}

async function validateProviderSignature(
  provider: PaymentProvider,
  headers: Headers,
  rawBody: string,
  brandId: string
): Promise<boolean> {
  // Load webhook secrets from brand config
  const brandRef = doc(db, 'brands', brandId);
  const brandSnap = await getDoc(brandRef);
  const brandData = brandSnap.data() as Record<string, unknown> | undefined;
  const webhookSecrets = (brandData?.webhookSecrets || {}) as Record<string, string>;

  switch (provider) {
    case 'hotmart': {
      const hottok = (headers.get('x-hotmart-hottok') || (JSON.parse(rawBody) as any).hottok) as string;
      const secret = webhookSecrets.hotmart;
      if (!secret) return true; // No secret configured — allow (initial setup)
      return hottok === secret;
    }
    case 'kiwify': {
      const signature = headers.get('x-kiwify-signature') || '';
      const secret = webhookSecrets.kiwify;
      if (!secret) return true;
      return validateWebhookSignature(rawBody, signature, secret);
    }
    case 'stripe': {
      const signature = headers.get('stripe-signature') || '';
      const secret = webhookSecrets.stripe;
      if (!secret) return true;
      // Stripe signature format: t=timestamp,v1=signature
      const parts = signature.split(',').reduce((acc: Record<string, string>, part) => {
        const [k, v] = part.split('=');
        if (k && v) acc[k] = v;
        return acc;
      }, {});
      const timestamp = parts.t;
      const sig = parts.v1;
      if (!timestamp || !sig) return false;
      const payload = `${timestamp}.${rawBody}`;
      return validateWebhookSignature(payload, `sha256=${sig}`, secret);
    }
    default:
      return false;
  }
}

/** Check if webhookEventId has already been processed (idempotency) */
async function checkIdempotency(brandId: string, webhookEventId: string): Promise<boolean> {
  try {
    const idempRef = doc(db, 'brands', brandId, 'webhook_idempotency', webhookEventId);
    const snap = await getDoc(idempRef);
    if (snap.exists()) return true;

    // Store the idempotency key
    const { setDoc } = await import('firebase/firestore');
    await setDoc(idempRef, { processedAt: Timestamp.now() });
    return false;
  } catch {
    // Fail-open: process the event if idempotency check fails
    return false;
  }
}
