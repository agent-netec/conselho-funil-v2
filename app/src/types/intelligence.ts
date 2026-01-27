/**
 * @fileoverview Tipos centralizados para o módulo Intelligence Wing
 * @module types/intelligence
 * @version 1.1.0
 */

import { Timestamp } from 'firebase/firestore';

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
  fetchedVia: 'rss' | 'api' | 'scraping';
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
  
  // === TIMESTAMPS ===
  collectedAt: Timestamp;
  processedAt?: Timestamp;
  archivedAt?: Timestamp;
  expiresAt: Timestamp;                 // Para TTL/cleanup
  
  // === SISTEMA ===
  pineconeId?: string;                  // Referência ao vetor
  version: number;                      // Versionamento otimista
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
