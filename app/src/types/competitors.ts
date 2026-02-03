import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Tipos para Inteligência Competitiva e Spy Agent
 * @module types/competitors
 * @version 1.0.0
 */

export interface CompetitorTechStack {
  cms?: string;                         // ex: 'WordPress', 'Webflow'
  analytics: string[];                  // ex: ['GTM', 'Meta Pixel']
  marketing: string[];                  // ex: ['ActiveCampaign', 'Klaviyo']
  payments: string[];                   // ex: ['Stripe', 'Hotmart']
  infrastructure: string[];             // ex: ['Cloudflare', 'AWS']
  updatedAt: Timestamp;
}

export interface CompetitorProfile {
  id: string;
  brandId: string;
  name: string;
  websiteUrl: string;
  socialMedia: {
    instagram?: string;
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  category: string[];                   // ex: ['Direct', 'Indirect', 'Aspirational']
  status: 'active' | 'archived';
  lastSpyScan?: Timestamp;              // Última execução do Spy Agent
  techStack?: CompetitorTechStack;      // Consolidado da última análise
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type IntelligenceAssetType = 'screenshot' | 'tech_log' | 'html_snapshot' | 'funnel_map';
export type PageType = 'landing_page' | 'checkout' | 'upsell' | 'thank_you' | 'vsl' | 'other';

/**
 * Ativos capturados pelo Spy Agent (Funnel & LP Tracker)
 * Collection: brands/{brandId}/competitors/{competitorId}/assets
 */
export interface IntelligenceAsset {
  id: string;
  competitorId: string;
  brandId: string;
  type: IntelligenceAssetType;
  
  // === METADATA DE CAPTURA ===
  url: string;                          // URL onde o ativo foi gerado
  pageType: PageType;
  capturedAt: Timestamp;
  
  // === CONTEÚDO ===
  storagePath: string;                  // Caminho no Firebase Storage
  publicUrl?: string;                   // URL pública (se aplicável)
  
  // === INSIGHTS (Gerados por IA após captura) ===
  analysis?: {
    headline?: string;                  // Headline principal extraída
    offerType?: string;                 // ex: 'Free Trial', 'Direct Sale'
    visualStyle?: string[];             // ex: 'Minimalist', 'Aggressive'
    techDetected?: string[];            // Tecnologias específicas desta página
  };
  
  version: number;
}

export interface CompetitorDossier {
  id: string;
  competitorId: string;
  brandId: string;
  title: string;
  summary: string;                     // Resumo executivo
  analysis: {
    swot: {
      strengths: string[];
      weaknesses: string[];
      opportunities: string[];
      threats: string[];
    };
    offerType: string;
    visualStyle: string[];
    marketPositioning: string;
  };
  generatedAt: Timestamp;
  version: number;
}

/**
 * Resultado de um scan do Spy Agent
 */
export interface SpyScanResult {
  competitorId: string;
  url: string;
  success: boolean;
  techStack: Partial<CompetitorTechStack>;
  assetsFound: number;
  durationMs: number;
  error?: string;
  scannedAt: number;
}
