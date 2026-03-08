import type { Instrumentation } from 'next';

export async function register() {
  console.log('[MKTHONEY] Server instrumentation registered');
}

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  // Structured JSON log — captured automatically by Vercel Logs
  console.error(JSON.stringify({
    level: 'error',
    timestamp: new Date().toISOString(),
    message: error.message,
    digest: error.digest,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    request: {
      method: request.method,
      path: request.path,
      userAgent: request.headers['user-agent'],
    },
    context: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
      renderSource: context.renderSource,
    },
  }));

  // Slack alert for critical errors (when SLACK_WEBHOOK_URL is configured)
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const { alerts } = await import('@/lib/utils/slack-alert');
      await alerts.serverError(
        request.path,
        error.message
      );
    } catch {
      // Silent failure — don't throw while reporting errors
    }
  }
};
