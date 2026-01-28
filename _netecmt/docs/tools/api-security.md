# 🛡️ API Security Hardening (REST Auth)

Este documento descreve o mecanismo de segurança implementado para proteger as APIs de administração e rotas sensíveis do sistema, respeitando a restrição de NÃO usar `firebase-admin` no ambiente Windows.

## 🚀 Visão Geral

As rotas de API em `/api/admin/*` agora exigem obrigatoriamente um cabeçalho de autenticação Bearer com um ID Token válido do Firebase e a role `admin` atribuída ao usuário no Firestore.

## 🛠️ Implementação Técnico

- **Utilitário**: `app/src/lib/utils/api-security.ts`
- **Validação de Token**: Realizada via Firebase Auth REST API (`identitytoolkit.googleapis.com`).
- **Validação de Role**: Consulta direta ao Firestore (`users/{uid}`) para verificar o campo `role`.

### Exemplo de Uso (Servidor)

```typescript
import { verifyAdminRole, handleSecurityError } from '@/lib/utils/api-security';

export async function POST(request: NextRequest) {
  try {
    // 1. Verifica token e role 'admin'
    await verifyAdminRole(request);

    // 2. Lógica da rota...
  } catch (error) {
    // 3. Retorna erro padronizado (401, 403, 500)
    return handleSecurityError(error);
  }
}
```

## 👤 Responsabilidades

- **Monara (Integrator)**: Responsável pela manutenção do utilitário e integração com o provedor de auth.
- **Darllyson (Dev)**: Deve garantir que todas as novas rotas administrativas utilizem este padrão.

## 🛑 Bloqueios de Segurança

- Requisições sem o header `Authorization: Bearer <ID_TOKEN>` retornarão `401 Unauthorized`.
- Usuários autenticados mas sem a role `admin` no Firestore retornarão `403 Forbidden`.
- Erros na API do Firebase ou configurações ausentes retornarão `500 Internal Server Error`.

---
*NETECMT v2.0 | Segurança e Integridade em Primeiro Lugar*
