import { PerformanceMetricDoc, PerformanceAlertDoc, PerformanceConfig } from '../../../types/performance';
import { Timestamp } from 'firebase/firestore';

export class AnomalyEngine {
  constructor(private config: PerformanceConfig) {}

  /**
   * Calcula o Z-Score para uma métrica específica
   * Z = (Valor Atual - Média) / Desvio Padrão
   */
  calculateZScore(current: number, history: number[]): number {
    if (history.length === 0) return 0;

    const mean = history.reduce((a, b) => a + b, 0) / history.length;
    const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return 0;
    return (current - mean) / stdDev;
  }

  /**
   * Analisa uma métrica em busca de anomalias
   */
  detect(currentMetric: PerformanceMetricDoc, history: PerformanceMetricDoc[]): PerformanceAlertDoc[] {
    const alerts: PerformanceAlertDoc[] = [];
    const thresholds = this.config.thresholds!;
    const minDataPoints = this.config.minDataPoints!;

    // Guardrail: Volume mínimo
    if (currentMetric.metrics.impressions < minDataPoints.impressions || 
        currentMetric.metrics.spend < minDataPoints.spend) {
      return [];
    }

    const metricsToMonitor: Array<{ key: 'cpc' | 'ctr' | 'spend'; label: string }> = [
      { key: 'cpc', label: 'Custo por Clique' },
      { key: 'ctr', label: 'Taxa de Clique (CTR)' },
      { key: 'spend', label: 'Gasto' }
    ];

    for (const item of metricsToMonitor) {
      const historyValues = history.map(h => h.metrics[item.key as keyof typeof h.metrics] as number);
      const currentValue = currentMetric.metrics[item.key as keyof typeof currentMetric.metrics] as number;
      
      const zScore = this.calculateZScore(currentValue, historyValues);
      const absZ = Math.abs(zScore);

      if (absZ >= thresholds.yellow) {
        alerts.push({
          id: `alert_${Date.now()}_${item.key}`,
          brandId: this.config.brandId,
          severity: absZ >= thresholds.red ? 'high' : 'medium',
          metricType: item.key as any,
          message: `${item.label} apresenta desvio significativo (${zScore.toFixed(2)} Z-Score).`,
          context: {
            currentValue,
            expectedValue: historyValues.reduce((a, b) => a + b, 0) / historyValues.length,
            deviation: zScore,
            entityId: currentMetric.externalId,
            entityName: currentMetric.name,
            platform: currentMetric.platform
          },
          status: 'active',
          createdAt: Timestamp.now()
        });
      }
    }

    return alerts;
  }
}
