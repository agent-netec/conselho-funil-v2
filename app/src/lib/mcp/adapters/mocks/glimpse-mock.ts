import { MarketTrend } from '@/types/intelligence';
import { Timestamp } from 'firebase/firestore';

/**
 * Mocks de tendências do Glimpse para desenvolvimento (WAVE 1)
 */
export const GLIMPSE_MOCK_DATA: Omit<MarketTrend, 'id' | 'expiresAt'>[] = [
  {
    topic: 'Inteligência Artificial Generativa',
    growthPercentage: 850, // Breakout!
    searchVolume: 'high',
    absoluteVolume: 1200000,
    relatedKeywords: ['LLM', 'ChatGPT', 'AI Agents', 'Automation'],
    platformSource: 'glimpse',
    region: 'BR',
    timeRange: '30d',
    capturedAt: Timestamp.now(),
    scope: { level: 'brand', brandId: 'mock' },
    inheritToChildren: false,
  },
  {
    topic: 'Social Listening Enterprise',
    growthPercentage: 120,
    searchVolume: 'medium',
    absoluteVolume: 45000,
    relatedKeywords: ['Brand Monitoring', 'Sentiment Analysis', 'Bright Data'],
    platformSource: 'glimpse',
    region: 'BR',
    timeRange: '7d',
    capturedAt: Timestamp.now(),
    scope: { level: 'brand', brandId: 'mock' },
    inheritToChildren: false,
  },
  {
    topic: 'Cold Wave 2026',
    growthPercentage: 1200, // Breakout explosivo
    searchVolume: 'high',
    absoluteVolume: 5000000,
    relatedKeywords: ['Winter Storm', 'Climate Change', 'NWS Alerts'],
    platformSource: 'glimpse',
    region: 'US',
    timeRange: '24h',
    capturedAt: Timestamp.now(),
    scope: { level: 'brand', brandId: 'mock' },
    inheritToChildren: false,
  }
];
