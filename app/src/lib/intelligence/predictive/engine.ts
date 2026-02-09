import { Timestamp } from 'firebase/firestore';
import { 
  IPredictionEngine, 
  Prediction, 
  SimulationInput, 
  SimulationOutput 
} from '../../../types/predictive';
import { getLead, getLeadEvents } from '../../firebase/journey';
import { savePrediction } from '../../firebase/predictive';
import { generateWithGemini } from '../../ai/gemini';
import { LEAD_SCORING_SYSTEM_PROMPT, buildLeadScoringPrompt } from '../../ai/prompts/predictive-scoring';
import { LTVEstimator } from './ltv-estimator';

/**
 * @fileoverview Implementação do Prediction Engine (ST-22.2 & ST-22.3)
 * @module lib/intelligence/predictive/engine
 */
export class PredictionEngine implements IPredictionEngine {
  
  /**
   * Calcula a propensão de compra de um lead individual.
   * ST-22.3: Integrado com Gemini Flash para análise de rastro digital.
   */
  async predictLeadPropensity(leadId: string): Promise<Prediction> {
    const lead = await getLead(leadId);
    if (!lead) throw new Error(`Lead ${leadId} não encontrado.`);

    const events = await getLeadEvents(leadId);
    // Em uma implementação real, buscaríamos transações também
    const transactions: any[] = []; 

    // ST-22.3: Inteligência Profunda com Gemini Flash
    const prompt = buildLeadScoringPrompt(lead, events, transactions);
    
    try {
      const aiResponse = await generateWithGemini(prompt, {
        systemPrompt: LEAD_SCORING_SYSTEM_PROMPT,
        temperature: 0.2,
        responseMimeType: 'application/json'
      } as any);

      const result = JSON.parse(aiResponse);

      const prediction: Omit<Prediction, 'id'> = {
        targetId: leadId,
        targetType: 'lead',
        model: 'purchase_propensity',
        results: {
          predictedValue: result.score,
          confidenceInterval: {
            low: Math.max(0, result.score - (1 - result.confidence) * 20),
            high: Math.min(100, result.score + (1 - result.confidence) * 20)
          },
          confidenceScore: result.confidence
        },
        features: result.features,
        calculatedAt: Timestamp.now(),
        expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000)
      };

      const id = await savePrediction(prediction);
      return { id, ...prediction };

    } catch (error) {
      console.error('[PredictionEngine] Erro na análise AI:', error);
      // Fallback para lógica simplificada em caso de falha na AI
      return this.predictLeadPropensityFallback(leadId, events);
    }
  }

  /**
   * Fallback para lógica simplificada (antiga ST-22.2)
   */
  private async predictLeadPropensityFallback(leadId: string, events: any[]): Promise<Prediction> {
    let score = 0;
    const features: string[] = [];

    if (events.length > 5) {
      score += 20;
      features.push('high_engagement');
    }

    const watchedVSL = events.some(e => e.type === 'vsl_watch');
    if (watchedVSL) {
      score += 30;
      features.push('vsl_viewer');
    }

    const checkoutStarted = events.some(e => e.type === 'checkout_init');
    if (checkoutStarted) {
      score += 40;
      features.push('checkout_intent');
    }

    const prediction: Omit<Prediction, 'id'> = {
      targetId: leadId,
      targetType: 'lead',
      model: 'purchase_propensity',
      results: {
        predictedValue: Math.min(score, 100),
        confidenceInterval: {
          low: Math.max(0, score - 10),
          high: Math.min(100, score + 10)
        },
        confidenceScore: 0.5 // Baixa confiança no fallback
      },
      features,
      calculatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000)
    };

    const id = await savePrediction(prediction);
    return { id, ...prediction };
  }

  /**
   * Projeta o ROI futuro e maturação de LTV de uma cohort.
   * Janelas: 30, 90, 180 dias.
   */
  async forecastCohortROI(cohortId: string): Promise<Prediction> {
    const now = Timestamp.now();
    const inferredBrandId = cohortId.split('-')[0] || cohortId;
    const ltvBatch = await LTVEstimator.estimateBatch(inferredBrandId);
    const selectedCohort =
      ltvBatch.cohorts.find((c) => c.cohortId === cohortId) ??
      ltvBatch.cohorts.find((c) => c.segment === 'warm') ??
      ltvBatch.cohorts[0];

    const projected = selectedCohort?.projectedLTV ?? { m1: 0, m3: 0, m6: 0, m12: 0 };
    const predictedValue = projected.m6;
    const confidenceScore = selectedCohort?.confidenceScore ?? 0.5;

    const prediction: Omit<Prediction, 'id'> = {
      targetId: cohortId,
      targetType: 'cohort',
      model: 'ltv_maturation',
      results: {
        predictedValue,
        confidenceInterval: {
          low: predictedValue * 0.85,
          high: predictedValue * 1.15
        },
        confidenceScore
      },
      timeframes: {
        m1: projected.m1,
        m3: projected.m3,
        m6: projected.m6,
        m12: projected.m12
      },
      features: ['ltv_estimator_batch', 'segment_projection', 'cohort_signal'],
      calculatedAt: now,
      expiresAt: Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000)
    };

    const id = await savePrediction(prediction);
    return { id, ...prediction };
  }

  /**
   * Simula um cenário de escala de investimento com degradação de ROI.
   */
  simulateScale(input: SimulationInput): SimulationOutput {
    const { baseAdSpend, proposedAdSpend, targetCPA } = input;
    const currentROI = (targetCPA * 2) / targetCPA;
    const scaleFactor = proposedAdSpend / baseAdSpend;
    const DEGRADATION_FACTOR = 0.15;
    
    const projectedROI = currentROI * (1 - DEGRADATION_FACTOR * Math.log2(scaleFactor));
    const projectedNetProfit = (proposedAdSpend * projectedROI) - proposedAdSpend;
    const estimatedCacDegradation = (1 / (1 - DEGRADATION_FACTOR * Math.log2(scaleFactor))) - 1;

    return {
      projectedNetProfit: Math.max(0, projectedNetProfit),
      projectedROI: Math.max(0, projectedROI),
      estimatedCacDegradation: Math.max(0, estimatedCacDegradation)
    };
  }
}

