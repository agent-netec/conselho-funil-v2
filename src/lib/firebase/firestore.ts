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

/**
 * Cria um novo documento de usuário no Firestore.
 * 
 * @param userId - O UID do usuário vindo do Firebase Auth.
 * @param data - Dados básicos do usuário (nome, e-mail, etc.).
 * @returns O ID do usuário criado.
 */
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

/**
 * Busca os dados de um usuário pelo ID.
 * 
 * @param userId - O ID do usuário.
 * @returns Os dados do usuário ou null se não for encontrado.
 */
export async function getUser(userId: string): Promise<User | null> {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (!userSnap.exists()) return null;
  
  return { id: userSnap.id, ...userSnap.data() } as User;
}

/**
 * Atualiza o timestamp de último login do usuário.
 * 
 * @param userId - O ID do usuário.
 */
export async function updateUserLastLogin(userId: string) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, { lastLogin: Timestamp.now() });
}

// ============================================
// TENANTS
// ============================================

/**
 * Cria um novo tenant (organização/conta multi-tenant).
 * 
 * @param data - Dados do tenant.
 * @returns O ID do tenant criado.
 */
export async function createTenant(data: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = Timestamp.now();
  const tenantRef = await addDoc(collection(db, 'tenants'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  return tenantRef.id;
}

/**
 * Busca os dados de um tenant pelo ID.
 * 
 * @param tenantId - O ID do tenant.
 * @returns Os dados do tenant ou null se não encontrado.
 */
export async function getTenant(tenantId: string): Promise<Tenant | null> {
  const tenantRef = doc(db, 'tenants', tenantId);
  const tenantSnap = await getDoc(tenantRef);
  
  if (!tenantSnap.exists()) return null;
  
  return { id: tenantSnap.id, ...tenantSnap.data() } as Tenant;
}

// ============================================
// FUNNELS
// ============================================

/**
 * Cria um novo funil de vendas.
 * 
 * @param data - Dados de criação do funil, incluindo contexto e vinculação de usuário/tenant/marca.
 * @returns O ID do funil criado.
 */
export async function createFunnel(data: {
  userId: string;
  tenantId?: string;
  name: string;
  description?: string;
  context: FunnelContext;
  brandId?: string;
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

/**
 * Busca um funil específico pelo ID.
 * 
 * @param funnelId - O ID do funil.
 * @returns O objeto Funnel ou null se não encontrado.
 */
export async function getFunnel(funnelId: string): Promise<Funnel | null> {
  const funnelRef = doc(db, 'funnels', funnelId);
  const funnelSnap = await getDoc(funnelRef);
  
  if (!funnelSnap.exists()) return null;
  
  return { id: funnelSnap.id, ...funnelSnap.data() } as Funnel;
}

/**
 * Recupera todos os funis pertencentes a um usuário.
 * 
 * @param userId - O ID do usuário.
 * @returns Array de funis ordenados pela última atualização.
 */
export async function getUserFunnels(userId: string): Promise<Funnel[]> {
  const q = query(
    collection(db, 'funnels'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Funnel));
}

/**
 * Atualiza os dados de um funil existente.
 * 
 * @param funnelId - O ID do funil.
 * @param data - Objeto parcial com os dados a serem atualizados.
 */
export async function updateFunnel(funnelId: string, data: Partial<Funnel>) {
  const funnelRef = doc(db, 'funnels', funnelId);
  await updateDoc(funnelRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Exclui um funil permanentemente.
 * 
 * @param funnelId - O ID do funil.
 */
export async function deleteFunnel(funnelId: string) {
  const funnelRef = doc(db, 'funnels', funnelId);
  await deleteDoc(funnelRef);
}

// ============================================
// PROPOSALS (subcollection)
// ============================================

/**
 * Cria uma nova proposta estratégica vinculada a um funil.
 * Propostas são armazenadas como uma subcoleção do funil.
 * 
 * @param funnelId - O ID do funil pai.
 * @param data - Dados da proposta estratégica.
 * @returns O ID da proposta criada.
 */
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

/**
 * Recupera todas as propostas estratégicas de um funil.
 * 
 * @param funnelId - O ID do funil.
 * @returns Array de propostas ordenadas pela versão (decrescente).
 */
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

/**
 * Registra uma decisão tomada pelo usuário sobre um funil (aprovação, morte, etc.).
 * 
 * @param funnelId - O ID do funil relacionado.
 * @param data - Detalhes da decisão e justificativa.
 * @returns O ID do registro da decisão.
 */
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

/**
 * Inicia uma nova conversa no chat.
 * 
 * @param data - Dados básicos da conversa (usuário, título, contexto, marca).
 * @returns O ID da conversa criada.
 */
export async function createConversation(data: {
  userId: string;
  tenantId?: string;
  title: string;
  context?: Conversation['context'];
  brandId?: string;
}): Promise<string> {
  const now = Timestamp.now();
  const convRef = await addDoc(collection(db, 'conversations'), {
    ...data,
    createdAt: now,
    updatedAt: now,
  });
  
  return convRef.id;
}

/**
 * Busca uma conversa específica pelo ID.
 * 
 * @param conversationId - O ID da conversa.
 * @returns O objeto Conversation ou null se não encontrada.
 */
export async function getConversation(conversationId: string): Promise<Conversation | null> {
  const convRef = doc(db, 'conversations', conversationId);
  const convSnap = await getDoc(convRef);
  
  if (!convSnap.exists()) return null;
  
  return { id: convSnap.id, ...convSnap.data() } as Conversation;
}

/**
 * Recupera as conversas recentes de um usuário.
 * 
 * @param userId - O ID do usuário.
 * @returns Array das últimas 50 conversas.
 */
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

/**
 * Atualiza metadados de uma conversa (ex: título).
 * 
 * @param conversationId - O ID da conversa.
 * @param data - Campos parciais a atualizar.
 */
export async function updateConversation(conversationId: string, data: Partial<Conversation>) {
  const convRef = doc(db, 'conversations', conversationId);
  await updateDoc(convRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Exclui uma conversa permanentemente.
 * 
 * @param conversationId - O ID da conversa.
 */
export async function deleteConversation(conversationId: string) {
  const convRef = doc(db, 'conversations', conversationId);
  await deleteDoc(convRef);
}

// ============================================
// MESSAGES (subcollection)
// ============================================

/**
 * Adiciona uma mensagem a uma conversa.
 * Também atualiza o timestamp de atualização da conversa pai.
 * 
 * @param conversationId - O ID da conversa.
 * @param data - Conteúdo da mensagem e remetente.
 * @returns O ID da mensagem criada.
 */
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

/**
 * Recupera todas as mensagens de uma conversa.
 * 
 * @param conversationId - O ID da conversa.
 * @returns Array de mensagens ordenadas cronologicamente.
 */
export async function getConversationMessages(conversationId: string): Promise<Message[]> {
  const q = query(
    collection(db, 'conversations', conversationId, 'messages'),
    orderBy('createdAt', 'asc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
}

/**
 * Cria uma inscrição (listener) para receber atualizações de mensagens em tempo real.
 * 
 * @param conversationId - O ID da conversa.
 * @param callback - Função executada a cada atualização da lista de mensagens.
 * @returns Função para cancelar a inscrição.
 */
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

/**
 * Busca modelos da biblioteca com filtros opcionais.
 * 
 * @param filters - Filtros por tipo de funil ou vertical de negócio.
 * @returns Array de modelos de biblioteca ordenados por popularidade.
 */
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

/**
 * Salva um novo modelo na biblioteca pública ou privada.
 * 
 * @param data - Dados do modelo (estrutura, descrição, tipo).
 * @returns O ID do modelo criado.
 */
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

/**
 * Consolida estatísticas de uso para o painel de controle do usuário.
 * 
 * @param userId - O ID do usuário.
 * @returns Objeto com contagens de funis ativos, avaliações pendentes e decisões do mês.
 */
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


