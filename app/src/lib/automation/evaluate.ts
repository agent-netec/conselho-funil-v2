/**
 * Automation Evaluation Orchestrator
 *
 * Conecta o AutomationEngine às regras e métricas reais do Firestore.
 * Chamado por:
 *   - POST /api/automation/evaluate (manual, por brand)
 *   - GET /api/cron/automation-evaluate (hourly, todas as brands)
 *
 * W-2.1: Council debate before creating pending_approval logs.
 * W-1.2: Metrics history for trend evaluation.
 *
 * @module lib/automation/evaluate
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { AutomationEngine } from '@/lib/automation/engine';
import {
  getAutomationRules,
  createAutomationLog,
  createInAppNotification,
  getKillSwitchState,
  getMetricsHistory,
  saveMetricsSnapshot,
} from '@/lib/firebase/automation';
import { fetchMetricsWithCache } from '@/lib/performance/fetch-and-cache';
import type { AutomationLog, AutomationRule, CouncilDebateResult } from '@/types/automation';
import type { PerformanceMetric } from '@/types/performance';

export interface EvaluationResult {
  brandId: string;
  rulesEvaluated: number;
  logsCreated: number;
  skippedCooldown: number;
  skippedDuplicate: number;
  killSwitchActive: boolean;
  councilConsulted: number;
}

/** W-2.1: Ads Council IDs */
const ADS_COUNSELOR_IDS = ['justin_brooke', 'nicholas_kusmich', 'jon_loomer', 'savannah_sanchez'];

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
    councilConsulted: 0,
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

  // 3b. W-1.2: Fetch metrics history for trend evaluation
  const metricsHistory = await getMetricsHistory(brandId, 7);

  // 3c. W-1.2: Save today's snapshot for future trend analysis
  const today = new Date().toISOString().slice(0, 10);
  const alreadySaved = metricsHistory.some(s => s.date === today);
  if (!alreadySaved) {
    saveMetricsSnapshot(brandId, { date: today, metrics, source: 'cron', timestamp: Timestamp.now() })
      .catch(err => console.error('[Evaluate] Failed to save metrics snapshot:', err));
  }

  // 4. Buscar logs recentes para cooldown/dedup
  const recentLogs = await getRecentLogs(brandId, 200);

  // 5. Rodar engine (W-1.1/W-1.2: pass metricsHistory for trend evaluation)
  const candidateLogs = AutomationEngine.evaluatePerformanceMetrics(brandId, metrics, activeRules, metricsHistory);

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

    // W-2.1: Consult the Ads Council before creating the log
    let councilDebate: CouncilDebateResult | undefined;
    try {
      councilDebate = await consultAdsCouncil(brandId, rule, metrics);
      result.councilConsulted++;
    } catch (err) {
      console.error('[Evaluate] Council consultation failed (proceeding without):', err);
    }

    // Persistir log (strip client-generated id)
    const { id: _id, ...logData } = candidate;
    if (councilDebate) {
      logData.context = { ...logData.context, councilDebate };
    }
    await createAutomationLog(brandId, logData);

    // Notificação in-app (fire-and-forget)
    const councilSummary = councilDebate
      ? ` Conselho: ${councilDebate.votes.filter(v => v.recommendation === 'approve').length}/${councilDebate.votes.length} aprovam.`
      : '';
    createInAppNotification(brandId, {
      type: 'automation',
      title: `Regra Disparada: ${rule.name}`,
      message: `Ação "${candidate.action}" sugerida. Aguardando aprovação.${councilSummary}`,
      ruleId: rule.id,
      isRead: false,
      createdAt: Timestamp.now(),
    }).catch(err => console.error('[Evaluate] Notification failed:', err));

    result.logsCreated++;
  }

  return result;
}

// ---- W-2.1: Council Consultation ----

/**
 * Consults the 4 Ads Council members for their opinion on a triggered rule.
 * Uses PRO_GEMINI_MODEL for critical decision making (1 credit).
 */
async function consultAdsCouncil(
  brandId: string,
  rule: AutomationRule,
  metrics: Record<string, number>
): Promise<CouncilDebateResult> {
  const { generateWithGemini, PRO_GEMINI_MODEL } = await import('@/lib/ai/gemini');
  const { buildPartyPrompt } = await import('@/lib/ai/prompts/party-mode');
  const { buildPartyBrainContext } = await import('@/lib/ai/prompts/party-brain-context');

  const metricsContext = Object.entries(metrics)
    .filter(([, v]) => v !== 0)
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`)
    .join(', ');

  const debateQuery = `Uma regra de automação foi disparada e precisa de avaliação do Conselho:

**Regra:** ${rule.name}
**Trigger:** ${rule.trigger.metric || rule.trigger.type} ${rule.trigger.operator} ${rule.trigger.value}
**Ação proposta:** ${rule.action.type} (plataforma: ${rule.action.params.platform}, nível: ${rule.action.params.targetLevel})
${rule.action.params.adjustmentValue ? `**Ajuste:** ${rule.action.params.adjustmentValue}%` : ''}

**Métricas atuais:** ${metricsContext}

Cada conselheiro deve opinar: APROVAR ou REJEITAR esta ação automática, com justificativa.
O Veredito deve consolidar as opiniões com nível de confiança (0-100).

FORMATO OBRIGATÓRIO para o Veredito:
[VOTE:agentId:approve/reject:razão resumida] para cada conselheiro
[CONFIDENCE:número 0-100]`;

  let brandContext = '';
  try {
    const { getBrand } = await import('@/lib/firebase/brands');
    const brand = await getBrand(brandId);
    if (brand) {
      brandContext = `Marca: ${brand.name}\nVertical: ${brand.vertical}\nPosicionamento: ${brand.positioning || 'N/A'}`;
    }
  } catch { /* proceed without brand context */ }

  const brainContext = buildPartyBrainContext(ADS_COUNSELOR_IDS);
  const prompt = buildPartyPrompt(debateQuery, brandContext, ADS_COUNSELOR_IDS, {
    intensity: 'debate',
    brainContext,
  });

  const response = await generateWithGemini(prompt, {
    model: PRO_GEMINI_MODEL,
    temperature: 0.7,
  });

  return parseCouncilResponse(response);
}

/**
 * Parses the council debate response into structured data.
 */
function parseCouncilResponse(response: string): CouncilDebateResult {
  const votes: CouncilDebateResult['votes'] = [];

  const voteRegex = /\[VOTE:(\w+):(approve|reject):([^\]]+)\]/gi;
  let match;
  while ((match = voteRegex.exec(response)) !== null) {
    const agentId = match[1];
    const agentNames: Record<string, string> = {
      justin_brooke: 'Justin Brooke',
      nicholas_kusmich: 'Nicholas Kusmich',
      jon_loomer: 'Jon Loomer',
      savannah_sanchez: 'Savannah Sanchez',
    };
    votes.push({
      agentId,
      name: agentNames[agentId] || agentId,
      recommendation: match[2] as 'approve' | 'reject',
      reason: match[3].trim(),
    });
  }

  // Fallback: infer votes from text if structured tags not found
  if (votes.length === 0) {
    const agentNames: Record<string, string> = {
      justin_brooke: 'Justin Brooke',
      nicholas_kusmich: 'Nicholas Kusmich',
      jon_loomer: 'Jon Loomer',
      savannah_sanchez: 'Savannah Sanchez',
    };
    for (const id of ADS_COUNSELOR_IDS) {
      const name = agentNames[id];
      const namePattern = new RegExp(`\\*?\\*?\\[?${name}\\]?\\*?\\*?`, 'i');
      const idx = response.search(namePattern);
      if (idx >= 0) {
        const section = response.slice(idx, idx + 500).toLowerCase();
        const isApprove = section.includes('aprovo') || section.includes('concordo') || section.includes('approve');
        votes.push({
          agentId: id,
          name,
          recommendation: isApprove ? 'approve' : 'reject',
          reason: 'Inferido do texto do debate',
        });
      }
    }
  }

  const confMatch = response.match(/\[CONFIDENCE:(\d+)\]/i);
  const confidence = confMatch ? Math.min(100, Math.max(0, parseInt(confMatch[1], 10))) : 50;

  const verdictMatch = response.match(/veredito.*?(?:conselho|moderador)[\s\S]*?([\s\S]{50,})/i);
  const verdict = verdictMatch ? verdictMatch[1].trim().slice(0, 500) : 'Veredito não estruturado';

  return {
    fullText: response.slice(0, 5000),
    votes,
    verdict,
    confidence,
  };
}

// ---- Helpers ----

/**
 * Busca métricas para avaliação de regras.
 */
async function fetchLatestMetrics(brandId: string): Promise<Record<string, number> | null> {
  const result = await fetchMetricsWithCache(brandId);
  if (!result || result.metrics.length === 0) return null;
  return flattenMetrics(result.metrics);
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
