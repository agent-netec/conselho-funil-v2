import { Timestamp } from 'firebase/firestore';

export type AdPlatform = 'meta' | 'google' | 'tiktok' | 'organic' | 'aggregated';
export type AdEntityLevel = 'account' | 'campaign' | 'adset' | 'ad';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertStatus = 'new' | 'investigating' | 'resolved' | 'ignored';

/**
 * Métricas normalizadas de Ads
 */
export interface UnifiedAdsMetrics {
  spend: number;
  revenue: number;
  roas: number;
  cac: number;
  ctr: number;
  cpc: number;
  cpa: number;          // S30-PRE-02 (DT-08): já calculado no normalize, agora no tipo
  conversions: number;
  clicks: number;       // S30-PRE-02 (DT-08): campo essencial para dashboards
  impressions: number;  // S30-PRE-02 (DT-08): campo essencial para dashboards
}

/**
 * Documento de métrica de performance no Firestore
 * Collection: brands/{brandId}/performance_metrics
 */
export interface PerformanceMetric {
  id: string; // `metric_{brandId}_{source}_{timestamp}`
  brandId: string;
  source: 'meta' | 'google' | 'organic' | 'aggregated';
  timestamp: Timestamp;
  data: UnifiedAdsMetrics;
  period: 'hourly' | 'daily' | 'weekly';
}

/**
 * Documento de alerta de anomalia (The Sentry)
 * Collection: brands/{brandId}/performance_anomalies
 */
export interface PerformanceAnomaly {
  id: string;
  brandId: string;
  metricType: keyof UnifiedAdsMetrics;
  severity: AlertSeverity;
  detectedAt: Timestamp;
  valueAtDetection: number;
  expectedValue: number;
  deviationPercentage: number;
  status: AlertStatus;
  aiInsight?: {
    explanation: string; // Gerado pelo Gemini
    suggestedAction: string;
  };
}

/**
 * Configuração do Performance War Room por marca
 * Collection: brands/{brandId}/performance_configs
 */
export interface PerformanceConfig {
  brandId: string;
  integrations: {
    meta_ads?: {
      encryptedApiKey: string; // AES-256-GCM
      accountId: string;
      status: 'active' | 'error' | 'disconnected';
      lastValidated: Timestamp;
    };
    google_ads?: {
      encryptedApiKey: string;
      accountId: string;
      status: 'active' | 'error' | 'disconnected';
      lastValidated: Timestamp;
    };
  };
  sentrySettings: {
    enabled: boolean;
    sensitivity: 'low' | 'medium' | 'high'; // Thresholds: 50%, 30%, 15%
    notificationChannels: ('dashboard' | 'email' | 'slack')[];
  };
  /** @intentional-stub S35 — sem consumer ativo; aguardando integração futura com AnomalyEngine. */
  thresholds?: {
    yellow: number;
    red: number;
  };
  /** @intentional-stub S35 — sem consumer ativo; mantido para compatibilidade de configuração legada. */
  minDataPoints?: {
    impressions: number;
    spend: number;
  };
  updatedAt: Timestamp;
}

// === Interfaces de compatibilidade para módulos legados ===
// @see _netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md (DT-04)

/**
 * @intentional-stub S35 — interface de compatibilidade legada sem consumer ativo.
 * @todo Unificar com PerformanceMetric quando os módulos legados forem reativados.
 */
export interface PerformanceMetricDoc {
  id: string;
  brandId: string;
  platform: AdPlatform;
  name: string;
  level: AdEntityLevel;
  externalId: string;
  metrics: UnifiedAdsMetrics;
  timestamp: Timestamp;
  [key: string]: unknown;
}

/**
 * @intentional-stub S35 — interface de compatibilidade legada sem consumer ativo.
 * @todo Unificar com PerformanceAnomaly quando os módulos legados forem reativados.
 */
export interface PerformanceAlertDoc {
  id: string;
  brandId: string;
  severity: 'high' | 'medium' | 'low';
  metricType: string;
  message: string;
  context: {
    currentValue: number;
    expectedValue: number;
    deviation: number;
    entityId: string;
    entityName: string;
    platform: string;
    [key: string]: unknown;
  };
  status: 'active' | 'resolved' | 'acknowledged';
  createdAt: Timestamp | unknown;
  [key: string]: unknown;
}
