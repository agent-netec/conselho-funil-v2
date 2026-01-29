import { Timestamp } from 'firebase/firestore';
import { createTransaction } from '@/lib/firebase/journey';
import { processTransactionLTV } from '@/lib/intelligence/ltv/calculator';
import type { JourneyTransaction } from '@/types/journey';

/**
 * @fileoverview Orquestrador de transações e sincronização de métricas.
 * @module lib/intelligence/ltv/sync
 */

/**
 * Registra uma transação e dispara o cálculo de LTV.
 */
export async function syncApprovedTransaction(data: Omit<JourneyTransaction, 'id' | 'status' | 'processedAt' | 'createdAt'>) {
  const now = Timestamp.now();
  
  // 1. Criar objeto de transação aprovada
  const transaction: Omit<JourneyTransaction, 'id'> = {
    ...data,
    status: 'approved',
    processedAt: now,
    createdAt: now,
  };

  // 2. Persistir no Firestore
  const transactionId = await createTransaction(transaction);

  // 3. Processar LTV (Trigger Manual/Sync)
  const ltvResult = await processTransactionLTV({
    id: transactionId,
    ...transaction
  } as JourneyTransaction);

  return {
    transactionId,
    ...ltvResult
  };
}
