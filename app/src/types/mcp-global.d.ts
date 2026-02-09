/**
 * Declaração global para window.mcp
 * Usado pelos MCP adapters para detectar ambiente Cursor (Dev)
 * Sprint 27 — S27-ST-06
 */
declare global {
  interface Window {
    mcp?: {
      callTool: (server: string, tool: string, args: Record<string, unknown>) => Promise<unknown>;
    };
  }
}

export {};
