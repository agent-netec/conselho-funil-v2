import { generateWithGemini, DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';
import { AutopsyReport, AutopsyRunRequest, HeuristicResult, Recommendation } from '@/types/autopsy';

/**
 * Motor de Diagnóstico Forense (Funnel Autopsy Engine)
 * Versão 2.0 - Integrado com Gemini 2.0 Flash e Heurísticas Wilder.
 */
export class AutopsyEngine {
  /**
   * Executa a análise heurística do conteúdo capturado.
   */
  static async analyzeContent(
    url: string,
    scrapedContent: string,
    request: AutopsyRunRequest,
    metadata: { loadTimeMs: number; techStack: string[]; screenshotUrl?: string }
  ): Promise<AutopsyReport> {
    const prompt = this.buildAnalysisPrompt(scrapedContent, request.context);

    // US-22.01: Limitar conteúdo para evitar estouro de contexto e timeout
    const maxChars = 30000; 
    const limitedContent = scrapedContent.length > maxChars 
      ? scrapedContent.substring(0, maxChars) + '... [Conteúdo truncado para análise]'
      : scrapedContent;

    const responseText = await generateWithGemini(this.buildAnalysisPrompt(limitedContent, request.context), {
      model: DEFAULT_GEMINI_MODEL,
      temperature: 0.2,
      responseMimeType: 'application/json',
    });

    try {
      const analysis = JSON.parse(responseText);
      
      return {
        score: analysis.score,
        summary: analysis.summary,
        heuristics: analysis.heuristics,
        recommendations: analysis.recommendations,
        metadata: {
          ...metadata,
          screenshotUrl: metadata.screenshotUrl,
        },
      };
    } catch (error) {
      console.error('[AUTOPSY_ENGINE_PARSE_ERROR]:', error, responseText);
      throw new Error('Falha ao processar a análise heurística do Gemini.');
    }
  }

  /**
   * Constrói o prompt para o Gemini 2.0 Flash baseado nos playbooks do Wilder.
   */
  private static buildAnalysisPrompt(content: string, context?: AutopsyRunRequest['context']): string {
    return `
Você é o Analista Forense do Conselho de Funil. Sua missão é realizar uma autópsia detalhada em uma página de vendas/funil.
Baseie sua análise nos playbooks de conversão e psicologia de vendas.

CONTEÚDO DA PÁGINA:
---
${content}
---

CONTEXTO ADICIONAL:
Público-alvo: ${context?.targetAudience || 'Não informado'}
Oferta Principal: ${context?.mainOffer || 'Não informada'}

DIRETRIZES DE ANÁLISE (Heurísticas Wilder):
1. Hook (Gancho): A headline captura a atenção em < 5s? É específica e resolve uma dor?
2. Story (Conexão): O copy quebra as objeções principais? Existe uma narrativa clara?
3. Offer (Oferta): Existe um empilhamento de valor (stack) claro? A oferta é irresistível?
4. Friction (Fricção): Existem elementos que dificultam a conversão (textos longos sem quebra, falta de clareza no próximo passo)?
5. Trust (Confiança): Existem depoimentos, selos ou provas sociais?

VOCÊ DEVE RESPONDER APENAS COM UM JSON NO SEGUINTE FORMATO:
{
  "score": number (0-10),
  "summary": "string (resumo executivo)",
  "heuristics": {
    "hook": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string"] },
    "story": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string"] },
    "offer": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string"] },
    "friction": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string"] },
    "trust": { "score": number, "status": "pass"|"fail"|"warning", "findings": ["string"] }
  },
  "recommendations": [
    { "priority": "high"|"medium"|"low", "type": "copy"|"design"|"offer"|"technical", "action": "string", "impact": "string" }
  ]
}
`;
  }
}
