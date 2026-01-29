import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './config';
import { withResilience } from './resilience';
import { encryptSensitiveFields } from '../utils/encryption';
import type { 
  JourneyLead, 
  JourneyEvent, 
  JourneyTransaction 
} from '@/types/journey';

export async function getLead(leadId: string): Promise<JourneyLead | null> {
  const docRef = doc(db, 'leads', leadId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as JourneyLead;
}

export async function findLeadByEmailHash(emailHash: string): Promise<JourneyLead | null> {
  return getLead(emailHash);
}

export async function upsertLead(leadId: string, data: Partial<JourneyLead>) {
  const docRef = doc(db, 'leads', leadId);
  const now = Timestamp.now();
  const secureData = data.pii ? { ...data, pii: encryptSensitiveFields(data.pii) } : data;

  await withResilience(async () => {
    await setDoc(docRef, {
      ...secureData,
      updatedAt: now,
      createdAt: data.createdAt || now,
    }, { merge: true });
  });
}

export async function createJourneyEvent(event: Omit<JourneyEvent, 'id'>): Promise<string> {
  const eventsRef = collection(db, 'events');
  const now = Timestamp.now();
  const secureEvent = {
    ...event,
    session: encryptSensitiveFields(event.session),
    timestamp: event.timestamp || now
  };
  const docRef = await addDoc(eventsRef, secureEvent);
  return docRef.id;
}

export async function getLeadEvents(leadId: string, limitCount: number = 50): Promise<JourneyEvent[]> {
  const eventsRef = collection(db, 'events');
  const q = query(
    eventsRef, 
    where('leadId', '==', leadId), 
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as JourneyEvent));
}

export async function createTransaction(transaction: Omit<JourneyTransaction, 'id'>): Promise<string> {
  const transactionsRef = collection(db, 'transactions');
  const now = Timestamp.now();
  const docRef = await addDoc(transactionsRef, {
    ...transaction,
    createdAt: transaction.createdAt || now,
    processedAt: transaction.processedAt || now
  });
  return docRef.id;
}
