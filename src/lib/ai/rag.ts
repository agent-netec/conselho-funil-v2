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
  collectionGroup,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getBrandAssets } from '@/lib/firebase/assets';
import { generateEmbedding, cosineSimilarity } from './embeddings';
import type { AssetChunk } from '@/types/database';

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

export interface RetrievedBrandChunk {
  id: string;
  assetId: string;
  assetName: string;
  content: string;
  similarity: number;
  rank: number;
}

/**
 * Calculate keyword match score (percentage of query keywords found in content)
 */
function keywordMatchScore(queryText: string, content: string): number {
  const queryWords = queryText.toLowerCase()
    .replace(/[^\w\sáéíóúãõâêîôûàèìòùç]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2);
  
  if (queryWords.length === 0) return 0;
  
  const contentLower = content.toLowerCase();
  let matches = 0;
  
  // Key terms for copywriting/funnel domains
  const domainTerms: Record<string, string[]> = {
    copy: ['copy', 'headline', 'texto', 'persuasão', 'persuasao', 'escrever', 'copys', 'escrita'],
    funil: ['funil', 'funnel', 'etapa', 'passo', 'etapas', 'passos', 'landing', 'página', 'pagina'],
    oferta: ['oferta', 'offer', 'preço', 'preco', 'valor', 'bônus', 'bonus', 'garantia'],
    headline: ['headline', 'título', 'titulo', 'manchete', 'chamar', 'atenção', 'atencao'],
    consciencia: ['consciência', 'consciencia', 'awareness', 'consciente', 'dor', 'problema', 'solução', 'solucao'],
  };
  
  // Check for domain term matches (higher weight)
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matches++;
    }
    // Check domain terms
    for (const [domain, terms] of Object.entries(domainTerms)) {
      if (terms.includes(word) && terms.some(t => contentLower.includes(t))) {
        matches += 0.5;
        break;
      }
    }
  }
  
  return matches / queryWords.length;
}

/**
 * Recupera chunks relevantes da base de conhecimento com base em similaridade semântica e palavras-chave.
 * 
 * @param queryText - O texto da consulta do usuário.
 * @param config - Configurações de recuperação (topK, minSimilarity, filtros).
 * @returns Uma promessa que resolve para um array de chunks recuperados, ordenados por relevância.
 * 
 * @example
 * ```ts
 * const chunks = await retrieveChunks("Como estruturar um funil de quiz?", { topK: 5 });
 * ```
 */
export async function retrieveChunks(
  queryText: string,
  config: RetrievalConfig = { topK: 10, minSimilarity: 0.3 }
): Promise<RetrievedChunk[]> {
  try {
    // 1. Generate embedding for the query (local, no API needed)
    const queryEmbedding = generateLocalEmbedding(queryText);
    
    // 2. Fetch chunks from Firestore (fetch more for better filtering)
    let chunksQuery = query(
      collection(db, 'knowledge'),
      where('metadata.status', '==', 'approved'),
      limit(200) // Fetch more for better filtering
    );

    // Apply filters if provided
    if (config.filters?.docType) {
      chunksQuery = query(
        collection(db, 'knowledge'),
        where('metadata.status', '==', 'approved'),
        where('metadata.docType', '==', config.filters.docType),
        limit(200)
      );
    }

    const snapshot = await getDocs(chunksQuery);
    
    if (snapshot.empty) {
      console.log('No chunks found in knowledge base');
      return [];
    }

    console.log(`Scanning ${snapshot.size} chunks for relevance...`);

    // 3. Calculate combined similarity for each chunk
    const chunksWithSimilarity: RetrievedChunk[] = [];
    
    // Lower the threshold since we're using local embeddings
    const effectiveMinSimilarity = Math.min(config.minSimilarity, 0.15);
    
    snapshot.docs.forEach(doc => {
      const data = doc.data() as Omit<KnowledgeChunk, 'id'>;
      
      // Apply additional filters
      if (config.filters?.counselor && data.metadata.counselor !== config.filters.counselor) {
        return;
      }
      
      // Calculate embedding similarity (if embedding exists)
      let embeddingSimilarity = 0;
      if (data.embedding && Array.isArray(data.embedding) && data.embedding.length > 0) {
        embeddingSimilarity = cosineSimilarity(queryEmbedding, data.embedding);
      }
      
      // Calculate keyword match score
      const keywordScore = keywordMatchScore(queryText, data.content);
      
      // Combined score: weighted average (keywords are more reliable with local embeddings)
      const similarity = (embeddingSimilarity * 0.4) + (keywordScore * 0.6);
      
      // Only include if above threshold OR has good keyword match
      if (similarity >= effectiveMinSimilarity || keywordScore >= 0.3) {
        chunksWithSimilarity.push({
          id: doc.id,
          ...data,
          similarity: Math.max(similarity, keywordScore), // Use best score
          rank: 0, // Will be set after sorting
        });
      }
    });

    console.log(`Found ${chunksWithSimilarity.length} chunks above threshold`);

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
 * Recupera chunks filtrados por um conselheiro específico.
 * 
 * @param queryText - O texto da consulta.
 * @param counselor - O identificador do conselheiro (ex: 'vsl_expert').
 * @param topK - Número máximo de chunks a retornar (padrão: 5).
 * @returns Uma promessa com os chunks mais relevantes do conselheiro.
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
 * Recupera conhecimento especializado para a criação de um novo funil.
 * Combina busca geral com busca em heurísticas específicas.
 * 
 * @param objective - O objetivo do funil (ex: 'leads', 'vendas').
 * @param channel - O canal de tráfego (ex: 'Facebook Ads', 'YouTube').
 * @param audience - O público-alvo.
 * @param topK - Número total de chunks a recuperar (padrão: 15).
 * @returns Uma promessa com uma lista consolidada de chunks relevantes.
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
 * Formata os chunks recuperados em uma string de contexto adequada para prompts de LLM.
 * 
 * @param chunks - Array de chunks recuperados.
 * @returns Uma string formatada contendo conteúdo, fonte e relevância de cada chunk.
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
 * Executa uma consulta RAG completa: recupera chunks e os formata em contexto.
 * 
 * @param queryText - A pergunta ou termo de busca.
 * @param config - Opcional: configurações de recuperação.
 * @returns Uma promessa com os chunks originais e a string de contexto formatada.
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
 * Realiza uma busca semântica simplificada, retornando apenas informações essenciais.
 * 
 * @param query - O termo de busca.
 * @param limit - Limite de resultados (padrão: 5).
 * @returns Uma promessa com conteúdo, similaridade e fonte de cada resultado.
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

/**
 * Busca chunks de uma marca que sejam semanticamente similares a uma query.
 * 
 * @param brandId - O ID da marca.
 * @param queryEmbedding - O vetor da pergunta do usuário.
 * @param limitCount - Número máximo de resultados (padrão 5).
 * @returns Lista de chunks ordenados por similaridade.
 */
export async function searchSimilarChunks(
  brandId: string,
  queryEmbedding: number[],
  limitCount: number = 5
): Promise<RetrievedBrandChunk[]> {
  const assets = await getBrandAssets(brandId);
  const readyAssets = assets.filter(a => a.status === 'ready');
  
  if (readyAssets.length === 0) return [];

  const allRelevantChunks: RetrievedBrandChunk[] = [];

  // 1. Coletar todos os chunks de todos os assets da marca
  // Nota: Em produção com muitos arquivos, isso seria otimizado com um banco de vetores dedicado
  // ou filtragem prévia por metadados. Para o v3.0 Early, fazemos a comparação em memória.
  for (const asset of readyAssets) {
    const chunksCollectionRef = collection(db, 'brand_assets', asset.id, 'chunks');
    const chunksSnap = await getDocs(chunksCollectionRef);
    
    chunksSnap.docs.forEach(doc => {
      const data = doc.data() as AssetChunk;
      
      // Se o chunk não tiver embedding, pula (retrocompatibilidade)
      if (!data.embedding || !Array.isArray(data.embedding)) return;

      const similarity = cosineSimilarity(queryEmbedding, data.embedding);
      
      allRelevantChunks.push({
        id: doc.id,
        assetId: asset.id,
        assetName: asset.name,
        content: data.content,
        similarity,
        rank: 0
      });
    });
  }

  // 2. Ordenar e retornar Top-N
  return allRelevantChunks
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limitCount)
    .map((chunk, index) => ({ ...chunk, rank: index + 1 }));
}

/**
 * Recupera chunks relevantes dos assets da marca usando busca vetorial.
 * 
 * @param brandId - O ID da marca.
 * @param queryText - O texto da consulta do usuário.
 * @param topK - Número máximo de chunks a retornar.
 */
export async function retrieveBrandChunks(
  brandId: string,
  queryText: string,
  topK: number = 5
): Promise<RetrievedBrandChunk[]> {
  try {
    // 1. Gerar embedding para a query
    const queryEmbedding = await generateEmbedding(queryText);
    
    // 2. Buscar por similaridade de cosseno
    const results = await searchSimilarChunks(brandId, queryEmbedding, topK);
    
    // 3. Fallback para busca por palavra-chave se não houver resultados semânticos bons
    // Usamos um threshold mais rigoroso (0.65) conforme US-15.3 AC-3
    const SIMILARITY_THRESHOLD = 0.65;
    
    if (results.length === 0 || results[0].similarity < SIMILARITY_THRESHOLD) {
      console.log(`[RAG] Similaridade baixa (${results[0]?.similarity || 0}). Fallback para keyword search...`);
      const assets = await getBrandAssets(brandId);
      const readyAssets = assets.filter(a => a.status === 'ready');
      
      const keywordResults: RetrievedBrandChunk[] = [];
      for (const asset of readyAssets) {
        const chunksSnap = await getDocs(collection(db, 'brand_assets', asset.id, 'chunks'));
        chunksSnap.docs.forEach(doc => {
          const data = doc.data();
          const score = keywordMatchScore(queryText, data.content);
          if (score > 0.1) {
            keywordResults.push({
              id: doc.id,
              assetId: asset.id,
              assetName: asset.name,
              content: data.content,
              similarity: score,
              rank: 0
            });
          }
        });
      }
      
      // Se o keyword match for melhor que o vetor (ou se o vetor falhou), usa ele
      if (keywordResults.length > 0) {
        keywordResults.sort((a, b) => b.similarity - a.similarity);
        keywordResults.forEach((c, i) => c.rank = i + 1);
        return keywordResults.slice(0, topK);
      }
    }

    return results;
  } catch (error) {
    console.error('Error retrieving brand chunks:', error);
    // Fallback absoluto: busca local sem API se o embedding falhar
    const queryEmbeddingLocal = generateLocalEmbedding(queryText);
    return searchSimilarChunks(brandId, queryEmbeddingLocal, topK);
  }
}

/**
 * Formata os chunks da marca para injeção no prompt do LLM.
 * Segue o formato especificado na US-15.3 AC-2.
 */
export function formatBrandContextForLLM(chunks: RetrievedBrandChunk[]): string {
  if (chunks.length === 0) return '';

  const formatted = chunks.map(c => {
    return `### CONTEXTO DA MARCA (ARQUIVOS)
- Fonte: [${c.assetName}]
- Relevância: ${(c.similarity * 100).toFixed(1)}%
- Conteúdo: ${c.content}`;
  }).join('\n\n');

  return `## CONHECIMENTO EXTRAÍDO DOS ARQUIVOS DA MARCA\n\n${formatted}\n\n⚠️ INSTRUÇÃO CRÍTICA: Se você usar as informações acima, deve citar o nome do arquivo fonte explicitamente (ex: "De acordo com o arquivo [Nome]...").`;
}

