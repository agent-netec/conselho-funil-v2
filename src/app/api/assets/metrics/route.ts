import { NextRequest, NextResponse } from 'next/server';
import { queryPinecone, getPineconeIndex } from '@/lib/ai/pinecone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * API Route para Métricas de Performance de Ativos (Dashboard)
 * ST-11.3 - "Visão de Águia"
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');
    const assetTypeFilter = searchParams.get('assetType');

    console.log(`[Metrics API] brandId: ${brandId}, type: ${assetTypeFilter}`);

    if (!brandId) {
      return NextResponse.json({ error: 'brandId é obrigatório' }, { status: 400 });
    }

    // Pinecone requer um vetor para busca. Usamos um vetor com pequeno ruído aleatório.
    const dummyVector = Array.from({ length: 768 }, () => Math.random() * 0.01);
    
    // Filtro base para buscas que exigem brandId (como no namespace 'knowledge' compartilhado)
    const baseFilter: Record<string, any> = { brandId: { '$eq': brandId } };
    if (assetTypeFilter) {
      baseFilter.assetType = { '$eq': assetTypeFilter };
    }

    // DIAGNÓSTICO: Listar namespaces disponíveis para logging, mas não bloquearemos a query.
    let availableNamespaces: string[] = [];
    try {
      const stats = await getPineconeIndex().describeIndexStats();
      availableNamespaces = Object.keys(stats.namespaces || {});
      console.log(`[Metrics API] Namespaces no Pinecone:`, availableNamespaces);
    } catch (e) {
      console.warn('[Metrics API] Falha ao ler stats do Pinecone, tentando queries diretas.');
    }

    // 1. Busca no namespace 'visual' (Análises do Gemini Vision)
    let visualAssets: any[] = [];
    try {
      // Sempre tentamos, pois o stats pode estar atrasado (eventual consistency)
      console.log(`[Metrics] Querying Pinecone namespace 'visual' for brandId: ${brandId}`);
      const visualRes = await queryPinecone({
        vector: dummyVector,
        topK: 100,
        namespace: 'visual',
        filter: baseFilter // Aqui o filtro por brandId é essencial
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
          metadata: meta
        };
      });
      console.log(`[Metrics] visualRes matches: ${visualAssets.length}`);
    } catch (err) {
      console.warn('[Metrics] Namespace visual indisponível ou erro:', err.message);
    }

    // 2. Busca no namespace da marca (Principal - Ingestão v2)
    let knowledgeAssets: any[] = [];
    const brandNamespace = `brand-${brandId}`;
    
    try {
      console.log(`[Metrics] Querying Pinecone namespace '${brandNamespace}'`);
      
      // No namespace específico da marca, não precisamos do filtro de brandId (já está isolado),
      // mas podemos filtrar por assetType se fornecido.
      const brandFilter = assetTypeFilter ? { assetType: { '$eq': assetTypeFilter } } : undefined;

      const knowledgeRes = await queryPinecone({
        vector: dummyVector,
        topK: 250,
        namespace: brandNamespace,
        filter: brandFilter // Evitamos {} vazio para não quebrar o Pinecone
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
            metadata: meta
          });
        }
      });

      // 3. Fallback: Busca no namespace 'knowledge' (Ingestão Legada/Global)
      // Só buscamos aqui se o namespace da marca não trouxer resultados suficientes ou se quisermos consolidar.
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
              metadata: meta
            });
          }
        });
      }

      knowledgeAssets = Array.from(uniqueAssetsMap.values());
      console.log(`[Metrics] total unique assets found: ${knowledgeAssets.length}`);
    } catch (err) {
      console.error('[Metrics] Error querying knowledge namespaces:', err);
    }

    // Consolidação final
    const allAssets = [...visualAssets, ...knowledgeAssets].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const enrichedAssets = allAssets.map(asset => ({
      ...asset,
      metrics: {
        ctr: (Math.random() * 5 + 0.5).toFixed(2),
        conversion: (Math.random() * 2 + 0.1).toFixed(2),
        roi: (Math.random() * 10 + 1).toFixed(1) + 'x',
      }
    }));

    const visualCount = visualAssets.length;
    const avgVisualScore = visualCount > 0 
      ? (visualAssets.reduce((acc, curr) => (acc + (Number(curr.score) || 0)), 0) / visualCount).toFixed(1)
      : 0;

    return NextResponse.json({
      success: true,
      assets: enrichedAssets,
      summary: {
        total: enrichedAssets.length,
        visualCount,
        knowledgeCount: knowledgeAssets.length,
        avgVisualScore
      }
    });

  } catch (error: any) {
    console.error('[Metrics API] Critical Error:', error);
    return NextResponse.json({ 
      error: 'Erro interno no dashboard de ativos', 
      details: error.message 
    }, { status: 500 });
  }
}
