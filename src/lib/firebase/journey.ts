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

/**
 * @fileoverview Operações de Firestore para o Journey Mapping Wing
 * @module lib/firebase/journey
 */

// ============================================
// LEADS
// ============================================

/**
 * Busca um lead pelo ID (geralmente hash do email).
 */
export async function getLead(leadId: string): Promise<JourneyLead | null> {
  const docRef = doc(db, 'leads', leadId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return null;
  
  return { id: snap.id, ...snap.data() } as JourneyLead;
}

/**
 * Busca um lead pelo email (criptografado).
 * Nota: Como o email é criptografado com AES, não podemos fazer query direta no Firestore
 * a menos que usemos um hash determinístico para busca. 
 * Por enquanto, assumimos que o leadId É o hash do email.
 */
export async function findLeadByEmailHash(emailHash: string): Promise<JourneyLead | null> {
  return getLead(emailHash);
}

/**
 * Cria ou atualiza um perfil de lead.
 */
export async function upsertLead(leadId: string, data: Partial<JourneyLead>) {
  const docRef = doc(db, 'leads', leadId);
  const now = Timestamp.now();

  // Criptografar PII se presente
  const secureData = data.pii ? {
    ...data,
    pii: encryptSensitiveFields(data.pii)
  } : data;

  await withResilience(async () => {
    await setDoc(docRef, {
      ...secureData,
      updatedAt: now,
      createdAt: data.createdAt || now,
    }, { merge: true });
  });
}

// ============================================
// EVENTS
// ============================================

/**
 * Registra um novo evento na jornada do lead.
 */
export async function createJourneyEvent(event: Omit<JourneyEvent, 'id'>): Promise<string> {
  const eventsRef = collection(db, 'events');
  const now = Timestamp.now();

  // Criptografar IP se presente
  const secureEvent = {
    ...event,
    session: encryptSensitiveFields(event.session),
    timestamp: event.timestamp || now
  };

  const docRef = await addDoc(eventsRef, secureEvent);
  return docRef.id;
}

/**
 * Busca a timeline de eventos de um lead.
 */
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

// ============================================
// TRANSACTIONS
// ============================================

/**
 * Registra uma transação financeira.
 */
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
