import { upsertToPinecone, queryPinecone } from './pinecone';
import { type PineconeRecord } from '@pinecone-database/pinecone';

/**
 * Interface para os metadados do Vault no Pinecone.
 */
export interface VaultVectorMetadata {
  brandId: string;
  type: 'dna' | 'content';
  category: string;
  tags: string[];
  text: string;
  [key: string]: any;
}

/**
 * Namespace format para o Vault.
 */
export function getVaultNamespace(brandId: string): string {
  return `vault_${brandId}`;
}

/**
 * Salva um vetor de DNA ou Conteúdo no Pinecone.
 */
export async function upsertVaultVector(
  brandId: string,
  id: string,
  values: number[],
  metadata: VaultVectorMetadata
) {
  const record: PineconeRecord = {
    id: `vault_${metadata.type}_${id}`,
    values,
    metadata,
  };

  return await upsertToPinecone([record], {
    namespace: getVaultNamespace(brandId),
  });
}

/**
 * Busca semântica no Vault da marca.
 */
export async function queryVaultVectors(
  brandId: string,
  vector: number[],
  options: {
    topK?: number;
    type?: 'dna' | 'content';
    category?: string;
    filter?: Record<string, any>;
  } = {}
) {
  const filter: Record<string, any> = { ...options.filter };
  
  if (options.type) {
    filter.type = options.type;
  }
  
  if (options.category) {
    filter.category = options.category;
  }

  return await queryPinecone({
    vector,
    topK: options.topK || 5,
    namespace: getVaultNamespace(brandId),
    filter: Object.keys(filter).length > 0 ? filter : undefined,
  });
}
