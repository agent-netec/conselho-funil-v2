export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { getAutomationRules, getAutomationLogs, createInAppNotification } from '@/lib/firebase/automation';
import { Timestamp } from 'firebase/firestore';

/**
 * POST /api/automation/suggestions
 * Analyzes automation logs for patterns and suggests proactive optimizations.
 * W-4.2: If same rule triggers 3x in 2 weeks, suggest making it automatic.
 *
 * @sprint W — W-4.2
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

    const rules = await getAutomationRules(brandId);
    const logs = await getAutomationLogs(brandId, 200);

    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    const suggestions: {
      ruleId: string;
      ruleName: string;
      triggerCount: number;
      successRate: number;
      suggestion: string;
      confidence: number;
    }[] = [];

    for (const rule of rules) {
      if (!rule.isEnabled) continue;

      // Count triggers in last 2 weeks
      const recentLogs = logs.filter(log => {
        if (log.ruleId !== rule.id) return false;
        const logTime = log.timestamp?.toMillis?.() ?? (log.timestamp as any)?.seconds * 1000 ?? 0;
        return logTime >= twoWeeksAgo;
      });

      const triggerCount = recentLogs.length;
      if (triggerCount < 3) continue;

      // Calculate success rate (executed logs with positive impact)
      const executedLogs = recentLogs.filter(l => l.status === 'executed');
      const successLogs = executedLogs.filter(l =>
        l.impactAnalysis && (l.impactAnalysis.delta?.revenue ?? 0) >= 0
      );
      const successRate = executedLogs.length > 0
        ? successLogs.length / executedLogs.length
        : 0;

      // Calculate confidence based on history
      const confidence = Math.min(100, Math.round(
        (triggerCount / 10) * 40 + // More triggers = more confident
        successRate * 40 +          // Higher success rate = more confident
        (executedLogs.length > 0 ? 20 : 0) // Has been executed before
      ));

      if (triggerCount >= 3) {
        suggestions.push({
          ruleId: rule.id,
          ruleName: rule.name,
          triggerCount,
          successRate: Math.round(successRate * 100),
          suggestion: triggerCount >= 5 && successRate >= 0.8
            ? `Regra "${rule.name}" disparou ${triggerCount}x em 2 semanas com ${Math.round(successRate * 100)}% de sucesso. Recomendamos torná-la automática (sem aprovação).`
            : `Regra "${rule.name}" disparou ${triggerCount}x em 2 semanas. Considere ajustar os parâmetros ou automatizar.`,
          confidence,
        });

        // Create notification for high-confidence suggestions
        if (confidence >= 70) {
          createInAppNotification(brandId, {
            type: 'automation',
            title: `Sugestão: Automatizar "${rule.name}"`,
            message: `Esta regra disparou ${triggerCount}x recentemente. Considere torná-la automática.`,
            ruleId: rule.id,
            isRead: false,
            createdAt: Timestamp.now(),
          }).catch(err => console.error('[Suggestions] Notification failed:', err));
        }
      }
    }

    return createApiSuccess({
      suggestions,
      totalRulesAnalyzed: rules.filter(r => r.isEnabled).length,
    });
  } catch (error) {
    console.error('[Automation Suggestions API]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
