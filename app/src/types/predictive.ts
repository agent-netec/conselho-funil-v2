import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Tipos para o Prediction Engine e ROI Forecaster
 * @module types/predictive
 * @version 1.0.0
 */

export interface Prediction {
  id: string;
  targetId: string; // leadId ou cohortId (ex: "fb_source_jan26")
  targetType: 'lead' | 'cohort';
  
  model: 'ltv_maturation' | 'roi_forecast' | 'purchase_propensity';
  
  // Resultados da Projeção
  results: {
    predictedValue: number; // Valor central da previsão (cents ou score)
    confidenceInterval: {
      low: number;  // Limite inferior (95% CI)
      high: number; // Limite superior (95% CI)
    };
    confidenceScore: number; // 0.0 a 1.0 (qualidade dos dados de entrada)
  };

  // Projeções Temporais (para LTV)
  timeframes?: {
    m1: number;
    m3: number;
    m6: number;
    m12: number;
  };

  features: string[]; // Lista de variáveis que mais influenciaram a previsão
  
  calculatedAt: Timestamp;
  expiresAt: Timestamp; // Data para recalibração
}

export interface SimulationInput {
  baseAdSpend: number;
  proposedAdSpend: number;
  targetCPA: number;
  historicalWindowDays: number;
}

export interface SimulationOutput {
  projectedNetProfit: number;
  projectedROI: number;
  estimatedCacDegradation: number;
}

export interface SimulationScenario {
  id: string;
  userId: string;
  name: string;
  
  inputs: SimulationInput;
  outputs: SimulationOutput;

  createdAt: Timestamp;
}

export interface IPredictionEngine {
  /**
   * Calcula a propensão de compra de um lead individual
   */
  predictLeadPropensity(leadId: string): Promise<Prediction>;

  /**
   * Projeta o ROI futuro de uma campanha ou cohort
   */
  forecastCohortROI(cohortId: string): Promise<Prediction>;

  /**
   * Simula um cenário de escala de investimento
   */
  simulateScale(input: SimulationInput): SimulationOutput;
}

// === S35-PRED-01: Churn Prediction Types ===

export interface ChurnPrediction {
  leadId: string;
  brandId: string;
  currentSegment: 'hot' | 'warm' | 'cold';
  predictedSegment: 'hot' | 'warm' | 'cold';
  churnRisk: number;
  riskLevel: 'critical' | 'warning' | 'safe';
  daysSinceLastEvent: number;
  engagementTrend: 'rising' | 'stable' | 'declining';
  factors: string[];
  predictedAt: Timestamp;
}

export interface ChurnBatchResult {
  brandId: string;
  totalLeads: number;
  atRisk: number;
  predictions: ChurnPrediction[];
  nextCursor?: string;
  hasMore: boolean;
  calculatedAt: Timestamp;
}

// === S35-PRED-01: LTV Estimation Types ===

export interface LTVEstimation {
  brandId: string;
  cohortId: string;
  cohortName: string;
  segment: 'hot' | 'warm' | 'cold' | 'all';
  leadsInCohort: number;
  totalRevenue: number;
  avgRevenuePerLead: number;
  projectedLTV: {
    m1: number;
    m3: number;
    m6: number;
    m12: number;
  };
  growthMultiplier: number;
  confidenceScore: number;
  calculatedAt: Timestamp;
}

export interface LTVBatchResult {
  brandId: string;
  cohorts: LTVEstimation[];
  overallLTV: number;
  calculatedAt: Timestamp;
}

export interface LTVMultiplierConfig {
  hot: { m1: number; m3: number; m6: number; m12: number };
  warm: { m1: number; m3: number; m6: number; m12: number };
  cold: { m1: number; m3: number; m6: number; m12: number };
}

export interface PredictiveConfig {
  ltvMultipliers?: LTVMultiplierConfig;
  alertThresholds?: {
    churnImminentCount?: number;
    upsellMultiplier?: number;
    segmentShiftPercent?: number;
  };
}

// === S35-PRED-01: Audience Forecast Types ===

export interface AudienceForecast {
  brandId: string;
  currentDistribution: {
    hot: number;
    warm: number;
    cold: number;
  };
  projections: {
    days7: { hot: number; warm: number; cold: number };
    days14: { hot: number; warm: number; cold: number };
    days30: { hot: number; warm: number; cold: number };
  };
  migrationRates: {
    hotToWarm: number;
    warmToCold: number;
    coldToChurned: number;
    warmToHot: number;
    coldToWarm: number;
  };
  trendsNarrative: string;
  calculatedAt: Timestamp;
}

// === S35-PRED-01: Predictive Alerts Types ===

export type PredictiveAlertType =
  | 'churn_imminent'
  | 'upsell_opportunity'
  | 'segment_shift'
  | 'ltv_milestone';

export type PredictiveAlertSeverity = 'critical' | 'warning' | 'info';

export interface PredictiveAlert {
  id: string;
  brandId: string;
  type: PredictiveAlertType;
  severity: PredictiveAlertSeverity;
  title: string;
  description: string;
  data: Record<string, unknown>;
  dismissed: boolean;
  createdAt: Timestamp;
}
