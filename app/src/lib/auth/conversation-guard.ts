/**
 * Conversation Access Guard
 * Verifica se o usuário autenticado é dono da conversa solicitada.
 * Extrai userId do Bearer token via Firebase Auth REST API.
 *
 * Contrato:
 *  - Requer header Authorization: Bearer <idToken>
 *  - Retorna { userId } se autorizado
 *  - Lança ApiError(401) se token ausente/inválido
 *  - Lança ApiError(403) se userId não é dono da conversa
 *  - Lança ApiError(404) se conversa não encontrada
 *
 * [ARCH DT-01]: Categoria B — Conversation Auth (chat route)
 */

import { NextRequest } from 'next/server';
import { ApiError } from '@/lib/utils/api-security';
import { getAdminFirestore } from '@/lib/firebase/admin';

interface ConversationAccessResult {
  userId: string;
}

/**
 * Valida que o usuário autenticado é dono da conversa.
 *
 * @param req - NextRequest com header Authorization
 * @param conversationId - ID da conversa a ser acessada
 * @returns { userId } se autorizado
 * @throws ApiError(401) se autenticação falhar
 * @throws ApiError(403) se acesso negado
 * @throws ApiError(404) se conversa não encontrada
 */
export async function requireConversationAccess(
  req: NextRequest,
  conversationId: string
): Promise<ConversationAccessResult> {
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

  // 3. Verificar se a conversa existe e se o usuário é dono (via Admin SDK)
  try {
    const db = getAdminFirestore();
    const snap = await db.collection('conversations').doc(conversationId).get();

    if (!snap.exists) {
      throw new ApiError(404, 'Conversa não encontrada');
    }

    const data = snap.data();
    if (data?.userId !== userId) {
      throw new ApiError(403, 'Acesso negado: você não é o dono desta conversa');
    }

    return { userId };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, 'Erro ao verificar acesso à conversa');
  }
}
