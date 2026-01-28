/**
 * @fileoverview MCP Router - Roteador central para MCPs de pesquisa
 * @module lib/mcp/router
 * @version 1.0.0
 */

import { MCPTask, MCPResult, MCPProvider, MCPError, MCPHealthStatus, MCPRouterStatus, RateLimitConfig, MCPRouterConfig, IMCPAdapter, MCPErrorCode } from './types';
import { RateLimiter } from './rate-limiter';
import { CircuitBreaker } from './circuit-breaker';
import { ExaAdapter } from './adapters/exa';
import { FirecrawlAdapter } from './adapters/firecrawl';
import { BrowserAdapter } from './adapters/browser';
import { BrightDataAdapter } from './adapters/bright-data';
import { GlimpseAdapter } from './adapters/glimpse';

/**
 * Router principal para MCPs de pesquisa e coleta
 */
export interface IMCPRouter {
  /**
   * Executa uma tarefa roteando para o MCP apropriado
   * @param task - Tarefa a ser executada
   * @returns Resultado da execução ou erro estruturado
   */
  execute(task: MCPTask): Promise<MCPResult>;

  /**
   * Verifica saúde de um MCP específico
   * @param provider - Provedor a verificar
   */
  healthCheck(provider: MCPProvider): Promise<MCPHealthStatus>;

  /**
   * Retorna status de todos os MCPs
   */
  getStatus(): Promise<MCPRouterStatus>;

  /**
   * Configura rate limits customizados
   */
  configureRateLimits(config: RateLimitConfig): void;
}

/**
 * Implementação do Router
 */
export class MCPRouter implements IMCPRouter {
  private providers: Map<MCPProvider, IMCPAdapter>;
  private rateLimiter: RateLimiter;
  private fallbackChain: Map<MCPProvider, MCPProvider[]>;
  private circuitBreaker: CircuitBreaker;

  constructor(config: MCPRouterConfig) {
    this.providers = new Map();
    this.rateLimiter = new RateLimiter(config.rateLimits);
    this.circuitBreaker = new CircuitBreaker(config.circuitBreaker);
    this.fallbackChain = this.buildFallbackChain(config.fallbacks);
    
    this.initializeProviders();
  }

  async execute(task: MCPTask): Promise<MCPResult> {
    const startTime = Date.now();
    const provider = this.selectProvider(task);
    
    // 1. Verificar circuit breaker
    if (this.circuitBreaker.isOpen(provider)) {
      return this.tryFallback(task, provider, 'CIRCUIT_OPEN');
    }

    // 2. Verificar rate limit
    if (!this.rateLimiter.canProceed(provider)) {
      return this.tryFallback(task, provider, 'RATE_LIMITED');
    }

    // 3. Executar chamada
    try {
      const adapter = this.providers.get(provider);
      if (!adapter) {
        throw new Error(`Provider ${provider} not available`);
      }

      const result = await adapter.execute(task);
      
      // Registrar sucesso
      this.circuitBreaker.recordSuccess(provider);
      this.logExecution(task, provider, result, Date.now() - startTime);
      
      return result;
    } catch (error) {
      // Registrar falha
      this.circuitBreaker.recordFailure(provider);
      
      // Tentar fallback
      return this.tryFallback(task, provider, 'EXECUTION_ERROR', error);
    }
  }

  /**
   * Seleciona o provider mais adequado baseado na tarefa
   */
  private selectProvider(task: MCPTask): MCPProvider {
    // Decision matrix baseada no tipo de tarefa
    switch (task.type) {
      case 'semantic_search':
        return 'exa';
      case 'url_to_markdown':
        return 'firecrawl';
      case 'screenshot':
        return 'browser';
      case 'full_scrape':
        return 'firecrawl';
      case 'social_scrape':
        return 'bright_data';
      case 'trend_analysis':
      case 'keyword_volume':
        return 'glimpse';
      default:
        return 'exa'; // Default para pesquisa
    }
  }

  /**
   * Tenta executar via fallback provider
   */
  private async tryFallback(
    task: MCPTask,
    failedProvider: MCPProvider,
    reason: MCPErrorCode,
    originalError?: unknown
  ): Promise<MCPResult> {
    const fallbacks = this.fallbackChain.get(failedProvider) || [];
    
    for (const fallbackProvider of fallbacks) {
      if (this.circuitBreaker.isOpen(fallbackProvider)) continue;
      if (!this.rateLimiter.canProceed(fallbackProvider)) continue;
      
      try {
        const adapter = this.providers.get(fallbackProvider);
        if (!adapter) continue;

        const result = await adapter.execute(task);
        
        // Marcar que usou fallback
        result.usedFallback = true;
        result.originalProvider = failedProvider;
        
        return result;
      } catch {
        // Continua para próximo fallback
        continue;
      }
    }

    // Nenhum fallback funcionou
    return {
      success: false,
      provider: failedProvider,
      taskId: task.id,
      error: {
        code: reason,
        message: `All providers failed for task ${task.type}`,
        originalError: originalError instanceof Error ? originalError.message : String(originalError),
        retriable: reason === 'RATE_LIMITED',
        retryAfterMs: reason === 'RATE_LIMITED' ? 60000 : undefined,
      },
    };
  }

  private buildFallbackChain(fallbacks: Record<string, MCPProvider[]>): Map<MCPProvider, MCPProvider[]> {
    const chain = new Map<MCPProvider, MCPProvider[]>();
    for (const [provider, list] of Object.entries(fallbacks)) {
      chain.set(provider as MCPProvider, list);
    }
    return chain;
  }

  private initializeProviders() {
    this.providers.set('exa', new ExaAdapter());
    this.providers.set('firecrawl', new FirecrawlAdapter());
    this.providers.set('browser', new BrowserAdapter());
    this.providers.set('bright_data', new BrightDataAdapter());
    this.providers.set('glimpse', new GlimpseAdapter());
  }

  private logExecution(task: MCPTask, provider: MCPProvider, result: MCPResult, durationMs: number) {
    // Implementação do logger
    console.log(`[MCPRouter] Task ${task.id} (${task.type}) executed via ${provider} in ${durationMs}ms. Success: ${result.success}`);
  }

  async healthCheck(provider: MCPProvider): Promise<MCPHealthStatus> {
    const adapter = this.providers.get(provider);
    if (!adapter) {
      return {
        provider,
        status: 'unhealthy',
        lastChecked: Date.now(),
        errorMessage: 'Provider not configured'
      };
    }
    return adapter.healthCheck();
  }

  async getStatus(): Promise<MCPRouterStatus> {
    const statuses = await Promise.all(
      Array.from(this.providers.keys()).map(p => this.healthCheck(p))
    );
    return {
      providers: statuses,
      timestamp: Date.now()
    };
  }

  configureRateLimits(config: RateLimitConfig): void {
    this.rateLimiter.updateConfig(config);
  }
}
