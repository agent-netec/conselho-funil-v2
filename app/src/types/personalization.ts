import { Timestamp } from 'firebase/firestore';

/**
 * Representa um scan profundo de audiência realizado por IA (ST-29.1)
 * Collection: brands/{brandId}/audience_scans
 */
export interface AudienceScan {
  id: string; // scan_{timestamp}_{hash}
  brandId: string; // Multi-tenant isolation
  name: string; // Nome amigável (ex: "Mães Empreendedoras - Q1")
  
  // === PERFIL PSICOGRÁFICO ===
  persona: {
    demographics: string; // Idade, localização, etc.
    painPoints: string[]; // Dores principais
    desires: string[]; // Desejos e aspirações
    objections: string[]; // Objeções comuns de compra
    sophisticationLevel: 1 | 2 | 3 | 4 | 5; // Nível de sofisticação do mercado (1: Inconsciente -> 5: Muito Sofisticado)
  };

  // === ANÁLISE DE PROPENSÃO ===
  propensity: {
    score: number; // 0-1 (Probabilidade de compra)
    segment: 'hot' | 'warm' | 'cold';
    reasoning: string;
  };

  metadata: {
    leadCount: number; // Leads analisados neste scan
    confidence: number; // 0-1
    createdAt: Timestamp;
  };
}

/**
 * Configuração de Conteúdo Dinâmico baseado em Persona
 */
export interface DynamicContentRule {
  id: string;
  brandId: string;
  targetPersonaId: string; // Ref ao AudienceScan
  contentVariations: {
    headline: string;
    vslId?: string;
    offerId?: string;
  };
  isActive: boolean;
  updatedAt: Timestamp;
}

/**
 * Estado completo do lead — união de PropensityEngine + PersonalizationMaestro
 * Sprint 29: S29-FT-03 — campos concretos derivados de ambos motores (DT-08)
 * Path: brands/{brandId}/leads/{leadId}
 */
export interface LeadState {
  // === Identificação (obrigatórios) ===
  leadId: string;
  brandId: string;

  // === Awareness (PersonalizationMaestro) ===
  awarenessLevel: 'UNAWARE' | 'PROBLEM_AWARE' | 'SOLUTION_AWARE' | 'PRODUCT_AWARE' | 'MOST_AWARE';

  // === Propensity (PropensityEngine S28-PS-03) ===
  propensityScore: number;            // 0-1 (derivado de PropensityResult.score)
  segment: 'hot' | 'warm' | 'cold';  // Derivado de PropensityResult.segment
  reasoning: string[];                // Derivado de PropensityResult.reasoning

  // === Interaction tracking (Maestro) ===
  lastInteraction?: {
    type: 'ad_click' | 'dm_received' | 'comment_made' | 'page_view';
    platform: 'meta' | 'instagram' | 'web';
    timestamp: Timestamp;
    contentId?: string;
  };
  eventCount: number;                 // Total de eventos processados
  tags: string[];                     // Tags atribuídas pelo Maestro

  // === Timestamps ===
  firstSeenAt?: Timestamp;
  lastInteractionAt?: Timestamp;
  updatedAt: Timestamp;

  // === Metadata extensível ===
  metadata?: Record<string, unknown>; // Dados adicionais do Maestro
}
