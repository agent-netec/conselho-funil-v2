import { CreativePerformance } from '../../../types/creative';

/**
 * ST-26.4: Visual Fatigue Monitoring System
 * Detecta saturação de criativos baseada na queda de eficiência.
 */
export class VisualFatigueMonitor {
  /**
   * Calcula o índice de fadiga (0-1)
   * @param currentCtr CTR atual (últimos 7 dias)
   * @param baselineCtr CTR histórico ou da semana anterior
   */
  static calculateFatigue(currentCtr: number, baselineCtr: number): number {
    if (baselineCtr <= 0) return 0;
    
    const drop = (baselineCtr - currentCtr) / baselineCtr;
    
    // Se a queda for maior que 30%, o índice de fadiga sobe rapidamente
    return Math.min(Math.max(drop > 0 ? drop : 0, 0), 1);
  }

  /**
   * Verifica se um criativo precisa de substituição urgente
   */
  static needsReplacement(fatigueIndex: number): boolean {
    return fatigueIndex >= 0.3; // Alerta visual se queda > 30%
  }
}
