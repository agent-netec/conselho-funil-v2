/**
 * A/B Test Engine — Motor de experimentacao
 * Gerencia lifecycle de testes, assignment deterministico, e recording de eventos.
 *
 * @module lib/intelligence/ab-testing/engine
 * @story S34-AB-03
 * @arch DT-04 (djb2 hash), DT-12 (funcao dedicada)
 */

import { Timestamp } from 'firebase/firestore';
import {
  getABTest,
  updateABTest,
  updateVariantMetrics,
} from '@/lib/firebase/ab-tests';
import type { ABTestVariant, ABEventType } from '@/types/ab-testing';

/**
 * Hash assignment deterministico via djb2.
 *
 * DT-04: djb2 com separador `:` evita colisao entre "abc"+"def" e "ab"+"cdef".
 * DT-12: Funcao DEDICADA. NAO importar hashString() de rag.ts.
 * PB-02: Hash puro, sem random, sem cookie.
 *
 * @param leadId - ID do lead
 * @param testId - ID do teste
 * @param variantCount - Numero de variantes
 * @returns Indice da variante (0 a variantCount-1)
 */
export function hashAssign(leadId: string, testId: string, variantCount: number): number {
  const input = `${leadId}:${testId}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  return (hash >>> 0) % variantCount;
}

/**
 * Classe principal do A/B Test Engine.
 */
export class ABTestEngine {
  /**
   * Inicia um teste (draft → running).
   */
  static async startTest(brandId: string, testId: string): Promise<void> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'draft') throw new Error(`Cannot start test in status: ${test.status}`);

    await updateABTest(brandId, testId, {
      status: 'running',
      startDate: Timestamp.now(),
    });
  }

  /**
   * Pausa um teste (running → paused).
   */
  static async pauseTest(brandId: string, testId: string): Promise<void> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running') throw new Error(`Cannot pause test in status: ${test.status}`);

    await updateABTest(brandId, testId, {
      status: 'paused',
    });
  }

  /**
   * Completa um teste (running/paused → completed).
   */
  static async completeTest(
    brandId: string,
    testId: string,
    winnerVariantId?: string,
    significanceLevel?: number
  ): Promise<void> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running' && test.status !== 'paused') {
      throw new Error(`Cannot complete test in status: ${test.status}`);
    }

    await updateABTest(brandId, testId, {
      status: 'completed',
      endDate: Timestamp.now(),
      winnerVariantId: winnerVariantId ?? null,
      significanceLevel: significanceLevel ?? null,
    });
  }

  /**
   * Atribui uma variante a um lead via hash deterministico.
   * PB-02: Mesmo lead + mesmo teste = SEMPRE mesma variante.
   *
   * @returns Variante atribuida ou null se teste nao esta running
   */
  static async assignVariant(
    brandId: string,
    testId: string,
    leadId: string
  ): Promise<ABTestVariant | null> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running') return null;

    // S34-FIX: Enforce targetSegment (CS-34.08)
    if (test.targetSegment !== 'all') {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase/config');
      const leadRef = doc(db, 'leads', leadId);
      const leadSnap = await getDoc(leadRef);
      if (leadSnap.exists()) {
        const leadData = leadSnap.data() as { segment?: string };
        if (typeof leadData.segment === 'string' && leadData.segment !== test.targetSegment) {
          return null; // Lead segment nao corresponde ao target do teste
        }
      }
    }

    const activeVariants = test.variants.filter((v) => v.weight > 0);
    if (activeVariants.length === 0) return null;

    const index = hashAssign(leadId, testId, activeVariants.length);
    return activeVariants[index];
  }

  /**
   * Registra evento (impression, click, conversion) para uma variante.
   * Usa increment() do Firestore para atomicidade.
   */
  static async recordEvent(
    brandId: string,
    testId: string,
    variantId: string,
    eventType: ABEventType,
    value?: number
  ): Promise<void> {
    const delta: { impressions?: number; clicks?: number; conversions?: number; revenue?: number } = {};

    switch (eventType) {
      case 'impression':
        delta.impressions = 1;
        break;
      case 'click':
        delta.clicks = 1;
        break;
      case 'conversion':
        delta.conversions = 1;
        if (value) delta.revenue = value;
        break;
    }

    await updateVariantMetrics(brandId, testId, variantId, delta);
  }
}
