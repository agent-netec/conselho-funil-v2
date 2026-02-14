import type { CounselorId } from '@/types';

// ============================================
// Brain Identity Card Types
// ============================================

export type BrainDomain = 'copy' | 'funnel' | 'social' | 'ads' | 'design';

export interface ScoringRange {
  '90_100': string;
  '60_89': string;
  '30_59': string;
  '0_29': string;
}

export interface ScoringCriterion {
  id: string;
  label: string;
  weight: number;
  scoring: ScoringRange;
}

export interface EvaluationFramework {
  description: string;
  criteria: ScoringCriterion[];
}

export interface RedFlag {
  id: string;
  label: string;
  penalty: number;
  before: string;
  after: string;
  expertSays: string;
}

export interface GoldStandard {
  id: string;
  label: string;
  bonus: number;
  example: string;
  expertSays: string;
}

export interface BrainFrontmatter {
  counselor: CounselorId;
  domain: BrainDomain;
  doc_type: 'identity_card';
  version: string;
  token_estimate: number;
}

export interface BrainIdentityCard {
  frontmatter: BrainFrontmatter;
  name: string;
  subtitle: string;
  philosophy: string;
  principles: string;
  voice: string;
  catchphrases: string[];
  evaluationFrameworks: Record<string, EvaluationFramework>;
  redFlags: RedFlag[];
  goldStandards: GoldStandard[];
  /** Raw markdown content (for prompt injection) */
  rawNarrative: string;
}
