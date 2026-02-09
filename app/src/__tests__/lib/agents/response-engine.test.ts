/**
 * @jest-environment node
 */

// Mock Gemini
jest.mock('@/lib/ai/gemini', () => ({
  generateWithGemini: jest.fn(),
}));

// Mock brand data
jest.mock('@/lib/firebase/brands', () => ({
  getBrand: jest.fn(),
}));

// Mock firebase/firestore (override global)
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: jest.fn(),
  },
}));

jest.mock('@/lib/firebase/config', () => ({
  db: 'mock-db',
}));

import { generateWithGemini } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/brands';
import { generateSocialResponse } from '@/lib/agents/engagement/response-engine';
import type { SocialInteraction } from '@/types/social-inbox';

const mockGenerateWithGemini = generateWithGemini as jest.MockedFunction<typeof generateWithGemini>;
const mockGetBrand = getBrand as jest.MockedFunction<typeof getBrand>;

const mockInteraction: SocialInteraction = {
  id: 'interaction-1',
  externalId: 'ext-1',
  platform: 'instagram',
  type: 'dm',
  status: 'pending',
  author: {
    id: 'author-1',
    handle: '@testuser',
    name: 'Test User',
    isFollower: true,
  },
  content: {
    text: 'Hi, I love your product!',
    timestamp: '2026-02-08T10:00:00Z',
  },
  metadata: {
    sentimentScore: 0.8,
    sentimentLabel: 'positive',
    requires_human_review: false,
    tags: [],
    priority: 5,
  },
};

describe('Response Engine — S32-RE-01', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBrand.mockResolvedValue({
      id: 'brand-1',
      userId: 'user-1',
      name: 'TestBrand',
      vertical: 'SaaS',
      positioning: 'The best tool for teams',
      voiceTone: 'friendly and professional',
      audience: { who: 'teams', pain: 'collaboration', awareness: 'high', objections: [] },
      offer: { what: 'SaaS tool', ticket: 99, type: 'monthly', differentiator: 'AI-powered' },
    } as any);
  });

  it('gera BrandVoiceSuggestion valida quando Gemini retorna JSON correto', async () => {
    const geminiOutput = JSON.stringify({
      options: [
        { text: 'Thank you so much!', tone: 'friendly', goal: 'thank', confidence: 0.9 },
        { text: 'We appreciate that.', tone: 'professional', goal: 'engage', confidence: 0.85 },
        { text: 'Glad you like it!', tone: 'casual', goal: 'engage', confidence: 0.8 },
      ],
    });

    mockGenerateWithGemini.mockResolvedValueOnce(geminiOutput);

    const result = await generateSocialResponse(mockInteraction, 'brand-1');

    expect(result).toBeDefined();
    expect(result.interactionId).toBe('interaction-1');
    expect(result.options).toHaveLength(3);
    expect(result.options[0]).toMatchObject({
      text: 'Thank you so much!',
      tone: 'friendly',
      goal: 'thank',
      confidence: 0.9,
    });
    expect(result.contextUsed).toBeDefined();
    expect(result.id).toBeDefined();

    // Verifica que Gemini foi chamado com responseMimeType JSON (DT-06)
    expect(mockGenerateWithGemini).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        responseMimeType: 'application/json',
      })
    );
  });

  it('retorna fallback com confidence 0.5 quando Gemini retorna JSON invalido', async () => {
    mockGenerateWithGemini.mockResolvedValueOnce('not valid json at all {{{');

    const result = await generateSocialResponse(mockInteraction, 'brand-1');

    expect(result).toBeDefined();
    expect(result.interactionId).toBe('interaction-1');
    expect(result.options).toHaveLength(3);
    // All fallback options have confidence 0.5
    result.options.forEach((opt) => {
      expect(opt.confidence).toBe(0.5);
      expect(opt.text.length).toBeGreaterThan(0);
      expect(opt.tone).toBeDefined();
      expect(opt.goal).toBe('engage');
    });
    expect(result.id).toContain('fallback');
  });

  it('retorna fallback quando Gemini lanca erro', async () => {
    mockGenerateWithGemini.mockRejectedValueOnce(new Error('API timeout'));

    const result = await generateSocialResponse(mockInteraction, 'brand-1');

    expect(result).toBeDefined();
    expect(result.interactionId).toBe('interaction-1');
    expect(result.options).toHaveLength(3);
    result.options.forEach((opt) => {
      expect(opt.confidence).toBe(0.5);
    });
  });

  it('funciona mesmo quando getBrand retorna null (brand nao encontrada)', async () => {
    mockGetBrand.mockResolvedValueOnce(null);
    mockGenerateWithGemini.mockResolvedValueOnce(JSON.stringify({
      options: [
        { text: 'Thanks!', tone: 'friendly', goal: 'thank', confidence: 0.7 },
      ],
    }));

    const result = await generateSocialResponse(mockInteraction, 'brand-missing');

    expect(result).toBeDefined();
    expect(result.options).toHaveLength(1);
  });
});
