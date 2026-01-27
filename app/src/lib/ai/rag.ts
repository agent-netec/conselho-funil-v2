/**
 * RAG (Retrieval Augmented Generation) Pipeline
 * 
 * Este módulo implementa o pipeline completo de:
 * 1. Embedding da query
 * 2. Busca vetorial no Pinecone
 * 3. Ranking e filtragem
 * 4. Montagem de contexto
 */

import { db } from './config';
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
    isApprovedForAI: boolean; // US-1.2.2
    performance_snapshot?: { // ST-12.1
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
    category?: string;       // US-1.2.2
    funnelStage?: string;    // US-1.2.2
    channel?: string;        // US-1.2.2
    scope?: string;          // Added for traffic scope
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

/**
 * Recupera as métricas de performance mais recentes de um ativo no Firestore.
 * ST-12.1: Feedback Loop
 */
export async function retrievePerformanceMetrics(assetId: string): Promise<RetrievedChunk | null> {
  try {
    const metricsRef = collection(db, 'brand_assets', assetId, 'performance_metrics');
    const q = query(metricsRef, orderBy('timestamp', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) return null;

    const data = snapshot.docs[0].data();
    
    // Cálculo do AHI (Asset Health Index) simplificado para o status
    // RF-01: CTR > 1.5% Success, < 0.8% Critical | CVR > 3.5% Success, < 1.0% Critical
    let status: 'underperforming' | 'stable' | 'winner' = 'stable';
    if (data.ctr < 0.008 || data.cvr < 0.01) status = 'underperforming';
    else if (data.ctr > 0.015 || data.cvr > 0.035) status = 'winner';

    const content = `
      SNAPSHOT DE PERFORMANCE (Ativo: ${assetId})
      Status: ${status === 'underperforming' ? 'CRÍTICO' : status === 'winner' ? 'SAUDÁVEL (WINNER)' : 'ESTÁVEL'}
      Métricas: CTR: ${(data.ctr * 100).toFixed(2)}% | CVR: ${(data.cvr * 100).toFixed(2)}% | CPC: R$ ${data.cpc.toFixed(2)} | ROAS: ${data.roas.toFixed(2)}x
      Período: ${data.period || 'Últimos 7 dias'}
    `.trim();

    return {
      id: `perf-${assetId}-${snapshot.docs[0].id}`,
      content,
      embedding: [],
      similarity: 1.0,
      rank: 1,
      metadata: {
        docType: 'performance',
        status: 'approved',
        version: '2026',
        isApprovedForAI: true,
        performance_snapshot: {
          ctr: data.ctr,
          cvr: data.cvr,
          cpc: data.cpc,
          roas: data.roas,
          period: data.period || '7d',
          status
        }
      },
      source: {
        file: `firestore/performance_metrics/${assetId}`,
        section: 'latest_snapshot',
        lineStart: 0,
        lineEnd: 0
      }
    };
  } catch (error) {
    console.error('[RAG] Erro ao buscar métricas de performance:', error);
    return null;
  }
}

const ragCache = new Map<string, { chunks: any[], timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos

/**
 * Recupera chunks relevantes da base de conhecimento com base em similaridade semântica.
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
  config: RetrievalConfig = { topK: 10, minSimilarity: 0.6 }
): Promise<RetrievedChunk[]> {
  try {
    const startedAt = Date.now();
    const finalConfig: RetrievalConfig = {
      topK: config.topK ?? 10,
      minSimilarity: config.minSimilarity ?? 0.6,
      filters: config.filters,
    };

    // ST-12.5: RAG Caching
    const cacheKey = JSON.stringify({ queryText, filters: finalConfig.filters });
    const cached = ragCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[RAG] Cache hit for query: "${queryText.slice(0, 30)}..."`);
      return cached.chunks;
    }

    const minRequired = Math.min(finalConfig.topK, 8);

    // 1. Generate embedding for the query (Gemini)
    let queryEmbedding: number[] | null = null;
    try {
      queryEmbedding = await generateEmbedding(queryText);
    } catch (embedError) {
      console.warn('[RAG v2] Falha ao gerar embedding com Gemini, caindo para busca local.', embedError);
    }
    
    // 2. Fetch from Pinecone (Universal Knowledge) - only server-side
    if (queryEmbedding && typeof window === 'undefined') {
      const pineconeFilters: any = { 
        isApprovedForAI: { '$eq': true },
        status: { '$eq': 'approved' }
      };

      if (config.filters) {
        if (config.filters.docType) pineconeFilters.docType = { '$eq': config.filters.docType };
        if (config.filters.counselor) pineconeFilters.counselor = { '$eq': config.filters.counselor };
        if (config.filters.category) pineconeFilters.category = { '$eq': config.filters.category };
        if (config.filters.funnelStage) pineconeFilters.funnelStage = { '$eq': config.filters.funnelStage };
        if (config.filters.channel) pineconeFilters.channel = { '$eq': config.filters.channel };
        if (config.filters.scope) pineconeFilters.scope = { '$eq': config.filters.scope };
        if (config.filters.tenantId !== undefined) pineconeFilters.tenantId = { '$eq': config.filters.tenantId };
      }

      console.log(`[RAG v2] Consultando Pinecone (namespace: knowledge) com ${Object.keys(pineconeFilters).length} filtros.`);

      try {
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
              metadata: {
                counselor: meta.counselor,
                docType: meta.docType,
                scope: meta.scope,
                channel: meta.channel,
                stage: meta.stage,
                tenantId: meta.tenantId,
                status: meta.status,
                version: meta.version,
                isApprovedForAI: meta.isApprovedForAI,
              },
              source: {
                file: meta.sourceFile || meta.file || 'unknown',
                section: meta.sourceSection || meta.section || 'unknown',
                lineStart: meta.lineStart || 0,
                lineEnd: meta.lineEnd || 0,
              }
            };
          });

          // 5. Reranking (US-1.2.1)
          console.log(`[RAG] Iniciando reranking de ${semanticCandidates.length} candidatos do Pinecone.`);
          let reranked = await rerankDocuments(queryText, semanticCandidates, finalConfig.topK);
          
          // 6. Filtro final por similaridade mínima
          let finalResults = reranked
            .filter(chunk => (chunk.rerankScore ?? chunk.similarity) >= finalConfig.minSimilarity)
            .slice(0, finalConfig.topK)
            .map((chunk, index) => ({ ...chunk, rank: index + 1 }));

          console.log(`[RAG v2] Pinecone search successful in ${Date.now() - startedAt}ms (results: ${finalResults.length})`);
          
          // ST-12.5: Save to cache
          if (finalResults.length > 0) {
            ragCache.set(cacheKey, { chunks: finalResults, timestamp: Date.now() });
          }
          
          return finalResults;
        }
      } catch (pineconeError) {
        console.error('[RAG v2] Erro crítico ao consultar Pinecone.', pineconeError);
      }
    }

    return [];
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
 * Recupera especificamente benchmarks e dados de mercado para o contrato CouncilOutput.
 * 
 * @param queryText - O termo de busca (ex: "CPC médio infoprodutos 2026").
 * @param topK - Número de resultados.
 * @returns Promessa com os chunks de benchmark.
 */
export async function retrieveBenchmarks(
  queryText: string,
  topK = 5
): Promise<RetrievedChunk[]> {
  return retrieveChunks(queryText, {
    topK,
    minSimilarity: 0.2,
    filters: { docType: 'market_data' } // Assume que existe este docType ou similar
  });
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
    const counselorName = chunk.metadata.counselor 
      ? (COUNSELORS_REGISTRY[chunk.metadata.counselor as CounselorId]?.name || chunk.metadata.counselor.replace('_', ' ').toUpperCase())
      : '';
    
    const counselorInfo = counselorName ? `[${counselorName}]` : '';
    const typeInfo = chunk.metadata.docType 
      ? `(${chunk.metadata.docType})` 
      : '';
    
    const scoreInfo = chunk.rerankScore 
      ? `Relevância (Rerank): ${(chunk.rerankScore * 100).toFixed(1)}%`
      : `Relevância: ${(chunk.similarity * 100).toFixed(1)}%`;
    
    return `---
${counselorInfo} ${typeInfo}
Fonte: ${chunk.source.file} > ${chunk.source.section}
${scoreInfo}

${chunk.content}
---`;
  });

  const baseContext = formattedChunks.join('\n\n');
  
  // US-1.5.3: Hint para o LLM usar saída estruturada se houver dados de mercado
  const hasMarketData = chunks.some(c => c.metadata.docType === 'market_data' || c.content.toLowerCase().includes('benchmark'));
  if (hasMarketData) {
    return `${baseContext}\n\n⚠️ DICA DO CONSELHO: Foram encontrados dados de benchmark ou mercado no contexto. Considere emitir uma seção [COUNCIL_OUTPUT] com market_data comparando os valores encontrados com os benchmarks de 2026.`;
  }

  return baseContext;
}

/**
 * Executa uma consulta RAG completa: recupera chunks e os formata em contexto.
 * 
 * @param queryText - A pergunta ou termo de busca.
 * @param config - Opcional: configurações de recuperação.
 * @param intent - Opcional: intenção detectada (US-1.2.2).
 * @returns Uma promessa com os chunks originais e a string de contexto formatada.
 */
export async function ragQuery(
  queryText: string,
  config?: RetrievalConfig,
  intent?: string
): Promise<{ chunks: RetrievedChunk[]; context: string }> {
  const finalConfig: RetrievalConfig = config || { topK: 10, minSimilarity: 0.3 };
  
  // US-1.2.2: Mapeamento Automático de Intenção para Categoria
  if (intent && !finalConfig.filters?.category) {
    const intentMap: Record<string, string> = {
      'copy': 'copywriting',
      'anúncios': 'ads',
      'ads': 'ads',
      'estratégia': 'strategy',
      'funil': 'funnel',
      'social': 'social',
      'redes sociais': 'social'
    };
    
    if (intentMap[intent.toLowerCase()]) {
      finalConfig.filters = {
        ...finalConfig.filters,
        category: intentMap[intent.toLowerCase()]
      };
      console.log(`[RAG] Intenção "${intent}" mapeada para categoria "${finalConfig.filters.category}"`);
    }
  }

  const chunks = await retrieveChunks(queryText, finalConfig);
  
  // ST-12.1: Injeção de Performance se houver assetId no contexto
  if (config?.filters?.tenantId && queryText.toLowerCase().includes('otimizar')) {
    // Nota: Em uma implementação real, o assetId viria do contexto da conversa ou da query.
    // Aqui simulamos a busca se detectarmos a intenção de otimização.
    console.log('[RAG] Detectada intenção de otimização. Buscando métricas de performance...');
  }

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
 * @param filters - Filtros adicionais de metadados (US-1.2.2).
 * @returns Lista de chunks ordenados por similaridade.
 */
export async function searchSimilarChunks(
  brandId: string,
  queryEmbedding: number[],
  limitCount: number = 5,
  filters?: RetrievalConfig['filters']
): Promise<RetrievedBrandChunk[]> {
  try {
    // 1. Tenta Pinecone (Estratégia Principal)
    const pineconeFilters: any = { 
      brandId: { '$eq': brandId }
    };
    
    if (filters?.funnelStage) pineconeFilters.funnelStage = { '$eq': filters.funnelStage };
    if (filters?.channel) pineconeFilters.channel = { '$eq': filters.channel };

    // Usamos namespace brand-{id} ou o ID direto se for o caso. 
    // O worker usa o que for passado no POST. Padronizamos para brand-{id} na UI.
    const namespace = `brand-${brandId}`;

    console.log(`[RAG v2] Consultando Pinecone para Marca: ${namespace}`);

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
    console.error('[RAG v2] Erro crítico na busca Pinecone para marca.', err);
    return [];
  }
}

/**
 * Recupera chunks relevantes dos assets da marca usando busca vetorial.
 * 
 * @param brandId - O ID da marca.
 * @param queryText - O texto da consulta do usuário.
 * @param config - Configurações de recuperação (ou topK para retrocompatibilidade).
 */
export async function retrieveBrandChunks(
  brandId: string,
  queryText: string,
  config: number | RetrievalConfig = 5
): Promise<RetrievedBrandChunk[]> {
  const finalConfig: RetrievalConfig = typeof config === 'number' 
    ? { topK: config, minSimilarity: 0.65 } 
    : config;

  try {
    const startedAt = Date.now();
    const finalConfig: RetrievalConfig = {
      topK: config.topK ?? 10,
      minSimilarity: config.minSimilarity ?? 0.65, // Aumentado para maior precisão
      filters: config.filters,
    };

    // ST-12.5: RAG Caching
    const cacheKey = JSON.stringify({ brandId, queryText, filters: finalConfig.filters });
    const cached = ragCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`[RAG Brand] Cache hit for brand: ${brandId}`);
      return cached.chunks;
    }

    // 1. Gerar embedding para a query
    
    // 2. Buscar por similaridade de cosseno (pedimos 50 para o rerank)
    const candidates = await searchSimilarChunks(brandId, queryEmbedding, 50, finalConfig.filters);
    
    // 3. Reranking (US-1.2.1)
    let results = await rerankDocuments(queryText, candidates, finalConfig.topK);
    
    results.forEach((c, i) => c.rank = i + 1);

    // ST-12.5: Save to cache
    const cacheKey = JSON.stringify({ brandId, queryText, filters: finalConfig.filters });
    if (results.length > 0) {
      ragCache.set(cacheKey, { chunks: results, timestamp: Date.now() });
    }

    return results;
  } catch (error) {
    console.error('Error retrieving brand chunks:', error);
    return [];
  }
}

/**
 * Formata os chunks da marca para injeção no prompt do LLM.
 * Segue o formato especificado na US-15.3 AC-2.
 */
export function formatBrandContextForLLM(chunks: RetrievedBrandChunk[]): string {
  if (chunks.length === 0) return '';

  const formatted = chunks.map(c => {
    const scoreInfo = c.rerankScore 
      ? `Relevância (Rerank): ${(c.rerankScore * 100).toFixed(1)}%`
      : `Relevância: ${(c.similarity * 100).toFixed(1)}%`;

    return `### CONTEXTO DA MARCA (ARQUIVOS)
- Fonte: [${c.assetName}]
- ${scoreInfo}
- Conteúdo: ${c.content}`;
  }).join('\n\n');

  const header = `## CONHECIMENTO EXTRAÍDO DOS ARQUIVOS DA MARCA\n\n${formatted}\n\n⚠️ INSTRUÇÃO CRÍTICA: Se você usar as informações acima, deve citar o nome do arquivo fonte explicitamente (ex: "De acordo com o arquivo [Nome]...").`;
  
  // US-1.5.3: Adiciona hint para ativos da marca
  return `${header}\n\n💡 Se os arquivos da marca contiverem scripts ou ativos prontos, utilize o formato [COUNCIL_OUTPUT] para formatá-los adequadamente.`;
}

