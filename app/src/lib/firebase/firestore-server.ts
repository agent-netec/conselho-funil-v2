/**
 * firestore-server.ts — Server-only Firestore operations using Firebase Admin SDK.
 * Use these functions inside Next.js API routes instead of client SDK equivalents.
 * Admin SDK bypasses security rules — authorized by service account credentials.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
import type { Conversation, Message, Brand } from '../../types/database';

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
