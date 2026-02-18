export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { ingestJourneyEvent } from '@/lib/intelligence/journey/bridge';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/tracking/ingest
 * Public endpoint for tracking script event ingestion.
 * No auth required — events come from external sites via the tracking script.
 * Rate limited: 100 events/min per brandId (Firestore-based).
 * CORS enabled for cross-origin requests.
 */

const MAX_EVENTS_PER_MIN = 100;
const WINDOW_MS = 60_000;
const MAX_BATCH_SIZE = 10;

interface TrackingEvent {
  brandId: string;
  type: string;
  source?: string;
  payload?: Record<string, unknown>;
  session?: {
    sessionId?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
  ts?: number;
}

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const events: TrackingEvent[] = Array.isArray(body.events) ? body.events : [body];

    if (!events.length || events.length > MAX_BATCH_SIZE) {
      return withCors(createApiError(400, `Batch must contain 1-${MAX_BATCH_SIZE} events`));
    }

    // Validate all events have the same brandId
    const brandId = events[0]?.brandId;
    if (!brandId || !/^[a-zA-Z0-9_-]+$/.test(brandId)) {
      return withCors(createApiError(400, 'Invalid or missing brandId'));
    }

    for (const evt of events) {
      if (evt.brandId !== brandId) {
        return withCors(createApiError(400, 'All events in batch must share the same brandId'));
      }
    }

    // Rate limiting: 100 events/min per brandId
    const allowed = await checkRateLimit(brandId, events.length);
    if (!allowed) {
      return withCors(createApiError(429, 'Rate limit exceeded', {
        code: 'TRACKING_RATE_LIMIT',
        details: { maxEventsPerMin: MAX_EVENTS_PER_MIN },
      }));
    }

    // Ingest each event
    const results: Array<{ eventId?: string; error?: string }> = [];
    for (const evt of events) {
      try {
        // Skip events without a valid type
        const type = mapEventType(evt.type);
        if (!type) {
          results.push({ error: `Invalid event type: ${evt.type}` });
          continue;
        }

        // For lead_capture events, we use the hashed email from payload
        // For other events, we use a session-based anonymous identifier
        const email = (evt.payload?.email as string) || `anon_${evt.session?.sessionId || 'unknown'}@tracking.local`;

        const result = await ingestJourneyEvent({
          brandId,
          email,
          type,
          source: 'web',
          payload: sanitizePayload(evt.payload),
          session: {
            sessionId: evt.session?.sessionId || 'unknown',
            utmSource: evt.session?.utmSource,
            utmMedium: evt.session?.utmMedium,
            utmCampaign: evt.session?.utmCampaign,
          },
        });

        results.push({ eventId: result.eventId });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        logger.error('[Tracking Ingest] Event processing failed', { error: msg, meta: { brandId } });
        results.push({ error: msg });
      }
    }

    return withCors(createApiSuccess({ ingested: results.filter(r => r.eventId).length, results }));
  } catch (error) {
    logger.error('[Tracking Ingest] Request failed', { error: error instanceof Error ? error.message : 'Unknown' });
    return withCors(createApiError(500, 'Internal error processing tracking events'));
  }
}

// --- Helpers ---

function mapEventType(raw: string): 'page_view' | 'lead_capture' | 'checkout_init' | 'custom' | null {
  switch (raw) {
    case 'page_view': return 'page_view';
    case 'lead_capture': return 'lead_capture';
    case 'checkout_start':
    case 'checkout_init': return 'checkout_init';
    case 'purchase_complete': return 'custom'; // stored as custom with metadata
    default: return raw ? 'custom' : null;
  }
}

function sanitizePayload(payload?: Record<string, unknown>): Record<string, unknown> {
  if (!payload) return {};
  const clean: Record<string, unknown> = {};
  const allowedKeys = ['url', 'referrer', 'title', 'duration', 'scrollDepth', 'formId', 'event', 'amount', 'productId', 'productName'];
  for (const key of allowedKeys) {
    if (payload[key] !== undefined) {
      const val = payload[key];
      // Only allow primitives
      if (typeof val === 'string') {
        clean[key] = val.slice(0, 500); // Max 500 chars per field
      } else if (typeof val === 'number') {
        clean[key] = val;
      } else if (typeof val === 'boolean') {
        clean[key] = val;
      }
    }
  }
  return clean;
}

/** Firestore-based rate limiter for tracking events */
async function checkRateLimit(brandId: string, eventCount: number): Promise<boolean> {
  const rateLimitRef = doc(db, 'brands', brandId, 'rate_limits', 'tracking_ingest');
  const now = Timestamp.now();

  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(rateLimitRef);

      if (!snap.exists()) {
        transaction.set(rateLimitRef, { count: eventCount, windowStart: now });
        return true;
      }

      const data = snap.data() as { count: number; windowStart: Timestamp };
      const windowAge = now.toMillis() - data.windowStart.toMillis();

      if (windowAge >= WINDOW_MS) {
        transaction.update(rateLimitRef, { count: eventCount, windowStart: now });
        return true;
      }

      if (data.count + eventCount > MAX_EVENTS_PER_MIN) {
        return false;
      }

      transaction.update(rateLimitRef, { count: data.count + eventCount });
      return true;
    });
  } catch (err) {
    // Fail-open: allow request if Firestore is temporarily unavailable
    logger.error('[Tracking RateLimit] Transaction failed', { error: err instanceof Error ? err.message : 'Unknown' });
    return true;
  }
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function withCors(response: NextResponse): NextResponse {
  const headers = corsHeaders();
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}
