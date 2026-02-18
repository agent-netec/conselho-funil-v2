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
 * W-1.1: Individual condition for composite rules.
 */
export interface AutomationCondition {
  type: 'metric_threshold' | 'autopsy_gap' | 'profit_score' | 'fatigue_index' | 'trend';
  metric?: string;
  operator: '<' | '>' | '<=' | '>=';
  value: number;
  stepType?: 'ads' | 'optin' | 'vsl' | 'checkout' | 'upsell' | 'thankyou';
  /** W-1.2: For trend triggers — number of consecutive days to compare */
  trendPeriodDays?: number;
  /** W-1.2: For trend triggers — direction of the trend */
  trendDirection?: 'rising' | 'falling';
}

/**
 * Collection: brands/{brandId}/automation_rules
 */
export interface AutomationRule {
  id: string;
  name: string;
  isEnabled: boolean;
  /** Legacy single trigger — backward compatible */
  trigger: {
    type: 'metric_threshold' | 'autopsy_gap' | 'profit_score' | 'fatigue_index' | 'trend';
    metric?: string;
    operator: '<' | '>' | '<=' | '>=';
    value: number;
    stepType?: 'ads' | 'optin' | 'vsl' | 'checkout' | 'upsell' | 'thankyou';
    trendPeriodDays?: number;
    trendDirection?: 'rising' | 'falling';
  };
  /** W-1.1: Multi-condition rules (optional — if absent, uses single trigger) */
  conditions?: AutomationCondition[];
  /** W-1.1: Logic operator for multi-condition rules */
  logicOperator?: 'AND' | 'OR';
  action: {
    type: 'pause_ads' | 'notify' | 'adjust_budget';
    params: {
      platform?: 'meta' | 'google';
      targetLevel: 'campaign' | 'adset';
      adjustmentValue?: number;
    };
  };
  guardrails: {
    requireApproval: boolean;
    cooldownPeriod: number;
  };
}

/**
 * W-2.3: Council debate verdict persisted with automation log.
 */
export interface CouncilDebateVote {
  agentId: string;
  name: string;
  recommendation: 'approve' | 'reject';
  reason: string;
}

export interface CouncilDebateResult {
  fullText: string;
  votes: CouncilDebateVote[];
  verdict: string;
  confidence: number;
}

/**
 * W-3.3: Execution result after ads action is performed.
 */
export interface ExecutionResult {
  success: boolean;
  externalId?: string;
  platform?: 'meta' | 'google';
  error?: string;
  timestamp: Timestamp;
}

/**
 * W-4.1: Impact analysis after execution (before/after metrics).
 */
export interface ImpactAnalysis {
  beforeMetrics: Record<string, number>;
  afterMetrics: Record<string, number>;
  delta: Record<string, number>;
  summary: string;
  measuredAt: Timestamp;
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
    entityId: string;
    /** W-2.3: Council debate result */
    councilDebate?: CouncilDebateResult;
  };
  executedBy?: string;
  /** W-3.3: Result of real ads execution */
  executionResult?: ExecutionResult;
  /** W-4.1: Impact measurement (before/after) */
  impactAnalysis?: ImpactAnalysis;
  timestamp: Timestamp;
}

/**
 * W-1.2: Metrics history snapshot for trend detection.
 * Collection: brands/{brandId}/metrics_history
 */
export interface MetricsSnapshot {
  id: string;
  date: string; // YYYY-MM-DD
  metrics: Record<string, number>;
  source: 'cron' | 'manual';
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
