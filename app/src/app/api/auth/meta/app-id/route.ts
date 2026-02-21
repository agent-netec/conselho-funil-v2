export const dynamic = 'force-dynamic';

import { createApiSuccess, createApiError } from '@/lib/utils/api-response';

/**
 * GET /api/auth/meta/app-id
 * Returns the central META_APP_ID for OAuth flow.
 * This is a public value (same as client_id in OAuth URLs).
 */
export async function GET() {
  const appId = process.env.META_APP_ID;

  if (!appId) {
    return createApiError(500, 'META_APP_ID not configured');
  }

  return createApiSuccess({ appId });
}
