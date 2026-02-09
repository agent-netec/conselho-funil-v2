import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  LTVBatchResult,
  LTVEstimation,
  LTVMultiplierConfig,
  PredictiveConfig,
} from '@/types/predictive';

const DEFAULT_MULTIPLIERS: LTVMultiplierConfig = {
  hot: { m1: 1.3, m3: 2.5, m6: 3.8, m12: 5.2 },
  warm: { m1: 1.1, m3: 1.8, m6: 2.4, m12: 3.0 },
  cold: { m1: 1.0, m3: 1.2, m6: 1.5, m12: 1.8 },
};

type Segment = 'hot' | 'warm' | 'cold';

export class LTVEstimator {
  static async estimateBatch(brandId: string): Promise<LTVBatchResult> {
    const now = Timestamp.now();
    const multipliers = await this.getMultipliers(brandId);
    const segments: Segment[] = ['hot', 'warm', 'cold'];
    const cohorts: LTVEstimation[] = [];

    for (const segment of segments) {
      cohorts.push(await this.estimateSegment(brandId, segment, multipliers[segment], now));
    }

    const totalLeads = cohorts.reduce((sum, c) => sum + c.leadsInCohort, 0);
    const totalRevenue = cohorts.reduce((sum, c) => sum + c.totalRevenue, 0);
    const overallLTV = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    return { brandId, cohorts, overallLTV, calculatedAt: now };
  }

  private static async getMultipliers(brandId: string): Promise<LTVMultiplierConfig> {
    try {
      const configRef = doc(db, 'brands', brandId, 'predictive_config', 'settings');
      const configSnap = await getDoc(configRef);
      if (!configSnap.exists()) return DEFAULT_MULTIPLIERS;

      const cfg = configSnap.data() as PredictiveConfig;
      if (!cfg.ltvMultipliers) return DEFAULT_MULTIPLIERS;
      return cfg.ltvMultipliers;
    } catch {
      return DEFAULT_MULTIPLIERS;
    }
  }

  private static async estimateSegment(
    brandId: string,
    segment: Segment,
    multiplier: LTVMultiplierConfig['hot'],
    now: Timestamp
  ): Promise<LTVEstimation> {
    const leadsRef = collection(db, 'brands', brandId, 'leads');
    const leadsSnap = await getDocs(query(leadsRef, where('segment', '==', segment)));
    const leadsInCohort = leadsSnap.size;

    let totalRevenue = 0;
    if (leadsInCohort > 0) {
      const leadIds = leadsSnap.docs.map((d) => d.id);
      for (let i = 0; i < leadIds.length; i += 10) {
        const group = leadIds.slice(i, i + 10);
        if (group.length === 0) continue;
        const eventsRef = collection(db, 'brands', brandId, 'journey_events');
        const purchaseSnap = await getDocs(
          query(eventsRef, where('leadId', 'in', group), where('type', '==', 'purchase'))
        );
        for (const eventDoc of purchaseSnap.docs) {
          const eventData = eventDoc.data() as { revenue?: number };
          totalRevenue += eventData.revenue ?? 0;
        }
      }
    }

    const avgRevenuePerLead = leadsInCohort > 0 ? totalRevenue / leadsInCohort : 0;
    const projectedLTV = {
      m1: avgRevenuePerLead * multiplier.m1,
      m3: avgRevenuePerLead * multiplier.m3,
      m6: avgRevenuePerLead * multiplier.m6,
      m12: avgRevenuePerLead * multiplier.m12,
    };

    const confidenceScore =
      leadsInCohort < 10 ? 0.3 : leadsInCohort < 50 ? 0.6 : leadsInCohort < 200 ? 0.8 : 0.9;

    return {
      brandId,
      cohortId: `${brandId}-${segment}`,
      cohortName: `Segmento ${segment.toUpperCase()}`,
      segment,
      leadsInCohort,
      totalRevenue,
      avgRevenuePerLead,
      projectedLTV,
      growthMultiplier: multiplier.m12,
      confidenceScore,
      calculatedAt: now,
    };
  }
}
