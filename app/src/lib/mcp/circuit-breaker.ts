/**
 * @fileoverview Circuit Breaker para MCP Providers
 * @module lib/mcp/circuit-breaker
 * @version 1.0.0
 */

import { MCPProvider, CircuitBreakerConfig } from './types';

type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface ProviderState {
  state: CircuitState;
  failures: number;
  lastFailureTime?: number;
  successes: number;
}

export class CircuitBreaker {
  private states: Map<MCPProvider, ProviderState>;
  private configs: Record<MCPProvider, CircuitBreakerConfig>;

  constructor(configs: Record<MCPProvider, CircuitBreakerConfig>) {
    this.configs = configs;
    this.states = new Map();
  }

  isOpen(provider: MCPProvider): boolean {
    const state = this.getOrInitializeState(provider);
    
    if (state.state === 'OPEN') {
      const config = this.configs[provider];
      const now = Date.now();
      
      if (state.lastFailureTime && now - state.lastFailureTime > config.timeout) {
        state.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    
    return false;
  }

  recordSuccess(provider: MCPProvider): void {
    const state = this.getOrInitializeState(provider);
    const config = this.configs[provider];

    if (state.state === 'HALF_OPEN') {
      state.successes++;
      if (state.successes >= config.successThreshold) {
        state.state = 'CLOSED';
        state.failures = 0;
        state.successes = 0;
      }
    } else if (state.state === 'CLOSED') {
      state.failures = 0;
    }
  }

  recordFailure(provider: MCPProvider): void {
    const state = this.getOrInitializeState(provider);
    const config = this.configs[provider];

    state.failures++;
    state.lastFailureTime = Date.now();

    if (state.state === 'HALF_OPEN' || state.failures >= config.failureThreshold) {
      state.state = 'OPEN';
      state.successes = 0;
    }
  }

  private getOrInitializeState(provider: MCPProvider): ProviderState {
    let state = this.states.get(provider);
    if (!state) {
      state = {
        state: 'CLOSED',
        failures: 0,
        successes: 0
      };
      this.states.set(provider, state);
    }
    return state;
  }
}
