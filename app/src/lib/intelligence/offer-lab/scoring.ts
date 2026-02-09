import { OfferDocument } from '@/types/offer';

/**
 * Motor de Scoring de Ofertas (Offer Irresistibility Engine)
 * Baseado na Equação de Valor: (Sonho * Probabilidade) / (Tempo * Esforço)
 */
export class OfferScoringEngine {
  /**
   * Calcula o Irresistibility Score de uma oferta.
   * Retorna um score de 0 a 100 e os fatores detalhados.
   */
  static calculateScore(offerData: Omit<OfferDocument, 'id' | 'createdAt' | 'updatedAt'>) {
    const { dreamOutcome, perceivedLikelihood, timeDelay, effortSacrifice } = offerData.scoring.factors;

    // 1. Cálculo Base da Equação de Valor
    // Numerador: O que o cliente ganha (Desejo)
    // Denominador: O que o cliente "paga" em atrito (Resistência)
    // Usamos uma escala de 1-10 para os fatores para evitar divisão por zero e normalizar.
    
    const numerator = dreamOutcome * perceivedLikelihood;
    const denominator = (timeDelay + effortSacrifice) || 1; // Evita divisão por zero
    
    // O valor bruto pode variar muito, então normalizamos para uma escala de 0-100
    // O valor máximo teórico (10*10)/(1+1) = 50
    // O valor mínimo teórico (1*1)/(10+10) = 0.05
    const rawScore = numerator / denominator;
    
    // Normalização (ajustada para que uma oferta "boa" fique acima de 70)
    // 50 -> 100
    // 10 -> 70
    // 1 -> 20
    let normalizedScore = Math.min(100, Math.round((rawScore / 50) * 100));

    // 2. Bônus por Componentes da Oferta
    let bonusPoints = 0;
    
    // Bônus por Ancoragem de Preço (Valor Percebido vs Preço Real)
    const priceAnchorRatio = offerData.components.coreProduct.perceivedValue / (offerData.components.coreProduct.price || 1);
    if (priceAnchorRatio >= 10) bonusPoints += 10;
    else if (priceAnchorRatio >= 5) bonusPoints += 5;

    // Bônus por Bônus Complementares
    const avgBonusComplementarity = offerData.components.bonuses.reduce((acc, b) => acc + (b.complementarityScore ?? 0), 0) / (offerData.components.bonuses.length || 1);
    if (avgBonusComplementarity > 80 && offerData.components.bonuses.length >= 3) bonusPoints += 10;

    // Bônus por Inversão de Risco
    if (offerData.components.riskReversal.length > 50) bonusPoints += 5;

    // Bônus por Escassez/Urgência
    if (offerData.components.scarcity && offerData.components.urgency) bonusPoints += 5;

    const finalScore = Math.min(100, normalizedScore + bonusPoints);

    return {
      total: finalScore,
      factors: {
        dreamOutcome,
        perceivedLikelihood,
        timeDelay,
        effortSacrifice
      },
      analysis: this.generateAnalysis(finalScore, rawScore, priceAnchorRatio)
    };
  }

  private static generateAnalysis(score: number, rawScore: number, anchorRatio: number): string[] {
    const insights: string[] = [];

    if (score < 50) insights.push("Oferta Fraca: O atrito (tempo/esforço) está matando o desejo.");
    if (anchorRatio < 3) insights.push("Ancoragem Insuficiente: Aumente o valor percebido ou adicione bônus de alto valor.");
    if (score >= 80) insights.push("Oferta Irresistível: Excelente equilíbrio entre promessa e facilidade de execução.");
    
    return insights;
  }
}
