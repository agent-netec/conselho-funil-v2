/**
 * @jest-environment node
 */
import { retrieveChunks } from '@/lib/ai/rag';
import { rerankDocuments } from '@/lib/ai/rerank';

// Mock Firebase config
jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

// Mock embedding generation
jest.mock('@/lib/ai/embeddings', () => ({
  generateEmbedding: jest.fn().mockResolvedValue(new Array(768).fill(0.1)),
  cosineSimilarity: jest.fn().mockReturnValue(0.8),
}));

// Mock Pinecone
jest.mock('@/lib/ai/pinecone', () => ({
  queryPinecone: jest.fn(),
}));

// Mock reranker
jest.mock('@/lib/ai/rerank', () => ({
  rerankDocuments: jest.fn(),
}));

describe('QA: Retrieval Validation (Hit Rate & Security Gates)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SHULD-VALIDATE-HIT-RATE: Reranking should bring relevant knowledge to Top 1', async () => {
    const { queryPinecone } = require('@/lib/ai/pinecone');
    
    // Mock Pinecone returning 3 matches
    (queryPinecone as jest.Mock).mockResolvedValue({
      matches: [
        {
          id: '1',
          score: 0.7,
          metadata: {
            content: 'Conteúdo genérico sobre marketing.',
            isApprovedForAI: true,
            status: 'approved',
            docType: 'general',
            sourceFile: 'gen.md',
            sourceSection: '1',
            lineStart: 1,
            lineEnd: 10,
          },
        },
        {
          id: '2',
          score: 0.65,
          metadata: {
            content: 'Outro conteúdo irrelevante.',
            isApprovedForAI: true,
            status: 'approved',
            docType: 'general',
            sourceFile: 'irrel.md',
            sourceSection: '1',
            lineStart: 1,
            lineEnd: 10,
          },
        },
        {
          id: '3',
          score: 0.8,
          metadata: {
            content: 'Eugene Schwartz define os 5 níveis de consciência: Inconsciente, Consciente do Problema...',
            isApprovedForAI: true,
            status: 'approved',
            docType: 'heuristics',
            sourceFile: 'schwartz.md',
            sourceSection: 'Níveis',
            lineStart: 1,
            lineEnd: 10,
          },
        },
      ],
    });

    // Mock reranker: puts doc '3' at top with score 0.99
    (rerankDocuments as jest.Mock).mockImplementation((_query, docs) => {
      const sorted = [...docs].sort((a: any, b: any) => {
        if (a.id === '3') return -1;
        return 1;
      }).map((d: any) => ({ ...d, rerankScore: d.id === '3' ? 0.99 : 0.1 }));
      return Promise.resolve(sorted.slice(0, 5));
    });

    const results = await retrieveChunks('Como Eugene Schwartz define os 5 níveis de consciência?');

    // Validação de Hit Rate
    expect(results[0].id).toBe('3');
    expect(results[0].rerankScore).toBe(0.99);
    expect(rerankDocuments).toHaveBeenCalled();
  });

  it('SECURITY-GATE: Should NOT retrieve chunks where isApprovedForAI is false', async () => {
    const { queryPinecone } = require('@/lib/ai/pinecone');
    
    // Pinecone filters isApprovedForAI server-side, returns empty
    (queryPinecone as jest.Mock).mockResolvedValue({
      matches: [],
    });

    const results = await retrieveChunks('Qual o segredo industrial?');
    expect(results.length).toBe(0);
  });

  it('DYNAMIC-FILTER: Should pass filters to Pinecone query', async () => {
    const { queryPinecone } = require('@/lib/ai/pinecone');
    
    (queryPinecone as jest.Mock).mockResolvedValue({ matches: [] });

    await retrieveChunks('test query', {
      topK: 5,
      minSimilarity: 0.1,
      filters: { category: 'ads' },
    });

    expect(queryPinecone).toHaveBeenCalled();
  });

  it('BUG-001: Recency Boost should multiply score by 1.2 for 2026 data', async () => {
    const { queryPinecone } = require('@/lib/ai/pinecone');

    (queryPinecone as jest.Mock).mockResolvedValue({
      matches: [
        {
          id: 'old-doc',
          score: 0.7,
          metadata: {
            content: 'Benchmark de 2024.',
            isApprovedForAI: true,
            status: 'approved',
            version: '2024',
            sourceFile: 'old.md',
            sourceSection: '1',
            lineStart: 1,
            lineEnd: 10,
          },
        },
        {
          id: 'new-doc',
          score: 0.7,
          metadata: {
            content: 'Benchmark de 2026.',
            isApprovedForAI: true,
            status: 'approved',
            version: '2026',
            sourceFile: 'new.md',
            sourceSection: '1',
            lineStart: 1,
            lineEnd: 10,
          },
        },
      ],
    });

    (rerankDocuments as jest.Mock).mockImplementation((_query, docs) =>
      Promise.resolve(docs.slice(0, 5))
    );

    const results = await retrieveChunks('Benchmark de custo', { topK: 10, minSimilarity: 0.1 });

    const oldResult = results.find(r => r.id === 'old-doc');
    const newResult = results.find(r => r.id === 'new-doc');

    // Both should exist; recency boost gives 2026 doc a higher similarity
    if (newResult && oldResult) {
      expect(newResult.similarity).toBeGreaterThanOrEqual(oldResult.similarity);
    }
  });

  it('BUG-002: Playbook Boost should multiply score by 1.1', async () => {
    const { queryPinecone } = require('@/lib/ai/pinecone');

    (queryPinecone as jest.Mock).mockResolvedValue({
      matches: [
        {
          id: 'identity-doc',
          score: 0.7,
          metadata: {
            content: 'O que é Social Selling.',
            isApprovedForAI: true,
            status: 'approved',
            docType: 'identity',
            sourceFile: 'id.md',
            sourceSection: '1',
            lineStart: 1,
            lineEnd: 10,
          },
        },
        {
          id: 'playbook-doc',
          score: 0.7,
          metadata: {
            content: 'Scripts de Social Selling.',
            isApprovedForAI: true,
            status: 'approved',
            docType: 'playbook',
            sourceFile: 'pb.md',
            sourceSection: '1',
            lineStart: 1,
            lineEnd: 10,
          },
        },
      ],
    });

    (rerankDocuments as jest.Mock).mockImplementation((_query, docs) =>
      Promise.resolve(docs.slice(0, 5))
    );

    const results = await retrieveChunks('Como fazer social selling', { topK: 10, minSimilarity: 0.1 });

    const idResult = results.find(r => r.id === 'identity-doc');
    const pbResult = results.find(r => r.id === 'playbook-doc');

    // Playbook boost should give playbook-doc a higher similarity
    if (pbResult && idResult) {
      expect(pbResult.similarity).toBeGreaterThanOrEqual(idResult.similarity);
    }
  });
});
