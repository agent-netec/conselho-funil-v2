/**
 * @fileoverview Tipos para o Context Assembler v2
 * @module types/context
 * @version 1.0.0
 */

import { RetrievedChunk } from './retrieval';
import { DataScope } from './scoped-data';
import { VoiceProfile } from './intelligence';

import { VoiceProfile } from './intelligence';
import { RetrievedChunk } from './retrieval';
import { DataScope } from './scoped-data';

/**
 * Níveis de prioridade para namespaces
 */
export const NAMESPACE_PRIORITY: Record<string, number> = {
  'context_campaign': 100,
  'context_funnel': 90,
  'intelligence': 70,
  'brand': 60,
  'templates': 40,
  'universal': 30,
};

/**
 * Boost por tipo de dado
 */
export const DATA_TYPE_BOOST: Record<string, number> = {
  'market_trend': 1.4,        // NOVO: Máxima prioridade (pulso do mercado)
  'social_mention': 1.2,      // NOVO: Alta prioridade (vocabulário real)
  'market_trend': 1.4,        // NOVO: Máxima prioridade (pulso do mercado)
  'social_mention': 1.2,      // NOVO: Alta prioridade (vocabulário real)
  'icp_insight': 1.3,
  'voice_profile': 1.2,
  'brand_asset': 1.0,
  'cloned_template': 1.1,
  'system_template': 0.9,
  'counselor_knowledge': 1.0,
  'trend': 1.1,
  'default': 1.0,
};

export type TaskType = 
// ...
  | 'create_funnel'
  | 'create_copy'
  | 'create_ads'
  | 'analyze_competitor'
  | 'optimize_campaign'
  | 'general_advice';

export interface CounselorKnowledge {
  counselorId: string;
  counselorName: string;
  expertise: string[];
  relevantChunks: RetrievedChunk[];
  totalChunks: number;
}

export interface BrandContext {
  brandId: string;
  brandName: string;
  industry?: string;
  targetAudience?: string;
  brandKit?: {
    primaryColor?: string;
    secondaryColor?: string;
    tone?: string;
  };
}

export interface ICPInsightsContext {
  pains: string[];
  desires: string[];
  objections: string[];
  vocabulary: string[];
  sourceSummary: string;
  totalInsights: number;
  scopeBreakdown: {
    fromFunnel: number;
    fromBrand: number;
  };
}

export interface TemplateContext {
  id: string;
  name: string;
  type: string;
  relevanceScore: number;
  snippet: string;
  source: 'cloned' | 'system';
  scope: DataScope;
}

export interface TrendContext {
  topic: string;
  relevance: number;
  source: string;
  capturedAt: Date;
}

export interface AssetContext {
  id: string;
  name: string;
  type: string;
  relevantSnippet: string;
  similarity: number;
}

export interface AssemblyMetadata {
  assemblyTimeMs: number;
  namespacesQueried: string[];
  chunksRetrieved: number;
  chunksAfterDedup: number;
  chunksAfterTruncation: number;
  tokenCount: number;
  warnings: string[];
}

export interface ContextAssemblerConfig {
  maxChunksPerNamespace: number;
  deduplicationThreshold: number;
  maxContextTokens: number;
  timeoutMs: number;
  includeDebugMetadata: boolean;
}

export const DEFAULT_CONFIG: ContextAssemblerConfig = {
  maxChunksPerNamespace: 5,
  deduplicationThreshold: 0.85,
  maxContextTokens: 8000,
  timeoutMs: 2000,
  includeDebugMetadata: process.env.NODE_ENV !== 'production',
};

export interface AssembleContextInput {
  brandId: string;
  funnelId?: string;
  campaignId?: string;
  counselorId: string;
  userQuery: string;
  taskType: TaskType;
  configOverride?: Partial<ContextAssemblerConfig>;
}

export interface AssembledContext {
  counselorKnowledge: CounselorKnowledge;
  brandContext: BrandContext;
  icpInsights: ICPInsightsContext;
  voiceProfile: VoiceProfile | null;
  relevantTemplates: TemplateContext[];
  trends: TrendContext[];
  relevantAssets: AssetContext[];
  metadata?: AssemblyMetadata;
}
