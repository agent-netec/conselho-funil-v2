/**
 * @fileoverview Token Refresh Engine (S30-FN-01)
 * - ensureFreshToken(): busca token do vault, verifica expiração, refresh se necessário
 * - tokenToCredentials(): converte MonaraToken → AdCredentials (bridge function)
 *
 * Meta refresh: fb_exchange_token endpoint v21.0
 * Google refresh: oauth2.googleapis.com/token com refresh_token
 */

import { Timestamp } from 'firebase/firestore';
import { MonaraTokenVault, type MonaraToken, type MetaTokenMetadata, type GoogleTokenMetadata } from '@/lib/firebase/vault';
import { fetchWithRetry, sanitizeForLog } from './api-helpers';
import { META_API, GOOGLE_ADS_API } from './constants';
import type { AdCredentials, MetaAdCredentials, GoogleAdCredentials } from '@/lib/performance/adapters/base-adapter';

/**
 * Garante que o token para o provider está fresco. Se expirando, faz refresh e salva.
 * Chamada ANTES de qualquer request a API externa (no route handler, não dentro do adapter).
 *
 * @param brandId - ID da marca
 * @param provider - 'meta' | 'google'
 * @returns MonaraToken com accessToken válido
 */
export async function ensureFreshToken(
  brandId: string,
  provider: 'meta' | 'google'
): Promise<MonaraToken> {
  const token = await MonaraTokenVault.getToken(brandId, provider);
  if (!token) {
    throw new Error(`Token not found for brand ${brandId}, provider ${provider}`);
  }

  // Fast path: token ainda válido
  if (!MonaraTokenVault.isTokenExpiring(token, provider)) {
    return token;
  }

  console.log(`[TokenRefresh] Token expiring for brand=${brandId} provider=${provider} — refreshing...`);

  try {
    if (provider === 'meta') {
      return await refreshMetaToken(brandId, token);
    } else {
      return await refreshGoogleToken(brandId, token);
    }
  } catch (error) {
    // Graceful degradation: retorna token original (pode estar stale, mas tenta)
    console.error(`[TokenRefresh] Failed to refresh ${provider} token for brand ${brandId}:`, 
      error instanceof Error ? error.message : 'Unknown error');
    return token;
  }
}

/**
 * Meta token refresh via fb_exchange_token (long-lived → long-lived).
 * Endpoint: GET /oauth/access_token?grant_type=fb_exchange_token
 */
async function refreshMetaToken(brandId: string, token: MonaraToken): Promise<MonaraToken> {
  const metadata = token.metadata as MetaTokenMetadata;
  if (!metadata.appId || !metadata.appSecret) {
    throw new Error('Meta token refresh requires appId and appSecret in metadata');
  }

  const url = `${META_API.BASE_URL}/oauth/access_token?grant_type=fb_exchange_token&client_id=${metadata.appId}&client_secret=${encodeURIComponent(metadata.appSecret)}&fb_exchange_token=${encodeURIComponent(token.accessToken)}`;

  console.log(`[TokenRefresh] Meta refresh for brand=${brandId} endpoint=${sanitizeForLog(url)}`);

  const response = await fetchWithRetry(url, {
    method: 'GET',
  }, { timeoutMs: META_API.TIMEOUT_MS });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Meta token refresh failed: ${errorData?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  
  const refreshedToken: MonaraToken = {
    ...token,
    accessToken: data.access_token,
    expiresAt: Timestamp.fromMillis(Date.now() + (data.expires_in || 5184000) * 1000), // default 60 dias
    updatedAt: Timestamp.now(),
  };

  // Salvar token atualizado no vault
  await MonaraTokenVault.saveToken(brandId, refreshedToken);

  console.log(`[TokenRefresh] Meta token refreshed for brand=${brandId}`);
  return refreshedToken;
}

/**
 * Google token refresh via OAuth2 refresh_token → access_token.
 * Endpoint: POST https://oauth2.googleapis.com/token
 */
async function refreshGoogleToken(brandId: string, token: MonaraToken): Promise<MonaraToken> {
  const metadata = token.metadata as GoogleTokenMetadata;
  if (!metadata.clientId || !metadata.clientSecret || !token.refreshToken) {
    throw new Error('Google token refresh requires clientId, clientSecret in metadata and refreshToken');
  }

  console.log(`[TokenRefresh] Google refresh for brand=${brandId}`);

  const response = await fetchWithRetry(GOOGLE_ADS_API.TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: metadata.clientId,
      client_secret: metadata.clientSecret,
      refresh_token: token.refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  }, { timeoutMs: GOOGLE_ADS_API.TIMEOUT_MS });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Google token refresh failed: ${errorData?.error_description || response.statusText}`);
  }

  const data = await response.json();

  const refreshedToken: MonaraToken = {
    ...token,
    accessToken: data.access_token,
    expiresAt: Timestamp.fromMillis(Date.now() + (data.expires_in || 3600) * 1000), // default 1h
    updatedAt: Timestamp.now(),
  };

  // Salvar token atualizado no vault
  await MonaraTokenVault.saveToken(brandId, refreshedToken);

  console.log(`[TokenRefresh] Google token refreshed for brand=${brandId}`);
  return refreshedToken;
}

/**
 * Bridge function: converte MonaraToken → AdCredentials (union discriminada).
 * Usado nos route handlers para passar credenciais tipadas aos adapters.
 *
 * @param token - MonaraToken do vault (já decryptado)
 * @returns AdCredentials (MetaAdCredentials | GoogleAdCredentials)
 */
export function tokenToCredentials(token: MonaraToken): AdCredentials {
  if (token.provider === 'meta') {
    const meta = token.metadata as MetaTokenMetadata;
    return {
      platform: 'meta',
      accessToken: token.accessToken,
      adAccountId: meta.adAccountId,
      pixelId: meta.pixelId,
    } satisfies MetaAdCredentials;
  }

  if (token.provider === 'google') {
    const google = token.metadata as GoogleTokenMetadata;
    return {
      platform: 'google',
      accessToken: token.accessToken,
      developerToken: google.developerToken,
      customerId: google.customerId,
      managerAccountId: google.managerAccountId,
    } satisfies GoogleAdCredentials;
  }

  throw new Error(`Unsupported provider for credentials conversion: ${token.provider}`);
}
