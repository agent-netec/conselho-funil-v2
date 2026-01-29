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
 * @fileoverview Monara Token Vault (ST-20.2)
 * Gerencia o armazenamento seguro de tokens de API (Meta, Google, etc)
 * com criptografia AES-256 e isolamento por brandId.
 */

export interface MonaraToken {
  brandId: string;
  provider: 'meta' | 'google' | 'instagram' | 'stripe';
  accessToken: string;
  refreshToken?: string;
  expiresAt: Timestamp;
  scopes: string[];
  metadata: Record<string, any>;
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
    
    // Criptografar tokens sensíveis
    const encryptedToken: MonaraToken = {
      ...tokenData,
      accessToken: encrypt(tokenData.accessToken),
      refreshToken: tokenData.refreshToken ? encrypt(tokenData.refreshToken) : undefined,
      updatedAt: Timestamp.now()
    };

    await setDoc(secretRef, encryptedToken);
  }

  /**
   * Recupera um token do Vault e o descriptografa.
   */
  static async getToken(brandId: string, provider: MonaraToken['provider']): Promise<MonaraToken | null> {
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
   * Verifica se um token está expirado ou prestes a expirar (buffer de 24h).
   */
  static isTokenExpiring(token: MonaraToken): boolean {
    const buffer = 24 * 60 * 60 * 1000; // 24 horas
    const now = Date.now();
    return token.expiresAt.toMillis() - now < buffer;
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
    createdAt: content.createdAt || now,
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
  await withResilience(async () => {
    await updateDoc(jobRef, {
      ...data,
      completedAt: data.status === 'completed' || data.status === 'failed' ? Timestamp.now() : undefined,
    });
  });
}
