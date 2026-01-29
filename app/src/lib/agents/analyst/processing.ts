import { AnalystAgent, ExtractedICPInsight } from './analyst-agent';
import { 
  queryIntelligence, 
  updateIntelligenceDocument,
  getBrandKeywordsConfig 
} from '@/lib/firebase/intelligence';
import { createScopedData } from '@/lib/firebase/scoped-data';
import { Timestamp } from 'firebase/firestore';
import { ICPInsight } from '@/types/intelligence';

/**
 * Configurações de Governança
 */
const GOVERNANCE_CONFIG = {
  AUTO_APPROVAL_THRESHOLD: 0.7,
  RAW_DATA_TTL_DAYS: 30,
  PROCESSED_DATA_TTL_DAYS: 90,
};

/**
 * Orquestrador do processo de análise (Analyst Agent).
 * Processa documentos com status 'raw' para a marca especificada.
 */
export async function runAnalystProcessing(brandId: string) {
  const analyst = new AnalystAgent();
  
  // 1. Buscar documentos pendentes (status 'raw')
  const pending = await queryIntelligence({
    brandId,
    status: ['raw'],
    limit: 10,
  });

  if (pending.documents.length === 0) {
    return { docsProcessed: 0 };
  }

  // 2. Buscar keywords da marca para cálculo de relevância e match
  const brandConfig = await getBrandKeywordsConfig(brandId);
  const brandKeywords = brandConfig?.keywords.map(k => k.term.toLowerCase()) || [];

  let processedCount = 0;
  let insightsCreated = 0;

  // 3. Processar cada documento
  for (const doc of pending.documents) {
    try {
      await updateIntelligenceDocument(brandId, doc.id, { 
        status: 'processing' 
      });

      const { analysis, extractedInsights } = await analyst.analyzeDocument(doc);
      
      // Encontrar matches com as keywords da marca
      const matchedBrandKeywords = analysis.keywords.filter(kw => 
        brandKeywords.some(bk => kw.toLowerCase().includes(bk) || bk.includes(kw.toLowerCase()))
      );

      // 4. Governança e Extração de Insights
      const processedAnalysis = {
        ...analysis,
        matchedBrandKeywords,
      };

      // Criar ICP Insights a partir das extrações
      for (const extracted of extractedInsights) {
        // Só cria insight se a relevância for alta o suficiente
        if (extracted.relevance >= 0.5) {
          const isAutoApproved = extracted.relevance >= GOVERNANCE_CONFIG.AUTO_APPROVAL_THRESHOLD;
          
          const insightData: Omit<ICPInsight, 'id'> = {
            scope: {
              level: 'brand',
              brandId: brandId
            },
            inheritToChildren: true,
            category: extracted.category,
            content: extracted.content,
            frequency: 1,
            sentiment: analysis.sentimentScore,
            sources: [{
              platform: doc.source.platform,
              url: doc.content.originalUrl || '',
              collectedAt: doc.collectedAt,
              snippet: doc.content.text.substring(0, 200)
            }],
            isApprovedForAI: isAutoApproved,
            relevanceScore: extracted.relevance,
            approvedBy: isAutoApproved ? 'auto' : undefined,
            approvedAt: isAutoApproved ? Timestamp.now() : undefined,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
            expiresAt: Timestamp.fromMillis(Date.now() + GOVERNANCE_CONFIG.PROCESSED_DATA_TTL_DAYS * 24 * 60 * 60 * 1000)
          };

          await createScopedData<ICPInsight>(
            'icp_insights',
            brandId,
            insightData,
            { syncToPinecone: isAutoApproved, dataType: 'icp_insight' }
          );
          
          insightsCreated++;
        }
      }

      // 5. Atualizar documento original com a análise e TTL
      const expiresAt = Timestamp.fromMillis(Date.now() + GOVERNANCE_CONFIG.RAW_DATA_TTL_DAYS * 24 * 60 * 60 * 1000);

      await updateIntelligenceDocument(brandId, doc.id, {
        status: 'processed',
        analysis: processedAnalysis,
        processedAt: Timestamp.now(),
        expiresAt: expiresAt, // TTL para dados brutos
      });

      processedCount++;
    } catch (error) {
      console.error(`[Analyst] Falha ao processar doc ${doc.id}:`, error);
      await updateIntelligenceDocument(brandId, doc.id, { 
        status: 'error' 
      });
    }
  }

  return {
    brandId,
    docsProcessed: processedCount,
    insightsCreated,
    totalPendingRemaining: pending.total - processedCount,
  };
}
