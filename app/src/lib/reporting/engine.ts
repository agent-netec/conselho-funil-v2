import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '../ai/gemini';
import { anonymizeDataForAI } from './anonymizer';

export interface ReportMetrics {
  adSpend: number;
  revenue: number;
  roi: number;
  ltvMaturation: number;
  period: {
    start: string;
    end: string;
  };
}

export interface AIAnalysisResult {
  summary: string;
  insights: string[];
  recommendations: string[];
  confidenceScore: number;
}

/**
 * AI Reporting Engine
 * Responsible for translating raw performance data into strategic narratives
 */
export class ReportingEngine {
  private model = DEFAULT_GEMINI_MODEL;

  /**
   * Generates a strategic report narrative using Gemini
   */
  async generateReport(
    metrics: ReportMetrics,
    context: { agencyName: string; clientName: string; offerDetails?: string }
  ): Promise<AIAnalysisResult> {
    // 1. Anonymize sensitive context
    const anonymizedContext = anonymizeDataForAI(context);
    
    // 2. Build the prompt
    const prompt = this.buildReportPrompt(metrics, anonymizedContext);

    try {
      // 3. Call Gemini
      const response = await generateWithGemini(prompt, {
        model: this.model,
        temperature: 0.3, // Lower temperature for factual reporting
        responseMimeType: 'application/json',
      });

      // 4. Parse and return
      const result = JSON.parse(response);
      return {
        summary: result.summary || '',
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        confidenceScore: result.confidenceScore || 0.85,
      };
    } catch (error) {
      console.error('[ReportingEngine] Error generating AI report:', error);
      throw new Error('Failed to generate AI report narrative');
    }
  }

  private buildReportPrompt(metrics: ReportMetrics, context: any): string {
    return `Você é um Analista de Performance Sênior do "Conselho de Funil".
Sua tarefa é gerar um resumo executivo e insights estratégicos para um cliente com base nos dados de performance abaixo.

## Contexto
- Agência: ${context.agencyName}
- Cliente: ${context.clientName}
- Oferta: ${context.offerDetails || 'Não especificada'}
- Período: ${metrics.period.start} até ${metrics.period.end}

## Métricas de Performance
- Investimento (Ad Spend): R$ ${metrics.adSpend.toFixed(2)}
- Receita (Revenue): R$ ${metrics.revenue.toFixed(2)}
- ROI: ${metrics.roi.toFixed(2)}x
- Maturação de LTV (LTV Maturation): ${metrics.ltvMaturation.toFixed(2)}%

## Instruções de Saída
Gere a resposta EXCLUSIVAMENTE em formato JSON com a seguinte estrutura:
{
  "summary": "Um parágrafo narrativo traduzindo os números em performance de negócio (tom profissional e direto).",
  "insights": ["Lista de 3-5 observações baseadas nos dados"],
  "recommendations": ["Lista de 2-3 ações recomendadas para a próxima semana"],
  "confidenceScore": 0.95
}

## Diretrizes de Escrita
- Use português brasileiro profissional.
- Não invente dados.
- Se o ROI estiver abaixo de 2.0, seja cauteloso e sugira otimização.
- Se o ROI estiver acima de 5.0, sugira escala moderada.
- Relacione a Maturação de LTV com a saúde do funil a longo prazo.`;
  }
}

export const reportingEngine = new ReportingEngine();
