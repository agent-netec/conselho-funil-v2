/**
 * @jest-environment node
 */
import { POST } from '../route';
import { KeywordMiner } from '@/lib/intelligence/keywords/miner';
import { createIntelligenceDocument } from '@/lib/firebase/intelligence';

jest.mock('@/lib/intelligence/keywords/miner', () => ({
  KeywordMiner: jest.fn(),
}));

jest.mock('@/lib/firebase/intelligence', () => ({
  createIntelligenceDocument: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('API Route: /api/intelligence/keywords (Validação & Contrato)', () => {
  const mineMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (KeywordMiner as jest.Mock).mockImplementation(() => ({ mine: mineMock }));
  });

  it('deve retornar 400 quando JSON é inválido', async () => {
    const req = {
      json: async () => {
        throw new Error('invalid');
      },
      headers: new Headers(),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_JSON');
  });

  it('deve retornar 400 quando brandId está ausente', async () => {
    const req = {
      json: async () => ({ seedTerm: 'marketing' }),
      headers: new Headers(),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.details.fields.brandId).toBe('required');
  });

  it('deve retornar 400 quando seedTerm está vazio', async () => {
    const req = {
      json: async () => ({ brandId: 'brand-1', seedTerm: '   ' }),
      headers: new Headers(),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.details.fields.seedTerm).toBe('required');
  });

  it('deve retornar sucesso e persistência best-effort', async () => {
    mineMock.mockResolvedValue([
      {
        term: 'marketing digital',
        intent: 'informational',
        metrics: { volume: 50, difficulty: 20, opportunityScore: 60, trend: 0 },
        relatedTerms: [],
        suggestedBy: 'scout',
      },
      {
        term: 'funil de vendas',
        intent: 'commercial',
        metrics: { volume: 40, difficulty: 15, opportunityScore: 70, trend: 0 },
        relatedTerms: [],
        suggestedBy: 'scout',
      },
    ]);

    (createIntelligenceDocument as jest.Mock)
      .mockResolvedValueOnce('id-1')
      .mockResolvedValueOnce('id-2');

    const req = {
      json: async () => ({ brandId: 'brand-1', seedTerm: 'marketing' }),
      headers: new Headers(),
    } as any;

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.count).toBe(2);
    expect(data.keywords).toEqual(['marketing digital', 'funil de vendas']);
    expect(data.persisted).toBe(2);
    expect(data.saveError).toBeNull();
  });
});
