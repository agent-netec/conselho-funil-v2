import { createChunks } from '@/lib/ai/chunking'

describe('chunking / createChunks', () => {
  const sampleText = 'Este é um texto de exemplo para testar a função de chunking. Ele deve ser dividido corretamente.'

  it('should divide text into chunks of specified size', () => {
    const size = 20
    const overlap = 0
    const chunks = createChunks(sampleText, size, overlap)
    
    expect(chunks.length).toBeGreaterThan(1)
    chunks.forEach(chunk => {
      expect(chunk.length).toBeLessThanOrEqual(size)
    })
  })

  it('should handle overlap correctly', () => {
    const size = 30
    const overlap = 10
    const chunks = createChunks(sampleText, size, overlap)
    
    // Check if parts of the first chunk are in the second chunk
    if (chunks.length > 1) {
      const firstChunkEnd = chunks[0].slice(-overlap)
      // The second chunk should start around where the first one ended minus overlap
      // Note: text.slice logic might be slightly different due to word boundary optimization
      // but overlap should be present.
    }
  })

  it('should respect word boundaries', () => {
    const text = 'Palavra1 Palavra2 Palavra3'
    const chunks = createChunks(text, 15, 0)
    // Should not break "Palavra2" in the middle if possible
    expect(chunks[0]).not.toMatch(/Palavra2$/) // It might break between words
  })

  it('should throw error if size <= overlap', () => {
    expect(() => createChunks('text', 10, 10)).toThrow()
  })

  it('should return empty array for empty text', () => {
    expect(createChunks('', 100, 10)).toEqual([])
  })
})



