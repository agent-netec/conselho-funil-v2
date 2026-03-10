/**
 * POST /api/payments/portal — GL-3
 *
 * Creates a Stripe Customer Portal session so users can
 * manage payment methods, view invoices, and cancel subscriptions.
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-security';
import { getUser } from '@/lib/firebase/firestore';
import { stripe } from '@/lib/stripe';

async function getUserIdFromToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autenticacao necessaria');
  }

  const idToken = authHeader.split('Bearer ')[1];
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();

  if (!apiKey) throw new ApiError(500, 'Firebase API Key nao configurada');

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    }
  );

  if (!response.ok) throw new ApiError(401, 'Token invalido');
  const data = await response.json();
  const uid = data.users?.[0]?.localId;
  if (!uid) throw new ApiError(401, 'Usuario nao encontrado');
  return uid;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromToken(req);

    const user = await getUser(userId);
    if (!user) {
      return createApiError(404, 'Usuario nao encontrado');
    }

    const customerId = user.stripeCustomerId;
    if (!customerId) {
      return createApiError(400, 'Nenhuma assinatura ativa encontrada');
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com';
    const returnUrl = `${origin}/settings/billing`;

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    return createApiSuccess({ url: session.url });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }

    console.error('[Portal] Error:', error);
    return createApiError(500, 'Erro ao abrir portal de assinatura');
  }
}
