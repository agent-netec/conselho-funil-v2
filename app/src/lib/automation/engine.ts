import { LegacyAutopsyReport, CriticalGap } from '@/types/funnel';
import { AutomationRule, AutomationLog, ScalingPrediction } from '@/types/automation';
import { Timestamp } from 'firebase/firestore';

/**
 * AutomationEngine: O cérebro que decide quando acionar o Kill-Switch
 * ou sugerir otimizações baseadas nos relatórios do Autopsy.
 */
export class AutomationEngine {
  /**
   * Avalia uma proposta de escala usando o ScalingPredictor.
   * ST-27.4: Integração com Gemini Flash para predição de escala.
   */
  static async evaluateScaling(
    brandId: string,
    prediction: ScalingPrediction,
    rule: AutomationRule
  ): Promise<AutomationLog | null> {
    if (prediction.recommendation === 'scale' && prediction.confidence > 0.7) {
      return this.createActionProposal(brandId, 'scaling_loop', {
        id: 'scaling_prediction',
        metricName: 'scaling_confidence',
        currentValue: prediction.score,
        targetValue: 70,
        impact: 'budget_scaling',
        details: prediction
      } as any, rule);
    }
    return null;
  }
  /**
   * Avalia um relatório de Autopsy contra as regras de automação da marca.
   */
  static evaluateAutopsy(
    brandId: string,
    report: LegacyAutopsyReport,
    rules: AutomationRule[]
  ): AutomationLog[] {
    const logs: AutomationLog[] = [];

    // Filtrar apenas regras habilitadas
    const activeRules = rules.filter(r => r.isEnabled);

    report.criticalGaps.forEach(gap => {
      activeRules.forEach(rule => {
        if (this.shouldTrigger(gap, rule)) {
          logs.push(this.createActionProposal(brandId, report.funnelId, gap, rule));
        }
      });
    });

    return logs;
  }

  /**
   * Avalia métricas de performance (Profit Score, Fatigue Index) contra as regras.
   * ST-27.1: Suporte a métricas de lucro e fadiga.
   */
  static evaluatePerformanceMetrics(
    brandId: string,
    metrics: Record<string, number>,
    rules: AutomationRule[]
  ): AutomationLog[] {
    const logs: AutomationLog[] = [];
    const activeRules = rules.filter(r => r.isEnabled);

    activeRules.forEach(rule => {
      const { type, metric, operator, value } = rule.trigger;
      
      let currentValue: number | undefined;

      if (type === 'profit_score') {
        currentValue = metrics['profit_score'];
      } else if (type === 'fatigue_index') {
        currentValue = metrics['fatigue_index'];
      } else if (type === 'metric_threshold' && metric) {
        currentValue = metrics[metric];
      }

      if (currentValue !== undefined && this.compare(currentValue, operator, value)) {
        logs.push(this.createActionProposal(brandId, 'performance_loop', {
          id: `metric_${type}`,
          metricName: metric || type,
          currentValue,
          targetValue: value,
          impact: 'performance_optimization'
        } as any, rule));
      }
    });

    return logs;
  }

  /**
   * Verifica se um gap crítico deve disparar uma regra.
   */
  private static shouldTrigger(gap: CriticalGap, rule: AutomationRule): boolean {
    if (rule.trigger.type !== 'autopsy_gap') return false;

    return this.compare(gap.currentValue, rule.trigger.operator, rule.trigger.value);
  }

  /**
   * Helper para comparação de valores
   */
  private static compare(current: number, operator: string, value: number): boolean {
    switch (operator) {
      case '<': return current < value;
      case '>': return current > value;
      case '<=': return current <= value;
      case '>=': return current >= value;
      default: return false;
    }
  }

  /**
   * Cria uma proposta de ação (Log pendente de aprovação).
   */
  private static createActionProposal(
    brandId: string,
    funnelId: string,
    gap: CriticalGap,
    rule: AutomationRule
  ): AutomationLog {
    return {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      action: rule.action.type,
      status: 'pending_approval',
      context: {
        funnelId,
        gapDetails: gap,
        entityId: 'TBD', // Será preenchido na integração com Ads
      },
      timestamp: Timestamp.now()
    };
  }

  /**
   * Lógica específica para o Kill-Switch (Falha Catastrófica).
   * Acionado quando o drop-off é > 50% vs benchmark (conforme ST-20.2).
   */
  static checkKillSwitch(report: LegacyAutopsyReport): boolean {
    return report.criticalGaps.some(gap => {
      // Se o valor atual é menos da metade do target (benchmark)
      // Ex: Target 2%, Atual 0.9% -> 0.9 < (2 * 0.5) -> Trigger!
      return gap.currentValue < (gap.targetValue * 0.5);
    });
  }
}
