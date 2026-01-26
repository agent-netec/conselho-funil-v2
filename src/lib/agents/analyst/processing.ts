import { AnalystAgent } from './analyst-agent';
import { 
  queryIntelligence, 
  updateIntelligenceDocument,
  getBrandKeywordsConfig 
} from '@/lib/firebase/intelligence';
import { Timestamp } from 'firebase/firestore';

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
    limit: 10, // Processar em pequenos lotes para evitar timeouts
  });

  if (pending.documents.length === 0) {
    console.log(`[Analyst] Nenhum documento pendente para a marca ${brandId}`);
    return { docsProcessed: 0 };
  }

  // 2. Buscar keywords da marca para cálculo de relevância e match
  const brandConfig = await getBrandKeywordsConfig(brandId);
  const brandKeywords = brandConfig?.keywords.map(k => k.term.toLowerCase()) || [];

  let processedCount = 0;

  // 3. Processar cada documento
  for (const doc of pending.documents) {
    try {
      // Marcar como processando para evitar duplicidade em execuções paralelas
      await updateIntelligenceDocument(brandId, doc.id, { 
        status: 'processing' 
      });

      const analysis = await analyst.analyzeDocument(doc);
      
      // Encontrar matches com as keywords da marca
      const matchedBrandKeywords = analysis.keywords.filter(kw => 
        brandKeywords.some(bk => kw.toLowerCase().includes(bk) || bk.includes(kw.toLowerCase()))
      );

      // Atualizar documento com a análise e status final
      await updateIntelligenceDocument(brandId, doc.id, {
        status: 'processed',
        analysis: {
          ...analysis,
          matchedBrandKeywords,
        },
        processedAt: Timestamp.now(),
      });

      processedCount++;
    } catch (error) {
      console.error(`[Analyst] Falha ao processar doc ${doc.id}:`, error);
      
      // Reverter status para erro
      await updateIntelligenceDocument(brandId, doc.id, { 
        status: 'error' 
      });
    }
  }

  return {
    brandId,
    docsProcessed: processedCount,
    totalPendingRemaining: pending.total - processedCount,
  };
}
