/**
 * @fileoverview Configurações padrão para o MCP Router
 * @module config/mcp.config
 * @version 1.0.0
 */

import { MCPRouterConfig, MCPProvider } from '../lib/mcp/types';

export const DEFAULT_MCP_CONFIG: MCPRouterConfig = {
  rateLimits: {
    exa: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    },
    firecrawl: {
      requestsPerMinute: 20,
      requestsPerHour: 500,
      requestsPerDay: 5000,
    },
    browser: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
      requestsPerDay: 50000,
    },
    bright_data: {
      requestsPerMinute: 10,
      requestsPerHour: 200,
      requestsPerDay: 2000,
    },
    glimpse: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
    },
  },
  circuitBreaker: {
    exa: {
      failureThreshold: 5,
      successThreshold: 3,
      timeout: 60000,
    },
    firecrawl: {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 120000,
    },
    browser: {
      failureThreshold: 10,
      successThreshold: 3,
      timeout: 30000,
    },
    bright_data: {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 300000,
    },
    glimpse: {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 120000,
    },
  },
  fallbacks: {
    exa: ['browser'],
    firecrawl: ['browser'],
    browser: [],
    bright_data: ['browser'],
    glimpse: ['exa'],
  },
};
