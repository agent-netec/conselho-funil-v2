import { Timestamp } from 'firebase/firestore';

/**
 * Deep Research Types
 * DT-05 (BLOCKING): dominio separado de predictive.ts
 */
export type ResearchDepth = 'quick' | 'standard' | 'deep';
export type ResearchStatus = 'processing' | 'completed' | 'failed';
export type ResearchProvider = 'exa' | 'firecrawl';

/** Sprint O: Task template types for structured research */
export type ResearchTemplateId = 'audience_analysis' | 'competitor_analysis' | 'trends' | 'product_research' | 'niche_mapping' | 'custom';

export interface ResearchTemplate {
  id: ResearchTemplateId;
  label: string;
  description: string;
  icon: string;
  defaultDepth: ResearchDepth;
  defaultSources: string[];
  promptHint: string;
}

export interface ResearchQuery {
  brandId: string;
  topic: string;
  marketSegment?: string;
  competitors?: string[];
  depth: ResearchDepth;
  templateId?: ResearchTemplateId;
  customUrls?: string[];
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

/** Sprint O: Audience persona generated from social comment analysis */
export interface AudiencePersona {
  name: string;
  age: string;
  tone: string;
  pains: string[];
  desires: string[];
  questions: string[];
  triggers: string[];
  summary: string;
}

/** Sprint O: Chat refinement message */
export interface ResearchChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
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
  templateId?: ResearchTemplateId;
  customUrls?: string[];
  audiencePersona?: AudiencePersona;
  chatHistory?: ResearchChatMessage[];
  ragChunkIds?: string[];
}
