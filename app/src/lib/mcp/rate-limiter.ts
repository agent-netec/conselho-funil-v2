/**
 * @fileoverview Rate Limiter para MCP Providers
 * @module lib/mcp/rate-limiter
 * @version 1.0.0
 */

import { MCPProvider, RateLimitConfig } from './types';

interface ProviderUsage {
  minuteRequests: number;
  hourRequests: number;
  dayRequests: number;
  lastResetMinute: number;
  lastResetHour: number;
  lastResetDay: number;
}

export class RateLimiter {
  private usage: Map<MCPProvider, ProviderUsage>;
  private configs: Record<MCPProvider, RateLimitConfig>;

  constructor(configs: Record<MCPProvider, RateLimitConfig>) {
    this.configs = configs;
    this.usage = new Map();
  }

  canProceed(provider: MCPProvider): boolean {
    const usage = this.getOrInitializeUsage(provider);
    const config = this.configs[provider];
    const now = Date.now();

    this.checkResets(usage, now);

    if (usage.minuteRequests >= config.requestsPerMinute) return false;
    if (usage.hourRequests >= config.requestsPerHour) return false;
    if (usage.dayRequests >= config.requestsPerDay) return false;

    // Incrementar uso (assumindo que se canProceed for true, a chamada será feita)
    usage.minuteRequests++;
    usage.hourRequests++;
    usage.dayRequests++;

    return true;
  }

  updateConfig(newConfigs: Record<MCPProvider, RateLimitConfig>): void {
    this.configs = { ...this.configs, ...newConfigs };
  }

  private getOrInitializeUsage(provider: MCPProvider): ProviderUsage {
    let usage = this.usage.get(provider);
    if (!usage) {
      const now = Date.now();
      usage = {
        minuteRequests: 0,
        hourRequests: 0,
        dayRequests: 0,
        lastResetMinute: now,
        lastResetHour: now,
        lastResetDay: now
      };
      this.usage.set(provider, usage);
    }
    return usage;
  }

  private checkResets(usage: ProviderUsage, now: number): void {
    const oneMinute = 60000;
    const oneHour = 3600000;
    const oneDay = 86400000;

    if (now - usage.lastResetMinute > oneMinute) {
      usage.minuteRequests = 0;
      usage.lastResetMinute = now;
    }
    if (now - usage.lastResetHour > oneHour) {
      usage.hourRequests = 0;
      usage.lastResetHour = now;
    }
    if (now - usage.lastResetDay > oneDay) {
      usage.dayRequests = 0;
      usage.lastResetDay = now;
    }
  }
}
