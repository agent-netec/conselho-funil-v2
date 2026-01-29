/**
 * @fileoverview Tipos para os agentes Scout e Analyst
 * @module types/intelligence-agents
 */

import { IntelligencePlatform, CreateIntelligenceInput } from './intelligence';

// === SCOUT AGENT ===

/**
 * Configuração de fonte de coleta
 */
export interface ScoutSourceConfig {
  platform: IntelligencePlatform;
  enabled: boolean;
  endpoint: string;                     // URL base ou feed URL
  credentials?: {
    type: 'api_key' | 'oauth' | 'none';
    keyRef?: string;                    // Referência a secret
  };
  rateLimit: {
    requestsPerHour: number;
    minIntervalMs: number;
  };
  parser: 'rss' | 'json' | 'html' | 'custom';
}

/**
 * Resultado de coleta do Scout
 */
export interface ScoutCollectionResult {
  brandId: string;
  source: IntelligencePlatform;
  success: boolean;
  itemsCollected: number;
  itemsFiltered: number;               // Duplicatas ou irrelevantes
  items: CreateIntelligenceInput[];
  errors?: ScoutError[];
  collectedAt: number;
  durationMs: number;
}

export interface ScoutError {
  code: 'RATE_LIMITED' | 'AUTH_FAILED' | 'PARSE_ERROR' | 'NETWORK_ERROR' | 'UNKNOWN';
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

// === ANALYST AGENT ===

/**
 * Configuração de processamento do Analyst
 */
export interface AnalystProcessConfig {
  sentimentModel: 'gemini-flash' | 'heuristics' | 'hybrid';
  extractKeywords: boolean;
  maxKeywordsPerDoc: number;
  generateSummary: boolean;
  summaryMaxLength: number;
  batchSize: number;                    // Docs por batch
  maxConcurrent: number;                // Batches paralelos
}

/**
 * Resultado de processamento do Analyst
 */
export interface AnalystProcessResult {
  brandId: string;
  docsProcessed: number;
  docsSkipped: number;
  docsFailed: number;
  averageProcessingTimeMs: number;
  sentimentDistribution: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topKeywords: Array<{ term: string; count: number }>;
  errors?: AnalystError[];
}

export interface AnalystError {
  docId: string;
  code: 'GEMINI_ERROR' | 'PARSE_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN';
  message: string;
}
