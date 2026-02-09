import { Timestamp } from 'firebase/firestore';

/**
 * Deep Research Types
 * DT-05 (BLOCKING): dominio separado de predictive.ts
 */
export type ResearchDepth = 'quick' | 'standard' | 'deep';
export type ResearchStatus = 'processing' | 'completed' | 'failed';
export type ResearchProvider = 'exa' | 'firecrawl';

export interface ResearchQuery {
  brandId: string;
  topic: string;
  marketSegment?: string;
  competitors?: string[];
  depth: ResearchDepth;
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  relevanceScore: number;
  source: ResearchProvider;
  fetchedAt: Timestamp;
}

export interface MarketDossierSections {
  marketOverview: string;
  marketSize: string;
  trends: string[];
  competitors: Array<{
    name: string;
    strengths: string[];
    weaknesses: string[];
  }>;
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export interface MarketDossier {
  id: string;
  brandId: string;
  topic: string;
  status: ResearchStatus;
  sections: MarketDossierSections;
  sources: ResearchSource[];
  generatedAt: Timestamp;
  expiresAt: Timestamp;
}
