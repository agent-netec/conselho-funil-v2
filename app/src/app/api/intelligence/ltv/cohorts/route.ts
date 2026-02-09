export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { generateCohortId } from '@/lib/intelligence/ltv/cohort-engine';
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
};

/**
 * @fileoverview API Route para dados do Dashboard de Cohort.
 * GET /api/intelligence/ltv/cohorts
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
    // Em um cenário real com milhões de leads, isso seria pré-agregado em uma coleção 'cohort_metrics'
    const leadsRef = collection(db, 'leads');
    const leadsQuery = query(leadsRef, where('brandId', '==', safeBrandId));
    const leadsSnap = await getDocs(leadsQuery);
    
    // 2. Buscar gastos de Ads (Simulado para o Payback Period)
    // Em produção, isso viria da integração com Facebook/Google Ads (S18)
    const adSpendByMonth: Record<string, number> = {
      '2025-10': 500000, // em centavos (R$ 5.000,00)
      '2025-11': 750000,
      '2025-12': 1000000,
      '2026-01': 1200000,
    };

    const cohortMap: Record<string, CohortSummary> = {};

    leadsSnap.docs.forEach(doc => {
      const lead = doc.data();
      const cohort = lead.metrics?.cohort || generateCohortId(lead.createdAt);
      
      if (!cohortMap[cohort]) {
        cohortMap[cohort] = {
          id: cohort,
          leadCount: 0,
          customerCount: 0,
          totalLtv: 0,
          adSpend: adSpendByMonth[cohort] || 0,
          months: [0, 0, 0, 0, 0, 0], // LTV acumulado por mês (M0, M1, M2...)
        };
      }

      const c = cohortMap[cohort];
      c.leadCount++;
      if (lead.status === 'customer') c.customerCount++;
      c.totalLtv += lead.metrics?.totalLtv || 0;
      
      // Simulação de distribuição de LTV ao longo dos meses para o gráfico
      // Em produção, isso viria de uma query na coleção 'transactions'
      c.months[0] += (lead.metrics?.totalLtv || 0) * 0.4; // 40% no M0
      c.months[1] += (lead.metrics?.totalLtv || 0) * 0.2; // 20% no M1
      c.months[2] += (lead.metrics?.totalLtv || 0) * 0.15;
      c.months[3] += (lead.metrics?.totalLtv || 0) * 0.1;
      c.months[4] += (lead.metrics?.totalLtv || 0) * 0.1;
      c.months[5] += (lead.metrics?.totalLtv || 0) * 0.05;
    });

    // 3. Formatar para a UI
    const cohorts = Object.values(cohortMap).sort((a, b) => b.id.localeCompare(a.id));

    return createApiSuccess({
      cohorts,
      summary: {
        totalLeads: cohorts.reduce((acc, c) => acc + c.leadCount, 0),
        totalLtv: cohorts.reduce((acc, c) => acc + c.totalLtv, 0),
        avgPaybackMonths: 2.4, // Simulado
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
