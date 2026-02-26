/**
 * POST /api/payments/webhook — R6.1
 *
 * Stripe webhook handler for MKTHONEY subscription events.
 * IMPORTANT: This is SEPARATE from /api/webhooks/payments/ which handles
 * user journey tracking (Hotmart, Kiwify, etc.).
 *
 * Events handled:
 * - checkout.session.completed → Upgrade user tier
 * - customer.subscription.updated → Update tier if plan changed
 * - customer.subscription.deleted → Downgrade to 'free'
 * - invoice.payment_failed → Mark as past_due, notify
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getStripeClient, getTierFromPriceId } from '@/lib/stripe';
import { updateUserTier, getUser } from '@/lib/firebase/firestore';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  sendWelcomeEmail,
  sendReceiptEmail,
  sendPaymentFailedEmail,
  sendCancellationEmail,
} from '@/lib/email/resend';

/**
 * Extracts userId from Stripe metadata.
 */
function getUserIdFromMetadata(
  metadata: Stripe.Metadata | null | undefined
): string | null {
  return metadata?.userId || null;
}

/**
 * Updates user subscription status in Firestore.
 */
async function updateSubscriptionStatus(
  userId: string,
  status: 'active' | 'past_due' | 'canceled' | 'trialing',
  currentPeriodEnd?: number
) {
  const userRef = doc(db, 'users', userId);
  const updates: Record<string, any> = {
    subscriptionStatus: status,
    updatedAt: Timestamp.now(),
  };

  if (currentPeriodEnd) {
    updates.subscriptionCurrentPeriodEnd = Timestamp.fromMillis(currentPeriodEnd * 1000);
  }

  await updateDoc(userRef, updates);
}

/**
 * Handles checkout.session.completed event.
 * User successfully completed checkout → Upgrade tier.
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = getUserIdFromMetadata(session.metadata);
  if (!userId) {
    console.error('[Webhook] checkout.session.completed: userId not found in metadata');
    return { error: 'userId not found' };
  }

  const tier = session.metadata?.tier;
  if (!tier || !['starter', 'pro', 'agency'].includes(tier)) {
    console.error('[Webhook] checkout.session.completed: invalid tier in metadata');
    return { error: 'invalid tier' };
  }

  // Get subscription details
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;

  // Update user tier in Firestore
  await updateUserTier(
    userId,
    tier as 'starter' | 'pro' | 'agency',
    customerId,
    subscriptionId
  );

  // Update subscription status
  await updateSubscriptionStatus(userId, 'active');

  console.log(`[Webhook] checkout.session.completed: User ${userId} upgraded to ${tier}`);

  // R6.5: Send welcome + receipt emails (non-blocking)
  try {
    const user = await getUser(userId);
    if (user?.email) {
      const name = user.displayName || 'Usuario';
      await sendWelcomeEmail(user.email, name);

      const amountTotal = session.amount_total;
      const amount = amountTotal ? `R$ ${(amountTotal / 100).toFixed(2)}` : 'N/A';
      await sendReceiptEmail(user.email, name, tier, amount);
    }
  } catch (emailErr) {
    console.error('[Webhook] Email dispatch failed (checkout):', emailErr);
  }

  return { success: true, userId, tier };
}

/**
 * Handles customer.subscription.updated event.
 * Subscription was updated (plan change, renewal, etc.).
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = getUserIdFromMetadata(subscription.metadata);
  if (!userId) {
    console.error('[Webhook] subscription.updated: userId not found in metadata');
    return { error: 'userId not found' };
  }

  // Get the new price/tier
  const priceId = subscription.items.data[0]?.price?.id;
  const newTier = priceId ? getTierFromPriceId(priceId) : null;

  if (newTier) {
    await updateUserTier(userId, newTier, subscription.customer as string, subscription.id);
    console.log(`[Webhook] subscription.updated: User ${userId} tier updated to ${newTier}`);
  }

  // Update subscription status
  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'trialing' ? 'trialing' : 'active';

  await updateSubscriptionStatus(
    userId,
    status,
    subscription.current_period_end
  );

  return { success: true, userId, newTier, status };
}

/**
 * Handles customer.subscription.deleted event.
 * Subscription was canceled → Downgrade to 'free'.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = getUserIdFromMetadata(subscription.metadata);
  if (!userId) {
    console.error('[Webhook] subscription.deleted: userId not found in metadata');
    return { error: 'userId not found' };
  }

  // Downgrade to free
  await updateUserTier(userId, 'free');
  await updateSubscriptionStatus(userId, 'canceled');

  console.log(`[Webhook] subscription.deleted: User ${userId} downgraded to free`);

  // R6.5: Send cancellation email (non-blocking)
  try {
    const user = await getUser(userId);
    if (user?.email) {
      const name = user.displayName || 'Usuario';
      const endDate = subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')
        : new Date().toLocaleDateString('pt-BR');
      await sendCancellationEmail(user.email, name, endDate);
    }
  } catch (emailErr) {
    console.error('[Webhook] Email dispatch failed (cancellation):', emailErr);
  }

  return { success: true, userId };
}

/**
 * Handles invoice.payment_failed event.
 * Payment failed → Mark as past_due, notify user.
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find user by stripeCustomerId
  const stripe = getStripeClient();
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) {
    console.error('[Webhook] invoice.payment_failed: customer deleted');
    return { error: 'customer deleted' };
  }

  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error('[Webhook] invoice.payment_failed: userId not found in customer metadata');
    return { error: 'userId not found' };
  }

  // Mark subscription as past_due
  await updateSubscriptionStatus(userId, 'past_due');

  console.log(`[Webhook] invoice.payment_failed: User ${userId} marked as past_due`);

  // R6.5: Send payment failed email (non-blocking)
  try {
    const user = await getUser(userId);
    if (user?.email) {
      const name = user.displayName || 'Usuario';
      const hostedInvoiceUrl = invoice.hosted_invoice_url;
      const retryUrl = hostedInvoiceUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com'}/settings/billing`;
      await sendPaymentFailedEmail(user.email, name, retryUrl);
    }
  } catch (emailErr) {
    console.error('[Webhook] Email dispatch failed (payment_failed):', emailErr);
  }

  return { success: true, userId, status: 'past_due' };
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET not configured');
    return createApiError(500, 'Webhook configuration error');
  }

  // Get raw body for signature verification
  const body = await req.text();

  // Get Stripe signature header
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return createApiError(400, 'Missing stripe-signature header');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    const stripeClient = getStripeClient();
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed';
    console.error('[Webhook] Signature verification failed:', message);
    return createApiError(400, `Webhook signature verification failed: ${message}`);
  }

  // Handle different event types
  let result: Record<string, unknown> = {};

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        result = await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        // Log unhandled events for monitoring
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
        result = { skipped: true, eventType: event.type };
    }
  } catch (error) {
    console.error(`[Webhook] Error handling ${event.type}:`, error);
    // Return 200 to acknowledge receipt (Stripe will retry on 5xx)
    return createApiSuccess({
      received: true,
      error: error instanceof Error ? error.message : 'Handler error',
    });
  }

  return createApiSuccess({
    received: true,
    eventType: event.type,
    ...result,
  });
}
