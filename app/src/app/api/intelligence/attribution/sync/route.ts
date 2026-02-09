export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { AttributionBridgeService } from '@/lib/intelligence/attribution/bridge';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { JourneyEvent } from '@/types/journey';
/**
 * POST /api/intelligence/attribution/sync
 * Consumer server-side para AttributionBridgeService
 * Sprint 27 — S27-ST-10: Wiring de bridge.ts
 *
 * Request: { brandId: string, days?: number }
 * Response: { success: true, data: { synced: number } } | { error: string, code: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { brandId, days = 30 } = body;

    if (!brandId || typeof brandId !== 'string') {
      return createApiError(400, 'brandId is required', { code: 'VALIDATION_ERROR' });
    }

    const now = Timestamp.now();
    const startDate = new Timestamp(now.seconds - (days * 24 * 60 * 60), 0);

    // Buscar eventos recentes da marca
    const eventsRef = collection(db, 'events');
    const qEvents = query(
      eventsRef,
      where('brandId', '==', brandId),
      where('timestamp', '>=', startDate),
      orderBy('timestamp', 'asc')
    );
    const eventSnap = await getDocs(qEvents);
    const events = eventSnap.docs.map(d => ({ id: d.id, ...d.data() } as JourneyEvent));

    // Agrupar eventos por leadId e sincronizar cada ponte
    const eventsByLead: Record<string, JourneyEvent[]> = {};
    for (const event of events) {
      if (!event.leadId) continue;
      if (!eventsByLead[event.leadId]) {
        eventsByLead[event.leadId] = [];
      }
      eventsByLead[event.leadId].push(event);
    }

    let synced = 0;
    for (const [leadId, leadEvents] of Object.entries(eventsByLead)) {
      await AttributionBridgeService.syncEvents(leadId, leadEvents);
      synced++;
    }

    return createApiSuccess({ synced });
  } catch (error: unknown) {
    console.error('[Attribution Sync] Error:', error);
    return createApiError(500, error instanceof Error ? error.message : 'Internal server error', { code: 'INTERNAL_ERROR' });
  }
}
