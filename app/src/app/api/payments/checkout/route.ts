/**
 * POST /api/payments/checkout — R6.1
 *
 * Creates a Stripe Checkout session for subscription purchases.
 * Redirects user to Stripe-hosted checkout page.
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-security';
import { getUserAdmin } from '@/lib/firebase/firestore-server';
import {
  stripe,
  getPriceId,
  isPurchasableTier,
  getOrCreateStripeCustomer,
  type BillingPeriod,
} from '@/lib/stripe';
import type { Tier } from '@/lib/tier-system';

// Input schema
interface CheckoutRequest {
  tier: 'starter' | 'pro' | 'agency';
  billingPeriod: BillingPeriod;
}

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

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const userId = await getUserIdFromToken(req);

    // 2. Get user data
    const user = await getUserAdmin(userId);
    if (!user) {
      return createApiError(404, 'Usuário não encontrado');
    }

    // 3. Parse and validate request body
    const body: CheckoutRequest = await req.json();

    if (!body.tier || !isPurchasableTier(body.tier)) {
      return createApiError(400, 'Tier inválido. Use: starter, pro ou agency');
    }

    if (!body.billingPeriod || !['monthly', 'yearly'].includes(body.billingPeriod)) {
      return createApiError(400, 'Período inválido. Use: monthly ou yearly');
    }

    // 4. Get price ID
    const priceId = getPriceId(body.tier as Exclude<Tier, 'free' | 'trial'>, body.billingPeriod);

    // Check if using placeholder price
    if (priceId.includes('PLACEHOLDER')) {
      return createApiError(
        503,
        'Sistema de pagamento em configuração. Tente novamente em breve.',
        { code: 'STRIPE_NOT_CONFIGURED' }
      );
    }

    // 5. Get or create Stripe customer
    const customer = await getOrCreateStripeCustomer(userId, user.email, user.name);

    // 6. Build success/cancel URLs
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com';
    const successUrl = `${origin}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/pricing?cancelled=true`;

    // 7. Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        tier: body.tier,
        billingPeriod: body.billingPeriod,
      },
      subscription_data: {
        metadata: {
          userId,
          tier: body.tier,
        },
      },
      // Allow promotion codes
      allow_promotion_codes: true,
      // Billing address collection for NFS-e (future)
      billing_address_collection: 'required',
      // Locale
      locale: 'pt-BR',
    });

    // 8. Return checkout URL
    return createApiSuccess({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }

    console.error('[Checkout] Error:', error);

    // Handle Stripe errors
    if (error instanceof Error && error.message.includes('No such price')) {
      return createApiError(
        503,
        'Preço não encontrado no Stripe. Verifique a configuração.',
        { code: 'STRIPE_PRICE_NOT_FOUND' }
      );
    }

    return createApiError(500, 'Erro ao criar sessão de checkout');
  }
}
