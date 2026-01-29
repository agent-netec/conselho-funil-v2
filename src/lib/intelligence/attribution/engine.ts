import { JourneyEvent, JourneyTransaction } from '../../../types/journey';
import { AttributionResult, AttributionPoint } from '../../../types/attribution';

/**
 * @class AttributionEngine
 * @description Motor de processamento de Multi-Touch Attribution (MTA)
 */
export class AttributionEngine {
  /**
   * Filtra eventos que possuem UTMs válidas
   * @private
   */
  private static filterValidTouchpoints(events: JourneyEvent[]): JourneyEvent[] {
    return events
      .filter(event => event.session.utmSource || event.session.utmMedium || event.session.utmCampaign)
      .sort((a, b) => {
        const timeA = typeof a.timestamp.toMillis === 'function' ? a.timestamp.toMillis() : (a.timestamp as any).seconds * 1000;
        const timeB = typeof b.timestamp.toMillis === 'function' ? b.timestamp.toMillis() : (b.timestamp as any).seconds * 1000;
        return timeA - timeB;
      });
  }

  /**
   * Obtém millis de um timestamp (compatibilidade mock/firebase)
   * @private
   */
  private static getMillis(ts: any): number {
    return typeof ts.toMillis === 'function' ? ts.toMillis() : ts.seconds * 1000;
  }

  /**
   * Normaliza os pesos para garantir que a soma seja exatamente 1.0
   * @private
   */
  private static normalizeWeights(points: AttributionPoint[]): AttributionPoint[] {
    if (points.length === 0) return [];
    
    const totalWeight = points.reduce((sum, p) => sum + p.weight, 0);
    
    // Se a soma já for 1.0 (ou muito próxima por erro de float), não faz nada
    if (Math.abs(totalWeight - 1) < 0.000001) return points;

    return points.map(p => ({
      ...p,
      weight: p.weight / totalWeight
    }));
  }

  /**
   * Converte JourneyEvent para AttributionPoint base
   * @private
   */
  private static toBasePoint(event: JourneyEvent): AttributionPoint {
    return {
      source: event.session.utmSource || '(direct)',
      medium: event.session.utmMedium || '(none)',
      campaign: event.session.utmCampaign || '(not set)',
      timestamp: event.timestamp,
      weight: 0
    };
  }

  /**
   * Modelo Linear: Crédito igual para todos
   */
  public static linear(events: JourneyEvent[], transaction: JourneyTransaction): AttributionResult {
    const validEvents = this.filterValidTouchpoints(events);
    
    if (validEvents.length === 0) {
      return { leadId: transaction.leadId, transactionId: transaction.id, model: 'linear', points: [] };
    }

    const weightPerPoint = 1 / validEvents.length;
    const points = validEvents.map(event => ({
      ...this.toBasePoint(event),
      weight: weightPerPoint
    }));

    return {
      leadId: transaction.leadId,
      transactionId: transaction.id,
      model: 'linear',
      points: this.normalizeWeights(points)
    };
  }

  /**
   * Modelo Time Decay: Mais peso para eventos próximos da conversão
   * Meia-vida de 7 dias
   */
  public static timeDecay(events: JourneyEvent[], transaction: JourneyTransaction): AttributionResult {
    const validEvents = this.filterValidTouchpoints(events);
    
    if (validEvents.length === 0) {
      return { leadId: transaction.leadId, transactionId: transaction.id, model: 'time_decay', points: [] };
    }

    const HALF_LIFE_DAYS = 7;
    const HALF_LIFE_MS = HALF_LIFE_DAYS * 24 * 60 * 60 * 1000;
    const conversionTime = this.getMillis(transaction.createdAt);

    const points = validEvents.map(event => {
      const eventTime = this.getMillis(event.timestamp);
      const diffMs = conversionTime - eventTime;
      
      // Fórmula: weight = 2 ^ (-diff / half_life)
      const weight = Math.pow(2, -(diffMs / HALF_LIFE_MS));

      return {
        ...this.toBasePoint(event),
        weight
      };
    });

    return {
      leadId: transaction.leadId,
      transactionId: transaction.id,
      model: 'time_decay',
      points: this.normalizeWeights(points)
    };
  }

  /**
   * Modelo U-Shape: 40% primeiro, 40% último, 20% meio
   */
  public static uShape(events: JourneyEvent[], transaction: JourneyTransaction): AttributionResult {
    const validEvents = this.filterValidTouchpoints(events);
    const n = validEvents.length;

    if (n === 0) {
      return { leadId: transaction.leadId, transactionId: transaction.id, model: 'u_shape', points: [] };
    }

    if (n === 1) {
      return {
        leadId: transaction.leadId,
        transactionId: transaction.id,
        model: 'u_shape',
        points: [{ ...this.toBasePoint(validEvents[0]), weight: 1.0 }]
      };
    }

    if (n === 2) {
      return {
        leadId: transaction.leadId,
        transactionId: transaction.id,
        model: 'u_shape',
        points: [
          { ...this.toBasePoint(validEvents[0]), weight: 0.5 },
          { ...this.toBasePoint(validEvents[1]), weight: 0.5 }
        ]
      };
    }

    const points = validEvents.map((event, index) => {
      let weight = 0;
      if (index === 0) {
        weight = 0.4; // Primeiro toque
      } else if (index === n - 1) {
        weight = 0.4; // Último toque
      } else {
        weight = 0.2 / (n - 2); // Intermediários
      }

      return {
        ...this.toBasePoint(event),
        weight
      };
    });

    return {
      leadId: transaction.leadId,
      transactionId: transaction.id,
      model: 'u_shape',
      points: this.normalizeWeights(points)
    };
  }
}
