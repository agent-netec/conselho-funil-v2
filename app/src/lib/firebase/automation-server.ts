/**
 * Automation CRUD — Firebase Admin SDK (server-side only)
 * Mirror of automation.ts for API routes that need Admin SDK.
 * Client components should import from './automation' instead.
 *
 * @module lib/firebase/automation-server
 */

import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import type { AutomationRule, AutomationLog, MetricsSnapshot, ExecutionResult, ImpactAnalysis } from '@/types/automation';

// ====== AUTOMATION RULES ======

export async function getAutomationRules(brandId: string): Promise<AutomationRule[]> {
  const adminDb = getAdminFirestore();
  const snap = await adminDb.collection('brands').doc(brandId).collection('automation_rules').get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationRule));
}

export async function saveAutomationRule(brandId: string, rule: Omit<AutomationRule, 'id'>): Promise<string> {
  const adminDb = getAdminFirestore();
  const docRef = await adminDb.collection('brands').doc(brandId).collection('automation_rules').add(rule);
  return docRef.id;
}

export async function updateAutomationRule(brandId: string, ruleId: string, data: Partial<AutomationRule>): Promise<void> {
  const adminDb = getAdminFirestore();
  await adminDb.collection('brands').doc(brandId).collection('automation_rules').doc(ruleId).update(data);
}

export async function toggleAutomationRule(brandId: string, ruleId: string, isEnabled: boolean): Promise<void> {
  const adminDb = getAdminFirestore();
  await adminDb.collection('brands').doc(brandId).collection('automation_rules').doc(ruleId).update({ isEnabled });
}

export async function deleteAutomationRule(brandId: string, ruleId: string): Promise<void> {
  const adminDb = getAdminFirestore();
  await adminDb.collection('brands').doc(brandId).collection('automation_rules').doc(ruleId).delete();
}

// ====== AUTOMATION LOGS ======

export async function getAutomationLogs(brandId: string, maxResults: number = 50): Promise<AutomationLog[]> {
  const adminDb = getAdminFirestore();
  const snap = await adminDb.collection('brands').doc(brandId).collection('automation_logs')
    .orderBy('timestamp', 'desc').limit(maxResults).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationLog));
}

export async function createAutomationLog(brandId: string, log: Omit<AutomationLog, 'id'>): Promise<string> {
  const adminDb = getAdminFirestore();
  const docRef = await adminDb.collection('brands').doc(brandId).collection('automation_logs').add(log);
  return docRef.id;
}

export async function updateAutomationLogStatus(
  brandId: string, logId: string, status: AutomationLog['status'], executedBy?: string
): Promise<void> {
  const adminDb = getAdminFirestore();
  const updateData: Record<string, unknown> = { status };
  if (executedBy) updateData.executedBy = executedBy;
  await adminDb.collection('brands').doc(brandId).collection('automation_logs').doc(logId).update(updateData);
}

export async function getKillSwitchState(brandId: string): Promise<boolean> {
  try {
    const adminDb = getAdminFirestore();
    const brandSnap = await adminDb.collection('brands').doc(brandId).get();
    const data = brandSnap.data();
    return data?.killSwitchState?.active ?? false;
  } catch (error) {
    console.error('[Automation] Failed to get kill-switch state:', error);
    return false;
  }
}

export async function setKillSwitchState(brandId: string, active: boolean, reason?: string): Promise<void> {
  const adminDb = getAdminFirestore();
  await adminDb.collection('brands').doc(brandId).update({
    killSwitchState: {
      active,
      activatedAt: active ? Timestamp.now() : null,
      reason: reason ?? null,
    },
  });
}

// ====== NOTIFICATIONS ======

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
  const adminDb = getAdminFirestore();
  const docRef = await adminDb.collection('brands').doc(brandId).collection('notifications').add(notification);
  return docRef.id;
}

// ====== EXECUTION TRACKING ======

export async function updateAutomationLogExecution(
  brandId: string, logId: string, executionResult: ExecutionResult, executedBy?: string
): Promise<void> {
  const adminDb = getAdminFirestore();
  const updateData: Record<string, unknown> = {
    status: executionResult.success ? 'executed' : 'failed',
    executionResult,
  };
  if (executedBy) updateData.executedBy = executedBy;
  await adminDb.collection('brands').doc(brandId).collection('automation_logs').doc(logId).update(updateData);
}

export async function updateAutomationLogImpact(
  brandId: string, logId: string, impactAnalysis: ImpactAnalysis
): Promise<void> {
  const adminDb = getAdminFirestore();
  await adminDb.collection('brands').doc(brandId).collection('automation_logs').doc(logId).update({ impactAnalysis });
}

export async function getExecutedLogsForRule(
  brandId: string, ruleId: string, maxResults: number = 10
): Promise<AutomationLog[]> {
  const adminDb = getAdminFirestore();
  const snap = await adminDb.collection('brands').doc(brandId).collection('automation_logs')
    .where('ruleId', '==', ruleId).where('status', '==', 'executed')
    .orderBy('timestamp', 'desc').limit(maxResults).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationLog));
}

// ====== METRICS HISTORY ======

export async function getMetricsHistory(brandId: string, maxDays: number = 7): Promise<MetricsSnapshot[]> {
  const adminDb = getAdminFirestore();
  const snap = await adminDb.collection('brands').doc(brandId).collection('metrics_history')
    .orderBy('date', 'desc').limit(maxDays).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as MetricsSnapshot));
}

export async function saveMetricsSnapshot(brandId: string, snapshot: Omit<MetricsSnapshot, 'id'>): Promise<string> {
  const adminDb = getAdminFirestore();
  const docRef = await adminDb.collection('brands').doc(brandId).collection('metrics_history').add(snapshot);
  return docRef.id;
}
