import { 
  IMCPAdapter, 
  MCPTask, 
  MCPResult, 
  MCPHealthStatus, 
  MCPProvider 
} from '../types';

/**
 * Adapter para Glimpse (Market Trends)
 * ST-16.3: Glimpse Trends Adapter
 * Suporta roteamento para Relay de Produção.
 */
export class GlimpseAdapter implements IMCPAdapter {
  public readonly provider: MCPProvider = 'glimpse';

  /**
   * Executa tarefas de tendência
   */
  async execute(task: MCPTask): Promise<MCPResult> {
    const startTime = Date.now();

    try {
      const response = await this.callGlimpseMcp('trend_analysis', task.input);

      return {
        success: true,
        provider: this.provider,
        taskId: task.id,
        executionTimeMs: Date.now() - startTime,
        data: response
      };
      
    } catch (error: any) {
      return {
        success: false,
        provider: this.provider,
        taskId: task.id,
        executionTimeMs: Date.now() - startTime,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          retriable: true
        }
      };
    }
  }

  /**
   * Verifica se o adapter está pronto para uso
   */
  async isReady(): Promise<boolean> {
    return true;
  }

  /**
   * Health check do provedor
   */
  async healthCheck(): Promise<MCPHealthStatus> {
    try {
      await this.callGlimpseMcp('health', {});
      return {
        provider: this.provider,
        status: 'healthy',
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

  private async callGlimpseMcp(tool: string, args: any) {
    // 1. Detectar se estamos no ambiente do Cursor (Dev)
    if (typeof window !== 'undefined' && window.mcp) {
      return await window.mcp.callTool('glimpse', tool, args);
    }

    // 2. Produção (App) - Relay
    const response = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'glimpse',
        tool,
        args
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute Glimpse via Production Relay');
    }

    return await response.json();
  }
}
