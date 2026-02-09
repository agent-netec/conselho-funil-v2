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

// AutopsyReport — re-export de autopsy.ts (source of truth)
export type { AutopsyReport } from './autopsy';

/**
 * @deprecated Use AutopsyReport de autopsy.ts.
 * Formato legado — overallHealth (0-100) e criticalGaps são incompatíveis com o
 * formato canônico (score 0-10, heuristics). Use adaptLegacyAutopsyReport() para converter.
 * Collection legada: brands/{brandId}/autopsy_reports
 */
export interface LegacyAutopsyReport {
  id: string;
  funnelId: string;
  timestamp: Timestamp;
  overallHealth: number;
  criticalGaps: CriticalGap[];
  stepAnalysis: Record<string, {
    frictionPoints: string[];
    hypotheses: string[];
    priority: 'low' | 'medium' | 'high';
  }>;
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
  lossEstimate: number;
}

/**
 * Converte LegacyAutopsyReport para formato canônico AutopsyReport.
 * Usado para dados existentes no Firestore (PA-01: dados NÃO são alterados).
 */
export function adaptLegacyAutopsyReport(legacy: LegacyAutopsyReport): import('./autopsy').AutopsyReport {
  return {
    score: Math.round(legacy.overallHealth / 10), // 0-100 → 0-10
    summary: legacy.criticalGaps.length > 0
      ? `Funil com ${legacy.criticalGaps.length} gaps críticos. Saúde geral: ${legacy.overallHealth}/100.`
      : `Funil saudável. Score: ${legacy.overallHealth}/100.`,
    heuristics: {
      hook: { score: Math.round(legacy.overallHealth / 10), status: legacy.overallHealth >= 70 ? 'pass' : 'warning', findings: [] },
      story: { score: Math.round(legacy.overallHealth / 10), status: legacy.overallHealth >= 70 ? 'pass' : 'warning', findings: [] },
      offer: { score: Math.round(legacy.overallHealth / 10), status: legacy.overallHealth >= 70 ? 'pass' : 'warning', findings: [] },
      friction: { score: Math.round(legacy.overallHealth / 10), status: legacy.overallHealth >= 70 ? 'pass' : 'warning', findings: legacy.criticalGaps.map(g => `${g.metric}: ${g.currentValue} → ${g.targetValue}`) },
      trust: { score: Math.round(legacy.overallHealth / 10), status: legacy.overallHealth >= 70 ? 'pass' : 'warning', findings: [] },
    },
    recommendations: legacy.actionPlan.map(a => ({
      priority: a.difficulty === 'easy' ? 'high' as const : a.difficulty === 'hard' ? 'low' as const : 'medium' as const,
      type: 'technical' as const,
      action: a.task,
      impact: a.expectedImpact,
    })),
    metadata: {
      loadTimeMs: 0,
      techStack: [],
    },
  };
}
