/**
 * Auto-Optimizer Engine — Avalia variantes e toma decisoes automaticas
 *
 * Regras:
 * - Pause Loser: CR < 50% do lider E impressions >= 100
 * - Declare Winner: significancia >= 95% E impressions >= 200
 * - Early Stop: 0 conversoes apos 500 impressoes
 *
 * DT-09: Constants com override opcional no ABTest type.
 * DT-10: Decisoes persistidas em subcollection optimization_log.
 * PB-03: ZERO decisao sem >= 100 impressoes.
 * PB-04: ZERO execucao se Kill-Switch ativo — log-only mode.
 *
 * @module lib/intelligence/ab-testing/auto-optimizer
 * @story S34-AO-01
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getABTest, updateABTest } from '@/lib/firebase/ab-tests';
import { calculateSignificance } from './significance';
import { ABTestEngine } from './engine';
import { createAutomationLog } from '@/lib/firebase/automation';
import type {
  ABTest,
  ABTestVariant,
  OptimizationDecision,
  OptimizationAction,
} from '@/types/ab-testing';

const MIN_IMPRESSIONS_FOR_DECISION = 100;
const SIGNIFICANCE_THRESHOLD = 0.95;
const LOSER_CR_RATIO = 0.5;
const EARLY_STOP_IMPRESSIONS = 500;

export class AutoOptimizer {
  /**
   * Avalia um teste e retorna lista de decisoes.
   * NAO executa se Kill-Switch ativo (PB-04).
   *
   * @param brandId - ID da marca
   * @param testId - ID do teste
   * @param killSwitchActive - Estado do Kill-Switch (de getKillSwitchState)
   */
  static async evaluate(
    brandId: string,
    testId: string,
    killSwitchActive: boolean
  ): Promise<OptimizationDecision[]> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running') throw new Error('Test is not running');
    if (!test.autoOptimize) throw new Error('Auto-optimize is disabled for this test');

    const minImpressions = test.minImpressionsForDecision ?? MIN_IMPRESSIONS_FOR_DECISION;
    const sigThreshold = test.significanceThreshold ?? SIGNIFICANCE_THRESHOLD;

    const decisions: OptimizationDecision[] = [];
    const activeVariants = test.variants.filter((v) => v.weight > 0);

    if (activeVariants.length < 2) {
      return decisions;
    }

    const leader = activeVariants.reduce((best, v) => {
      const bestCR = best.impressions > 0 ? best.conversions / best.impressions : 0;
      const vCR = v.impressions > 0 ? v.conversions / v.impressions : 0;
      return vCR > bestCR ? v : best;
    });

    const leaderCR = leader.impressions > 0 ? leader.conversions / leader.impressions : 0;

    for (const variant of activeVariants) {
      if (variant.id === leader.id) continue;

      const vCR = variant.impressions > 0 ? variant.conversions / variant.impressions : 0;

      if (variant.conversions === 0 && variant.impressions >= EARLY_STOP_IMPRESSIONS) {
        decisions.push(AutoOptimizer.createDecision(
          testId, variant.id, 'early_stop',
          `Zero conversions after ${variant.impressions} impressions`,
          variant, undefined
        ));
        continue;
      }

      if (variant.impressions < minImpressions) continue;

      if (leaderCR > 0 && vCR < leaderCR * LOSER_CR_RATIO) {
        decisions.push(AutoOptimizer.createDecision(
          testId, variant.id, 'pause_variant',
          `CR ${(vCR * 100).toFixed(1)}% < 50% of leader CR ${(leaderCR * 100).toFixed(1)}%`,
          variant, undefined
        ));
        continue;
      }
    }

    if (activeVariants.length >= 2 && leader.impressions >= minImpressions * 2) {
      const others = activeVariants.filter((v) => v.id !== leader.id);
      for (const other of others) {
        if (other.impressions < minImpressions) continue;
        const sig = calculateSignificance(
          { conversions: leader.conversions, impressions: leader.impressions },
          { conversions: other.conversions, impressions: other.impressions },
          sigThreshold
        );

        if (sig.isSignificant) {
          decisions.push(AutoOptimizer.createDecision(
            testId, leader.id, 'declare_winner',
            `Significance ${(sig.significance * 100).toFixed(1)}% >= ${(sigThreshold * 100)}% (vs variant ${other.id})`,
            leader, sig.significance
          ));
          break;
        }
      }
    }

    if (decisions.length === 0) {
      decisions.push(AutoOptimizer.createDecision(
        testId, leader.id, 'continue',
        'Insufficient data for decision',
        leader, undefined
      ));
    }

    for (const decision of decisions) {
      decision.executed = !killSwitchActive;
      await AutoOptimizer.logDecision(brandId, testId, decision);

      if (!killSwitchActive) {
        await AutoOptimizer.executeDecision(brandId, testId, test, decision);
      }
    }

    if (decisions.some(d => d.action !== 'continue')) {
      await createAutomationLog(brandId, {
        ruleId: 'ab_optimization',
        action: decisions.map(d => `${d.action}: variant ${d.variantId}`).join(', '),
        status: killSwitchActive ? 'pending_approval' : 'executed',
        context: {
          funnelId: testId,
          entityId: testId,
          gapDetails: {
            reason: `A/B optimization decisions: ${decisions.length}`,
            severity: killSwitchActive ? 'paused' : 'executed',
          },
        },
        timestamp: Timestamp.now(),
      });
    }

    return decisions;
  }

  private static createDecision(
    testId: string,
    variantId: string,
    action: OptimizationAction,
    reason: string,
    variant: ABTestVariant,
    significance: number | undefined
  ): OptimizationDecision {
    return {
      testId,
      variantId,
      action,
      reason,
      metrics: {
        impressions: variant.impressions,
        conversions: variant.conversions,
        cr: variant.impressions > 0 ? variant.conversions / variant.impressions : 0,
        significance,
      },
      executed: true,
      timestamp: Timestamp.now(),
    };
  }

  private static async logDecision(
    brandId: string,
    testId: string,
    decision: OptimizationDecision
  ): Promise<void> {
    const logRef = collection(
      db, 'brands', brandId, 'ab_tests', testId, 'optimization_log'
    );
    await addDoc(logRef, decision);
  }

  private static async executeDecision(
    brandId: string,
    testId: string,
    test: ABTest,
    decision: OptimizationDecision
  ): Promise<void> {
    switch (decision.action) {
      case 'pause_variant':
      case 'early_stop': {
        const updatedVariants = test.variants.map((v) =>
          v.id === decision.variantId ? { ...v, weight: 0 } : v
        );
        await updateABTest(brandId, testId, { variants: updatedVariants });
        break;
      }
      case 'declare_winner': {
        await ABTestEngine.completeTest(
          brandId,
          testId,
          decision.variantId,
          decision.metrics.significance
        );
        break;
      }
      case 'continue':
        break;
    }
  }

  /**
   * Busca historico de decisoes de optimization.
   */
  static async getOptimizationLog(
    brandId: string,
    testId: string,
    maxEntries: number = 50
  ): Promise<OptimizationDecision[]> {
    const logRef = collection(
      db, 'brands', brandId, 'ab_tests', testId, 'optimization_log'
    );
    const q = query(logRef, orderBy('timestamp', 'desc'), firestoreLimit(maxEntries));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as OptimizationDecision[];
  }
}
