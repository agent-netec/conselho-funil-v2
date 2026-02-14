import { GoogleGenerativeAI } from '@google/generative-ai';
import { SCALING_PREDICTOR_PROMPT } from '../ai/prompts/scaling-predictor';
import { ScalingPrediction } from '@/types/automation';
import { DEFAULT_GEMINI_MODEL } from '@/lib/ai/gemini';

export class ScalingPredictor {
  private model: any;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ model: DEFAULT_GEMINI_MODEL });
  }

  async predict(data: {
    roiHistory: number[];
    profitScore: number;
    fatigueIndex: number;
    currentBudget: number;
    proposedBudget: number;
  }): Promise<ScalingPrediction> {
    try {
      const prompt = `
        ${SCALING_PREDICTOR_PROMPT}
        
        CONTEXTO ATUAL:
        - Histórico de ROI: ${data.roiHistory.join(', ')}
        - Profit Score: ${data.profitScore}
        - Fatigue Index: ${data.fatigueIndex}
        - Budget Atual: ${data.currentBudget}
        - Budget Proposto: ${data.proposedBudget}
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Extrair JSON da resposta (Gemini às vezes coloca markdown)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('Falha ao extrair JSON da previsão');

      return JSON.parse(jsonMatch[0]) as ScalingPrediction;
    } catch (error) {
      console.error('[ScalingPredictor] Error:', error);
      return {
        score: 0,
        recommendation: 'hold',
        reasoning: 'Erro técnico ao processar previsão de escala.',
        expectedRoiImpact: 0,
        confidence: 0
      };
    }
  }
}
