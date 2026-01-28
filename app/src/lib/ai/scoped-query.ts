/**
 * @fileoverview Query em múltiplos namespaces Pinecone respeitando a hierarquia
 * @module lib/ai/scoped-query
 * @version 1.0.0
 */

import { getPineconeIndex } from './pinecone';
import { getAccessibleNamespaces, ScopeLevel } from '@/types/scoped-data';

export interface ScoredVector {
  id: string;
  score?: number;
  values?: number[];
  metadata?: {
    scopeLevel: ScopeLevel;
    brandId?: string;
    funnelId?: string;
    campaignId?: string;
    inheritToChildren: boolean;
    dataType: string;
    content: string;
    title?: string;
    isApprovedForAI: boolean;
    [key: string]: any;
  };
}

export interface ScopedQueryOptions {
  brandId: string;
  funnelId?: string;
  campaignId?: string;
  query?: string;
  vector?: number[];
  topK?: number;
  includeInherited?: boolean;      // Default: true
  filter?: Record<string, unknown>;
}

export interface ScopedQueryResult {
  byNamespace: Map<string, ScoredVector[]>;
  namespaceOrder: string[];        // Ordem de prioridade
}

/**
 * Executa query em múltiplos namespaces respeitando hierarquia
 */
export async function queryScopedNamespaces(
  options: ScopedQueryOptions
): Promise<ScopedQueryResult> {
  const {
    brandId,
    funnelId,
    campaignId,
    vector,
    topK = 10,
    includeInherited = true,
    filter = {},
  } = options;

  if (!vector) {
    throw new Error('Vector is required for scoped query');
  }
  
  // Obter namespaces acessíveis (específico -> geral)
  const namespaces = getAccessibleNamespaces(brandId, funnelId, campaignId);
  
  const index = await getPineconeIndex();
  if (!index) {
    throw new Error('Pinecone index not available');
  }

  const results: Map<string, ScoredVector[]> = new Map();
  
  // Query em cada namespace em paralelo
  await Promise.all(namespaces.map(async (namespace) => {
    const namespaceFilter: Record<string, any> = {
      ...filter,
      isApprovedForAI: true,
    };
    
    // Se não é o namespace mais específico, filtrar por inheritToChildren
    // O namespace mais específico é o primeiro da lista retornada por getAccessibleNamespaces
    const isMostSpecificNamespace = namespace === namespaces[0];
    
    if (!isMostSpecificNamespace && includeInherited) {
      namespaceFilter.inheritToChildren = true;
    }
    
    try {
      const response = await index.namespace(namespace).query({
        vector,
        topK,
        filter: namespaceFilter,
        includeMetadata: true,
      });
      
      results.set(namespace, (response.matches as unknown as ScoredVector[]) || []);
    } catch (error) {
      console.error(`Error querying namespace \${namespace}:`, error);
      results.set(namespace, []);
    }
  }));
  
  return {
    byNamespace: results,
    namespaceOrder: namespaces,
  };
}
