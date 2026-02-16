import { Timestamp } from 'firebase/firestore';
import type { CriticalGap } from './funnel';

/**
 * S31-DT-07: gapDetails tipado (substituiu `any`).
 * Aceita CriticalGap (do AutomationEngine.evaluateAutopsy) ou KillSwitchGap (do Kill-Switch route).
 */
export interface KillSwitchGap {
  reason: string;
  severity: string;
  platform?: 'meta' | 'google';
  type?: 'campaign' | 'adset';
}

export type AutomationGapDetails = CriticalGap | KillSwitchGap;

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
    requireApproval: boolean; // Sempre true (segurança obrigatória)
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
    gapDetails: AutomationGapDetails;
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

/**
 * Collection: brands/{brandId}/dead_letter_queue
 * Webhooks falhados armazenados para retry manual.
 *
 * @story S31-DLQ-01
 * DT-04: Collection name usa underscores (dead_letter_queue), não hifens.
 * DT-12: webhookType inclui 'stripe'.
 * P-13: payload truncado a 10KB (substring(0, 10240)).
 */
export interface DeadLetterItem {
  id: string;
  webhookType: 'meta' | 'instagram' | 'google' | 'stripe';
  payload: string; // JSON stringified, truncado a 10KB
  error: string;
  timestamp: Timestamp;
  retryCount: number;
  status: 'pending' | 'resolved' | 'abandoned';
  resolvedAt?: Timestamp;
}

/**
 * Collection: brands/{brandId}/notifications
 * Notificações in-app para ações de automação.
 *
 * @story S31-KS-03
 */
export interface InAppNotification {
  id: string;
  type: 'kill_switch' | 'automation' | 'system';
  title: string;
  message: string;
  ruleId?: string;
  isRead: boolean;
  createdAt: Timestamp;
}
