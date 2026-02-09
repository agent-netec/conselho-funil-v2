# Stories Distilled: Sprint 32 — Social Integration 2.0 + Rate Limiting
**Preparado por:** Leticia (SM)
**Data:** 08/02/2026
**Lanes:** rate_limiting + social_intelligence + operations_infrastructure (cross-cutting)
**Tipo:** Feature Sprint (Social & Rate Limiting)

> **IMPORTANTE:** Este documento incorpora os **8 Decision Topics (DTs)** e as resolucoes do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 2 blocking DTs (DT-01, DT-02) foram RESOLVIDOS e as correcoes estao embutidas nas stories.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess` (de `@/lib/auth/brand-guard`), `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`, REST puro via `fetch()` (zero SDK npm novo).

---

## Fase 1: Rate Limiting [~3h + Gate]

> **Sequencia:** RL-01 → RL-02 → **GATE CHECK 1**
>
> Esta fase implementa o rate limiter core com Firestore transactions e aplica nas 4 rotas criticas.

---

### S32-RL-01: Rate Limiter Core [M, ~1.5h]

**Objetivo:** Criar modulo `lib/middleware/rate-limiter.ts` com Higher-Order Function `withRateLimit(handler, config)` que protege rotas via Firestore transactions atomicas.

> **[ARCH DT-01 — P0, BLOCKING, RESOLVIDO]:** Rate limiter DEVE usar `runTransaction()` para evitar race conditions em contadores concorrentes. Read → check window → reset ou increment → reject se excedido — tudo dentro da mesma transacao.

**Acao:**
1. CRIAR `app/src/lib/middleware/rate-limiter.ts`:

```typescript
/**
 * Rate Limiter — HOF wrapper para rotas API
 * Usa Firestore transactions atomicas (DT-01 BLOCKING).
 * Firestore path: brands/{brandId}/rate_limits/{scope}
 *
 * @module lib/middleware/rate-limiter
 * @story S32-RL-01
 */

import { doc, runTransaction, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { createApiError } from '@/lib/utils/api-response';
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  maxRequests: number;   // Max requests na janela
  windowMs: number;      // Tamanho da janela em ms
  scope: string;         // Identificador unico (ex: 'chat', 'spy')
}

interface RateLimitDoc {
  count: number;
  windowStart: Timestamp;
}

/**
 * Extrai brandId do request (query param ou body).
 * Prioridade: query param > body.brandId
 */
function extractBrandId(req: NextRequest, body?: Record<string, unknown>): string | null {
  const fromQuery = req.nextUrl.searchParams.get('brandId');
  if (fromQuery) return fromQuery;
  if (body && typeof body.brandId === 'string') return body.brandId;
  return null;
}

/**
 * Higher-Order Function que aplica rate limiting a um handler de rota.
 *
 * Logica (dentro de runTransaction — DT-01):
 * 1. Read doc brands/{brandId}/rate_limits/{scope}
 * 2. Se doc nao existe OU window expirou → reset (count=1, windowStart=now)
 * 3. Se count >= maxRequests → reject 429
 * 4. Caso contrario → increment count
 *
 * @param handler - O handler original da rota
 * @param config - Configuracao de rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: unknown[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, ...args: unknown[]): Promise<NextResponse> => {
    // Clone request para ler body sem consumir stream
    let body: Record<string, unknown> | undefined;
    try {
      const cloned = req.clone();
      body = await cloned.json();
    } catch {
      // Body nao e JSON ou vazio — ok, tentar query param
    }

    const brandId = extractBrandId(req, body);
    if (!brandId) {
      // Sem brandId, nao aplica rate limit (rota publica ou sem contexto)
      return handler(req, ...args);
    }

    const rateLimitRef = doc(db, 'brands', brandId, 'rate_limits', config.scope);
    const now = Timestamp.now();

    try {
      const allowed = await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(rateLimitRef);

        if (!snap.exists()) {
          // Primeiro request — criar doc
          transaction.set(rateLimitRef, {
            count: 1,
            windowStart: now,
          });
          return true;
        }

        const data = snap.data() as RateLimitDoc;
        const windowAge = now.toMillis() - data.windowStart.toMillis();

        if (windowAge >= config.windowMs) {
          // Window expirou — reset
          transaction.update(rateLimitRef, {
            count: 1,
            windowStart: now,
          });
          return true;
        }

        if (data.count >= config.maxRequests) {
          // Rate limit excedido
          return false;
        }

        // Dentro do limite — increment
        transaction.update(rateLimitRef, {
          count: data.count + 1,
        });
        return true;
      });

      if (!allowed) {
        const retryAfterSeconds = Math.ceil(config.windowMs / 1000);
        const errorResponse = createApiError(429, 'Rate limit exceeded', {
          code: 'RATE_LIMIT_EXCEEDED',
          scope: config.scope,
          maxRequests: config.maxRequests,
          windowMs: config.windowMs,
        });
        errorResponse.headers.set('Retry-After', String(retryAfterSeconds));
        return errorResponse;
      }

      return handler(req, ...args);
    } catch (error) {
      console.error(`[RateLimiter] Transaction failed for scope=${config.scope}:`, error);
      // Em caso de falha na transaction, permitir request (fail open)
      return handler(req, ...args);
    }
  };
}
```

**Arquivos:**
- `app/src/lib/middleware/rate-limiter.ts` — **CRIAR**

**DTs referenciados:** DT-01 (BLOCKING — RESOLVIDO: usa `runTransaction()`)
**Dependencias:** Nenhuma (modulo novo)
**Gate Check:** S32-GATE-01 (Sim)

**AC:**
- [ ] `withRateLimit(handler, config)` exportado como HOF
- [ ] Config aceita `{ maxRequests, windowMs, scope }`
- [ ] Firestore path: `brands/{brandId}/rate_limits/{scope}`
- [ ] Usa `runTransaction()` para atomicidade (DT-01 BLOCKING)
- [ ] Transacao: read → check window → reset ou increment → reject
- [ ] Resposta 429 via `createApiError(429, 'Rate limit exceeded', { code: 'RATE_LIMIT_EXCEEDED' })`
- [ ] Header `Retry-After` presente na resposta 429
- [ ] `brandId` extraido do request (query param ou body)
- [ ] Fail open: se transaction falhar, request passa
- [ ] `Timestamp` (nao `Date`) — P-08
- [ ] `npx tsc --noEmit` = 0

---

### S32-RL-02: Aplicar Rate Limiter nas 4 Rotas + Testes [M, ~1.5h]

**Objetivo:** Aplicar `withRateLimit()` nas 4 rotas de maior consumo e criar testes unitarios para o rate limiter.

> **[ARCH DT-02 — P0, BLOCKING, RESOLVIDO]:** Import path de `requireBrandAccess` deve ser `@/lib/auth/brand-guard` (NAO `@/lib/guards/auth`).

**Acao:**
1. APLICAR `withRateLimit()` nas seguintes rotas:

   **a) `/api/chat/route.ts`** — 30 req/min:
   ```typescript
   import { withRateLimit } from '@/lib/middleware/rate-limiter';
   
   const rateLimitedPOST = withRateLimit(originalPOST, {
     maxRequests: 30,
     windowMs: 60_000,
     scope: 'chat',
   });
   
   export { rateLimitedPOST as POST };
   ```

   **b) `/api/intelligence/audience/scan/route.ts`** — 10 req/min:
   ```typescript
   import { withRateLimit } from '@/lib/middleware/rate-limiter';
   
   const rateLimitedPOST = withRateLimit(originalPOST, {
     maxRequests: 10,
     windowMs: 60_000,
     scope: 'audience_scan',
   });
   
   export { rateLimitedPOST as POST };
   ```

   **c) `/api/performance/metrics/route.ts`** — 60 req/min:
   ```typescript
   import { withRateLimit } from '@/lib/middleware/rate-limiter';
   
   const rateLimitedGET = withRateLimit(originalGET, {
     maxRequests: 60,
     windowMs: 60_000,
     scope: 'performance_metrics',
   });
   
   export { rateLimitedGET as GET };
   ```

   **d) `/api/intelligence/spy/route.ts`** — 5 req/min:
   ```typescript
   import { withRateLimit } from '@/lib/middleware/rate-limiter';
   
   const rateLimitedPOST = withRateLimit(originalPOST, {
     maxRequests: 5,
     windowMs: 60_000,
     scope: 'spy',
   });
   
   export { rateLimitedPOST as POST };
   ```

2. CRIAR testes em `app/src/__tests__/lib/middleware/rate-limiter.test.ts`:
   - Teste (1): request dentro do limite — handler executado normalmente
   - Teste (2): request que excede limite — retorna 429 com `Retry-After`
   - Teste (3): window reset — apos expirar windowMs, contador reseta
   - Teste (4): isolamento brandId — brands diferentes tem contadores independentes
   - Mock de `firebase/firestore` (`runTransaction`, `doc`, `Timestamp`)

**Arquivos:**
- `app/src/app/api/chat/route.ts` — **MODIFICAR** (adicionar withRateLimit)
- `app/src/app/api/intelligence/audience/scan/route.ts` — **MODIFICAR** (adicionar withRateLimit)
- `app/src/app/api/performance/metrics/route.ts` — **MODIFICAR** (adicionar withRateLimit)
- `app/src/app/api/intelligence/spy/route.ts` — **MODIFICAR** (adicionar withRateLimit)
- `app/src/__tests__/lib/middleware/rate-limiter.test.ts` — **CRIAR** (testes)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/middleware/rate-limiter.ts` — withRateLimit (criado em RL-01)
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess (referencia de import path — DT-02)

**DTs referenciados:** DT-02 (BLOCKING — RESOLVIDO: import de `@/lib/auth/brand-guard`)
**Dependencias:** S32-RL-01 concluido (withRateLimit existe)
**Gate Check:** S32-GATE-01 (Sim)

**AC:**
- [ ] `/api/chat` protegido com 30 req/min
- [ ] `/api/intelligence/audience/scan` protegido com 10 req/min
- [ ] `/api/performance/metrics` protegido com 60 req/min
- [ ] `/api/intelligence/spy` protegido com 5 req/min
- [ ] Import path correto: `@/lib/auth/brand-guard` (DT-02 — NAO `@/lib/guards/auth`)
- [ ] Teste (1): dentro do limite — handler executa
- [ ] Teste (2): excede limite — retorna 429 com `Retry-After`
- [ ] Teste (3): window reset funcional
- [ ] Teste (4): isolamento brandId
- [ ] 4+ testes passando
- [ ] `npx tsc --noEmit` = 0

---

### S32-GATE-01: Gate Check 1 — Rate Limiting [XS, ~15min] — GATE

**Objetivo:** Validar que o rate limiter esta funcional e aplicado nas 4 rotas. **Fase 2 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | Rate limiter criado | `rg "withRateLimit" app/src/lib/middleware/rate-limiter.ts` | 1+ match |
| G1-02 | runTransaction usado | `rg "runTransaction" app/src/lib/middleware/rate-limiter.ts` | 1+ match |
| G1-03 | Chat protegido | `rg "withRateLimit" app/src/app/api/chat/route.ts` | 1+ match |
| G1-04 | Audience scan protegido | `rg "withRateLimit" app/src/app/api/intelligence/audience/scan/route.ts` | 1+ match |
| G1-05 | Performance metrics protegido | `rg "withRateLimit" app/src/app/api/performance/metrics/route.ts` | 1+ match |
| G1-06 | Spy protegido | `rg "withRateLimit" app/src/app/api/intelligence/spy/route.ts` | 1+ match |
| G1-07 | Retry-After header | `rg "Retry-After" app/src/lib/middleware/rate-limiter.ts` | 1+ match |
| G1-08 | Testes rate limiter | `rg "rate-limiter" app/src/__tests__/lib/middleware/rate-limiter.test.ts` | 1+ match |
| G1-09 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G1-10 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-10 todos aprovados.

**AC:**
- [ ] G1-01 a G1-10 todos aprovados
- [ ] Baseline intacto: tsc=0, testes passam

---

## Fase 2: Instagram Graph API [~3.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S32-GATE-01 aprovado.
>
> **Sequencia:** IG-01 → IG-02 → **GATE CHECK 2**
>
> Esta fase implementa o adapter Instagram via REST puro e integra ao InboxAggregator.

---

### S32-IG-01: Instagram Adapter [L, ~2.5h]

**Objetivo:** Criar `lib/integrations/social/instagram-adapter.ts` com REST puro via `fetch()` para Instagram Graph API v21.0. Busca credentials no vault, implementa token refresh e degradacao graciosa.

> **[ARCH DT-03]:** Credentials armazenadas em `brands/{brandId}/secrets` chave `instagram`. Buscar via `getDoc()`.
> **[ARCH DT-04]:** Token refresh reutiliza pattern do Meta Ads adapter (S30). Long-lived token exchange via Graph API.

**Acao:**
1. CRIAR `app/src/lib/integrations/social/instagram-adapter.ts`:

```typescript
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
 * Busca credentials do vault: brands/{brandId}/secrets.instagram
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

    return messages.map((msg: Record<string, unknown>) => ({
      id: msg.id as string,
      platform: 'instagram' as const,
      type: 'dm' as const,
      content: (msg.message as string) || '',
      author: {
        id: (msg.from as Record<string, unknown>)?.id as string || 'unknown',
        name: (msg.from as Record<string, unknown>)?.name as string || 'Unknown',
        username: (msg.from as Record<string, unknown>)?.username as string || '',
      },
      timestamp: new Date(msg.created_time as string).toISOString(),
      conversationId,
      brandId,
    })) as SocialInteraction[];
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
```

**Arquivos:**
- `app/src/lib/integrations/social/instagram-adapter.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/automation/adapters/meta.ts` — referencia pattern REST + token refresh
- `app/src/lib/utils/encryption.ts` — encrypt/decrypt pattern
- `app/src/lib/firebase/config.ts` — db
- `app/src/types/social-inbox.ts` — SocialInteraction

**DTs referenciados:** DT-03 (vault lookup), DT-04 (token refresh pattern)
**Dependencias:** Nenhuma (modulo novo)
**Gate Check:** S32-GATE-02 (Sim)

**AC:**
- [ ] Adapter exportado com `collectInstagramInteractions(brandId)`
- [ ] REST puro via `fetch()` — zero SDK npm
- [ ] Instagram Graph API v21.0
- [ ] Credentials buscadas em `brands/{brandId}/secrets` chave `instagram` (DT-03)
- [ ] Sem credentials = retorna `[]` + log (degradacao graciosa)
- [ ] Token refresh via Graph API endpoint (DT-04)
- [ ] Token expired = refresh 1x + retry
- [ ] 401 response = refresh 1x + retry
- [ ] Mapeia output para `SocialInteraction[]`
- [ ] `AbortSignal.timeout()` em todos os fetch calls
- [ ] `npx tsc --noEmit` = 0

---

### S32-IG-02: Integracao InboxAggregator + Testes [S+, ~1h]

**Objetivo:** Atualizar `collectFromInstagram()` em `inbox-aggregator.ts` para usar o novo InstagramAdapter. Eliminar TODO da linha 57.

**Acao:**
1. Em `app/src/lib/agents/engagement/inbox-aggregator.ts`:
   - ADICIONAR import:
     ```typescript
     import { collectInstagramInteractions } from '@/lib/integrations/social/instagram-adapter';
     ```
   - SUBSTITUIR TODO (L57 aproximado) por chamada real:
     ```typescript
     // ANTES (TODO):
     // TODO: implement Instagram DM collection
     // return [];
     
     // DEPOIS:
     return collectInstagramInteractions(brandId);
     ```
   - Garantir que o metodo `collectFromInstagram(brandId)` agora chama o adapter

2. CRIAR testes em `app/src/__tests__/lib/integrations/instagram-adapter.test.ts`:
   - Teste (1): sem credentials retorna `[]` (degradacao graciosa)
   - Teste (2): com credentials mock, valida que fetch e chamado com URL correta
   - Mock de `firebase/firestore` (getDoc, updateDoc)
   - Mock de `global.fetch`

**Arquivos:**
- `app/src/lib/agents/engagement/inbox-aggregator.ts` — **MODIFICAR** (substituir TODO L57)
- `app/src/__tests__/lib/integrations/instagram-adapter.test.ts` — **CRIAR** (testes)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/integrations/social/instagram-adapter.ts` — collectInstagramInteractions (criado em IG-01)
- `app/src/types/social-inbox.ts` — SocialInteraction

**DTs referenciados:** Nenhum
**Dependencias:** S32-IG-01 concluido (adapter existe)
**Gate Check:** S32-GATE-02 (Sim)

**AC:**
- [ ] TODO da linha ~57 eliminado em `inbox-aggregator.ts`
- [ ] `collectFromInstagram()` agora chama `collectInstagramInteractions(brandId)`
- [ ] Teste (1): sem credentials retorna `[]`
- [ ] Teste (2): com credentials mock valida fetch path
- [ ] Testes passando
- [ ] `npx tsc --noEmit` = 0

---

### S32-GATE-02: Gate Check 2 — Instagram Adapter [XS, ~15min] — GATE

**Objetivo:** Validar que o Instagram Adapter esta funcional e integrado ao InboxAggregator. **Fase 3 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | Instagram adapter criado | `rg "collectInstagramInteractions" app/src/lib/integrations/social/instagram-adapter.ts` | 1+ match |
| G2-02 | Vault lookup | `rg "brands.*secrets.*instagram" app/src/lib/integrations/social/instagram-adapter.ts` | 1+ match |
| G2-03 | Token refresh | `rg "refresh_access_token" app/src/lib/integrations/social/instagram-adapter.ts` | 1+ match |
| G2-04 | Degradacao graciosa | `rg "return \[\]" app/src/lib/integrations/social/instagram-adapter.ts` | 2+ matches |
| G2-05 | TODO eliminado no aggregator | `rg "TODO.*Instagram\|TODO.*instagram" app/src/lib/agents/engagement/inbox-aggregator.ts` | 0 matches |
| G2-06 | Aggregator usa adapter | `rg "collectInstagramInteractions" app/src/lib/agents/engagement/inbox-aggregator.ts` | 1+ match |
| G2-07 | Testes Instagram | `rg "instagram-adapter" app/src/__tests__/lib/integrations/instagram-adapter.test.ts` | 1+ match |
| G2-08 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G2-09 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 3 so inicia se G2-01 a G2-09 todos aprovados.

**AC:**
- [ ] G2-01 a G2-09 todos aprovados

---

## Fase 3: LinkedIn Scaffold + Response Engine [~4h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S32-GATE-02 aprovado.
>
> **Sequencia:** LI-01 (paralelo com RE-01) → RE-01 → RE-02 → **GATE CHECK 3**
>
> S32-LI-01 e S32-RE-01 podem ser desenvolvidos em paralelo (sem dependencia mutua).

---

### S32-LI-01: LinkedIn Adapter Scaffold [S, ~1h]

**Objetivo:** Criar scaffold minimo do LinkedIn Adapter com vault check e health check via `GET /v2/me`. Sem inbox real — apenas valida credentials e retorna `[]`. Atualizar `collectFromLinkedIn()` no aggregator.

> **[ARCH DT-05]:** LinkedIn API v2 requer OAuth 2.0 3-legged. Scaffold minimo: vault check + health check. Inbox real previsto para Sprint 34.

**Acao:**
1. CRIAR `app/src/lib/integrations/social/linkedin-adapter.ts`:

```typescript
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
 * Busca credentials do vault: brands/{brandId}/secrets.linkedin
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
```

2. Em `app/src/lib/agents/engagement/inbox-aggregator.ts`:
   - ADICIONAR import:
     ```typescript
     import { collectLinkedInInteractions } from '@/lib/integrations/social/linkedin-adapter';
     ```
   - SUBSTITUIR TODO (L47 aproximado) por chamada real:
     ```typescript
     // ANTES (TODO):
     // TODO: implement LinkedIn message collection
     // return [];
     
     // DEPOIS:
     return collectLinkedInInteractions(brandId);
     ```

**Arquivos:**
- `app/src/lib/integrations/social/linkedin-adapter.ts` — **CRIAR**
- `app/src/lib/agents/engagement/inbox-aggregator.ts` — **MODIFICAR** (substituir TODO L47)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/utils/encryption.ts` — decrypt pattern
- `app/src/lib/firebase/config.ts` — db
- `app/src/types/social-inbox.ts` — SocialInteraction

**DTs referenciados:** DT-05 (scaffold minimo, inbox Sprint 34)
**Dependencias:** Nenhuma (pode ser paralelo com RE-01)
**Gate Check:** S32-GATE-03 (Sim)

**AC:**
- [ ] Adapter scaffold criado com `collectLinkedInInteractions(brandId)`
- [ ] Vault check em `brands/{brandId}/secrets` chave `linkedin`
- [ ] `GET /v2/me` como health check (DT-05)
- [ ] Sem credentials = retorna `[]` + log
- [ ] Retorna `[]` (scaffold — inbox real Sprint 34)
- [ ] TODO da linha ~47 eliminado em `inbox-aggregator.ts`
- [ ] `collectFromLinkedIn()` agora chama `collectLinkedInInteractions(brandId)`
- [ ] `npx tsc --noEmit` = 0

---

### S32-RE-01: Social Response Engine [M+, ~2h]

**Objetivo:** Criar `lib/agents/engagement/response-engine.ts` com funcao `generateSocialResponse()`. Redesenhar `SOCIAL_RESPONSE_PROMPT` em `social-generation.ts` (remover @stub/@todo). Output JSON validado com Zod.

> **[ARCH DT-06]:** Usar `generateWithGemini()` com `responseMimeType: 'application/json'` para garantir output JSON valido.
> **[ARCH DT-07]:** RAG context = brand voice guidelines do BrandKit. SEM historico de autor (privacy concern). Buscar via `getBrandKit(brandId)`.

**Acao:**
1. Em `app/src/lib/ai/prompts/social-generation.ts`:
   - REDESENHAR `SOCIAL_RESPONSE_PROMPT`:
     - REMOVER qualquer `@stub`, `@todo`, `// stub`, `// TODO`
     - Prompt estruturado com:
       - **Interaction Context**: plataforma, tipo, conteudo, autor
       - **Brand Voice Guidelines**: tom, personalidade, vocabulario (do BrandKit)
       - **Output Format**: JSON com `options[].text`, `options[].tone`, `options[].confidence`
   - Exemplo de prompt redesenhado:
     ```typescript
     export const SOCIAL_RESPONSE_PROMPT = `You are a social media engagement specialist.
     
     ## Interaction Context
     Platform: {platform}
     Type: {type}
     Content: {content}
     Author: {authorName}
     
     ## Brand Voice Guidelines
     {brandVoiceGuidelines}
     
     ## Instructions
     Generate 3 response options for this social media interaction.
     Each option should have a different tone while staying consistent with the brand voice.
     
     ## Output Format (JSON)
     {
       "options": [
         {
           "text": "Response text here",
           "tone": "friendly|professional|casual|empathetic|witty",
           "confidence": 0.0-1.0
         }
       ]
     }
     
     IMPORTANT:
     - Stay within the brand voice guidelines
     - Be contextually appropriate for the platform
     - Generate exactly 3 options with different tones
     - Confidence reflects how well the response matches the brand voice (0.0-1.0)
     `;
     ```

2. CRIAR `app/src/lib/agents/engagement/response-engine.ts`:

```typescript
/**
 * Social Response Engine
 * Gera sugestoes de resposta para interacoes sociais usando Gemini + Brand Voice.
 *
 * @module lib/agents/engagement/response-engine
 * @story S32-RE-01
 */

import { z } from 'zod';
import { generateWithGemini } from '@/lib/ai/gemini';
import { SOCIAL_RESPONSE_PROMPT } from '@/lib/ai/prompts/social-generation';
import type { SocialInteraction, BrandVoiceSuggestion } from '@/types/social-inbox';

// Zod schema para validar output do Gemini
const ResponseOptionSchema = z.object({
  text: z.string().min(1),
  tone: z.enum(['friendly', 'professional', 'casual', 'empathetic', 'witty']),
  confidence: z.number().min(0).max(1),
});

const GeminiResponseSchema = z.object({
  options: z.array(ResponseOptionSchema).min(1).max(5),
});

/**
 * Busca brand voice guidelines do BrandKit.
 * RAG context = APENAS voice guidelines (DT-07 — sem historico de autor).
 */
async function getBrandVoiceContext(brandId: string): Promise<string> {
  try {
    // Import dinamico para evitar circular deps
    const { getBrandKit } = await import('@/lib/firebase/scoped-data');
    const kit = await getBrandKit(brandId);
    
    if (!kit) return 'No brand voice guidelines available. Use a professional, helpful tone.';
    
    const parts: string[] = [];
    if (kit.voiceTone) parts.push(`Tone: ${kit.voiceTone}`);
    if (kit.personality) parts.push(`Personality: ${kit.personality}`);
    if (kit.vocabulary) parts.push(`Vocabulary: ${Array.isArray(kit.vocabulary) ? kit.vocabulary.join(', ') : kit.vocabulary}`);
    if (kit.avoidWords) parts.push(`Avoid: ${Array.isArray(kit.avoidWords) ? kit.avoidWords.join(', ') : kit.avoidWords}`);
    
    return parts.length > 0
      ? parts.join('\n')
      : 'No specific brand voice defined. Use a professional, helpful tone.';
  } catch (error) {
    console.error('[ResponseEngine] Failed to fetch brand voice context:', error);
    return 'No brand voice guidelines available. Use a professional, helpful tone.';
  }
}

/**
 * Gera sugestoes de resposta para uma interacao social.
 * Usa Gemini com responseMimeType: 'application/json' (DT-06).
 * Valida output com Zod schema.
 * Fallback: se parse falhar, gera sugestao generica com confidence: 0.5.
 *
 * @param interaction - A interacao social para responder
 * @param brandId - ID da marca (para buscar voice guidelines — DT-07)
 * @returns BrandVoiceSuggestion com opcoes de resposta
 */
export async function generateSocialResponse(
  interaction: SocialInteraction,
  brandId: string
): Promise<BrandVoiceSuggestion> {
  const brandVoiceGuidelines = await getBrandVoiceContext(brandId);

  const filledPrompt = SOCIAL_RESPONSE_PROMPT
    .replace('{platform}', interaction.platform || 'unknown')
    .replace('{type}', interaction.type || 'message')
    .replace('{content}', interaction.content || '')
    .replace('{authorName}', interaction.author?.name || 'Unknown')
    .replace('{brandVoiceGuidelines}', brandVoiceGuidelines);

  try {
    const result = await generateWithGemini(filledPrompt, {
      responseMimeType: 'application/json',
    });

    const rawText = typeof result === 'string' ? result : result?.text || '';
    const parsed = JSON.parse(rawText);
    const validated = GeminiResponseSchema.parse(parsed);

    return {
      interactionId: interaction.id,
      options: validated.options,
      generatedAt: new Date().toISOString(),
      brandId,
    };
  } catch (error) {
    console.error('[ResponseEngine] Gemini response parse failed, using fallback:', error);
    
    // Fallback: sugestao generica com confidence 0.5
    return {
      interactionId: interaction.id,
      options: [
        {
          text: 'Thank you for reaching out! We appreciate your message and will get back to you shortly.',
          tone: 'professional' as const,
          confidence: 0.5,
        },
        {
          text: 'Hi there! Thanks for your message. How can we help you today?',
          tone: 'friendly' as const,
          confidence: 0.5,
        },
        {
          text: 'Hey! Got your message. Let me look into that for you.',
          tone: 'casual' as const,
          confidence: 0.5,
        },
      ],
      generatedAt: new Date().toISOString(),
      brandId,
    };
  }
}
```

**Arquivos:**
- `app/src/lib/agents/engagement/response-engine.ts` — **CRIAR**
- `app/src/lib/ai/prompts/social-generation.ts` — **MODIFICAR** (redesenhar SOCIAL_RESPONSE_PROMPT)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/gemini.ts` — generateWithGemini
- `app/src/lib/firebase/scoped-data.ts` — getBrandKit (para voice guidelines)
- `app/src/types/social-inbox.ts` — SocialInteraction, BrandVoiceSuggestion
- `app/src/components/social-inbox/response-editor.tsx` — UI que consome BrandVoiceSuggestion

**DTs referenciados:** DT-06 (Gemini JSON output), DT-07 (RAG = brand voice, sem historico)
**Dependencias:** Nenhuma (pode ser paralelo com LI-01)
**Gate Check:** S32-GATE-03 (Sim)

**AC:**
- [ ] `generateSocialResponse(interaction, brandId)` exportado
- [ ] Retorna `BrandVoiceSuggestion` com `options[].text`, `options[].tone`, `options[].confidence`
- [ ] `SOCIAL_RESPONSE_PROMPT` redesenhado — zero `@stub`, `@todo`
- [ ] Prompt inclui: Interaction Context, Brand Voice Guidelines, Output Format (JSON)
- [ ] Usa `generateWithGemini()` com `responseMimeType: 'application/json'` (DT-06)
- [ ] RAG context = brand voice guidelines do BrandKit (DT-07)
- [ ] SEM historico de autor (DT-07 — privacy)
- [ ] Zod schema valida output do Gemini (`GeminiResponseSchema`)
- [ ] Fallback: se parse falhar, gera sugestao generica com confidence: 0.5
- [ ] `npx tsc --noEmit` = 0

---

### S32-RE-02: Wiring API social-inbox + Testes [S, ~1h]

**Objetivo:** Atualizar `/api/social-inbox/route.ts` para chamar o Response Engine e gerar sugestoes reais para a interacao selecionada.

**Acao:**
1. Em `app/src/app/api/social-inbox/route.ts`:
   - ADICIONAR import:
     ```typescript
     import { generateSocialResponse } from '@/lib/agents/engagement/response-engine';
     ```
   - MODIFICAR logica para gerar sugestoes reais:
     - Identificar interacao selecionada (via `interactionId` no body)
     - Chamar `generateSocialResponse(selectedInteraction, brandId)`
     - Retornar sugestoes no response
   - Garantir que sugestoes sao geradas para a interacao selecionada (nao apenas para a primeira)

2. CRIAR testes em `app/src/__tests__/lib/agents/response-engine.test.ts`:
   - Teste (1): `generateSocialResponse` gera `BrandVoiceSuggestion` valida (mock Gemini)
   - Teste (2): fallback funciona quando Gemini retorna JSON invalido
   - Mock de `@/lib/ai/gemini` (generateWithGemini)

**Arquivos:**
- `app/src/app/api/social-inbox/route.ts` — **MODIFICAR** (chamar Response Engine)
- `app/src/__tests__/lib/agents/response-engine.test.ts` — **CRIAR** (testes)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/agents/engagement/response-engine.ts` — generateSocialResponse (criado em RE-01)
- `app/src/types/social-inbox.ts` — BrandVoiceSuggestion

**DTs referenciados:** Nenhum
**Dependencias:** S32-RE-01 concluido (Response Engine existe)
**Gate Check:** S32-GATE-03 (Sim)

**AC:**
- [ ] `/api/social-inbox` chama `generateSocialResponse()` para interacao selecionada
- [ ] Sugestoes geradas para interacao selecionada (nao apenas primeira)
- [ ] Response contem `BrandVoiceSuggestion` com opcoes reais
- [ ] Teste (1): engine gera BrandVoiceSuggestion valida
- [ ] Teste (2): fallback funciona com JSON invalido
- [ ] Testes passando
- [ ] `npx tsc --noEmit` = 0

---

### S32-GATE-03: Gate Check 3 — LinkedIn Scaffold + Response Engine [XS, ~15min] — GATE

**Objetivo:** Validar LinkedIn scaffold, Response Engine e wiring. **Fase 4 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G3-01 | LinkedIn adapter criado | `rg "collectLinkedInInteractions" app/src/lib/integrations/social/linkedin-adapter.ts` | 1+ match |
| G3-02 | LinkedIn health check | `rg "v2/me" app/src/lib/integrations/social/linkedin-adapter.ts` | 1+ match |
| G3-03 | TODO LinkedIn eliminado | `rg "TODO.*LinkedIn\|TODO.*linkedin" app/src/lib/agents/engagement/inbox-aggregator.ts` | 0 matches |
| G3-04 | Response engine criado | `rg "generateSocialResponse" app/src/lib/agents/engagement/response-engine.ts` | 1+ match |
| G3-05 | Zod validation | `rg "GeminiResponseSchema" app/src/lib/agents/engagement/response-engine.ts` | 1+ match |
| G3-06 | @stub eliminado | `rg "@stub\|@todo" app/src/lib/ai/prompts/social-generation.ts` | 0 matches |
| G3-07 | Social-inbox usa engine | `rg "generateSocialResponse" app/src/app/api/social-inbox/route.ts` | 1+ match |
| G3-08 | Testes response engine | `rg "response-engine" app/src/__tests__/lib/agents/response-engine.test.ts` | 1+ match |
| G3-09 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G3-10 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 4 so inicia se G3-01 a G3-10 todos aprovados.

**AC:**
- [ ] G3-01 a G3-10 todos aprovados

---

## Fase 4: Governanca [~15min]

> **PRE-REQUISITO ABSOLUTO:** S32-GATE-03 aprovado.

---

### S32-GOV-01: Atualizar contract-map.yaml [XS, ~15min]

**Objetivo:** Registrar os novos paths da Sprint 32 no `contract-map.yaml` para manter rastreabilidade.

> **[ARCH DT-08]:** Garantir que todos os novos modulos estejam mapeados em lanes corretas.

**Acao:**
1. Em `_netecmt/core/contract-map.yaml`, ADICIONAR/ATUALIZAR paths:

**Lane `rate_limiting` — CRIAR (nova lane):**
```yaml
rate_limiting:
  paths:
    - "app/src/lib/middleware/rate-limiter.ts"    # S32-RL-01 (Rate Limiter Core)
  contract: null  # Inline na sprint
```

**Lane `social_intelligence` — EXPANDIR:**
```yaml
social_intelligence:
  paths:
    # === S32 — Novos paths ===
    - "app/src/lib/integrations/social/**"                    # S32-IG-01, S32-LI-01 (Adapters)
    - "app/src/lib/agents/engagement/response-engine.ts"      # S32-RE-01 (Response Engine)
    - "app/src/lib/agents/engagement/inbox-aggregator.ts"     # S32-IG-02, S32-LI-01 (Aggregator)
    - "app/src/lib/ai/prompts/social-generation.ts"           # S32-RE-01 (Prompt redesenhado)
    - "app/src/app/api/social-inbox/**"                       # S32-RE-02 (API wiring)
```

**Arquivos:**
- `_netecmt/core/contract-map.yaml` — **MODIFICAR**

**DTs referenciados:** DT-08 (mapeamento de lanes)
**Dependencias:** S32-GATE-03 aprovado (todos os paths existem)
**Gate Check:** Nao

**AC:**
- [ ] Lane `rate_limiting` criada com path do rate limiter
- [ ] Lane `social_intelligence` expandida com adapters, response engine, aggregator, prompts, API
- [ ] Zero conflito com lanes existentes
- [ ] Zero erros de parse YAML

---

## STRETCH: BrandVoice Translator 2.0 [~1.5h]

> **STRETCH:** S32-BV-01 so e executado se Gate 3 estiver aprovado com sobra de tempo (total acumulado < 10h). Pode ser movido para S33 sem impacto.

---

### S32-BV-01: BrandVoice Translator 2.0 [S, ~1.5h] — STRETCH

**Objetivo:** Adicionar campo `engagementScore` nas respostas salvas e implementar feedback loop basico onde respostas com alto engagement reforçam o voice profile.

**Acao:**
1. Adicionar campo `engagementScore: number` nas respostas salvas (collection `brands/{brandId}/social_responses`)
2. Criar funcao `updateEngagementScore(brandId, responseId, score)` em `response-engine.ts`
3. Criar funcao `getTopPerformingResponses(brandId, limit)` que busca respostas com `engagementScore > 0.7`
4. No `getBrandVoiceContext()`, incluir top responses como exemplos adicionais de brand voice

**Arquivos:**
- `app/src/lib/agents/engagement/response-engine.ts` — **MODIFICAR** (adicionar engagement tracking)

**DTs referenciados:** Nenhum (STRETCH)
**Dependencias:** S32-RE-01 concluido
**Gate Check:** Nao (STRETCH)

**AC:**
- [ ] `engagementScore` salvo junto com respostas
- [ ] `updateEngagementScore(brandId, responseId, score)` funcional
- [ ] `getTopPerformingResponses(brandId, limit)` retorna top responses
- [ ] Feedback loop: top responses influenciam voice context
- [ ] `npx tsc --noEmit` = 0

---

## Testes Recomendados (Novos — Dandara)

> **Todos os testes de Firestore devem usar mocks de `firebase/firestore` (via `jest.mock()`). NUNCA chamar Firestore real em testes automatizados.**

| # | Teste | Tipo | Arquivo Sugerido | Story |
|:--|:------|:-----|:----------------|:------|
| T-01 | `withRateLimit` permite request dentro do limite | Unit | `__tests__/lib/middleware/rate-limiter.test.ts` | RL-01 |
| T-02 | `withRateLimit` retorna 429 quando excede limite | Unit | `__tests__/lib/middleware/rate-limiter.test.ts` | RL-01 |
| T-03 | `withRateLimit` reseta window apos expirar | Unit | `__tests__/lib/middleware/rate-limiter.test.ts` | RL-01 |
| T-04 | `withRateLimit` isola contadores por brandId | Unit | `__tests__/lib/middleware/rate-limiter.test.ts` | RL-01 |
| T-05 | Instagram adapter sem credentials retorna `[]` | Unit | `__tests__/lib/integrations/instagram-adapter.test.ts` | IG-01 |
| T-06 | Instagram adapter com credentials chama fetch correto | Unit (mock fetch) | `__tests__/lib/integrations/instagram-adapter.test.ts` | IG-01 |
| T-07 | `generateSocialResponse` gera BrandVoiceSuggestion valida | Unit (mock Gemini) | `__tests__/lib/agents/response-engine.test.ts` | RE-01 |
| T-08 | `generateSocialResponse` fallback com JSON invalido | Unit | `__tests__/lib/agents/response-engine.test.ts` | RE-01 |

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 2 Blocking DTs RESOLVIDOS compreendidos:
  - [ ] **DT-01**: Rate limiter DEVE usar `runTransaction()` — atomicidade obrigatoria
  - [ ] **DT-02**: Import path `@/lib/auth/brand-guard` (NAO `@/lib/guards/auth`)
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-S31)
- [ ] Confirmar testes passando (baseline)

### Validacoes incrementais — Fase 1:
- [ ] Apos RL-01: Rate limiter core criado com `runTransaction()` + 429 + `Retry-After`
- [ ] Apos RL-02: 4 rotas protegidas + 4+ testes passando
- [ ] **GATE CHECK 1**: G1-01 a G1-10

### Validacoes incrementais — Fase 2:
- [ ] Apos IG-01: Instagram adapter com vault lookup + token refresh + degradacao
- [ ] Apos IG-02: TODO eliminado no aggregator + testes passando
- [ ] **GATE CHECK 2**: G2-01 a G2-09

### Validacoes incrementais — Fase 3:
- [ ] Apos LI-01: LinkedIn scaffold + TODO eliminado no aggregator
- [ ] Apos RE-01: Response engine + prompt redesenhado + Zod validation + fallback
- [ ] Apos RE-02: API social-inbox retorna sugestoes reais + testes
- [ ] **GATE CHECK 3**: G3-01 a G3-10

### Validacoes incrementais — Fase 4:
- [ ] Apos GOV-01: contract-map.yaml atualizado
- [ ] (STRETCH) BrandVoice Translator 2.0

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] Testes → 0 fail
- [ ] S32-GOV-01: contract-map.yaml atualizado
- [ ] (STRETCH) S32-BV-01: engagement tracking funcional

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 8 Decision Topics do Architecture Review (Athos)*
*Sprint 32: Social Integration 2.0 + Rate Limiting | 08/02/2026*
*12 stories (8 feature core + 3 gates + 1 STRETCH) | 3 Gates*
*Estimativa: 10.75h (sem STRETCH) / 12.25h (com STRETCH)*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), S+ = Small Extended, M = Medium (2-4h), M+ = Medium Extended, L = Large (> 4h)*
