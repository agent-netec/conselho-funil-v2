/**
 * Automation CRUD — Firestore Client SDK
 * CRUD para automation_rules, automation_logs, notifications e dead_letter_queue.
 *
 * Padrões Sigma:
 * - Timestamp (NUNCA Date) — P-08
 * - brands/{brandId}/... — SEMPRE multi-tenant — P-09
 * - Firebase Client SDK (NUNCA firebase-admin) — P-03
 * - ZERO dependências npm novas — P-01
 *
 * @module lib/firebase/automation
 * @story S31-AUTO-01, S31-AUTO-02, S31-KS-03, S31-DLQ-03
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
  getCountFromServer,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { AutomationRule, AutomationLog, DeadLetterItem, MetricsSnapshot, ExecutionResult, ImpactAnalysis } from '@/types/automation';

// ====== AUTOMATION RULES ======
// Collection: brands/{brandId}/automation_rules

export async function getAutomationRules(brandId: string): Promise<AutomationRule[]> {
  const rulesRef = collection(db, 'brands', brandId, 'automation_rules');
  const snap = await getDocs(rulesRef);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationRule));
}

export async function saveAutomationRule(
  brandId: string,
  rule: Omit<AutomationRule, 'id'>
): Promise<string> {
  const rulesRef = collection(db, 'brands', brandId, 'automation_rules');
  const docRef = await addDoc(rulesRef, rule);
  return docRef.id;
}

export async function updateAutomationRule(
  brandId: string,
  ruleId: string,
  data: Partial<AutomationRule>
): Promise<void> {
  const ruleRef = doc(db, 'brands', brandId, 'automation_rules', ruleId);
  await updateDoc(ruleRef, data);
}

export async function toggleAutomationRule(
  brandId: string,
  ruleId: string,
  isEnabled: boolean
): Promise<void> {
  const ruleRef = doc(db, 'brands', brandId, 'automation_rules', ruleId);
  await updateDoc(ruleRef, { isEnabled });
}

export async function deleteAutomationRule(
  brandId: string,
  ruleId: string
): Promise<void> {
  const ruleRef = doc(db, 'brands', brandId, 'automation_rules', ruleId);
  await deleteDoc(ruleRef);
}

// ====== AUTOMATION LOGS ======
// Collection: brands/{brandId}/automation_logs

export async function getAutomationLogs(
  brandId: string,
  maxResults: number = 50
): Promise<AutomationLog[]> {
  const logsRef = collection(db, 'brands', brandId, 'automation_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationLog));
}

export async function createAutomationLog(
  brandId: string,
  log: Omit<AutomationLog, 'id'>
): Promise<string> {
  const logsRef = collection(db, 'brands', brandId, 'automation_logs');
  const docRef = await addDoc(logsRef, log);
  return docRef.id;
}

export async function updateAutomationLogStatus(
  brandId: string,
  logId: string,
  status: AutomationLog['status'],
  executedBy?: string
): Promise<void> {
  const logRef = doc(db, 'brands', brandId, 'automation_logs', logId);
  const updateData: Record<string, unknown> = { status };
  if (executedBy) updateData.executedBy = executedBy;
  await updateDoc(logRef, updateData);
}

/**
 * Retorna o estado do Kill-Switch para uma marca.
 * Le o campo killSwitchState do documento da brand.
 *
 * DT-11 (BLOCKING): Esta funcao NAO EXISTIA antes da S34.
 * Prerequisito para PB-04 (ZERO auto-optimization se Kill-Switch ativo).
 *
 * @param brandId - ID da marca
 * @returns boolean — true se Kill-Switch ativo
 */
export async function getKillSwitchState(brandId: string): Promise<boolean> {
  try {
    const { getBrand } = await import('@/lib/firebase/firestore');
    const brand = await getBrand(brandId);
    return brand?.killSwitchState?.active ?? false;
  } catch (error) {
    console.error('[Automation] Failed to get kill-switch state:', error);
    return false;
  }
}

/**
 * Atualiza o estado do Kill-Switch para uma marca.
 */
export async function setKillSwitchState(
  brandId: string,
  active: boolean,
  reason?: string
): Promise<void> {
  const brandRef = doc(db, 'brands', brandId);
  await updateDoc(brandRef, {
    killSwitchState: {
      active,
      activatedAt: active ? Timestamp.now() : null,
      reason: reason ?? null,
    },
  });
}

// ====== NOTIFICATIONS ======
// Collection: brands/{brandId}/notifications

export async function createInAppNotification(
  brandId: string,
  notification: {
    type: 'kill_switch' | 'automation' | 'system';
    title: string;
    message: string;
    ruleId?: string;
    isRead: boolean;
    createdAt: Timestamp;
  }
): Promise<string> {
  const notifRef = collection(db, 'brands', brandId, 'notifications');
  const docRef = await addDoc(notifRef, notification);
  return docRef.id;
}

export async function getUnreadNotificationCount(brandId: string): Promise<number> {
  const notifRef = collection(db, 'brands', brandId, 'notifications');
  const q = query(notifRef, where('isRead', '==', false));
  const snap = await getCountFromServer(q);
  return snap.data().count;
}

export async function markNotificationsAsRead(brandId: string): Promise<void> {
  const notifRef = collection(db, 'brands', brandId, 'notifications');
  const q = query(notifRef, where('isRead', '==', false));
  const snap = await getDocs(q);
  const updates = snap.docs.map(d => updateDoc(d.ref, { isRead: true }));
  await Promise.all(updates);
}

// ====== DEAD LETTER QUEUE ======
// Collection: brands/{brandId}/dead_letter_queue
// S31-DLQ-03: Função para listar items pendentes na DLQ

export async function getDLQItems(
  brandId: string,
  maxResults: number = 50
): Promise<DeadLetterItem[]> {
  const dlqRef = collection(db, 'brands', brandId, 'dead_letter_queue');
  const q = query(
    dlqRef,
    where('status', 'in', ['pending', 'abandoned']),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as DeadLetterItem));
}

// ====== METRICS HISTORY ======
// Collection: brands/{brandId}/metrics_history
// W-1.2: Daily snapshots for trend detection

export async function getMetricsHistory(
  brandId: string,
  maxDays: number = 7
): Promise<MetricsSnapshot[]> {
  const histRef = collection(db, 'brands', brandId, 'metrics_history');
  const q = query(histRef, orderBy('date', 'desc'), limit(maxDays));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MetricsSnapshot));
}

export async function saveMetricsSnapshot(
  brandId: string,
  snapshot: Omit<MetricsSnapshot, 'id'>
): Promise<string> {
  const histRef = collection(db, 'brands', brandId, 'metrics_history');
  const docRef = await addDoc(histRef, snapshot);
  return docRef.id;
}

// ====== EXECUTION TRACKING ======
// W-3.3: Update log with execution result

export async function updateAutomationLogExecution(
  brandId: string,
  logId: string,
  executionResult: ExecutionResult,
  executedBy?: string
): Promise<void> {
  const logRef = doc(db, 'brands', brandId, 'automation_logs', logId);
  const updateData: Record<string, unknown> = {
    status: executionResult.success ? 'executed' : 'failed',
    executionResult,
  };
  if (executedBy) updateData.executedBy = executedBy;
  await updateDoc(logRef, updateData);
}

// W-4.1: Update log with impact analysis

export async function updateAutomationLogImpact(
  brandId: string,
  logId: string,
  impactAnalysis: ImpactAnalysis
): Promise<void> {
  const logRef = doc(db, 'brands', brandId, 'automation_logs', logId);
  await updateDoc(logRef, { impactAnalysis });
}

// W-4.2: Get logs for proactive suggestion analysis

export async function getExecutedLogsForRule(
  brandId: string,
  ruleId: string,
  maxResults: number = 10
): Promise<AutomationLog[]> {
  const logsRef = collection(db, 'brands', brandId, 'automation_logs');
  const q = query(
    logsRef,
    where('ruleId', '==', ruleId),
    where('status', '==', 'executed'),
    orderBy('timestamp', 'desc'),
    limit(maxResults)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationLog));
}
