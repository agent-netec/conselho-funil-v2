import { Timestamp } from 'firebase/firestore';

export type AdPlatform = 'meta' | 'google' | 'tiktok';
export type AdEntityLevel = 'account' | 'campaign' | 'adset' | 'ad';
export type AlertSeverity = 'low' | 'medium' | 'high';
export type AlertStatus = 'active' | 'acknowledged' | 'resolved';

/**
 * Métricas normalizadas de Ads
 */
export interface UnifiedAdsMetrics {
  spend: number;
  clicks: number;
  impressions: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  roas: number;
}

/**
 * Documento de métrica de performance no Firestore
 * Collection: brands/{brandId}/performance_metrics
 */
export interface PerformanceMetricDoc {
  id: string;
  brandId: string;
  platform: AdPlatform;
  externalId: string;
  name: string;
  level: AdEntityLevel;
  metrics: UnifiedAdsMetrics;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

/**
 * Documento de alerta de anomalia
 * Collection: brands/{brandId}/performance_alerts
 */
export interface PerformanceAlertDoc {
  id: string;
  brandId: string;
  severity: AlertSeverity;
  metricType: 'cpc' | 'ctr' | 'spend' | 'conversion_rate' | 'delivery';
  message: string;
  context: {
    currentValue: number;
    expectedValue: number;
    deviation: number; // Z-Score ou % de desvio
    entityId: string;
    entityName: string;
    platform: AdPlatform;
  };
  status: AlertStatus;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
  acknowledgedBy?: string; // userId
}

/**
 * Configuração do Anomaly Engine por marca
 */
export interface PerformanceConfig {
  brandId: string;
  enabledPlatforms: AdPlatform[];
  thresholds: {
    yellow: number; // Z-Score (ex: 2.0)
    red: number;    // Z-Score (ex: 3.0)
  };
  minDataPoints: {
    impressions: number; // Mínimo de impressões para validar anomalia
    spend: number;       // Mínimo de gasto para validar anomalia
  };
  notificationChannels: {
    email?: string[];
    webhook?: string;
    inApp: boolean;
  };
}
