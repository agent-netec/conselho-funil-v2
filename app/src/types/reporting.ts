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

/**
 * Resultado de análise de IA — consumido pelo BriefingBot (briefing-bot.ts)
 * Sprint 29: S29-CL-02 — campos concretos derivados do consumer real
 */
export interface AIAnalysisResult {
  summary: string;                    // Narrativa executiva gerada pelo Gemini
  insights: string[];                 // Insights formatados (consumer: briefing-bot)
  recommendations: string[];          // Próximos passos acionáveis
  confidence?: number;                // 0-1 — confiança da análise
  dataContext?: string;               // Ex: "Baseado em 4.500 eventos"
  generatedAt?: Timestamp;            // Quando a análise foi gerada
}

/**
 * Métricas de relatório — consumido pelo BriefingBot (briefing-bot.ts)
 * Sprint 29: S29-CL-02 — campos concretos derivados do consumer real
 */
export interface ReportMetrics {
  roi: number;                        // Return on Investment
  adSpend: number;                    // Investimento em ads (R$)
  ltvMaturation: number;              // Maturação LTV (%)
  revenue?: number;                   // Receita bruta (R$)
  cpa?: number;                       // Custo por aquisição (R$)
  roas?: number;                      // Return on Ad Spend
  roiPredicted?: number;              // ROI projetado
  conversions?: number;               // Total de conversões
  period?: {                          // Período de referência
    start: Timestamp;
    end: Timestamp;
  };
}
