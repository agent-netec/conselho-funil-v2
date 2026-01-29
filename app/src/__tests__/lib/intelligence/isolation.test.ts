import { 
  createIntelligenceDocument, 
  queryIntelligence 
} from '@/lib/firebase/intelligence';
import { ScoutAgent } from '@/lib/agents/scout/scout-agent';

// Mocks para Firebase
jest.mock('firebase/firestore', () => {
  const mockTimestamp = (date: Date) => ({
    toDate: () => date,
    seconds: Math.floor(date.getTime() / 1000),
  });

  return {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    updateDoc: jest.fn(),
    setDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    Timestamp: {
      now: jest.fn(() => mockTimestamp(new Date('2026-01-24T12:00:00Z'))),
      fromDate: jest.fn((date: Date) => mockTimestamp(date)),
    },
  };
});

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('@/lib/firebase/resilience', () => ({
  withResilience: jest.fn((fn) => fn()),
}));

describe('ST-13.6: Intelligence Wing - Isolation & TTL Tests', () => {
  const brandA = 'brand-a-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Tenant Isolation (Firestore)', () => {
    it('should ensure createIntelligenceDocument uses the correct brand path', async () => {
      const { collection, addDoc } = require('firebase/firestore');
      const mockDocData = {
        brandId: brandA,
        type: 'news',
        source: { platform: 'google_news', fetchedVia: 'rss' },
        content: { title: 'Test News', text: 'Some content' },
      };

      await createIntelligenceDocument(mockDocData as any);

      expect(collection).toHaveBeenCalledWith(expect.anything(), 'brands', brandA, 'intelligence');
      expect(addDoc).toHaveBeenCalled();
    });

    it('should ensure queryIntelligence filters by the correct brand path', async () => {
      const { collection } = require('firebase/firestore');
      
      await queryIntelligence({ brandId: brandA });

      expect(collection).toHaveBeenCalledWith(expect.anything(), 'brands', brandA, 'intelligence');
    });
  });

  describe('TTL (Time To Live) Validation', () => {
    it('should calculate correct expiresAt for different intelligence types', async () => {
      const { addDoc, Timestamp } = require('firebase/firestore');
      const now = new Date('2026-01-24T12:00:00Z');

      const types = [
        { type: 'news', expectedDays: 14 },
        { type: 'mention', expectedDays: 30 },
        { type: 'competitor', expectedDays: 60 },
        { type: 'trend', expectedDays: 90 },
      ];

      for (const item of types) {
        await createIntelligenceDocument({
          brandId: brandA,
          type: item.type as any,
          source: { platform: 'rss_feed', fetchedVia: 'rss' },
          content: { text: 'test' }
        } as any);

        const lastCall = addDoc.mock.calls[addDoc.mock.calls.length - 1][1];
        const expiresAt = lastCall.expiresAt.toDate();
        const diffDays = Math.round((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        expect(diffDays).toBe(item.expectedDays);
      }
    });
  });

  describe('Graceful Degradation (Scout Agent)', () => {
    it('should handle source failures without crashing the system', async () => {
      const scout = new ScoutAgent();
      
      const Parser = require('rss-parser');
      const mockParseURL = jest.fn().mockRejectedValue(new Error('Network Error'));
      Parser.prototype.parseURL = mockParseURL;

      const result = await scout.collectFromRss(brandA, {
        platform: 'rss_feed',
        endpoint: 'invalid-url',
        enabled: true,
        rateLimit: { requestsPerHour: 10, minIntervalMs: 1000 },
        parser: 'rss'
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0].code).toBe('PARSE_ERROR');
    });
  });
});
