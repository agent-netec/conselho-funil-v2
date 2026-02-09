/**
 * Utilitário client-side para obter headers autenticados com Bearer token.
 * 
 * Usa o auth store (Zustand) para obter o Firebase ID Token do usuário logado
 * e incluí-lo no header Authorization.
 * 
 * Pode ser usado em qualquer componente ou função client-side que precise
 * fazer chamadas autenticadas para as API routes internas.
 * 
 * @example
 * ```ts
 * import { getAuthHeaders } from '@/lib/utils/auth-headers';
 * 
 * const headers = await getAuthHeaders();
 * const res = await fetch('/api/something', { method: 'POST', headers, body: ... });
 * ```
 */

import { useAuthStore } from '@/lib/stores/auth-store';

/**
 * Obtém os headers HTTP autenticados com Bearer token do Firebase Auth.
 * Sempre inclui Content-Type: application/json.
 * Se o usuário estiver logado, inclui Authorization: Bearer <idToken>.
 * 
 * @returns Headers prontos para uso em fetch()
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const user = useAuthStore.getState().user;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.warn('[getAuthHeaders] Falha ao obter token de auth:', error);
    }
  }

  return headers;
}
