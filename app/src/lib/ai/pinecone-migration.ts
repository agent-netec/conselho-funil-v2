import type { AssetChunk } from '@/types/database';
import { buildPineconeRecord, getPineconeIndex } from './pinecone';

export interface MigrationReport {
  attempted: number;
  upserted: number;
  skipped: number;
  errors: Array<{ id: string; reason: string }>;
}

/**
 * Migração básica de chunks do Firestore para o Pinecone.
 * - Espera embeddings já calculados (768 dims, text-embedding-004).
 * - Filtra assets não aprovados para IA.
 */
export async function migrateChunksToPinecone(
  chunks: any[],
  options: { namespace?: string } = {}
): Promise<MigrationReport> {
  const { namespace } = options;
  const index = await getPineconeIndex();
  if (!index) {
    return { attempted: chunks.length, upserted: 0, skipped: chunks.length, errors: [{ id: '*', reason: 'Pinecone index not available' }] };
  }

  const errors: Array<{ id: string; reason: string }> = [];
  const vectors = [];

  for (const chunk of chunks) {
    if (!chunk.embedding || chunk.embedding.length === 0) {
      errors.push({ id: chunk.id, reason: 'Embedding ausente' });
      continue;
    }

    // Gate de governança - aceita se isApprovedForAI for true ou se não existir (defaulting to safe check)
    const metadata = chunk.metadata || {};
    if (metadata.isApprovedForAI !== true) {
      errors.push({ id: chunk.id, reason: 'isApprovedForAI !== true' });
      continue;
    }

    // Prepara metadados para o Pinecone (aplana se necessário ou passa direto)
    const pineconeMetadata: Record<string, any> = {
      ...metadata,
      content: chunk.content?.substring(0, 1000), // Opcional: guardar snippet no metadado para debug
    };

    // Adiciona IDs se existirem (para AssetChunks)
    if (chunk.brandId) pineconeMetadata.brandId = chunk.brandId;
    if (chunk.assetId) pineconeMetadata.assetId = chunk.assetId;
    if (chunk.userId) pineconeMetadata.userId = chunk.userId;

    vectors.push(
      buildPineconeRecord(chunk.id, chunk.embedding, pineconeMetadata)
    );
  }

  if (vectors.length === 0) {
    return { attempted: chunks.length, upserted: 0, skipped: chunks.length, errors };
  }

  const target = namespace ? index.namespace(namespace) : index;
  await target.upsert(vectors);

  return {
    attempted: chunks.length,
    upserted: vectors.length,
    skipped: chunks.length - vectors.length,
    errors,
  };
}
