/**
 * @fileoverview Tipos auxiliares para o MCP Router
 * @module lib/mcp/types
 * @version 1.0.0
 */

/**
 * Provedores de MCP suportados
 */
export type MCPProvider = 'exa' | 'firecrawl' | 'browser' | 'bright_data' | 'glimpse';

/**
 * Tipos de tarefa que o Router processa
 */
export type MCPTaskType = 
  | 'semantic_search'   // Busca semântica na web
  | 'url_to_markdown'   // Converter URL em Markdown limpo
  | 'screenshot'        // Capturar screenshot de página
  | 'full_scrape'       // Scraping completo de site
  | 'social_scrape'     // Scraping de redes sociais
  | 'trend_analysis'    // NOVO: Análise de tendências (Glimpse)
  | 'keyword_volume'    // NOVO: Volume de busca (Glimpse)
  | 'link_discovery';   // Descobrir links relacionados

/**
 * Tarefa a ser executada pelo Router
 */
export interface MCPTask {
  id: string;                       // UUID da tarefa
  type: MCPTaskType;                // Tipo de tarefa
  brandId: string;                  // Isolamento multi-tenant
  
  // Input baseado no tipo
  input: MCPTaskInput;
  
  // Configurações opcionais
  options?: MCPTaskOptions;
}

export type MCPTaskInput = 
  | SemanticSearchInput
  | UrlToMarkdownInput
  | ScreenshotInput
  | FullScrapeInput;

export interface SemanticSearchInput {
  query: string;                    // Query de busca
  numResults?: number;              // Default: 10, Max: 50
  startPublishDate?: string;        // ISO date - filtro temporal
  endPublishDate?: string;
  includeDomains?: string[];        // Domínios a incluir
  excludeDomains?: string[];        // Domínios a excluir
  category?: string;                // Ex: 'news', 'company', 'research'
}

export interface UrlToMarkdownInput {
  url: string;                      // URL a converter
  extractLinks?: boolean;           // Extrair links encontrados
  extractImages?: boolean;          // Extrair URLs de imagens
  waitForSelector?: string;         // Esperar elemento (JS-rendered pages)
  timeout?: number;                 // Timeout em ms (default: 30000)
}

export interface ScreenshotInput {
  url: string;                      // URL a capturar
  fullPage?: boolean;               // Screenshot da página inteira
  selector?: string;                // Capturar elemento específico
  viewport?: { width: number; height: number };
}

export interface FullScrapeInput {
  url: string;                      // URL raiz
  maxPages?: number;                // Max páginas a seguir (default: 10)
  followLinks?: boolean;            // Seguir links internos
  respectRobotsTxt?: boolean;       // Respeitar robots.txt (default: true)
}

export interface MCPTaskOptions {
  timeout?: number;                 // Timeout da tarefa (ms)
  priority?: 'high' | 'normal' | 'low';
  retryAttempts?: number;           // Default: 2
  forceProvider?: MCPProvider;      // Forçar provedor específico (bypass routing)
}

/**
 * Resultado da execução
 */
export interface MCPResult {
  success: boolean;
  provider: MCPProvider;
  taskId: string;
  
  // Dados retornados (varia por tipo de tarefa)
  data?: MCPResultData;
  
  // Metadados de execução
  executionTimeMs?: number;
  tokensUsed?: number;              // Para MCPs que usam LLM
  
  // Fallback info
  usedFallback?: boolean;
  originalProvider?: MCPProvider;
  
  // Erro (se success === false)
  error?: MCPError;
}

export interface SocialScrapeResult {
  content: string;
  platform: string;
  collectedAt: string;
  metadata?: any;
}

export type MCPResultData = 
  | SemanticSearchResult
  | UrlToMarkdownResult
  | ScreenshotResult
  | FullScrapeResult
  | SocialScrapeResult;

export interface SemanticSearchResult {
  results: SearchResult[];
  totalResults: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score: number;                    // Relevância (0-1)
  highlights?: string[];            // Trechos destacados
}

export interface UrlToMarkdownResult {
  markdown: string;
  title: string;
  links?: string[];
  images?: string[];
  metadata?: {
    author?: string;
    publishedDate?: string;
    description?: string;
  };
}

export interface ScreenshotResult {
  imageBase64: string;
  mimeType: 'image/png' | 'image/jpeg';
  viewport: { width: number; height: number };
}

export interface FullScrapeResult {
  pages: Array<{
    url: string;
    markdown: string;
    title: string;
  }>;
  totalPages: number;
}

/**
 * Erro estruturado do MCP
 */
export interface MCPError {
  code: MCPErrorCode;
  message: string;
  originalError?: string;
  retriable: boolean;
  retryAfterMs?: number;
}

export type MCPErrorCode = 
  | 'RATE_LIMITED'
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'PARSE_ERROR'
  | 'CIRCUIT_OPEN'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'INVALID_INPUT'
  | 'EXECUTION_ERROR'
  | 'UNKNOWN';

export interface MCPHealthStatus {
  provider: MCPProvider;
  status: 'healthy' | 'degraded' | 'unhealthy';
  latencyMs?: number;
  lastChecked: number;
  errorMessage?: string;
}

export interface MCPRouterStatus {
  providers: MCPHealthStatus[];
  timestamp: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export interface MCPRouterConfig {
  rateLimits: Record<MCPProvider, RateLimitConfig>;
  circuitBreaker: Record<MCPProvider, CircuitBreakerConfig>;
  fallbacks: Record<MCPProvider, MCPProvider[]>;
}

export interface IMCPAdapter {
  provider: MCPProvider;
  execute(task: MCPTask): Promise<MCPResult>;
  isReady(): Promise<boolean>;
  healthCheck(): Promise<MCPHealthStatus>;
}
