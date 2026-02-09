import { POST } from '@/app/api/funnels/generate/route'
import * as firestore from '@/lib/firebase/firestore'
import * as rag from '@/lib/ai/rag'
import * as gemini from '@/lib/ai/gemini'
import { NextResponse } from 'next/server'

// Mock dependencies
jest.mock('@/lib/firebase/firestore')
jest.mock('@/lib/ai/rag')
jest.mock('@/lib/ai/gemini')

// Mock NextRequest and NextResponse for Node environment
const mockNextResponse = {
  json: (data: any, init?: any) => {
    return {
      status: init?.status || 200,
      json: async () => data
    }
  }
}

// Override NextResponse.json
;(NextResponse as any).json = mockNextResponse.json

class MockNextRequest {
  private body: any
  public method = 'POST'
  constructor(url: string, options: any) {
    this.body = options.body ? JSON.parse(options.body) : {}
  }
  async json() {
    return this.body
  }
}

describe('Funnel Generation API Integration', () => {
  const mockBody = {
    funnelId: 'funnel123',
    context: {
      objective: 'leads',
      market: 'marketing',
      company: 'Teste Co',
      audience: { who: 'empresários', pain: 'falta de tempo', awareness: 'consciente' },
      channel: { main: 'Facebook' },
      offer: { what: 'Curso', ticket: 100, type: 'digital' }
    }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(gemini.isGeminiConfigured as jest.Mock).mockReturnValue(true)
  })

  it('should return 400 if funnelId or context is missing', async () => {
    const req = new MockNextRequest('http://localhost:3000/api/funnels/generate', {
      body: JSON.stringify({}),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('should process generation successfully', async () => {
    const mockAIResponse = JSON.stringify({
      proposals: [
        {
          name: 'Proposta 1',
          summary: 'Resumo',
          architecture: [],
          strategy: {},
          assets: [],
          scorecard: { overall: 85 }
        }
      ]
    })

    ;(rag.retrieveForFunnelCreation as jest.Mock).mockResolvedValue([])
    ;(gemini.generateWithGemini as jest.Mock).mockResolvedValue(mockAIResponse)
    ;(firestore.createProposal as jest.Mock).mockResolvedValue('prop123')
    ;(firestore.getFunnel as jest.Mock).mockResolvedValue({ id: 'funnel123', brandId: 'brand1' })

    const req = new MockNextRequest('http://localhost:3000/api/funnels/generate', {
      body: JSON.stringify(mockBody),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.proposalIds).toContain('prop123')
    expect(firestore.updateFunnel).toHaveBeenCalledWith('funnel123', { status: 'generating' })
    expect(firestore.updateFunnel).toHaveBeenCalledWith('funnel123', { status: 'review' })
  })

  it('should handle AI parsing error', async () => {
    ;(gemini.generateWithGemini as jest.Mock).mockResolvedValue('invalid json')
    ;(firestore.getFunnel as jest.Mock).mockResolvedValue({ id: 'funnel123' })

    const req = new MockNextRequest('http://localhost:3000/api/funnels/generate', {
      body: JSON.stringify(mockBody),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toContain('parse')
  })
})
