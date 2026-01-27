/**
 * RAG (Retrieval Augmented Generation) Pipeline
 */

import { db } from '@/lib/firebase/config';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { generateEmbedding } from './embeddings';
import { COUNSELORS_REGISTRY } from '@/lib/constants';
import { CounselorId } from '@/types';
import { rerankDocuments } from './rerank';

// Types
export interface KnowledgeChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    counselor?: string;
    docType: string;
    scope?: string;
    channel?: string;
    stage?: string;
    tenantId?: string | null;
    status: string;
    version: string;
    isApprovedForAI: boolean;
    performance_snapshot?: {
      ctr: number;
      cvr: number;
      cpc: number;
      roas: number;
      period: string;
      status: 'underperforming' | 'stable' | 'winner';
    };
  };
  source: {
    file: string;
    section: string;
    lineStart: number;
    lineEnd: number;
  };
}

export interface RetrievalConfig {
  topK: number;
  minSimilarity: number;
  filters?: {
    counselor?: string;
    docType?: string;
    tenantId?: string | null;
    category?: string;
    funnelStage?: string;
    channel?: string;
    scope?: string;
  };
}

export interface RetrievedChunk extends KnowledgeChunk {
  similarity: number;
  rerankScore?: number;
  rank: number;
}

export interface RetrievedBrandChunk {
  id: string;
  assetId: string;
  assetName: string;
  content: string;
  similarity: number;
  rerankScore?: number;
  rank: number;
}

const ragCache = new Map<string, { chunks: any[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; 

export async function retrieveChunks(
  queryText: string,
  config: RetrievalConfig = { topK: 10, minSimilarity: 0.6 }
): Promise<RetrievedChunk[]> {
  try {
    const finalConfig: RetrievalConfig = {
      topK: config.topK ?? 10,
      minSimilarity: config.minSimilarity ?? 0.6,
      filters: config.filters,
    };

    const cacheKey = JSON.stringify({ queryText, filters: finalConfig.filters });
    const cached = ragCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.chunks;
    }

    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(queryText);
    } catch (embedError) {
      console.warn('[RAG] Fallback para busca local');
    }
    
    if (queryEmbedding && typeof window === 'undefined') {
      const pineconeFilters: any = { 
        isApprovedForAI: { '$eq': true },
        status: { '$eq': 'approved' }
      };

      const { queryPinecone } = await import('./pinecone');
      const pineconeResponse = await queryPinecone({
        vector: queryEmbedding,
        topK: 50,
        namespace: 'knowledge',
        filter: pineconeFilters
      });

      if (pineconeResponse.matches?.length) {
        const semanticCandidates: RetrievedChunk[] = pineconeResponse.matches.map(match => {
          const meta = match.metadata as any;
          return {
            id: match.id,
            content: meta.content || '',
            embedding: [], 
            similarity: match.score || 0,
            rank: 0,
            metadata: meta,
            source: {
              file: meta.sourceFile || meta.file || 'unknown',
              section: meta.sourceSection || meta.section || 'unknown',
              lineStart: meta.lineStart || 0,
              lineEnd: meta.lineEnd || 0,
            }
          };
        });

        let reranked = await rerankDocuments(queryText, semanticCandidates, finalConfig.topK);
        
        let finalResults = reranked
          .filter(chunk => (chunk.rerankScore ?? chunk.similarity) >= finalConfig.minSimilarity)
          .slice(0, finalConfig.topK)
          .map((chunk, index) => ({ ...chunk, rank: index + 1 }));

        if (finalResults.length > 0) {
          ragCache.set(cacheKey, { chunks: finalResults, timestamp: Date.now() });
        }
        
        return finalResults;
      }
    }

    return [];
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    return [];
  }
}

export async function retrieveBrandChunks(
  brandId: string,
  queryText: string,
  config: number | RetrievalConfig = 5
): Promise<RetrievedBrandChunk[]> {
  const finalConfig: RetrievalConfig = typeof config === 'number' 
    ? { topK: config, minSimilarity: 0.65 } 
    : config;

  try {
    const cacheKey = JSON.stringify({ brandId, queryText, filters: finalConfig.filters });
    const cached = ragCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.chunks;
    }

    const queryEmbedding = await generateEmbedding(queryText);
    const { searchSimilarChunks } = await import('./rag-helpers-fixed'); 
    const candidates = await searchSimilarChunks(brandId, queryEmbedding, 50, finalConfig.filters);
    
    let results = await rerankDocuments(queryText, candidates, finalConfig.topK);
    results.forEach((c, i) => c.rank = i + 1);

    if (results.length > 0) {
      ragCache.set(cacheKey, { chunks: results, timestamp: Date.now() });
    }

    return results;
  } catch (error) {
    console.error('Error retrieving brand chunks:', error);
    return [];
  }
}

export function formatContextForLLM(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return '';
  return chunks.map(chunk => `---
Conteúdo: ${chunk.content}
Fonte: ${chunk.source.file}
---`).join('\n\n');
}

export function formatBrandContextForLLM(chunks: RetrievedBrandChunk[]): string {
  if (chunks.length === 0) return '';
  return chunks.map(c => `### CONTEXTO DA MARCA
- Fonte: [${c.assetName}]
- Conteúdo: ${c.content}`).join('\n\n');
}

export async function ragQuery(
  queryText: string,
  config?: RetrievalConfig
): Promise<{ chunks: RetrievedChunk[]; context: string }> {
  const chunks = await retrieveChunks(queryText, config);
  const context = formatContextForLLM(chunks);
  return { chunks, context };
}

export async function retrieveForFunnelCreation(
  objective: string,
  channel: string,
  audience: string,
  topK = 15
): Promise<RetrievedChunk[]> {
  const queryText = `Funil de ${objective} Canal: ${channel} Público: ${audience}`;
  return retrieveChunks(queryText, { topK, minSimilarity: 0.2 });
}

export async function retrieveByCouncelor(queryText: string, counselor: string, topK = 5) {
  return retrieveChunks(queryText, { topK, minSimilarity: 0.25, filters: { counselor } });
}

export async function retrieveBenchmarks(queryText: string, topK = 5) {
  return retrieveChunks(queryText, { topK, minSimilarity: 0.2, filters: { docType: 'market_data' } });
}
