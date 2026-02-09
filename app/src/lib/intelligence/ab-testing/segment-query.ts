/**
 * Segment Query — Busca leads por segmento de propensity
 * Collection: leads (top-level, filtrado por brandId)
 *
 * DT-13 (BLOCKING): Dados vem de LEADS, NAO de metricas de ads.
 * DT-07: Query com where('brandId','==',brandId).where('segment','==',param)
 *
 * PRE-REQUISITO: Firestore composite index (brandId ASC + segment ASC) na collection leads.
 *
 * @module lib/intelligence/ab-testing/segment-query
 * @story S34-SEG-01
 */

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SegmentMetrics, SegmentBreakdownData, TargetSegment } from '@/types/ab-testing';

interface LeadDoc {
  id: string;
  brandId: string;
  segment: TargetSegment;
  converted?: boolean;
  revenue?: number;
  [key: string]: unknown;
}

/**
 * Busca leads de um segmento especifico para uma marca.
 * Requer composite index: brandId ASC + segment ASC.
 */
async function getLeadsBySegment(
  brandId: string,
  segment: TargetSegment
): Promise<LeadDoc[]> {
  const colRef = collection(db, 'leads');
  const q = query(
    colRef,
    where('brandId', '==', brandId),
    where('segment', '==', segment)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as LeadDoc[];
}

/**
 * Computa metricas agregadas para um segmento.
 */
function computeSegmentMetrics(
  segment: TargetSegment,
  leads: LeadDoc[]
): SegmentMetrics {
  const totalLeads = leads.length;
  const conversions = leads.filter((l) => l.converted).length;
  const totalRevenue = leads.reduce((sum, l) => sum + (l.revenue ?? 0), 0);

  return {
    segment,
    totalLeads,
    conversions,
    totalRevenue,
    avgRevenue: totalLeads > 0 ? totalRevenue / totalLeads : 0,
    conversionRate: totalLeads > 0 ? (conversions / totalLeads) * 100 : 0,
  };
}

/**
 * Busca breakdown completo por segmento: hot, warm, cold.
 * Executa 3 queries em paralelo para performance.
 */
export async function getSegmentBreakdown(
  brandId: string
): Promise<SegmentBreakdownData> {
  const [hotLeads, warmLeads, coldLeads] = await Promise.all([
    getLeadsBySegment(brandId, 'hot'),
    getLeadsBySegment(brandId, 'warm'),
    getLeadsBySegment(brandId, 'cold'),
  ]);

  return {
    hot: computeSegmentMetrics('hot', hotLeads),
    warm: computeSegmentMetrics('warm', warmLeads),
    cold: computeSegmentMetrics('cold', coldLeads),
  };
}

/**
 * Busca metricas de um segmento especifico.
 */
export async function getSegmentMetrics(
  brandId: string,
  segment: TargetSegment
): Promise<SegmentMetrics> {
  const leads = await getLeadsBySegment(brandId, segment);
  return computeSegmentMetrics(segment, leads);
}
