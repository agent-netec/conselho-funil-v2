import { cosineSimilarity } from '@/lib/ai/embeddings'

describe('embeddings / cosineSimilarity', () => {
  it('should return 1 for identical vectors', () => {
    const vec = [1, 0, 1]
    expect(cosineSimilarity(vec, vec)).toBeCloseTo(1)
  })

  it('should return 0 for orthogonal vectors', () => {
    const vecA = [1, 0]
    const vecB = [0, 1]
    expect(cosineSimilarity(vecA, vecB)).toBe(0)
  })

  it('should return -1 for opposite vectors', () => {
    const vecA = [1, 1]
    const vecB = [-1, -1]
    expect(cosineSimilarity(vecA, vecB)).toBeCloseTo(-1)
  })

  it('should handle different lengths by returning 0', () => {
    expect(cosineSimilarity([1, 2], [1, 2, 3])).toBe(0)
  })

  it('should handle zero vectors by returning 0', () => {
    expect(cosineSimilarity([0, 0], [0, 0])).toBe(0)
  })

  it('should handle empty or null vectors', () => {
    expect(cosineSimilarity([], [])).toBe(0)
    expect(cosineSimilarity(null as any, [1])).toBe(0)
  })
})



