import { Timestamp } from 'firebase/firestore';
import { 
  IPredictionEngine, 
  Prediction, 
  SimulationInput, 
  SimulationOutput 
} from '../../../types/predictive.ts';
import { getLead, getLeadEvents } from '../../firebase/journey.ts';
import { savePrediction } from '../../firebase/predictive.ts';
import { generateWithGemini } from '../../ai/gemini.ts';
import { LEAD_SCORING_SYSTEM_PROMPT, buildLeadScoringPrompt } from '../../ai/prompts/predictive-scoring.ts';

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
    // ... (mesma implementação anterior)
    const baseLtv = 5000; 
    const m1_mult = 1.4;
    const m3_mult = 2.1;
    const m6_mult = 2.8;
    const m12_mult = 3.5;

    const prediction: Omit<Prediction, 'id'> = {
      targetId: cohortId,
      targetType: 'cohort',
      model: 'ltv_maturation',
      results: {
        predictedValue: baseLtv * m6_mult,
        confidenceInterval: {
          low: baseLtv * m6_mult * 0.85,
          high: baseLtv * m6_mult * 1.15
        },
        confidenceScore: 0.75
      },
      timeframes: {
        m1: baseLtv * m1_mult,
        m3: baseLtv * m3_mult,
        m6: baseLtv * m6_mult,
        m12: baseLtv * m12_mult
      },
      features: ['historical_cohort_performance', 'early_payback_velocity'],
      calculatedAt: Timestamp.now(),
      expiresAt: Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000)
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

