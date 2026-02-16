import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  Timestamp,
  DocumentReference,
  writeBatch,
  limit,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { Agency, AgencyClient, AgencyMember, AgencyRole, AgencyInvite } from '@/types/agency';
import { v4 as uuidv4 } from 'uuid';

/**
 * Cria uma nova agência.
 */
export async function createAgency(ownerId: string, data: Omit<Agency, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const agencyRef = await addDoc(collection(db, 'agencies'), {
    ...data,
    ownerId,
    createdAt: now,
    updatedAt: now,
  });

  // Adiciona o owner como admin da agência
  await setDoc(doc(db, 'agencies', agencyRef.id, 'members', ownerId), {
    userId: ownerId,
    agencyId: agencyRef.id,
    role: 'admin' as AgencyRole,
    joinedAt: now,
  });

  return agencyRef.id;
}

/**
 * Busca dados de uma agência.
 */
export async function getAgency(agencyId: string): Promise<Agency | null> {
  const agencySnap = await getDoc(doc(db, 'agencies', agencyId));
  if (!agencySnap.exists()) return null;
  return { id: agencySnap.id, ...agencySnap.data() } as Agency;
}

/**
 * Adiciona um cliente a uma agência.
 */
export async function addAgencyClient(agencyId: string, data: Omit<AgencyClient, 'id' | 'agencyId' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const clientRef = await addDoc(collection(db, 'agencies', agencyId, 'clients'), {
    ...data,
    agencyId,
    createdAt: now,
    updatedAt: now,
  });
  return clientRef.id;
}

/**
 * Lista todos os clientes de uma agência.
 */
export async function getAgencyClients(agencyId: string): Promise<AgencyClient[]> {
  const q = query(collection(db, 'agencies', agencyId, 'clients'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgencyClient));
}

/**
 * Adiciona um membro à equipe da agência.
 */
export async function addAgencyMember(agencyId: string, userId: string, role: AgencyRole, assignedClients: string[] = []) {
  const now = Timestamp.now();
  await setDoc(doc(db, 'agencies', agencyId, 'members', userId), {
    userId,
    agencyId,
    role,
    assignedClients,
    joinedAt: now,
  });
}

/**
 * Busca os membros de uma agência.
 */
export async function getAgencyMembers(agencyId: string): Promise<AgencyMember[]> {
  const q = query(collection(db, 'agencies', agencyId, 'members'));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as unknown as AgencyMember);
}

/**
 * Gera um convite para um novo membro.
 */
export async function createAgencyInvite(
  agencyId: string, 
  invitedBy: string, 
  data: { email: string; role: AgencyRole; assignedClients?: string[] }
): Promise<string> {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + (7 * 24 * 60 * 60 * 1000)); // 7 dias
  const token = uuidv4();

  const inviteRef = await addDoc(collection(db, 'agencies', agencyId, 'invites'), {
    ...data,
    agencyId,
    token,
    status: 'pending',
    invitedBy,
    expiresAt,
    createdAt: now,
  });

  return token; // Retornamos o token para gerar o link
}

/**
 * Aceita um convite de agência.
 */
export async function acceptAgencyInvite(token: string, userId: string) {
  // O link do convite contém o agencyId: /invite?token=...&agencyId=...
  // TODO: migrar para collectionGroup query quando índice estiver criado
}

/**
 * Versão simplificada de aceitar convite com agencyId conhecido.
 */
export async function acceptAgencyInviteWithId(agencyId: string, token: string, userId: string) {
  const q = query(
    collection(db, 'agencies', agencyId, 'invites'),
    where('token', '==', token),
    where('status', '==', 'pending'),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Convite inválido ou já utilizado.');

  const inviteDoc = snap.docs[0];
  const inviteData = inviteDoc.data() as AgencyInvite;

  if (inviteData.expiresAt.toMillis() < Date.now()) {
    await updateDoc(inviteDoc.ref, { status: 'expired' });
    throw new Error('Convite expirado.');
  }

  const batch = writeBatch(db);

  // 1. Atualiza status do convite
  batch.update(inviteDoc.ref, {
    status: 'accepted',
    acceptedAt: Timestamp.now()
  });

  // 2. Adiciona o membro
  const memberRef = doc(db, 'agencies', agencyId, 'members', userId);
  batch.set(memberRef, {
    userId,
    agencyId,
    role: inviteData.role,
    assignedClients: inviteData.assignedClients || [],
    joinedAt: Timestamp.now()
  });

  await batch.commit();
}

/**
 * Busca as agências das quais um usuário é membro.
 */
export async function getUserAgencies(userId: string): Promise<AgencyMember[]> {
  // Placeholder para implementação real via collectionGroup ou campo no User
  return [];
}
