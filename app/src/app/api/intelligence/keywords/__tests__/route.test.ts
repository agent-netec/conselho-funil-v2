/**
 * @jest-environment node
 */
import { POST } from '../route';
import { KeywordMiner } from '@/lib/intelligence/keywords/miner';
import { createIntelligenceDocument } from '@/lib/firebase/intelligence';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { ApiError } from '@/lib/utils/api-security';

type PostRequest = Parameters<typeof POST>[0];

const buildRequest = (jsonImpl: () => Promise<unknown>): PostRequest => ({
  json: jsonImpl,
  headers: new Headers(),
} as unknown as PostRequest);

jest.mock('@/lib/intelligence/keywords/miner', () => ({
  KeywordMiner: jest.fn(),
}));

jest.mock('@/lib/firebase/intelligence', () => ({
  createIntelligenceDocument: jest.fn(),
}));

jest.mock('@/lib/auth/brand-guard', () => ({
  requireBrandAccess: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

describe('API Route: /api/intelligence/keywords (Validação & Contrato)', () => {
  const mineMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (KeywordMiner as jest.Mock).mockImplementation(() => ({ mine: mineMock }));
    (requireBrandAccess as jest.Mock).mockResolvedValue({
      userId: 'user-1',
      brandId: 'brand-1',
    });
  });

  it('deve retornar 400 quando JSON é inválido', async () => {
    const req = buildRequest(async () => {
      throw new Error('invalid');
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('INVALID_JSON');
  });

  it('deve retornar 400 quando brandId está ausente', async () => {
    const req = buildRequest(async () => ({ seedTerm: 'marketing' }));

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
    expect(data.details.fields.brandId).toBe('required');
  });

  it('deve retornar 400 quando seedTerm está vazio', async () => {
    const req = buildRequest(async () => ({ brandId: 'brand-1', seedTerm: '   ' }));

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

    const req = buildRequest(async () => ({ brandId: 'brand-1', seedTerm: 'marketing' }));

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.count).toBe(2);
    expect(data.data.keywords).toEqual(['marketing digital', 'funil de vendas']);
    expect(data.data.persisted).toBe(2);
    expect(data.data.saveError).toBeNull();
  });

  it('deve retornar 403 em requisição cross-brand', async () => {
    (requireBrandAccess as jest.Mock).mockRejectedValueOnce(
      new ApiError(403, 'Acesso negado: brandId não pertence ao usuário')
    );

    const req = buildRequest(async () => ({ brandId: 'brand-2', seedTerm: 'marketing' }));

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data.error).toBe('Acesso negado: brandId não pertence ao usuário');
  });
});
