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
      expect(result).toContain('Relevância: 85.0%')
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

    it('should format brand context with critical instruction', () => {
      const result = formatBrandContextForLLM(mockBrandChunks)
      expect(result).toContain('meu_arquivo.pdf')
      expect(result).toContain('Informação da marca')
      expect(result).toContain('INSTRUÇÃO CRÍTICA')
    })

    it('should return empty string for no chunks', () => {
      expect(formatBrandContextForLLM([])).toBe('')
    })
  })

  describe('logic functions', () => {
    it('hashString should return consistent hash', () => {
      expect(hashString('test')).toBe(hashString('test'))
      expect(hashString('test')).not.toBe(hashString('test2'))
    })

    it('keywordMatchScore should calculate overlap', () => {
      const query = 'como criar funil de vendas'
      const content = 'Este conteúdo ensina a criar um funil de vendas persuasivo'
      const score = keywordMatchScore(query, content)
      expect(score).toBeGreaterThan(0)
    })

    it('generateLocalEmbedding should return 768 dim vector', () => {
      const vector = generateLocalEmbedding('texto para teste')
      expect(vector.length).toBe(768)
      // Vector should be normalized
      const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0))
      expect(magnitude).toBeCloseTo(1)
    })
  })
})

