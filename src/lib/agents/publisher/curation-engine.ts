import { 
  queryIntelligence, 
  updateIntelligenceDocument 
} from '../firebase/intelligence';
import { 
  getBrandDNA, 
  queryVaultLibrary, 
  saveVaultContent,
  createPublisherJob,
  updatePublisherJob
} from '../firebase/vault';
import { queryVaultVectors } from '../vault/pinecone-vault';
import { generateEmbedding } from '../ai/embeddings';
import { Timestamp } from 'firebase/firestore';
import type { IntelligenceDocument } from '@/types/intelligence';
import type { CopyDNA, VaultContent } from '@/types/vault';
import type { PublisherJob } from '@/types/publisher';

/**
 * Motor de Curadoria de Conteúdo (ST-16.2)
 * Responsável por buscar insights relevantes e cruzá-los com o Copy DNA.
 */
export class ContentCurationEngine {
  /**
   * Executa o ciclo de curadoria para uma marca.
   * Busca insights processados com alta relevância e cria jobs de publicação.
   */
  async runCurationCycle(brandId: string) {
    console.log(`[CurationEngine] Iniciando ciclo para marca: ${brandId}`);

    // 1. Buscar insights processados com relevância > 0.7
    const { documents: insights } = await queryIntelligence({
      brandId,
      status: ['processed'],
      minRelevance: 0.7,
      limit: 10,
      orderBy: 'relevanceScore',
      orderDirection: 'desc'
    });

    if (insights.length === 0) {
      console.log(`[CurationEngine] Nenhum insight relevante encontrado para ${brandId}`);
      return [];
    }

    console.log(`[CurationEngine] Encontrados ${insights.length} insights para processar.`);

    const jobs: string[] = [];

    for (const insight of insights) {
      try {
        const jobId = await this.processInsight(brandId, insight);
        if (jobId) jobs.push(jobId);
      } catch (error) {
        console.error(`[CurationEngine] Erro ao processar insight ${insight.id}:`, error);
      }
    }

    return jobs;
  }

  /**
   * Processa um único insight, encontrando o Copy DNA compatível e criando o job.
   */
  private async processInsight(brandId: string, insight: IntelligenceDocument): Promise<string | null> {
    // 1. Encontrar Copy DNA compatível
    // Estratégia: Busca semântica no Vault usando o resumo do insight
    const insightText = insight.analysis?.summary || insight.content.text;
    const embedding = await generateEmbedding(insightText);
    
    const dnaMatches = await queryVaultVectors(brandId, embedding, {
      topK: 3,
      type: 'dna'
    });

    // Se não houver DNA específico, buscamos os templates genéricos da marca no Firestore
    let selectedDNA: CopyDNA | null = null;
    
    if (dnaMatches.matches && dnaMatches.matches.length > 0) {
      // Pegamos o melhor match do Pinecone e buscamos o doc completo no Firestore (simulado aqui por simplicidade)
      // Em um cenário real, o metadata do Pinecone já teria o necessário ou faríamos um getDoc
      console.log(`[CurationEngine] DNA compatível encontrado via busca vetorial para o insight ${insight.id}`);
    }

    // 2. Criar o PublisherJob
    const jobId = await createPublisherJob(brandId, {
      insightId: insight.id,
      status: 'pending',
      config: {
        platforms: ['X', 'LinkedIn', 'Instagram'], // Default platforms
      },
      errors: []
    });

    // 3. Atualizar o status do insight para indicar que foi encaminhado para curadoria (opcional)
    // await updateIntelligenceDocument(brandId, insight.id, { status: 'archived' }); 

    console.log(`[CurationEngine] Job ${jobId} criado para o insight ${insight.id}`);
    
    return jobId;
  }

  /**
   * Busca os melhores templates de Copy DNA para um determinado contexto.
   */
  async findBestDNA(brandId: string, context: string): Promise<CopyDNA[]> {
    const embedding = await generateEmbedding(context);
    const matches = await queryVaultVectors(brandId, embedding, {
      topK: 5,
      type: 'dna'
    });

    // Mapear matches para o formato CopyDNA (simplificado)
    return (matches.matches || []).map(m => ({
      id: m.id.replace('vault_dna_', ''),
      brandId,
      name: m.metadata?.category || 'Template',
      type: 'template',
      content: m.metadata?.text || '',
      platform_optimization: ['X', 'LinkedIn'],
      tags: m.metadata?.tags || [],
      updatedAt: Timestamp.now()
    } as CopyDNA));
  }
}
