/**
 * @fileoverview Unit tests for PropensityEngine — S28-PS-03
 *
 * Covers:
 * 1. 0 eventos → cold (score 0)
 * 2. Eventos antigos (> 7 dias) → penalidade de inatividade aplicada
 * 3. Mix de eventos recentes → segmentação correta
 * 4. Edge case: apenas 1 evento recente de alto valor (purchase) → hot
 * 5. Score sempre normalizado entre 0 e 1 (nunca excede)
 * 6. Persistência via setDoc no Firestore
 *
 * @see _netecmt/packs/stories/sprint-28-hybrid-personalization/stories.md (PS-03)
 */

import { PropensityEngine, PropensityResult } from '@/lib/intelligence/personalization/propensity';
import { JourneyLead, JourneyEvent, JourneyEventType } from '@/types/journey';
import { Timestamp } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// Mocks — Firebase (mesmo padrão de maestro-flow.test.ts)
// ---------------------------------------------------------------------------

jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

const mockSetDoc = jest.fn().mockResolvedValue(undefined);

jest.mock('firebase/firestore', () => ({
  doc: jest.fn().mockReturnValue('mock-doc-ref'),
  setDoc: (...args: unknown[]) => mockSetDoc(...args),
  Timestamp: {
    now: () => ({ toMillis: () => Date.now() }),
  },
}));

// ---------------------------------------------------------------------------
// Frozen time — evita flakiness
// ---------------------------------------------------------------------------

const FROZEN_NOW = new Date('2026-02-06T12:00:00Z').getTime();

beforeAll(() => {
  jest.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW);
});

afterAll(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Cria um Timestamp-like compatível com toMillis() */
const ts = (ms: number): Timestamp => ({
  toMillis: () => ms,
  seconds: Math.floor(ms / 1000),
  nanoseconds: 0,
  toDate: () => new Date(ms),
  isEqual: () => false,
  valueOf: () => '',
  toJSON: () => ({ seconds: Math.floor(ms / 1000), nanoseconds: 0 }),
} as unknown as Timestamp);

/** Cria um evento de teste */
const makeEvent = (
  type: string,
  timestampMs: number,
): JourneyEvent => ({
  id: `evt_${Math.random().toString(36).slice(2, 8)}`,
  leadId: 'lead_test',
  brandId: 'brand_test',
  type: type as JourneyEventType,
  source: 'web',
  payload: {},
  session: { sessionId: 'sess_1' },
  timestamp: ts(timestampMs),
});

/** Lead base para testes */
const baseLead: JourneyLead = {
  id: 'lead_test',
  brandId: 'brand_test',
  pii: { email: 'test@test.com' },
  attribution: {
    firstSource: 'organic',
    firstMedium: 'web',
    firstCampaign: '',
    lastSource: 'organic',
    lastMedium: 'web',
    lastCampaign: '',
  },
  metrics: { totalLtv: 0, transactionCount: 0, averageTicket: 0 },
  status: 'lead',
  createdAt: ts(FROZEN_NOW),
  updatedAt: ts(FROZEN_NOW),
};

// Timestamps relativos ao FROZEN_NOW
const ONE_HOUR_AGO = FROZEN_NOW - 1 * 60 * 60 * 1000;
const TWO_HOURS_AGO = FROZEN_NOW - 2 * 60 * 60 * 1000;
const THREE_DAYS_AGO = FROZEN_NOW - 3 * 24 * 60 * 60 * 1000;
const EIGHT_DAYS_AGO = FROZEN_NOW - 8 * 24 * 60 * 60 * 1000;
const TEN_DAYS_AGO = FROZEN_NOW - 10 * 24 * 60 * 60 * 1000;

// ---------------------------------------------------------------------------
// Tests — Scoring & Segmentation
// ---------------------------------------------------------------------------

describe('PropensityEngine — S28-PS-03: Scoring & Segmentation', () => {
  beforeEach(() => {
    mockSetDoc.mockClear();
  });

  // AC-1: 0 eventos → cold (score 0)
  it('should return cold with score 0 when no events', () => {
    const result = PropensityEngine.calculate(baseLead, []);
    expect(result.score).toBe(0);
    expect(result.segment).toBe('cold');
    expect(result.reasoning).toContain('No events recorded');
  });

  // AC-2: Eventos antigos (> 7 dias) → penalidade de inatividade aplicada
  it('should apply inactivity penalty (0.5x) when last event > 7 days ago', () => {
    const events = [
      makeEvent('page_view', EIGHT_DAYS_AGO),  // 0.1
      makeEvent('click', TEN_DAYS_AGO),         // 0.2
      makeEvent('form_submit', TEN_DAYS_AGO),   // 0.5
    ];
    const result = PropensityEngine.calculate(baseLead, events);

    // rawScore = 0.1 + 0.2 + 0.5 = 0.8 (nenhum é recente → sem bônus 1.5x)
    // score = min(0.8, 1) = 0.8
    // inatividade: último evento 8d atrás → 0.8 * 0.5 = 0.4
    expect(result.score).toBe(0.4);
    expect(result.segment).toBe('warm'); // 0.4 >= 0.3
    expect(result.reasoning.some(r => r.includes('Inactivity penalty'))).toBe(true);
  });

  // AC-3: Mix de eventos recentes → segmentação correta
  it('should correctly segment a mix of recent events as hot', () => {
    const events = [
      makeEvent('click', ONE_HOUR_AGO),       // 0.2 * 1.5 = 0.30
      makeEvent('form_submit', TWO_HOURS_AGO), // 0.5 * 1.5 = 0.75
    ];
    const result = PropensityEngine.calculate(baseLead, events);

    // rawScore = 0.30 + 0.75 = 1.05, capped to 1.0
    // Sem inatividade → score = 1.0
    expect(result.score).toBe(1);
    expect(result.segment).toBe('hot');
  });

  // AC-4: Apenas 1 evento recente de alto valor (purchase) → hot
  it('should classify single recent purchase event as hot', () => {
    const events = [makeEvent('purchase', ONE_HOUR_AGO)];
    const result = PropensityEngine.calculate(baseLead, events);

    // 1.0 * 1.5 = 1.5, capped to 1.0 → hot
    expect(result.score).toBe(1);
    expect(result.segment).toBe('hot');
  });

  // AC-5: Score sempre normalizado entre 0 e 1 (nunca excede)
  it('should never exceed score range [0, 1] even with many events', () => {
    // 50 purchases recentes
    const manyEvents = Array.from({ length: 50 }, (_, i) =>
      makeEvent('purchase', ONE_HOUR_AGO - i * 1000),
    );
    const result = PropensityEngine.calculate(baseLead, manyEvents);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  it('should normalize score to 0 with zero events', () => {
    const result = PropensityEngine.calculate(baseLead, []);
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });

  // Segmentação warm explícita
  it('should classify as warm when score >= 0.3 and < 0.7', () => {
    // 1 form_submit não-recente (3 dias atrás, < 7 dias → sem penalidade)
    const events = [makeEvent('form_submit', THREE_DAYS_AGO)];
    const result = PropensityEngine.calculate(baseLead, events);

    // rawScore = 0.5 (sem recency bonus)
    // score = min(0.5, 1) = 0.5
    // Sem inatividade (< 7d)
    expect(result.score).toBe(0.5);
    expect(result.segment).toBe('warm');
  });

  // Default weight para tipos desconhecidos
  it('should use default weight (0.05) for unknown event types', () => {
    const events = [makeEvent('custom', ONE_HOUR_AGO)];
    const result = PropensityEngine.calculate(baseLead, events);

    // 0.05 * 1.5 = 0.075
    expect(result.score).toBeCloseTo(0.075, 5);
    expect(result.segment).toBe('cold');
  });

  // Pesos corretos por tipo (page_view: 0.1)
  it('should apply correct weight for page_view (0.1)', () => {
    const events = [makeEvent('page_view', ONE_HOUR_AGO)];
    const result = PropensityEngine.calculate(baseLead, events);

    // 0.1 * 1.5 = 0.15
    expect(result.score).toBeCloseTo(0.15, 5);
    expect(result.segment).toBe('cold');
  });

  // Boundary: score exatamente 0.7 → hot
  it('should classify score exactly at 0.7 threshold as hot', () => {
    // Preciso de rawScore = 0.7 sem recency
    // 1 purchase (1.0) + nada mais, mas não recente e < 7d
    // Porém 1.0 > 0.7 — preciso de combinação menor
    // 7 page_views não-recentes (3 dias): 7 * 0.1 = 0.7
    const events = Array.from({ length: 7 }, () =>
      makeEvent('page_view', THREE_DAYS_AGO),
    );
    const result = PropensityEngine.calculate(baseLead, events);

    expect(result.score).toBeCloseTo(0.7, 5);
    expect(result.segment).toBe('hot');
  });

  // Boundary: score exatamente 0.3 → warm
  it('should classify score exactly at 0.3 threshold as warm', () => {
    // 3 page_views não-recentes (3 dias): 3 * 0.1 = 0.3
    const events = Array.from({ length: 3 }, () =>
      makeEvent('page_view', THREE_DAYS_AGO),
    );
    const result = PropensityEngine.calculate(baseLead, events);

    expect(result.score).toBeCloseTo(0.3, 5);
    expect(result.segment).toBe('warm');
  });
});

// ---------------------------------------------------------------------------
// Tests — Persistence
// ---------------------------------------------------------------------------

describe('PropensityEngine.persistSegment — Firestore persistence', () => {
  const { doc } = require('firebase/firestore');

  beforeEach(() => {
    mockSetDoc.mockClear();
    (doc as jest.Mock).mockClear();
  });

  it('should call setDoc with correct Firestore path and merged data', async () => {
    const mockResult: PropensityResult = {
      score: 0.8,
      segment: 'hot',
      reasoning: ['1 event(s) in last 24h (1.5x bonus)', 'Segment: HOT (score=0.800)'],
    };

    await PropensityEngine.persistSegment('brand_abc', 'lead_xyz', mockResult);

    expect(doc).toHaveBeenCalledWith({}, 'brands', 'brand_abc', 'leads', 'lead_xyz');
    expect(mockSetDoc).toHaveBeenCalledWith(
      'mock-doc-ref',
      expect.objectContaining({
        leadId: 'lead_xyz',
        brandId: 'brand_abc',
        propensityScore: 0.8,  // S29-FT-03: renomeado de score → propensityScore (DT-08)
        segment: 'hot',
        reasoning: mockResult.reasoning,
      }),
      { merge: true },
    );
  });

  it('should not persist when lead has no brandId (multi-tenant guard)', () => {
    const leadNoBrand: JourneyLead = { ...baseLead, brandId: undefined };
    PropensityEngine.calculate(leadNoBrand, []);

    // fire-and-forget should NOT have been called (no brandId)
    expect(mockSetDoc).not.toHaveBeenCalled();
  });
});
