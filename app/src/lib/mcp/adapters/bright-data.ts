import { 
  IMCPAdapter, 
  MCPTask, 
  MCPResult, 
  MCPProvider, 
  MCPHealthStatus,
  UrlToMarkdownResult,
  SocialScrapeResult
} from '../types';
import { stripPII } from '../../intelligence/pii-stripper';

/**
 * Adapter para a Bright Data via Remote MCP (SSE)
 * Este adapter utiliza o servidor MCP da Bright Data para realizar
 * scraping de redes sociais e conversão de páginas para Markdown.
 */
export class BrightDataAdapter implements IMCPAdapter {
  provider: MCPProvider = 'bright_data';

  // Trava de budget por marca (simulada - em prod viria do Firestore/Config)
  private brandBudgets: Map<string, number> = new Map();
  private readonly COST_PER_SCRAPE = 0.05; // USD

  /**
   * Executa uma tarefa usando o MCP da Bright Data
   */
  async execute(task: MCPTask): Promise<MCPResult> {
    const startTime = Date.now();
    const { brandId } = task;

    try {
      // 1. Verificar trava de segurança de budget por marca
      if (!this.checkBudget(brandId)) {
        throw new Error(`Budget exceeded for brand: ${brandId}`);
      }

      // 2. Validar tipo de tarefa
      if (task.type !== 'social_scrape' && task.type !== 'url_to_markdown') {
        throw new Error(`Bright Data adapter does not support task type: ${task.type}`);
      }

      let result;

      // 3. Roteamento interno de ferramentas do MCP Bright Data
      if (task.type === 'social_scrape') {
        // Para social_scrape, usamos a ferramenta específica do MCP
        result = await this.callBrightDataMcp('scrape_as_markdown', {
          url: (task.input as any).url,
        });
      } else {
        result = await this.callBrightDataMcp('scrape_as_markdown', {
          url: (task.input as any).url
        });
      }

      // 4. Aplicar PII Stripping (ST-16.2)
      const cleanedMarkdown = stripPII(result.markdown || result.content || '');

      // 5. Debitar do budget (simulado)
      this.deductBudget(brandId);

      return {
        success: true,
        provider: this.provider,
        taskId: task.id,
        executionTimeMs: Date.now() - startTime,
        data: this.transformResult({ ...result, markdown: cleanedMarkdown, url: (task.input as any).url }, task.type)
      };

    } catch (error: any) {
      return {
        success: false,
        provider: this.provider,
        taskId: task.id,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Failed to execute Bright Data task',
          originalError: String(error),
          retriable: true
        }
      };
    }
  }

  /**
   * Verifica se o adapter está pronto
   */
  async isReady(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  /**
   * Realiza health check do servidor remoto
   */
  async healthCheck(): Promise<MCPHealthStatus> {
    const start = Date.now();
    try {
      // Teste de conectividade simples usando uma URL neutra
      await this.callBrightDataMcp('scrape_as_markdown', { url: 'https://example.com' });
      
      return {
        provider: this.provider,
        status: 'healthy',
        latencyMs: Date.now() - start,
        lastChecked: Date.now()
      };
    } catch (error: any) {
      return {
        provider: this.provider,
        status: 'unhealthy',
        lastChecked: Date.now(),
        errorMessage: error.message
      };
    }
  }

  /**
   * Ponte para chamada do MCP Server da Bright Data
   * Nota: Em produção, isso utiliza o endpoint SSE configurado.
   */
  private async callBrightDataMcp(tool: string, args: any): Promise<any> {
    // 1. Detectar se estamos no ambiente do Cursor (Dev)
    if (typeof window !== 'undefined' && window.mcp) {
      return await window.mcp.callTool('BrightData', tool, args);
    }

    // 2. Se não estiver no Cursor, estamos em Produção (App)
    // Roteamos para nossa própria API de Relay
    const response = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'bright_data',
        tool,
        args
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute MCP via Production Relay');
    }

    return await response.json();
  }

  /**
   * Verifica se a marca ainda tem budget para scraping
   */
  private checkBudget(brandId: string): boolean {
    const current = this.brandBudgets.get(brandId) || 10.0; // Default $10
    return current >= this.COST_PER_SCRAPE;
  }

  /**
   * Deduz o custo da operação do budget da marca
   */
  private deductBudget(brandId: string) {
    const current = this.brandBudgets.get(brandId) || 10.0;
    this.brandBudgets.set(brandId, current - this.COST_PER_SCRAPE);
  }

  /**
   * Transforma o resultado bruto do MCP no formato esperado pela aplicação
   */
  private transformResult(raw: any, type: string): UrlToMarkdownResult | SocialScrapeResult {
    if (type === 'social_scrape') {
      return {
        content: raw.markdown || raw.content || '',
        platform: this.detectPlatform(raw.url || ''),
        collectedAt: new Date().toISOString(),
        metadata: raw.metadata || {}
      } as SocialScrapeResult;
    }

    return {
      markdown: raw.markdown || raw.content || '',
      title: raw.title || '',
      metadata: raw.metadata || {}
    };
  }

  /**
   * Detecta a plataforma baseada na URL
   */
  private detectPlatform(url: string): string {
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
    if (url.includes('tiktok.com')) return 'tiktok';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('youtube.com')) return 'youtube';
    return 'custom';
  }
}
