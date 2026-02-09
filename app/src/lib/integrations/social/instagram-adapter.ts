/**
 * Instagram Graph API Adapter — REST puro via fetch()
 * Endpoints: GET /me/conversations, GET /{conversation-id}/messages
 * Token refresh reutiliza pattern Meta Ads (DT-04).
 * Degradacao graciosa: sem credentials = [] + log (DT-03).
 *
 * @module lib/integrations/social/instagram-adapter
 * @story S32-IG-01
 */

import { doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { decrypt, encrypt } from '@/lib/utils/encryption';
import type { SocialInteraction } from '@/types/social-inbox';

const IG_API_BASE = 'https://graph.instagram.com/v21.0';

interface InstagramCredentials {
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: number; // epoch ms
  pageId: string;
}

/**
 * Busca credentials do vault: brands/{brandId}/secrets/instagram
 * Retorna null se nao encontradas (degradacao graciosa — DT-03).
 */
async function getCredentials(brandId: string): Promise<InstagramCredentials | null> {
  try {
    const secretsRef = doc(db, 'brands', brandId, 'secrets', 'instagram');
    const snap = await getDoc(secretsRef);
    if (!snap.exists()) {
      console.warn(`[InstagramAdapter] No credentials found for brand ${brandId}`);
      return null;
    }
    const data = snap.data();
    return {
      accessToken: decrypt(data.accessToken),
      refreshToken: data.refreshToken ? decrypt(data.refreshToken) : undefined,
      tokenExpiresAt: data.tokenExpiresAt,
      pageId: data.pageId,
    };
  } catch (error) {
    console.error(`[InstagramAdapter] Failed to fetch credentials for brand ${brandId}:`, error);
    return null;
  }
}

/**
 * Refresh long-lived token via Instagram Graph API.
 * Pattern reutilizado do Meta Ads adapter (DT-04).
 * Persiste novo token no vault.
 */
async function refreshAccessToken(
  brandId: string,
  currentToken: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `${IG_API_BASE}/refresh_access_token?grant_type=ig_refresh_token&access_token=${currentToken}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!response.ok) {
      console.error(`[InstagramAdapter] Token refresh failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const newToken = data.access_token as string;
    const expiresIn = (data.expires_in as number) || 5184000; // default 60 dias

    // Persistir novo token no vault
    const secretsRef = doc(db, 'brands', brandId, 'secrets', 'instagram');
    await updateDoc(secretsRef, {
      accessToken: encrypt(newToken),
      tokenExpiresAt: Date.now() + expiresIn * 1000,
      updatedAt: Timestamp.now(),
    });

    return newToken;
  } catch (error) {
    console.error(`[InstagramAdapter] Token refresh error:`, error);
    return null;
  }
}

/**
 * Verifica se token esta expirado ou proximo de expirar (< 24h).
 */
function isTokenExpired(expiresAt?: number): boolean {
  if (!expiresAt) return false; // Sem info de expiracao, assumir valido
  const buffer = 24 * 60 * 60 * 1000; // 24h buffer
  return Date.now() > (expiresAt - buffer);
}

/**
 * Faz request autenticado para Instagram Graph API.
 * Se token expirado, tenta refresh 1x + retry (DT-04).
 */
async function authenticatedFetch(
  brandId: string,
  credentials: InstagramCredentials,
  url: string
): Promise<Response | null> {
  let token = credentials.accessToken;

  // Check token expiry — refresh se necessario
  if (isTokenExpired(credentials.tokenExpiresAt)) {
    const refreshed = await refreshAccessToken(brandId, token);
    if (refreshed) {
      token = refreshed;
    } else {
      console.warn('[InstagramAdapter] Token expired and refresh failed');
      return null;
    }
  }

  const separator = url.includes('?') ? '&' : '?';
  const response = await fetch(`${url}${separator}access_token=${token}`, {
    signal: AbortSignal.timeout(15000),
  });

  // Se 401, tentar refresh 1x + retry
  if (response.status === 401) {
    const refreshed = await refreshAccessToken(brandId, token);
    if (!refreshed) return null;

    const retryResponse = await fetch(`${url}${separator}access_token=${refreshed}`, {
      signal: AbortSignal.timeout(15000),
    });
    return retryResponse.ok ? retryResponse : null;
  }

  return response.ok ? response : null;
}

/**
 * Busca conversas do Instagram (DM inbox).
 * GET /me/conversations?platform=instagram
 */
export async function getConversations(brandId: string): Promise<SocialInteraction[]> {
  const credentials = await getCredentials(brandId);
  if (!credentials) return []; // Degradacao graciosa (DT-03)

  try {
    const response = await authenticatedFetch(
      brandId,
      credentials,
      `${IG_API_BASE}/${credentials.pageId}/conversations?platform=instagram&fields=id,participants,updated_time`
    );

    if (!response) return [];

    const data = await response.json();
    const conversations = data.data || [];

    // Para cada conversa, buscar mensagens recentes
    const interactions: SocialInteraction[] = [];
    for (const convo of conversations.slice(0, 20)) { // Limitar a 20 conversas
      const messages = await getMessages(brandId, credentials, convo.id);
      interactions.push(...messages);
    }

    return interactions;
  } catch (error) {
    console.error(`[InstagramAdapter] getConversations failed for brand ${brandId}:`, error);
    return []; // Degradacao graciosa
  }
}

/**
 * Busca mensagens de uma conversa especifica.
 * GET /{conversation-id}/messages
 * Mapeia para SocialInteraction[] com shape completo.
 */
async function getMessages(
  brandId: string,
  credentials: InstagramCredentials,
  conversationId: string
): Promise<SocialInteraction[]> {
  try {
    const response = await authenticatedFetch(
      brandId,
      credentials,
      `${IG_API_BASE}/${conversationId}/messages?fields=id,message,from,created_time`
    );

    if (!response) return [];

    const data = await response.json();
    const messages = data.data || [];

    return messages.map((msg: Record<string, unknown>): SocialInteraction => {
      const from = (msg.from as Record<string, unknown>) || {};
      const messageText = (msg.message as string) || '';
      const createdTime = (msg.created_time as string) || new Date().toISOString();

      return {
        id: `ig_${msg.id as string}`,
        externalId: msg.id as string,
        platform: 'instagram',
        type: 'dm',
        status: 'pending',
        author: {
          id: (from.id as string) || 'unknown',
          handle: (from.username as string) || '',
          name: (from.name as string) || 'Unknown',
          avatarUrl: undefined,
          isFollower: false,
        },
        content: {
          text: messageText,
          mediaUrls: [],
          timestamp: createdTime,
        },
        metadata: {
          sentimentScore: 0,
          sentimentLabel: 'neutral',
          requires_human_review: false,
          tags: [],
          priority: 0,
        },
        threadId: conversationId,
      };
    });
  } catch (error) {
    console.error(`[InstagramAdapter] getMessages failed for conversation ${conversationId}:`, error);
    return [];
  }
}

/**
 * Export principal: coleta todas as interacoes Instagram para um brand.
 */
export async function collectInstagramInteractions(brandId: string): Promise<SocialInteraction[]> {
  return getConversations(brandId);
}
