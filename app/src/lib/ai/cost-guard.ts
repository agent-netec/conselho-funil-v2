/**
 * AI Cost Guard & Token Optimizer
 * Camada de governança para chamadas de IA (Gemini/Jina)
 * ST-21.6
 */

import { db } from '@/lib/firebase/config';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { CONFIG } from '@/lib/config';

// Preços aproximados por 1M tokens (USD) - Gemini 2.0 Flash
// Nota: Ajustar conforme tabela oficial do Google AI Studio
const GEMINI_COSTS = {
  input: 0.10 / 1_000_000,
  output: 0.40 / 1_000_000,
};

// Jina Reader API - Custo fixo por requisição (exemplo) ou tokens
const JINA_COST_PER_REQ = 0.0001; 

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

    if (params.brandId) {
      const brandRef = doc(db, 'brands', params.brandId);
      const brandSnap = await getDoc(brandRef);
      
      if (brandSnap.exists()) {
        const data = brandSnap.data();
        const limit = data.usageLimit?.dailyLimit || 5.0; // Default $5/dia
        const current = data.usageLimit?.currentDailyUsage || 0;
        
        if (current >= limit) {
          console.warn(`[AICostGuard] Brand ${params.brandId} exceeded daily budget limit.`);
          return false;
        }
      }
    }

    // Check user credits (legacy/global)
    const userRef = doc(db, 'users', params.userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if ((userData.credits || 0) <= 0) {
        return false;
      }
    }

    return true;
  }

  /**
   * Registra o log de uso no Firestore.
   */
  static async logUsage(
    params: AIUsageParams,
    usage: TokenUsage,
    provider: 'google' | 'jina' = 'google'
  ) {
    try {
      const costEstimate = provider === 'google' 
        ? (usage.inputTokens * GEMINI_COSTS.input) + (usage.outputTokens * GEMINI_COSTS.output)
        : JINA_COST_PER_REQ;

      // 1. Persistir no usage_logs
      await addDoc(collection(db, 'usage_logs'), {
        ...params,
        ...usage,
        provider,
        costEstimate,
        timestamp: Timestamp.now(),
      });

      // 2. Atualizar acumuladores na Brand (se houver)
      if (params.brandId) {
        const brandRef = doc(db, 'brands', params.brandId);
        await updateDoc(brandRef, {
          'usageLimit.currentDailyUsage': increment(costEstimate),
          'usageLimit.lastUsage': Timestamp.now(),
        });
      }

      // 3. Atualizar créditos do usuário (decremento simples por chamada por enquanto)
      const userRef = doc(db, 'users', params.userId);
      await updateDoc(userRef, {
        usage: increment(1),
        credits: increment(-1),
      });

      console.log(`[AICostGuard] Logged usage for ${params.feature}: $${costEstimate.toFixed(6)}`);
    } catch (error) {
      console.error('[AICostGuard] Error logging usage:', error);
    }
  }

  /**
   * Estima tokens de uma string (aproximação simples: 1 token ~= 4 chars)
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
