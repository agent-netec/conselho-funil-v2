/**
 * @fileoverview Matriz de decisão para seleção de MCP
 * @module lib/mcp/routing-matrix
 * @version 1.0.0
 */

import { MCPProvider, MCPTaskType } from './types';

export interface MCPRoutingConfig {
  primary: MCPProvider;
  fallbacks: MCPProvider[];
  capabilities: string[];
  avgLatencyMs: number;
  costPerRequest: number;
}

/**
 * Matriz de decisão para seleção de MCP
 */
export const ROUTING_MATRIX: Record<MCPTaskType, MCPRoutingConfig> = {
  semantic_search: {
    primary: 'exa',
    fallbacks: ['browser'],        // Browser com Google como fallback
    capabilities: ['semantic', 'filtering', 'neural_search'],
    avgLatencyMs: 2000,
    costPerRequest: 0.001,         // USD
  },
  
  url_to_markdown: {
    primary: 'firecrawl',
    fallbacks: ['browser'],        // Browser extrai HTML + Readability
    capabilities: ['js_rendering', 'clean_extraction', 'structured_data'],
    avgLatencyMs: 5000,
    costPerRequest: 0.01,
  },
  
  screenshot: {
    primary: 'browser',
    fallbacks: [],                 // Sem fallback para screenshots
    capabilities: ['full_page', 'element_capture', 'viewport_config'],
    avgLatencyMs: 3000,
    costPerRequest: 0,             // Gratuito (local)
  },
  
  full_scrape: {
    primary: 'firecrawl',
    fallbacks: ['browser'],
    capabilities: ['multi_page', 'link_following', 'robots_txt'],
    avgLatencyMs: 30000,
    costPerRequest: 0.05,
  },
  
  social_scrape: {
    primary: 'bright_data',        // Futuro
    fallbacks: ['browser'],
    capabilities: ['anti_bot', 'proxy_rotation', 'platform_specific'],
    avgLatencyMs: 10000,
    costPerRequest: 0.02,
  },
  
  link_discovery: {
    primary: 'exa',
    fallbacks: ['browser'],
    capabilities: ['related_content', 'domain_filtering'],
    avgLatencyMs: 2000,
    costPerRequest: 0.001,
  },
  
  trend_analysis: {
    primary: 'glimpse',
    fallbacks: ['exa'],            // Exa pode buscar notícias/blogs de tendências
    capabilities: ['trend_velocity', 'search_volume', 'keyword_correlation'],
    avgLatencyMs: 3000,
    costPerRequest: 0.05,
  },
  
  keyword_volume: {
    primary: 'glimpse',
    fallbacks: ['exa'],
    capabilities: ['search_volume', 'competition_level'],
    avgLatencyMs: 2000,
    costPerRequest: 0.02,
  },
};
