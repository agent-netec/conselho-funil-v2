import { SimulationInput, SimulationOutput } from '@/types/predictive';

/**
 * Pure math simulation — no Gemini/server dependencies.
 * Extracted from PredictionEngine.simulateScale so it can be safely
 * imported by client components without pulling gemini.ts into the bundle.
 */
export function simulateScale(input: SimulationInput): SimulationOutput {
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
    estimatedCacDegradation: Math.max(0, estimatedCacDegradation),
  };
}
