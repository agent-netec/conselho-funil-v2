import { 
  formatContextForLLM, 
  formatBrandContextForLLM,
  keywordMatchScore,
  generateLocalEmbedding,
  hashString
} from '@/lib/ai/rag'

describe('rag / context formatting', () => {
  // ... existing tests ...
  describe('formatContextForLLM', () => {
    const mockChunks: any[] = [
      {
        content: 'Conteúdo do chunk 1',
        similarity: 0.85,
        metadata: { counselor: 'vsl_expert', docType: 'heuristics' },
        source: { file: 'vsl_playbook.md', section: 'Introdução' }
      }
    ]

    it('should format general context correctly', () => {
      const result = formatContextForLLM(mockChunks)
      expect(result).toContain('Conteúdo do chunk 1')
      expect(result).toContain('vsl_playbook.md')
    })

    it('should return empty string for no chunks', () => {
      expect(formatContextForLLM([])).toBe('')
    })
  })

  describe('formatBrandContextForLLM', () => {
    const mockBrandChunks: any[] = [
      {
        assetId: '1',
        assetName: 'meu_arquivo.pdf',
        content: 'Informação da marca',
        similarity: 0.9,
        rank: 1
      }
    ]

    it('should format brand context with source and content', () => {
      const result = formatBrandContextForLLM(mockBrandChunks)
      expect(result).toContain('meu_arquivo.pdf')
      expect(result).toContain('Informação da marca')
      expect(result).toContain('CONTEXTO DA MARCA')
    })

    it('should return empty string for no chunks', () => {
      expect(formatBrandContextForLLM([])).toBe('')
    })
  })

  describe('hashString (DT-05: djb2 upgrade)', () => {
    it('should return consistent hash for same input', () => {
      expect(hashString('test')).toBe(hashString('test'))
    })

    it('should return different hashes for different inputs', () => {
      expect(hashString('test')).not.toBe(hashString('test2'))
    })

    it('should return 8-char hex string with padding', () => {
      const hash = hashString('hello')
      expect(hash).toMatch(/^[0-9a-f]{8}$/)
    })

    it('should return 8-char hex string for empty string', () => {
      const hash = hashString('')
      expect(hash).toMatch(/^[0-9a-f]{8}$/)
    })
  })

  describe('keywordMatchScore (DT-10: Jaccard Similarity)', () => {
    it('should return 1.0 when all keywords are found', () => {
      const text = 'como criar funil de vendas'
      const keywords = ['criar', 'funil', 'vendas']
      expect(keywordMatchScore(text, keywords)).toBe(1.0)
    })

    it('should return 0.5 when half of keywords are found', () => {
      const text = 'como criar funil'
      const keywords = ['criar', 'funil', 'vendas', 'leads']
      expect(keywordMatchScore(text, keywords)).toBe(0.5)
    })

    it('should return 0 when no keywords are found', () => {
      const text = 'texto completamente diferente'
      const keywords = ['criar', 'funil', 'vendas']
      expect(keywordMatchScore(text, keywords)).toBe(0)
    })

    it('should be case-insensitive', () => {
      const text = 'Como Criar FUNIL'
      const keywords = ['como', 'criar', 'funil']
      expect(keywordMatchScore(text, keywords)).toBe(1.0)
    })

    it('should return 0 for empty keywords', () => {
      expect(keywordMatchScore('some text', [])).toBe(0)
    })

    it('should return 0 for empty text', () => {
      expect(keywordMatchScore('', ['keyword'])).toBe(0)
    })
  })

  describe('generateLocalEmbedding (DT-06: hash-based 768d)', () => {
    it('should return 768-dimensional vector', async () => {
      const vector = await generateLocalEmbedding('texto para teste')
      expect(vector.length).toBe(768)
    })

    it('should return non-zero vector (not a stub)', async () => {
      const vector = await generateLocalEmbedding('texto para teste')
      const magnitude = Math.sqrt(vector.reduce((sum: number, v: number) => sum + v * v, 0))
      expect(magnitude).toBeGreaterThan(0)
    })

    it('should return values in [-1, 1] range', async () => {
      const vector = await generateLocalEmbedding('teste de range')
      vector.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(-1)
        expect(v).toBeLessThanOrEqual(1)
      })
    })

    it('should be deterministic (same input = same output)', async () => {
      const v1 = await generateLocalEmbedding('deterministic test')
      const v2 = await generateLocalEmbedding('deterministic test')
      expect(v1).toEqual(v2)
    })

    it('should produce different vectors for different inputs', async () => {
      const v1 = await generateLocalEmbedding('input A')
      const v2 = await generateLocalEmbedding('input B')
      expect(v1).not.toEqual(v2)
    })
  })
})

