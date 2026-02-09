import { LTVEstimator } from '@/lib/intelligence/predictive/ltv-estimator';

jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Timestamp: {
      now: () => ({ toMillis: () => 1_800_000_000_000 }),
    },
  };
});

const firestore = jest.requireMock('firebase/firestore') as {
  getDoc: jest.Mock;
  getDocs: jest.Mock;
};

describe('LTVEstimator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar 3 cohorts e projectedLTV diferenciado por segmento', async () => {
    firestore.getDoc.mockResolvedValue({ exists: () => false });
    firestore.getDocs
      .mockResolvedValueOnce({ size: 30, docs: [{ id: 'a' }] }) // hot leads
      .mockResolvedValueOnce({ docs: [{ data: () => ({ revenue: 100 }) }] }) // hot purchase
      .mockResolvedValueOnce({ size: 20, docs: [{ id: 'b' }] }) // warm leads
      .mockResolvedValueOnce({ docs: [{ data: () => ({ revenue: 50 }) }] }) // warm purchase
      .mockResolvedValueOnce({ size: 10, docs: [{ id: 'c' }] }) // cold leads
      .mockResolvedValueOnce({ docs: [{ data: () => ({ revenue: 20 }) }] }); // cold purchase

    const result = await LTVEstimator.estimateBatch('brand-1');
    expect(result.cohorts).toHaveLength(3);
    const hot = result.cohorts.find((c) => c.segment === 'hot');
    const warm = result.cohorts.find((c) => c.segment === 'warm');
    const cold = result.cohorts.find((c) => c.segment === 'cold');
    expect((hot?.projectedLTV.m12 ?? 0) > (warm?.projectedLTV.m12 ?? 0)).toBe(true);
    expect((warm?.projectedLTV.m12 ?? 0) > (cold?.projectedLTV.m12 ?? 0)).toBe(true);
  });
});
