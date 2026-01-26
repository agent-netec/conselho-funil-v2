import { Timestamp } from 'firebase/firestore';

/**
 * Representa a estrutura e o estado atual de um funil para diagnóstico.
 * Collection: brands/{brandId}/funnels
 */
export interface FunnelDocument {
  id: string;
  name: string;
  status: 'active' | 'draft' | 'archived';
  
  // Estrutura do Funil (Grafo Simples)
  steps: FunnelStep[];
  
  // Metadados de Diagnóstico
  lastAutopsyAt?: Timestamp;
  healthScore: number; // 0-100 calculado pelo Autopsy Engine
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Representa uma etapa individual dentro de um funil.
 */
export interface FunnelStep {
  id: string;
  type: 'ads' | 'optin' | 'vsl' | 'checkout' | 'upsell' | 'thankyou';
  url?: string;
  metrics: {
    visitors: number;
    conversions: number;
    conversionRate: number;
    avgTimeOnPage?: number;
    bounceRate?: number;
  };
  benchmarks?: {
    industryAvg: number;
    deviation: number;
  };
}

/**
 * Relatórios detalhados gerados pelo Diagnostic Engine (E41).
 * Collection: brands/{brandId}/autopsy_reports
 */
export interface AutopsyReport {
  id: string;
  funnelId: string;
  timestamp: Timestamp;
  
  // Diagnóstico Geral
  overallHealth: number;
  criticalGaps: CriticalGap[];
  
  // Análise por Etapa
  stepAnalysis: Record<string, {
    frictionPoints: string[];
    hypotheses: string[]; // Copy, Speed, Offer, Design
    priority: 'low' | 'medium' | 'high';
  }>;
  
  // Plano de Ação
  actionPlan: {
    task: string;
    expectedImpact: string;
    difficulty: 'easy' | 'medium' | 'hard';
  }[];
}

/**
 * Representa uma lacuna crítica identificada no funil.
 */
export interface CriticalGap {
  stepId: string;
  metric: string;
  currentValue: number;
  targetValue: number;
  lossEstimate: number; // Estimativa financeira de perda mensal
}
