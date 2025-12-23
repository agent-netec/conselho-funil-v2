import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './config';
import type {
  User,
  Tenant,
  Funnel,
  FunnelContext,
  Proposal,
  Decision,
  Conversation,
  Message,
  LibraryTemplate,
} from '@/types/database';

// ============================================
// USERS
// ============================================

export async function createUser(userId: string, data: Omit<User, 'id' | 'createdAt' | 'lastLogin'>) {
  const userRef = doc(db, 'users', userId);
  const now = Timestamp.now();
  
  await setDoc(userRef, {
    ...data,
    createdAt: now,
    lastLogin: now,
  });
  
  return userId;
}

export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return null;
  
  return { id: userSnap.id, ...userSnap.data() } as User;
}

export async function updateUserLastLogin(userId: string) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { lastLogin: Timestamp.now() });
}

// ============================================
// TENANTS
// ============================================

export async function createTenant(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const tenantRef = await addDoc(collection(db, 'tenants'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  return tenantRef.id;
}

export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const tenantRef = doc(db, 'tenants', tenantId);
  const tenantSnap = await getDoc(tenantRef);
  
  if (!tenantSnap.exists()) return null;
  
  return { id: tenantSnap.id, ...tenantSnap.data() } as Tenant;
}

// ============================================
// FUNNELS
// ============================================

export async function createFunnel(data: {
  userId: string;
  tenantId?: string;
  name: string;
  description?: string;
  context: FunnelContext;
}): Promise<string> {
  const now = Timestamp.now();
  const funnelRef = await addDoc(collection(db, 'funnels'), {
    ...data,
    status: 'draft',
    createdAt: now,
    updatedAt: now,
  });
  
  return funnelRef.id;
}

export async function getFunnel(funnelId: string): Promise<Funnel | null> {
  const funnelRef = doc(db, 'funnels', funnelId);
  const funnelSnap = await getDoc(funnelRef);
  
  if (!funnelSnap.exists()) return null;
  
  return { id: funnelSnap.id, ...funnelSnap.data() } as Funnel;
}

export async function getUserFunnels(userId: string): Promise<Funnel[]> {
  const q = query(
    collection(db, 'funnels'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funnel));
}

export async function updateFunnel(funnelId: string, data: Partial<Funnel>) {
  const funnelRef = doc(db, 'funnels', funnelId);
  await updateDoc(funnelRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteFunnel(funnelId: string) {
  const funnelRef = doc(db, 'funnels', funnelId);
  await deleteDoc(funnelRef);
}

// ============================================
// PROPOSALS (subcollection)
// ============================================

export async function createProposal(
  funnelId: string,
  data: Omit<Proposal, 'id' | 'funnelId' | 'createdAt'>
): Promise<string> {
  const proposalRef = await addDoc(
    collection(db, 'funnels', funnelId, 'proposals'),
    {
      ...data,
      funnelId,
      createdAt: Timestamp.now(),
    }
  );
  
  return proposalRef.id;
}

export async function getFunnelProposals(funnelId: string): Promise<Proposal[]> {
  const q = query(
    collection(db, 'funnels', funnelId, 'proposals'),
    orderBy('version', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Proposal));
}

// ============================================
// DECISIONS (subcollection)
// ============================================

export async function createDecision(
  funnelId: string,
  data: Omit<Decision, 'id' | 'funnelId' | 'createdAt'>
): Promise<string> {
  const decisionRef = await addDoc(
    collection(db, 'funnels', funnelId, 'decisions'),
    {
      ...data,
      funnelId,
      createdAt: Timestamp.now(),
    }
  );
  
  return decisionRef.id;
}

// ============================================
// CONVERSATIONS
// ============================================

export async function createConversation(data: {
  userId: string;
  tenantId?: string;
  title: string;
  context?: Conversation['context'];
}): Promise<string> {
  const now = Timestamp.now();
  const convRef = await addDoc(collection(db, 'conversations'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  return convRef.id;
}

export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  
  if (!convSnap.exists()) return null;
  
  return { id: convSnap.id, ...convSnap.data() } as Conversation;
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  const q = query(
    collection(db, 'conversations'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
    limit(50)
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
}

export async function updateConversation(conversationId: string, data: Partial<Conversation>) {
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteConversation(conversationId: string) {
  const convRef = doc(db, 'conversations', conversationId);
  await deleteDoc(convRef);
}

// ============================================
// MESSAGES (subcollection)
// ============================================

export async function addMessage(
  conversationId: string,
  data: Omit<Message, 'id' | 'conversationId' | 'createdAt'>
): Promise<string> {
  const messageRef = await addDoc(
    collection(db, 'conversations', conversationId, 'messages'),
    {
      ...data,
      conversationId,
      createdAt: Timestamp.now(),
    }
  );
  
  // Update conversation's updatedAt
  await updateConversation(conversationId, {});
  
  return messageRef.id;
}

export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    callback(messages);
  });
}

// ============================================
// LIBRARY TEMPLATES
// ============================================

export async function getLibraryTemplates(
  filters?: { type?: string; vertical?: string }
): Promise<LibraryTemplate[]> {
  let q = query(collection(db, 'library'), orderBy('usageCount', 'desc'));
  
  const snapshot = await getDocs(q);
  let templates = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryTemplate));
  
  // Client-side filtering (Firestore doesn't support multiple inequality filters)
  if (filters?.type) {
    templates = templates.filter(t => t.type === filters.type);
  }
  
  return templates;
}

export async function saveToLibrary(data: Omit<LibraryTemplate, 'id' | 'createdAt' | 'usageCount'>) {
  const templateRef = await addDoc(collection(db, 'library'), {
    ...data,
    usageCount: 0,
    createdAt: Timestamp.now(),
  });
  
  return templateRef.id;
}

// ============================================
// STATS (for dashboard)
// ============================================

export async function getUserStats(userId: string) {
  const [funnels, conversations] = await Promise.all([
    getUserFunnels(userId),
    getUserConversations(userId),
  ]);
  
  const activeFunnels = funnels.filter(f => 
    !['completed', 'killed'].includes(f.status)
  ).length;
  
  const pendingEvaluations = funnels.filter(f => 
    f.status === 'review'
  ).length;
  
  const decisionsThisMonth = funnels.filter(f => {
    const createdAt = f.createdAt.toDate();
    const now = new Date();
    return (
      createdAt.getMonth() === now.getMonth() &&
      createdAt.getFullYear() === now.getFullYear() &&
      ['approved', 'killed', 'adjusting'].includes(f.status)
    );
  }).length;
  
  return {
    activeFunnels,
    pendingEvaluations,
    decisionsThisMonth,
    totalConversations: conversations.length,
  };
}


