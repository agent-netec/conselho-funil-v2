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
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config';
import { withResilience } from './resilience';
import { generateEmbedding } from '../ai/embeddings';
import { upsertVaultVector } from '../vault/pinecone-vault';
import { encrypt, decrypt } from '../utils/encryption';
import type { CopyDNA, VaultAsset, VaultContent } from '@/types/vault';
import type { PublisherJob } from '@/types/publisher';

/**
 * @fileoverview Monara Token Vault (ST-20.2, S30-FN-03)
 * Gerencia o armazenamento seguro de tokens de API (Meta, Google, etc)
 * com criptografia AES-256 e isolamento por brandId.
 *
 * S30-FN-03: Metadata tipada por plataforma + isTokenExpiring per-provider (DT-01/14)
 */

// ─── Metadata interfaces por plataforma (DT-14) ───

/** Metadata específica para tokens Meta Ads */
export interface MetaTokenMetadata {
  adAccountId: string;        // act_XXXX
  pixelId?: string;           // Para CAPI
  appId: string;              // Para token refresh
  appSecret: string;          // AES-256 encrypted — para token refresh
}

/** Metadata específica para tokens Google Ads */
export interface GoogleTokenMetadata {
  customerId: string;         // Google Ads customer ID
  developerToken: string;     // AES-256 encrypted
  clientId: string;           // OAuth Client ID — para token refresh
  clientSecret: string;       // AES-256 encrypted — para token refresh
  managerAccountId?: string;  // MCC (opcional)
}

// ─── MonaraToken interface ───

export type VaultProvider = 'meta' | 'google' | 'instagram' | 'linkedin' | 'tiktok' | 'stripe';

export interface MonaraToken {
  brandId: string;
  provider: VaultProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Timestamp;
  scopes: string[];
  metadata: MetaTokenMetadata | GoogleTokenMetadata | Record<string, any>;
  updatedAt: Timestamp;
}

export class MonaraTokenVault {
  private static getCollectionPath(brandId: string) {
    return `brands/${brandId}/secrets`;
  }

  /**
   * Salva um token no Vault com criptografia.
   */
  static async saveToken(brandId: string, tokenData: Omit<MonaraToken, 'updatedAt'>): Promise<void> {
    const secretRef = doc(db, this.getCollectionPath(brandId), `token_${tokenData.provider}`);
    
    // Criptografar tokens sensíveis (omitir campos undefined — Firestore rejeita)
    const encryptedToken: Record<string, any> = {
      ...tokenData,
      accessToken: encrypt(tokenData.accessToken),
      updatedAt: Timestamp.now(),
    };

    if (tokenData.refreshToken) {
      encryptedToken.refreshToken = encrypt(tokenData.refreshToken);
    }

    await setDoc(secretRef, encryptedToken);
  }

  /**
   * Recupera um token do Vault e o descriptografa.
   */
  static async getToken(brandId: string, provider: VaultProvider): Promise<MonaraToken | null> {
    const secretRef = doc(db, this.getCollectionPath(brandId), `token_${provider}`);
    const snap = await getDoc(secretRef);

    if (!snap.exists()) return null;

    const data = snap.data() as MonaraToken;

    return {
      ...data,
      accessToken: decrypt(data.accessToken),
      refreshToken: data.refreshToken ? decrypt(data.refreshToken) : undefined
    };
  }

  /**
   * Verifica se um token está expirado ou prestes a expirar.
   * S30-FN-03 (DT-01): Buffer per-provider — Meta=24h, Google=15min.
   * Backward-compatible: sem provider, usa token.provider ou fallback Meta.
   */
  static isTokenExpiring(token: MonaraToken, provider?: 'meta' | 'google'): boolean {
    const buffers: Record<string, number> = {
      meta: 24 * 60 * 60 * 1000,    // 24h (tokens Meta duram 60 dias)
      google: 15 * 60 * 1000,        // 15min (tokens Google duram 1h)
    };
    const resolvedProvider = provider || token.provider;
    const buffer = buffers[resolvedProvider] || buffers.meta;
    const now = Date.now();
    return token.expiresAt.toMillis() - now < buffer;
  }

  /**
   * Busca um token válido, com refresh automático se necessário.
   * S30-FN-03: Delega refresh para token-refresh.ts (criado em FN-01).
   */
  static async getValidToken(brandId: string, provider: 'meta' | 'google'): Promise<MonaraToken> {
    const token = await MonaraTokenVault.getToken(brandId, provider);
    if (!token) throw new Error(`Token not found for brand ${brandId}, provider ${provider}`);
    if (MonaraTokenVault.isTokenExpiring(token, provider)) {
      return MonaraTokenVault.refreshAndSave(brandId, provider);
    }
    return token;
  }

  /**
   * Refresh de token delegado para o módulo token-refresh.ts.
   * S30-FN-03: Stub que será implementado pela infra de FN-01.
   */
  static async refreshAndSave(brandId: string, provider: 'meta' | 'google'): Promise<MonaraToken> {
    const { ensureFreshToken } = await import('@/lib/integrations/ads/token-refresh');
    return ensureFreshToken(brandId, provider);
  }
}

// ============================================
// COPY DNA (brands/{brandId}/vault/dna)
// ============================================

/**
 * Cria ou atualiza um template de Copy DNA.
 * Sincroniza automaticamente com o Pinecone para busca semântica.
 */
export async function saveCopyDNA(brandId: string, dna: Omit<CopyDNA, 'brandId' | 'updatedAt'>): Promise<string> {
  const now = Timestamp.now();
  const dnaId = dna.id || doc(collection(db, 'brands', brandId, 'vault', 'dna')).id;
  const dnaRef = doc(db, 'brands', brandId, 'vault', 'dna', dnaId);

  const dnaData = {
    ...dna,
    id: dnaId,
    brandId,
    updatedAt: now,
  };

  // 1. Salvar no Firestore
  await setDoc(dnaRef, dnaData, { merge: true });

  // 2. Sincronizar com Pinecone (Async)
  // Geramos embedding do conteúdo para busca semântica
  try {
    const embedding = await generateEmbedding(dna.content);
    await upsertVaultVector(brandId, dnaId, embedding, {
      brandId,
      type: 'dna',
      category: dna.type,
      tags: dna.tags,
      text: dna.content,
      name: dna.name
    });
  } catch (error) {
    console.error(`[Vault] Erro ao sincronizar DNA ${dnaId} com Pinecone:`, error);
  }

  return dnaId;
}

/**
 * Exclui um Copy DNA do Firestore e (idealmente) do Pinecone.
 */
export async function deleteCopyDNA(brandId: string, dnaId: string) {
  const dnaRef = doc(db, 'brands', brandId, 'vault', 'dna', dnaId);
  await deleteDoc(dnaRef);
  // Nota: A exclusão no Pinecone pode ser implementada via index.delete1({ ids: [...] }) se necessário
}

/**
 * Busca todos os Copy DNAs de uma marca.
 */
export async function getBrandDNA(brandId: string): Promise<CopyDNA[]> {
  const dnaRef = collection(db, 'brands', brandId, 'vault', 'dna');
  const q = query(dnaRef, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CopyDNA));
}

/**
 * X-2.2: Update DNA performance metrics after a post using this DNA is published.
 */
export async function updateDNAPerformance(
  brandId: string,
  dnaId: string,
  metrics: {
    conversion_rate?: number;
    engagement_rate?: number;
    best_platform?: string;
  }
): Promise<void> {
  const dnaRef = doc(db, 'brands', brandId, 'vault', 'dna', dnaId);
  const snap = await getDoc(dnaRef);
  if (!snap.exists()) return;

  const current = snap.data()?.performance_metrics || {};
  const postsUsing = (current.posts_using || 0) + 1;

  await updateDoc(dnaRef, {
    'performance_metrics.posts_using': postsUsing,
    ...(metrics.conversion_rate !== undefined && { 'performance_metrics.conversion_rate': metrics.conversion_rate }),
    ...(metrics.engagement_rate !== undefined && { 'performance_metrics.engagement_rate': metrics.engagement_rate }),
    ...(metrics.best_platform !== undefined && { 'performance_metrics.best_platform': metrics.best_platform }),
    updatedAt: Timestamp.now(),
  });
}

// ============================================
// ASSETS (brands/{brandId}/vault/assets)
// ============================================

/**
 * Registra um novo asset de mídia no Vault.
 */
export async function createVaultAsset(brandId: string, asset: Omit<VaultAsset, 'id' | 'brandId' | 'createdAt'>): Promise<string> {
  const now = Timestamp.now();
  const assetsRef = collection(db, 'brands', brandId, 'vault', 'assets');
  
  const docRef = await addDoc(assetsRef, {
    ...asset,
    brandId,
    createdAt: now,
  });
  
  return docRef.id;
}

/**
 * Busca assets do Vault por marca.
 */
export async function getVaultAssets(brandId: string): Promise<VaultAsset[]> {
  const assetsRef = collection(db, 'brands', brandId, 'vault', 'assets');
  const q = query(assetsRef, orderBy('updatedAt', 'desc'));
  const snap = await getDocs(q);
  
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VaultAsset));
}

// ============================================
// LIBRARY (brands/{brandId}/vault/library)
// ============================================

/**
 * Salva um conteúdo gerado na biblioteca do Vault.
 */
export async function saveVaultContent(brandId: string, content: Omit<VaultContent, 'brandId' | 'createdAt'>): Promise<string> {
  const now = Timestamp.now();
  const contentId = content.id || doc(collection(db, 'brands', brandId, 'vault', 'library')).id;
  const contentRef = doc(db, 'brands', brandId, 'vault', 'library', contentId);

  const contentData = {
    ...content,
    id: contentId,
    brandId,
    createdAt: now,
  };

  await setDoc(contentRef, contentData, { merge: true });
  return contentId;
}

/**
 * Busca conteúdos da biblioteca por status.
 */
export async function queryVaultLibrary(brandId: string, status?: VaultContent['status']): Promise<VaultContent[]> {
  const libraryRef = collection(db, 'brands', brandId, 'vault', 'library');
  let q = query(libraryRef, orderBy('createdAt', 'desc'));

  if (status) {
    q = query(q, where('status', '==', status));
  }

  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as VaultContent));
}

// ============================================
// PUBLISHER JOBS (brands/{brandId}/publisher/jobs)
// ============================================

/**
 * Cria um novo job de publicação.
 */
export async function createPublisherJob(brandId: string, job: Omit<PublisherJob, 'id' | 'brandId' | 'startedAt'>): Promise<string> {
  const now = Timestamp.now();
  const jobsRef = collection(db, 'brands', brandId, 'publisher', 'jobs');
  
  const docRef = await addDoc(jobsRef, {
    ...job,
    brandId,
    startedAt: now,
  });
  
  return docRef.id;
}

/**
 * Atualiza o status de um job de publicação.
 */
export async function updatePublisherJob(brandId: string, jobId: string, data: Partial<PublisherJob>) {
  const jobRef = doc(db, 'brands', brandId, 'publisher', 'jobs', jobId);
  const updateData: Record<string, any> = { ...data };
  if (data.status === 'completed' || data.status === 'failed') {
    updateData.completedAt = Timestamp.now();
  }
  // Remove campos undefined (Firestore rejeita)
  Object.keys(updateData).forEach(k => updateData[k] === undefined && delete updateData[k]);
  await withResilience(async () => {
    await updateDoc(jobRef, updateData);
  });
}
