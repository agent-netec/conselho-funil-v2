import { Timestamp } from 'firebase/firestore';
import type { DesignAnalysis, InspirationRef } from './design-system';

export type CampaignStatus = 'planning' | 'active' | 'archived';

export interface CampaignContext {
  id: string;            // Campaign ID (Único por execução)
  funnelId: string;      // ID do Funil de Origem (Estratégia)
  brandId: string;
  userId: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  
  // Passo 1: O Cérebro (Funnel)
  funnel?: {
    type: string;
    architecture: string;
    targetAudience: string;
    mainGoal: string;
    stages: string[];
    summary: string;
    counselor_reference?: string;

    // Sprint 04.2 — Campos do wizard que faltavam
    awareness?: string;             // 'unaware' | 'problem_aware' | 'solution_aware' | 'product_aware' | 'most_aware'
    pain?: string | string[];       // dor principal ou top 3
    objection?: string | string[];  // objeção principal ou top 3
    differentiator?: string;        // diferencial competitivo

    // Da proposta aprovada
    proposalName?: string;
    proposalVersion?: number;
    scorecard?: Record<string, number>;

    // Canais
    primaryChannel?: string;
    secondaryChannel?: string;
  };

  // Passo 1.5: A Oferta (Offer Lab) — opcional, presente se brand tem oferta salva
  offer?: {
    offerId: string;
    name: string;
    score: number;
    promise: string;
  };

  // Passo 2: A Voz (Copy)
  copywriting?: {
    bigIdea: string;
    headlines: string[];
    mainScript?: string;
    tone: string;
    keyBenefits: string[];
    counselor_reference?: string;

    // Sprint 04.4 — Copy estruturada
    structured?: {
      headline: string;
      subheadline: string;
      body: string;
      cta: string;
      proof: string;
    };
    scorecard?: {
      persuasion: number;
      clarity: number;
      emotional: number;
      credibility: number;
      actionability: number;
    };
    selectedVariation?: string;
  };

  // Passo 3: A Atenção (Social)
  social?: {
    campaignType: 'organic' | 'viral' | 'institutional' | 'conversion';
    contentFormats: string[];
    hooks: {
      platform: string;
      content: string;
      style: string;
      score?: number;        // 0-100 do scorecard
      framework?: string;
      approved?: boolean;    // Flag de aprovação
    }[];
    contentPlan?: {
      pillars: string[];
      calendar: { day: string; pillar: string; format: string }[];
      posts: { title: string; hook: string; platform: string; format: string; approved?: boolean }[];
    };
    platforms: string[];
    pacing?: string;
    viralTriggers?: string[];
    debate?: string;
    evaluation?: {
      engagement?: number;
      clarity?: number;
      brandAlignment?: number;
      virality?: number;
      [key: string]: unknown;
    };
  };

  // Passo 4: O Visual (Design)
  design?: {
    visualStyle: string;
    preferredColors: string[];
    visualPrompts: string[];
    aspectRatios: string[];
    assetsUrl?: string[];
    // Design Director expansion
    analysis?: DesignAnalysis;
    campaignSystem?: {
      enabled: boolean;
      pieces: { role: string; promptIndex: number }[];
    };
    inspirationRefs?: InspirationRef[];
    selectedCharacterIds?: string[];
  };

  // Passo 5: A Escala (Ads)
  ads?: {
    audiences: string[];
    channels: string[];
    suggestedBudget?: string;
    performanceBenchmarks?: {
      targetCPC?: number;
      targetCTR?: number;
      targetCPA?: number;
    };
  };

  // Passo 6: Métricas Reais (Sincronizadas via Webhook)
  metrics?: {
    clicks: number;
    impressions: number;
    spend: number;
    conversions: number;
    lastUpdated: Timestamp;
  };

  // Metadados de Controle
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
