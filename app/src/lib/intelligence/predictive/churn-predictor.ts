import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ChurnBatchResult, ChurnPrediction } from '@/types/predictive';

const BATCH_LIMIT = 500;
const MIN_LEAD_AGE_HOURS = 48;
const DEFAULT_HIGH_RISK = 0.8;

type Segment = 'hot' | 'warm' | 'cold';
type Trend = 'rising' | 'stable' | 'declining';

export class ChurnPredictor {
  static async predictBatch(brandId: string, cursor?: string): Promise<ChurnBatchResult> {
    const now = Timestamp.now();
    const leadsRef = collection(db, 'brands', brandId, 'leads');

    let leadsQuery = query(leadsRef, orderBy('__name__'), limit(BATCH_LIMIT + 1));
    if (cursor) {
      const cursorRef = doc(db, 'brands', brandId, 'leads', cursor);
      const cursorSnap = await getDoc(cursorRef);
      if (cursorSnap.exists()) {
        leadsQuery = query(leadsRef, orderBy('__name__'), startAfter(cursorSnap), limit(BATCH_LIMIT + 1));
      }
    }

    const leadsSnapshot = await getDocs(leadsQuery);
    const docs = leadsSnapshot.docs;
    const hasMore = docs.length > BATCH_LIMIT;
    const leadsToProcess = hasMore ? docs.slice(0, BATCH_LIMIT) : docs;
    const nextCursor = hasMore ? leadsToProcess[leadsToProcess.length - 1]?.id : undefined;

    const predictions: ChurnPrediction[] = [];
    for (const leadDoc of leadsToProcess) {
      const lead = leadDoc.data() as {
        createdAt?: Timestamp;
        segment?: Segment;
      };

      if (lead.createdAt) {
        const ageMs = now.toMillis() - lead.createdAt.toMillis();
        if (ageMs < MIN_LEAD_AGE_HOURS * 60 * 60 * 1000) {
          continue;
        }
      }

      const currentSegment = lead.segment ?? 'cold';
      const eventProbe = await this.getLastEventTimestamp(brandId, leadDoc.id);
      const noEvents = eventProbe === null;
      const daysSinceLastEvent = noEvents
        ? 30
        : (now.toMillis() - eventProbe.toMillis()) / (1000 * 60 * 60 * 24);

      const engagementTrend = await this.calculateEngagementTrend(brandId, leadDoc.id, now);
      predictions.push(
        this.calculateChurnRisk(
          leadDoc.id,
          brandId,
          currentSegment,
          daysSinceLastEvent,
          engagementTrend,
          noEvents,
          now
        )
      );
    }

    const atRisk = predictions.filter((p) => p.riskLevel !== 'safe').length;
    return {
      brandId,
      totalLeads: leadsToProcess.length,
      atRisk,
      predictions,
      nextCursor,
      hasMore,
      calculatedAt: now,
    };
  }

  private static async getLastEventTimestamp(brandId: string, leadId: string): Promise<Timestamp | null> {
    const eventsRef = collection(db, 'brands', brandId, 'journey_events');
    const eventQuery = query(eventsRef, where('leadId', '==', leadId), orderBy('timestamp', 'desc'), limit(1));
    const snap = await getDocs(eventQuery);
    if (snap.empty) return null;
    const eventData = snap.docs[0].data() as { timestamp?: Timestamp };
    return eventData.timestamp ?? null;
  }

  private static async calculateEngagementTrend(
    brandId: string,
    leadId: string,
    now: Timestamp
  ): Promise<Trend> {
    const eventsRef = collection(db, 'brands', brandId, 'journey_events');
    const sevenDaysAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = Timestamp.fromMillis(now.toMillis() - 14 * 24 * 60 * 60 * 1000);

    const recent = await getDocs(
      query(eventsRef, where('leadId', '==', leadId), where('timestamp', '>=', sevenDaysAgo))
    );
    const older = await getDocs(
      query(
        eventsRef,
        where('leadId', '==', leadId),
        where('timestamp', '>=', fourteenDaysAgo),
        where('timestamp', '<', sevenDaysAgo)
      )
    );

    if (recent.size > older.size) return 'rising';
    if (recent.size < older.size) return 'declining';
    return 'stable';
  }

  private static calculateChurnRisk(
    leadId: string,
    brandId: string,
    currentSegment: Segment,
    daysSinceLastEvent: number,
    engagementTrend: Trend,
    noEvents: boolean,
    now: Timestamp
  ): ChurnPrediction {
    let churnRisk = noEvents ? DEFAULT_HIGH_RISK : Math.min(daysSinceLastEvent / 30, 1);

    if (!noEvents) {
      if (engagementTrend === 'declining') churnRisk = Math.min(churnRisk + 0.2, 1);
      if (engagementTrend === 'rising') churnRisk = Math.max(churnRisk - 0.2, 0);
      if (currentSegment === 'hot' && daysSinceLastEvent > 5) {
        churnRisk = Math.min(churnRisk + 0.15, 1);
      }
    }

    const safeRisk = Math.max(0, Math.min(1, churnRisk));
    const riskLevel: ChurnPrediction['riskLevel'] =
      safeRisk >= 0.7 ? 'critical' : safeRisk >= 0.4 ? 'warning' : 'safe';

    let predictedSegment: Segment = currentSegment;
    if (safeRisk >= 0.7 && currentSegment === 'hot') predictedSegment = 'warm';
    if (safeRisk >= 0.7 && currentSegment === 'warm') predictedSegment = 'cold';

    const factors: string[] = [];
    if (daysSinceLastEvent > 14) factors.push(`${Math.round(daysSinceLastEvent)}d sem atividade`);
    if (engagementTrend === 'declining') factors.push('Engajamento em declínio');
    if (noEvents) factors.push('Nenhum evento registrado');
    if (currentSegment === 'hot' && daysSinceLastEvent > 5) factors.push('Lead hot com inatividade');

    return {
      leadId,
      brandId,
      currentSegment,
      predictedSegment,
      churnRisk: safeRisk,
      riskLevel,
      daysSinceLastEvent: Math.round(daysSinceLastEvent),
      engagementTrend,
      factors,
      predictedAt: now,
    };
  }
}
