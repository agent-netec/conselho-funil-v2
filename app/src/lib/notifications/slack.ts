/**
 * Slack Notification Helper — REST puro via fetch()
 * ZERO dependências npm (P-01).
 * Fire-and-forget: caller DEVE usar .catch() para não bloquear (P-10).
 *
 * @module lib/notifications/slack
 * @story S31-KS-02
 */

/**
 * Valida que a URL é um Slack Incoming Webhook legítimo.
 * Anti-SSRF: aceita APENAS https://hooks.slack.com/ e https://hooks.slack-gov.com/ (DT-08, PA-04).
 */
export function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'hooks.slack.com' || parsed.hostname === 'hooks.slack-gov.com')
    );
  } catch {
    return false;
  }
}

/**
 * Envia notificação para Slack via Incoming Webhook.
 * REST puro via fetch() — ZERO dependências npm (P-01).
 * Fire-and-forget: caller deve usar .catch() para não bloquear (P-10).
 *
 * @throws Error se o webhook retornar status != 200
 * @throws Error se URL for inválida (anti-SSRF)
 */
export async function sendSlackNotification(
  webhookUrl: string,
  payload: { text: string }
): Promise<void> {
  if (!isValidSlackWebhookUrl(webhookUrl)) {
    throw new Error('Invalid Slack webhook URL — must be https://hooks.slack.com/...');
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(5000), // 5s timeout
  });

  if (!response.ok) {
    throw new Error(`Slack webhook failed: ${response.status} ${response.statusText}`);
  }
}
