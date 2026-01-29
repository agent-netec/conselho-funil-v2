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
  conversions: number;
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
  updatedAt: Timestamp;
}
