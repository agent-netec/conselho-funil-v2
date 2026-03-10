/**
 * POST /api/payments/cancel — R6.1
 *
 * Cancels the user's active subscription.
 * Uses cancel_at_period_end = true so user keeps access until billing period ends.
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-security';
import { getUser, getUserStripeCustomerId } from '@/lib/firebase/firestore';
import { getStripeClient, getActiveSubscription, isWithinRefundPeriod } from '@/lib/stripe';
import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Validates the ID token and returns the user ID.
 */
async function getUserIdFromToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autenticação necessária');
  }

  const idToken = authHeader.split('Bearer ')[1];
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();

  if (!apiKey) throw new ApiError(500, 'Firebase API Key não configurada');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) throw new ApiError(401, 'Token inválido');
  const data = await response.json();
  const uid = data.users?.[0]?.localId;
  if (!uid) throw new ApiError(401, 'Usuário não encontrado');
  return uid;
}

interface CancelRequest {
  requestRefund?: boolean;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const userId = await getUserIdFromToken(req);

    // 2. Get user data
    const user = await getUser(userId);
    if (!user) {
      return createApiError(404, 'Usuário não encontrado');
    }

    // 3. Get Stripe customer ID
    const customerId = await getUserStripeCustomerId(userId);
    if (!customerId) {
      return createApiError(400, 'Nenhuma assinatura ativa encontrada');
    }

    // 4. Get active subscription
    const subscription = await getActiveSubscription(customerId);
    if (!subscription) {
      return createApiError(400, 'Nenhuma assinatura ativa encontrada');
    }

    // 5. Parse request body
    let body: CancelRequest = {};
    try {
      body = await req.json();
    } catch {
      // No body or invalid JSON - proceed with default
    }

    // 6. Check if refund is requested and eligible (CDC Art. 49 - 7 days)
    if (body.requestRefund) {
      const eligible = isWithinRefundPeriod(subscription.created);

      if (!eligible) {
        return createApiError(
          400,
          'Período de reembolso expirado. O reembolso só é possível nos primeiros 7 dias após a compra.',
          { code: 'REFUND_PERIOD_EXPIRED' }
        );
      }

      // Process refund - cancel immediately and refund
      const stripeClient = getStripeClient();
      const canceledSubscription = await stripeClient.subscriptions.cancel(subscription.id, {
        prorate: true,
      });

      // Get the latest invoice and refund it
      const latestInvoice = canceledSubscription.latest_invoice as string;
      if (latestInvoice) {
        const invoice = await stripeClient.invoices.retrieve(latestInvoice);
        const paymentIntent = (invoice as any).payment_intent;
        if (paymentIntent) {
          await stripeClient.refunds.create({
            payment_intent: paymentIntent as string,
          });
        }
      }

      // Update user to free tier immediately
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        tier: 'free',
        stripeSubscriptionId: null,
        subscriptionStatus: 'canceled',
        updatedAt: Timestamp.now(),
      });

      console.log(`[Cancel] User ${userId} requested refund and was downgraded to free`);

      return createApiSuccess({
        canceled: true,
        refunded: true,
        effectiveDate: new Date().toISOString(),
        message: 'Assinatura cancelada e reembolso processado com sucesso.',
      });
    }

    // 7. Cancel at period end (no refund)
    const stripeClient = getStripeClient();
    const updatedSubscription = await stripeClient.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });

    // Update user subscription status
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionStatus: 'canceled',
      updatedAt: Timestamp.now(),
    });

    const effectiveDate = new Date(((updatedSubscription as any).current_period_end || 0) * 1000);

    console.log(`[Cancel] User ${userId} subscription set to cancel at ${effectiveDate.toISOString()}`);

    return createApiSuccess({
      canceled: true,
      refunded: false,
      effectiveDate: effectiveDate.toISOString(),
      message: `Assinatura cancelada. Você manterá acesso até ${effectiveDate.toLocaleDateString('pt-BR')}.`,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }

    console.error('[Cancel] Error:', error);
    return createApiError(500, 'Erro ao cancelar assinatura');
  }
}
