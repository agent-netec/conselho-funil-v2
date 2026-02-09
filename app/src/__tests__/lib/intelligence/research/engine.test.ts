import { ResearchEngine } from '@/lib/intelligence/research/engine';

jest.mock('@/lib/firebase/research', () => ({
  getCachedResearch: jest.fn(),
  saveResearch: jest.fn().mockResolvedValue('research-1'),
}));

jest.mock('@/lib/mcp/adapters/exa', () => ({
  ExaAdapter: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      data: {
        results: [
          { url: 'https://example.com/market', title: 'Market', snippet: 'Resumo mercado', score: 0.9 },
          { url: 'https://example.com/trends', title: 'Trends', snippet: 'Resumo trends', score: 0.8 },
        ],
      },
    }),
  })),
}));

jest.mock('@/lib/mcp/adapters/firecrawl', () => ({
  FirecrawlAdapter: jest.fn().mockImplementation(() => ({
    execute: jest.fn().mockResolvedValue({
      success: true,
      data: { markdown: 'Conteudo aprofundado firecrawl' },
    }),
  })),
}));

jest.mock('@/lib/intelligence/research/dossier-generator', () => ({
  DossierGenerator: {
    synthesize: jest.fn().mockResolvedValue({
      marketOverview: 'Visao geral',
      marketSize: 'TAM em crescimento',
      trends: ['Trend A'],
      competitors: [],
      opportunities: ['Opp A'],
      threats: ['Threat A'],
      recommendations: ['Rec A'],
    }),
  },
}));

describe('ResearchEngine', () => {
  const repo = jest.requireMock('@/lib/firebase/research') as {
    getCachedResearch: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna cache quando disponível', async () => {
    repo.getCachedResearch.mockResolvedValueOnce({
      id: 'cached-1',
      brandId: 'brand-1',
      topic: 'tema',
      status: 'completed',
      sections: {
        marketOverview: 'cached',
        marketSize: '',
        trends: [],
        competitors: [],
        opportunities: [],
        threats: [],
        recommendations: [],
      },
      sources: [],
      generatedAt: { toMillis: () => 1 },
      expiresAt: { toMillis: () => 2 },
    });

    const result = await ResearchEngine.generateDossier({
      brandId: 'brand-1',
      topic: 'tema',
      depth: 'quick',
    });

    expect(result.id).toBe('cached-1');
  });

  it('gera dossier com status completed quando pipeline funciona', async () => {
    repo.getCachedResearch.mockResolvedValueOnce(null);
    const result = await ResearchEngine.generateDossier({
      brandId: 'brand-1',
      topic: 'tema',
      depth: 'standard',
    });
    expect(result.status).toBe('completed');
    expect(result.sources.length).toBeGreaterThan(0);
  });
});
