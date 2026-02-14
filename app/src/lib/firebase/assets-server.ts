import {
  collection,
  doc,
  getDocs,
  updateDoc,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './config';
import { createChunks } from '../ai/chunking';
import { generateEmbeddingsBatch } from '../ai/embeddings';
import { getAsset, updateAssetStatus } from './assets';
import type { AssetChunk } from '../../types/database';

/**
 * Processa um texto bruto (chunking + embeddings + pinecone).
 * Útil para URLs ou entradas diretas de texto que não passam pelo Storage.
 * EXCLUSIVO PARA SERVIDOR.
 */
export async function processAssetText(assetId: string, text: string, namespace?: string): Promise<void> {
  // Verificação redundante de segurança
  if (typeof window !== 'undefined') {
    throw new Error('processAssetText deve ser executado apenas no servidor.');
  }

  try {
    const { upsertToPinecone } = await import('../ai/pinecone');

    const asset = await getAsset(assetId);
    if (!asset) throw new Error('Asset não encontrado');

    // Se namespace não fornecido, usa o padrão por marca (ST-11.23)
    const targetNamespace = namespace || `brand_${asset.brandId}`;

    await updateAssetStatus(assetId, 'processing');

    const chunksText = createChunks(text, 1500, 200);
    if (!chunksText.length) throw new Error('Nenhum chunk gerado');

    const embeddings = await generateEmbeddingsBatch(chunksText);
    const now = Timestamp.now();

    const chunkPayloads: AssetChunk[] = chunksText.map((content, index) => ({
      id: `${assetId}-chunk-${index + 1}`,
      brandId: asset.brandId,
      assetId,
      userId: asset.userId,
      content,
      embedding: embeddings[index],
      order: index,
      createdAt: now,
      metadata: {
        sourceType: asset.metadata?.sourceType ?? 'text',
        sourceUrl: asset.metadata?.sourceUrl ?? '',
        originalName: asset.metadata?.originalName ?? asset.name,
        isApprovedForAI: asset.metadata?.isApprovedForAI ?? asset.isApprovedForAI ?? false,
        extractedAt: now.toDate().toISOString(),
        processingMethod: 'text-direct',
      },
    }));

    // Firestore
    await saveAssetChunks(assetId, chunkPayloads);

    // Pinecone
    const pineconeRecords = chunkPayloads.map(chunk => ({
      id: chunk.id,
      values: chunk.embedding ?? [],
      metadata: {
        brandId: chunk.brandId,
        assetId: chunk.assetId,
        originalName: chunk.metadata?.originalName || '',
        sourceType: chunk.metadata?.sourceType || 'text',
        sourceUrl: chunk.metadata?.sourceUrl || '',
        processingMethod: 'text-direct',
        content: chunk.content,
      },
    }));

    await upsertToPinecone(pineconeRecords, { namespace: targetNamespace });

    await updateAssetStatus(assetId, 'ready');
    await updateDoc(doc(db, 'brand_assets', assetId), {
      chunkCount: chunkPayloads.length,
      processedAt: now,
      extractedText: text // Salva o texto extraído no asset para preview
    });

  } catch (error: any) {
    console.error(`[processAssetText] Erro no asset ${assetId}:`, error);
    await updateAssetStatus(assetId, 'error', error.message);
    throw error;
  }
}

/**
 * Persiste chunks em subcoleção brand_assets/{assetId}/chunks.
 * EXCLUSIVO PARA SERVIDOR.
 */
export async function saveAssetChunks(assetId: string, chunks: AssetChunk[]) {
  if (!chunks.length) return;

  const chunksCol = collection(db, 'brand_assets', assetId, 'chunks');

  // 1. Limpar chunks antigos (Idempotência)
  const existingChunks = await getDocs(chunksCol);
  if (!existingChunks.empty) {
    // Deletar em lotes pequenos para evitar "Transaction too big"
    const DELETE_BATCH_SIZE = 100;
    const docs = existingChunks.docs;
    for (let i = 0; i < docs.length; i += DELETE_BATCH_SIZE) {
      const deleteBatch = writeBatch(db);
      docs.slice(i, i + DELETE_BATCH_SIZE).forEach((doc) => deleteBatch.delete(doc.ref));
      await deleteBatch.commit();
    }
  }

  // 2. Salvar novos chunks em lotes pequenos
  // Chunks com vetores de 768 dimensões são pesados (~6-10KB por doc).
  // Reduzimos o lote para evitar o erro "Transaction too big" do Firestore.
  const BATCH_SIZE = 50; 
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const slice = chunks.slice(i, i + BATCH_SIZE);

    slice.forEach((chunk) => {
      const ref = doc(chunksCol, chunk.id);
      batch.set(ref, chunk);
    });

    await batch.commit();
    console.log(`[saveAssetChunks] Lote de ${slice.length} chunks salvo (${i + slice.length}/${chunks.length})`);
  }
}
