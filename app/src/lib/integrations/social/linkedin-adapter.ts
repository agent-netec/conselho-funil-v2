/**
 * LinkedIn Adapter — Scaffold Minimo
 * Apenas vault check + GET /v2/me (health check).
 * Inbox real previsto para Sprint 34 (DT-05).
 *
 * @module lib/integrations/social/linkedin-adapter
 * @story S32-LI-01
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { decrypt } from '@/lib/utils/encryption';
import type { SocialInteraction } from '@/types/social-inbox';

const LINKEDIN_API_BASE = 'https://api.linkedin.com';

interface LinkedInCredentials {
  accessToken: string;
  organizationId?: string;
}

/**
 * Busca credentials do vault: brands/{brandId}/secrets/linkedin
 * Retorna null se nao encontradas.
 */
async function getCredentials(brandId: string): Promise<LinkedInCredentials | null> {
  try {
    const secretsRef = doc(db, 'brands', brandId, 'secrets', 'linkedin');
    const snap = await getDoc(secretsRef);
    if (!snap.exists()) {
      console.warn(`[LinkedInAdapter] No credentials found for brand ${brandId}`);
      return null;
    }
    const data = snap.data();
    return {
      accessToken: decrypt(data.accessToken),
      organizationId: data.organizationId,
    };
  } catch (error) {
    console.error(`[LinkedInAdapter] Failed to fetch credentials for brand ${brandId}:`, error);
    return null;
  }
}

/**
 * Health check: GET /v2/me
 * Valida que as credentials sao validas.
 */
export async function healthCheck(brandId: string): Promise<boolean> {
  const credentials = await getCredentials(brandId);
  if (!credentials) return false;

  try {
    const response = await fetch(`${LINKEDIN_API_BASE}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      signal: AbortSignal.timeout(10000),
    });
    return response.ok;
  } catch (error) {
    console.error(`[LinkedInAdapter] Health check failed for brand ${brandId}:`, error);
    return false;
  }
}

/**
 * Coleta interacoes LinkedIn — SCAFFOLD.
 * Retorna [] (inbox real previsto para Sprint 34).
 */
export async function collectLinkedInInteractions(brandId: string): Promise<SocialInteraction[]> {
  const credentials = await getCredentials(brandId);
  if (!credentials) {
    console.warn(`[LinkedInAdapter] No credentials — returning empty for brand ${brandId}`);
    return [];
  }

  // Scaffold: validar credentials via health check, mas retornar []
  const isHealthy = await healthCheck(brandId);
  if (!isHealthy) {
    console.warn(`[LinkedInAdapter] Health check failed — credentials may be invalid for brand ${brandId}`);
  }

  // TODO (Sprint 34): Implementar GET /v2/socialActions e /v2/ugcPosts para inbox real
  return [];
}
