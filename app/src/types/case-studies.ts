/**
 * Shared Case Study type — used by Spy Agent and Page Forensics
 * Collection: brands/{brandId}/case_studies
 */
import { Timestamp } from 'firebase/firestore';

export type CaseStudySource = 'spy_agent' | 'page_forensics';

export interface CaseStudyInsight {
  category: 'strength' | 'weakness' | 'opportunity' | 'emulate' | 'avoid';
  text: string;
  reasoning?: string;
}

export interface CaseStudyDesignSystem {
  colors: string[];
  typography?: string;
  spacing?: string;
  components?: string[];
}

export interface CaseStudy {
  id: string;
  brandId: string;
  source: CaseStudySource;
  url: string;
  title: string;
  summary: string;

  // Qualitative analysis
  insights: CaseStudyInsight[];
  designSystem?: CaseStudyDesignSystem;
  strategicRationale?: string[];
  actionableItems: string[];

  // Scores (from forensics)
  score?: number;
  heuristicScores?: Record<string, number>;

  // Competitive context
  competitorId?: string;
  competitorName?: string;

  // Metadata
  techStack?: string[];
  screenshotUrl?: string;

  // Timestamps — NO TTL (permanent)
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface CreateCaseStudyInput {
  brandId: string;
  source: CaseStudySource;
  url: string;
  title: string;
  summary: string;
  insights: CaseStudyInsight[];
  designSystem?: CaseStudyDesignSystem;
  strategicRationale?: string[];
  actionableItems: string[];
  score?: number;
  heuristicScores?: Record<string, number>;
  competitorId?: string;
  competitorName?: string;
  techStack?: string[];
  screenshotUrl?: string;
}
