import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { MonaraTokenVault } from '@/lib/firebase/vault';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { META_API } from '@/lib/integrations/ads/constants';

/**
 * POST /api/integrations/meta/save-token
 * Saves a manually provided Meta access token (from Graph API Explorer or System User).
 * Validates the token against Graph API before saving.
 *
 * Body: { brandId, accessToken, adAccountId }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, accessToken, adAccountId } = body;

    if (!brandId || !accessToken || !adAccountId) {
      return createApiError(400, 'brandId, accessToken e adAccountId são obrigatórios.');
    }

    // Auth check
    await requireBrandAccess(req, brandId);

    // 1. Validate token by checking /me/permissions
    const permController = new AbortController();
    const permTimeout = setTimeout(() => permController.abort(), 10000);
    let permRes: Response;
    try {
      permRes = await fetch(
        `${META_API.BASE_URL}/me/permissions?access_token=${accessToken}`,
        { signal: permController.signal }
      );
    } finally {
      clearTimeout(permTimeout);
    }
    const permData = await permRes.json();

    if (permData.error) {
      return createApiError(400, `Token inválido: ${permData.error.message}`);
    }

    const permissions = (permData.data || []) as { permission: string; status: string }[];
    const grantedPerms = permissions.filter(p => p.status === 'granted').map(p => p.permission);
    const hasAdsRead = grantedPerms.includes('ads_read');
    const hasAdsManagement = grantedPerms.includes('ads_management');

    if (!hasAdsRead && !hasAdsManagement) {
      return createApiError(400,
        `Token não tem permissões de ads. Permissões encontradas: ${grantedPerms.join(', ') || 'nenhuma'}. ` +
        `Necessário: ads_read ou ads_management.`
      );
    }

    // 2. Validate ad account access
    const normalizedAdAccount = adAccountId.startsWith('act_') ? adAccountId.replace('act_', '') : adAccountId;
    const insightsController = new AbortController();
    const insightsTimeout = setTimeout(() => insightsController.abort(), 10000);
    let insightsCheck: Response;
    try {
      insightsCheck = await fetch(
        `${META_API.BASE_URL}/act_${normalizedAdAccount}?fields=name,account_status&access_token=${accessToken}`,
        { signal: insightsController.signal }
      );
    } finally {
      clearTimeout(insightsTimeout);
    }
    const insightsData = await insightsCheck.json();

    if (insightsData.error) {
      return createApiError(400, `Sem acesso à conta act_${normalizedAdAccount}: ${insightsData.error.message}`);
    }

    // 3. Save to vault
    const appId = process.env.META_APP_ID || '';

    await MonaraTokenVault.saveToken(brandId, {
      brandId,
      provider: 'meta',
      accessToken,
      expiresAt: Timestamp.fromMillis(Date.now() + 60 * 24 * 60 * 60 * 1000) as any, // 60 days
      scopes: grantedPerms,
      metadata: {
        adAccountId: `act_${normalizedAdAccount}`,
        appId,
      },
    });

    return createApiSuccess({
      message: 'Token salvo com sucesso!',
      adAccountName: insightsData.name || `act_${normalizedAdAccount}`,
      permissions: grantedPerms,
      hasAdsRead,
      hasAdsManagement,
    });
  } catch (error: any) {
    console.error('[Save Manual Token] Error:', error);
    if (error?.statusCode) {
      return createApiError(error.statusCode, error.message);
    }
    return createApiError(500, 'Erro ao salvar token manual.');
  }
}
