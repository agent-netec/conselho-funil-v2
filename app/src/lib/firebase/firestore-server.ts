/**
 * firestore-server.ts — Server-only Firestore operations using Firebase Admin SDK.
 * Use these functions inside Next.js API routes instead of client SDK equivalents.
 * Admin SDK bypasses security rules — authorized by service account credentials.
 */
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
import { Tier, TIER_LIMITS } from '@/lib/tier-system';
import type { Conversation, Message, Brand, Funnel } from '../../types/database';

// ---------------------------------------------------------------------------
// Conversations
// ---------------------------------------------------------------------------

export async function getConversationAdmin(
  conversationId: string
): Promise<Conversation | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('conversations').doc(conversationId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Conversation;
}

export async function addMessageAdmin(
  conversationId: string,
  data: Omit<Message, 'id' | 'conversationId' | 'createdAt' | 'timestamp'>
): Promise<string> {
  const db = getAdminFirestore();
  const now = FieldValue.serverTimestamp();
  const ref = await db
    .collection('conversations')
    .doc(conversationId)
    .collection('messages')
    .add({ ...data, conversationId, timestamp: now, createdAt: now });

  // Update conversation updatedAt
  await db.collection('conversations').doc(conversationId).update({ updatedAt: now });

  return ref.id;
}

export async function updateConversationAdmin(
  conversationId: string,
  data: Partial<Conversation>
): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('conversations').doc(conversationId).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Brands
// ---------------------------------------------------------------------------

export async function getBrandAdmin(brandId: string): Promise<Brand | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('brands').doc(brandId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Brand;
}

export async function getUserBrandsAdmin(userId: string): Promise<Brand[]> {
  const db = getAdminFirestore();
  const snap = await db.collection('brands').where('userId', '==', userId).limit(10).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }) as Brand);
}

// ---------------------------------------------------------------------------
// Users / Credits
// ---------------------------------------------------------------------------

export async function getUserCreditsAdmin(userId: string): Promise<number> {
  const db = getAdminFirestore();
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return 100; // default
  return (snap.data()?.credits as number) ?? 100;
}

export async function getUserAdmin(userId: string): Promise<{ id: string; email: string; name?: string; stripeCustomerId?: string } | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data()!;
  return { id: snap.id, email: data.email, name: data.name, stripeCustomerId: data.stripeCustomerId };
}

export async function getUserStripeCustomerIdAdmin(userId: string): Promise<string | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return null;
  return (snap.data()?.stripeCustomerId as string) ?? null;
}

export async function setUserStripeCustomerIdAdmin(userId: string, stripeCustomerId: string): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('users').doc(userId).set({ stripeCustomerId }, { merge: true });
}

// ---------------------------------------------------------------------------
// Users — Usage / Tier / Cron
// ---------------------------------------------------------------------------

export async function updateUserUsageAdmin(userId: string, delta: number): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('users').doc(userId).update({
    credits: FieldValue.increment(delta),
    usage: FieldValue.increment(Math.abs(delta)),
  });
}

// ---------------------------------------------------------------------------
// Credits — Monthly system with auto-reset (Sprint 02.3)
// ---------------------------------------------------------------------------

/** Credit cost per operation */
export const CREDIT_COSTS: Record<string, number> = {
  chat: 1,
  chat_party: 2,
  social_quick: 1,
  social_strategic: 2,
  design_generate: 5,
  design_plan: 2,
  design_analyze: 0,  // informational, free
  deep_research: 3,
  keywords_miner: 1,
  spy_agent: 2,
  spy_discover: 2,
  predict_analyze: 3,
  predict_generate: 5,
  offer_lab: 2,
  verdict_refresh: 1,
};

function getNextResetDate(current: Date): Date {
  const next = new Date(current);
  next.setMonth(next.getMonth() + 1);
  return next;
}

/**
 * Consume credits atomically using a Firestore transaction.
 * Auto-resets credits if the reset date has passed (use-it-or-lose-it).
 *
 * @throws ApiError(402) if insufficient credits
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  feature: string
): Promise<{ remaining: number; resetDate: Date }> {
  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(userId);

  return db.runTransaction(async (t) => {
    const doc = await t.get(userRef);
    if (!doc.exists) {
      // Should not happen — user doc must exist
      throw Object.assign(new Error('User not found'), { statusCode: 404 });
    }
    const data = doc.data()!;
    const tier = (data.tier as Tier) || 'trial';
    const monthlyCredits = data.monthlyCredits ?? TIER_LIMITS[tier]?.maxMonthlyCredits ?? 0;
    let creditsUsed = data.creditsUsed ?? 0;
    let creditResetDate = data.creditResetDate;

    // Check if reset is needed (anniversary passed)
    const now = new Date();
    if (creditResetDate) {
      const resetDate = typeof creditResetDate.toDate === 'function'
        ? creditResetDate.toDate()
        : new Date(creditResetDate);
      if (resetDate <= now) {
        // Reset + consume
        const nextReset = getNextResetDate(resetDate);
        t.update(userRef, {
          creditsUsed: amount,
          creditResetDate: Timestamp.fromDate(nextReset),
        });
        return { remaining: monthlyCredits - amount, resetDate: nextReset };
      }
    } else {
      // No reset date set — initialize it (first use after migration)
      const nextReset = getNextResetDate(now);
      t.update(userRef, {
        monthlyCredits,
        creditsUsed: amount,
        creditResetDate: Timestamp.fromDate(nextReset),
      });
      return { remaining: monthlyCredits - amount, resetDate: nextReset };
    }

    // Check sufficient credits
    const remaining = monthlyCredits - creditsUsed;
    if (remaining < amount) {
      const resetDate = typeof creditResetDate.toDate === 'function'
        ? creditResetDate.toDate()
        : new Date(creditResetDate);
      const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      throw Object.assign(
        new Error(`Créditos insuficientes. ${remaining} restantes, ${amount} necessários. Reset em ${daysUntilReset} dias.`),
        { statusCode: 402 }
      );
    }

    // Consume
    t.update(userRef, {
      creditsUsed: FieldValue.increment(amount),
    });

    const resetDate = typeof creditResetDate.toDate === 'function'
      ? creditResetDate.toDate()
      : new Date(creditResetDate);
    return { remaining: remaining - amount, resetDate };
  });
}

/**
 * Check and enforce daily limits for Free tier.
 * @throws ApiError(429) if daily limit exceeded
 */
export async function checkDailyLimit(
  userId: string,
  limitType: 'chat' | 'funnel'
): Promise<void> {
  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(userId);
  const snap = await userRef.get();
  if (!snap.exists) return;

  const data = snap.data()!;
  const today = new Date().toISOString().split('T')[0];

  if (limitType === 'chat') {
    const lastDate = data.lastChatDate || '';
    const count = data.dailyChatCount || 0;

    if (lastDate === today && count >= 1) {
      throw Object.assign(
        new Error('Limite diário atingido. No plano Free você tem 1 consulta por dia. Volte amanhã ou faça upgrade!'),
        { statusCode: 429 }
      );
    }

    // Increment or reset
    if (lastDate !== today) {
      await userRef.update({ dailyChatCount: 1, lastChatDate: today });
    } else {
      await userRef.update({ dailyChatCount: FieldValue.increment(1) });
    }
  } else {
    const lastDate = data.lastFunnelDate || '';
    const count = data.dailyFunnelCount || 0;

    if (lastDate === today && count >= 1) {
      throw Object.assign(
        new Error('Limite diário atingido. No plano Free você tem 1 funil por dia. Volte amanhã ou faça upgrade!'),
        { statusCode: 429 }
      );
    }

    if (lastDate !== today) {
      await userRef.update({ dailyFunnelCount: 1, lastFunnelDate: today });
    } else {
      await userRef.update({ dailyFunnelCount: FieldValue.increment(1) });
    }
  }
}

export async function updateUserTierAdmin(
  userId: string,
  tier: string,
  stripeCustomerIdOrData?: string | Record<string, unknown>,
  subscriptionId?: string
): Promise<void> {
  const db = getAdminFirestore();
  let extra: Record<string, unknown> = {};
  if (typeof stripeCustomerIdOrData === 'string') {
    extra = { stripeCustomerId: stripeCustomerIdOrData };
    if (subscriptionId) extra.subscriptionId = subscriptionId;
  } else if (stripeCustomerIdOrData) {
    extra = stripeCustomerIdOrData;
  }
  await db.collection('users').doc(userId).update({ tier, ...extra });
}

export async function getExpiredTrialUsersAdmin(): Promise<{ id: string; email: string }[]> {
  const db = getAdminFirestore();
  const now = new Date();
  const snap = await db
    .collection('users')
    .where('tier', '==', 'trial')
    .where('trialExpiresAt', '<=', now)
    .get();
  return snap.docs.map(d => ({ id: d.id, email: d.data().email as string }));
}

export async function downgradeUsersToFreeAdmin(userIds: string[]): Promise<number> {
  if (!userIds.length) return 0;
  const db = getAdminFirestore();
  const BATCH_SIZE = 500;
  let downgraded = 0;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = userIds.slice(i, i + BATCH_SIZE);
    chunk.forEach(uid => {
      batch.update(db.collection('users').doc(uid), {
        tier: 'free',
        dailyChatCount: 0,
        lastChatDate: null,
        dailyFunnelCount: 0,
        lastFunnelDate: null,
      });
    });
    await batch.commit();
    downgraded += chunk.length;
  }
  return downgraded;
}

export async function getAllBrandIdsAdmin(): Promise<string[]> {
  const db = getAdminFirestore();
  const snap = await db.collection('brands').select().get();
  return snap.docs.map(d => d.id);
}

// ---------------------------------------------------------------------------
// Funnels
// ---------------------------------------------------------------------------

export async function getFunnelAdmin(funnelId: string): Promise<Funnel | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('funnels').doc(funnelId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as Funnel;
}

export async function getUserFunnelsAdmin(userId: string): Promise<Funnel[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('funnels')
    .where('userId', '==', userId)
    .orderBy('updatedAt', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Funnel));
}

export async function updateFunnelAdmin(funnelId: string, data: Partial<Funnel>): Promise<void> {
  const db = getAdminFirestore();
  await db.collection('funnels').doc(funnelId).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

export async function createProposalAdmin(
  funnelId: string,
  data: Record<string, unknown>
): Promise<string> {
  const db = getAdminFirestore();
  const ref = await db
    .collection('funnels')
    .doc(funnelId)
    .collection('proposals')
    .add({ ...data, createdAt: FieldValue.serverTimestamp() });
  return ref.id;
}

export async function getFunnelProposalsAdmin(funnelId: string): Promise<any[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('funnels')
    .doc(funnelId)
    .collection('proposals')
    .orderBy('version', 'desc')
    .get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ---------------------------------------------------------------------------
// Campaigns
// ---------------------------------------------------------------------------

export async function getCampaignAdmin(campaignId: string): Promise<any | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('campaigns').doc(campaignId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Returns the most recently updated active campaign for a brand.
 * Used by chat auto-detect (WS-5 — Linha de Ouro).
 * Note: May require a composite index on (brandId, status, updatedAt).
 */
export async function getActiveCampaignForBrandAdmin(brandId: string): Promise<any | null> {
  const db = getAdminFirestore();
  try {
    const snap = await db.collection('campaigns')
      .where('brandId', '==', brandId)
      .where('status', '==', 'active')
      .orderBy('updatedAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return null;
    return { id: snap.docs[0].id, ...snap.docs[0].data() };
  } catch (err) {
    console.warn('[getActiveCampaignForBrandAdmin] Query failed (may need composite index):', err);
    return null;
  }
}
