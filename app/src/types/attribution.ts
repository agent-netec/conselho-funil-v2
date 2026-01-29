import { Timestamp } from 'firebase/firestore';

export type AttributionModel = 'first_touch' | 'last_touch' | 'linear' | 'time_decay' | 'u_shape';

export interface AttributionPoint {
  source: string;
  medium: string;
  campaign: string;
  timestamp: Timestamp;
  weight: number;
  adId?: string; // ID do anúncio original se disponível
  fbclid?: string; // Facebook Click ID
  gclid?: string; // Google Click ID
  ttclid?: string; // TikTok Click ID
}

/**
 * Ponte de Atribuição (ST-28.2)
 * Conecta rastros de leads de diferentes origens (Web, CRM, Ads API)
 */
export interface AttributionBridge {
  leadId: string;
  externalIds: {
    meta?: string; // fbp/fbc
    google?: string; // gclid
    tiktok?: string; // ttclid
    crm?: string; // external_id
  };
  touchpoints: AttributionPoint[];
  lastSyncAt: Timestamp;
}

export interface AttributionResult {
  leadId: string;
  transactionId: string;
  model: AttributionModel;
  points: AttributionPoint[];
}

export interface MMMDataPoint {
  date: string;
  spend: number;
  organicSales: number;
}

export interface MMMResult {
  correlationScore: number; // -1 a 1
  confidenceLevel: 'Strong' | 'Moderate' | 'Weak';
  estimatedOrganicLift: number; // % de vendas orgânicas que "seguem" o spend
  insight: string;
}
