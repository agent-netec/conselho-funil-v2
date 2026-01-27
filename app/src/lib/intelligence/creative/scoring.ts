import { CreativePerformance } from '../../../types/creative';

/**
 * ST-26.1: Creative Profit Scoring Engine
 * Responsável por calcular o lucro líquido real e o score de cada ativo criativo.
 */
export class CreativeScoringEngine {
  /**
   * Calcula o Profit Score de um criativo (0-100)
   * Fórmula: ((LTV Atribuído - Spend) / Spend) * Fator de Eficiência
   */
  static calculateScore(performance: CreativePerformance['metrics']): number {
    const { ltvAttributed, spend } = performance;
    
    if (spend <= 0) return 0;
    
    const netProfit = ltvAttributed - spend;
    const roi = netProfit / spend;
    
    // Normalização para escala 0-100 (Exemplo: ROI de 5x = Score 100)
    const score = Math.min(Math.max((roi / 5) * 100, 0), 100);
    
    return Math.round(score);
  }

  /**
   * Ordena criativos pelo lucro líquido real
   */
  static rankByProfit(creatives: CreativePerformance[]): CreativePerformance[] {
    return [...creatives].sort((a, b) => {
      const profitA = a.metrics.ltvAttributed - a.metrics.spend;
      const profitB = b.metrics.ltvAttributed - b.metrics.spend;
      return profitB - profitA;
    });
  }
}
