import { CohereClient } from 'cohere-ai';

const cohere = new CohereClient({
  token: (process.env.COHERE_API_KEY || '').trim(),
});

/**
 * Interface para objetos que podem ser reordenados.
 */
export interface Rerankable {
  content: string;
  rerankScore?: number;
}

/**
 * Reordena uma lista de documentos usando a API do Cohere Rerank.
 * 
 * @param query - A consulta original do usuário.
 * @param documents - Array de documentos/chunks a serem reordenados.
 * @param topN - Número de documentos a retornar após o reranking.
 * @returns Array reordenado com os scores de reranking aplicados.
 */
export async function rerankDocuments<T extends Rerankable>(
  query: string,
  documents: T[],
  topN: number = 5
): Promise<T[]> {
  if (documents.length === 0) return [];
  
  // Se não houver chave de API, retorna a ordem original (fallback)
  if (!process.env.COHERE_API_KEY) {
    console.warn('[Rerank] COHERE_API_KEY não configurada. Usando ordem original.');
    return documents.slice(0, topN);
  }

  try {
    const response = await cohere.rerank({
      query,
      documents: documents.map(doc => doc.content),
      topN: topN,
      model: 'rerank-multilingual-v3.0',
    });

    // Mapeia os resultados de volta para os objetos originais, injetando o score
    const reranked = response.results.map((result) => {
      const originalDoc = documents[result.index];
      return {
        ...originalDoc,
        rerankScore: result.relevanceScore,
      };
    });

    return reranked;
  } catch (error) {
    console.error('[Rerank] Erro ao chamar API do Cohere:', error);
    // Fallback: Retorna os primeiros documentos na ordem original
    return documents.slice(0, topN);
  }
}
