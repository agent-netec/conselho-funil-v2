import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Tipos para Journey Mapping e LTV Intelligence
 * @module types/journey
 * @version 1.0.0
 */

export type JourneyEventType = 
  | 'page_view' 
  | 'vsl_watch' 
  | 'checkout_init' 
  | 'lead_capture' 
  | 'custom';

export type JourneyEventSource = 'web' | 'crm' | 'ads_api';

export interface JourneyLeadPII {
  email: string;       // [PII] - Criptografado
  firstName?: string;  // [PII] - Criptografado
  lastName?: string;   // [PII] - Criptografado
  phone?: string;      // [PII] - Criptografado
}

export interface JourneyAttribution {
  firstSource: string;
  firstMedium: string;
  firstCampaign: string;
  lastSource: string;
  lastMedium: string;
  lastCampaign: string;
  adId?: string;
}

export interface JourneyMetrics {
  totalLtv: number;        // Em centavos
  transactionCount: number;
  averageTicket: number;
  firstPurchaseAt?: Timestamp;
  lastPurchaseAt?: Timestamp;
  cohort?: string;         // Safra (YYYY-MM) baseada no createdAt do lead
}

/**
 * Documento do Lead no Firestore
 * Collection: leads
 */
export interface JourneyLead {
  id: string; // ID único (ex: hash do email ou UUID)
  brandId?: string; // Multi-tenant guardrail (obrigatório para novas gravações)
  pii: JourneyLeadPII;
  attribution: JourneyAttribution;
  metrics: JourneyMetrics;
  status: 'lead' | 'customer' | 'churned';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Documento de Evento no Firestore
 * Collection: events
 */
export interface JourneyEvent {
  id: string;
  leadId: string;
  brandId?: string; // Multi-tenant guardrail (obrigatório para novas gravações)
  type: JourneyEventType;
  source: JourneyEventSource;
  payload: {
    url?: string;
    duration?: number; // Segundos assistidos no VSL
    step?: string;
    metadata?: Record<string, any>;
  };
  session: {
    sessionId: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    ipAddress?: string; // [PII] - Criptografado
  };
  timestamp: Timestamp;
}

/**
 * Documento de Transação no Firestore
 * Collection: transactions
 */
export interface JourneyTransaction {
  id: string;
  leadId: string;
  brandId: string;
  amount: number;
  currency: string;
  product: {
    id: string;
    name: string;
    type: 'core' | 'upsell' | 'order_back' | 'subscription';
  };
  status: 'pending' | 'approved' | 'refunded' | 'chargedback';
  payment: {
    gateway: string;
    method: 'credit_card' | 'pix' | 'boleto';
    installments: number;
  };
  processedAt: Timestamp;
  createdAt: Timestamp;
}
