/**
 * RAG (Retrieval Augmented Generation) Pipeline
 * 
 * Este módulo implementa o pipeline completo de:
 * 1. Embedding da query
 * 2. Busca vetorial no Firestore
 * 3. Ranking e filtragem
 * 4. Montagem de contexto
 */

import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * Simple string hash function
 */
function hashString(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return hash;
}

/**
 * Generate fallback embedding locally (no API needed)
 */
function generateLocalEmbedding(text: string): number[] {
  const vector = new Array(768).fill(0);
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, '');
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  
  const wordCounts: Record<string, number> = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  Object.entries(wordCounts).forEach(([word, count]) => {
    const hash1 = hashString(word);
    const hash2 = hashString(word + '_secondary');
    const hash3 = hashString(word + '_tertiary');
    
    const indices = [
      Math.abs(hash1) % 768,
      Math.abs(hash2) % 768,
      Math.abs(hash3) % 768,
    ];
    
    const weight = Math.log(1 + count) / Math.log(1 + words.length);
    indices.forEach(idx => {
      vector[idx] += weight;
    });
  });
  
  words.slice(0, 10).forEach((word, i) => {
    const idx = Math.abs(hashString(word + '_pos')) % 768;
    vector[idx] += (10 - i) * 0.05;
  });
  
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    return vector.map(v => v / magnitude);
  }
  
  return vector;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  return magnitude > 0 ? dotProduct / magnitude : 0;
}

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
  };
}

export interface RetrievedChunk extends KnowledgeChunk {
  similarity: number;
  rank: number;
}

/**
 * Retrieve relevant chunks from the knowledge base
 */
export async function retrieveChunks(
  queryText: string,
  config: RetrievalConfig = { topK: 10, minSimilarity: 0.3 }
): Promise<RetrievedChunk[]> {
  try {
    // 1. Generate embedding for the query (local, no API needed)
    const queryEmbedding = generateLocalEmbedding(queryText);
    
    // 2. Fetch chunks from Firestore
    let chunksQuery = query(
      collection(db, 'knowledge'),
      where('metadata.status', '==', 'approved'),
      limit(100) // Fetch more than needed for filtering
    );

    // Apply filters if provided
    if (config.filters?.docType) {
      chunksQuery = query(
        collection(db, 'knowledge'),
        where('metadata.status', '==', 'approved'),
        where('metadata.docType', '==', config.filters.docType),
        limit(100)
      );
    }

    const snapshot = await getDocs(chunksQuery);
    
    if (snapshot.empty) {
      console.log('No chunks found in knowledge base');
      return [];
    }

    // 3. Calculate similarity for each chunk
    const chunksWithSimilarity: RetrievedChunk[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as Omit<KnowledgeChunk, 'id'>;
      
      // Skip if no embedding
      if (!data.embedding || !Array.isArray(data.embedding)) {
        return;
      }

      // Apply additional filters
      if (config.filters?.counselor && data.metadata.counselor !== config.filters.counselor) {
        return;
      }
      
      // Calculate cosine similarity
      const similarity = cosineSimilarity(queryEmbedding, data.embedding);
      
      // Only include if above threshold
      if (similarity >= config.minSimilarity) {
        chunksWithSimilarity.push({
          id: doc.id,
          ...data,
          similarity,
          rank: 0, // Will be set after sorting
        });
      }
    });

    // 4. Sort by similarity and assign ranks
    chunksWithSimilarity.sort((a, b) => b.similarity - a.similarity);
    chunksWithSimilarity.forEach((chunk, index) => {
      chunk.rank = index + 1;
    });

    // 5. Return top K
    return chunksWithSimilarity.slice(0, config.topK);
  } catch (error) {
    console.error('Error retrieving chunks:', error);
    return [];
  }
}

/**
 * Retrieve chunks filtered by counselor
 */
export async function retrieveByCouncelor(
  queryText: string,
  counselor: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  return retrieveChunks(queryText, {
    topK,
    minSimilarity: 0.25,
    filters: { counselor }
  });
}

/**
 * Retrieve chunks for funnel creation
 */
export async function retrieveForFunnelCreation(
  objective: string,
  channel: string,
  audience: string,
  topK = 15
): Promise<RetrievedChunk[]> {
  // Create a comprehensive query combining context
  const queryText = `
    Funil de ${objective} 
    Canal: ${channel}
    Público: ${audience}
    Arquitetura, estrutura, etapas, conversão
  `;
  
  // Get general funnel knowledge
  const generalChunks = await retrieveChunks(queryText, {
    topK: Math.floor(topK / 2),
    minSimilarity: 0.2,
  });

  // Get heuristics specifically
  const heuristicChunks = await retrieveChunks(queryText, {
    topK: Math.floor(topK / 2),
    minSimilarity: 0.2,
    filters: { docType: 'heuristics' }
  });

  // Combine and deduplicate
  const allChunks = [...generalChunks, ...heuristicChunks];
  const uniqueChunks = allChunks.filter((chunk, index, self) =>
    index === self.findIndex(c => c.id === chunk.id)
  );

  // Re-sort by similarity
  uniqueChunks.sort((a, b) => b.similarity - a.similarity);
  
  return uniqueChunks.slice(0, topK);
}

/**
 * Format retrieved chunks into context string for LLM
 */
export function formatContextForLLM(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return '';
  }

  const formattedChunks = chunks.map(chunk => {
    const counselorInfo = chunk.metadata.counselor 
      ? `[${chunk.metadata.counselor.replace('_', ' ').toUpperCase()}]` 
      : '';
    const typeInfo = chunk.metadata.docType 
      ? `(${chunk.metadata.docType})` 
      : '';
    
    return `---
${counselorInfo} ${typeInfo}
Fonte: ${chunk.source.file} > ${chunk.source.section}
Relevância: ${(chunk.similarity * 100).toFixed(1)}%

${chunk.content}
---`;
  });

  return formattedChunks.join('\n\n');
}

/**
 * Full RAG query - retrieves and formats context
 */
export async function ragQuery(
  queryText: string,
  config?: RetrievalConfig
): Promise<{ chunks: RetrievedChunk[]; context: string }> {
  const chunks = await retrieveChunks(queryText, config);
  const context = formatContextForLLM(chunks);
  
  return { chunks, context };
}

/**
 * Search by semantic similarity (simpler interface)
 */
export async function semanticSearch(
  query: string,
  limit = 5
): Promise<Array<{ content: string; similarity: number; source: string }>> {
  const chunks = await retrieveChunks(query, { topK: limit, minSimilarity: 0.2 });
  
  return chunks.map(chunk => ({
    content: chunk.content,
    similarity: chunk.similarity,
    source: `${chunk.source.file} > ${chunk.source.section}`,
  }));
}
