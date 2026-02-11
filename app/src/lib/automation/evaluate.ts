/**
 * Automation Evaluation Orchestrator
 *
 * Conecta o AutomationEngine às regras e métricas reais do Firestore.
 * Chamado por:
 *   - POST /api/automation/evaluate (manual, por brand)
 *   - GET /api/cron/automation-evaluate (hourly, todas as brands)
 *
 * @module lib/automation/evaluate
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  doc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AutomationEngine } from '@/lib/automation/engine';
import {
  getAutomationRules,
  createAutomationLog,
  createInAppNotification,
  getKillSwitchState,
} from '@/lib/firebase/automation';
import type { AutomationLog } from '@/types/automation';
import type { PerformanceMetric } from '@/types/performance';

export interface EvaluationResult {
  brandId: string;
  rulesEvaluated: number;
  logsCreated: number;
  skippedCooldown: number;
  skippedDuplicate: number;
  killSwitchActive: boolean;
}

/**
 * Avalia todas as regras ativas de uma brand contra métricas reais.
 */
export async function evaluateBrandRules(brandId: string): Promise<EvaluationResult> {
  const result: EvaluationResult = {
    brandId,
    rulesEvaluated: 0,
    logsCreated: 0,
    skippedCooldown: 0,
    skippedDuplicate: 0,
    killSwitchActive: false,
  };

  // 1. Kill-switch guard (PB-04)
  const ksActive = await getKillSwitchState(brandId);
  if (ksActive) {
    result.killSwitchActive = true;
    return result;
  }

  // 2. Buscar regras ativas
  const allRules = await getAutomationRules(brandId);
  const activeRules = allRules.filter(r => r.isEnabled);
  result.rulesEvaluated = activeRules.length;
  if (activeRules.length === 0) return result;

  // 3. Buscar métricas do cache
  const metrics = await fetchLatestMetrics(brandId);
  if (!metrics) return result;

  // 4. Buscar logs recentes para cooldown/dedup
  const recentLogs = await getRecentLogs(brandId, 200);

  // 5. Rodar engine
  const candidateLogs = AutomationEngine.evaluatePerformanceMetrics(brandId, metrics, activeRules);

  // 6. Filtrar e persistir
  for (const candidate of candidateLogs) {
    const rule = activeRules.find(r => r.id === candidate.ruleId);
    if (!rule) continue;

    // Cooldown
    if (isInCooldown(candidate.ruleId, candidate.context.entityId, rule.guardrails.cooldownPeriod, recentLogs)) {
      result.skippedCooldown++;
      continue;
    }

    // Dedup
    if (hasPendingDuplicate(candidate.ruleId, candidate.context.entityId, recentLogs)) {
      result.skippedDuplicate++;
      continue;
    }

    // Persistir log (strip client-generated id)
    const { id: _id, ...logData } = candidate;
    await createAutomationLog(brandId, logData);

    // Notificação in-app (fire-and-forget)
    createInAppNotification(brandId, {
      type: 'automation',
      title: `Regra Disparada: ${rule.name}`,
      message: `Ação "${candidate.action}" sugerida. Aguardando aprovação.`,
      ruleId: rule.id,
      isRead: false,
      createdAt: Timestamp.now(),
    }).catch(err => console.error('[Evaluate] Notification failed:', err));

    result.logsCreated++;
  }

  return result;
}

// ---- Helpers ----

async function fetchLatestMetrics(brandId: string): Promise<Record<string, number> | null> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400_000).toISOString().split('T')[0];

  for (const date of [today, yesterday]) {
    const cacheRef = doc(db, 'brands', brandId, 'performance_cache', date);
    const snap = await getDoc(cacheRef);
    if (snap.exists()) {
      const data = snap.data();
      const metrics: PerformanceMetric[] = data?.metrics || [];
      return flattenMetrics(metrics);
    }
  }
  return null;
}

function flattenMetrics(metrics: PerformanceMetric[]): Record<string, number> {
  const aggregated = metrics.find(m => m.source === 'aggregated');
  const source = aggregated || metrics[0];
  if (!source) return {};

  const d = source.data;
  return {
    spend: d.spend ?? 0,
    revenue: d.revenue ?? 0,
    roas: d.roas ?? 0,
    cac: d.cac ?? 0,
    ctr: d.ctr ?? 0,
    cpc: d.cpc ?? 0,
    cpa: d.cpa ?? 0,
    conversions: d.conversions ?? 0,
    clicks: d.clicks ?? 0,
    impressions: d.impressions ?? 0,
    // checkout_cvr, profit_score, fatigue_index virão de futuras integrações
  };
}

function isInCooldown(
  ruleId: string,
  entityId: string,
  cooldownHours: number,
  recentLogs: AutomationLog[]
): boolean {
  const cooldownMs = cooldownHours * 3600_000;
  const now = Date.now();

  return recentLogs.some(log => {
    if (log.ruleId !== ruleId) return false;
    if (log.context.entityId !== entityId) return false;
    const logTime = log.timestamp?.toMillis?.() ?? (log.timestamp as unknown as { seconds: number })?.seconds * 1000 ?? 0;
    return (now - logTime) < cooldownMs;
  });
}

function hasPendingDuplicate(
  ruleId: string,
  entityId: string,
  recentLogs: AutomationLog[]
): boolean {
  return recentLogs.some(log =>
    log.ruleId === ruleId &&
    log.context.entityId === entityId &&
    log.status === 'pending_approval'
  );
}

async function getRecentLogs(brandId: string, maxResults: number): Promise<AutomationLog[]> {
  const logsRef = collection(db, 'brands', brandId, 'automation_logs');
  const q = query(logsRef, orderBy('timestamp', 'desc'), limit(maxResults));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as AutomationLog));
}
