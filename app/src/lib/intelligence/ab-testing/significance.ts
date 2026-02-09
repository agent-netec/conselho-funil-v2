/**
 * Statistical Significance — Z-test for Proportions
 * Calcula significancia estatistica entre duas variantes de A/B test.
 *
 * ZERO lib estatistica externa (PB-01).
 * Implementacao inline da formula padrao Z-test para proporcoes.
 *
 * @module lib/intelligence/ab-testing/significance
 * @story S34-AB-03
 * @arch DT-05 (funcao utility dedicada)
 */

import type { SignificanceResult } from '@/types/ab-testing';

/**
 * Aproximacao do complementary error function (erfc).
 * Usado para converter Z-score em p-value (two-tailed).
 * Precisao suficiente para A/B testing (4 casas decimais).
 */
function approximateErfc(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 1 - sign * y;
}

/**
 * Converte Z-score em p-value (two-tailed).
 */
function zScoreToPValue(z: number): number {
  return approximateErfc(Math.abs(z) / Math.SQRT2);
}

/**
 * Z-test para proporcoes entre duas variantes.
 *
 * Formula: z = |p1 - p2| / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
 *
 * Retorno rico: { zScore, pValue, significance, isSignificant }
 *
 * Validacoes:
 * - Se n1 < 30 ou n2 < 30: retorna significance 0 (sample size minimo estatistico)
 * - Se impressoes < 100 em qualquer variante: isSignificant = false (PB-03)
 *
 * @param variantA - { conversions, impressions }
 * @param variantB - { conversions, impressions }
 * @param threshold - Limite de significancia (default: 0.95)
 */
export function calculateSignificance(
  variantA: { conversions: number; impressions: number },
  variantB: { conversions: number; impressions: number },
  threshold: number = 0.95
): SignificanceResult {
  const { conversions: cA, impressions: nA } = variantA;
  const { conversions: cB, impressions: nB } = variantB;

  if (nA < 30 || nB < 30) {
    return { zScore: 0, pValue: 1, significance: 0, isSignificant: false };
  }

  const p1 = cA / nA;
  const p2 = cB / nB;
  const pPool = (cA + cB) / (nA + nB);

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));

  if (se === 0) {
    return { zScore: 0, pValue: 1, significance: 0, isSignificant: false };
  }

  const zScore = Math.abs(p1 - p2) / se;
  const pValue = zScoreToPValue(zScore);
  const significance = 1 - pValue;

  const hasMinimumImpressions = nA >= 100 && nB >= 100;

  return {
    zScore,
    pValue,
    significance,
    isSignificant: hasMinimumImpressions && significance >= threshold,
  };
}
