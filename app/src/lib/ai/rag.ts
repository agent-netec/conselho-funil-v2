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

/**
 * Sprint O — O-3.5: Retrieve research insights from RAG for content generation.
 * Counselors automatically search for research_insight docs when generating content.
 */
export async function retrieveResearchContext(
  queryText: string,
  topK = 5
): Promise<{ chunks: RetrievedChunk[]; context: string }> {
  const chunks = await retrieveChunks(queryText, {
    topK,
    minSimilarity: 0.3,
    filters: { docType: 'research_insight' },
  });
  const context = chunks.length > 0
    ? '\n## DEEP RESEARCH INSIGHTS\n' + chunks.map(c =>
      `- ${c.content}`
    ).join('\n')
    : '';
  return { chunks, context };
}

/**
 * Sprint O — O-5.3: Retrieve social policies and best practices from RAG.
 * Filters by docType (social_policy | social_best_practices) and optional channel.
 */
export async function retrieveSocialKnowledge(
  queryText: string,
  options: { channel?: string; docTypes?: string[]; topK?: number } = {}
): Promise<{ chunks: RetrievedChunk[]; context: string }> {
  const { channel, docTypes = ['social_policy', 'social_best_practices'], topK = 5 } = options;
  const allChunks: RetrievedChunk[] = [];

  for (const docType of docTypes) {
    const filters: RetrievalConfig['filters'] = { docType };
    if (channel) filters.channel = channel;
    const chunks = await retrieveChunks(queryText, {
      topK: Math.ceil(topK / docTypes.length),
      minSimilarity: 0.25,
      filters,
    });
    allChunks.push(...chunks);
  }

  // Sort by relevance and take topK
  allChunks.sort((a, b) => (b.rerankScore ?? b.similarity) - (a.rerankScore ?? a.similarity));
  const finalChunks = allChunks.slice(0, topK);

  const context = finalChunks.length > 0
    ? '\n## SOCIAL KNOWLEDGE BASE\n' + finalChunks.map(c => {
        const label = c.metadata.docType === 'social_policy' ? 'POLÍTICA' : 'BOA PRÁTICA';
        return `- [${label}${c.metadata.channel ? ` / ${c.metadata.channel}` : ''}] ${c.content}`;
      }).join('\n')
    : '';

  return { chunks: finalChunks, context };
}

/**
 * Keyword match scoring via Jaccard Similarity.
 * Sprint 28 — S28-CL-06 (DT-10)
 *
 * Calcula a proporção de keywords encontradas no texto.
 * Zero dependências externas, determinístico, O(n) com Set.
 * Adequado para filtragem de relevância no pipeline RAG.
 *
 * @param text - Texto a ser analisado
 * @param keywords - Lista de palavras-chave para buscar
 * @returns Score entre 0 e 1 (proporção de keywords encontradas)
 */
export function keywordMatchScore(text: string, keywords: string[]): number {
  if (!text || keywords.length === 0) return 0;
  const textTokens = new Set(text.toLowerCase().split(/\s+/));
  const keywordTokens = new Set(keywords.map(k => k.toLowerCase()));
  const intersection = [...keywordTokens].filter(k => textTokens.has(k));
  return keywordTokens.size > 0 ? intersection.length / keywordTokens.size : 0;
}

/**
 * Hash-based pseudo-embedding (768 dimensões, determinístico, sem API).
 * Sprint 28 — S28-CL-06 (DT-06)
 *
 * Fallback offline quando a API de embeddings (text-embedding-004) não está disponível.
 * Usa crypto.subtle.digest('SHA-256') para gerar 32 bytes, expandidos para 768d via seed cycling.
 *
 * **ATENÇÃO: ZERO CAPACIDADE SEMÂNTICA.**
 * Textos semanticamente similares NÃO produzem vetores similares.
 * Adequado APENAS para deduplicação e cache key, NÃO para busca semântica.
 * Para busca semântica, use generateEmbedding() em embeddings.ts (via API).
 *
 * @param text - Texto para gerar pseudo-embedding
 * @returns Promise de vetor 768d com valores normalizados em [-1, 1]
 */
export async function generateLocalEmbedding(text: string): Promise<number[]> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);

  // Expandir 32 bytes para 768 dimensões via seed cycling
  const embedding = new Array(768);
  for (let i = 0; i < 768; i++) {
    embedding[i] = (hashArray[i % 32] / 255) * 2 - 1; // Normalizar para [-1, 1]
  }
  return embedding;
}

/**
 * Hash de string via algoritmo djb2 com padding.
 * Sprint 28 — S28-CL-06 (DT-05)
 *
 * Upgrade do bit-shift hash anterior para djb2 (melhor distribuição).
 * Output consistente com padding de 8 chars hexadecimais.
 * Mantém contrato síncrono para compatibilidade com chamadores existentes.
 *
 * @param text - Texto a ser hasheado
 * @returns String hexadecimal de 8 caracteres
 */
export function hashString(text: string): string {
  let hash = 5381; // djb2 seed
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) + hash) + text.charCodeAt(i);
    hash = hash & 0xFFFFFFFF; // Force 32-bit
  }
  // Converter para unsigned e pad para 8 chars
  return (hash >>> 0).toString(16).padStart(8, '0');
}
