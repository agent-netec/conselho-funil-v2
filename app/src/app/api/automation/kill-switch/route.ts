export const dynamic = 'force-dynamic';

import { NextRequest } from 'next/server';
import { KillSwitchRequest } from '@/types/automation';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { createAutomationLog, createInAppNotification, setKillSwitchState } from '@/lib/firebase/automation';
import { sendSlackNotification, isValidSlackWebhookUrl } from '@/lib/notifications/slack';
import { requireBrandAccess } from '@/lib/auth/brand-guard'; // DT-01 FIX: path CORRETO
import { Timestamp } from 'firebase/firestore';

/**
 * Endpoint para disparar o Kill-Switch de tráfego.
 * POST /api/automation/kill-switch
 *
 * S31-KS-01: Persist no Firestore + notificações Slack e In-App.
 * Padrões Sigma: requireBrandAccess, createApiError/Success, Timestamp.
 */
export async function POST(req: NextRequest) {
  try {
    const body: KillSwitchRequest = await req.json();

    // 1. Validação básica
    if (!body.brandId || !body.funnelId || !body.affectedAdEntities?.length) {
      return createApiError(400, 'Missing required fields');
    }

    // 2. Auth: verificar acesso à brand (DT-01)
    await requireBrandAccess(req, body.brandId);

  // S34-FIX: Persistir estado do Kill-Switch (DT-11)
  try {
    await setKillSwitchState(body.brandId, true, body.reason);
  } catch (error) {
    console.error('[Kill-Switch] Falha ao persistir estado:', error);
  }

    // 3. Persistir logs para cada entidade afetada
    const logIds: string[] = [];
    for (const entity of body.affectedAdEntities) {
      const logId = await createAutomationLog(body.brandId, {
        ruleId: 'kill_switch_manual',
        action: 'pause_ads',
        status: 'pending_approval',
        context: {
          funnelId: body.funnelId,
          entityId: entity.externalId,
          gapDetails: {
            reason: body.reason,
            severity: body.severity,
            platform: entity.platform,
            type: entity.type,
          },
        },
        timestamp: Timestamp.now(), // P-08: Timestamp, NUNCA Date
      });
      logIds.push(logId);
    }

    // 4. Slack notification — fire-and-forget (P-10)
    const slackUrl = process.env.SLACK_WEBHOOK_URL;
    if (slackUrl && isValidSlackWebhookUrl(slackUrl)) {
      sendSlackNotification(slackUrl, {
        text: `*Kill-Switch Triggered*\nBrand: ${body.brandId}\nFunnel: ${body.funnelId}\nReason: ${body.reason}\nEntities: ${body.affectedAdEntities.length} ads affected`,
      }).catch(err => console.error('[Kill-Switch] Slack notification failed:', err));
    } else if (slackUrl) {
      console.warn('[Kill-Switch] Invalid Slack webhook URL — skipping notification');
    }

    // 5. In-App notification — fire-and-forget (P-10)
    createInAppNotification(body.brandId, {
      type: 'kill_switch',
      title: 'Kill-Switch Acionado',
      message: `${body.reason} — ${body.affectedAdEntities.length} entidades afetadas`,
      isRead: false,
      createdAt: Timestamp.now(),
    }).catch(err => console.error('[Kill-Switch] In-App notification failed:', err));

    return createApiSuccess({
      message: 'Kill-Switch registered. Pending human approval.',
      status: 'pending_approval',
      logsCreated: logIds.length,
      notifications: { slack: !!slackUrl, inApp: true },
    });
  } catch (error) {
    console.error('[Kill-Switch API Error]:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return createApiError(500, message);
  }
}
