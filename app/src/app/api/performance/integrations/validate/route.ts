export const dynamic = 'force-dynamic';
import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { handleSecurityError } from '@/lib/utils/api-security';
import { ensureFreshToken } from '@/lib/integrations/ads/token-refresh';
import { fetchWithRetry, sanitizeForLog } from '@/lib/integrations/ads/api-helpers';
import { META_API, GOOGLE_ADS_API } from '@/lib/integrations/ads/constants';

/**
 * POST /api/performance/integrations/validate
 * Valida uma chave de API antes de salvar. Suporta modo mock para validação inicial.
 * S30-FN-02: Substituído 501 por validação real (Meta GET /me, Google GET /customers).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, platform, apiKey, accountId, mock } = body;

    // Security check: brandId é obrigatório
    if (!brandId) {
      return createApiError(400, 'brandId é obrigatório para isolamento de dados.');
    }

    // Validação de campos obrigatórios
    if (!platform || !apiKey || !accountId) {
      return createApiError(400, 'Campos platform, apiKey e accountId são obrigatórios.');
    }

    try {
      await requireBrandAccess(req, brandId);
    } catch (error) {
      return handleSecurityError(error);
    }

    // Lógica de Mock para validação inicial (ST-18.2) — P-08: mock=true preservado
    if (mock === true || mock === 'true') {
      console.log(`[Mock] Validando integração ${platform} para brand ${brandId}`);
      
      await new Promise(resolve => setTimeout(resolve, 800));

      const isValid = apiKey.startsWith('sk_') || apiKey.startsWith('meta_') || apiKey === 'mock_key';

      if (isValid) {
        return createApiSuccess({
          message: `[Mock] Integração com ${platform} validada com sucesso.`
        });
      } else {
        return createApiError(401, `[Mock] Chave de API inválida para ${platform}.`);
      }
    }

    // ─── Validação real (S30-FN-02) ───

    if (platform === 'meta_ads' || platform === 'meta') {
      return await validateMetaIntegration(brandId, accountId);
    }

    if (platform === 'google_ads' || platform === 'google') {
      return await validateGoogleIntegration(brandId, accountId);
    }

    return createApiError(400, `Plataforma "${platform}" não suportada para validação.`);

  } catch (error) {
    console.error('[API Performance Validate] Erro:', error);
    return createApiError(500, 'Erro interno ao validar integração.');
  }
}

/**
 * Valida integração Meta: GET /me retorna user info se token válido.
 */
async function validateMetaIntegration(brandId: string, accountId: string) {
  try {
    const token = await ensureFreshToken(brandId, 'meta');
    
    const url = `${META_API.BASE_URL}/me?fields=id,name`;
    const response = await fetchWithRetry(url, {
      headers: { 'Authorization': `Bearer ${token.accessToken}` },
    }, { timeoutMs: META_API.TIMEOUT_MS });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData?.error?.message || response.statusText;
      console.error(`[Validate Meta] Failed for brand=${brandId}: ${errorMsg}`);
      
      // Persistir status de erro
      await persistValidationStatus(brandId, 'meta_ads', 'error');
      
      return createApiError(502, `Validação Meta falhou: ${errorMsg}`);
    }

    const userData = await response.json();
    console.log(`[Validate Meta] Success for brand=${brandId}: user=${userData.name || userData.id}`);

    // Persistir status de sucesso
    await persistValidationStatus(brandId, 'meta_ads', 'active');

    return createApiSuccess({
      message: `Integração com Meta validada com sucesso.`,
      details: { userId: userData.id, userName: userData.name },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Validate Meta] Error for brand=${brandId}:`, msg);
    await persistValidationStatus(brandId, 'meta_ads', 'error').catch(() => {});
    return createApiError(502, `Erro ao validar Meta: ${msg}`);
  }
}

/**
 * Valida integração Google: GET /customers/{id} retorna account info.
 * DT-11: Detecta Google developer token em modo test.
 */
async function validateGoogleIntegration(brandId: string, accountId: string) {
  try {
    const token = await ensureFreshToken(brandId, 'google');
    const metadata = token.metadata as Record<string, any>;
    const customerId = metadata?.customerId || accountId;
    const developerToken = metadata?.developerToken;

    if (!developerToken) {
      return createApiError(400, 'Google developer token não configurado no vault.');
    }

    const url = `${GOOGLE_ADS_API.BASE_URL}/customers/${customerId}`;
    const response = await fetchWithRetry(url, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
    }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = JSON.stringify(errorData?.error || errorData);
      
      // DT-11: Detectar developer token em modo test
      if (errorMsg.includes('DEVELOPER_TOKEN_NOT_APPROVED')) {
        await persistValidationStatus(brandId, 'google_ads', 'active');
        return createApiSuccess({
          message: 'Integração Google conectada (developer token em modo TEST — métricas limitadas).',
          warning: 'Google developer token está em modo test. Solicite aprovação para acesso completo.',
        });
      }

      console.error(`[Validate Google] Failed for brand=${brandId}: ${errorMsg}`);
      await persistValidationStatus(brandId, 'google_ads', 'error');
      return createApiError(502, `Validação Google falhou: ${errorMsg}`);
    }

    const accountData = await response.json();
    console.log(`[Validate Google] Success for brand=${brandId}: customer=${accountData.descriptiveName || customerId}`);

    await persistValidationStatus(brandId, 'google_ads', 'active');

    return createApiSuccess({
      message: 'Integração com Google Ads validada com sucesso.',
      details: { customerId, descriptiveName: accountData.descriptiveName },
    });

  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Validate Google] Error for brand=${brandId}:`, msg);
    await persistValidationStatus(brandId, 'google_ads', 'error').catch(() => {});
    return createApiError(502, `Erro ao validar Google: ${msg}`);
  }
}

/**
 * Persiste resultado da validação em brands/{brandId}/performance_configs (fire-and-forget).
 */
async function persistValidationStatus(
  brandId: string, 
  platform: 'meta_ads' | 'google_ads',
  status: 'active' | 'error' | 'disconnected'
) {
  try {
    const configRef = doc(db, 'brands', brandId, 'performance_configs', 'main');
    await setDoc(configRef, {
      [`integrations.${platform}.status`]: status,
      [`integrations.${platform}.lastValidated`]: Timestamp.now(),
      updatedAt: Timestamp.now(),
    }, { merge: true });
  } catch (err) {
    console.error(`[Validate] Failed to persist status for brand=${brandId}:`, err);
  }
}
