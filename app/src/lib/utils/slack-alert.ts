/**
 * R-3.4: Slack alert utility for critical errors.
 * Sends alerts to the configured SLACK_WEBHOOK_URL.
 */

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

type AlertSeverity = 'critical' | 'warning' | 'info';

interface AlertPayload {
  title: string;
  message: string;
  severity: AlertSeverity;
  route?: string;
  brandId?: string;
  error?: string;
}

const SEVERITY_EMOJI: Record<AlertSeverity, string> = {
  critical: ':rotating_light:',
  warning: ':warning:',
  info: ':information_source:',
};

export async function sendSlackAlert(payload: AlertPayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;

  const emoji = SEVERITY_EMOJI[payload.severity];
  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `${emoji} ${payload.title}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: payload.message },
    },
  ];

  const fields: string[] = [];
  if (payload.route) fields.push(`*Route:* ${payload.route}`);
  if (payload.brandId) fields.push(`*Brand:* ${payload.brandId}`);
  if (payload.error) fields.push(`*Error:* \`${payload.error.slice(0, 200)}\``);

  if (fields.length > 0) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: fields.join('\n') },
    });
  }

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    });
  } catch (e) {
    console.error('[SlackAlert] Failed to send:', e);
  }
}

/**
 * Quick helpers for common alert patterns
 */
export const alerts = {
  serverError(route: string, error: string, brandId?: string) {
    return sendSlackAlert({
      title: 'Server Error (500)',
      message: `API route returned 500 error`,
      severity: 'critical',
      route,
      error,
      brandId,
    });
  },
  authFailure(route: string, details: string) {
    return sendSlackAlert({
      title: 'Auth Failure',
      message: details,
      severity: 'warning',
      route,
    });
  },
  rateLimitHit(scope: string, brandId: string) {
    return sendSlackAlert({
      title: 'Rate Limit Hit',
      message: `Brand exceeded rate limit on scope \`${scope}\``,
      severity: 'info',
      brandId,
    });
  },
};
