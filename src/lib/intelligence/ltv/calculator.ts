import { Timestamp } from 'firebase/firestore';
import { getLead, upsertLead } from '@/lib/firebase/journey';
import type { JourneyTransaction, JourneyLead } from '@/types/journey';

/**
 * @fileoverview Motor de cálculo de LTV (Life Time Value) e métricas de cliente.
 * @module lib/intelligence/ltv/calculator
 */

/**
 * Processa uma nova transação aprovada e atualiza as métricas do lead.
 */
export async function processTransactionLTV(transaction: JourneyTransaction) {
  const { leadId, amount, processedAt } = transaction;

  // 1. Buscar o lead para obter métricas atuais
  const lead = await getLead(leadId);
  if (!lead) {
    console.error(`[LTV Error]: Lead ${leadId} não encontrado para processar transação ${transaction.id}`);
    return;
  }

  // 2. Calcular novas métricas
  const currentMetrics = lead.metrics || {
    totalLtv: 0,
    transactionCount: 0,
    averageTicket: 0
  };

  const newTotalLtv = currentMetrics.totalLtv + amount;
  const newTransactionCount = currentMetrics.transactionCount + 1;
  const newAverageTicket = Math.round(newTotalLtv / newTransactionCount);

  // 3. Determinar datas de compra
  const firstPurchaseAt = currentMetrics.firstPurchaseAt || processedAt;
  const lastPurchaseAt = processedAt;

  // 4. Atualizar o lead no Firestore
  await upsertLead(leadId, {
    status: 'customer', // Se comprou, vira customer
    metrics: {
      totalLtv: newTotalLtv,
      transactionCount: newTransactionCount,
      averageTicket: newAverageTicket,
      firstPurchaseAt,
      lastPurchaseAt
    }
  });

  return {
    leadId,
    newTotalLtv,
    newTransactionCount,
    newAverageTicket
  };
}

/**
 * Recalcula o LTV total de um lead a partir de um histórico de transações.
 * Útil para reconciliação de dados.
 */
export async function recalculateLeadLTV(leadId: string, transactions: JourneyTransaction[]) {
  const approvedTransactions = transactions.filter(t => t.status === 'approved');
  
  if (approvedTransactions.length === 0) return null;

  const totalLtv = approvedTransactions.reduce((acc, t) => acc + t.amount, 0);
  const transactionCount = approvedTransactions.length;
  const averageTicket = Math.round(totalLtv / transactionCount);
  
  const sortedDates = approvedTransactions
    .map(t => t.processedAt.toDate().getTime())
    .sort((a, b) => a - b);

  const firstPurchaseAt = Timestamp.fromMillis(sortedDates[0]);
  const lastPurchaseAt = Timestamp.fromMillis(sortedDates[sortedDates.length - 1]);

  const metrics = {
    totalLtv,
    transactionCount,
    averageTicket,
    firstPurchaseAt,
    lastPurchaseAt
  };

  await upsertLead(leadId, { metrics });
  return metrics;
}
