/**
 * assets-server.ts — Server-only asset operations using Firebase Admin SDK.
 * Uses Admin SDK to bypass Firestore security rules (service account auth).
 * NEVER import this file from client components.
 */
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from './admin';
import { createChunks } from '../ai/chunking';
import { generateEmbeddingsBatch } from '../ai/embeddings';
import type { AssetChunk, BrandAsset } from '../../types/database';

// ---------------------------------------------------------------------------
// Internal Admin helpers (replicate client-SDK functions without client SDK)
// ---------------------------------------------------------------------------

async function adminGetAsset(assetId: string): Promise<BrandAsset | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('brand_assets').doc(assetId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() } as BrandAsset;
}

async function adminUpdateAssetStatus(
  assetId: string,
  status: BrandAsset['status'],
  error?: string
): Promise<void> {
  const db = getAdminFirestore();
  const updates: Record<string, unknown> = { status };
  if (status === 'ready') updates.processedAt = FieldValue.serverTimestamp();
  if (error) updates.processingError = error;
  await db.collection('brand_assets').doc(assetId).update(updates);
}

// ---------------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------------

/**
 * Processa um texto bruto (chunking + embeddings + pinecone + Firestore backup).
 * EXCLUSIVO PARA SERVIDOR.
 */
export async function processAssetText(
  assetId: string,
  text: string,
  namespace?: string
): Promise<void> {
  if (typeof window !== 'undefined') {
    throw new Error('processAssetText deve ser executado apenas no servidor.');
  }

  try {
    const { upsertToPinecone } = await import('../ai/pinecone');

    const asset = await adminGetAsset(assetId);
    if (!asset) throw new Error('Asset não encontrado');

    const targetNamespace = namespace || `brand_${asset.brandId}`;

    await adminUpdateAssetStatus(assetId, 'processing');

    const chunksText = createChunks(text, 1500, 200);
    if (!chunksText.length) throw new Error('Nenhum chunk gerado');

    const embeddings = await generateEmbeddingsBatch(chunksText);
    const now = new Date().toISOString();

    const chunkPayloads: AssetChunk[] = chunksText.map((content, index) => ({
      id: `${assetId}-chunk-${index + 1}`,
      brandId: asset.brandId,
      assetId,
      userId: asset.userId,
      content,
      embedding: embeddings[index],
      order: index,
      createdAt: FieldValue.serverTimestamp() as any,
      metadata: {
        sourceType: asset.metadata?.sourceType ?? 'text',
        sourceUrl: asset.metadata?.sourceUrl ?? '',
        originalName: asset.metadata?.originalName ?? asset.name,
        isApprovedForAI: asset.metadata?.isApprovedForAI ?? asset.isApprovedForAI ?? false,
        extractedAt: now,
        processingMethod: 'text-direct',
      },
    }));

    // Pinecone — crítico para RAG
    const pineconeRecords = chunkPayloads.map((chunk) => ({
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

    // Firestore backup — via Admin SDK (não precisa de auth do usuário)
    await saveAssetChunks(assetId, chunkPayloads);

    await adminUpdateAssetStatus(assetId, 'ready');
    await getAdminFirestore()
      .collection('brand_assets')
      .doc(assetId)
      .update({
        chunkCount: chunkPayloads.length,
        processedAt: FieldValue.serverTimestamp(),
        extractedText: text,
      });
  } catch (error: any) {
    console.error(`[processAssetText] Erro no asset ${assetId}:`, error);
    await adminUpdateAssetStatus(assetId, 'error', error.message).catch(() => {});
    throw error;
  }
}

/**
 * Persiste chunks em subcoleção brand_assets/{assetId}/chunks via Admin SDK.
 * EXCLUSIVO PARA SERVIDOR.
 */
export async function saveAssetChunks(assetId: string, chunks: AssetChunk[]) {
  if (!chunks.length) return;

  const db = getAdminFirestore();
  const chunksCol = db.collection('brand_assets').doc(assetId).collection('chunks');

  // 1. Limpar chunks antigos (Idempotência)
  const existingSnap = await chunksCol.get();
  if (!existingSnap.empty) {
    const DELETE_BATCH_SIZE = 100;
    const docs = existingSnap.docs;
    for (let i = 0; i < docs.length; i += DELETE_BATCH_SIZE) {
      const deleteBatch = db.batch();
      docs.slice(i, i + DELETE_BATCH_SIZE).forEach((d) => deleteBatch.delete(d.ref));
      await deleteBatch.commit();
    }
  }

  // 2. Salvar novos chunks em lotes
  const BATCH_SIZE = 50;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const slice = chunks.slice(i, i + BATCH_SIZE);
    slice.forEach((chunk) => {
      const ref = chunksCol.doc(chunk.id);
      batch.set(ref, chunk);
    });
    await batch.commit();
    console.log(`[saveAssetChunks] Lote de ${slice.length} chunks salvo (${i + slice.length}/${chunks.length})`);
  }
}
