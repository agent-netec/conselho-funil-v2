import { GuardrailManager, GuardedAdsAdapter } from '../adapters/guardrails';
import { IAdsAdapter, AdsActionResponse } from '../adapters/types';

/**
 * Mock Adapter para simular falhas e latência
 */
class MockAdsAdapter implements IAdsAdapter {
  shouldFail = false;
  
  async pauseAdEntity(entityId: string, type: 'campaign' | 'adset'): Promise<AdsActionResponse> {
    if (this.shouldFail) {
      return { success: false, externalId: entityId, platform: 'meta', actionTaken: 'pause', error: { code: 'API_ERROR', message: 'Simulated failure', retryable: true } };
    }
    return { success: true, externalId: entityId, platform: 'meta', actionTaken: 'pause' };
  }

  async adjustBudget(entityId: string, type: 'campaign' | 'adset', newBudget: number): Promise<AdsActionResponse> {
    if (this.shouldFail) {
      return { success: false, externalId: entityId, platform: 'meta', actionTaken: 'adjust_budget', error: { code: 'API_ERROR', message: 'Simulated failure', retryable: true } };
    }
    return { success: true, externalId: entityId, platform: 'meta', actionTaken: 'adjust_budget', newValue: newBudget };
  }

  async getEntityStatus(entityId: string) {
    return { status: 'ACTIVE', currentBudget: 100 };
  }
}

describe('ST-27.5: Automation Safety & Stress Test (Guardrails)', () => {
  let mockAdapter: MockAdsAdapter;
  let guardedAdapter: GuardedAdsAdapter;

  beforeEach(() => {
    GuardrailManager.reset();
    mockAdapter = new MockAdsAdapter();
    guardedAdapter = new GuardedAdsAdapter(mockAdapter);
  });

  /**
   * TESTE: Circuit Breaker
   * Se 3 ações falharem consecutivamente, o sistema deve entrar em modo manutenção.
   */
  test('CIRCUIT BREAKER: should enter maintenance mode after 3 consecutive failures', async () => {
    mockAdapter.shouldFail = true;

    // 3 falhas consecutivas
    await guardedAdapter.pauseAdEntity('ent_1', 'campaign');
    await guardedAdapter.pauseAdEntity('ent_2', 'campaign');
    await guardedAdapter.pauseAdEntity('ent_3', 'campaign');

    expect(GuardrailManager.isMaintenanceMode()).toBe(true);

    // 4ª tentativa deve ser bloqueada pelo Guardrail sem nem chamar o adapter
    const response = await guardedAdapter.pauseAdEntity('ent_4', 'campaign');
    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('GUARDRAIL_BLOCKED');
    expect(response.error?.message).toContain('CIRCUIT_BREAKER_OPEN');
  });

  /**
   * TESTE: Rate Limiting
   * Máximo de 1 alteração de budget por entidade a cada 6 horas.
   */
  test('RATE LIMITING: should block multiple budget adjustments for the same entity within 6h', async () => {
    // 1ª alteração: Sucesso
    const res1 = await guardedAdapter.adjustBudget('ent_1', 'campaign', 120);
    expect(res1.success).toBe(true);

    // 2ª alteração imediata: Bloqueio
    const res2 = await guardedAdapter.adjustBudget('ent_1', 'campaign', 140);
    expect(res2.success).toBe(false);
    expect(res2.error?.code).toBe('GUARDRAIL_BLOCKED');
    expect(res2.error?.message).toContain('RATE_LIMIT_EXCEEDED');

    // Alteração para entidade DIFERENTE: Sucesso
    const res3 = await guardedAdapter.adjustBudget('ent_2', 'campaign', 200);
    expect(res3.success).toBe(true);
  });

  /**
   * TESTE DE ESTRESSE: Concorrência
   * Simular múltiplas chamadas rápidas para garantir que o Rate Limit segura.
   */
  test('STRESS: concurrent calls should be handled by rate limiter', async () => {
    const calls = Array.from({ length: 10 }, () => 
      guardedAdapter.adjustBudget('ent_stress', 'campaign', 150)
    );

    const results = await Promise.all(calls);
    const successes = results.filter(r => r.success).length;
    const blocked = results.filter(r => !r.success && r.error?.code === 'GUARDRAIL_BLOCKED').length;

    expect(successes).toBe(1);
    expect(blocked).toBe(9);
  });
});
