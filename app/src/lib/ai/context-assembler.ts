/**
 * @fileoverview Context Assembler v2 - Monta contexto hierárquico para Conselheiros
 * @module lib/ai/context-assembler
 * @version 2.0.0
 */

import { getPineconeIndex } from './pinecone';
import { generateEmbedding } from './embeddings';
import { db } from '@/lib/firebase/config';
import { 
  AssembledContext, 
  AssembleContextInput, 
  ContextAssemblerConfig, 
  DEFAULT_CONFIG, 
  NAMESPACE_PRIORITY, 
  DATA_TYPE_BOOST,
  TaskType,
  CounselorKnowledge,
  BrandContext,
  ICPInsightsContext,
  TemplateContext,
  TrendContext,
  AssetContext
} from '@/types/context';
import { ICPInsight, VoiceProfile } from '@/types/intelligence';
import { MergedChunk, RetrievedChunk } from '@/types/retrieval';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

export { DEFAULT_CONFIG };
export type { AssembleContextInput, AssembledContext };

/**
 * Context Assembler v2
 */
export class ContextAssembler {
  private config: ContextAssemblerConfig;
  
  constructor(config: Partial<ContextAssemblerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  
  /**
   * Monta contexto completo para o conselheiro
   */
  async assembleContext(input: AssembleContextInput): Promise<AssembledContext> {
    const startTime = Date.now();
    const warnings: string[] = [];
    
    // Merge config com override
    const config = { ...this.config, ...input.configOverride };
    
    // 1. Gerar embedding da query
    const queryEmbedding = await generateEmbedding(input.userQuery);
    
    // 2. Determinar namespaces a consultar
    const namespaces = this.getNamespacesToQuery(input);
    
    // 3. Query paralela em todos os namespaces (com timeout)
    const queryResults = await this.queryAllNamespaces(
      queryEmbedding,
      namespaces,
      input,
      config
    );
    
    // 4. Merge e deduplicação
    const mergedChunks = this.mergeAndDeduplicate(queryResults, config);
    
    // 5. Buscar dados estruturados (Firestore)
    const [brandContext, icpInsights, voiceProfile] = await Promise.all([
      this.fetchBrandContext(input.brandId),
      this.fetchICPInsights(input.brandId, input.funnelId),
      this.fetchVoiceProfile(input.brandId, input.funnelId),
    ]);
    
      // 6. Organizar por categoria e truncar
    const organized = this.organizeAndTruncate(mergedChunks, input, config.maxContextTokens);
    
    // 7. Deduplicação de Sentimentos (ST-16.5 AC-3)
    organized.trends = this.consolidateTrends(organized.trends);
    
    // 8. Montar resultado final
    const assemblyTime = Date.now() - startTime;
    
    if (assemblyTime > config.timeoutMs) {
      warnings.push(`Assembly took \${assemblyTime}ms (budget: \${config.timeoutMs}ms)`);
    }
    
    return {
      counselorKnowledge: organized.counselorKnowledge,
      brandContext,
      icpInsights,
      voiceProfile,
      relevantTemplates: organized.templates,
      trends: organized.trends,
      relevantAssets: organized.assets,
      metadata: config.includeDebugMetadata ? {
        assemblyTimeMs: assemblyTime,
        namespacesQueried: namespaces.map(n => n.namespace),
        chunksRetrieved: queryResults.totalChunks,
        chunksAfterDedup: mergedChunks.length,
        chunksAfterTruncation: organized.totalChunks,
        tokenCount: organized.tokenCount,
        warnings,
      } : undefined,
    };
  }
  
  private getNamespacesToQuery(input: AssembleContextInput): NamespaceQuery[] {
    const { brandId, funnelId, campaignId, counselorId, taskType } = input;
    const queries: NamespaceQuery[] = [];
    
    queries.push({
      namespace: 'universal',
      filter: { counselorId, dataType: 'counselor_knowledge' },
      priority: NAMESPACE_PRIORITY['universal'],
    });
    
    queries.push({
      namespace: 'templates',
      filter: { templateType: this.getTemplateTypeForTask(taskType) },
      priority: NAMESPACE_PRIORITY['templates'],
    });
    
    queries.push({
      namespace: `brand_\${brandId}`,
      filter: { isApprovedForAI: true },
      priority: NAMESPACE_PRIORITY['brand'],
    });
    
    queries.push({
      namespace: `intelligence_\${brandId}`,
      filter: { isApprovedForAI: true },
      priority: NAMESPACE_PRIORITY['intelligence'],
    });
    
    if (funnelId) {
      queries.push({
        namespace: `context_\${brandId}_funnel_\${funnelId}`,
        filter: { isApprovedForAI: true },
        priority: NAMESPACE_PRIORITY['context_funnel'],
      });
    }
    
    if (campaignId) {
      queries.push({
        namespace: `context_\${brandId}_campaign_\${campaignId}`,
        filter: { isApprovedForAI: true },
        priority: NAMESPACE_PRIORITY['context_campaign'],
      });
    }
    
    return queries.sort((a, b) => b.priority - a.priority);
  }
  
  private async queryAllNamespaces(
    embedding: number[],
    namespaces: NamespaceQuery[],
    input: AssembleContextInput,
    config: ContextAssemblerConfig
  ): Promise<NamespaceQueryResults> {
    const index = await getPineconeIndex();
    const results: Map<string, RetrievedChunk[]> = new Map();
    let totalChunks = 0;
    
    if (!index) throw new Error('Pinecone index not available');

    const queryPromises = namespaces.map(async (nsQuery) => {
      try {
        const response = await Promise.race([
          index.namespace(nsQuery.namespace).query({
            vector: embedding,
            topK: config.maxChunksPerNamespace,
            filter: nsQuery.filter,
            includeMetadata: true,
          }),
          this.timeout(config.timeoutMs)
        ]);
        
        if (response && 'matches' in response) {
          const chunks = (response.matches || []).map(match => ({
            id: match.id,
            content: (match.metadata as any)?.content || '',
            score: match.score || 0,
            namespace: nsQuery.namespace,
            metadata: match.metadata as any,
            namespacePriority: nsQuery.priority,
          }));
          results.set(nsQuery.namespace, chunks);
          totalChunks += chunks.length;
        }
      } catch (error) {
        console.warn(`Failed to query namespace \${nsQuery.namespace}:`, error);
        results.set(nsQuery.namespace, []);
      }
    });
    
    await Promise.all(queryPromises);
    return { byNamespace: results, totalChunks };
  }
  
  private mergeAndDeduplicate(
    queryResults: NamespaceQueryResults,
    config: ContextAssemblerConfig
  ): MergedChunk[] {
    const allChunks: MergedChunk[] = [];
    
    for (const [namespace, chunks] of queryResults.byNamespace) {
      for (const chunk of chunks) {
        const dataType = chunk.metadata.dataType || 'default';
        const boost = DATA_TYPE_BOOST[dataType] || DATA_TYPE_BOOST['default'];
        
        allChunks.push({
          ...chunk,
          namespacePriority: (chunk as any).namespacePriority,
          finalScore: chunk.score * ((chunk as any).namespacePriority / 100) * boost,
        });
      }
    }
    
    allChunks.sort((a, b) => b.finalScore - a.finalScore);
    
    const deduplicated: MergedChunk[] = [];
    for (const chunk of allChunks) {
      const isDuplicate = deduplicated.some(existing => 
        this.calculateContentSimilarity(existing.content, chunk.content) > config.deduplicationThreshold
      );
      if (!isDuplicate) deduplicated.push(chunk);
    }
    
    return deduplicated;
  }
  
  private calculateContentSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private async fetchBrandContext(brandId: string): Promise<BrandContext> {
    const brandDoc = await getDocs(query(collection(db, 'brands'), where('id', '==', brandId), limit(1)));
    if (brandDoc.empty) return { brandId, brandName: 'Unknown Brand' };
    const data = brandDoc.docs[0].data();
    return {
      brandId,
      brandName: data.name || 'Unknown Brand',
      industry: data.industry,
      targetAudience: data.targetAudience,
      brandKit: data.brandKit
    };
  }

  private async fetchICPInsights(brandId: string, funnelId?: string): Promise<ICPInsightsContext> {
    const insights: ICPInsight[] = [];
    let fromFunnel = 0;
    let fromBrand = 0;
    
    const brandQuery = query(
      collection(db, 'brands', brandId, 'icp_insights'),
      where('scope.level', '==', 'brand'),
      where('isApprovedForAI', '==', true),
      limit(20)
    );
    const brandSnap = await getDocs(brandQuery);
    brandSnap.forEach(doc => {
      insights.push({ id: doc.id, ...doc.data() } as ICPInsight);
      fromBrand++;
    });

    if (funnelId) {
      const funnelQuery = query(
        collection(db, 'brands', brandId, 'icp_insights'),
        where('scope.level', '==', 'funnel'),
        where('scope.funnelId', '==', funnelId),
        where('isApprovedForAI', '==', true),
        limit(20)
      );
      const funnelSnap = await getDocs(funnelQuery);
      funnelSnap.forEach(doc => {
        insights.push({ id: doc.id, ...doc.data() } as ICPInsight);
        fromFunnel++;
      });
    }

    return {
      pains: insights.filter(i => i.category === 'pain').map(i => i.content),
      desires: insights.filter(i => i.category === 'desire').map(i => i.content),
      objections: insights.filter(i => i.category === 'objection').map(i => i.content),
      vocabulary: insights.filter(i => i.category === 'vocabulary').map(i => i.content),
      sourceSummary: `\${insights.length} insights from \${new Set(insights.flatMap(i => i.sources.map(s => s.platform))).size} sources`,
      totalInsights: insights.length,
      scopeBreakdown: { fromFunnel, fromBrand }
    };
  }

  private async fetchVoiceProfile(brandId: string, funnelId?: string): Promise<VoiceProfile | null> {
    if (funnelId) {
      const q = query(
        collection(db, 'brands', brandId, 'voice_profiles'),
        where('scope.level', '==', 'funnel'),
        where('scope.funnelId', '==', funnelId),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) return { id: snap.docs[0].id, ...snap.docs[0].data() } as VoiceProfile;
    }

    const qBrand = query(
      collection(db, 'brands', brandId, 'voice_profiles'),
      where('scope.level', '==', 'brand'),
      where('isDefault', '==', true),
      limit(1)
    );
    const snapBrand = await getDocs(qBrand);
    if (!snapBrand.empty) return { id: snapBrand.docs[0].id, ...snapBrand.docs[0].data() } as VoiceProfile;

    return null;
  }

  private organizeAndTruncate(chunks: MergedChunk[], input: AssembleContextInput, maxTokens: number) {
    // ... (rest of the method remains similar, but we ensure order Trends > Comments)
    // ...
  }

  /**
   * Consolida tendências similares para evitar poluição (ST-16.5 AC-3)
   */
  private consolidateTrends(trends: TrendContext[]): TrendContext[] {
    const consolidated: Map<string, TrendContext> = new Map();
    
    for (const trend of trends) {
      const key = trend.topic.toLowerCase().trim();
      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        existing.relevance = Math.max(existing.relevance, trend.relevance);
        // Mantém o mais recente
        if (trend.capturedAt > existing.capturedAt) {
          existing.capturedAt = trend.capturedAt;
        }
      } else {
        consolidated.set(key, { ...trend });
      }
    }
    
    return Array.from(consolidated.values())
      .sort((a, b) => b.relevance - a.relevance);
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms));
  }

  private getTemplateTypeForTask(taskType: TaskType): string {
    const mapping: Record<TaskType, string> = {
      'create_funnel': 'funnel',
      'create_copy': 'copy',
      'create_ads': 'ads',
      'analyze_competitor': 'analysis',
      'optimize_campaign': 'optimization',
      'general_advice': 'general',
    };
    return mapping[taskType] || 'general';
  }
}

interface NamespaceQuery {
  namespace: string;
  filter: Record<string, unknown>;
  priority: number;
}

interface NamespaceQueryResults {
  byNamespace: Map<string, RetrievedChunk[]>;
  totalChunks: number;
}
