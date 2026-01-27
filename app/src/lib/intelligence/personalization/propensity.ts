import { JourneyLead, JourneyEvent } from '@/types/journey';

/**
 * @fileoverview Algoritmo de Propensão Comportamental (ST-29.3)
 * Calcula o score de 0-1 e segmenta em Hot, Warm, Cold baseado em eventos.
 */

export interface PropensityResult {
  score: number;
  segment: 'hot' | 'warm' | 'cold';
  reasoning: string[];
}

export class PropensityEngine {
  // Pesos para diferentes tipos de eventos
  private static WEIGHTS = {
    page_view: 1,
    lead_capture: 5,
    vsl_watch: 10,
    checkout_init: 20,
    custom: 2
  };

  /**
   * Calcula a propensão de um lead baseado no seu rastro de eventos.
   */
  static calculate(lead: JourneyLead, events: JourneyEvent[]): PropensityResult {
    let rawScore = 0;
    const reasoning: string[] = [];

    // 1. Análise de Frequência e Intensidade
    events.forEach(event => {
      const weight = this.WEIGHTS[event.type] || 1;
      
      // Bônus por profundidade no VSL
      if (event.type === 'vsl_watch' && event.payload?.duration) {
        const duration = event.payload.duration;
        if (duration > 600) { // Mais de 10 min
          rawScore += 15;
          reasoning.push('High VSL retention (>10m)');
        } else if (duration > 300) {
          rawScore += 5;
          reasoning.push('Moderate VSL retention (>5m)');
        }
      }

      rawScore += weight;
    });

    // 2. Bônus por Recência (Eventos nas últimas 24h valem mais)
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const recentEvents = events.filter(e => (now - e.timestamp.toMillis()) < oneDayMs);
    
    if (recentEvents.length > 0) {
      const recencyBonus = Math.min(recentEvents.length * 2, 20);
      rawScore += recencyBonus;
      reasoning.push(`High recency: ${recentEvents.length} events in last 24h`);
    }

    // 3. Penalidade por Inatividade (Se último evento > 7 dias)
    if (events.length > 0) {
      const lastEvent = events[0]; // Assumindo ordenação desc
      const daysSinceLastEvent = (now - lastEvent.timestamp.toMillis()) / (oneDayMs);
      if (daysSinceLastEvent > 7) {
        rawScore *= 0.5;
        reasoning.push('Inactivity penalty: Last event > 7 days ago');
      }
    }

    // 4. Normalização (0-1)
    // Definimos 100 como o "teto" para score 1.0
    const finalScore = Math.min(rawScore / 100, 1);

    // 5. Segmentação
    let segment: 'hot' | 'warm' | 'cold' = 'cold';
    if (finalScore >= 0.7) {
      segment = 'hot';
    } else if (finalScore >= 0.3) {
      segment = 'warm';
    }

    return {
      score: finalScore,
      segment,
      reasoning: reasoning.slice(0, 3) // Top 3 motivos
    };
  }
}
