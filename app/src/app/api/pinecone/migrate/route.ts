export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { migrateChunksToPinecone } from '@/lib/ai/pinecone-migration';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { verifyAdminRole, handleSecurityError, ApiError } from '@/lib/utils/api-security';

export const runtime = 'nodejs';

/**
 * Busca chunks da coleção brand_assets (subcoleções chunks)
 */
async function fetchApprovedBrandChunks(): Promise<any[]> {
  const adminDb = getAdminFirestore();
  const assetsSnap = await adminDb
    .collection('brand_assets')
    .where('status', '==', 'ready')
    .where('isApprovedForAI', '==', true)
    .get();

  const allChunks: any[] = [];

  for (const assetDoc of assetsSnap.docs) {
    const assetData = assetDoc.data();
    const chunksSnap = await adminDb
      .collection('brand_assets')
      .doc(assetDoc.id)
      .collection('chunks')
      .get();

    chunksSnap.docs.forEach((chunkDoc) => {
      const chunkData = chunkDoc.data();
      allChunks.push({
        ...chunkData,
        id: chunkDoc.id,
        assetId: assetDoc.id,
        brandId: assetData.brandId,
      });
    });
  }

  return allChunks;
}

/**
 * Busca chunks da coleção universal knowledge
 */
async function fetchApprovedKnowledgeChunks(): Promise<any[]> {
  const adminDb = getAdminFirestore();
  const knowledgeSnap = await adminDb
    .collection('knowledge')
    .where('metadata.isApprovedForAI', '==', true)
    .get();

  return knowledgeSnap.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));
}

export async function POST(request: NextRequest) {
  try {
    // Auth: require admin role for data migration
    await verifyAdminRole(request);

    const {
      namespace,
      collections = ['brand_assets']
    } = (await request.json().catch(() => ({}))) as {
      namespace?: string,
      collections?: ('brand_assets' | 'knowledge')[]
    };

    let allChunksToMigrate: any[] = [];
    const sourceStats: Record<string, number> = {};

    if (collections.includes('brand_assets')) {
      const brandChunks = await fetchApprovedBrandChunks();
      allChunksToMigrate = [...allChunksToMigrate, ...brandChunks];
      sourceStats.brand_assets = brandChunks.length;
    }

    if (collections.includes('knowledge')) {
      const knowledgeChunks = await fetchApprovedKnowledgeChunks();
      allChunksToMigrate = [...allChunksToMigrate, ...knowledgeChunks];
      sourceStats.knowledge = knowledgeChunks.length;
    }

    if (allChunksToMigrate.length === 0) {
      return createApiSuccess({ 
        message: 'Nenhum chunk aprovado para migrar.', 
        sourceStats,
        report: { attempted: 0, upserted: 0, skipped: 0, errors: [] } 
      });
    }

    const report = await migrateChunksToPinecone(allChunksToMigrate, { namespace });

    return createApiSuccess({
      namespace: namespace || 'default',
      sourceStats,
      ...report,
    });
  } catch (error) {
    // Auth errors: return proper status code (401/403)
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    const message = error instanceof Error ? error.message : 'Erro desconhecido na migração para Pinecone.';
    console.error('[Pinecone] Migração falhou', error);
    return createApiError(500, message);
  }
}
