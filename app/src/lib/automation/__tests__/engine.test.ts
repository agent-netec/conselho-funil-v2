import { AutomationEngine } from '../engine';
import { AutopsyReport, CriticalGap } from '@/types/funnel';
import { AutomationRule } from '@/types/automation';
import { Timestamp } from 'firebase/firestore';

describe('AutomationEngine', () => {
  const mockReport: AutopsyReport = {
    id: 'rep_1',
    funnelId: 'funnel_1',
    timestamp: Timestamp.now(),
    overallHealth: 40,
    criticalGaps: [
      {
        stepId: 'checkout_1',
        metric: 'conversionRate',
        currentValue: 0.005, // 0.5%
        targetValue: 0.02,   // 2.0%
        lossEstimate: 5000
      }
    ],
    stepAnalysis: {},
    actionPlan: []
  };

  const mockRules: AutomationRule[] = [
    {
      id: 'rule_1',
      name: 'Pause on Low Checkout CVR',
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
    }
  ];

  test('should trigger rule when threshold is met', () => {
    const logs = AutomationEngine.evaluateAutopsy('brand_1', mockReport, mockRules);
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('pending_approval');
    expect(logs[0].action).toBe('pause_ads');
  });

  test('should detect Kill-Switch condition (drop-off > 50%)', () => {
    const isKillSwitch = AutomationEngine.checkKillSwitch(mockReport);
    expect(isKillSwitch).toBe(true); // 0.5% < (2.0% * 0.5)
  });

  test('should NOT detect Kill-Switch if drop-off is minor', () => {
    const safeReport: AutopsyReport = {
      ...mockReport,
      criticalGaps: [{
        ...mockReport.criticalGaps[0],
        currentValue: 0.015 // 1.5% (75% of target)
      }]
    };
    const isKillSwitch = AutomationEngine.checkKillSwitch(safeReport);
    expect(isKillSwitch).toBe(false);
  });

  test('should trigger rule for Profit Score (ST-27.1)', () => {
    const metrics = { profit_score: 0.7, fatigue_index: 0.2 };
    const rules: AutomationRule[] = [
      {
        id: 'rule_profit',
        name: 'Scale on High Profit',
        isEnabled: true,
        trigger: {
          type: 'profit_score',
          operator: '>',
          value: 0.6
        },
        action: {
          type: 'adjust_budget',
          params: { platform: 'google', targetLevel: 'campaign', adjustmentValue: 1.2 }
        },
        guardrails: { requireApproval: true, cooldownPeriod: 6 }
      }
    ];

    const logs = AutomationEngine.evaluatePerformanceMetrics('brand_1', metrics, rules);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('adjust_budget');
  });

  test('should trigger rule for Fatigue Index (ST-27.1)', () => {
    const metrics = { profit_score: 0.5, fatigue_index: 0.85 };
    const rules: AutomationRule[] = [
      {
        id: 'rule_fatigue',
        name: 'Pause on High Fatigue',
        isEnabled: true,
        trigger: {
          type: 'fatigue_index',
          operator: '>',
          value: 0.8
        },
        action: {
          type: 'pause_ads',
          params: { platform: 'meta', targetLevel: 'adset' }
        },
        guardrails: { requireApproval: true, cooldownPeriod: 24 }
      }
    ];

    const logs = AutomationEngine.evaluatePerformanceMetrics('brand_1', metrics, rules);
    expect(logs.length).toBe(1);
    expect(logs[0].action).toBe('pause_ads');
  });
});
