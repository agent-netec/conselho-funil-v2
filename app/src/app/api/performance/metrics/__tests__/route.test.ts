/**
 * @jest-environment node
 */
import { GET } from '../route';

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('@/lib/auth/brand-guard', () => ({
  requireBrandAccess: jest.fn().mockResolvedValue({ userId: 'test-user' }),
}));

jest.mock('@/lib/utils/api-security', () => ({
  handleSecurityError: jest.fn().mockImplementation((error: any) => {
    const status = error.statusCode || error.status || 500;
    return new Response(JSON.stringify({ error: error.message }), { status });
  }),
}));

// Mock Firestore doc/getDoc/setDoc para cache
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: () => ({ toDate: () => new Date(), seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }),
    fromDate: (d: Date) => ({ toDate: () => d, seconds: Math.floor(d.getTime() / 1000), nanoseconds: 0 }),
  },
  doc: jest.fn().mockReturnValue({ path: 'mock-path' }),
  getDoc: jest.fn().mockResolvedValue({ exists: () => false }),
  setDoc: jest.fn().mockResolvedValue(undefined),
}));

// Mock token refresh — simula "sem tokens configurados"
jest.mock('@/lib/integrations/ads/token-refresh', () => ({
  ensureFreshToken: jest.fn().mockRejectedValue(new Error('No token configured')),
  tokenToCredentials: jest.fn(),
}));

describe('API: /api/performance/metrics', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
    } as any;
  };

  it('deve retornar status 400 se brandId estiver faltando', async () => {
    const req = createMockRequest('http://localhost/api/performance/metrics');
    const response: any = await GET(req);
    
    const status = response.status;
    expect(status).toBe(400);
  });

  it('deve retornar dados de mock quando mock=true', async () => {
    const req = createMockRequest('http://localhost/api/performance/metrics?brandId=brand_123&mock=true');
    const response: any = await GET(req);
    expect(response.status).toBe(200);
    
    let body;
    if (typeof response.text === 'function') {
      body = JSON.parse(await response.text());
    } else if (typeof response.json === 'function') {
      body = await response.json();
    } else {
      body = response._getJSONData ? response._getJSONData() : response.data;
    }

    expect(body.success).toBe(true);
    expect(body.data).toBeDefined();
    expect(Array.isArray(body.data.metrics)).toBe(true);
    expect(body.data.metrics.length).toBeGreaterThan(0);
  });

  it('deve retornar 502 quando APIs externas falham e sem cache (S30-PERF-01)', async () => {
    const req = createMockRequest('http://localhost/api/performance/metrics?brandId=brand_123');
    const response: any = await GET(req);
    // Sem cache e sem tokens → 502 Bad Gateway (APIs indisponíveis)
    expect(response.status).toBe(502);
  });

  it('deve retornar cache stale com warning quando APIs falham mas cache existe (P-05)', async () => {
    const { getDoc } = require('firebase/firestore');
    // Simular cache existente mas stale (30min atrás)
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        metrics: [{ id: 'cached_metric', brandId: 'brand_123' }],
        updatedAt: { toDate: () => new Date(Date.now() - 30 * 60 * 1000) },
      }),
    });

    const req = createMockRequest('http://localhost/api/performance/metrics?brandId=brand_123');
    const response: any = await GET(req);
    expect(response.status).toBe(200);

    let body;
    if (typeof response.text === 'function') {
      body = JSON.parse(await response.text());
    } else if (typeof response.json === 'function') {
      body = await response.json();
    }

    expect(body.success).toBe(true);
    expect(body.data.cached).toBe(true);
    expect(body.data.warning).toBeDefined();
  });

  it('deve retornar cache fresh direto sem fetch externo quando TTL válido (DT-12)', async () => {
    const { getDoc } = require('firebase/firestore');
    // Simular cache fresh (5min atrás — dentro do TTL de 15min)
    (getDoc as jest.Mock).mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        metrics: [{ id: 'fresh_metric', brandId: 'brand_123' }],
        updatedAt: { toDate: () => new Date(Date.now() - 5 * 60 * 1000) },
      }),
    });

    const req = createMockRequest('http://localhost/api/performance/metrics?brandId=brand_123');
    const response: any = await GET(req);
    expect(response.status).toBe(200);

    let body;
    if (typeof response.text === 'function') {
      body = JSON.parse(await response.text());
    } else if (typeof response.json === 'function') {
      body = await response.json();
    }

    expect(body.success).toBe(true);
    expect(body.data.cached).toBe(true);
  });
});
