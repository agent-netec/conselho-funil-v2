/**
 * AI Cost Guard & Token Optimizer
 * Camada de governança para chamadas de IA (Gemini/Jina)
 * ST-21.6
 */

import { estimateTokens as _estimateTokens } from '@/lib/utils/ai-helpers';

import { getAdminFirestore } from '@/lib/firebase/admin';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';
import { CONFIG } from '@/lib/config';

// Preços aproximados por 1M tokens (USD) - Gemini 2.0 Flash
// Nota: Ajustar conforme tabela oficial do Google AI Studio
const GEMINI_COSTS = {
  input: 0.10 / 1_000_000,
  output: 0.40 / 1_000_000,
};

// Jina Reader API - Custo fixo por requisição (exemplo) ou tokens
const JINA_COST_PER_REQ = 0.0001; 
// Firecrawl API - custo fixo por requisição (placeholder)
const FIRECRAWL_COST_PER_REQ = 0.0001;

export interface AIUsageParams {
  userId: string;
  brandId?: string;
  model: string;
  feature: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

/**
 * Intercepta e registra o uso de IA, verificando orçamentos.
 */
export class AICostGuard {
  /**
   * Verifica se a marca ou usuário tem orçamento disponível.
   */
  static async checkBudget(params: AIUsageParams): Promise<boolean> {
    if (!CONFIG.ENABLE_CREDIT_LIMIT) return true;
    const adminDb = getAdminFirestore();

    if (params.brandId) {
      const brandSnap = await adminDb.collection('brands').doc(params.brandId).get();

      if (brandSnap.exists) {
        const data = brandSnap.data()!;
        const limit = data.usageLimit?.dailyLimit || 5.0; // Default $5/dia
        const current = data.usageLimit?.currentDailyUsage || 0;

        if (current >= limit) {
          console.warn(`[AICostGuard] Brand ${params.brandId} exceeded daily budget limit.`);
          return false;
        }
      }
    }

    // Note: User-level credit checks are handled by consumeCredits() (Sprint 02.3)
    // which uses monthlyCredits/creditsUsed. The legacy 'credits' field is no longer authoritative.

    return true;
  }

  /**
   * Registra o log de uso no Firestore.
   */
  static async logUsage(
    params: AIUsageParams,
    usage: TokenUsage,
    provider: 'google' | 'jina' | 'firecrawl' = 'google'
  ) {
    try {
      const adminDb = getAdminFirestore();
      const costEstimate = provider === 'google'
        ? (usage.inputTokens * GEMINI_COSTS.input) + (usage.outputTokens * GEMINI_COSTS.output)
        : provider === 'firecrawl'
          ? FIRECRAWL_COST_PER_REQ
          : JINA_COST_PER_REQ;

      // 1. Persistir no usage_logs (filter undefined to avoid Firestore rejection)
      const logData: Record<string, unknown> = {
        userId: params.userId,
        model: params.model,
        feature: params.feature,
        ...usage,
        provider,
        costEstimate,
        timestamp: Timestamp.now(),
      };
      if (params.brandId) logData.brandId = params.brandId;

      await adminDb.collection('usage_logs').add(logData);

      // 2. Atualizar acumuladores na Brand (se houver)
      if (params.brandId) {
        await adminDb.collection('brands').doc(params.brandId).update({
          'usageLimit.currentDailyUsage': FieldValue.increment(costEstimate),
          'usageLimit.lastUsage': Timestamp.now(),
        });
      }

      // 3. Track usage count (credits handled by consumeCredits — Sprint 02.3)
      await adminDb.collection('users').doc(params.userId).update({
        usage: FieldValue.increment(1),
      });

      console.log(`[AICostGuard] Logged usage for ${params.feature}: $${costEstimate.toFixed(6)}`);
    } catch (error) {
      console.error('[AICostGuard] Error logging usage:', error);
    }
  }

  /**
   * Estima tokens de uma string (aproximação simples: 1 token ~= 4 chars).
   * Delega para utilitário centralizado (SIG-BNS-02).
   */
  static estimateTokens(text: string): number {
    return _estimateTokens(text);
  }
}
