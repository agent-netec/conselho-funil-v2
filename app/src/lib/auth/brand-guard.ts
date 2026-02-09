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
import { db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { ApiError } from '@/lib/utils/api-security';

/**
 * Sanitiza um brandId removendo caracteres perigosos.
 * Permite apenas alfanuméricos, hífens e underscores.
 */
export function sanitizeBrandId(brandId: string): string {
  if (!brandId) return '';
  return brandId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 128);
}

interface BrandAccessResult {
  userId: string;
  brandId: string;
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

  // 3. Verificar se o usuário tem acesso à brand
  try {
    const brandRef = doc(db, 'brands', brandId);
    const brandSnap = await getDoc(brandRef);

    if (!brandSnap.exists()) {
      throw new ApiError(404, `Brand não encontrada: ${brandId}`);
    }

    const brandData = brandSnap.data();

    // Verificar ownership ou membership
    const isOwner = brandData.ownerId === userId;
    const isMember = Array.isArray(brandData.members) && brandData.members.includes(userId);

    if (!isOwner && !isMember) {
      throw new ApiError(403, 'Acesso negado: brandId não pertence ao usuário');
    }

    return { userId, brandId };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Erro ao verificar acesso à brand');
  }
}
