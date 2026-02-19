/**
 * Content Approval Engine — State Machine + History Log
 *
 * Estados: draft → pending_review → approved → scheduled → published
 * Transicoes alternativas: qualquer (exceto published) → rejected
 * Re-edit: rejected → draft
 *
 * DT-08 (BLOCKING): Adjacency map hardcoded. ZERO transicao sem validacao.
 *
 * @module lib/content/approval-engine
 * @story S33-APR-01
 */

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  CalendarItemStatus,
  CalendarItem,
  ApprovalAction,
  ApprovalHistoryEntry,
} from '@/types/content';

/**
 * Adjacency map de transicoes validas.
 * DT-08 (BLOCKING): Source of truth para validacao de transicoes.
 * published = terminal (zero transicao de saida).
 */
export const VALID_TRANSITIONS: Record<CalendarItemStatus, CalendarItemStatus[]> = {
  draft: ['pending_review', 'rejected'],
  pending_review: ['approved', 'rejected'],
  approved: ['scheduled', 'rejected'],
  scheduled: ['published', 'rejected'],
  published: [],                // Terminal — ZERO transicao permitida
  rejected: ['draft', 'pending_review'],  // Re-edit ou reenviar para revisão
};

/**
 * Mapeia action da API para status alvo.
 * NAO incluir 'publish' em S33 (PA-01: zero publicacao real).
 */
const ACTION_TO_STATUS: Record<ApprovalAction, CalendarItemStatus> = {
  submit_review: 'pending_review',
  approve: 'approved',
  reject: 'rejected',
  schedule: 'scheduled',
};

/**
 * Valida se a transicao de status e permitida.
 */
export function isValidTransition(
  from: CalendarItemStatus,
  to: CalendarItemStatus
): boolean {
  // rejected → rejected = no-op (nao erro, apenas ignorar)
  if (from === to) return false;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Executa transicao de status com validacao e history log.
 *
 * 1. Ler status atual do item
 * 2. Mapear action → target status
 * 3. Validar transicao via VALID_TRANSITIONS (DT-08)
 * 4. Se invalida → return error
 * 5. Se valida:
 *    a. updateDoc com novo status + updatedAt
 *    b. addDoc em subcollection history (append-only, imutavel)
 * 6. Retornar item atualizado
 *
 * @param brandId - ID da marca
 * @param itemId - ID do item no calendario
 * @param action - Acao de aprovacao (submit_review, approve, reject, schedule)
 * @param comment - Comentario opcional (obrigatorio em reject)
 * @param userId - ID do usuario que executa a acao
 */
export async function transitionStatus(
  brandId: string,
  itemId: string,
  action: ApprovalAction,
  comment?: string,
  userId?: string
): Promise<{ success: boolean; item?: CalendarItem; error?: string }> {
  // 1. Ler status atual
  const itemRef = doc(db, 'brands', brandId, 'content_calendar', itemId);
  const snap = await getDoc(itemRef);

  if (!snap.exists()) {
    return { success: false, error: 'Item not found' };
  }

  const currentItem = { id: snap.id, ...snap.data() } as CalendarItem;
  const currentStatus = currentItem.status;

  // 2. Mapear action → target status
  const targetStatus = ACTION_TO_STATUS[action];
  if (!targetStatus) {
    return { success: false, error: `Invalid action: ${action}` };
  }

  // 3. Validar transicao (DT-08 BLOCKING)
  if (!isValidTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      error: `Invalid transition: ${currentStatus} → ${targetStatus}`,
    };
  }

  // 4. Reject sem comentario: erro
  if (action === 'reject' && !comment) {
    return { success: false, error: 'Comment is required when rejecting' };
  }

  const now = Timestamp.now();

  // 5a. Atualizar status do item
  await updateDoc(itemRef, {
    status: targetStatus,
    updatedAt: now,
  });

  // 5b. Registrar history log (append-only, imutavel)
  const historyRef = collection(
    db, 'brands', brandId, 'content_calendar', itemId, 'history'
  );
  await addDoc(historyRef, {
    fromStatus: currentStatus,
    toStatus: targetStatus,
    comment: comment || null,
    timestamp: now,
    userId: userId || null,
  });

  // 6. Retornar item atualizado
  return {
    success: true,
    item: {
      ...currentItem,
      status: targetStatus,
      updatedAt: now,
    },
  };
}

/**
 * Busca historico de aprovacao de um item.
 * History log: brands/{brandId}/content_calendar/{itemId}/history
 * Ordenado por timestamp DESC (mais recente primeiro).
 */
export async function getApprovalHistory(
  brandId: string,
  itemId: string
): Promise<ApprovalHistoryEntry[]> {
  const historyRef = collection(
    db, 'brands', brandId, 'content_calendar', itemId, 'history'
  );

  const snapshot = await getDocs(query(historyRef));
  const entries = snapshot.docs.map((d) => d.data() as ApprovalHistoryEntry);

  // Sort in-memory por timestamp DESC
  return entries.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
}

/**
 * Conta items em pending_review para um brand.
 * Usado pelo sidebar badge.
 */
export async function countPendingReview(brandId: string): Promise<number> {
  const { getCalendarItems } = await import('@/lib/firebase/content-calendar');
  // Buscar items dos proximos 90 dias
  const now = Timestamp.now();
  const futureMs = now.toMillis() + 90 * 24 * 60 * 60 * 1000;
  const pastMs = now.toMillis() - 30 * 24 * 60 * 60 * 1000;
  const items = await getCalendarItems(
    brandId,
    Timestamp.fromMillis(pastMs),
    Timestamp.fromMillis(futureMs)
  );
  return items.filter((item) => item.status === 'pending_review').length;
}
