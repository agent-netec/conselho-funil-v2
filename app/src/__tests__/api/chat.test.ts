import { POST } from '@/app/api/chat/route'
import * as firestore from '@/lib/firebase/firestore'
import * as rag from '@/lib/ai/rag'
import * as gemini from '@/lib/ai/gemini'
import { NextResponse } from 'next/server'

// Mock dependencies
jest.mock('@/lib/firebase/firestore')
jest.mock('@/lib/ai/rag')
jest.mock('@/lib/ai/gemini')
jest.mock('@/lib/auth/conversation-guard', () => ({
  requireConversationAccess: jest.fn().mockResolvedValue({ userId: 'test-user' }),
}))
jest.mock('@/lib/utils/api-security', () => ({
  handleSecurityError: jest.fn().mockImplementation((error: any) => {
    const status = error.statusCode || error.status || 500
    return { status, json: async () => ({ error: error.message }) }
  }),
}))

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

describe('Chat API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(gemini.isGeminiConfigured as jest.Mock).mockReturnValue(true)
  })

  it('should return 400 if message or conversationId is missing', async () => {
    const req = new MockNextRequest('http://localhost:3000/api/chat', {
      body: JSON.stringify({}),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain('required')
  })

  it('should return 404 if conversation is not found', async () => {
    ;(firestore.getConversation as jest.Mock).mockResolvedValue(null)

    const req = new MockNextRequest('http://localhost:3000/api/chat', {
      body: JSON.stringify({ message: 'Olá', conversationId: 'conv123' }),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(404)
  })

  it('should process chat request successfully', async () => {
    ;(firestore.getConversation as jest.Mock).mockResolvedValue({ userId: 'user1', brandId: 'brand1' })
    ;(firestore.getUserCredits as jest.Mock).mockResolvedValue(10)
    ;(rag.retrieveChunks as jest.Mock).mockResolvedValue([
      { content: 'Contexto 1', source: { file: 'file1.md', section: 'sec1' }, similarity: 0.9, metadata: {} }
    ])
    ;(rag.retrieveBrandChunks as jest.Mock).mockResolvedValue([])
    ;(rag.formatContextForLLM as jest.Mock).mockReturnValue('Contexto formatado')
    ;(gemini.generateCouncilResponseWithGemini as jest.Mock).mockResolvedValue('Resposta da IA')

    const req = new MockNextRequest('http://localhost:3000/api/chat', {
      body: JSON.stringify({ message: 'Pergunta de teste', conversationId: 'conv123' }),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(200)
    
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.data.response).toBe('Resposta da IA')
    expect(firestore.addMessage).toHaveBeenCalled()
  })

  it('should return 500 on internal error', async () => {
    ;(firestore.getConversation as jest.Mock).mockRejectedValue(new Error('DB Error'))

    const req = new MockNextRequest('http://localhost:3000/api/chat', {
      body: JSON.stringify({ message: 'Olá', conversationId: 'conv123' }),
    }) as any

    const res = await POST(req)
    expect(res.status).toBe(500)
  })
})
