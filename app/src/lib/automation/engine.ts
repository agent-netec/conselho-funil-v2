import { LegacyAutopsyReport, CriticalGap } from '@/types/funnel';
import { AutomationRule, AutomationLog, ScalingPrediction, AutomationCondition, MetricsSnapshot } from '@/types/automation';
import { Timestamp } from 'firebase/firestore';

/**
 * AutomationEngine: O cérebro que decide quando acionar o Kill-Switch
 * ou sugerir otimizações baseadas nos relatórios do Autopsy.
 *
 * W-1.1: Multi-condition support (AND/OR).
 * W-1.2: Trend evaluation (N consecutive days).
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
   * Avalia métricas de performance contra as regras.
   * W-1.1: Supports multi-condition rules with AND/OR logic.
   * W-1.2: Supports trend triggers using metrics history.
   */
  static evaluatePerformanceMetrics(
    brandId: string,
    metrics: Record<string, number>,
    rules: AutomationRule[],
    metricsHistory?: MetricsSnapshot[]
  ): AutomationLog[] {
    const logs: AutomationLog[] = [];
    const activeRules = rules.filter(r => r.isEnabled);

    activeRules.forEach(rule => {
      let triggered = false;

      // W-1.1: Multi-condition evaluation
      if (rule.conditions && rule.conditions.length > 0) {
        triggered = this.evaluateMultiCondition(rule.conditions, rule.logicOperator || 'AND', metrics, metricsHistory);
      } else {
        // Legacy single trigger (backward compatible)
        triggered = this.evaluateSingleCondition(rule.trigger, metrics, metricsHistory);
      }

      if (triggered) {
        logs.push(this.createActionProposal(brandId, 'performance_loop', {
          id: `metric_${rule.trigger.type}`,
          metricName: rule.trigger.metric || rule.trigger.type,
          currentValue: metrics[rule.trigger.metric || rule.trigger.type] ?? 0,
          targetValue: rule.trigger.value,
          impact: 'performance_optimization'
        } as any, rule));
      }
    });

    return logs;
  }

  /**
   * W-1.1: Evaluates multiple conditions with AND/OR logic.
   */
  private static evaluateMultiCondition(
    conditions: AutomationCondition[],
    logicOperator: 'AND' | 'OR',
    metrics: Record<string, number>,
    metricsHistory?: MetricsSnapshot[]
  ): boolean {
    if (conditions.length === 0) return false;

    if (logicOperator === 'AND') {
      return conditions.every(c => this.evaluateSingleCondition(c, metrics, metricsHistory));
    } else {
      return conditions.some(c => this.evaluateSingleCondition(c, metrics, metricsHistory));
    }
  }

  /**
   * Evaluates a single condition (trigger or condition object).
   * W-1.2: Supports trend type.
   */
  private static evaluateSingleCondition(
    condition: AutomationCondition | AutomationRule['trigger'],
    metrics: Record<string, number>,
    metricsHistory?: MetricsSnapshot[]
  ): boolean {
    const { type, metric, operator, value } = condition;

    // W-1.2: Trend evaluation
    if (type === 'trend') {
      return this.evaluateTrend(condition, metricsHistory);
    }

    let currentValue: number | undefined;

    if (type === 'profit_score') {
      currentValue = metrics['profit_score'];
    } else if (type === 'fatigue_index') {
      currentValue = metrics['fatigue_index'];
    } else if (type === 'metric_threshold' && metric) {
      currentValue = metrics[metric];
    }

    if (currentValue !== undefined) {
      return this.compare(currentValue, operator, value);
    }

    return false;
  }

  /**
   * W-1.2: Evaluates a trend trigger against metrics history.
   * Checks if a metric has been consistently rising/falling for N days.
   */
  private static evaluateTrend(
    condition: AutomationCondition | AutomationRule['trigger'],
    metricsHistory?: MetricsSnapshot[]
  ): boolean {
    if (!metricsHistory || metricsHistory.length < 2) return false;

    const metric = condition.metric;
    if (!metric) return false;

    const periodDays = condition.trendPeriodDays || 3;
    const direction = condition.trendDirection || 'rising';

    // Sort by date descending, take the last N snapshots
    const sorted = [...metricsHistory]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, periodDays);

    if (sorted.length < periodDays) return false;

    // Reverse to chronological order
    const chronological = sorted.reverse();
    const values = chronological.map(s => s.metrics[metric]).filter(v => v !== undefined);

    if (values.length < periodDays) return false;

    // Check consecutive trend
    for (let i = 1; i < values.length; i++) {
      if (direction === 'rising' && values[i] <= values[i - 1]) return false;
      if (direction === 'falling' && values[i] >= values[i - 1]) return false;
    }

    return true;
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
