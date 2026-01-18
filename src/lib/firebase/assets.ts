import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { deleteBrandAssetFromStorage } from './storage';
import { logAudit } from '../ai/brand-governance';
import type { BrandAsset } from '../../types/database';

// ============================================
// BRAND ASSETS - Gerenciamento de Arquivos
// ============================================

export interface BrandAssetWithId extends BrandAsset {
  id: string;
}

/**
 * Busca um asset específico pelo ID. (Alias para compatibilidade com o worker)
 */
export async function fetchBrandAsset(assetId: string): Promise<BrandAssetWithId | null> {
  return getAsset(assetId) as Promise<BrandAssetWithId | null>;
}

/**
 * Cria um novo registro de asset no Firestore.
 */
export async function createAsset(data: Omit<BrandAsset, 'id'>): Promise<string> {
  const assetRef = await addDoc(collection(db, 'brand_assets'), {
    ...data,
    isApprovedForAI: data.isApprovedForAI ?? false,
  });
  return assetRef.id;
}

/**
 * Busca todos os assets de uma marca específica.
 */
export async function getBrandAssets(brandId: string): Promise<BrandAsset[]> {
  const q = query(
    collection(db, 'brand_assets'),
    where('brandId', '==', brandId),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrandAsset));
}

/**
 * Busca um asset específico pelo ID.
 */
export async function getAsset(assetId: string): Promise<BrandAsset | null> {
  const assetRef = doc(db, 'brand_assets', assetId);
  const assetSnap = await getDoc(assetRef);
  
  if (!assetSnap.exists()) return null;
  
  return { id: assetSnap.id, ...assetSnap.data() } as BrandAsset;
}

/**
 * Atualiza o status de um asset.
 */
export async function updateAssetStatus(
  assetId: string,
  status: BrandAsset['status'],
  error?: string
): Promise<void> {
  const assetRef = doc(db, 'brand_assets', assetId);
  const updates: Partial<BrandAsset> = { status };
  
  if (status === 'ready') {
    updates.processedAt = Timestamp.now();
  }
  
  if (error) {
    updates.processingError = error;
  }
  
  await updateDoc(assetRef, updates);
}

/**
 * Atualiza dados de um asset existente.
 */
export async function updateAsset(
  assetId: string,
  data: Partial<Omit<BrandAsset, 'id' | 'brandId' | 'userId' | 'createdAt'>>
): Promise<void> {
  const assetRef = doc(db, 'brand_assets', assetId);
  await updateDoc(assetRef, data);
}

/**
 * Alias para compatibilidade com o worker.
 */
export async function updateBrandAsset(
  assetId: string,
  data: Partial<BrandAsset> & { status?: BrandAsset['status']; chunkCount?: number; processedAt?: Timestamp; processingError?: string | null }
) {
  const ref = doc(db, 'brand_assets', assetId);
  await updateDoc(ref, data as Record<string, unknown>);
}

/**
 * Alterna o status de aprovação de um asset para a IA.
 */
export async function toggleAssetApproval(
  assetId: string,
  isApproved: boolean,
  userId: string
): Promise<void> {
  const assetRef = doc(db, 'brand_assets', assetId);
  const assetSnap = await getDoc(assetRef);
  
  if (!assetSnap.exists()) {
    throw new Error('Asset não encontrado');
  }

  const assetData = assetSnap.data() as BrandAsset;

  await updateDoc(assetRef, { isApprovedForAI: isApproved });

  await logAudit(
    assetData.brandId, 
    isApproved ? 'APPROVE_ASSET_AI' : 'REVOKE_ASSET_AI', 
    { assetId, assetName: assetData.name }, 
    userId
  );

  const chunksCollectionRef = collection(db, 'brand_assets', assetId, 'chunks');
  const chunksSnap = await getDocs(chunksCollectionRef);
  
  if (!chunksSnap.empty) {
    const batch = writeBatch(db);
    chunksSnap.docs.forEach((chunkDoc) => {
      batch.update(chunkDoc.ref, {
        'metadata.isApprovedForAI': isApproved
      });
    });
    await batch.commit();
  }
}

/**
 * Deleta um asset permanentemente (Firestore + Storage).
 */
export async function deleteAsset(assetId: string, storageUrl: string): Promise<void> {
  try {
    await deleteBrandAssetFromStorage(storageUrl);
  } catch (error) {
    console.error('Erro ao deletar do Storage:', error);
  }
  
  const assetRef = doc(db, 'brand_assets', assetId);
  await deleteDoc(assetRef);
}

/**
 * Busca assets por tipo específico.
 */
export async function getAssetsByType(
  brandId: string,
  type: BrandAsset['type']
): Promise<BrandAsset[]> {
  const q = query(
    collection(db, 'brand_assets'),
    where('brandId', '==', brandId),
    where('type', '==', type),
    orderBy('createdAt', 'desc')
  );
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BrandAsset));
}

// O processamento de chunks foi movido para assets-server.ts para evitar erros de build no cliente.

