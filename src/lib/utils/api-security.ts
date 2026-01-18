import { NextRequest, NextResponse } from 'next/server';
import { getUser } from '@/lib/firebase/firestore';

/**
 * Erro customizado para falhas de autenticação/autorização em APIs
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Verifica se o usuário tem a role 'admin'
 * Baseado no ID Token passado no header Authorization
 */
export async function verifyAdminRole(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Autenticação necessária (Bearer token ausente)');
  }

  const idToken = authHeader.split('Bearer ')[1];
  
  try {
    // Como não podemos usar firebase-admin no ambiente Windows 11 24H2 devido a restrições de sistema,
    // usamos a REST API do Firebase Auth para validar o token de forma segura no lado do servidor.
    const apiKey = (process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '').trim();
    
    if (!apiKey) {
      throw new ApiError(500, 'Configuração do Firebase ausente (API Key)');
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Firebase Auth REST API Error:', errorData);
      throw new ApiError(401, 'Token de autenticação inválido ou expirado');
    }

    const data = await response.json();
    const uid = data.users?.[0]?.localId;

    if (!uid) {
      throw new ApiError(401, 'Usuário não encontrado no provedor de auth');
    }

    // Busca a role no Firestore usando o UID validado
    const user = await getUser(uid);
    
    if (!user) {
      throw new ApiError(403, 'Perfil de usuário não encontrado no banco de dados');
    }

    if (user.role !== 'admin') {
      throw new ApiError(403, 'Acesso negado: Requer privilégios de administrador');
    }

    return user;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    
    console.error('Security Verification Error:', error);
    throw new ApiError(500, 'Erro interno na verificação de segurança');
  }
}

/**
 * Helper para padronizar a resposta de erro de segurança nas rotas Next.js
 */
export function handleSecurityError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status }
    );
  }
  
  console.error('Unhandled Security Error:', error);
  return NextResponse.json(
    { error: 'Erro de segurança não especificado' },
    { status: 500 }
  );
}
