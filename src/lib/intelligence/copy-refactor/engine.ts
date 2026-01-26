import { generateWithGemini } from '@/lib/ai/gemini';
import { AutopsyReport, CriticalGap } from '@/types/funnel';
import { CopyDNA } from '@/types/vault';

export interface RefactorSuggestion {
  type: 'headline' | 'hook';
  original: string;
  variation: string;
  reasoning: string;
  copywriterInsight: string;
}

/**
 * CopyRefactorEngine: O motor que gera novas variações de copy baseadas em falhas.
 */
export class CopyRefactorEngine {
  /**
   * Gera sugestões de refatoração para um ponto de fricção.
   */
  static async suggestRefactors(
    brandId: string,
    gap: CriticalGap,
    copyDNAs: CopyDNA[]
  ): Promise<RefactorSuggestion[]> {
    // 1. Filtrar DNAs relevantes para o tipo de gap
    const relevantDNA = copyDNAs.filter(dna => 
      dna.type === 'hook' || dna.type === 'style_guide'
    );

    // 2. Construir o prompt para o Gemini
    const prompt = this.buildPrompt(gap, relevantDNA);

    // 3. Chamar o Gemini Flash
    const response = await generateWithGemini(prompt, {
      temperature: 0.8,
      responseMimeType: 'application/json'
    });

    try {
      const result = JSON.parse(response);
      return result.suggestions as RefactorSuggestion[];
    } catch (error) {
      console.error('[CopyRefactorEngine] Erro ao parsear resposta:', error);
      return [];
    }
  }

  private static buildPrompt(gap: CriticalGap, dnas: CopyDNA[]): string {
    return `
Você é o Especialista em Refatoração de Copy do Conselho de Funil.
Sua tarefa é sugerir 3 variações de Headlines ou Hooks para corrigir um gargalo crítico no funil.

## GARGALO DETECTADO
- Etapa: ${gap.stepId}
- Métrica: ${gap.metric}
- Valor Atual: ${gap.currentValue}
- Valor Alvo: ${gap.targetValue}
- Perda Estimada: R$ ${gap.lossEstimate.toLocaleString('pt-BR')}

## COPY DNA DA MARCA (REFERÊNCIA)
${dnas.map(dna => `- [${dna.type}] ${dna.name}: ${dna.content}`).join('\n')}

## INSTRUÇÕES
1. Analise o gap e o DNA da marca.
2. Gere 3 variações (Headlines ou Hooks) que atacam diretamente a causa provável da baixa conversão.
3. Use os princípios de copywriters clássicos (Gary Halbert, Eugene Schwartz).
4. Retorne APENAS um JSON no formato:
{
  "suggestions": [
    {
      "type": "headline" | "hook",
      "original": "Texto original (se disponível)",
      "variation": "Nova variação sugerida",
      "reasoning": "Por que esta variação deve converter melhor?",
      "copywriterInsight": "Insight de um mestre do copy (ex: 'Schwartz diria que...') "
    }
  ]
}
`;
  }
}
