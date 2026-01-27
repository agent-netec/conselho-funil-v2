import { Timestamp } from 'firebase/firestore';

/**
 * Estrutura das ofertas criadas no Offer Lab (E42).
 * Collection: brands/{brandId}/offers
 */
export interface OfferDocument {
  id: string;
  name: string;
  productId: string;
  
  // Componentes da Oferta (Offer Builder Framework)
  components: {
    coreProduct: {
      price: number;
      perceivedValue: number;
      description: string;
    };
    bonuses: BonusItem[];
    riskReversal: string; // Garantias
    scarcity: string;     // Gatilhos
    urgency: string;
  };
  
  // Scoring (Irresistibility Score)
  scoring: {
    total: number; // 0-100
    factors: {
      dreamOutcome: number;      // Sonho
      perceivedLikelihood: number; // Probabilidade
      timeDelay: number;         // Tempo
      effortSacrifice: number;   // Esforço
    };
  };
  
  // Benchmarking
  competitorComparison?: {
    competitorOfferId: string;
    advantages: string[];
    disadvantages: string[];
  };
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Representa um item de bônus dentro de uma oferta.
 */
export interface BonusItem {
  id: string;
  name: string;
  value: number;
  description?: string;
  complementarityScore: number; // Quão bem o bônus resolve um problema do produto core
}
