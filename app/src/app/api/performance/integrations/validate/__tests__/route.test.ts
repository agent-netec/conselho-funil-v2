/**
 * @jest-environment node
 */
import { POST } from '../route';

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('@/lib/auth/brand-guard', () => ({
  requireBrandAccess: jest.fn().mockResolvedValue(undefined),
}));

describe('API: /api/performance/integrations/validate', () => {
  const createMockRequest = (body: any) => {
    return {
      json: async () => body,
    } as any;
  };

  it('deve retornar status 400 se brandId estiver faltando', async () => {
    const req = createMockRequest({ 
      platform: 'meta', 
      apiKey: 'sk_123', 
      accountId: 'acc_123' 
    });

    const response: any = await POST(req);
    // Verificando se o status está presente (pode estar em response.status ou response._status)
    const status = response.status;
    expect(status).toBe(400);
  });

  it('deve validar com sucesso no modo mock=true com chave válida', async () => {
    const req = createMockRequest({ 
      brandId: 'brand_123', 
      platform: 'meta', 
      apiKey: 'meta_key_123', 
      accountId: 'acc_123',
      mock: true 
    });

    const response: any = await POST(req);
    expect(response.status).toBe(200);
  });
});
