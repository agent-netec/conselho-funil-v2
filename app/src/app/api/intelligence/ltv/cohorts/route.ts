export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateCohortId, calculateMonthsSinceEntry } from '@/lib/intelligence/ltv/cohort-engine';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';

type CohortSummary = {
  id: string;
  leadCount: number;
  customerCount: number;
  totalLtv: number;
  adSpend: number;
  months: number[];
  isEstimated?: boolean;
  isSimulated?: boolean;
};

/**
 * @fileoverview API Route para dados do Dashboard de Cohort.
 * GET /api/intelligence/ltv/cohorts
 *
 * Sprint G — G2: Substituir ad spend hardcoded e distribuição LTV simulada
 * por dados reais de performance_metrics e transactions.
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    const { brandId: safeBrandId } = await requireBrandAccess(request, brandId);

    // 1. Buscar todos os leads para agrupar por cohort
    const leadsRef = collection(db, 'leads');
    const leadsQuery = query(leadsRef, where('brandId', '==', safeBrandId));
    const leadsSnap = await getDocs(leadsQuery);

    // 2. Buscar gastos de Ads reais de performance_metrics
    let realAdSpendByMonth: Record<string, number> = {};
    let hasRealAdSpend = false;
    try {
      const metricsRef = collection(db, 'brands', safeBrandId, 'performance_metrics');
      const metricsSnap = await getDocs(metricsRef);

      metricsSnap.docs.forEach(doc => {
        const data = doc.data();
        const spend = data.data?.spend || data.metrics?.spend || 0;
        const ts = data.timestamp;
        if (ts && spend > 0) {
          const cohortKey = generateCohortId(ts);
          realAdSpendByMonth[cohortKey] = (realAdSpendByMonth[cohortKey] || 0) + spend;
          hasRealAdSpend = true;
        }
      });
    } catch (err) {
      console.warn('[Cohort API] performance_metrics query failed:', err instanceof Error ? err.message : err);
    }

    // 3. Buscar transações reais para distribuição de LTV
    let transactionsByLead: Record<string, Array<{ amount: number; processedAt: Timestamp }>> = {};
    let hasRealTransactions = false;
    try {
      const txRef = collection(db, 'transactions');
      const txQuery = query(
        txRef,
        where('brandId', '==', safeBrandId),
        where('status', '==', 'approved')
      );
      const txSnap = await getDocs(txQuery);

      txSnap.docs.forEach(doc => {
        const tx = doc.data();
        const leadId = tx.leadId;
        if (leadId && tx.amount > 0) {
          if (!transactionsByLead[leadId]) transactionsByLead[leadId] = [];
          transactionsByLead[leadId].push({
            amount: tx.amount,
            processedAt: tx.processedAt || tx.createdAt,
          });
          hasRealTransactions = true;
        }
      });
    } catch (err) {
      console.warn('[Cohort API] transactions query failed:', err instanceof Error ? err.message : err);
    }

    // 4. Agrupar leads por cohort
    const cohortMap: Record<string, CohortSummary> = {};
    // Track lead createdAt per lead ID for transaction distribution
    const leadCreatedAtMap: Record<string, Timestamp> = {};

    leadsSnap.docs.forEach(doc => {
      const lead = doc.data();
      const cohort = lead.metrics?.cohort || generateCohortId(lead.createdAt);
      leadCreatedAtMap[doc.id] = lead.createdAt;

      if (!cohortMap[cohort]) {
        cohortMap[cohort] = {
          id: cohort,
          leadCount: 0,
          customerCount: 0,
          totalLtv: 0,
          adSpend: hasRealAdSpend
            ? (realAdSpendByMonth[cohort] || 0)
            : 0,
          months: [0, 0, 0, 0, 0, 0],
          isEstimated: !hasRealAdSpend,
          isSimulated: !hasRealTransactions,
        };
      }

      const c = cohortMap[cohort];
      c.leadCount++;
      if (lead.status === 'customer') c.customerCount++;
      c.totalLtv += lead.metrics?.totalLtv || 0;

      // Distribuição de LTV: usar transações reais ou fallback para simulação
      if (hasRealTransactions && transactionsByLead[doc.id]) {
        // Distribuir LTV real por mês baseado em transações
        for (const tx of transactionsByLead[doc.id]) {
          const monthIdx = calculateMonthsSinceEntry(lead.createdAt, tx.processedAt);
          const clampedIdx = Math.min(monthIdx, 5); // M0-M5+
          c.months[clampedIdx] += tx.amount;
        }
      } else {
        // Fallback: distribuição simulada
        const ltv = lead.metrics?.totalLtv || 0;
        c.months[0] += ltv * 0.4;
        c.months[1] += ltv * 0.2;
        c.months[2] += ltv * 0.15;
        c.months[3] += ltv * 0.1;
        c.months[4] += ltv * 0.1;
        c.months[5] += ltv * 0.05;
      }
    });

    // 5. Formatar para a UI
    const cohorts = Object.values(cohortMap).sort((a, b) => b.id.localeCompare(a.id));

    // Calculate avg payback from real data or fallback
    let avgPaybackMonths = 2.4; // Default estimate
    if (hasRealAdSpend && cohorts.length > 0) {
      const paybacks = cohorts
        .filter(c => c.adSpend > 0 && c.totalLtv > 0)
        .map(c => {
          let accum = 0;
          for (let i = 0; i < c.months.length; i++) {
            accum += c.months[i];
            if (accum >= c.adSpend) return i;
          }
          return c.months.length; // Not paid back yet
        });
      if (paybacks.length > 0) {
        avgPaybackMonths = paybacks.reduce((a, b) => a + b, 0) / paybacks.length;
      }
    }

    return createApiSuccess({
      cohorts,
      summary: {
        totalLeads: cohorts.reduce((acc, c) => acc + c.leadCount, 0),
        totalLtv: cohorts.reduce((acc, c) => acc + c.totalLtv, 0),
        avgPaybackMonths: Math.round(avgPaybackMonths * 10) / 10,
        isEstimated: !hasRealAdSpend,
        isSimulated: !hasRealTransactions,
      }
    });

  } catch (error: unknown) {
    console.error('[Cohort API Error]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro interno ao processar dados de cohort.');
  }
}
