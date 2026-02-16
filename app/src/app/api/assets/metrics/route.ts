import { NextRequest, NextResponse } from 'next/server';
import { queryPinecone, getPineconeIndex } from '@/lib/ai/pinecone';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { getBrandAssets } from '@/lib/firebase/assets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route para Métricas de Performance de Ativos (Dashboard)
 * ST-11.3 - "Visão de Águia"
 * J-2.1: Firestore fallback — assets that fail processing are no longer invisible.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const assetTypeFilter = searchParams.get('assetType');

    console.log(`[Metrics API] brandId: ${brandId}, type: ${assetTypeFilter}`);

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    // --- 1. Firestore: source of truth for all assets ---
    let firestoreAssets: any[] = [];
    try {
      const raw = await getBrandAssets(brandId);
      firestoreAssets = raw.map(a => ({
        id: a.id,
        namespace: 'knowledge' as const,
        score: 0,
        assetType: a.type || 'knowledge_base',
        name: a.name || a.originalName || 'Documento',
        url: a.url,
        createdAt: a.createdAt?.seconds
          ? new Date(a.createdAt.seconds * 1000).toISOString()
          : new Date().toISOString(),
        status: a.status,
        processingError: a.processingError,
        metadata: a.metadata || {},
      }));
      console.log(`[Metrics] Firestore assets: ${firestoreAssets.length}`);
    } catch (err: any) {
      console.warn('[Metrics] Firestore query failed:', err.message);
    }

    // --- 2. Pinecone: enriched data (scores, metrics, strategic advice) ---
    const dummyVector = Array.from({ length: 768 }, () => Math.random() * 0.01);
    const baseFilter: Record<string, any> = { brandId: { '$eq': brandId } };
    if (assetTypeFilter) {
      baseFilter.assetType = { '$eq': assetTypeFilter };
    }

    let availableNamespaces: string[] = [];
    try {
      const pineconeIdx = await getPineconeIndex();
      if (pineconeIdx) {
        const stats = await pineconeIdx.describeIndexStats();
        availableNamespaces = Object.keys(stats.namespaces || {});
        console.log(`[Metrics API] Namespaces no Pinecone:`, availableNamespaces);
      }
    } catch (e) {
      console.warn('[Metrics API] Falha ao ler stats do Pinecone, tentando queries diretas.');
    }

    // 2a. Namespace 'visual' (Gemini Vision analyses)
    let visualAssets: any[] = [];
    try {
      console.log(`[Metrics] Querying Pinecone namespace 'visual' for brandId: ${brandId}`);
      const visualRes = await queryPinecone({
        vector: dummyVector,
        topK: 100,
        namespace: 'visual',
        filter: baseFilter
      });

      visualAssets = (visualRes.matches || []).map(m => {
        const meta = m.metadata as any;
        return {
          id: m.id,
          namespace: 'visual',
          score: meta.score || 0,
          assetType: meta.assetType || 'visual_analysis',
          strategicAdvice: meta.strategicAdvice || '',
          imageUri: meta.imageUri || '',
          createdAt: meta.createdAt || new Date().toISOString(),
          status: 'ready',
          metadata: meta
        };
      });
      console.log(`[Metrics] visualRes matches: ${visualAssets.length}`);
    } catch (err: any) {
      console.warn('[Metrics] Namespace visual indisponível ou erro:', err.message);
    }

    // 2b. Brand namespace (knowledge/ingest v2)
    let knowledgeAssets: any[] = [];
    const brandNamespace = `brand_${brandId}`;

    try {
      console.log(`[Metrics] Querying Pinecone namespace '${brandNamespace}'`);
      const brandFilter = assetTypeFilter ? { assetType: { '$eq': assetTypeFilter } } : undefined;

      const knowledgeRes = await queryPinecone({
        vector: dummyVector,
        topK: 250,
        namespace: brandNamespace,
        filter: brandFilter
      });

      console.log(`[Metrics] knowledgeRes matches (brand namespace): ${knowledgeRes.matches?.length || 0}`);

      const uniqueAssetsMap = new Map();
      (knowledgeRes.matches || []).forEach(m => {
        const meta = m.metadata as any;
        const assetId = meta.assetId || m.id.split('-chunk-')[0];

        if (assetId && !uniqueAssetsMap.has(assetId)) {
          uniqueAssetsMap.set(assetId, {
            id: assetId,
            namespace: 'knowledge',
            score: meta.relevanceScore || 100,
            assetType: meta.sourceType || meta.type || 'knowledge_base',
            name: meta.originalName || meta.assetName || meta.name || 'Documento',
            createdAt: meta.extractedAt || meta.processedAt || meta.createdAt || new Date().toISOString(),
            status: 'ready',
            metadata: meta
          });
        }
      });

      // Fallback: legacy 'knowledge' namespace
      if (uniqueAssetsMap.size < 10 && (availableNamespaces.includes('knowledge') || availableNamespaces.length === 0)) {
        console.log(`[Metrics] Buscando fallback no namespace 'knowledge' para brandId: ${brandId}`);
        const fallbackRes = await queryPinecone({
          vector: dummyVector,
          topK: 100,
          namespace: 'knowledge',
          filter: baseFilter
        });

        (fallbackRes.matches || []).forEach(m => {
          const meta = m.metadata as any;
          const assetId = meta.assetId || m.id.split('-chunk-')[0];

          if (assetId && !uniqueAssetsMap.has(assetId)) {
            uniqueAssetsMap.set(assetId, {
              id: assetId,
              namespace: 'knowledge',
              score: meta.relevanceScore || 100,
              assetType: meta.sourceType || meta.type || 'knowledge_base',
              name: meta.originalName || meta.assetName || meta.name || 'Documento',
              createdAt: meta.extractedAt || meta.processedAt || meta.createdAt || new Date().toISOString(),
              status: 'ready',
              metadata: meta
            });
          }
        });
      }

      knowledgeAssets = Array.from(uniqueAssetsMap.values());
      console.log(`[Metrics] total unique Pinecone knowledge assets: ${knowledgeAssets.length}`);
    } catch (err: any) {
      console.error('[Metrics] Error querying knowledge namespaces:', err);
    }

    // --- 3. Merge: Firestore (source of truth) + Pinecone (enriched) ---
    const pineconeIds = new Set([
      ...visualAssets.map(a => a.id),
      ...knowledgeAssets.map(a => a.id),
    ]);

    // Enrich Firestore assets with Pinecone data where available
    const pineconeMap = new Map<string, any>();
    for (const a of [...knowledgeAssets, ...visualAssets]) {
      pineconeMap.set(a.id, a);
    }

    const mergedMap = new Map<string, any>();

    // Start with Firestore assets as base
    for (const fsAsset of firestoreAssets) {
      const pineconeData = pineconeMap.get(fsAsset.id);
      if (pineconeData) {
        // Merge: Pinecone scores + Firestore status
        mergedMap.set(fsAsset.id, {
          ...pineconeData,
          url: fsAsset.url,
          status: fsAsset.status,
          processingError: fsAsset.processingError,
        });
      } else {
        // Asset only in Firestore (processing/error/new)
        mergedMap.set(fsAsset.id, fsAsset);
      }
    }

    // Add Pinecone-only assets (visual analyses, legacy)
    for (const pAsset of [...visualAssets, ...knowledgeAssets]) {
      if (!mergedMap.has(pAsset.id)) {
        mergedMap.set(pAsset.id, pAsset);
      }
    }

    const allAssets = Array.from(mergedMap.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const enrichedAssets = allAssets.map(asset => ({
      ...asset,
      metrics: asset.metrics || null,
    }));

    const visualCount = enrichedAssets.filter(a => a.namespace === 'visual').length;
    const visualOnly = enrichedAssets.filter(a => a.namespace === 'visual');
    const avgVisualScore = visualCount > 0
      ? (visualOnly.reduce((acc, curr) => (acc + (Number(curr.score) || 0)), 0) / visualCount).toFixed(1)
      : 0;

    return createApiSuccess({
      assets: enrichedAssets,
      summary: {
        total: enrichedAssets.length,
        visualCount,
        knowledgeCount: enrichedAssets.length - visualCount,
        avgVisualScore
      }
    });

  } catch (error: any) {
    console.error('[Metrics API] Critical Error:', error);
    return createApiError(500, 'Erro interno no dashboard de ativos', { details: error.message });
  }
}
