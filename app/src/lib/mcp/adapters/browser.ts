import { 
  IMCPAdapter, 
  MCPTask, 
  MCPResult, 
  MCPProvider, 
  ScreenshotInput, 
  ScreenshotResult,
  UrlToMarkdownInput,
  UrlToMarkdownResult,
  SemanticSearchInput,
  SemanticSearchResult,
  MCPHealthStatus
} from '../types';

/**
 * Adapter para o Browser MCP (Fallback/Screenshots)
 * Em produção, este adapter deve rotear para um serviço de Playwright/Puppeteer.
 */
export class BrowserAdapter implements IMCPAdapter {
  provider: MCPProvider = 'browser';

  async execute(task: MCPTask): Promise<MCPResult> {
    const startTime = Date.now();

    try {
      switch (task.type) {
        case 'screenshot':
          return await this.takeScreenshot(task, startTime);
        case 'url_to_markdown':
          return await this.extractContent(task, startTime);
        case 'semantic_search':
          return await this.googleSearch(task, startTime);
        default:
          return {
            success: false,
            provider: this.provider,
            taskId: task.id,
            error: {
              code: 'INVALID_INPUT',
              message: `Browser does not support task type: ${task.type}`,
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
          message: error.message || 'Failed to execute Browser operation',
          originalError: String(error),
          retriable: true
        }
      };
    }
  }

  private async takeScreenshot(task: MCPTask, startTime: number): Promise<MCPResult> {
    const input = task.input as ScreenshotInput;
    
    await this.callBrowserMcp('browser_navigate', { url: input.url });
    
    const screenshot = await this.callBrowserMcp('browser_take_screenshot', {
      fullPage: input.fullPage || false,
    });

    const data: ScreenshotResult = {
      imageBase64: screenshot.data,
      mimeType: 'image/png',
      viewport: input.viewport || { width: 1280, height: 720 }
    };

    return {
      success: true,
      provider: this.provider,
      taskId: task.id,
      executionTimeMs: Date.now() - startTime,
      data
    };
  }

  private async extractContent(task: MCPTask, startTime: number): Promise<MCPResult> {
    const input = task.input as UrlToMarkdownInput;
    
    await this.callBrowserMcp('browser_navigate', { url: input.url });
    
    const snapshot = await this.callBrowserMcp('browser_snapshot', {});

    const data: UrlToMarkdownResult = {
      markdown: snapshot.markdown || '',
      title: snapshot.title || '',
      links: [],
      metadata: {
        description: snapshot.description
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

  private async googleSearch(task: MCPTask, startTime: number): Promise<MCPResult> {
    const input = task.input as SemanticSearchInput;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(input.query)}`;
    
    await this.callBrowserMcp('browser_navigate', { url: searchUrl });
    
    const snapshot = await this.callBrowserMcp('browser_snapshot', {});

    const results: any[] = []; // Parse logic omitted

    const data: SemanticSearchResult = {
      results: results.slice(0, input.numResults || 10),
      totalResults: results.length
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
    return true;
  }

  async healthCheck(): Promise<MCPHealthStatus> {
    return {
      provider: this.provider,
      status: 'healthy',
      lastChecked: Date.now()
    };
  }

  private async callBrowserMcp(tool: string, args: any) {
    // 1. Detectar se estamos no ambiente do Cursor (Dev)
    if (typeof window !== 'undefined' && window.mcp) {
      return await window.mcp.callTool('cursor-ide-browser', tool, args);
    }

    // 2. Produção (App) - Relay para serviço de Playwright/Puppeteer
    const response = await fetch('/api/mcp/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'browser',
        tool,
        args
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to execute Browser via Production Relay');
    }

    return await response.json();
  }
}
