export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { getAutomationLogs, updateAutomationLogImpact } from '@/lib/firebase/automation';
import { fetchMetricsWithCache } from '@/lib/performance/fetch-and-cache';
import { Timestamp } from 'firebase/firestore';
import type { ImpactAnalysis } from '@/types/automation';
import type { PerformanceMetric } from '@/types/performance';

/**
 * POST /api/automation/measure-impact
 * Measures impact of executed automation actions (before/after comparison).
 * Should be called 24-72h after execution.
 * Body: { brandId: string }
 *
 * @sprint W — W-4.1
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId } = body;

    if (!brandId) {
      return createApiError(400, 'Missing required field: brandId');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // 1. Get recently executed logs that need impact measurement
    const allLogs = await getAutomationLogs(brandId, 100);
    const executedLogs = allLogs.filter(log => {
      if (log.status !== 'executed' || !log.executionResult?.success) return false;
      if (log.impactAnalysis) return false; // Already measured

      // Only measure logs executed 24h+ ago
      const executedAt = log.executionResult.timestamp;
      const execMs = executedAt?.toMillis?.() ?? (executedAt as any)?.seconds * 1000 ?? 0;
      const hoursSinceExec = (Date.now() - execMs) / (1000 * 60 * 60);
      return hoursSinceExec >= 24;
    });

    if (executedLogs.length === 0) {
      return createApiSuccess({ measured: 0, message: 'No logs ready for impact measurement' });
    }

    // 2. Get current metrics
    const metricsResult = await fetchMetricsWithCache(brandId);
    if (!metricsResult || metricsResult.metrics.length === 0) {
      return createApiSuccess({ measured: 0, message: 'No current metrics available' });
    }
    const currentMetrics = flattenMetrics(metricsResult.metrics);

    // 3. Measure impact for each executed log
    let measured = 0;
    for (const log of executedLogs) {
      // Before metrics come from the metrics at execution time (stored in context or snapshot)
      const beforeMetrics = extractBeforeMetrics(log);
      if (!beforeMetrics) continue;

      const delta: Record<string, number> = {};
      const changedMetrics: string[] = [];
      for (const key of Object.keys(beforeMetrics)) {
        if (currentMetrics[key] !== undefined) {
          delta[key] = currentMetrics[key] - beforeMetrics[key];
          if (Math.abs(delta[key]) > 0.01) {
            changedMetrics.push(`${key}: ${delta[key] > 0 ? '+' : ''}${delta[key].toFixed(2)}`);
          }
        }
      }

      const summary = changedMetrics.length > 0
        ? `Mudanças após ação "${log.action}": ${changedMetrics.slice(0, 5).join(', ')}`
        : `Sem mudanças significativas detectadas após ação "${log.action}"`;

      const impactAnalysis: ImpactAnalysis = {
        beforeMetrics,
        afterMetrics: currentMetrics,
        delta,
        summary,
        measuredAt: Timestamp.now(),
      };

      await updateAutomationLogImpact(brandId, log.id, impactAnalysis);
      measured++;
    }

    return createApiSuccess({ measured, totalEligible: executedLogs.length });
  } catch (error) {
    console.error('[Measure Impact API]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}

function extractBeforeMetrics(log: any): Record<string, number> | null {
  // Try to get metrics from execution context
  if (log.executionResult?.beforeMetrics) return log.executionResult.beforeMetrics;

  // Fallback: extract from gap details
  const gap = log.context?.gapDetails;
  if (gap && gap.currentValue !== undefined && gap.metricName) {
    return { [gap.metricName]: gap.currentValue };
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
  };
}
