import { AutomationEngine } from '../engine';
import { AutopsyReport, CriticalGap } from '@/types/funnel';
import { AutomationRule } from '@/types/automation';
import { Timestamp } from 'firebase/firestore';

describe('AutomationEngine - Stress & Security Tests', () => {
  // Mock de um Gap Crítico que deve disparar o Kill-Switch
  const criticalGap: CriticalGap = {
    stepId: 'checkout_1',
    metric: 'conversionRate',
    currentValue: 0.001, // 0.1% (Catastrófico)
    targetValue: 0.02,   // 2.0%
    lossEstimate: 10000
  };

  const mockReport: AutopsyReport = {
    id: 'rep_stress',
    funnelId: 'funnel_stress',
    timestamp: Timestamp.now(),
    overallHealth: 10,
    criticalGaps: [criticalGap],
    stepAnalysis: {},
    actionPlan: []
  };

  /**
   * TESTE DE CARGA: Avaliar performance com 1000 regras simultâneas.
   * Garante que o motor não trava ou degrada excessivamente sob carga.
   */
  test('STRESS: should evaluate 1000 rules in under 100ms', () => {
    const rules: AutomationRule[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `rule_${i}`,
      name: `Stress Rule ${i}`,
      isEnabled: true,
      trigger: {
        type: 'autopsy_gap',
        operator: '<',
        value: 0.01,
        stepType: 'checkout'
      },
      action: {
        type: 'pause_ads',
        params: { platform: 'meta', targetLevel: 'campaign' }
      },
      guardrails: { requireApproval: true, cooldownPeriod: 24 }
    }));

    const start = Date.now();
    const logs = AutomationEngine.evaluateAutopsy('brand_stress', mockReport, rules);
    const end = Date.now();

    expect(logs.length).toBe(1000);
    expect(end - start).toBeLessThan(100);
    console.log(`[Stress Test] 1000 rules evaluated in ${end - start}ms`);
  });

  /**
   * TESTE DE SEGURANÇA: Regras desabilitadas NUNCA devem gerar logs.
   */
  test('SECURITY: disabled rules should never trigger', () => {
    const disabledRules: AutomationRule[] = [{
      id: 'rule_disabled',
      name: 'Disabled Rule',
      isEnabled: false,
      trigger: {
        type: 'autopsy_gap',
        operator: '<',
        value: 1.0, // Sempre dispararia se estivesse ativa
      },
      action: { type: 'pause_ads', params: { targetLevel: 'campaign' } },
      guardrails: { requireApproval: true, cooldownPeriod: 24 }
    }];

    const logs = AutomationEngine.evaluateAutopsy('brand_sec', mockReport, disabledRules);
    expect(logs.length).toBe(0);
  });

  /**
   * TESTE DE INTEGRIDADE: Kill-Switch deve ser booleano e preciso.
   */
  test('INTEGRITY: Kill-Switch logic should be strictly > 50% drop-off', () => {
    // Caso 1: 49% de queda (Não dispara Kill-Switch, mas pode disparar regra normal)
    const borderlineGap: CriticalGap = {
      ...criticalGap,
      currentValue: 0.011, // 1.1% de 2.0% ( > 50%)
    };
    expect(AutomationEngine.checkKillSwitch({ ...mockReport, criticalGaps: [borderlineGap] })).toBe(false);

    // Caso 2: 51% de queda (Dispara Kill-Switch)
    const killGap: CriticalGap = {
      ...criticalGap,
      currentValue: 0.009, // 0.9% de 2.0% ( < 50%)
    };
    expect(AutomationEngine.checkKillSwitch({ ...mockReport, criticalGaps: [killGap] })).toBe(true);
  });

  /**
   * TESTE DE ESTABILIDADE: Dados malformados ou vazios não devem quebrar o motor.
   */
  test('STABILITY: should handle empty gaps or rules gracefully', () => {
    const emptyReport: AutopsyReport = { ...mockReport, criticalGaps: [] };
    expect(() => AutomationEngine.evaluateAutopsy('brand_1', emptyReport, [])).not.toThrow();
    expect(AutomationEngine.evaluateAutopsy('brand_1', emptyReport, []).length).toBe(0);
  });
});
