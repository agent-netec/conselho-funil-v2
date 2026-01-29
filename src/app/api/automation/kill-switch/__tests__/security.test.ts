import { POST } from '../route';
import { NextResponse } from 'next/server';

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

describe('Kill-Switch API - Guardrail P0 Validation', () => {
  const validRequest: KillSwitchRequest = {
    brandId: 'brand_123',
    funnelId: 'funnel_456',
    reason: 'Checkout CVR dropped to 0.1%',
    severity: 'critical',
    affectedAdEntities: [
      { platform: 'meta', externalId: 'camp_1', type: 'campaign' }
    ]
  };

  /**
   * TESTE DE SEGURANÇA: Validar se a API bloqueia execução direta.
   * No MVP, o status DEVE ser 'pending_approval'.
   */
  test('GUARDRAIL P0: Kill-Switch must NOT execute immediately, should return pending_approval', async () => {
    const req = {
      json: async () => validRequest,
      nextUrl: new URL('http://localhost/api/automation/kill-switch'),
    } as any;

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('pending_approval');
    expect(data.message).toContain('Pending human approval');
  });

  /**
   * TESTE DE VALIDAÇÃO: Campos obrigatórios.
   */
  test('VALIDATION: should fail if required fields are missing', async () => {
    const invalidRequest = { ...validRequest, brandId: '' };
    const req = {
      json: async () => invalidRequest,
      nextUrl: new URL('http://localhost/api/automation/kill-switch'),
    } as any;

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
