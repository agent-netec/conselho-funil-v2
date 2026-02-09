/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server';

// In-memory store for Firestore docs
const firestoreStore: Record<string, Record<string, unknown>> = {};
let mockNowMs = 1_000_000;

// Override firebase/firestore mock with runTransaction support (DT-01)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn((_db: unknown, ...pathSegments: string[]) => pathSegments.join('/')),
  runTransaction: jest.fn(
    async (
      _db: unknown,
      callback: (transaction: {
        get: (ref: string) => Promise<{ exists: () => boolean; data: () => Record<string, unknown> | undefined }>;
        set: (ref: string, data: Record<string, unknown>) => void;
        update: (ref: string, data: Record<string, unknown>) => void;
      }) => Promise<boolean>
    ) => {
      const transaction = {
        get: jest.fn(async (ref: string) => {
          const data = firestoreStore[ref];
          return {
            exists: () => !!data,
            data: () => (data ? { ...data } : undefined),
          };
        }),
        set: jest.fn((ref: string, data: Record<string, unknown>) => {
          firestoreStore[ref] = { ...data };
        }),
        update: jest.fn((ref: string, data: Record<string, unknown>) => {
          firestoreStore[ref] = { ...(firestoreStore[ref] || {}), ...data };
        }),
      };
      return callback(transaction);
    }
  ),
  Timestamp: {
    now: jest.fn(() => ({
      toMillis: () => mockNowMs,
    })),
    fromDate: jest.fn(),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: 'mock-db',
}));

// Import AFTER mocks are set up
import { withRateLimit, RateLimitConfig } from '@/lib/middleware/rate-limiter';

describe('Rate Limiter — S32-RL-01/02', () => {
  const mockHandler = jest.fn(async () => NextResponse.json({ ok: true }));

  const config: RateLimitConfig = {
    maxRequests: 5,
    windowMs: 60_000,
    scope: 'test',
  };

  function buildPOSTRequest(brandId: string): NextRequest {
    return new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({ brandId }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  function buildGETRequest(brandId: string): NextRequest {
    return new NextRequest(
      `http://localhost/api/test?brandId=${brandId}`,
      { method: 'GET' }
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear the in-memory store
    Object.keys(firestoreStore).forEach((key) => delete firestoreStore[key]);
    mockNowMs = 1_000_000;
    mockHandler.mockClear();
    mockHandler.mockImplementation(async () => NextResponse.json({ ok: true }));
  });

  it('permite request dentro do limite — handler executado normalmente', async () => {
    const wrapped = withRateLimit(mockHandler, config);
    const req = buildPOSTRequest('brand-1');

    const res = await wrapped(req);
    const data = await res.json();

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(data.ok).toBe(true);
    // Verify Firestore doc was created with count=1
    expect(firestoreStore['brands/brand-1/rate_limits/test']).toBeDefined();
    expect(firestoreStore['brands/brand-1/rate_limits/test'].count).toBe(1);
  });

  it('retorna 429 com Retry-After quando excede limite', async () => {
    // Pre-fill store: count already at maxRequests, window still active
    firestoreStore['brands/brand-1/rate_limits/test'] = {
      count: 5,
      windowStart: { toMillis: () => mockNowMs - 10_000 }, // 10s ago, within 60s window
    };

    const wrapped = withRateLimit(mockHandler, config);
    const req = buildPOSTRequest('brand-1');

    const res = await wrapped(req);
    const body = await res.json();

    expect(mockHandler).not.toHaveBeenCalled();
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    expect(body.error).toBe('Rate limit exceeded');
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
  });

  it('reseta window apos expirar windowMs — contador volta a 1', async () => {
    // Pre-fill store: count at max, but window expired (70s > 60s windowMs)
    firestoreStore['brands/brand-1/rate_limits/test'] = {
      count: 5,
      windowStart: { toMillis: () => mockNowMs - 70_000 },
    };

    const wrapped = withRateLimit(mockHandler, config);
    const req = buildPOSTRequest('brand-1');

    const res = await wrapped(req);
    const data = await res.json();

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(data.ok).toBe(true);
    // Verify the store was reset to count=1
    expect(firestoreStore['brands/brand-1/rate_limits/test'].count).toBe(1);
  });

  it('isola contadores por brandId — brands diferentes nao interferem', async () => {
    // Brand-1 is at the limit
    firestoreStore['brands/brand-1/rate_limits/test'] = {
      count: 5,
      windowStart: { toMillis: () => mockNowMs - 10_000 },
    };

    const wrapped = withRateLimit(mockHandler, config);

    // Brand-1 should be blocked (429)
    const req1 = buildPOSTRequest('brand-1');
    const res1 = await wrapped(req1);
    expect(res1.status).toBe(429);
    expect(mockHandler).not.toHaveBeenCalled();

    // Brand-2 should pass (no prior requests)
    const req2 = buildPOSTRequest('brand-2');
    const res2 = await wrapped(req2);
    const data2 = await res2.json();
    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(data2.ok).toBe(true);

    // Brand-2 has its own counter
    expect(firestoreStore['brands/brand-2/rate_limits/test']).toBeDefined();
    expect(firestoreStore['brands/brand-2/rate_limits/test'].count).toBe(1);
  });

  it('passa request sem brandId direto para o handler (sem rate limit)', async () => {
    const wrapped = withRateLimit(mockHandler, config);
    const req = new NextRequest('http://localhost/api/test', {
      method: 'POST',
      body: JSON.stringify({ message: 'hello' }), // no brandId
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await wrapped(req);
    const data = await res.json();

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(data.ok).toBe(true);
  });

  it('extrai brandId de query param (GET)', async () => {
    const wrapped = withRateLimit(mockHandler, config);
    const req = buildGETRequest('brand-get-1');

    const res = await wrapped(req);
    const data = await res.json();

    expect(mockHandler).toHaveBeenCalledTimes(1);
    expect(data.ok).toBe(true);
    expect(firestoreStore['brands/brand-get-1/rate_limits/test']).toBeDefined();
  });
});
