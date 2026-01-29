import { Timestamp } from 'firebase/firestore';
import { upsertLead } from '@/lib/firebase/journey';
import type { JourneyLead } from '@/types/journey';

/**
 * @fileoverview Motor de Cohorts (Safra) para análise de retenção e LTV.
 * @module lib/intelligence/ltv/cohort-engine
 */

/**
 * Gera a string de identificação da safra (Cohort) baseada em uma data.
 * Formato: YYYY-MM
 */
export function generateCohortId(date: Date | Timestamp): string {
  const d = date instanceof Timestamp ? date.toDate() : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Atribui um lead a uma safra (Cohort) baseada na sua data de criação.
 */
export async function assignLeadToCohort(lead: JourneyLead) {
  if (lead.metrics?.cohort) return lead.metrics.cohort;

  const cohort = generateCohortId(lead.createdAt);
  
  await upsertLead(lead.id, {
    metrics: {
      ...lead.metrics,
      cohort
    }
  });

  return cohort;
}

/**
 * Calcula a "idade" de uma transação em relação à entrada do lead (em meses).
 * Útil para gráficos de maturação de LTV.
 */
export function calculateMonthsSinceEntry(leadCreatedAt: Timestamp, transactionDate: Timestamp): number {
  const start = leadCreatedAt.toDate();
  const end = transactionDate.toDate();
  
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}
