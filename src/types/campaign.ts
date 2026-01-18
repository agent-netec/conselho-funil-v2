import { Timestamp } from 'firebase/firestore';

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
  };

  // Passo 2: A Voz (Copy)
  copywriting?: {
    bigIdea: string;
    headlines: string[];
    mainScript?: string;
    tone: string;
    keyBenefits: string[];
    counselor_reference?: string;
  };

  // Passo 3: A Atenção (Social)
  social?: {
    hooks: {
      platform: string;
      content: string;
      style: string;
    }[];
    platforms: string[];
    pacing?: string;
    viralTriggers?: string[];
  };

  // Passo 4: O Visual (Design)
  design?: {
    visualStyle: string;
    preferredColors: string[];
    visualPrompts: string[];
    aspectRatios: string[];
    assetsUrl?: string[];
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
