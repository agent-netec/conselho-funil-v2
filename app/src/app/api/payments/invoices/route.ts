/**
 * GET /api/payments/invoices — R6.1
 *
 * Lists the user's invoices from Stripe.
 * Returns invoice history with download URLs.
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { ApiError } from '@/lib/utils/api-security';
import { getUser, getUserStripeCustomerId } from '@/lib/firebase/firestore';
import { getStripeClient, formatPriceBRL } from '@/lib/stripe';

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

interface InvoiceItem {
  id: string;
  number: string;
  date: string;
  amount: string;
  amountCents: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible' | 'draft';
  pdfUrl: string | null;
  hostedUrl: string | null;
  description: string;
}

export async function GET(req: NextRequest) {
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
      // No Stripe customer = no invoices
      return createApiSuccess({
        invoices: [],
        hasMore: false,
      });
    }

    // 4. Get pagination params
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const startingAfter = searchParams.get('starting_after');

    const limit = Math.min(parseInt(limitParam || '10', 10), 100);

    // 5. Fetch invoices from Stripe
    const stripeClient = getStripeClient();
    const invoices = await stripeClient.invoices.list({
      customer: customerId,
      limit,
      ...(startingAfter && { starting_after: startingAfter }),
    });

    // 6. Transform invoices for response
    const invoiceItems: InvoiceItem[] = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number || 'N/A',
      date: new Date((invoice.created || 0) * 1000).toISOString(),
      amount: formatPriceBRL(invoice.amount_paid || 0),
      amountCents: invoice.amount_paid || 0,
      status: invoice.status as InvoiceItem['status'],
      pdfUrl: invoice.invoice_pdf || null,
      hostedUrl: invoice.hosted_invoice_url || null,
      description: invoice.description || `Fatura ${invoice.number}`,
    }));

    return createApiSuccess({
      invoices: invoiceItems,
      hasMore: invoices.has_more,
      nextCursor: invoices.has_more ? invoices.data[invoices.data.length - 1]?.id : null,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return createApiError(error.status, error.message);
    }

    console.error('[Invoices] Error:', error);
    return createApiError(500, 'Erro ao buscar faturas');
  }
}
