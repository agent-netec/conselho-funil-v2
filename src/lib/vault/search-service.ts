import { generateEmbedding } from '../ai/embeddings';
import { queryVaultVectors } from '../vault/pinecone-vault';
import { getBrandDNA, getVaultAssets } from '../firebase/vault';
import type { CopyDNA, VaultAsset } from '@/types/vault';

/**
 * Interface para resultados da busca no Vault.
 */
export interface VaultSearchResult {
  dna: CopyDNA[];
  assets: VaultAsset[];
}

/**
 * Serviço de Busca Semântica do Vault (ST-16.5)
 */
export class VaultSearchService {
  /**
   * Realiza uma busca semântica global no Vault da marca.
   */
  async search(brandId: string, queryText: string): Promise<VaultSearchResult> {
    console.log(`[VaultSearch] Buscando por: "${queryText}" na marca ${brandId}`);

    // 1. Gerar embedding para a query
    const embedding = await generateEmbedding(queryText);

    // 2. Buscar no Pinecone (DNA e Content)
    const matches = await queryVaultVectors(brandId, embedding, {
      topK: 10
    });

    const dnaIds: string[] = [];
    const contentIds: string[] = [];

    (matches.matches || []).forEach(match => {
      const [prefix, type, id] = match.id.split('_');
      if (type === 'dna') dnaIds.push(id);
      else if (type === 'content') contentIds.push(id);
    });

    // 3. Buscar Assets (Filtragem por Tags/Nome - Firestore por enquanto)
    // Nota: Como assets são arquivos, a busca semântica neles depende de tags ou OCR.
    // Aqui implementamos uma busca por tags baseada na query.
    const allAssets = await getVaultAssets(brandId);
    const filteredAssets = allAssets.filter(asset => 
      asset.name.toLowerCase().includes(queryText.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(queryText.toLowerCase()))
    );

    // 4. Buscar DNAs completos no Firestore
    const allDNA = await getBrandDNA(brandId);
    const filteredDNA = allDNA.filter(dna => dnaIds.includes(dna.id));

    return {
      dna: filteredDNA,
      assets: filteredAssets.slice(0, 5)
    };
  }
}
