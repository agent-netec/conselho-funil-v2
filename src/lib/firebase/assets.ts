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
import { extractTextFromPDF, isPDF } from '@/lib/ai/pdf-processor';
import { createChunks } from '@/lib/ai/chunking';
import { generateEmbeddingsBatch } from '@/lib/ai/embeddings';
import type { BrandAsset, AssetChunk } from '@/types/database';

// ============================================
// BRAND ASSETS - Gerenciamento de Arquivos
// ============================================

/**
 * Cria um novo registro de asset no Firestore.
 * 
 * @param data - Dados do asset (sem o campo `id`).
 * @returns O ID do asset criado.
 * 
 * @example
 * ```ts
 * const assetId = await createAsset({
 *   brandId: 'brand_123',
 *   userId: 'user_456',
 *   name: 'Brand Guidelines',
 *   originalName: 'guidelines.pdf',
 *   type: 'guideline',
 *   mimeType: 'application/pdf',
 *   size: 1024000,
 *   url: 'https://...',
 *   status: 'uploaded',
 *   createdAt: Timestamp.now(),
 * });
 * ```
 */
export async function createAsset(data: Omit<BrandAsset, 'id'>): Promise<string> {
  const assetRef = await addDoc(collection(db, 'brand_assets'), data);
  return assetRef.id;
}

/**
 * Busca todos os assets de uma marca específica.
 * 
 * @param brandId - O ID da marca.
 * @returns Array de assets ordenados por data de criação (mais recente primeiro).
 * 
 * @example
 * ```ts
 * const assets = await getBrandAssets('brand_123');
 * console.log(`Marca tem ${assets.length} assets`);
 * ```
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
 * 
 * @param assetId - O ID do asset.
 * @returns O objeto BrandAsset ou null se não encontrado.
 * 
 * @example
 * ```ts
 * const asset = await getAsset('asset_xyz');
 * if (asset) {
 *   console.log('Asset name:', asset.name);
 * }
 * ```
 */
export async function getAsset(assetId: string): Promise<BrandAsset | null> {
  const assetRef = doc(db, 'brand_assets', assetId);
  const assetSnap = await getDoc(assetRef);
  
  if (!assetSnap.exists()) return null;
  
  return { id: assetSnap.id, ...assetSnap.data() } as BrandAsset;
}

/**
 * Atualiza o status de um asset.
 * 
 * @param assetId - O ID do asset.
 * @param status - Novo status do asset.
 * @param error - Mensagem de erro opcional (se status = 'error').
 * 
 * @example
 * ```ts
 * await updateAssetStatus('asset_xyz', 'processing');
 * // ... processamento ocorre ...
 * await updateAssetStatus('asset_xyz', 'ready');
 * ```
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
 * 
 * @param assetId - O ID do asset.
 * @param data - Objeto parcial com os dados a serem atualizados.
 * 
 * @example
 * ```ts
 * await updateAsset('asset_xyz', {
 *   name: 'New Name',
 *   description: 'Updated description',
 *   tags: ['brand', 'guideline'],
 * });
 * ```
 */
export async function updateAsset(
  assetId: string,
  data: Partial<Omit<BrandAsset, 'id' | 'brandId' | 'userId' | 'createdAt'>>
): Promise<void> {
  const assetRef = doc(db, 'brand_assets', assetId);
  await updateDoc(assetRef, data);
}

/**
 * Deleta um asset permanentemente (Firestore + Storage).
 * 
 * ⚠️ ATENÇÃO: Esta operação remove o arquivo do Storage e os metadados do Firestore.
 * Não é possível desfazer.
 * 
 * @param assetId - O ID do asset.
 * @param storageUrl - URL do arquivo no Firebase Storage.
 * 
 * @example
 * ```ts
 * const asset = await getAsset('asset_xyz');
 * if (asset) {
 *   await deleteAsset(asset.id, asset.url);
 * }
 * ```
 */
export async function deleteAsset(assetId: string, storageUrl: string): Promise<void> {
  // Remove do Storage
  try {
    await deleteBrandAssetFromStorage(storageUrl);
  } catch (error) {
    console.error('Erro ao deletar do Storage:', error);
    // Continua para deletar do Firestore mesmo se Storage falhar
  }
  
  // Remove do Firestore
  const assetRef = doc(db, 'brand_assets', assetId);
  await deleteDoc(assetRef);
}

/**
 * Busca assets por tipo específico.
 * 
 * @param brandId - O ID da marca.
 * @param type - O tipo de asset a buscar.
 * @returns Array de assets do tipo especificado.
 * 
 * @example
 * ```ts
 * const guidelines = await getAssetsByType('brand_123', 'guideline');
 * ```
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

// ============================================
// PROCESSAMENTO DE ASSETS
// ============================================

/**
 * Processa um asset para extrair seu conteúdo (texto de PDF) e gerar chunks para RAG.
 * 
 * Fluxo:
 * 1. Busca o asset no Firestore
 * 2. Valida se é um PDF
 * 3. Atualiza status para 'processing'
 * 4. Extrai texto usando pdf-processor
 * 5. Divide o texto em chunks (pedaços menores)
 * 6. Salva chunks em sub-coleção no Firestore
 * 7. Atualiza status para 'ready' ou 'error'
 * 
 * @param assetId - O ID do asset a ser processado.
 */
export async function processAsset(assetId: string): Promise<void> {
  try {
    // 1. Buscar asset
    const asset = await getAsset(assetId);
    if (!asset) {
      throw new Error('Asset não encontrado');
    }

    // 2. Validar se é PDF
    if (!isPDF(asset.mimeType)) {
      console.log(`Asset ${assetId} não é PDF. Pulando processamento.`);
      return;
    }

    // 3. Atualizar status para 'processing'
    await updateAssetStatus(assetId, 'processing');

    // 4. Extrair texto do PDF
    const extractedText = await extractTextFromPDF(asset.url);

    // 5. Gerar Chunks (US-13.3)
    const textChunks = createChunks(extractedText, 1500, 200);

    // 6. Gerar Embeddings (US-15.1)
    console.log(`Gerando embeddings para ${textChunks.length} chunks...`);
    const embeddings = await generateEmbeddingsBatch(textChunks);

    const chunksWithEmbeddings = textChunks.map((content, index) => ({
      content,
      embedding: embeddings[index],
    }));

    // 7. Salvar Chunks no Firestore
    await saveAssetChunks(asset, chunksWithEmbeddings);

    // 8. Salvar texto extraído e finalizar
    const assetRef = doc(db, 'brand_assets', assetId);
    await updateDoc(assetRef, {
      extractedText,
      chunkCount: textChunks.length,
      status: 'ready',
      processedAt: Timestamp.now(),
    });

    console.log(`Asset ${assetId} processado: ${extractedText.length} chars, ${textChunks.length} chunks.`);
  } catch (error) {
    console.error(`Erro ao processar asset ${assetId}:`, error);
    
    // Atualizar status para 'error'
    await updateAssetStatus(
      assetId,
      'error',
      error instanceof Error ? error.message : 'Erro desconhecido no processamento'
    );
    
    throw error;
  }
}

/**
 * Salva os chunks de texto e seus respectivos embeddings em uma sub-coleção do asset.
 * Implementa idempotência limpando chunks antigos antes de salvar.
 * 
 * @param asset - O asset proprietário dos chunks.
 * @param chunks - Array de objetos contendo o conteúdo e opcionalmente o embedding de cada chunk.
 */
export async function saveAssetChunks(
  asset: BrandAsset, 
  chunks: { content: string; embedding?: number[] }[]
): Promise<void> {
  const assetId = asset.id;
  const chunksCollectionRef = collection(db, 'brand_assets', assetId, 'chunks');

  // 1. Limpar chunks antigos (Idempotência)
  const existingChunks = await getDocs(chunksCollectionRef);
  if (!existingChunks.empty) {
    const deleteBatch = writeBatch(db);
    existingChunks.docs.forEach((doc) => deleteBatch.delete(doc.ref));
    await deleteBatch.commit();
  }

  // 2. Salvar novos chunks em batches (limite do Firestore é 500 operações por batch)
  const BATCH_SIZE = 400;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const currentBatch = chunks.slice(i, i + BATCH_SIZE);

    currentBatch.forEach((chunk, index) => {
      const chunkRef = doc(chunksCollectionRef);
      const chunkData: Omit<AssetChunk, 'id'> = {
        brandId: asset.brandId,
        assetId: asset.id,
        userId: asset.userId,
        content: chunk.content,
        embedding: chunk.embedding,
        order: i + index,
        createdAt: Timestamp.now(),
      };
      batch.set(chunkRef, chunkData);
    });

    await batch.commit();
  }
}



