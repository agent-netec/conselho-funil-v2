import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Tipos para o Intelligent Reporting & Anomaly Detection (S24)
 * @module types/reporting
 */

export interface ClientReport {
  id: string;
  clientId: string;
  agencyId: string;
  type: 'weekly' | 'monthly' | 'on_demand';
  period: {
    start: Timestamp;
    end: Timestamp;
  };
  metrics: {
    adSpend: number;
    revenue: number;
    roi: number;
    roiPredicted?: number; // Sprint 22
    ltvMaturation: number;
  };
  aiAnalysis: {
    summary: string; // Narrativa gerada pelo Gemini
    insights: {
      type: 'lamp' | 'target' | 'alert';
      text: string;
    }[];
    actionPlan: string[]; // Lista de "Próximos Passos"
    dataContext: string; // Ex: "Análise baseada em 4.500 eventos"
  };
  status: 'generating' | 'ready' | 'failed';
  sharingToken?: string;
  createdAt: Timestamp;
}

export interface AnomalyAlert {
  id: string;
  clientId: string;
  agencyId: string;
  metric: 'roi' | 'cpa' | 'spend';
  expectedValue: number;
  actualValue: number;
  deviation: number; // Porcentagem de desvio (ex: 0.25 para 25%)
  severity: 'low' | 'medium' | 'high';
  status: 'new' | 'acknowledged' | 'resolved';
  triggerReason: string; // Ex: "ROI real 20% abaixo da projeção por >48h"
  timestamp: Timestamp;
}

export interface AnomalyDetectionResult {
  hasAnomaly: boolean;
  alert?: Omit<AnomalyAlert, 'id' | 'status' | 'timestamp'>;
}
