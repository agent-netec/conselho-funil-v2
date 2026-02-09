import { Timestamp } from 'firebase/firestore';

export interface OfferComponent {
  id: string;
  name: string;
  value: number;
  price?: number;
  description?: string;
  complementarityScore?: number; // 0-100
}

export interface OfferDocument {
  id: string;
  brandId: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  components: {
    coreProduct: {
      name: string;
      promise: string;
      description?: string;
      price: number;
      perceivedValue: number;
    };
    stacking: OfferComponent[];
    bonuses: OfferComponent[];
    riskReversal: string;
    scarcity?: string;
    urgency?: string;
  };
  scoring: {
    total: number;
    factors: {
      dreamOutcome: number; // 1-10
      perceivedLikelihood: number; // 1-10
      timeDelay: number; // 1-10
      effortSacrifice: number; // 1-10
    };
    analysis: string[];
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Alias de OfferComponent para bônus no Offer Builder */
export type BonusItem = OfferComponent;

// Para uso no Wizard (Estado Local)
export interface OfferWizardState {
  promise: string;
  corePrice: number;
  perceivedValue: number;
  stacking: OfferComponent[];
  bonuses: OfferComponent[];
  scarcity: string;
  riskReversal: string;
  scoringFactors: {
    dreamOutcome: number;
    perceivedLikelihood: number;
    timeDelay: number;
    effortSacrifice: number;
  };
}
