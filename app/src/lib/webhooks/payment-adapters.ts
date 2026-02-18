import { Timestamp } from 'firebase/firestore';
import type { JourneyTransaction } from '@/types/journey';

/**
 * Normalized transaction from any payment provider.
 * Used as intermediate format before persisting to Firestore.
 */
export interface NormalizedTransaction {
  brandId: string;
  email: string;
  amount: number; // in cents
  currency: string;
  product: {
    id: string;
    name: string;
    type: 'core' | 'upsell' | 'order_back' | 'subscription';
  };
  status: 'pending' | 'approved' | 'refunded' | 'chargedback';
  payment: {
    gateway: string;
    method: 'credit_card' | 'pix' | 'boleto';
    installments: number;
  };
  webhookEventId: string;
}

export type PaymentProvider = 'hotmart' | 'kiwify' | 'stripe';

/**
 * Detect which payment provider sent the webhook based on headers and body.
 */
export function detectProvider(headers: Headers, body: Record<string, unknown>): PaymentProvider | null {
  // Stripe sends stripe-signature header
  if (headers.get('stripe-signature')) return 'stripe';

  // Hotmart sends hottok in body or x-hotmart-hottok header
  if (headers.get('x-hotmart-hottok') || body.hottok) return 'hotmart';

  // Kiwify sends signature header or has kiwify-specific fields
  if (headers.get('x-kiwify-signature') || body.order_id) return 'kiwify';

  return null;
}

// ============================================
// HOTMART ADAPTER
// ============================================

interface HotmartPayload {
  hottok?: string;
  data?: {
    purchase?: {
      transaction?: string;
      order_date?: number;
      status?: string;
      payment?: {
        type?: string;
        installments_number?: number;
      };
      price?: {
        value?: number;
        currency_value?: string;
      };
      offer?: {
        code?: string;
      };
    };
    product?: {
      id?: number;
      name?: string;
    };
    buyer?: {
      email?: string;
      name?: string;
    };
  };
  event?: string;
}

const HOTMART_STATUS_MAP: Record<string, NormalizedTransaction['status']> = {
  APPROVED: 'approved',
  COMPLETE: 'approved',
  REFUNDED: 'refunded',
  CHARGEBACK: 'chargedback',
  CANCELED: 'refunded',
  DISPUTE: 'chargedback',
  EXPIRED: 'refunded',
  DELAYED: 'pending',
  OVERDUE: 'pending',
  PRINTED_BILLET: 'pending',
  WAITING_PAYMENT: 'pending',
};

const HOTMART_METHOD_MAP: Record<string, NormalizedTransaction['payment']['method']> = {
  CREDIT_CARD: 'credit_card',
  PIX: 'pix',
  BILLET: 'boleto',
  PAYPAL: 'credit_card',
  GOOGLE_PAY: 'credit_card',
};

export function normalizeHotmart(body: HotmartPayload, brandId: string): NormalizedTransaction | null {
  const purchase = body.data?.purchase;
  const product = body.data?.product;
  const buyer = body.data?.buyer;

  if (!purchase || !buyer?.email) return null;

  return {
    brandId,
    email: buyer.email.toLowerCase().trim(),
    amount: Math.round((purchase.price?.value || 0) * 100),
    currency: purchase.price?.currency_value || 'BRL',
    product: {
      id: String(product?.id || 'unknown'),
      name: product?.name || 'Unknown Product',
      type: 'core',
    },
    status: HOTMART_STATUS_MAP[purchase.status || ''] || 'pending',
    payment: {
      gateway: 'hotmart',
      method: HOTMART_METHOD_MAP[purchase.payment?.type || ''] || 'credit_card',
      installments: purchase.payment?.installments_number || 1,
    },
    webhookEventId: `hotmart_${purchase.transaction || Date.now()}`,
  };
}

// ============================================
// KIWIFY ADAPTER
// ============================================

interface KiwifyPayload {
  order_id?: string;
  order_status?: string;
  product_id?: string;
  product_name?: string;
  Customer?: {
    email?: string;
    full_name?: string;
  };
  Commissions?: {
    charge_amount?: number;
    currency?: string;
  };
  payment_method?: string;
  installments?: number;
  signature?: string;
}

const KIWIFY_STATUS_MAP: Record<string, NormalizedTransaction['status']> = {
  paid: 'approved',
  approved: 'approved',
  refunded: 'refunded',
  chargedback: 'chargedback',
  waiting_payment: 'pending',
};

export function normalizeKiwify(body: KiwifyPayload, brandId: string): NormalizedTransaction | null {
  const email = body.Customer?.email;
  if (!email) return null;

  const methodMap: Record<string, NormalizedTransaction['payment']['method']> = {
    credit_card: 'credit_card',
    pix: 'pix',
    boleto: 'boleto',
  };

  return {
    brandId,
    email: email.toLowerCase().trim(),
    amount: Math.round((body.Commissions?.charge_amount || 0) * 100),
    currency: body.Commissions?.currency || 'BRL',
    product: {
      id: body.product_id || 'unknown',
      name: body.product_name || 'Unknown Product',
      type: 'core',
    },
    status: KIWIFY_STATUS_MAP[body.order_status || ''] || 'pending',
    payment: {
      gateway: 'kiwify',
      method: methodMap[body.payment_method || ''] || 'credit_card',
      installments: body.installments || 1,
    },
    webhookEventId: `kiwify_${body.order_id || Date.now()}`,
  };
}

// ============================================
// STRIPE ADAPTER
// ============================================

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount_total?: number;
      amount?: number;
      currency?: string;
      customer_email?: string;
      customer_details?: { email?: string };
      payment_method_types?: string[];
      metadata?: Record<string, string>;
      line_items?: { data?: Array<{ price?: { product?: string }; description?: string }> };
    };
  };
}

export function normalizeStripe(body: StripeEvent, brandId: string): NormalizedTransaction | null {
  const obj = body.data?.object;
  if (!obj) return null;

  const email = obj.customer_email || obj.customer_details?.email;
  if (!email) return null;

  const isRefund = body.type === 'charge.refunded';
  const amount = obj.amount_total || obj.amount || 0; // Stripe sends in cents already

  const methodMap: Record<string, NormalizedTransaction['payment']['method']> = {
    card: 'credit_card',
    pix: 'pix',
    boleto: 'boleto',
  };
  const rawMethod = obj.payment_method_types?.[0] || 'card';

  return {
    brandId,
    email: email.toLowerCase().trim(),
    amount,
    currency: (obj.currency || 'brl').toUpperCase(),
    product: {
      id: obj.line_items?.data?.[0]?.price?.product || obj.id,
      name: obj.line_items?.data?.[0]?.description || 'Stripe Purchase',
      type: 'core',
    },
    status: isRefund ? 'refunded' : 'approved',
    payment: {
      gateway: 'stripe',
      method: methodMap[rawMethod] || 'credit_card',
      installments: 1,
    },
    webhookEventId: `stripe_${body.id}`,
  };
}
