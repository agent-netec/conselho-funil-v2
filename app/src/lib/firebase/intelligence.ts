import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { db } from './config';
import { withResilience } from './resilience';
import type { 
  IntelligenceDocument, 
  BrandKeywordsConfig, 
  IntelligenceQueryFilter,
  IntelligenceQueryResult,
  CreateIntelligenceInput
} from '@/types/intelligence';
import type { CompetitorProfile, IntelligenceAsset } from '@/types/competitors';

// ============================================
// COMPETITORS
// ============================================

/**
 * Busca um perfil de concorrente pelo ID.
 */
export async function getCompetitorProfile(brandId: string, competitorId: string): Promise<CompetitorProfile | null> {
  const docRef = doc(db, 'brands', brandId, 'intelligence', 'competitors', competitorId);
  const snap = await getDoc(docRef);
  
  if (!snap.exists()) return null;
  
  return { id: snap.id, ...snap.data() } as CompetitorProfile;
}

/**
 * Atualiza o perfil de um concorrente (ex: após Spy Scan).
 */
export async function updateCompetitorProfile(
  brandId: string, 
  competitorId: string, 
  data: Partial<CompetitorProfile>
) {
  const docRef = doc(db, 'brands', brandId, 'intelligence', 'competitors', competitorId);
  await withResilience(async () => {
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  });
}

// ============================================
// COMPETITOR ASSETS
// ============================================

/**
 * Salva um novo ativo de inteligência (screenshot, tech log, etc).
 * Collection: brands/{brandId}/intelligence/competitors/{competitorId}/assets
 */
export async function createIntelligenceAsset(
  brandId: string,
  competitorId: string,
  asset: Omit<IntelligenceAsset, 'id'>
): Promise<string> {
  const assetsRef = collection(db, 'brands', brandId, 'intelligence', 'competitors', competitorId, 'assets');
  const docRef = await addDoc(assetsRef, {
    ...asset,
    version: 1,
  });
  return docRef.id;
}

/**
 * Busca todos os ativos de um concorrente.
 */
export async function getCompetitorAssets(brandId: string, competitorId: string): Promise<IntelligenceAsset[]> {
  const assetsRef = collection(db, 'brands', brandId, 'intelligence', 'competitors', competitorId, 'assets');
  const q = query(assetsRef, orderBy('capturedAt', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as IntelligenceAsset));
}

// ============================================
// INTELLIGENCE DOCUMENTS
// ============================================

/**
 * Cria um novo documento de inteligência na subcoleção da marca.
 */
export async function createIntelligenceDocument(data: CreateIntelligenceInput): Promise<string> {
  const now = Timestamp.now();
  const expiresAt = calculateExpiresAt(data.type, now);
  
  // Gerar hash para deduplicação (será preenchido pelo Scout, mas garantimos aqui se necessário)
  const textHash = (data.content as any).textHash || await generateHash(data.content.text || '');

  const docData: Omit<IntelligenceDocument, 'id'> = {
    brandId: data.brandId,
    type: data.type,
    status: 'raw',
    source: data.source,
    content: {
      ...data.content,
      textHash,
    },
    metrics: data.metrics,
    collectedAt: now,
    expiresAt,
    version: 1,
  };

  const intelligenceRef = collection(db, 'brands', data.brandId, 'intelligence');
  const docRef = await addDoc(intelligenceRef, docData);
  
  return docRef.id;
}

/**
 * Busca documentos de inteligência com filtros.
 */
export async function queryIntelligence(filters: IntelligenceQueryFilter): Promise<IntelligenceQueryResult> {
  const intelligenceRef = collection(db, 'brands', filters.brandId, 'intelligence');
  let q = query(intelligenceRef);

  if (filters.types && filters.types.length > 0) {
    q = query(q, where('type', 'in', filters.types));
  }

  if (filters.status && filters.status.length > 0) {
    q = query(q, where('status', 'in', filters.status));
  }

  if (filters.dateRange) {
    q = query(q, 
      where('collectedAt', '>=', filters.dateRange.start),
      where('collectedAt', '<=', filters.dateRange.end)
    );
  }

  if (filters.textHash) {
    q = query(q, where('content.textHash', '==', filters.textHash));
  }

  const orderField = filters.orderBy || 'collectedAt';
  const orderDirection = filters.orderDirection || 'desc';
  q = query(q, orderBy(orderField, orderDirection));

  if (filters.limit) {
    q = query(q, limit(filters.limit));
  }

  const snapshot = await getDocs(q);
  const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as IntelligenceDocument));

  return {
    documents,
    total: documents.length,
    hasMore: false, // Implementar paginação real se necessário
  };
}

/**
 * Atualiza um documento de inteligência (ex: após processamento do Analyst).
 */
export async function updateIntelligenceDocument(
  brandId: string, 
  docId: string, 
  data: Partial<IntelligenceDocument>
) {
  const docRef = doc(db, 'brands', brandId, 'intelligence', docId);
  await withResilience(async () => {
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  });
}

// ============================================
// INTELLIGENCE CONFIG (KEYWORDS)
// ============================================

/**
 * Busca a configuração de keywords de uma marca.
 */
export async function getBrandKeywordsConfig(brandId: string): Promise<BrandKeywordsConfig | null> {
  const configRef = doc(db, 'brands', brandId, 'intelligence', '_config', 'keywords');
  const snap = await getDoc(configRef);
  
  if (!snap.exists()) return null;
  
  return snap.data() as BrandKeywordsConfig;
}

/**
 * Salva ou atualiza a configuração de keywords.
 */
export async function saveBrandKeywordsConfig(brandId: string, config: Partial<BrandKeywordsConfig>) {
  const configRef = doc(db, 'brands', brandId, 'intelligence', '_config', 'keywords');
  const now = Timestamp.now();
  
  await setDoc(configRef, {
    ...config,
    brandId,
    updatedAt: now,
    version: (config.version || 0) + 1,
  }, { merge: true });
}

// ============================================
// HELPERS
// ============================================

function calculateExpiresAt(type: string, collectedAt: Timestamp): Timestamp {
  const date = collectedAt.toDate();
  let days = 30; // Default

  switch (type) {
    case 'mention': days = 30; break;
    case 'trend': days = 90; break;
    case 'competitor': days = 60; break;
    case 'news': days = 14; break;
  }

  date.setDate(date.getDate() + days);
  return Timestamp.fromDate(date);
}

async function generateHash(text: string): Promise<string> {
  // Simples hash para o lado do cliente se necessário, 
  // mas o Scout deve usar crypto-js no Node/Edge
  return text.substring(0, 10) + text.length; 
}
