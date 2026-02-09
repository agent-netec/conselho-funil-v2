# Stories Distilled: Sprint 30 — Ads Integration Foundation (Meta + Google)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026
**Lanes:** performance + automation + integrations (cross-cutting)
**Tipo:** Feature Sprint (Alto Impacto de Negocio)

> **IMPORTANTE:** Este documento incorpora os **16 Decision Topics (DTs)** e **6 Correcoes de Premissa (CPs)** do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 4 blocking DTs (DT-01, DT-02, DT-03, DT-04) estao destacados com `BLOCKING`.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess`, `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`, REST puro via `fetch()` (zero SDK npm novo).

---

## Fase 0: Pre-requisitos [~55min + Gate]

> **Sequencia:** PRE-01 | PRE-02 | PRE-03 (PARALELOS) → **GATE CHECK 0**
>
> Fase 0 NAO estava prevista no PRD — foi adicionada pelo Arch Review (Secao 7, Fase 0) para resolver naming collision e expandir tipos ANTES de tocar em qualquer adapter. Todos os 3 items sao independentes e podem ser executados em paralelo.

---

### S30-PRE-01: Rename adapter naming collision (DT-02) [XS, ~20min]

**Objetivo:** Renomear os adapters de performance para `MetaMetricsAdapter` e `GoogleMetricsAdapter`, eliminando a naming collision com os adapters de automation que tambem se chamam `MetaAdsAdapter` e `GoogleAdsAdapter`.

> **[ARCH DT-02 — P0, BLOCKING]:** Existem DOIS `MetaAdsAdapter` e DOIS `GoogleAdsAdapter` em modulos diferentes. Os de performance tem 0 callers externos (rota instancia inline). Renomear o lado com MENOS callers minimiza impacto.

**Acao:**
1. Em `app/src/lib/performance/adapters/meta-adapter.ts`:
   - Renomear `class MetaAdsAdapter` → `class MetaMetricsAdapter`
   - Atualizar export: `export class MetaMetricsAdapter extends AdsPlatformAdapter`
2. Em `app/src/lib/performance/adapters/google-adapter.ts`:
   - Renomear `class GoogleAdsAdapter` → `class GoogleMetricsAdapter`
   - Atualizar export: `export class GoogleMetricsAdapter extends AdsPlatformAdapter`
3. Verificar e atualizar TODOS os imports:
   ```bash
   rg "MetaAdsAdapter" app/src/lib/performance/ app/src/app/api/performance/
   rg "GoogleAdsAdapter" app/src/lib/performance/ app/src/app/api/performance/
   ```
4. Atualizar instanciacoes na rota de metrics e validate se necessario

**Arquivos:**
- `app/src/lib/performance/adapters/meta-adapter.ts` — **MODIFICAR** (rename class)
- `app/src/lib/performance/adapters/google-adapter.ts` — **MODIFICAR** (rename class)
- `app/src/app/api/performance/metrics/route.ts` — **MODIFICAR** (atualizar imports se necessario)
- `app/src/app/api/performance/integrations/validate/route.ts` — **MODIFICAR** (atualizar imports se necessario)

**DTs referenciados:** DT-02 (BLOCKING)
**Dependencias:** Nenhuma (paralelo com PRE-02, PRE-03)
**Gate Check:** S30-GATE-00 (Sim)
**SC mapeados:** SC-15 (tsc=0)

**AC:**
- [ ] `MetaMetricsAdapter` em `meta-adapter.ts` (nao mais `MetaAdsAdapter`)
- [ ] `GoogleMetricsAdapter` em `google-adapter.ts` (nao mais `GoogleAdsAdapter`)
- [ ] Zero referencia a `MetaAdsAdapter` em `lib/performance/` (exceto re-exports se houver)
- [ ] Zero referencia a `GoogleAdsAdapter` em `lib/performance/`
- [ ] `npx tsc --noEmit` = 0

---

### S30-PRE-02: Expand types — AdCredentials + UnifiedAdsMetrics + AdsActionResponse [S, ~30min]

**Objetivo:** Expandir os 3 tipos core que serao usados em TODAS as stories subsequentes: (1) criar union discriminada `AdCredentials` com type guards, (2) adicionar `clicks`, `impressions`, `cpa` a `UnifiedAdsMetrics`, (3) expandir `AdsActionResponse.actionTaken` com novas acoes.

> **[ARCH DT-05 — P1]:** AdCredentials como union discriminada (MetaAdCredentials | GoogleAdCredentials) — mais type-safe que interface flat com campos opcionais.
>
> **[ARCH DT-08 — P1]:** UnifiedAdsMetrics sem `clicks`/`impressions` perde dados na persistencia. Adicionar campos + eliminar intersection hack em `base-adapter.ts`.
>
> **[ARCH DT-06 — P1]:** AdsActionResponse.actionTaken nao suporta `updateAdCreative`, `syncCustomAudience`, `getEntityStatus`. Expandir union.

**Acao — Parte A: AdCredentials (DT-05):**
1. Em `app/src/lib/performance/adapters/base-adapter.ts`, ADICIONAR antes da classe abstrata:
   ```typescript
   /** Credenciais Meta Ads (Graph API v21.0) */
   export interface MetaAdCredentials {
     platform: 'meta';
     accessToken: string;
     adAccountId: string;       // act_XXXX
     pixelId?: string;          // Para CAPI
   }

   /** Credenciais Google Ads (REST API v18) */
   export interface GoogleAdCredentials {
     platform: 'google';
     accessToken: string;
     developerToken: string;    // Obrigatorio
     customerId: string;        // Obrigatorio
     managerAccountId?: string; // MCC (opcional)
   }

   /** Union discriminada por platform */
   export type AdCredentials = MetaAdCredentials | GoogleAdCredentials;

   /** Type guards para narrowing */
   export function isMetaCredentials(c: AdCredentials): c is MetaAdCredentials {
     return c.platform === 'meta';
   }

   export function isGoogleCredentials(c: AdCredentials): c is GoogleAdCredentials {
     return c.platform === 'google';
   }
   ```
2. Atualizar signature abstrata:
   ```typescript
   // ANTES: abstract fetchMetrics(credentials: any, ...
   // DEPOIS:
   abstract fetchMetrics(credentials: AdCredentials, period: { start: Date; end: Date }): Promise<RawAdsData[]>;
   ```

**Acao — Parte B: UnifiedAdsMetrics (DT-08):**
1. Em `app/src/types/performance.ts`, ADICIONAR campos a `UnifiedAdsMetrics`:
   ```typescript
   export interface UnifiedAdsMetrics {
     spend: number;
     revenue: number;
     roas: number;
     cac: number;
     ctr: number;
     cpc: number;
     cpa: number;          // NOVO (ja calculado no normalize, nao estava no tipo)
     conversions: number;
     clicks: number;       // NOVO
     impressions: number;  // NOVO
   }
   ```
2. Verificar impacto em `base-adapter.ts` — o `NormalizedAdapterResult` pode ser simplificado (intersection type redundante)
3. Atualizar mock em `metrics/route.ts` se necessario (adicionar clicks/impressions ao mock)

**Acao — Parte C: AdsActionResponse (DT-06):**
1. Em `app/src/lib/automation/adapters/types.ts`, EXPANDIR o union:
   ```typescript
   actionTaken: 'pause' | 'adjust_budget' | 'resume' | 'update_creative' | 'sync_audience' | 'get_status';
   ```
2. Adicionar campo opcional `details`:
   ```typescript
   details?: Record<string, unknown>;  // Ex: { audienceSize: 1500 }
   ```

**Arquivos:**
- `app/src/lib/performance/adapters/base-adapter.ts` — **MODIFICAR** (AdCredentials + signature)
- `app/src/types/performance.ts` — **MODIFICAR** (UnifiedAdsMetrics + clicks/impressions)
- `app/src/lib/automation/adapters/types.ts` — **MODIFICAR** (AdsActionResponse.actionTaken)

**Leitura (verificar impacto):**
- `app/src/app/api/performance/metrics/route.ts` — mock pode precisar atualizar
- `app/src/lib/performance/engine/anomaly-engine.ts` — usa PerformanceMetricDoc (tipo legado)

**DTs referenciados:** DT-05, DT-06, DT-08
**Dependencias:** Nenhuma (paralelo com PRE-01, PRE-03)
**Gate Check:** S30-GATE-00 (Sim)
**SC mapeados:** SC-16

**AC:**
- [ ] `AdCredentials` e union discriminada (`MetaAdCredentials | GoogleAdCredentials`)
- [ ] `isMetaCredentials()` e `isGoogleCredentials()` type guards exportados
- [ ] `fetchMetrics` signature usa `AdCredentials` (nao `any`)
- [ ] `UnifiedAdsMetrics` tem `clicks`, `impressions`, `cpa`
- [ ] `AdsActionResponse.actionTaken` inclui `update_creative`, `sync_audience`, `get_status`
- [ ] `AdsActionResponse` tem campo `details?: Record<string, unknown>`
- [ ] `npx tsc --noEmit` = 0

---

### S30-PRE-03: Fix AnomalyEngine Date→Timestamp + sensitive keys [XS, ~10min]

**Objetivo:** Corrigir violacao do padrao Sigma no AnomalyEngine (`new Date() as any` → `Timestamp.now()`) e adicionar `developerToken` e `appSecret` a lista de sensitive keys para encriptacao automatica.

> **[ARCH DT-09 — P2]:** `anomaly-engine.ts` L64 usa `new Date() as any` — viola padrao Sigma. S30 alimenta AnomalyEngine com dados reais — corrigir agora.
>
> **[ARCH DT-14 — P1]:** `encryptSensitiveFields()` nao lista `developerToken` nem `appSecret`. Sem isso, esses campos sao salvos em plain text no Firestore.

**Acao:**
1. Em `app/src/lib/performance/engine/anomaly-engine.ts`:
   - Substituir `createdAt: new Date() as any` por `createdAt: Timestamp.now()`
   - Adicionar import de `Timestamp` de `firebase/firestore` se necessario
2. Em `app/src/lib/utils/encryption.ts`, adicionar a lista de sensitive keys:
   ```typescript
   const sensitiveKeys = [
     'accessToken', 'refreshToken', 'token', 'clientSecret', 'apiKey',
     'developerToken', 'appSecret',  // ← S30 (DT-14)
     'email', 'firstName', 'lastName', 'phone', 'ipAddress'
   ];
   ```

**Arquivos:**
- `app/src/lib/performance/engine/anomaly-engine.ts` — **MODIFICAR** (Date → Timestamp)
- `app/src/lib/utils/encryption.ts` — **MODIFICAR** (adicionar sensitive keys)

**DTs referenciados:** DT-09, DT-14
**Dependencias:** Nenhuma (paralelo com PRE-01, PRE-02)
**Gate Check:** S30-GATE-00 (Sim)
**SC mapeados:** SC-15

**AC:**
- [ ] Zero `new Date() as any` em `anomaly-engine.ts`
- [ ] `Timestamp.now()` usado para `createdAt`
- [ ] `developerToken` na lista de sensitive keys
- [ ] `appSecret` na lista de sensitive keys
- [ ] `npx tsc --noEmit` = 0

---

### S30-GATE-00: Gate Check 0 — Pre-requisitos [XS, ~15min] — GATE

**Objetivo:** Validar que TODOS os pre-requisitos de naming e tipos estao concluidos e que o baseline de 224/224 testes foi mantido. **Fase 1 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G0-01 | Rename MetaMetricsAdapter | `rg "class MetaMetricsAdapter" app/src/lib/performance/` | 1 match |
| G0-02 | Rename GoogleMetricsAdapter | `rg "class GoogleMetricsAdapter" app/src/lib/performance/` | 1 match |
| G0-03 | Zero naming collision | `rg "class MetaAdsAdapter" app/src/lib/performance/` | 0 matches |
| G0-04 | AdCredentials union | `rg "type AdCredentials = " app/src/lib/performance/` | 1 match |
| G0-05 | UnifiedAdsMetrics expandida | `rg "clicks: number" app/src/types/performance.ts` | 1+ match |
| G0-06 | AnomalyEngine Timestamp | `rg "new Date() as any" app/src/lib/performance/engine/anomaly-engine.ts` | 0 matches |
| G0-07 | Sensitive keys atualizadas | `rg "developerToken" app/src/lib/utils/encryption.ts` | 1+ match |
| G0-08 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G0-09 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G0-10 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**Regra ABSOLUTA:** Fase 1 so inicia se G0-01 a G0-10 todos ✅.

**AC:**
- [ ] G0-01 a G0-10 todos aprovados
- [ ] Baseline intacto: 224/224 testes, tsc=0, build OK

---

## Fase 1: Foundation [~4-4.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S30-GATE-00 aprovado.
>
> **Sequencia Athos (Secao 11):** FN-03 → FN-01 → FN-02 (dependencias diretas: vault → token refresh → validation)
>
> Esta fase resolve o **DT-01 (BLOCKING)** — buffer per-provider no `isTokenExpiring()`.

---

### S30-FN-03: MonaraToken enhancement + isTokenExpiring per-provider [S, ~45min]

**Objetivo:** Expandir o MonaraToken com metadata tipada por plataforma e tornar `isTokenExpiring()` provider-aware (buffer de 24h para Meta, 15min para Google).

> **[ARCH DT-01 — P0, BLOCKING]:** Buffer fixo de 24h significa que TODOS os tokens Google sao SEMPRE considerados "expirando" (tokens duram 1h). DEVE ter buffer per-provider.
>
> **[ARCH DT-14 — P1]:** Usar `metadata` com tipagem por plataforma (MetaTokenMetadata | GoogleTokenMetadata). Zero breaking change — `metadata` ja existe.

**Acao:**
1. Em `app/src/lib/firebase/vault.ts`, ADICIONAR interfaces de metadata:
   ```typescript
   export interface MetaTokenMetadata {
     adAccountId: string;
     pixelId?: string;
     appId: string;
     appSecret: string;        // AES-256 encrypted
   }

   export interface GoogleTokenMetadata {
     customerId: string;
     developerToken: string;   // AES-256 encrypted
     clientId: string;
     clientSecret: string;     // AES-256 encrypted
     managerAccountId?: string;
   }
   ```
2. MODIFICAR `isTokenExpiring()` para receber `provider`:
   ```typescript
   static isTokenExpiring(token: MonaraToken, provider?: 'meta' | 'google'): boolean {
     const buffers: Record<string, number> = {
       meta: 24 * 60 * 60 * 1000,    // 24h (tokens duram 60 dias)
       google: 15 * 60 * 1000,        // 15min (tokens duram 1h)
     };
     const buffer = buffers[provider || token.provider] || buffers.meta;
     const now = Date.now();
     return token.expiresAt.toMillis() - now < buffer;
   }
   ```
3. ADICIONAR metodos novos (stubs que serao implementados em FN-01):
   ```typescript
   static async refreshAndSave(brandId: string, provider: 'meta' | 'google'): Promise<MonaraToken> {
     // Implementado em S30-FN-01 via token-refresh.ts
     const { ensureFreshToken } = await import('@/lib/integrations/ads/token-refresh');
     return ensureFreshToken(brandId, provider);
   }

   static async getValidToken(brandId: string, provider: 'meta' | 'google'): Promise<MonaraToken> {
     const token = await MonaraTokenVault.getToken(brandId, provider);
     if (!token) throw new Error(`Token not found for brand ${brandId}, provider ${provider}`);
     if (MonaraTokenVault.isTokenExpiring(token, provider)) {
       return MonaraTokenVault.refreshAndSave(brandId, provider);
     }
     return token;
   }
   ```

**Arquivos:**
- `app/src/lib/firebase/vault.ts` — **MODIFICAR** (metadata interfaces + isTokenExpiring + novos metodos)

**DTs referenciados:** DT-01 (BLOCKING), DT-14
**Dependencias:** S30-GATE-00 aprovado
**Gate Check:** S30-GATE-01 (Sim, como parte de Foundation)
**SC mapeados:** SC-12

**AC:**
- [ ] `MetaTokenMetadata` e `GoogleTokenMetadata` interfaces exportadas
- [ ] `isTokenExpiring()` recebe `provider` como parametro opcional
- [ ] Buffer Meta = 24h (24 * 60 * 60 * 1000)
- [ ] Buffer Google = 15min (15 * 60 * 1000)
- [ ] Fallback para `token.provider` se `provider` nao informado
- [ ] `refreshAndSave()` e `getValidToken()` metodos adicionados
- [ ] Zero breaking change — `isTokenExpiring(token)` sem provider continua funcionando
- [ ] `npx tsc --noEmit` = 0

---

### S30-FN-01: Token Refresh Engine + api-helpers.ts + constants.ts [M, ~2h]

**Objetivo:** Criar os 3 modulos de infraestrutura: (1) `ensureFreshToken()` para refresh automatico de tokens Meta/Google, (2) `fetchWithRetry()` para retry com backoff, (3) constantes de API.

> **[ARCH DT-13 — P1]:** Generalizar `executeWithRetry()` do capi-sync.ts para helper compartilhado. Incluir `sanitizeForLog()` (P-02 do PRD).

**Acao — Parte A: constants.ts:**
1. CRIAR `app/src/lib/integrations/ads/constants.ts`:
   ```typescript
   export const META_API = {
     BASE_URL: 'https://graph.facebook.com/v21.0',
     RATE_LIMIT: 200,
     TIMEOUT_MS: 10_000,
     TOKEN_REFRESH_BUFFER: 24 * 60 * 60 * 1000,
   } as const;

   export const GOOGLE_ADS_API = {
     BASE_URL: 'https://googleads.googleapis.com/v18',
     TOKEN_URL: 'https://oauth2.googleapis.com/token',
     RATE_LIMIT: 15_000,
     TIMEOUT_MS: 15_000,
     TOKEN_REFRESH_BUFFER: 15 * 60 * 1000,
   } as const;

   export const RETRY_CONFIG = {
     MAX_RETRIES: 3,
     BASE_DELAY_MS: 1_000,
     MAX_DELAY_MS: 30_000,
     JITTER_FACTOR: 0.3,
   } as const;
   ```

**Acao — Parte B: api-helpers.ts:**
1. CRIAR `app/src/lib/integrations/ads/api-helpers.ts`:
   - `fetchWithRetry(url, options, config?)` — retry com exponential backoff, respeitando `Retry-After` header, `AbortSignal.timeout()`, retryOn configurable ([429, 500, 502, 503])
   - `sanitizeForLog(url)` — mascarar access_token e Bearer tokens em URLs e headers
   - `sleep(ms)` — helper de delay
   - Usar constantes de `RETRY_CONFIG`

**Acao — Parte C: token-refresh.ts:**
1. CRIAR `app/src/lib/integrations/ads/token-refresh.ts`:
   - `ensureFreshToken(brandId, provider)` — busca token do vault, verifica expiracao, refresh se necessario
   - Meta refresh: `GET /oauth/access_token?grant_type=fb_exchange_token&client_id={appId}&client_secret={appSecret}&fb_exchange_token={token}`
   - Google refresh: `POST https://oauth2.googleapis.com/token` com body `{client_id, client_secret, refresh_token, grant_type: 'refresh_token'}`
   - Salva token atualizado no vault apos refresh
   - `tokenToCredentials(token)` — converte MonaraToken → AdCredentials (bridge function)

**Arquivos:**
- `app/src/lib/integrations/ads/constants.ts` — **CRIAR**
- `app/src/lib/integrations/ads/api-helpers.ts` — **CRIAR**
- `app/src/lib/integrations/ads/token-refresh.ts` — **CRIAR**

**Leitura (padroes existentes):**
- `app/src/lib/integrations/ads/capi-sync.ts` — padrao de retry existente (L108-120) para referencia
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault API

**DTs referenciados:** DT-13
**Dependencias:** S30-FN-03 concluido (vault com per-provider buffer)
**Gate Check:** S30-GATE-01 (Sim)
**SC mapeados:** SC-12, SC-13

**AC:**
- [ ] `constants.ts` criado com META_API, GOOGLE_ADS_API, RETRY_CONFIG
- [ ] `api-helpers.ts` criado com `fetchWithRetry()`, `sanitizeForLog()`, `sleep()`
- [ ] `fetchWithRetry()` respeita `Retry-After` header em 429
- [ ] `fetchWithRetry()` usa `AbortSignal.timeout()` (P-05: PA-05)
- [ ] `sanitizeForLog()` mascara access_token e Bearer em URLs (P-02: PA-06)
- [ ] `token-refresh.ts` criado com `ensureFreshToken()` e `tokenToCredentials()`
- [ ] Meta refresh usa `fb_exchange_token` endpoint v21.0
- [ ] Google refresh usa `oauth2.googleapis.com/token` com refresh_token
- [ ] Novo token salvo no vault apos refresh (`MonaraTokenVault.saveToken`)
- [ ] `tokenToCredentials()` converte corretamente para `MetaAdCredentials` ou `GoogleAdCredentials`
- [ ] `npx tsc --noEmit` = 0

---

### S30-FN-02: Integration Validation Real [S, ~1.5h]

**Objetivo:** Substituir o mock (501) em `/api/performance/integrations/validate` por validacao real contra Meta Graph API e Google Ads API.

**Acao:**
1. Em `app/src/app/api/performance/integrations/validate/route.ts`:
   - Manter `mock=true` funcional (P-08)
   - Quando `mock=false`:
     - Meta: `GET https://graph.facebook.com/v21.0/me?access_token={token}` — sucesso = valido
     - Google: `GET https://googleads.googleapis.com/v18/customers/{customerId}` com headers Auth + developer-token — sucesso = valido
   - Usar `fetchWithRetry()` de `api-helpers.ts`
   - Usar `ensureFreshToken()` para obter token valido
   - Persistir resultado em `brands/{brandId}/performance_configs` (status + validatedAt)
   - Detectar Google developer token em modo test (DT-11): se erro com `DEVELOPER_TOKEN_NOT_APPROVED`, retornar warning

**Arquivos:**
- `app/src/app/api/performance/integrations/validate/route.ts` — **MODIFICAR** (substituir 501 por validacao real)

**Leitura:**
- `app/src/lib/integrations/ads/token-refresh.ts` — ensureFreshToken (criado em FN-01)
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry (criado em FN-01)
- `app/src/lib/integrations/ads/constants.ts` — META_API, GOOGLE_ADS_API
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault

**DTs referenciados:** DT-11
**Dependencias:** S30-FN-01 concluido (token-refresh + api-helpers)
**Gate Check:** S30-GATE-01 (Sim)
**SC mapeados:** SC-11

**AC:**
- [ ] `mock=true` continua funcionando (P-08)
- [ ] Meta validation: `GET /me` retorna user info se token valido
- [ ] Google validation: `GET /customers/{id}` retorna account info se token valido
- [ ] Status persistido em `brands/{brandId}/performance_configs`
- [ ] Warning claro para Google developer token em modo test
- [ ] Usa `fetchWithRetry()` (nao fetch direto)
- [ ] Retorna `createApiSuccess` (mesmo shape de response — RC-04)
- [ ] Erros retornam `createApiError(502, ...)` (nao 500 — P-05)
- [ ] `npx tsc --noEmit` = 0

---

### S30-GATE-01: Gate Check 1 — Foundation [S, ~30min] — GATE

**Objetivo:** Validar que Foundation esta completa. **Fase 2 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | isTokenExpiring per-provider | `rg "buffers\[provider" app/src/lib/firebase/vault.ts` | 1+ match |
| G1-02 | Token refresh funcional | Verificar `token-refresh.ts` exporta `ensureFreshToken` | Export presente |
| G1-03 | api-helpers criado | Verificar `api-helpers.ts` exporta `fetchWithRetry` + `sanitizeForLog` | Exports presentes |
| G1-04 | constants criado | Verificar `constants.ts` exporta META_API + GOOGLE_ADS_API | Exports presentes |
| G1-05 | Integration validation real | `rg "501" app/src/app/api/performance/integrations/validate/route.ts` | 0 matches (501 removido) |
| G1-06 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G1-07 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G1-08 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-08 todos ✅.

**AC:**
- [ ] G1-01 a G1-08 todos aprovados

---

## Fase 2: Meta Ads [~6-8h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S30-GATE-01 aprovado.
>
> **Sequencia:** META-01 (core) → META-02 | META-03 (paralelos) → META-04 (depende de META-03)
>
> Esta fase resolve o **DT-03 (BLOCKING)** — bug duplo em ads-sync.ts (story S30-META-04).
>
> **ATENCAO CP-02:** `meta.ts` NAO e "descomentar" codigo existente. E REIMPLEMENTAR com error handling, headers corretos e timeout. O codigo comentado esta incompleto.

---

### S30-META-01: MetaMetricsAdapter fetchMetrics real [M, ~2.5h]

**Objetivo:** Substituir o mock hardcoded em `MetaMetricsAdapter` (ex-MetaAdsAdapter) por chamada real ao Meta Graph API v21.0.

**Acao:**
1. Em `app/src/lib/performance/adapters/meta-adapter.ts`:
   - Substituir mock (L7-23) por implementacao real
   - Endpoint: `GET /act_{adAccountId}/insights?fields=campaign_id,campaign_name,spend,impressions,clicks,actions,cpc,ctr&time_range={...}&level=campaign&limit=100`
   - Usar `fetchWithRetry()` de api-helpers
   - Adicionar narrowing com `isMetaCredentials(credentials)` no inicio
   - Criar mapper `mapMetaInsightToRawAds()` (PRD secao RF-30.01)
   - Timeout: 10s (META_API.TIMEOUT_MS)
   - Error: throw com mensagem descritiva do Graph API

**Arquivos:**
- `app/src/lib/performance/adapters/meta-adapter.ts` — **MODIFICAR** (substituir mock por Graph API real)

**Leitura:**
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — META_API
- `app/src/lib/performance/adapters/base-adapter.ts` — AdCredentials, RawAdsData, normalize()

**DTs referenciados:** Nenhum blocking (usa infra de F1)
**Dependencias:** S30-GATE-01 aprovado
**Gate Check:** S30-GATE-02 (Sim)
**SC mapeados:** SC-02

**AC:**
- [ ] Zero mock em `MetaMetricsAdapter.fetchMetrics()`
- [ ] Chama `graph.facebook.com/v21.0/act_{adAccountId}/insights`
- [ ] Usa `fetchWithRetry()` (nao fetch direto — PA-05)
- [ ] Usa `isMetaCredentials()` para narrowing de credentials
- [ ] Mapper `mapMetaInsightToRawAds()` converte Graph API response → `RawAdsData`
- [ ] Campos mapeados: platform, externalId, name, spend, clicks, impressions, conversions
- [ ] `AbortSignal.timeout(10000)` presente
- [ ] Error handling descritivo (Graph API error message preservada)
- [ ] `npx tsc --noEmit` = 0

---

### S30-META-02: MetaAdsAdapter updateAdCreative real [M, ~2h]

**Objetivo:** Substituir console.log em `MetaAdsAdapter` (automation) por chamada real ao Graph API para atualizar criativos de ads.

> **[ARCH CP-02]:** Codigo comentado (L38-39) esta INCOMPLETO. NAO e "descomentar". E reimplementar com error handling, headers corretos e timeout.

**Acao:**
1. Em `app/src/lib/automation/adapters/meta.ts`:
   - Reimplementar `updateAdCreative()` com `POST https://graph.facebook.com/v21.0/{adId}`
   - Body: creative fields (name, title, body, image_url conforme disponivel)
   - Usar `fetchWithRetry()` de api-helpers
   - Obter token via `MonaraTokenVault.getValidToken(this.brandId, 'meta')`
   - Retornar `AdsActionResponse` com `actionTaken: 'update_creative'`

**Arquivos:**
- `app/src/lib/automation/adapters/meta.ts` — **MODIFICAR** (reimplementar updateAdCreative)

**Leitura:**
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — META_API
- `app/src/lib/automation/adapters/types.ts` — AdsActionResponse

**DTs referenciados:** CP-02
**Dependencias:** S30-GATE-01 aprovado (paralelo com META-03)
**Gate Check:** S30-GATE-02 (Sim)
**SC mapeados:** SC-07

**AC:**
- [ ] Zero console.log em `updateAdCreative()`
- [ ] Chama `POST graph.facebook.com/v21.0/{adId}` com creative fields
- [ ] Usa `fetchWithRetry()` (PA-05)
- [ ] Token obtido via vault (nao parametro — PA-03)
- [ ] Retorna `AdsActionResponse` com `actionTaken: 'update_creative'`
- [ ] Error handling com `success: false` e `error.retryable` corretamente definido
- [ ] `npx tsc --noEmit` = 0

---

### S30-META-03: MetaAdsAdapter syncCustomAudience real [M, ~2h]

**Objetivo:** Implementar envio real de Custom Audience para Meta Graph API, incluindo hash SHA256 dos dados de email.

**Acao:**
1. Em `app/src/lib/automation/adapters/meta.ts`:
   - Implementar `syncCustomAudience()` com `POST https://graph.facebook.com/v21.0/{audienceId}/users`
   - Body: `{ schema: ['EMAIL'], data: [['sha256hash1'], ['sha256hash2']] }`
   - SHA256 hash dos emails antes de enviar
   - Usar `fetchWithRetry()` de api-helpers
   - Retornar `AdsActionResponse` com `actionTaken: 'sync_audience'` e `details: { audienceSize }`

**Arquivos:**
- `app/src/lib/automation/adapters/meta.ts` — **MODIFICAR** (implementar syncCustomAudience)

**DTs referenciados:** Nenhum blocking
**Dependencias:** S30-GATE-01 aprovado (paralelo com META-02)
**Gate Check:** S30-GATE-02 (Sim)
**SC mapeados:** SC-08

**AC:**
- [ ] `syncCustomAudience()` chama `POST /{audienceId}/users`
- [ ] Dados de email hashados com SHA256 antes do envio (LGPD compliance)
- [ ] Usa `fetchWithRetry()` (PA-05)
- [ ] Token obtido via vault (PA-03)
- [ ] Retorna `AdsActionResponse` com `actionTaken: 'sync_audience'`
- [ ] `details.audienceSize` presente na response
- [ ] `npx tsc --noEmit` = 0

---

### S30-META-04: AdsLookalikeSync real — fix duplo (DT-03) [S+, ~1.5h]

**Objetivo:** Corrigir os DOIS bugs em `ads-sync.ts` (collection raiz + constructor errado) e implementar sync real com Meta Custom Audiences.

> **[ARCH DT-03 — P0, BLOCKING]:** ads-sync.ts tem BUG DUPLO:
> 1. Query na collection raiz `/leads` (DEVE ser `brands/{brandId}/leads`)
> 2. Constructor passa `metaToken` como primeiro argumento — armazenado como `this.brandId`
>
> A signature do metodo MUDA: de `(brandId, metaToken, adAccountId)` para `(brandId)`. O token vem do vault.

**Acao:**
1. Em `app/src/lib/automation/adapters/ads-sync.ts`:
   - SUBSTITUIR signature: `syncHotLeadsToMeta(brandId: string)` (remover metaToken e adAccountId)
   - Buscar credenciais via `MonaraTokenVault.getToken(brandId, 'meta')`
   - Fix query: `collection(db, 'brands', brandId, 'leads')` (nao collection raiz)
   - Adicionar filtro: `where('segment', '==', 'hot')` (campo PropensityEngine S28)
   - Fix constructor: `new MetaAdsAdapter(brandId, token.metadata?.adAccountId)`
   - Chamar `metaAdapter.syncCustomAudience()` real (implementado em META-03)
   - Usar `Timestamp.now()` (nao Date) para `syncedAt`
2. Verificar TODOS os callers de `syncHotLeadsToMeta`:
   ```bash
   rg "syncHotLeadsToMeta" app/src/
   ```
3. Atualizar callers para nova signature `(brandId)` (sem metaToken, sem adAccountId)

**Arquivos:**
- `app/src/lib/automation/adapters/ads-sync.ts` — **MODIFICAR** (fix duplo + sync real)

**Leitura (verificar callers):**
- `app/src/lib/automation/engine.ts` — provavel caller
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault

**DTs referenciados:** DT-03 (BLOCKING)
**Dependencias:** S30-META-03 concluido (syncCustomAudience real)
**Gate Check:** S30-GATE-02 (Sim)
**SC mapeados:** SC-09

**AC:**
- [ ] Signature mudou para `syncHotLeadsToMeta(brandId: string)` — sem metaToken, sem adAccountId
- [ ] Token obtido via `MonaraTokenVault.getToken(brandId, 'meta')` (nao parametro)
- [ ] Query usa `collection(db, 'brands', brandId, 'leads')` (NAO collection raiz)
- [ ] Filtro `where('segment', '==', 'hot')` presente
- [ ] Constructor: `new MetaAdsAdapter(brandId, ...)` (brandId correto, nao metaToken)
- [ ] Chama `syncCustomAudience()` real (Graph API)
- [ ] `Timestamp.now()` para `syncedAt` (nao Date)
- [ ] TODOS os callers atualizados para nova signature
- [ ] `npx tsc --noEmit` = 0

---

### S30-GATE-02: Gate Check 2 — Meta Ads [S, ~30min] — GATE

**Objetivo:** Validar que Meta Ads esta funcional. **Fase 3 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | MetaMetricsAdapter fetchMetrics real | `rg "graph.facebook.com" app/src/lib/performance/adapters/meta-adapter.ts` | 1+ match |
| G2-02 | MetaAdsAdapter updateAdCreative real | `rg "console.log" app/src/lib/automation/adapters/meta.ts` | 0 matches em updateAdCreative |
| G2-03 | MetaAdsAdapter syncCustomAudience real | `rg "graph.facebook.com" app/src/lib/automation/adapters/meta.ts` | 1+ match |
| G2-04 | ads-sync fix collection | `rg "collection(db, 'leads')" app/src/lib/automation/adapters/ads-sync.ts` | 0 matches |
| G2-05 | ads-sync fix brandId scoped | `rg "'brands', brandId, 'leads'" app/src/lib/automation/adapters/ads-sync.ts` | 1+ match |
| G2-06 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G2-07 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G2-08 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**AC:**
- [ ] G2-01 a G2-08 todos aprovados

---

## Fase 3: Google Ads [~5.5-7.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S30-GATE-02 aprovado.
>
> **Sequencia:** GOOG-00 (constructor refactor) → GOOG-01 (fetchMetrics) → GOOG-02 | GOOG-03 (paralelos) → GOOG-04
>
> **GOOG-00 e OBRIGATORIO primeiro** — sem `accessToken` no constructor, nenhuma chamada Google funciona (DT-07).

---

### S30-GOOG-00: GoogleAdsAdapter constructor refactor (DT-07) [XS, ~30min]

**Objetivo:** Adicionar `accessToken` ao constructor de `GoogleAdsAdapter` (automation) e criar helper `getHeaders()` para reusar em todas as chamadas.

> **[ARCH DT-07 — P1]:** Constructor atual: `(developerToken, customerId)` — sem accessToken. Google Ads API requer `Authorization: Bearer {access_token}`. Sem isso, NENHUMA chamada funciona.

**Acao:**
1. Em `app/src/lib/automation/adapters/google.ts`:
   - Refatorar constructor para 3 params: `(accessToken, developerToken, customerId)`
   - Adicionar `private accessToken: string`
   - Criar `private getHeaders()` que retorna headers completos
2. Verificar e atualizar TODOS os callers:
   ```bash
   rg "new GoogleAdsAdapter" app/src/
   ```
3. Atualizar callers para passar `accessToken` (obtido do vault)

**Arquivos:**
- `app/src/lib/automation/adapters/google.ts` — **MODIFICAR** (constructor + getHeaders)

**Leitura (callers):**
- `app/src/lib/automation/engine.ts` — provavel instanciador

**DTs referenciados:** DT-07
**Dependencias:** S30-GATE-02 aprovado
**Gate Check:** S30-GATE-03 (Sim)
**SC mapeados:** SC-04, SC-05, SC-06

**AC:**
- [ ] Constructor: `(accessToken: string, developerToken: string, customerId: string)`
- [ ] `this.accessToken` armazenado como campo privado
- [ ] `getHeaders()` retorna `{ Authorization, developer-token, Content-Type }`
- [ ] TODOS os callers atualizados para 3 params
- [ ] `npx tsc --noEmit` = 0

---

### S30-GOOG-01: GoogleMetricsAdapter fetchMetrics real [M, ~3h]

**Objetivo:** Substituir o mock hardcoded em `GoogleMetricsAdapter` (ex-GoogleAdsAdapter) por chamada real ao Google Ads API v18 via GAQL searchStream.

**Acao:**
1. Em `app/src/lib/performance/adapters/google-adapter.ts`:
   - Substituir mock por implementacao real
   - Endpoint: `POST /customers/{customerId}/googleAds:searchStream`
   - GAQL: `SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date BETWEEN '{start}' AND '{end}'`
   - Converter `cost_micros` (microunits) para valor real: `/ 1_000_000`
   - Usar `fetchWithRetry()` de api-helpers
   - Adicionar narrowing com `isGoogleCredentials(credentials)` no inicio
   - Criar mapper `flatMapGoogleResults()` (PRD secao RF-30.02)
   - Timeout: 15s (GOOGLE_ADS_API.TIMEOUT_MS)

**Arquivos:**
- `app/src/lib/performance/adapters/google-adapter.ts` — **MODIFICAR** (substituir mock por Google Ads API real)

**Leitura:**
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — GOOGLE_ADS_API

**DTs referenciados:** Nenhum blocking
**Dependencias:** S30-GATE-02 aprovado
**Gate Check:** S30-GATE-03 (Sim)
**SC mapeados:** SC-03

**AC:**
- [ ] Zero mock em `GoogleMetricsAdapter.fetchMetrics()`
- [ ] Chama `POST googleads.googleapis.com/v18/customers/{id}/googleAds:searchStream`
- [ ] GAQL query com campos campaign.id, name, metrics (cost_micros, clicks, impressions, conversions)
- [ ] `cost_micros` convertido para valor real (`/ 1_000_000`)
- [ ] Usa `fetchWithRetry()` (PA-05)
- [ ] Usa `isGoogleCredentials()` para narrowing
- [ ] Headers incluem `developer-token` e `Authorization: Bearer`
- [ ] `npx tsc --noEmit` = 0

---

### S30-GOOG-02: GoogleAdsAdapter pauseAdEntity real [M-, ~1.5h]

**Objetivo:** Substituir mock em `pauseAdEntity()` por chamada real ao Google Ads API para pausar campanhas.

**Acao:**
1. Em `app/src/lib/automation/adapters/google.ts`:
   - Implementar `POST /customers/{customerId}/campaigns:mutate`
   - Body: `{ operations: [{ update: { resourceName, status: "PAUSED" }, updateMask: "status" }] }`
   - Usar `this.getHeaders()` (criado em GOOG-00)
   - Usar `fetchWithRetry()` de api-helpers

**Arquivos:**
- `app/src/lib/automation/adapters/google.ts` — **MODIFICAR** (pauseAdEntity real)

**DTs referenciados:** Nenhum blocking
**Dependencias:** S30-GOOG-00 concluido (paralelo com GOOG-03)
**Gate Check:** S30-GATE-03 (Sim)
**SC mapeados:** SC-04

**AC:**
- [ ] Zero mock em `pauseAdEntity()`
- [ ] Chama `POST /customers/{id}/campaigns:mutate` com status PAUSED
- [ ] Usa `this.getHeaders()` para auth
- [ ] Usa `fetchWithRetry()` (PA-05)
- [ ] Retorna `AdsActionResponse` com `success: true/false` correto
- [ ] `npx tsc --noEmit` = 0

---

### S30-GOOG-03: GoogleAdsAdapter adjustBudget real [S, ~1.5h]

**Objetivo:** Substituir mock em `adjustBudget()` por chamada real ao Google Ads API para ajustar budgets de campanha.

**Acao:**
1. Em `app/src/lib/automation/adapters/google.ts`:
   - Implementar `POST /customers/{customerId}/campaignBudgets:mutate`
   - Converter de reais para micros (`* 1_000_000`)
   - Body: `{ operations: [{ update: { resourceName, amountMicros }, updateMask: "amountMicros" }] }`

**Arquivos:**
- `app/src/lib/automation/adapters/google.ts` — **MODIFICAR** (adjustBudget real)

**DTs referenciados:** Nenhum blocking
**Dependencias:** S30-GOOG-00 concluido (paralelo com GOOG-02)
**Gate Check:** S30-GATE-03 (Sim)
**SC mapeados:** SC-05

**AC:**
- [ ] Zero mock em `adjustBudget()`
- [ ] Chama `POST /customers/{id}/campaignBudgets:mutate` com amountMicros
- [ ] Conversao correta: reais → micros (`* 1_000_000`)
- [ ] Usa `this.getHeaders()` e `fetchWithRetry()`
- [ ] `npx tsc --noEmit` = 0

---

### S30-GOOG-04: GoogleAdsAdapter getEntityStatus real [S, ~1h]

**Objetivo:** Substituir mock em `getEntityStatus()` por chamada real ao Google Ads API para consultar status e budget.

**Acao:**
1. Em `app/src/lib/automation/adapters/google.ts`:
   - Implementar `POST /customers/{customerId}/googleAds:search` com GAQL
   - GAQL: `SELECT campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.id = {entityId}`
   - Converter `amount_micros` de volta para valor real

**Arquivos:**
- `app/src/lib/automation/adapters/google.ts` — **MODIFICAR** (getEntityStatus real)

**DTs referenciados:** Nenhum blocking
**Dependencias:** S30-GOOG-02, S30-GOOG-03 (verificacao pos-action)
**Gate Check:** S30-GATE-03 (Sim)
**SC mapeados:** SC-06

**AC:**
- [ ] Zero mock em `getEntityStatus()`
- [ ] GAQL query retorna campaign.status + campaign_budget.amount_micros
- [ ] amount_micros convertido para valor real
- [ ] `npx tsc --noEmit` = 0

---

### S30-GATE-03: Gate Check 3 — Google Ads [S, ~30min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G3-01 | GoogleMetricsAdapter fetchMetrics real | `rg "googleads.googleapis.com" app/src/lib/performance/adapters/google-adapter.ts` | 1+ match |
| G3-02 | GoogleAdsAdapter constructor 3 params | `rg "constructor(accessToken" app/src/lib/automation/adapters/google.ts` | 1 match |
| G3-03 | GoogleAdsAdapter getHeaders | `rg "getHeaders" app/src/lib/automation/adapters/google.ts` | 1+ match |
| G3-04 | pauseAdEntity real | `rg "campaigns:mutate" app/src/lib/automation/adapters/google.ts` | 1+ match |
| G3-05 | adjustBudget real | `rg "campaignBudgets:mutate" app/src/lib/automation/adapters/google.ts` | 1+ match |
| G3-06 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G3-07 | Build sucesso | `npm run build` | >= 103 rotas |
| G3-08 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**AC:**
- [ ] G3-01 a G3-08 todos aprovados

---

## Fase 4: Performance & Offline Conversions [~5-6h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S30-GATE-03 aprovado.
>
> **Sequencia:** CAPI-00 (CAPI refactor, pre-step OBRIGATORIO) → PERF-01 | PERF-02 (paralelos)
>
> Esta fase resolve o **DT-04 (BLOCKING)** — migracao do CAPI de env vars para vault.

---

### S30-CAPI-00: Refatorar CAPISyncEngine — brandId + vault + v21.0 (DT-04, DT-15) [M, ~1.5h]

**Objetivo:** Migrar `CAPISyncEngine` de `process.env` (single-tenant) para `MonaraTokenVault` (multi-tenant), atualizar versao da Graph API de v18.0 para v21.0, e adicionar `brandId` ao constructor.

> **[ARCH DT-04 — P0, BLOCKING]:** `capi-sync.ts` usa `process.env.META_CAPI_ACCESS_TOKEN` e `process.env.META_CAPI_PIXEL_ID` — env vars sao globais, nao suportam multi-tenant. Se dois brands usam CAPI, ambos enviam para o MESMO pixel.
>
> **[ARCH DT-15 — P1]:** CAPI usa v18.0, resto do codebase S30 usa v21.0. Manter consistencia.

**Acao:**
1. Em `app/src/lib/integrations/ads/capi-sync.ts`:
   - Adicionar `brandId` ao constructor: `constructor(brandId: string)`
   - Criar metodo privado `getMetaCredentials()` que busca do vault com fallback env vars
   - Atualizar URL de `v18.0` para `v21.0`: `https://graph.facebook.com/v21.0/${pixelId}/events`
   - Substituir `process.env.META_CAPI_ACCESS_TOKEN` e `process.env.META_CAPI_PIXEL_ID` por chamada ao vault
   - Manter env vars como fallback para dev local (sem vault configurado)
2. Verificar TODOS os callers de `CAPISyncEngine`:
   ```bash
   rg "new CAPISyncEngine\|CAPISyncEngine\." app/src/
   ```
3. Atualizar callers para passar `brandId`
4. Generalizar `executeWithRetry()` existente (L108-120) para usar `fetchWithRetry()` de api-helpers (ou manter local)

**Arquivos:**
- `app/src/lib/integrations/ads/capi-sync.ts` — **MODIFICAR** (brandId + vault + v21.0)

**Leitura:**
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault API
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry (referencia)

**DTs referenciados:** DT-04 (BLOCKING), DT-15
**Dependencias:** S30-GATE-03 aprovado
**Gate Check:** S30-GATE-04 (Sim)
**SC mapeados:** SC-10

**AC:**
- [ ] Constructor: `constructor(brandId: string)`
- [ ] `getMetaCredentials()` busca do vault primeiro, fallback env vars (RC-09)
- [ ] URL atualizada para `v21.0` (nao mais `v18.0`)
- [ ] `process.env` NAO e a fonte primaria — vault e primario (PA-04)
- [ ] TODOS os callers atualizados para passar `brandId`
- [ ] Multi-tenant: cada brand usa seu proprio pixel e token
- [ ] `npx tsc --noEmit` = 0

---

### S30-PERF-01: Performance Metrics Real + hybrid cache 15min [M+, ~2.5h]

**Objetivo:** Substituir o 501 em `/api/performance/metrics` por fetch real de metricas de Meta e Google, com strategy HYBRID de cache Firestore 15min para evitar rate limit abuse.

> **[ARCH DT-12 — P1]:** Sem cache, 10 usuarios refreshing atingem rate limit da Meta (200/h) em MINUTOS. HYBRID: cache Firestore 15min antes de fetch real.

**Acao:**
1. Em `app/src/app/api/performance/metrics/route.ts`:
   - Manter `mock=true` funcional (P-08)
   - Quando `mock=false`:
     1. Buscar cache: `brands/{brandId}/performance_cache/{date}` — se `updatedAt < 15min`, retornar cache direto (fast path)
     2. Se stale ou inexistente: fetch real via `Promise.all([metaAdapter.fetchMetrics(), googleAdapter.fetchMetrics()])`
     3. Obter tokens via `ensureFreshToken()` → `tokenToCredentials()`
     4. Instanciar `MetaMetricsAdapter` + `GoogleMetricsAdapter`
     5. Normalizar via `normalize()`
     6. Aggregate (somar Meta + Google para 'aggregated')
     7. Persist cache (fire-and-forget — P-06): `brands/{brandId}/performance_cache/{date}`
     8. Persist metricas (fire-and-forget): `brands/{brandId}/performance_metrics`
     9. Retornar `createApiSuccess({ metrics: [...] })`
   - Graceful degradation: se API falhar, retornar cache stale + warning (nao 500 — P-05)

**Arquivos:**
- `app/src/app/api/performance/metrics/route.ts` — **MODIFICAR** (substituir 501 por fetch real + cache)

**Leitura:**
- `app/src/lib/integrations/ads/token-refresh.ts` — ensureFreshToken, tokenToCredentials
- `app/src/lib/performance/adapters/meta-adapter.ts` — MetaMetricsAdapter
- `app/src/lib/performance/adapters/google-adapter.ts` — GoogleMetricsAdapter
- `app/src/lib/performance/adapters/base-adapter.ts` — normalize, AdCredentials

**DTs referenciados:** DT-12
**Dependencias:** S30-CAPI-00 concluido (PERF-01 e paralelo com PERF-02 mas ambos dependem de CAPI-00)
**Gate Check:** S30-GATE-04 (Sim)
**SC mapeados:** SC-01, SC-13

**AC:**
- [ ] `mock=true` continua funcionando (P-08)
- [ ] Cache Firestore consulta `brands/{brandId}/performance_cache/{date}` antes de fetch
- [ ] Cache TTL: 15 minutos (DT-12 — PA-07)
- [ ] Fetch real usa `Promise.all` para Meta + Google em paralelo
- [ ] Tokens obtidos via `ensureFreshToken()` (nao hardcoded — P-09)
- [ ] Persistencia de cache e fire-and-forget (P-06)
- [ ] Graceful degradation: cache stale + warning quando API falha (P-05: nao 500)
- [ ] Retorna `createApiSuccess({ metrics: [...] })` — mesmo shape de response (RC-03)
- [ ] 501 removido completamente
- [ ] `npx tsc --noEmit` = 0

---

### S30-PERF-02: Google Offline Conversions [M, ~2h]

**Objetivo:** Implementar dispatch para Google Ads Offline Conversions em `CAPISyncEngine`, completando o loop de atribuicao Meta + Google.

**Acao:**
1. Em `app/src/lib/integrations/ads/capi-sync.ts`:
   - Adicionar metodo `sendToGoogleOfflineConversions(payload, userData)`
   - Endpoint: `POST /customers/{customerId}/offlineUserDataJobs`
   - Body com `userIdentifiers` e `transactionAttribute`
   - Obter credenciais Google via `MonaraTokenVault.getToken(brandId, 'google')`
   - Integrar no fluxo principal: apos Meta CAPI dispatch, adicionar Google dispatch
   - Usar `fetchWithRetry()` para resiliencia
   - Headers: Authorization + developer-token (via Google credentials)

**Arquivos:**
- `app/src/lib/integrations/ads/capi-sync.ts` — **MODIFICAR** (adicionar Google Offline Conversions)

**Leitura:**
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — GOOGLE_ADS_API

**DTs referenciados:** Nenhum blocking (usa infra de CAPI-00)
**Dependencias:** S30-CAPI-00 concluido (CAPISyncEngine ja refatorado com brandId)
**Gate Check:** S30-GATE-04 (Sim)
**SC mapeados:** SC-10

**AC:**
- [ ] Metodo `sendToGoogleOfflineConversions()` implementado
- [ ] Chama `POST googleads.googleapis.com/v18/customers/{id}/offlineUserDataJobs`
- [ ] Credenciais Google obtidas do vault (nao env vars)
- [ ] Integrado no fluxo principal: Meta CAPI + Google Offline em sequencia
- [ ] Usa `fetchWithRetry()` (PA-05)
- [ ] Headers incluem `developer-token` e `Authorization: Bearer`
- [ ] TODO na L34 do capi-sync.ts removido
- [ ] `npx tsc --noEmit` = 0

---

### S30-GATE-04: Gate Check 4 — Performance & Offline [S, ~30min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G4-01 | Performance metrics real | `rg "501" app/src/app/api/performance/metrics/route.ts` | 0 matches |
| G4-02 | Hybrid cache | `rg "performance_cache" app/src/app/api/performance/metrics/route.ts` | 1+ match |
| G4-03 | CAPI multi-tenant | `rg "constructor(brandId" app/src/lib/integrations/ads/capi-sync.ts` | 1+ match |
| G4-04 | CAPI v21.0 | `rg "v21.0" app/src/lib/integrations/ads/capi-sync.ts` | 1+ match |
| G4-05 | Google Offline Conversions | `rg "offlineUserDataJobs" app/src/lib/integrations/ads/capi-sync.ts` | 1+ match |
| G4-06 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G4-07 | Build sucesso | `npm run build` | >= 103 rotas |
| G4-08 | Testes passando | `npm test` | >= 224/224 pass, 0 fail |

**AC:**
- [ ] G4-01 a G4-08 todos aprovados

---

## Fase 5: STRETCH (Rate Limiting) [~3-4h]

> **STRETCH:** S30-RL-01 so e executado se Gate 4 estiver aprovado com sobra de tempo (Ressalva R2). Pode ser movido para S31 sem impacto no North Star.

---

### S30-RL-01: Rate Limiting por brandId + API call counters [M, ~3-4h] — STRETCH

**Objetivo:** Implementar guardrails de quota por marca, herdado de S29 (S29-FT-04), com counters adicionais para chamadas de APIs externas (Meta/Google).

> **[ARCH DT-16 — P2]:** Alem dos counters originais (api_call, ai_credit, intelligence_scan), adicionar `meta_api_call` (200/h) e `google_api_call` (15000/dia) para prevenir que o Conselho de Funil exceda rate limits das plataformas.

**Acao:**
1. CRIAR `app/src/lib/guards/rate-limiter.ts`:
   - Guard function `checkRateLimit(brandId, action, cost?)`
   - Schema Firestore: `brands/{brandId}/quotas/daily_YYYY-MM-DD`
   - DEFAULT_LIMITS expandidos: 500 API calls/dia, 1000 AI credits/dia, 100 scans/dia, 200 meta_api_calls/h, 15000 google_api_calls/dia
   - Increment atomico do Firestore
   - Reset diario (novo documento por dia)
   - Admin routes ISENTAS (P-13, PA-06 herdado de S29)
2. Integrar em rotas de alto consumo (7+ rotas conforme S29-FT-04)
3. Integrar em chamadas de API externa (meta_api_call, google_api_call)

**Arquivos:**
- `app/src/lib/guards/rate-limiter.ts` — **CRIAR**
- 7+ rotas API — **MODIFICAR** (integrar rate limiting)

**DTs referenciados:** DT-16
**Dependencias:** S30-GATE-04 aprovado
**Gate Check:** Nao (STRETCH)
**SC mapeados:** Nenhum SC dedicado (STRETCH)

**AC:**
- [ ] `rate-limiter.ts` criado com `checkRateLimit()` funcional
- [ ] Schema `QuotaDocument` com counters expandidos (incluindo meta_api_call, google_api_call)
- [ ] 7+ rotas de alto consumo integradas
- [ ] Rotas `/api/admin/*` ISENTAS (P-13)
- [ ] Retorna `createApiError(429, 'Rate limit exceeded')` quando bloqueado
- [ ] `npx tsc --noEmit` = 0

---

## Testes Recomendados (Novos — Dandara)

| # | Teste | Tipo | Arquivo Sugerido | Story |
|:--|:------|:-----|:----------------|:------|
| T-01 | Meta fetchMetrics com token invalido retorna erro descritivo | Unit | `__tests__/lib/performance/meta-adapter.test.ts` | META-01 |
| T-02 | Google fetchMetrics com token invalido retorna erro descritivo | Unit | `__tests__/lib/performance/google-adapter.test.ts` | GOOG-01 |
| T-03 | Token refresh flow para Meta (mock fetch) | Unit | `__tests__/lib/integrations/token-refresh.test.ts` | FN-01 |
| T-04 | Token refresh flow para Google (mock fetch) | Unit | `__tests__/lib/integrations/token-refresh.test.ts` | FN-01 |
| T-05 | Performance metrics route com mock=false e token valido | Integration | `__tests__/api/performance-metrics.test.ts` | PERF-01 |
| T-06 | Performance metrics route graceful degradation | Integration | `__tests__/api/performance-metrics.test.ts` | PERF-01 |
| T-07 | Integration validate com Meta token real (mock fetch) | Unit | `__tests__/api/integrations-validate.test.ts` | FN-02 |
| T-08 | Google pauseAdEntity envia mutation correta | Unit | `__tests__/lib/automation/google-adapter.test.ts` | GOOG-02 |
| T-09 | AdsLookalikeSync query usa brandId scoped collection | Unit | `__tests__/lib/automation/ads-sync.test.ts` | META-04 |
| T-10 | CAPISyncEngine dispara para Meta E Google | Unit | `__tests__/lib/integrations/capi-sync.test.ts` | PERF-02 |
| T-11 | Rate limiter permite e bloqueia corretamente (STRETCH) | Unit | `__tests__/lib/guards/rate-limiter.test.ts` | RL-01 |
| T-12 | AdCredentials interface impede `any` em fetchMetrics | Type | Verificacao via tsc | PRE-02 |

**Nota:** Todos os testes de API externa devem usar mocks de `fetch()` (via `jest.fn()`). NUNCA chamar APIs externas reais em testes automatizados.

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 4 Blocking DTs compreendidos:
  - [ ] **DT-01**: `isTokenExpiring()` DEVE ter buffer per-provider (24h Meta, 15min Google)
  - [ ] **DT-02**: EXISTEM dois MetaAdsAdapter e dois GoogleAdsAdapter. Renomear perf adapters ANTES de implementar
  - [ ] **DT-03**: ads-sync.ts tem BUG DUPLO (collection raiz + constructor). Signature muda para `(brandId)`
  - [ ] **DT-04**: capi-sync.ts usa `process.env` (single-tenant). Migrar para vault com `brandId`
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-S29)
- [ ] Confirmar `npm run build` compila (baseline 103+ rotas)
- [ ] Executar `npm test` e confirmar baseline de 224/224 pass

### Validacoes incrementais — Fase 0:
- [ ] Apos PRE-01: Rename MetaMetricsAdapter + GoogleMetricsAdapter
- [ ] Apos PRE-02: AdCredentials union + UnifiedAdsMetrics expandida + AdsActionResponse expandida
- [ ] Apos PRE-03: AnomalyEngine Timestamp + sensitive keys
- [ ] **GATE CHECK 0**: tsc + build + tests (G0-01 a G0-10)

### Validacoes incrementais — Fase 1:
- [ ] Apos FN-03: isTokenExpiring per-provider + metadata interfaces
- [ ] Apos FN-01: token-refresh.ts + api-helpers.ts + constants.ts criados
- [ ] Apos FN-02: Integration validation real (501 removido)
- [ ] **GATE CHECK 1**: tsc + build + tests (G1-01 a G1-08)

### Validacoes incrementais — Fase 2:
- [ ] Apos META-01: MetaMetricsAdapter fetchMetrics real (Graph API)
- [ ] Apos META-02: updateAdCreative real (zero console.log)
- [ ] Apos META-03: syncCustomAudience real (SHA256 + Graph API)
- [ ] Apos META-04: AdsLookalikeSync fix duplo (collection + constructor)
- [ ] **GATE CHECK 2**: tsc + build + tests (G2-01 a G2-08)

### Validacoes incrementais — Fase 3:
- [ ] Apos GOOG-00: Constructor 3 params + getHeaders()
- [ ] Apos GOOG-01: GoogleMetricsAdapter fetchMetrics real (GAQL)
- [ ] Apos GOOG-02: pauseAdEntity real (campaigns:mutate)
- [ ] Apos GOOG-03: adjustBudget real (campaignBudgets:mutate)
- [ ] Apos GOOG-04: getEntityStatus real (GAQL search)
- [ ] **GATE CHECK 3**: tsc + build + tests (G3-01 a G3-08)

### Validacoes incrementais — Fase 4:
- [ ] Apos CAPI-00: CAPISyncEngine com brandId + vault + v21.0
- [ ] Apos PERF-01: Performance metrics real + cache hybrid 15min
- [ ] Apos PERF-02: Google Offline Conversions funcional
- [ ] **GATE CHECK 4**: tsc + build + tests (G4-01 a G4-08)

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (>= 103 rotas)
- [ ] `npm test` → >= 224/224 pass, 0 fail
- [ ] SC-01 a SC-16 todos aprovados
- [ ] RC-01 a RC-12 todos aprovados (retrocompatibilidade)
- [ ] (STRETCH) Rate limiting funcional

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 16 Decision Topics + 6 Correcoes de Premissa do Architecture Review (Athos)*
*Sprint 30: Ads Integration Foundation (Meta + Google) | 07/02/2026*
*19 stories (3 pre-req + 5 gates + 7 feature core + 3 infra + 1 STRETCH)*
*Estimativa: 23.5-30h (sem STRETCH) / 26.5-34h (com STRETCH)*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), S+ = Small Extended, M = Medium (2-4h), M+ = Medium Extended, L = Large (4-8h)*
