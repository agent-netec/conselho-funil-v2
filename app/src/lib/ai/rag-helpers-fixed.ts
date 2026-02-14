import { RetrievalConfig, RetrievedBrandChunk } from './rag';

export async function searchSimilarChunks(
  brandId: string,
  queryEmbedding: number[],
  limitCount: number = 5,
  filters?: RetrievalConfig['filters']
): Promise<RetrievedBrandChunk[]> {
  try {
    const pineconeFilters: any = { 
      brandId: { '$eq': brandId }
    };
    
    if (filters?.funnelStage) pineconeFilters.funnelStage = { '$eq': filters.funnelStage };
    if (filters?.channel) pineconeFilters.channel = { '$eq': filters.channel };

    const namespace = `brand_${brandId}`;
    const { queryPinecone } = await import('./pinecone');
    const pineconeResponse = await queryPinecone({
      vector: queryEmbedding,
      topK: limitCount * 2,
      namespace,
      filter: pineconeFilters
    });

    if (pineconeResponse.matches?.length) {
      return pineconeResponse.matches.map(match => {
        const meta = match.metadata as any;
        return {
          id: match.id,
          assetId: meta.assetId || '',
          assetName: meta.originalName || meta.assetName || 'Arquivo da Marca',
          content: meta.content || '',
          similarity: match.score || 0,
          rank: 0
        };
      });
    }
    return [];
  } catch (err) {
    console.error('[RAG Helpers] Erro:', err);
    return [];
  }
}
