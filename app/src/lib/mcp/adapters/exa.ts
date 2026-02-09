import { 
  IMCPAdapter, 
  MCPTask, 
  MCPResult, 
  MCPProvider, 
  SemanticSearchInput, 
  SemanticSearchResult, 
  MCPHealthStatus
} from '../types';

/**
 * Adapter para o Exa MCP (via Docker ou Relay de Produção)
 */
export class ExaAdapter implements IMCPAdapter {
  provider: MCPProvider = 'exa';

  async execute(task: MCPTask): Promise<MCPResult> {
    if (task.type !== 'semantic_search' && task.type !== 'link_discovery' && task.type !== 'trend_analysis') {
      return {
        success: false,
        provider: this.provider,
        taskId: task.id,
        error: {
          code: 'INVALID_INPUT',
          message: `Exa does not support task type: ${task.type}`,
          retriable: false
        }
      };
    }

    const input = task.input as SemanticSearchInput;
    const startTime = Date.now();

    try {
      const response = await this.callExaMcp(input.query, input.numResults || 10);

      return {
        success: true,
        provider: this.provider,
        taskId: task.id,
        executionTimeMs: Date.now() - startTime,
        data: this.transformResult(response)
      };
    } catch (error: any) {
      return {
        success: false,
        provider: this.provider,
        taskId: task.id,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message || 'Failed to execute Exa search',
          originalError: String(error),
          retriable: true
        }
      };
    }
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
      await this.callExaMcp('health check', 1);
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

  private async callExaMcp(query: string, numResults: number) {
    // 1. Detectar se estamos no ambiente do Cursor (Dev)
    if (typeof window !== 'undefined' && window.mcp) {
      return await window.mcp.callTool('user-MCP_DOCKER', 'web_search_exa', {
        query,
        numResults
      });
    }

    // 2. Produção (App) - Relay
    const response = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'exa',
        tool: 'web_search_exa',
        args: { query, numResults }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute Exa via Production Relay');
    }

    return await response.json();
  }

  private transformResult(raw: any): SemanticSearchResult {
    if (!raw || !raw.results) {
      return { results: [], totalResults: 0 };
    }

    return {
      results: raw.results.map((r: any) => ({
        title: r.title || 'No Title',
        url: r.url,
        snippet: r.text || r.snippet || '',
        score: r.score || 0,
        publishedDate: r.publishedDate
      })),
      totalResults: raw.results.length
    };
  }
}
