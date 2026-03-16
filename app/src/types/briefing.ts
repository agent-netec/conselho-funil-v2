/**
 * Campaign Briefing Types
 *
 * Estrutura do briefing rico gerado pelo Gemini
 * para exportação em PDF e Slides.
 */

export interface BriefingSections {
  executiveSummary: string;
  strategicContext: {
    audience: string;
    market: string;
    positioning: string;
    objective: string;
  };
  funnelStrategy: {
    type: string;
    architecture: string;
    stages: string;
    conversionPath: string;
  };
  offerAnalysis: {
    promise: string;
    differentiator: string;
    scoringRationale: string;
  };
  copyStrategy: {
    bigIdea: string;
    toneAnalysis: string;
    headlines: string;
    persuasionFramework: string;
  };
  socialStrategy: {
    platformBreakdown: string;
    hookAnalysis: string;
    contentHighlights: string;
    viralPotential: string;
  };
  designDirection: {
    visualIdentity: string;
    colorPsychology: string;
    assetRecommendations: string;
  };
  adsStrategy: {
    channelAllocation: string;
    budgetRationale: string;
    audienceTargeting: string;
    benchmarks: string;
  };
  executionRoadmap: string[];
  riskAnalysis: {
    risks: string[];
    mitigations: string[];
  };
}

export type BriefingFormat = 'pdf' | 'slides';

export interface BriefingRequest {
  format: BriefingFormat;
}
