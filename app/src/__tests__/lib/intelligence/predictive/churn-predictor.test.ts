import { ChurnPredictor } from '@/lib/intelligence/predictive/churn-predictor';
import { Timestamp } from 'firebase/firestore';

jest.mock('firebase/firestore', () => {
  return {
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    getDocs: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    startAfter: jest.fn(),
    limit: jest.fn(),
    Timestamp: {
      now: () => ({ toMillis: () => 1_800_000_000_000 }),
      fromMillis: (value: number) => ({ toMillis: () => value }),
    },
  };
});

const firestore = jest.requireMock('firebase/firestore') as {
  getDocs: jest.Mock;
  getDoc: jest.Mock;
};

function leadDoc(id: string, segment: 'hot' | 'warm' | 'cold', createdAtOffsetDays: number) {
  const now = Timestamp.now();
  return {
    id,
    data: () => ({
      segment,
      createdAt: Timestamp.fromMillis(now.toMillis() - createdAtOffsetDays * 86400000),
    }),
  };
}

describe('ChurnPredictor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar no maximo 500 e paginacao cursor', async () => {
    const leads = Array.from({ length: 501 }).map((_, i) => leadDoc(`lead-${i + 1}`, 'warm', 5));
    firestore.getDocs
      .mockResolvedValueOnce({ docs: leads }) // leads query
      .mockResolvedValue({ empty: true, docs: [], size: 0 }); // events

    const result = await ChurnPredictor.predictBatch('brand-1');
    expect(result.totalLeads).toBe(500);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBe('lead-500');
  });

  it('lead sem evento deve ter risco 0.8', async () => {
    firestore.getDocs
      .mockResolvedValueOnce({ docs: [leadDoc('lead-1', 'cold', 7)] })
      .mockResolvedValue({ empty: true, docs: [], size: 0 });

    const result = await ChurnPredictor.predictBatch('brand-1');
    expect(result.predictions[0]?.churnRisk).toBe(0.8);
  });

  it('lead hot com inatividade alta deve migrar para warm', async () => {
    const now = Timestamp.now();
    const lastEvent = Timestamp.fromMillis(now.toMillis() - 20 * 86400000);

    firestore.getDocs
      .mockResolvedValueOnce({ docs: [leadDoc('lead-1', 'hot', 10)] }) // leads
      .mockResolvedValueOnce({
        empty: false,
        docs: [{ data: () => ({ timestamp: lastEvent }) }],
        size: 1,
      }) // last event
      .mockResolvedValueOnce({ size: 0 }) // recent trend
      .mockResolvedValueOnce({ size: 3 }); // older trend -> declining

    const result = await ChurnPredictor.predictBatch('brand-1');
    expect(result.predictions[0]?.riskLevel).toBe('critical');
    expect(result.predictions[0]?.predictedSegment).toBe('warm');
  });
});
