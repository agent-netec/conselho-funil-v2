import { generateWithGemini } from '@/lib/ai/gemini';
import { 
  IntelligenceAnalysis, 
  IntelligenceDocument,
  ICPInsightCategory
} from '@/types/intelligence';
import { 
  AnalystProcessResult, 
  AnalystProcessConfig 
} from '@/types/intelligence-agents';
import { Timestamp } from 'firebase/firestore';

/**
 * Interface para os insights extraídos pelo Analyst
 */
export interface ExtractedICPInsight {
  category: ICPInsightCategory;
  content: string;
  relevance: number;
  reasoning: string;
}

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
   * Analisa um documento individual usando Gemini Flash para extrair metadados e ICP Insights.
   */
  async analyzeDocument(doc: IntelligenceDocument): Promise<{
    analysis: IntelligenceAnalysis;
    extractedInsights: ExtractedICPInsight[];
  }> {
    const prompt = `
      Você é um Especialista em Inteligência de Mercado e Psicologia de Consumo.
      Analise o seguinte conteúdo capturado da web e extraia insights estratégicos sobre o ICP (Ideal Customer Profile).
      
      CONTEÚDO:
      Título: ${doc.content.title || 'N/A'}
      Texto: ${doc.content.text}
      Plataforma: ${doc.source.platform}
      
      TAREFAS:
      1. Analise o sentimento e emoções.
      2. Extraia palavras-chave (keywords) do nicho.
      3. Identifique ICP Insights nas categorias:
         - 'pain' (Dores/Problemas): O que tira o sono do cliente?
         - 'desire' (Desejos/Sonhos): O que ele realmente quer alcançar?
         - 'objection' (Objeções): Por que ele hesita em comprar?
         - 'vocabulary' (Vocabulário): Expressões, gírias ou termos específicos que ele usa.
         - 'trend' (Tendências): Mudanças de comportamento ou novos interesses.

      REGRAS DE EXTRAÇÃO:
      - Extraia apenas o que for explicitamente mencionado ou fortemente inferido.
      - Para 'vocabulary', foque em termos que demonstram autoridade ou pertencimento ao nicho.
      - Atribua um score de relevância (0.0 a 1.0) para cada insight.

      FORMATO DE SAÍDA (JSON ESTRITAMENTE):
      {
        "analysis": {
          "sentiment": "positive" | "negative" | "neutral",
          "sentimentScore": número (-1.0 a 1.0),
          "sentimentConfidence": número (0.0 a 1.0),
          "emotion": "alegria" | "raiva" | "confusão" | "tristeza" | "medo" | "surpresa" | "neutro",
          "emotionIntensity": número (0.0 a 1.0),
          "keywords": ["até 10 keywords"],
          "summary": "resumo de até 200 caracteres",
          "relevanceScore": número (0.0 a 1.0)
        },
        "extractedInsights": [
          {
            "category": "pain" | "desire" | "objection" | "vocabulary" | "trend",
            "content": "descrição curta do insight",
            "relevance": número (0.0 a 1.0),
            "reasoning": "por que este insight é importante?"
          }
        ]
      }
    `;

    try {
      const response = await generateWithGemini(prompt, {
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        temperature: 0.1, // Baixa temperatura para extração mais factual
        responseMimeType: 'application/json',
      });

      const result = JSON.parse(response);

      const analysis: IntelligenceAnalysis = {
        ...result.analysis,
        matchedBrandKeywords: [],
        analyzedBy: 'gemini-flash',
        analyzedAt: Timestamp.now(),
      };

      return {
        analysis,
        extractedInsights: result.extractedInsights || []
      };
    } catch (error) {
      console.error(`[Analyst] Erro ao analisar documento ${doc.id}:`, error);
      throw error;
    }
  }

  /**
   * Processa um lote de documentos. (Mantido para compatibilidade, mas recomenda-se usar o orquestrador)
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
        const { analysis } = await this.analyzeDocument(doc);
        
        docsProcessed++;
        sentimentDistribution[analysis.sentiment]++;
        analysis.keywords.forEach(kw => {
          keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
        });
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

