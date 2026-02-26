import Stripe from 'stripe';
import type { Tier } from '../tier-system';

// ============================================
// STRIPE CLIENT (Lazy Initialization)
// ============================================

let _stripeClient: Stripe | null = null;

/**
 * Gets the Stripe client singleton.
 * Lazy-initialized to avoid build-time errors when env vars are not set.
 */
export function getStripeClient(): Stripe {
  if (!_stripeClient) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('[Stripe] STRIPE_SECRET_KEY not configured');
    }
    _stripeClient = new Stripe(secretKey, {
      apiVersion: '2025-01-27.acacia',
      typescript: true,
    });
  }
  return _stripeClient;
}

/**
 * Stripe client singleton (legacy export for compatibility).
 * Uses Proxy for lazy initialization.
 */
export const stripe = new Proxy({} as Stripe, {
  get(_, prop: keyof Stripe) {
    return getStripeClient()[prop];
  },
});

// ============================================
// PRICE IDS (Configured in Stripe Dashboard)
// ============================================

/**
 * Stripe Price IDs for each tier and billing period.
 * These should be configured in the Stripe Dashboard and
 * their IDs stored in environment variables.
 *
 * Placeholder format: price_PLACEHOLDER_xxx
 * Replace with actual price IDs after creating products in Stripe.
 */
export const STRIPE_PRICES: Record<
  Exclude<Tier, 'free' | 'trial'>,
  { monthly: string; yearly: string }
> = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_PLACEHOLDER_starter_monthly',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_PLACEHOLDER_starter_yearly',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_PLACEHOLDER_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_PLACEHOLDER_pro_yearly',
  },
  agency: {
    monthly: process.env.STRIPE_PRICE_AGENCY_MONTHLY || 'price_PLACEHOLDER_agency_monthly',
    yearly: process.env.STRIPE_PRICE_AGENCY_YEARLY || 'price_PLACEHOLDER_agency_yearly',
  },
};

/**
 * Price amounts in BRL for display (centavos).
 */
export const TIER_PRICES_BRL: Record<
  Exclude<Tier, 'free' | 'trial'>,
  { monthly: number; yearly: number }
> = {
  starter: {
    monthly: 9700, // R$97
    yearly: 97000, // R$970 (10 months)
  },
  pro: {
    monthly: 29700, // R$297
    yearly: 297000, // R$2970 (10 months)
  },
  agency: {
    monthly: 59700, // R$597
    yearly: 597000, // R$5970 (10 months)
  },
};

// ============================================
// BILLING PERIOD TYPE
// ============================================

export type BillingPeriod = 'monthly' | 'yearly';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gets the Stripe price ID for a given tier and billing period.
 */
export function getPriceId(tier: Exclude<Tier, 'free' | 'trial'>, period: BillingPeriod): string {
  return STRIPE_PRICES[tier][period];
}

/**
 * Validates if a tier is purchasable (not free or trial).
 */
export function isPurchasableTier(tier: string): tier is Exclude<Tier, 'free' | 'trial'> {
  return ['starter', 'pro', 'agency'].includes(tier);
}

/**
 * Maps Stripe price ID to tier.
 * Used by webhook to determine which tier was purchased.
 */
export function getTierFromPriceId(priceId: string): Exclude<Tier, 'free' | 'trial'> | null {
  for (const [tier, prices] of Object.entries(STRIPE_PRICES)) {
    if (prices.monthly === priceId || prices.yearly === priceId) {
      return tier as Exclude<Tier, 'free' | 'trial'>;
    }
  }
  return null;
}

/**
 * Gets the billing period from a Stripe price ID.
 */
export function getBillingPeriodFromPriceId(priceId: string): BillingPeriod | null {
  for (const prices of Object.values(STRIPE_PRICES)) {
    if (prices.monthly === priceId) return 'monthly';
    if (prices.yearly === priceId) return 'yearly';
  }
  return null;
}

/**
 * Formats price for display in BRL.
 */
export function formatPriceBRL(amountInCentavos: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amountInCentavos / 100);
}

// ============================================
// STRIPE CUSTOMER HELPERS
// ============================================

/**
 * Creates or retrieves a Stripe customer for a user.
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<Stripe.Customer> {
  // First, search for existing customer by metadata
  const existingCustomers = await stripe.customers.search({
    query: `metadata['userId']:'${userId}'`,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name: name || undefined,
    metadata: {
      userId,
    },
  });

  return customer;
}

/**
 * Gets the active subscription for a customer.
 */
export async function getActiveSubscription(
  customerId: string
): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

/**
 * Calculates refund eligibility (CDC Art. 49 - 7 days).
 */
export function isWithinRefundPeriod(subscriptionCreatedAt: number): boolean {
  const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;
  const createdAtMs = subscriptionCreatedAt * 1000;
  const now = Date.now();
  return now - createdAtMs <= sevenDaysInMs;
}
