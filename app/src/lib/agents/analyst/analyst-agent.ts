import { generateWithGemini } from '@/lib/ai/gemini';
import { 
  IntelligenceAnalysis, 
  IntelligenceDocument 
} from '@/types/intelligence';
import { 
  AnalystProcessResult, 
  AnalystProcessConfig 
} from '@/types/intelligence-agents';
import { Timestamp } from 'firebase/firestore';

/**
 * Agente Analyst responsável por processar documentos de inteligência.
 */
export class AnalystAgent {
  private config: AnalystProcessConfig;

  constructor(config?: Partial<AnalystProcessConfig>) {
    this.config = {
      sentimentModel: 'gemini-flash',
      extractKeywords: true,
      maxKeywordsPerDoc: 10,
      generateSummary: true,
      summaryMaxLength: 200,
      batchSize: 5,
      maxConcurrent: 2,
      ...config,
    };
  }

  /**
   * Analisa um documento individual usando Gemini Flash.
   */
  async analyzeDocument(doc: IntelligenceDocument): Promise<IntelligenceAnalysis> {
    const prompt = `
      Analise o seguinte conteúdo de inteligência de mercado e retorne um JSON estritamente no formato abaixo.
      Identifique sentimentos, emoções predominantes e intenção.
      
      Conteúdo:
      Título: ${doc.content.title || 'N/A'}
      Texto: ${doc.content.text}
      Plataforma: ${doc.source.platform}
      
      Formato de Saída (JSON):
      {
        "sentiment": "positive" | "negative" | "neutral",
        "sentimentScore": número entre -1.0 e 1.0,
        "sentimentConfidence": número entre 0.0 e 1.0,
        "emotion": "alegria" | "raiva" | "confusão" | "tristeza" | "medo" | "surpresa" | "neutro",
        "emotionIntensity": número entre 0.0 e 1.0,
        "keywords": ["array de até 10 keywords relevantes"],
        "summary": "resumo de até 200 caracteres",
        "relevanceScore": número entre 0.0 e 1.0,
        "trendSpotting": ["possíveis tendências ou tópicos quentes citados"]
      }
    `;

    try {
      const response = await generateWithGemini(prompt, {
        model: 'gemini-2.0-flash-exp',
        temperature: 0.2,
        responseMimeType: 'application/json',
      });

      const analysis = JSON.parse(response);

      return {
        ...analysis,
        matchedBrandKeywords: [], // Será preenchido pelo orquestrador comparando com as keywords da marca
        analyzedBy: 'gemini-flash',
        analyzedAt: Timestamp.now(),
      } as any; // Cast temporário para acomodar novos campos de emoção no schema se necessário
    } catch (error) {
      console.error(`[Analyst] Erro ao analisar documento ${doc.id}:`, error);
      throw error;
    }
  }

  /**
   * Processa um lote de documentos.
   */
  async processBatch(
    brandId: string, 
    documents: IntelligenceDocument[]
  ): Promise<AnalystProcessResult> {
    const startTime = Date.now();
    let docsProcessed = 0;
    let docsFailed = 0;
    const sentimentDistribution = { positive: 0, negative: 0, neutral: 0 };
    const keywordCounts: Record<string, number> = {};

    for (const doc of documents) {
      try {
        const analysis = await this.analyzeDocument(doc);
        
        // Atualizar estatísticas
        docsProcessed++;
        sentimentDistribution[analysis.sentiment]++;
        analysis.keywords.forEach(kw => {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        });

        // Aqui o orquestrador deve atualizar o Firestore
        // (Isso será feito no orquestrador principal para manter separação de responsabilidades)
        
      } catch (err) {
        docsFailed++;
      }
    }

    const topKeywords = Object.entries(keywordCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      brandId,
      docsProcessed,
      docsSkipped: 0,
      docsFailed,
      averageProcessingTimeMs: (Date.now() - startTime) / (docsProcessed || 1),
      sentimentDistribution,
      topKeywords,
    };
  }
}
