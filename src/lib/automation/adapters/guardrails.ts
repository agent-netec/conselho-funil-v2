import { IAdsAdapter, AdsActionResponse } from './types';

/**
 * GuardrailManager: Gerencia Circuit Breaker e Rate Limiting para as APIs de Ads.
 * ST-27.5: Implementação de segurança para evitar instabilidade e excesso de chamadas.
 */
export class GuardrailManager {
  private static failureCount: Map<string, number> = new Map();
  private static lastActionTimestamp: Map<string, number> = new Map();
  private static MAINTENANCE_MODE: boolean = false;

  private static CIRCUIT_BREAKER_THRESHOLD = 3;
  private static RATE_LIMIT_HOURS = 6;

  /**
   * Verifica se uma ação pode ser executada respeitando os guardrails.
   */
  static canExecute(entityId: string, actionType: string): { can: boolean; reason?: string } {
    if (this.MAINTENANCE_MODE) {
      return { can: false, reason: 'CIRCUIT_BREAKER_OPEN: System in maintenance mode due to consecutive failures.' };
    }

    // Rate Limiting: 1 alteração a cada 6 horas por entidade (apenas para escrita)
    if (actionType === 'adjust_budget' || actionType === 'pause') {
      const lastAction = this.lastActionTimestamp.get(entityId) || 0;
      const hoursSinceLastAction = (Date.now() - lastAction) / (1000 * 60 * 60);

      if (hoursSinceLastAction < this.RATE_LIMIT_HOURS) {
        return { 
          can: false, 
          reason: `RATE_LIMIT_EXCEEDED: Last action for ${entityId} was ${hoursSinceLastAction.toFixed(2)}h ago. Limit is ${this.RATE_LIMIT_HOURS}h.` 
        };
      }
    }

    return { can: true };
  }

  /**
   * Registra o resultado de uma ação para atualizar os guardrails.
   */
  static recordResult(entityId: string, success: boolean) {
    if (success) {
      this.failureCount.set('global', 0); // Reset global failure count on success
      this.lastActionTimestamp.set(entityId, Date.now());
    } else {
      const currentFailures = (this.failureCount.get('global') || 0) + 1;
      this.failureCount.set('global', currentFailures);

      if (currentFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
        this.MAINTENANCE_MODE = true;
        console.error(`[GuardrailManager] CIRCUIT BREAKER TRIGGERED! Entering maintenance mode.`);
      }
    }
  }

  /**
   * Reset manual para testes ou intervenção humana.
   */
  static reset() {
    this.failureCount.clear();
    this.lastActionTimestamp.clear();
    this.MAINTENANCE_MODE = false;
  }

  static isMaintenanceMode(): boolean {
    return this.MAINTENANCE_MODE;
  }
}

/**
 * Proxy de Adaptador que aplica os Guardrails.
 */
export class GuardedAdsAdapter implements IAdsAdapter {
  constructor(private innerAdapter: IAdsAdapter) {}

  async pauseAdEntity(entityId: string, type: 'campaign' | 'adset'): Promise<AdsActionResponse> {
    const check = GuardrailManager.canExecute(entityId, 'pause');
    if (!check.can) {
      return this.createThrottledResponse(entityId, check.reason!);
    }

    const response = await this.innerAdapter.pauseAdEntity(entityId, type);
    GuardrailManager.recordResult(entityId, response.success);
    return response;
  }

  async adjustBudget(entityId: string, type: 'campaign' | 'adset', newBudget: number): Promise<AdsActionResponse> {
    const check = GuardrailManager.canExecute(entityId, 'adjust_budget');
    if (!check.can) {
      return this.createThrottledResponse(entityId, check.reason!);
    }

    const response = await this.innerAdapter.adjustBudget(entityId, type, newBudget);
    GuardrailManager.recordResult(entityId, response.success);
    return response;
  }

  async getEntityStatus(entityId: string) {
    return this.innerAdapter.getEntityStatus(entityId);
  }

  private createThrottledResponse(entityId: string, reason: string): AdsActionResponse {
    return {
      success: false,
      externalId: entityId,
      platform: 'meta', // Simplificado para o proxy
      actionTaken: 'pause',
      error: {
        code: 'GUARDRAIL_BLOCKED',
        message: reason,
        retryable: false
      }
    };
  }
}
