import { OfferDocument, OfferWizardState } from '@/types/offer';

/**
 * Motor de Scoring de Ofertas (Offer Lab Engine)
 * Baseado na Equação de Valor de Alex Hormozi e frameworks do Brain Council.
 */
export class OfferLabEngine {
  /**
   * Calcula o Irresistibility Score (0-100)
   */
  static calculateScore(state: OfferWizardState): { total: number; analysis: string[] } {
    const { dreamOutcome, perceivedLikelihood, timeDelay, effortSacrifice } = state.scoringFactors;

    // 1. Equação de Valor (Hormozi)
    // (Sonho * Probabilidade) / (Tempo * Esforço)
    const numerator = dreamOutcome * perceivedLikelihood;
    const denominator = (timeDelay + effortSacrifice) || 1;
    const rawValueScore = (numerator / denominator);
    
    // Normalização: (10*10)/(1+1) = 50 (Max) -> 100 pontos
    let score = Math.min(80, (rawValueScore / 50) * 80);

    // 2. Bônus por Ancoragem e Stacking (Brain Council)
    const totalValue = state.perceivedValue + 
                       state.stacking.reduce((acc, i) => acc + i.value, 0) +
                       state.bonuses.reduce((acc, i) => acc + i.value, 0);
    
    const price = state.corePrice || 1;
    const valueRatio = totalValue / price;

    if (valueRatio >= 10) score += 10;
    else if (valueRatio >= 5) score += 5;

    // 3. Bônus por Reversão de Risco e Escassez
    if (state.riskReversal.length > 30) score += 5;
    if (state.scarcity.length > 10) score += 5;

    const finalScore = Math.round(Math.min(100, score));

    return {
      total: finalScore,
      analysis: this.generateAnalysis(finalScore, valueRatio, state)
    };
  }

  private static generateAnalysis(score: number, valueRatio: number, state: OfferWizardState): string[] {
    const insights: string[] = [];

    if (valueRatio < 10) {
      insights.push("Aumente a ancoragem: Tente fazer com que o valor percebido seja pelo menos 10x o preço real.");
    }
    
    if (state.scoringFactors.timeDelay > 5) {
      insights.push("O tempo para o resultado está alto. Adicione um bônus de 'atalho' ou 'aceleração'.");
    }

    if (state.riskReversal.length < 20) {
      insights.push("Aumente a confiança: Sua garantia parece fraca ou inexistente.");
    }

    if (score >= 80) {
      insights.push("Oferta Lendária: Você atingiu o 'sweet spot' da irresistibilidade.");
    }

    return insights;
  }
}
