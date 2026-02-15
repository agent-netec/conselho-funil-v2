import {
  IMCPAdapter,
  MCPTask,
  MCPResult,
  MCPProvider,
  UrlToMarkdownInput,
  UrlToMarkdownResult,
  FullScrapeInput,
  FullScrapeResult,
  MCPHealthStatus
} from '../types';

/**
 * Adapter para o Firecrawl MCP (via Docker, API direta ou Relay de Produção)
 */
export class FirecrawlAdapter implements IMCPAdapter {
  provider: MCPProvider = 'firecrawl';

  async execute(task: MCPTask): Promise<MCPResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'url_to_markdown':
          return await this.scrapeUrl(task, startTime);
        case 'full_scrape':
          return await this.crawlSite(task, startTime);
        default:
          return {
            success: false,
            provider: this.provider,
            taskId: task.id,
            error: {
              code: 'INVALID_INPUT',
              message: `Firecrawl does not support task type: ${task.type}`,
              retriable: false
            }
          };
      }
    } catch (error: any) {
      return {
        success: false,
        provider: this.provider,
        taskId: task.id,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Failed to execute Firecrawl operation',
          originalError: String(error),
          retriable: true
        }
      };
    }
  }

  private async scrapeUrl(task: MCPTask, startTime: number): Promise<MCPResult> {
    const input = task.input as UrlToMarkdownInput;

    const response = await this.callFirecrawlMcp('scrape', {
      url: input.url,
      formats: ['markdown'],
      waitFor: input.waitForSelector ? input.timeout : undefined,
    });

    const data: UrlToMarkdownResult = {
      markdown: response.markdown || response.data?.markdown || '',
      title: response.metadata?.title || response.data?.metadata?.title || '',
      links: response.links || response.data?.links || [],
      images: response.images || response.data?.images || [],
      metadata: {
        author: response.metadata?.author || response.data?.metadata?.author,
        publishedDate: response.metadata?.publishedDate || response.data?.metadata?.publishedDate,
        description: response.metadata?.description || response.data?.metadata?.description,
      }
    };

    return {
      success: true,
      provider: this.provider,
      taskId: task.id,
      executionTimeMs: Date.now() - startTime,
      data
    };
  }

  private async crawlSite(task: MCPTask, startTime: number): Promise<MCPResult> {
    const input = task.input as FullScrapeInput;

    const response = await this.callFirecrawlMcp('crawl', {
      url: input.url,
      maxPages: input.maxPages || 10,
      followLinks: input.followLinks ?? true,
    });

    const data: FullScrapeResult = {
      pages: (response.pages || []).map((p: any) => ({
        url: p.url,
        markdown: p.markdown,
        title: p.title
      })),
      totalPages: response.pages?.length || 0
    };

    return {
      success: true,
      provider: this.provider,
      taskId: task.id,
      executionTimeMs: Date.now() - startTime,
      data
    };
  }

  async isReady(): Promise<boolean> {
    try {
      const health = await this.healthCheck();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }

  async healthCheck(): Promise<MCPHealthStatus> {
    const start = Date.now();
    try {
      await this.callFirecrawlMcp('health', {});
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

  private async callFirecrawlMcp(tool: string, args: any) {
    // 1. Detectar se estamos no ambiente do Cursor (Dev)
    if (typeof window !== 'undefined' && window.mcp) {
      return await window.mcp.callTool('firecrawl', tool, args);
    }

    // 2. Server-side — chamar Firecrawl API diretamente (sem relay HTTP)
    if (typeof window === 'undefined') {
      const apiKey = process.env.FIRECRAWL_API_KEY;
      const baseUrl = process.env.FIRECRAWL_WORKER_URL || 'https://api.firecrawl.dev/v1';
      if (!apiKey) {
        throw new Error('FIRECRAWL_API_KEY not configured');
      }
      const endpoint = tool === 'crawl' ? `${baseUrl}/crawl` : `${baseUrl}/scrape`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(args),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Firecrawl API error ${response.status}: ${errorText}`);
      }
      return await response.json();
    }

    // 3. Client-side (Produção) — Relay
    const response = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'firecrawl',
        tool,
        args
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute Firecrawl via Production Relay');
    }

    return await response.json();
  }
}
