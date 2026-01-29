/**
 * @fileoverview Logger estruturado para execuções do MCP Router
 * @module lib/mcp/logger
 * @version 1.0.0
 */

import { MCPProvider, MCPTaskType, MCPErrorCode } from './types';

export interface MCPLogEntry {
  timestamp: number;
  taskId: string;
  taskType: MCPTaskType;
  provider: MCPProvider;
  brandId: string;
  
  status: 'started' | 'completed' | 'failed' | 'fallback';
  durationMs?: number;
  
  // Métricas
  inputSize?: number;
  outputSize?: number;
  tokensUsed?: number;
  
  // Erro
  errorCode?: MCPErrorCode;
  errorMessage?: string;
  
  // Fallback
  usedFallback?: boolean;
  originalProvider?: MCPProvider;
}

export class MCPLogger {
  log(entry: MCPLogEntry): void {
    // Em um ambiente real, isso enviaria para um serviço de logs (ex: Datadog, CloudWatch, ou Firestore)
    console.log(`[MCP Router] \${new Date(entry.timestamp).toISOString()} | \${entry.taskId} | \${entry.status.toUpperCase()} | \${entry.provider} | \${entry.durationMs || 0}ms`);
    
    if (entry.status === 'failed' || entry.status === 'fallback') {
      console.error(`[MCP Router Error] \${entry.errorCode}: \${entry.errorMessage}`);
    }
  }
}
