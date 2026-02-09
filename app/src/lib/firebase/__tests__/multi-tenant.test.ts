import { createIntelligenceAsset, getCompetitorAssets } from '../intelligence';
import { db } from '../config';
import { collection, getDocs } from 'firebase/firestore';

// Mock Firebase config
jest.mock('../config', () => ({
  db: {},
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: { now: jest.fn(() => ({ toDate: () => new Date() })) },
}));

// Mock intelligence module with brand-scoped storage
const mockStorage: Record<string, any[]> = {};
jest.mock('../intelligence', () => ({
  createIntelligenceAsset: jest.fn(async (brandId: string, competitorId: string, asset: any) => {
    const key = `${brandId}:${competitorId}`;
    if (!mockStorage[key]) mockStorage[key] = [];
    mockStorage[key].push({ ...asset, id: `asset_${Date.now()}_${Math.random()}` });
    return 'mock-asset-id';
  }),
  getCompetitorAssets: jest.fn(async (brandId: string, competitorId: string) => {
    const key = `${brandId}:${competitorId}`;
    return mockStorage[key] || [];
  }),
}));

describe('Multi-Tenant Isolation (Brand Isolation)', () => {
  const brandA = 'brand_alpha';
  const brandB = 'brand_beta';
  const competitorId = 'comp_shared_id'; // Mesmo ID para testar colisão de path

  it('should store assets in brand-specific sub-collections', async () => {
    const assetA = {
      brandId: brandA,
      competitorId: competitorId,
      type: 'screenshot' as const,
      url: 'https://test.com',
      pageType: 'landing_page' as const,
      capturedAt: { toDate: () => new Date() } as any,
      storagePath: `brands/${brandA}/assets/1.png`,
      version: 1,
    };

    const assetB = {
      brandId: brandB,
      competitorId: competitorId,
      type: 'screenshot' as const,
      url: 'https://test.com',
      pageType: 'landing_page' as const,
      capturedAt: { toDate: () => new Date() } as any,
      storagePath: `brands/${brandB}/assets/2.png`,
      version: 1,
    };

    // Criar ativos para marcas diferentes
    await createIntelligenceAsset(brandA, competitorId, assetA);
    await createIntelligenceAsset(brandB, competitorId, assetB);

    // Validar que Brand A não vê ativos da Brand B
    const assetsA = await getCompetitorAssets(brandA, competitorId);
    expect(assetsA.every(a => a.brandId === brandA)).toBe(true);
    expect(assetsA.some(a => a.brandId === brandB)).toBe(false);

    // Validar que Brand B não vê ativos da Brand A
    const assetsB = await getCompetitorAssets(brandB, competitorId);
    expect(assetsB.every(b => b.brandId === brandB)).toBe(true);
    expect(assetsB.some(b => b.brandId === brandA)).toBe(false);
  });
});
