export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError, handleSecurityError } from '@/lib/utils/api-security';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

/**
 * GET /api/intelligence/journey/heatmap?brandId=XXX
 * Returns funnel conversion data: page_view → lead_capture → checkout_init → purchase_complete
 * with drop-off percentages at each stage.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório');
    }

    await requireBrandAccess(request, brandId);

    // Count events by type for this brand
    const eventsRef = collection(db, 'events');
    const q = query(eventsRef, where('brandId', '==', brandId));
    const snapshot = await getDocs(q);

    const counts: Record<string, number> = {
      page_view: 0,
      lead_capture: 0,
      checkout_init: 0,
      purchase_complete: 0,
    };

    // Count unique leads per stage (by leadId)
    const uniqueLeads: Record<string, Set<string>> = {
      page_view: new Set(),
      lead_capture: new Set(),
      checkout_init: new Set(),
      purchase_complete: new Set(),
    };

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const type = data.type as string;
      const leadId = data.leadId as string;

      if (type in counts) {
        counts[type]++;
        if (leadId) uniqueLeads[type].add(leadId);
      }
      // Map 'custom' events with purchase metadata to purchase_complete
      if (type === 'custom' && data.payload?.status === 'approved') {
        counts.purchase_complete++;
        if (leadId) uniqueLeads.purchase_complete.add(leadId);
      }
    }

    // Build funnel stages with drop-off
    const stages = [
      { stage: 'page_view', label: 'Visualizações', events: counts.page_view, uniqueLeads: uniqueLeads.page_view.size },
      { stage: 'lead_capture', label: 'Leads Capturados', events: counts.lead_capture, uniqueLeads: uniqueLeads.lead_capture.size },
      { stage: 'checkout_init', label: 'Checkout Iniciado', events: counts.checkout_init, uniqueLeads: uniqueLeads.checkout_init.size },
      { stage: 'purchase_complete', label: 'Compra Concluída', events: counts.purchase_complete, uniqueLeads: uniqueLeads.purchase_complete.size },
    ];

    // Calculate conversion rates relative to first stage
    const topOfFunnel = stages[0].uniqueLeads || 1;
    const stagesWithRates = stages.map((stage, i) => ({
      ...stage,
      conversionFromTop: Math.round((stage.uniqueLeads / topOfFunnel) * 100),
      dropOffFromPrevious: i === 0
        ? 0
        : Math.round(((stages[i - 1].uniqueLeads - stage.uniqueLeads) / (stages[i - 1].uniqueLeads || 1)) * 100),
    }));

    return createApiSuccess({
      stages: stagesWithRates,
      totalEvents: snapshot.docs.length,
      period: 'all_time',
    });
  } catch (error) {
    console.error('[Journey Heatmap Error]:', error);
    if (error instanceof ApiError) {
      return handleSecurityError(error);
    }
    return createApiError(500, 'Erro interno ao gerar heatmap.');
  }
}
