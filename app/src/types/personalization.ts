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
