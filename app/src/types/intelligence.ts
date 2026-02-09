/**
 * @fileoverview Tipos centralizados para o módulo Intelligence Wing
 * @module types/intelligence
 * @version 1.1.0
 */

import { Timestamp } from 'firebase/firestore';

import { ScopedData, DataScope } from './scoped-data';

/**
 * Insight do ICP capturado pela Ala de Inteligência
 * Collection: brands/{brandId}/icp_insights/{insightId}
 */
export interface ICPInsight extends ScopedData {
  id: string;
  
  // === SCOPE (herdado de ScopedData) ===
  scope: DataScope & {
    level: 'brand' | 'funnel';  // ICP pode ser geral (marca) ou específico (funil)
  };
  inheritToChildren: boolean;   // Se true, funis herdam este insight
  
  // === CLASSIFICAÇÃO ===
  category: ICPInsightCategory;
  
  // === CONTEÚDO ===
  content: string;              // O insight em si
  frequency: number;            // Quantas vezes foi mencionado
  sentiment: number;            // -1.0 a 1.0
  
  // === RASTREABILIDADE ===
  sources: ICPSource[];
  
  // === GOVERNANÇA ===
  isApprovedForAI: boolean;     // Gate para uso no RAG
  relevanceScore: number;       // 0.0 a 1.0
  approvedBy?: string;          // userId ou 'auto' se auto-approved
  approvedAt?: Timestamp;
  
  // === TIMESTAMPS ===
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  expiresAt?: Timestamp;        // TTL opcional
  
  // === PINECONE ===
  pineconeId?: string;          // Referência ao vetor
}

export type ICPInsightCategory = 
  | 'pain'        // Dor do cliente
  | 'desire'      // Desejo do cliente
  | 'objection'   // Objeção comum
  | 'vocabulary'  // Palavra/frase que o público usa
  | 'trend'       // Tendência identificada
  | 'social_proof'; // NOVO: Prova social extraída de menções

/**
 * Menção social capturada (Instagram, Reddit, TikTok, etc.)
 * Collection: brands/{brandId}/social_mentions/{mentionId}
 */
export interface SocialMention extends ScopedData {
  id: string;
  platform: 'instagram' | 'reddit' | 'tiktok' | 'twitter' | 'youtube';
  content: string;
  author: {
    id: string;
    handle: string;
    bio?: string;
    isVerified?: boolean;
  };
  sentiment: number; // -1.0 a 1.0
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    views?: number;
  };
  url: string;
  collectedAt: Timestamp;
  isApprovedForAI: boolean;
  pineconeId?: string;
}

/**
 * Tendência de mercado capturada (Glimpse/Google Trends)
 * Collection: brands/{brandId}/market_trends/{trendId}
 */
export interface MarketTrend extends ScopedData {
  id: string;
  topic: string;
  growthPercentage: number; // Ex: 500 (para 500%)
  searchVolume: 'high' | 'medium' | 'low';
  absoluteVolume?: number; // Se disponível via Glimpse
  relatedKeywords: string[];
  platformSource: 'glimpse' | 'google_trends' | 'exa';
  region: string; // Ex: 'BR', 'US'
  timeRange: string; // Ex: '7d', '30d', '12m'
  capturedAt: Timestamp;
  expiresAt: Timestamp; // TTL curto para trends
  pineconeId?: string;
}

export interface ICPSource {
  platform: string;             // 'reddit', 'twitter', 'google_trends', etc.
  url: string;
  collectedAt: Timestamp;
  snippet?: string;             // Trecho original
}

export type IntelligenceType = 'mention' | 'trend' | 'competitor' | 'news' | 'keyword';


export type IntelligenceStatus = 
  | 'raw'        // Coletado, aguardando processamento
  | 'processing' // Em análise pelo Analyst Agent
  | 'processed'  // Análise completa
  | 'archived'   // Expirado, mantido como resumo
  | 'error';     // Falha no processamento

export type IntelligencePlatform = 
  | 'google_news' 
  | 'rss_feed' 
  | 'twitter' 
  | 'instagram' 
  | 'linkedin' 
  | 'reddit' 
  | 'google_autocomplete' // NOVO: Para Keyword Miner
  | 'custom';

export interface IntelligenceSource {
  platform: IntelligencePlatform;
  url?: string;
  author?: string;
  authorUrl?: string;
  fetchedVia: 'rss' | 'api' | 'scraping' | 'text_input';
}

export type SearchIntent = 'informational' | 'navigational' | 'commercial' | 'transactional';

export interface KeywordMetrics {
  volume: number;
  difficulty: number; // 0 a 100
  cpc?: number;
  opportunityScore: number; // KOS (0 a 100)
  trend?: number; // % de crescimento
}

export interface KeywordIntelligence {
  term: string;
  intent: SearchIntent;
  metrics: KeywordMetrics;
  relatedTerms: string[];
  suggestedBy: 'scout' | 'analyst' | 'manual';
}

export interface IntelligenceContent {
  title?: string;
  text: string;
  textHash: string;                     // Para deduplicação
  language?: string;                    // ISO 639-1 (pt, en, es)
  originalUrl?: string;
  imageUrl?: string;
  publishedAt?: Timestamp;
  keywordData?: KeywordIntelligence;    // NOVO: Para documentos do tipo 'keyword'
}

export interface IntelligenceAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;               // -1.0 a 1.0
  sentimentConfidence: number;          // 0.0 a 1.0
  keywords: string[];                   // Extraídos do conteúdo
  matchedBrandKeywords: string[];       // Keywords da marca encontradas
  relevanceScore: number;               // 0.0 a 1.0
  summary?: string;                     // Resumo gerado (opcional)
  analyzedBy: 'gemini-flash' | 'heuristics' | 'hybrid';
  analyzedAt: Timestamp;
}

export interface IntelligenceMetrics {
  engagement?: number;
  likes?: number;
  shares?: number;
  comments?: number;
  reach?: number;
  impressions?: number;
}

export interface UXAsset {
  text: string;
  type: 'headline' | 'cta' | 'hook' | 'visual';
  location?: string;
  relevanceScore: number;
  copyAnalysis?: {
    angle: string;
    psychologicalTrigger: string[];
  };
}

export interface UXIntelligence {
  headlines: UXAsset[];
  ctas: UXAsset[];
  hooks: UXAsset[];
  visualElements?: UXAsset[];
  funnelStructure?: string;
}

/**
 * Perfil de voz/tom de marca ou funil
 * Collection: brands/{brandId}/voice_profiles
 * Escopo: brand-level (default) ou funnel-level (override)
 */
export interface VoiceProfile extends ScopedData {
  id: string;
  brandId: string;

  /** Se true, é o perfil default da brand */
  isDefault: boolean;

  /** Tom de voz configurado */
  tone: string;

  /** Estilo de escrita */
  style?: string;

  /** Personalidade da marca */
  personality?: string;

  /** Palavras/frases que a marca usa */
  vocabulary?: string[];

  /** Palavras/frases proibidas */
  forbiddenTerms?: string[];

  /** Exemplos de texto na voz da marca */
  examples?: string[];

  /** Timestamps */
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Documento de inteligência armazenado no Firestore
 * Collection: brands/{brandId}/intelligence
 */
export interface IntelligenceDocument {
  // === IDENTIFICAÇÃO ===
  id: string;                           // Auto-generated ou synced com Pinecone
  brandId: string;                      // Redundante para queries diretas
  
  // === CLASSIFICAÇÃO ===
  type: IntelligenceType;
  status: IntelligenceStatus;
  
  // === FONTE ===
  source: IntelligenceSource;
  
  // === CONTEÚDO ===
  content: IntelligenceContent;
  
  // === ANÁLISE ===
  analysis?: IntelligenceAnalysis;
  
  // === MÉTRICAS ===
  metrics?: IntelligenceMetrics;
  
  // === UX INTELLIGENCE (Sprint 24) ===
  uxIntelligence?: UXIntelligence;
  
  // === TIMESTAMPS ===
  collectedAt: Timestamp;
  processedAt?: Timestamp;
  archivedAt?: Timestamp;
  expiresAt: Timestamp;                 // Para TTL/cleanup
  
  // === SISTEMA ===
  pineconeId?: string;                  // Referência ao vetor
  version: number;                      // Versionamento otimista
}

/**
 * Asset unificado de inteligência — normaliza dados de 3 collections
 * Sprint 29: S29-FT-01 (DT-05, DT-10) — multi-query, NÃO collection nova
 * Fontes: audience_scans, autopsies, offers
 */
export interface IntelligenceAsset {
  id: string;
  brandId: string;
  type: 'audience_scan' | 'autopsy' | 'offer' | 'spy_dossier';
  name: string;
  summary: string;
  status: 'ready' | 'processing' | 'error';
  score?: number;
  createdAt: Timestamp;
  sourceId: string;
  metadata?: Record<string, unknown>;
}

export type KeywordType = 'brand' | 'competitor' | 'industry' | 'product';
export type KeywordPriority = 'high' | 'medium' | 'low';

export interface BrandKeyword {
  term: string;                         // Max 50 chars
  type: KeywordType;
  priority: KeywordPriority;
  synonyms?: string[];                  // Variações a incluir
  active: boolean;
}

/**
 * Configuração de keywords para monitoramento
 * Collection: brands/{brandId}/intelligence/_config/keywords
 */
export interface BrandKeywordsConfig {
  brandId: string;
  
  // === KEYWORDS DE MONITORAMENTO ===
  keywords: BrandKeyword[];             // Max 20
  excludeTerms: string[];               // Termos a ignorar
  
  // === CONFIGURAÇÃO DE COLETA ===
  settings: {
    pollingIntervalMinutes: number;     // Default: 15, Min: 5, Max: 60
    maxResultsPerSource: number;        // Default: 50
    enabledSources: IntelligencePlatform[];
    language?: string;                  // Filtro de idioma
  };
  
  // === METADATA ===
  updatedAt: Timestamp;
  updatedBy: string;                    // userId
  version: number;
}

/**
 * @intentional-stub S35 — placeholder de busca semântica sem consumer ativo no fluxo atual.
 * @todo Implementar quando a busca semântica for ativada.
 * @see _netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md
 */
export interface SemanticSearchResult {
  results: Array<{
    title: string;
    url: string;
    score: number;
    highlights: string[];
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * @intentional-stub S35 — placeholder de fonte de monitoramento sem consumer ativo.
 * @todo Implementar quando a configuração avançada de fontes for ativada.
 * @see _netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md
 */
export interface MonitoringSource {
  id: string;
  displayName: string;
  platform: string;
  type: string;
  status: 'active' | 'paused' | 'error';
  relevanceScore?: number;
  lastError?: string;
  scope?: {
    level: 'brand' | 'funnel';
    brandId?: string;
    funnelId?: string;
  };
  [key: string]: unknown;
}

// === INTERFACES DE OPERAÇÃO ===

/**
 * Input para criação de documento de inteligência
 */
export interface CreateIntelligenceInput {
  brandId: string;
  type: IntelligenceType;
  source: IntelligenceSource;
  content: Omit<IntelligenceContent, 'textHash'>;
  metrics?: IntelligenceMetrics;
}

/**
 * Filtros para query de inteligência
 */
export interface IntelligenceQueryFilter {
  brandId: string;
  types?: IntelligenceType[];
  status?: IntelligenceStatus[];
  platforms?: IntelligencePlatform[];
  sentiment?: ('positive' | 'negative' | 'neutral')[];
  dateRange?: {
    start: Timestamp;
    end: Timestamp;
  };
  keywords?: string[];
  textHash?: string; // Para deduplicação
  minRelevance?: number;
  limit?: number;
  orderBy?: 'collectedAt' | 'relevanceScore' | 'sentimentScore';
  orderDirection?: 'asc' | 'desc';
}

/**
 * Resultado de query paginada
 */
export interface IntelligenceQueryResult {
  documents: IntelligenceDocument[];
  total: number;
  hasMore: boolean;
  lastDoc?: string;
}

/**
 * Status agregado de inteligência por marca
 */
export interface IntelligenceStats {
  brandId: string;
  totalMentions: number;
  byType: Record<IntelligenceType, number>;
  bySentiment: {
    positive: number;
    negative: number;
    neutral: number;
  };
  averageSentimentScore: number;
  topKeywords: Array<{ term: string; count: number }>;
  lastCollectedAt?: Timestamp;
  lastProcessedAt?: Timestamp;
}
