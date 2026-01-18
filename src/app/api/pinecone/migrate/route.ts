import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { migrateChunksToPinecone } from '@/lib/ai/pinecone-migration';

export const runtime = 'nodejs';

/**
 * Busca chunks da coleção brand_assets (subcoleções chunks)
 */
async function fetchApprovedBrandChunks(): Promise<any[]> {
  const assetsSnap = await getDocs(
    query(
      collection(db, 'brand_assets'),
      where('status', '==', 'ready'),
      where('isApprovedForAI', '==', true)
    )
  );

  const allChunks: any[] = [];

  for (const assetDoc of assetsSnap.docs) {
    const assetData = assetDoc.data();
    const chunksSnap = await getDocs(collection(db, 'brand_assets', assetDoc.id, 'chunks'));

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
  const knowledgeSnap = await getDocs(
    query(
      collection(db, 'knowledge'),
      where('metadata.isApprovedForAI', '==', true)
    )
  );

  return knowledgeSnap.docs.map(doc => ({
    ...doc.data(),
    id: doc.id
  }));
}

export async function POST(request: Request) {
  try {
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
      return NextResponse.json(
        { 
          ok: true, 
          message: 'Nenhum chunk aprovado para migrar.', 
          sourceStats,
          report: { attempted: 0, upserted: 0, skipped: 0, errors: [] } 
        },
        { status: 200 }
      );
    }

    const report = await migrateChunksToPinecone(allChunksToMigrate, { namespace });

    return NextResponse.json(
      {
        ok: true,
        namespace: namespace || 'default',
        sourceStats,
        ...report,
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido na migração para Pinecone.';
    console.error('[Pinecone] Migração falhou', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
