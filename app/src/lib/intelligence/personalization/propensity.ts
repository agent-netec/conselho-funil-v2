import { JourneyLead, JourneyEvent } from '@/types/journey';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * @fileoverview Propensity Engine — S28-PS-03
 * Score normalizado 0-1 com pesos por tipo de evento,
 * bônus de recência (1.5x < 24h), penalidade de inatividade (0.5x > 7d),
 * segmentação hot/warm/cold e persistência em Firestore.
 */

export interface PropensityResult {
  score: number;
  segment: 'hot' | 'warm' | 'cold';
  reasoning: string[];
}

// ---------------------------------------------------------------------------
// Constantes de scoring — S28-PS-03 spec
// ---------------------------------------------------------------------------

/** Pesos por tipo de evento */
const EVENT_WEIGHTS: Record<string, number> = {
  page_view: 0.1,
  click: 0.2,
  form_submit: 0.5,
  purchase: 1.0,
};
const DEFAULT_WEIGHT = 0.05;

/** Thresholds temporais */
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * ONE_DAY_MS;

/** Multiplicadores */
const RECENCY_MULTIPLIER = 1.5;
const INACTIVITY_MULTIPLIER = 0.5;

/** Limiares de segmentação */
const HOT_THRESHOLD = 0.7;
const WARM_THRESHOLD = 0.3;

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export class PropensityEngine {
  /**
   * Calcula a propensão de um lead baseado em seus eventos.
   * Retorna score normalizado [0, 1] e segmento hot/warm/cold.
   * Persiste resultado no Firestore (fire-and-forget, não bloqueia).
   */
  static calculate(lead: JourneyLead, events: JourneyEvent[]): PropensityResult {
    const reasoning: string[] = [];
    const now = Date.now();

    // Edge case: sem eventos → cold imediato
    if (events.length === 0) {
      const result: PropensityResult = {
        score: 0,
        segment: 'cold',
        reasoning: ['No events recorded'],
      };
      PropensityEngine.fireAndForgetPersist(lead, result);
      return result;
    }

    // 1. Score ponderado por tipo de evento + bônus de recência (1.5x < 24h)
    let rawScore = 0;
    let recentCount = 0;

    for (const event of events) {
      const weight = EVENT_WEIGHTS[event.type] ?? DEFAULT_WEIGHT;
      const eventAgeMs = now - event.timestamp.toMillis();
      const isRecent = eventAgeMs < ONE_DAY_MS;

      if (isRecent) {
        rawScore += weight * RECENCY_MULTIPLIER;
        recentCount++;
      } else {
        rawScore += weight;
      }
    }

    if (recentCount > 0) {
      reasoning.push(`${recentCount} event(s) in last 24h (1.5x bonus)`);
    }

    // 2. Normalização: cap em 1.0
    let score = Math.min(rawScore, 1);

    // 3. Penalidade de inatividade (último evento > 7 dias → 0.5x)
    const mostRecentMs = Math.max(...events.map(e => e.timestamp.toMillis()));
    const msSinceLastEvent = now - mostRecentMs;

    if (msSinceLastEvent > SEVEN_DAYS_MS) {
      score *= INACTIVITY_MULTIPLIER;
      const daysSince = Math.round(msSinceLastEvent / ONE_DAY_MS);
      reasoning.push(`Inactivity penalty: last event ${daysSince}d ago (0.5x)`);
    }

    // Garantir normalização final [0, 1]
    score = Math.min(Math.max(score, 0), 1);

    // 4. Segmentação hot/warm/cold
    let segment: 'hot' | 'warm' | 'cold' = 'cold';
    if (score >= HOT_THRESHOLD) {
      segment = 'hot';
    } else if (score >= WARM_THRESHOLD) {
      segment = 'warm';
    }
    reasoning.push(`Segment: ${segment.toUpperCase()} (score=${score.toFixed(3)})`);

    const result: PropensityResult = { score, segment, reasoning };

    // 5. Persistência fire-and-forget
    PropensityEngine.fireAndForgetPersist(lead, result);

    return result;
  }

  // -------------------------------------------------------------------------
  // Persistência Firestore — brands/{brandId}/leads/{leadId}
  // -------------------------------------------------------------------------

  /**
   * Fire-and-forget: persiste segmento sem bloquear o retorno de calculate().
   * @internal
   */
  private static fireAndForgetPersist(
    lead: JourneyLead,
    result: PropensityResult,
  ): void {
    if (!lead.brandId) return;

    PropensityEngine.persistSegment(lead.brandId, lead.id, result).catch(err => {
      console.error('[PropensityEngine] Persist failed:', err);
    });
  }

  /**
   * Salva o resultado de propensão no Firestore.
   * Path: brands/{brandId}/leads/{leadId}
   * Usa merge para não sobrescrever outros campos do lead.
   */
  static async persistSegment(
    brandId: string,
    leadId: string,
    result: PropensityResult,
  ): Promise<void> {
    const leadRef = doc(db, 'brands', brandId, 'leads', leadId);
    await setDoc(
      leadRef,
      {
        leadId,
        brandId,
        propensityScore: result.score,  // S29-FT-03: renomeado de score → propensityScore (DT-08)
        segment: result.segment,
        reasoning: result.reasoning,
        updatedAt: Timestamp.now(),
      },
      { merge: true },
    );
  }
}
