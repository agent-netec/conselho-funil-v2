/**
 * Brand Access Guard
 * Verifica se o usuário autenticado tem acesso à brand solicitada.
 * Extrai userId do Bearer token via Firebase Auth REST API.
 *
 * Contrato:
 *  - Requer header Authorization: Bearer <idToken>
 *  - Retorna { userId, brandId } se autorizado
 *  - Lança ApiError(401) se token ausente/inválido
 *  - Lança ApiError(403) se brandId não pertence ao usuário
 */

import { NextRequest } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { ApiError } from '@/lib/utils/api-security';
import { Tier, TIER_ORDER, TIER_LIMITS, getTierDisplayName } from '@/lib/tier-system';

/**
 * Sanitiza um brandId removendo caracteres perigosos.
 * Permite apenas alfanuméricos, hífens e underscores.
 */
export function sanitizeBrandId(brandId: string): string {
  if (!brandId) return '';
  return brandId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

/**
 * Valida que o request tem um usuário autenticado (sem verificar brand).
 * Útil para rotas user-level como api-keys, preferences, etc.
 *
 * @param req - NextRequest com header Authorization
 * @returns userId do usuário autenticado
 * @throws ApiError(401) se autenticação falhar
 */
export async function requireUser(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autenticação necessária (Bearer token ausente)');
  }

  const idToken = authHeader.split('Bearer ')[1];
  if (!idToken) {
    throw new ApiError(401, 'Token de autenticação vazio');
  }

  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
  if (!apiKey) {
    throw new ApiError(500, 'Configuração do Firebase ausente (API Key)');
  }

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      throw new ApiError(401, 'Token de autenticação inválido ou expirado');
    }

    const data = await response.json();
    const userId = data.users?.[0]?.localId;

    if (!userId) {
      throw new ApiError(401, 'Usuário não encontrado no provedor de auth');
    }

    return userId;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Falha na validação do token de autenticação');
  }
}

interface BrandAccessResult {
  userId: string;
  brandId: string;
  tier: Tier;
  effectiveTier: Tier;
}

/**
 * Computes effective tier considering trial expiration.
 * Trial ativo = pro. Trial expirado = free.
 */
function computeEffectiveTier(userData: Record<string, any>): Tier {
  const tier = (userData.tier as Tier) || 'trial';
  if (tier === 'trial') {
    const trialExpiresAt = userData.trialExpiresAt;
    if (trialExpiresAt) {
      const expiresDate = typeof trialExpiresAt.toDate === 'function'
        ? trialExpiresAt.toDate()
        : new Date(trialExpiresAt);
      if (expiresDate < new Date()) return 'free';
    }
    return 'pro'; // Trial ativo = Pro
  }
  return tier;
}

/**
 * Asserts that the user's effective tier meets the minimum required tier.
 * Throws ApiError(403) with a user-friendly upgrade message if not.
 */
export function requireMinTier(effectiveTier: Tier, minTier: Tier): void {
  if (TIER_ORDER[effectiveTier] < TIER_ORDER[minTier]) {
    const tierName = getTierDisplayName(minTier);
    throw new ApiError(
      403,
      `Essa feature requer o plano ${tierName}. Faça upgrade em /settings/billing`
    );
  }
}

/**
 * Valida que o usuário autenticado tem acesso à brand.
 *
 * @param req - NextRequest com header Authorization
 * @param brandId - ID da brand a ser acessada
 * @returns { userId, brandId } se autorizado
 * @throws ApiError(401) se autenticação falhar
 * @throws ApiError(403) se acesso negado
 */
export async function requireBrandAccess(
  req: NextRequest,
  brandId: string
): Promise<BrandAccessResult> {
  // 1. Extrair token do header
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autenticação necessária (Bearer token ausente)');
  }

  const idToken = authHeader.split('Bearer ')[1];

  if (!idToken) {
    throw new ApiError(401, 'Token de autenticação vazio');
  }

  // 2. Validar token via Firebase Auth REST API
  const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();

  if (!apiKey) {
    throw new ApiError(500, 'Configuração do Firebase ausente (API Key)');
  }

  let userId: string;

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      throw new ApiError(401, 'Token de autenticação inválido ou expirado');
    }

    const data = await response.json();
    userId = data.users?.[0]?.localId;

    if (!userId) {
      throw new ApiError(401, 'Usuário não encontrado no provedor de auth');
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(401, 'Falha na validação do token de autenticação');
  }

  // SEC-6: Sanitize brandId before any Firestore query
  const safeBrandId = sanitizeBrandId(brandId);
  if (!safeBrandId) {
    throw new ApiError(400, 'brandId inválido');
  }

  // 3. Verificar acesso à brand + carregar user doc em paralelo
  try {
    const adminDb = getAdminFirestore();
    const [brandSnap, userSnap] = await Promise.all([
      adminDb.collection('brands').doc(safeBrandId).get(),
      adminDb.collection('users').doc(userId).get(),
    ]);

    if (!brandSnap.exists) {
      throw new ApiError(404, `Brand não encontrada: ${brandId}`);
    }

    const brandData = brandSnap.data() as any;

    // Verificar ownership ou membership
    const isOwner = brandData.userId === userId || brandData.ownerId === userId;
    const isMember = Array.isArray(brandData.members) && brandData.members.includes(userId);

    if (!isOwner && !isMember) {
      throw new ApiError(403, 'Acesso negado: brandId não pertence ao usuário');
    }

    // Compute tier from user doc
    const userData = userSnap.exists ? (userSnap.data() as Record<string, any>) : {};
    const tier = (userData.tier as Tier) || 'trial';
    const effectiveTier = computeEffectiveTier(userData);

    return { userId, brandId: safeBrandId, tier, effectiveTier };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Erro ao verificar acesso à brand');
  }
}
