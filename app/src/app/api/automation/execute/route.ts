export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { updateAutomationLogExecution } from '@/lib/firebase/automation';
import { Timestamp, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { GuardrailManager } from '@/lib/automation/adapters/guardrails';
import type { AutomationLog, AutomationRule } from '@/types/automation';

/**
 * POST /api/automation/execute
 * Executes an approved automation action via the appropriate ads adapter.
 * Body: { brandId: string, logId: string }
 *
 * @sprint W — W-3.3
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, logId } = body;

    if (!brandId || !logId) {
      return createApiError(400, 'Missing required fields: brandId, logId');
    }

    let userId = '';
    try {
      userId = (await requireBrandAccess(req, brandId)).userId;
    } catch (error) {
      return handleSecurityError(error);
    }

    // 1. Fetch the log
    const logRef = doc(db, 'brands', brandId, 'automation_logs', logId);
    const logSnap = await getDoc(logRef);
    if (!logSnap.exists()) {
      return createApiError(404, 'Automation log not found');
    }
    const logData = { id: logSnap.id, ...logSnap.data() } as AutomationLog;

    if (logData.status !== 'pending_approval') {
      return createApiError(400, `Log status is "${logData.status}", expected "pending_approval"`);
    }

    // 2. Fetch the rule to get action details
    const ruleRef = doc(db, 'brands', brandId, 'automation_rules', logData.ruleId);
    const ruleSnap = await getDoc(ruleRef);
    if (!ruleSnap.exists()) {
      return createApiError(404, 'Associated automation rule not found');
    }
    const rule = { id: ruleSnap.id, ...ruleSnap.data() } as AutomationRule;

    // 3. Check guardrails
    const entityId = logData.context.entityId;
    const guardrailCheck = GuardrailManager.canExecute(entityId, rule.action.type);
    if (!guardrailCheck.can) {
      await updateAutomationLogExecution(brandId, logId, {
        success: false,
        error: guardrailCheck.reason,
        timestamp: Timestamp.now(),
      }, userId);
      return createApiError(429, guardrailCheck.reason || 'Guardrail blocked');
    }

    // 4. Execute via appropriate adapter
    const platform = rule.action.params.platform || 'meta';
    let executionSuccess = false;
    let executionError: string | undefined;
    let externalId: string | undefined;

    try {
      if (platform === 'meta') {
        const { MetaAdsAdapter } = await import('@/lib/automation/adapters/meta');
        const adapter = new MetaAdsAdapter(brandId);

        if (rule.action.type === 'pause_ads') {
          const result = await adapter.pauseAdEntity(entityId, rule.action.params.targetLevel);
          executionSuccess = result.success;
          executionError = result.error?.message;
          externalId = result.externalId;
          GuardrailManager.recordResult(entityId, result.success);
        } else if (rule.action.type === 'adjust_budget' && rule.action.params.adjustmentValue) {
          const currentStatus = await adapter.getEntityStatus(entityId);
          const newBudget = currentStatus.currentBudget * (1 + rule.action.params.adjustmentValue / 100);
          const result = await adapter.adjustBudget(entityId, rule.action.params.targetLevel, newBudget);
          executionSuccess = result.success;
          executionError = result.error?.message;
          externalId = result.externalId;
          GuardrailManager.recordResult(entityId, result.success);
        } else if (rule.action.type === 'notify') {
          executionSuccess = true;
          externalId = entityId;
        }
      } else if (platform === 'google') {
        const { MonaraTokenVault } = await import('@/lib/firebase/vault');
        const tokenData = await MonaraTokenVault.getValidToken(brandId, 'google');
        const metadata = tokenData.metadata as { customerId?: string; developerToken?: string } | undefined;

        const { GoogleAdsAdapter } = await import('@/lib/automation/adapters/google');
        const adapter = new GoogleAdsAdapter(
          tokenData.accessToken,
          metadata?.developerToken || '',
          metadata?.customerId || ''
        );

        if (rule.action.type === 'pause_ads') {
          const result = await adapter.pauseAdEntity(entityId, rule.action.params.targetLevel);
          executionSuccess = result.success;
          executionError = result.error?.message;
          externalId = result.externalId;
          GuardrailManager.recordResult(entityId, result.success);
        } else if (rule.action.type === 'adjust_budget' && rule.action.params.adjustmentValue) {
          const currentStatus = await adapter.getEntityStatus(entityId);
          const newBudget = currentStatus.currentBudget * (1 + rule.action.params.adjustmentValue / 100);
          const result = await adapter.adjustBudget(entityId, rule.action.params.targetLevel, newBudget);
          executionSuccess = result.success;
          executionError = result.error?.message;
          externalId = result.externalId;
          GuardrailManager.recordResult(entityId, result.success);
        } else if (rule.action.type === 'notify') {
          executionSuccess = true;
          externalId = entityId;
        }
      }
    } catch (adapterError: any) {
      executionError = adapterError.message;
      executionSuccess = false;
    }

    // 5. Persist execution result
    await updateAutomationLogExecution(brandId, logId, {
      success: executionSuccess,
      externalId,
      platform,
      error: executionError,
      timestamp: Timestamp.now(),
    }, userId);

    if (!executionSuccess) {
      // DLQ: save failed execution for retry
      const { addDoc, collection: col } = await import('firebase/firestore');
      await addDoc(col(db, 'brands', brandId, 'dead_letter_queue'), {
        webhookType: platform,
        payload: JSON.stringify({ logId, ruleId: rule.id, entityId, action: rule.action.type }).substring(0, 10240),
        error: executionError || 'Unknown execution error',
        timestamp: Timestamp.now(),
        retryCount: 0,
        status: 'pending',
      }).catch(err => console.error('[Execute] DLQ save failed:', err));
    }

    return createApiSuccess({
      logId,
      executed: executionSuccess,
      platform,
      externalId,
      error: executionError,
    });
  } catch (error) {
    console.error('[Automation Execute API]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
