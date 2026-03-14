/**
 * firestore-server.ts — Server-only Firestore operations using Firebase Admin SDK.
 * Use these functions inside Next.js API routes instead of client SDK equivalents.
 * Admin SDK bypasses security rules — authorized by service account credentials.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
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
  await db.collection('users').doc(userId).update({ credits: FieldValue.increment(delta) });
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
    .where('trialEndsAt', '<=', now)
    .get();
  return snap.docs.map(d => ({ id: d.id, email: d.data().email as string }));
}

export async function downgradeUsersToFreeAdmin(userIds: string[]): Promise<void> {
  if (!userIds.length) return;
  const db = getAdminFirestore();
  const BATCH_SIZE = 500;
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = db.batch();
    userIds.slice(i, i + BATCH_SIZE).forEach(uid => {
      batch.update(db.collection('users').doc(uid), { tier: 'free' });
    });
    await batch.commit();
  }
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
