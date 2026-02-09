import { Timestamp } from 'firebase/firestore';
import { hashAssign, ABTestEngine } from '@/lib/intelligence/ab-testing/engine';
import { calculateSignificance } from '@/lib/intelligence/ab-testing/significance';
import type { ABTest } from '@/types/ab-testing';
import {
  getABTest,
  updateABTest,
  updateVariantMetrics,
} from '@/lib/firebase/ab-tests';

jest.mock('@/lib/firebase/ab-tests', () => ({
  getABTest: jest.fn(),
  updateABTest: jest.fn(),
  updateVariantMetrics: jest.fn(),
}));

describe('ab-testing engine', () => {
  const baseTest: ABTest = {
    id: 'test_1',
    name: 'Test 1',
    brandId: 'brand_1',
    targetSegment: 'all',
    variants: [
      {
        id: 'variant_0',
        name: 'Variant A',
        contentVariations: { headline: 'A' },
        weight: 0.5,
        impressions: 200,
        clicks: 30,
        conversions: 20,
        revenue: 100,
      },
      {
        id: 'variant_1',
        name: 'Variant B',
        contentVariations: { headline: 'B' },
        weight: 0.5,
        impressions: 200,
        clicks: 20,
        conversions: 10,
        revenue: 50,
      },
    ],
    status: 'running',
    metrics: { totalImpressions: 400, totalConversions: 30, totalRevenue: 150 },
    winnerVariantId: null,
    significanceLevel: null,
    autoOptimize: false,
    startDate: null,
    endDate: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashAssign retorna resultado deterministico', () => {
    expect(hashAssign('lead_1', 'test_1', 4)).toBe(hashAssign('lead_1', 'test_1', 4));
  });

  it('hashAssign distribui entre variantes', () => {
    const counts = [0, 0, 0, 0];
    for (let i = 0; i < 100; i += 1) {
      const index = hashAssign(`lead_${i}`, 'test_1', 4);
      counts[index] += 1;
    }
    counts.forEach((count) => {
      expect(count).toBeGreaterThan(10);
    });
  });

  it('hashAssign com separador ":" evita colisao de concatenacao', () => {
    const a = hashAssign('abc', 'def', 5);
    const b = hashAssign('ab', 'cdef', 5);
    expect(a).not.toBe(b);
  });

  it('calculateSignificance retorna isSignificant com dados fortes', () => {
    const result = calculateSignificance(
      { conversions: 120, impressions: 1000 },
      { conversions: 80, impressions: 1000 },
      0.95
    );
    expect(result.isSignificant).toBe(true);
  });

  it('calculateSignificance retorna significance 0 com sample < 30', () => {
    const result = calculateSignificance(
      { conversions: 5, impressions: 20 },
      { conversions: 4, impressions: 20 }
    );
    expect(result.significance).toBe(0);
    expect(result.isSignificant).toBe(false);
  });

  it('calculateSignificance retorna isSignificant false com < 100 impressoes', () => {
    const result = calculateSignificance(
      { conversions: 30, impressions: 90 },
      { conversions: 10, impressions: 90 },
      0.95
    );
    expect(result.isSignificant).toBe(false);
  });

  it('assignVariant retorna mesma variante para mesmo lead', async () => {
    (getABTest as jest.Mock).mockResolvedValue(baseTest);
    const first = await ABTestEngine.assignVariant('brand_1', 'test_1', 'lead_1');
    const second = await ABTestEngine.assignVariant('brand_1', 'test_1', 'lead_1');
    expect(first?.id).toBe(second?.id);
  });

  it('startTest muda status para running', async () => {
    (getABTest as jest.Mock).mockResolvedValue({ ...baseTest, status: 'draft' });
    await ABTestEngine.startTest('brand_1', 'test_1');
    expect(updateABTest).toHaveBeenCalledWith('brand_1', 'test_1', {
      status: 'running',
      startDate: expect.any(Object),
    });
  });

  it('recordEvent incrementa metricas via helper', async () => {
    await ABTestEngine.recordEvent('brand_1', 'test_1', 'variant_0', 'conversion', 25);
    expect(updateVariantMetrics).toHaveBeenCalledWith(
      'brand_1',
      'test_1',
      'variant_0',
      { conversions: 1, revenue: 25 }
    );
  });
});
