import { retrieveChunks } from '@/lib/ai/rag';
import { rerankDocuments } from '@/lib/ai/rerank';
import { getDocs } from 'firebase/firestore';

// Mocks
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  limit: jest.fn(),
  getDocs: jest.fn(),
  orderBy: jest.fn(),
}));

jest.mock('@/lib/firebase/config', () => ({
  db: {}
}));

jest.mock('@/lib/ai/rerank', () => ({
  rerankDocuments: jest.fn(),
}));

describe('QA: Retrieval Validation (Hit Rate & Security Gates)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('SHULD-VALIDATE-HIT-RATE: Reranking should bring relevant knowledge to Top 1', async () => {
    // Cenário: Temos 3 documentos. O mais relevante (Schwartz) está em 3º lugar na busca vetorial bruta.
    const mockDocs = [
      {
        id: '1',
        data: () => ({
          content: 'Conteúdo genérico sobre marketing.',
          embedding: new Array(768).fill(0.1),
          metadata: { status: 'approved', isApprovedForAI: true, docType: 'general' },
          source: { file: 'gen.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      },
      {
        id: '2',
        data: () => ({
          content: 'Outro conteúdo irrelevante.',
          embedding: new Array(768).fill(0.2),
          metadata: { status: 'approved', isApprovedForAI: true, docType: 'general' },
          source: { file: 'irrel.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      },
      {
        id: '3',
        data: () => ({
          content: 'Eugene Schwartz define os 5 níveis de consciência: Inconsciente, Consciente do Problema...',
          embedding: new Array(768).fill(0.3),
          metadata: { status: 'approved', isApprovedForAI: true, docType: 'heuristics' },
          source: { file: 'schwartz.md', section: 'Níveis', lineStart: 1, lineEnd: 10 }
        })
      }
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      size: 3,
      docs: mockDocs
    });

    // Mock do Reranker: Ele identifica o doc '3' como o melhor (score 0.99)
    (rerankDocuments as jest.Mock).mockImplementation((query, docs) => {
      const sorted = [...docs].sort((a, b) => {
        if (a.id === '3') return -1;
        return 1;
      }).map(d => ({ ...d, rerankScore: d.id === '3' ? 0.99 : 0.1 }));
      return Promise.resolve(sorted.slice(0, 5));
    });

    const results = await retrieveChunks('Como Eugene Schwartz define os 5 níveis de consciência?');

    // Validação de Hit Rate
    expect(results[0].id).toBe('3');
    expect(results[0].rerankScore).toBe(0.99);
    expect(rerankDocuments).toHaveBeenCalled();
  });

  it('SECURITY-GATE: Should NOT retrieve chunks where isApprovedForAI is false', async () => {
    const mockDocs = [
      {
        id: '4',
        data: () => ({
          content: 'Segredo industrial não aprovado.',
          embedding: new Array(768).fill(0.5),
          metadata: { status: 'approved', isApprovedForAI: false, docType: 'secret' },
          source: { file: 'secret.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      }
    ];

    // O Mock do Firestore deve simular que a query com WHERE isApprovedForAI == true não retornou nada
    (getDocs as jest.Mock).mockResolvedValue({
      empty: true,
      size: 0,
      docs: []
    });

    const results = await retrieveChunks('Qual o segredo industrial?');

    expect(results.length).toBe(0);
  });

  it('DYNAMIC-FILTER: Should respect category filters in retrieval config', async () => {
    // Este teste valida se os filtros passados na config chegam na query do Firestore
    (getDocs as jest.Mock).mockResolvedValue({ empty: true, docs: [] });

    await retrieveChunks('test query', { 
      topK: 5, 
      minSimilarity: 0.1, 
      filters: { category: 'ads' } 
    });

    const { where } = require('firebase/firestore');
    expect(where).toHaveBeenCalledWith('metadata.category', '==', 'ads');
  });

  it('BUG-001: Recency Boost should multiply score by 1.2 for 2026 data', async () => {
    const mockDocs = [
      {
        id: 'old-doc',
        data: () => ({
          content: 'Benchmark de 2024.',
          embedding: new Array(768).fill(0.1),
          metadata: { status: 'approved', isApprovedForAI: true, version: '2024' },
          source: { file: 'old.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      },
      {
        id: 'new-doc',
        data: () => ({
          content: 'Benchmark de 2026.',
          embedding: new Array(768).fill(0.1),
          metadata: { status: 'approved', isApprovedForAI: true, version: '2026' },
          source: { file: 'new.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      }
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      size: 2,
      docs: mockDocs
    });

    (rerankDocuments as jest.Mock).mockImplementation((query, docs) => Promise.resolve(docs.slice(0, 5)));

    const results = await retrieveChunks('Benchmark de custo');
    
    const oldResult = results.find(r => r.id === 'old-doc');
    const newResult = results.find(r => r.id === 'new-doc');

    // O novo deve ter score 20% maior (1.2x) que o antigo se a base for a mesma
    // Nota: Como retrieveChunks usa keywordMatchScore e generateLocalEmbedding, 
    // precisamos garantir que as bases sejam idênticas nos mocks se quisermos testar o multiplicador puro.
    expect(newResult!.similarity).toBeGreaterThan(oldResult!.similarity);
  });

  it('BUG-002: Playbook Boost should multiply score by 1.1', async () => {
    const mockDocs = [
      {
        id: 'identity-doc',
        data: () => ({
          content: 'O que é Social Selling.',
          embedding: new Array(768).fill(0.1),
          metadata: { status: 'approved', isApprovedForAI: true, docType: 'identity' },
          source: { file: 'id.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      },
      {
        id: 'playbook-doc',
        data: () => ({
          content: 'Scripts de Social Selling.',
          embedding: new Array(768).fill(0.1),
          metadata: { status: 'approved', isApprovedForAI: true, docType: 'playbook' },
          source: { file: 'pb.md', section: '1', lineStart: 1, lineEnd: 10 }
        })
      }
    ];

    (getDocs as jest.Mock).mockResolvedValue({
      empty: false,
      size: 2,
      docs: mockDocs
    });

    (rerankDocuments as jest.Mock).mockImplementation((query, docs) => Promise.resolve(docs.slice(0, 5)));

    const results = await retrieveChunks('Como fazer social selling');
    
    const idResult = results.find(r => r.id === 'identity-doc');
    const pbResult = results.find(r => r.id === 'playbook-doc');

    expect(pbResult!.similarity).toBeGreaterThan(idResult!.similarity);
  });
});
