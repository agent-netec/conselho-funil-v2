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
