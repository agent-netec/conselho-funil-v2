/**
 * Testes para POST /api/personalization/resolve
 * S31-RT-01: T-11
 */

import { POST } from '@/app/api/personalization/resolve/route';

// Mocks
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

jest.mock('@/lib/auth/brand-guard', () => ({
  requireBrandAccess: jest.fn().mockResolvedValue({ userId: 'test-user', brandId: 'brand_123' }),
}));

const mockResolve = jest.fn();
jest.mock('@/lib/intelligence/personalization/resolver', () => ({
  PersonalizationResolver: {
    resolve: (...args: unknown[]) => mockResolve(...args),
  },
}));

describe('POST /api/personalization/resolve', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('retorna 400 sem brandId', async () => {
    const req = {
      json: async () => ({ leadId: 'lead_1' }),
      nextUrl: new URL('http://localhost/api/personalization/resolve'),
      headers: { get: () => 'Bearer test-token' },
    } as any;

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  test('retorna 400 sem leadId', async () => {
    const req = {
      json: async () => ({ brandId: 'brand_123' }),
      nextUrl: new URL('http://localhost/api/personalization/resolve'),
      headers: { get: () => 'Bearer test-token' },
    } as any;

    const response = await POST(req);
    expect(response.status).toBe(400);
  });

  test('retorna variations para lead com match', async () => {
    mockResolve.mockResolvedValue({
      segment: 'hot',
      variations: [{ headline: 'Test Headline', vslId: 'vsl_1' }],
      fallback: false,
    });

    const req = {
      json: async () => ({ brandId: 'brand_123', leadId: 'lead_1' }),
      nextUrl: new URL('http://localhost/api/personalization/resolve'),
      headers: { get: () => 'Bearer test-token' },
    } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.segment).toBe('hot');
    expect(data.data.variations).toHaveLength(1);
    expect(data.data.fallback).toBe(false);
    expect(data.data.matchedRuleCount).toBe(1);
  });

  test('retorna fallback para lead sem match', async () => {
    mockResolve.mockResolvedValue({
      segment: 'cold',
      variations: [],
      fallback: true,
    });

    const req = {
      json: async () => ({ brandId: 'brand_123', leadId: 'lead_unknown' }),
      nextUrl: new URL('http://localhost/api/personalization/resolve'),
      headers: { get: () => 'Bearer test-token' },
    } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.fallback).toBe(true);
    expect(data.data.variations).toHaveLength(0);
  });
});
