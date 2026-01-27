import { Timestamp } from 'firebase/firestore';

/**
 * Collection: brands/{brandId}/automation_rules
 */
export interface AutomationRule {
  id: string;
  name: string;
  isEnabled: boolean;
  trigger: {
    type: 'metric_threshold' | 'autopsy_gap' | 'profit_score' | 'fatigue_index';
    metric?: string; // ex: 'checkout_cvr'
    operator: '<' | '>' | '<=' | '>=';
    value: number;
    stepType?: 'ads' | 'optin' | 'vsl' | 'checkout' | 'upsell' | 'thankyou';
  };
  action: {
    type: 'pause_ads' | 'notify' | 'adjust_budget';
    params: {
      platform?: 'meta' | 'google';
      targetLevel: 'campaign' | 'adset';
      adjustmentValue?: number;
    };
  };
  guardrails: {
    requireApproval: boolean; // Sempre true no MVP
    cooldownPeriod: number; // Horas antes de agir novamente na mesma entidade
  };
}

/**
 * Collection: brands/{brandId}/automation_logs
 */
export interface AutomationLog {
  id: string;
  ruleId: string;
  action: string;
  status: 'pending_approval' | 'executed' | 'rejected' | 'failed';
  context: {
    funnelId: string;
    gapDetails: any;
    entityId: string; // ID da Campanha/Adset
  };
  executedBy?: string; // ID do usuário que aprovou
  timestamp: Timestamp;
}

export interface KillSwitchRequest {
  brandId: string;
  funnelId: string;
  reason: string;
  severity: 'critical';
  affectedAdEntities: {
    platform: 'meta' | 'google';
    externalId: string;
    type: 'campaign' | 'adset';
  }[];
}

export interface ScalingPrediction {
  score: number; // 0 a 100
  recommendation: 'scale' | 'hold' | 'reduce';
  reasoning: string;
  expectedRoiImpact: number;
  confidence: number;
}

export interface OptimizationInsight {
  id: string;
  type: 'budget_reallocation' | 'channel_scale' | 'channel_reduction';
  platform: string;
  reasoning: string;
  impact: {
    suggestedChange: number; // ex: 0.15 para +15%
    expectedProfitIncrease: number;
  };
  confidence: number;
  createdAt: Timestamp;
}
