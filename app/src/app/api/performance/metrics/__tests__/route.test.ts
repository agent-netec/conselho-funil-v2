import { GET } from '../route';

describe('API: /api/performance/metrics', () => {
  const createMockRequest = (url: string) => {
    return {
      url,
    } as any;
  };

  it('deve retornar status 400 se brandId estiver faltando', async () => {
    const req = createMockRequest('http://localhost/api/performance/metrics');
    const response: any = await GET(req);
    
    // Suporte para Response nativo ou objeto mockado
    const status = response.status;
    expect(status).toBe(400);
  });

  it('deve retornar dados de mock quando mock=true', async () => {
    const req = createMockRequest('http://localhost/api/performance/metrics?brandId=brand_123&mock=true');
    const response: any = await GET(req);
    expect(response.status).toBe(200);
    
    // Extração segura do body
    let body;
    if (typeof response.text === 'function') {
      body = JSON.parse(await response.text());
    } else if (typeof response.json === 'function') {
      body = await response.json();
    } else {
      body = response._getJSONData ? response._getJSONData() : response.data;
    }

    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('deve retornar status 501 (Not Implemented) quando mock=false', async () => {
    const req = createMockRequest('http://localhost/api/performance/metrics?brandId=brand_123');
    const response: any = await GET(req);
    expect(response.status).toBe(501);
  });
});
