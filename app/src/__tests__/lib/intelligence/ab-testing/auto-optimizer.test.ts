import { Timestamp } from 'firebase/firestore';
import { AutoOptimizer } from '@/lib/intelligence/ab-testing/auto-optimizer';
import { getABTest, updateABTest } from '@/lib/firebase/ab-tests';
import { ABTestEngine } from '@/lib/intelligence/ab-testing/engine';
import { calculateSignificance } from '@/lib/intelligence/ab-testing/significance';
import { createAutomationLog } from '@/lib/firebase/automation';
import type { ABTest } from '@/types/ab-testing';

jest.mock('@/lib/firebase/ab-tests', () => ({
  getABTest: jest.fn(),
  updateABTest: jest.fn(),
}));

jest.mock('@/lib/intelligence/ab-testing/engine', () => ({
  ABTestEngine: { completeTest: jest.fn() },
}));

jest.mock('@/lib/intelligence/ab-testing/significance', () => ({
  calculateSignificance: jest.fn(),
}));

jest.mock('@/lib/firebase/automation', () => ({
  createAutomationLog: jest.fn(),
}));

describe('auto-optimizer', () => {
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
        clicks: 10,
        conversions: 5,
        revenue: 50,
      },
    ],
    status: 'running',
    metrics: { totalImpressions: 400, totalConversions: 25, totalRevenue: 150 },
    winnerVariantId: null,
    significanceLevel: null,
    autoOptimize: true,
    startDate: null,
    endDate: null,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pause loser quando CR < 50% do lider + >= 100 impressions', async () => {
    (getABTest as jest.Mock).mockResolvedValue(baseTest);
    (calculateSignificance as jest.Mock).mockReturnValue({ isSignificant: false });

    const decisions = await AutoOptimizer.evaluate('brand_1', 'test_1', false);
    expect(decisions.some(d => d.action === 'pause_variant')).toBe(true);
    expect(updateABTest).toHaveBeenCalled();
    expect(createAutomationLog).toHaveBeenCalled();
  });

  it('declare winner quando significancia >= 95%', async () => {
    (getABTest as jest.Mock).mockResolvedValue(baseTest);
    (calculateSignificance as jest.Mock).mockReturnValue({
      isSignificant: true,
      significance: 0.97,
    });

    const decisions = await AutoOptimizer.evaluate('brand_1', 'test_1', false);
    expect(decisions.some(d => d.action === 'declare_winner')).toBe(true);
    expect(ABTestEngine.completeTest).toHaveBeenCalled();
    expect(createAutomationLog).toHaveBeenCalled();
  });

  it('early stop quando 0 conversoes apos 500 impressoes', async () => {
    const test = {
      ...baseTest,
      variants: [
        { ...baseTest.variants[0], conversions: 0, impressions: 500 },
        { ...baseTest.variants[1], conversions: 0, impressions: 500 },
      ],
    };
    (getABTest as jest.Mock).mockResolvedValue(test);
    (calculateSignificance as jest.Mock).mockReturnValue({ isSignificant: false });

    const decisions = await AutoOptimizer.evaluate('brand_1', 'test_1', false);
    expect(decisions.some(d => d.action === 'early_stop')).toBe(true);
  });

  it('kill-switch ativo: decisions executed = false e nao executa', async () => {
    (getABTest as jest.Mock).mockResolvedValue(baseTest);
    (calculateSignificance as jest.Mock).mockReturnValue({ isSignificant: false });

    const decisions = await AutoOptimizer.evaluate('brand_1', 'test_1', true);
    decisions.forEach((d) => expect(d.executed).toBe(false));
    expect(updateABTest).not.toHaveBeenCalled();
    expect(ABTestEngine.completeTest).not.toHaveBeenCalled();
  });

  it('continue quando dados insuficientes', async () => {
    const test = {
      ...baseTest,
      variants: [
        { ...baseTest.variants[0], impressions: 10, conversions: 1 },
        { ...baseTest.variants[1], impressions: 10, conversions: 0 },
      ],
    };
    (getABTest as jest.Mock).mockResolvedValue(test);
    (calculateSignificance as jest.Mock).mockReturnValue({ isSignificant: false });

    const decisions = await AutoOptimizer.evaluate('brand_1', 'test_1', false);
    expect(decisions[0].action).toBe('continue');
  });

  it('auto-optimize disabled retorna erro', async () => {
    (getABTest as jest.Mock).mockResolvedValue({ ...baseTest, autoOptimize: false });
    await expect(AutoOptimizer.evaluate('brand_1', 'test_1', false))
      .rejects
      .toThrow('Auto-optimize is disabled for this test');
  });
});
