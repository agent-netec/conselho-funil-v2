import { Prediction } from '@/types/predictive';
import { AnomalyDetectionResult } from '@/types/reporting';

/**
 * @fileoverview Motor de Detecção de Anomalias (ST-24.2)
 * Compara ROI Real vs ROI Predito e gera triggers de alerta.
 */
export class AnomalyDetector {
  
  /**
   * Analisa se existe uma anomalia de ROI baseada no ROI real e na predição da Sprint 22.
   * Trigger: ROI real 20% abaixo da projeção por mais de 48h.
   * 
   * @param realRoi ROI atual (real-time)
   * @param prediction Objeto de predição da Sprint 22
   * @param durationHours Duração da queda (mockado para este estágio, mas pronto para integração com logs)
   */
  detectRoiAnomaly(
    realRoi: number, 
    prediction: Prediction, 
    durationHours: number = 49 // Default > 48h para teste do trigger
  ): AnomalyDetectionResult {
    const predictedRoi = prediction.results.predictedValue;
    const threshold = 0.20; // 20%
    
    // Calcula o desvio: (Predito - Real) / Predito
    const deviation = (predictedRoi - realRoi) / predictedRoi;

    if (deviation >= threshold && durationHours >= 48) {
      return {
        hasAnomaly: true,
        alert: {
          clientId: prediction.targetId, // Assumindo que targetId é o clientId no contexto de cohort
          agencyId: 'system', // Deve ser injetado via contexto real
          metric: 'roi',
          expectedValue: predictedRoi,
          actualValue: realRoi,
          deviation: deviation,
          severity: 'high',
          triggerReason: `ROI real (${realRoi.toFixed(2)}) caiu ${(deviation * 100).toFixed(1)}% abaixo da projeção (${predictedRoi.toFixed(2)}) por ${durationHours}h.`
        }
      };
    }

    return { hasAnomaly: false };
  }
}

export const anomalyDetector = new AnomalyDetector();
