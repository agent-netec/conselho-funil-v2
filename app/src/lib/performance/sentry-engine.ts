import { Timestamp, collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../firebase/config';
import { PerformanceMetric, PerformanceAnomaly, PerformanceConfig, UnifiedAdsMetrics } from '@/types/performance';

/**
 * SentryEngine - O "coração" do monitoramento de anomalias.
 * Processa métricas e detecta desvios baseados em thresholds de sensibilidade.
 */
export class SentryEngine {
  private static THRESHOLDS = {
    low: 0.50,    // 50% de desvio
    medium: 0.30, // 30% de desvio
    high: 0.15    // 15% de desvio
  };

  /**
   * Analisa uma métrica atual em relação ao valor esperado e gera anomalias se necessário.
   */
  static async analyzeMetric(
    brandId: string,
    currentMetric: PerformanceMetric,
    expectedValues: Partial<UnifiedAdsMetrics>,
    config: PerformanceConfig
  ): Promise<PerformanceAnomaly[]> {
    if (!config.sentrySettings.enabled) return [];

    const anomalies: PerformanceAnomaly[] = [];
    const sensitivity = config.sentrySettings.sensitivity || 'medium';
    const threshold = this.THRESHOLDS[sensitivity];

    const metricsToMonitor: (keyof UnifiedAdsMetrics)[] = [
      'spend', 'revenue', 'roas', 'cac', 'ctr', 'cpc', 'conversions'
    ];

    for (const key of metricsToMonitor) {
      const currentValue = currentMetric.data[key];
      const expectedValue = expectedValues[key];

      if (currentValue === undefined || expectedValue === undefined || expectedValue === 0) continue;

      const deviation = Math.abs((currentValue - expectedValue) / expectedValue);

      if (deviation >= threshold) {
        const anomaly: Omit<PerformanceAnomaly, 'id'> = {
          brandId,
          metricType: key,
          severity: this.calculateSeverity(deviation, threshold),
          detectedAt: Timestamp.now(),
          valueAtDetection: currentValue,
          expectedValue,
          deviationPercentage: deviation * 100,
          status: 'new'
        };

        const savedAnomaly = await this.saveAnomaly(brandId, anomaly);
        anomalies.push(savedAnomaly);
      }
    }

    return anomalies;
  }

  /**
   * Determina a severidade baseada no nível de desvio em relação ao threshold.
   */
  private static calculateSeverity(deviation: number, threshold: number): 'critical' | 'warning' | 'info' {
    if (deviation >= threshold * 2) return 'critical';
    if (deviation >= threshold) return 'warning';
    return 'info';
  }

  /**
   * Grava a anomalia no Firestore: brands/{brandId}/performance_anomalies
   */
  private static async saveAnomaly(brandId: string, anomaly: Omit<PerformanceAnomaly, 'id'>): Promise<PerformanceAnomaly> {
    const anomaliesRef = collection(db, 'brands', brandId, 'performance_anomalies');
    const docRef = await addDoc(anomaliesRef, anomaly);
    
    return {
      id: docRef.id,
      ...anomaly
    };
  }

  /**
   * Lista anomalias de uma marca.
   */
  static async listAnomalies(brandId: string, status?: string, maxLimit: number = 50): Promise<PerformanceAnomaly[]> {
    const anomaliesRef = collection(db, 'brands', brandId, 'performance_anomalies');
    
    let q = query(
      anomaliesRef,
      orderBy('detectedAt', 'desc'),
      limit(maxLimit)
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as PerformanceAnomaly));
  }
}
