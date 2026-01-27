import { MMMDataPoint, MMMResult } from '../../../types/attribution';

/**
 * @fileoverview MMM Light Correlator (ST-25.3)
 * Implementa o coeficiente de correlação de Pearson para medir a relação entre Ads Spend e Vendas Orgânicas.
 * @module lib/intelligence/mmm/correlator
 */

export class MMMCorrelator {
  private readonly MIN_DAYS = 14;

  /**
   * Executa a análise de correlação MMM.
   */
  public calculate(data: MMMDataPoint[]): MMMResult {
    if (data.length < this.MIN_DAYS) {
      return {
        correlationScore: 0,
        confidenceLevel: 'Weak',
        estimatedOrganicLift: 0,
        insight: `Dados insuficientes. Necessário no mínimo ${this.MIN_DAYS} dias para análise estatística.`
      };
    }

    // 1. Limpeza de Outliers (Trava simples para anomalias extremas)
    const cleanData = this.filterOutliers(data);

    // 2. Cálculo de Pearson
    const spend = cleanData.map(d => d.spend);
    const organic = cleanData.map(d => d.organicSales);
    const r = this.pearsonCorrelation(spend, organic);

    // 3. Interpretação do Score
    const confidenceLevel = this.getConfidenceLevel(r);
    const estimatedOrganicLift = this.calculateOrganicLift(r, spend, organic);
    const insight = this.generateInsight(r, confidenceLevel, estimatedOrganicLift);

    return {
      correlationScore: Number(r.toFixed(4)),
      confidenceLevel,
      estimatedOrganicLift: Number(estimatedOrganicLift.toFixed(2)),
      insight
    };
  }

  /**
   * Filtra outliers usando o método do Desvio Padrão (Z-Score simplificado).
   * Ignora dias com valores > 3 desvios padrão da média.
   */
  private filterOutliers(data: MMMDataPoint[]): MMMDataPoint[] {
    const spends = data.map(d => d.spend);
    const mean = spends.reduce((a, b) => a + b, 0) / spends.length;
    const stdDev = Math.sqrt(spends.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / spends.length);

    // Se o desvio padrão for 0 (todos os valores iguais), não há outliers
    if (stdDev === 0) return data;

    return data.filter(d => {
      const zScore = Math.abs((d.spend - mean) / stdDev);
      return zScore < 3; // Mantém apenas o que está dentro de 3 desvios padrão
    });
  }

  /**
   * Coeficiente de Correlação de Pearson (r).
   */
  private pearsonCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, b, i) => a + b * y[i], 0);
    const sumX2 = x.reduce((a, b) => a + b * b, 0);
    const sumY2 = y.reduce((a, b) => a + b * b, 0);

    const numerator = (n * sumXY) - (sumX * sumY);
    const denominator = Math.sqrt(((n * sumX2) - (sumX * sumX)) * ((n * sumY2) - (sumY * sumY)));

    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  private getConfidenceLevel(r: number): 'Strong' | 'Moderate' | 'Weak' {
    const absR = Math.abs(r);
    if (absR > 0.7) return 'Strong';
    if (absR > 0.4) return 'Moderate';
    return 'Weak';
  }

  /**
   * Estima o % de vendas orgânicas que são impulsionadas pelo tráfego pago.
   * Baseado no coeficiente de determinação (r^2) ponderado pela correlação positiva.
   */
  private calculateOrganicLift(r: number, spend: number[], organic: number[]): number {
    if (r <= 0) return 0;
    
    // r^2 nos diz quanto da variância de Y é explicada por X
    const rSquared = Math.pow(r, 2);
    
    // O lift real é uma estimativa baseada na força da correlação
    return rSquared * 100;
  }

  private generateInsight(r: number, level: string, lift: number): string {
    if (r > 0.7) {
      return `Correlação Forte detectada (${r.toFixed(2)}). O investimento em Ads é o principal motor do seu tráfego orgânico. Reduzir a verba agora causará queda direta nas vendas sem UTM.`;
    }
    if (r > 0.4) {
      return `Correlação Moderada (${r.toFixed(2)}). Existe uma influência clara dos anúncios no comportamento de busca direta, mas outros fatores também contribuem.`;
    }
    if (r > 0) {
      return `Correlação Fraca (${r.toFixed(2)}). Os canais pagos e orgânicos operam de forma quase independente no momento.`;
    }
    return `Correlação Nula ou Negativa. Não foi detectada relação estatística entre o aumento de spend e vendas orgânicas neste período.`;
  }
}
