# Allowed Context: Sprint 30 — Ads Integration Foundation (Meta + Google)
**Lanes:** performance + automation + integrations (cross-cutting)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

> Incorpora proibicoes do PRD (P-01 a P-13) e Proibicoes Arquiteturais do Arch Review (PA-01 a PA-08).
> Principio No Global Context: Darllyson le APENAS os arquivos listados aqui por fase.

---

## Contexto Global

### Leitura Obrigatoria (antes de qualquer story)
- `_netecmt/packs/stories/sprint-30-ads-integration/stories.md` — Stories, ACs e checklist
- `_netecmt/packs/stories/sprint-30-ads-integration/story-pack-index.md` — Ordem de execucao, DTs, gates
- `_netecmt/solutioning/architecture/arch-sprint-30.md` — Architecture Review completo (16 DTs, 4 Blocking)

### Referencia de Padroes (LEITURA para contexto)
- `app/src/lib/utils/api-response.ts` — Padrao `createApiError`/`createApiSuccess` (Sigma)
- `app/src/lib/firebase/config.ts` — Referencia de `db` (Firestore Client SDK)
- `app/src/lib/utils/encryption.ts` — Referencia de encrypt/decrypt e sensitiveKeys

### Referencia de Tipos (LEITURA para contexto)
- `app/src/types/performance.ts` — `UnifiedAdsMetrics`, `PerformanceMetric`, `PerformanceConfig`, `PerformanceMetricDoc`
- `app/src/lib/automation/adapters/types.ts` — `IAdsAdapter`, `AdsActionResponse`
- `app/src/lib/performance/adapters/base-adapter.ts` — `AdsPlatformAdapter`, `AdCredentials`, `RawAdsData`, `NormalizedAdapterResult`

---

## Fase 0: Pre-requisitos — Arquivos Permitidos

### S30-PRE-01: Rename adapter naming collision (DT-02)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/performance/adapters/meta-adapter.ts` | **MODIFICAR** — renomear class MetaAdsAdapter → MetaMetricsAdapter |
| `app/src/lib/performance/adapters/google-adapter.ts` | **MODIFICAR** — renomear class GoogleAdsAdapter → GoogleMetricsAdapter |
| `app/src/app/api/performance/metrics/route.ts` | **MODIFICAR** — atualizar imports se necessario |
| `app/src/app/api/performance/integrations/validate/route.ts` | **MODIFICAR** — atualizar imports se necessario |

**Verificacao de callers:**
- Executar `rg "MetaAdsAdapter" app/src/lib/performance/ app/src/app/api/performance/`
- Executar `rg "GoogleAdsAdapter" app/src/lib/performance/ app/src/app/api/performance/`

### S30-PRE-02: Expand types — AdCredentials + UnifiedAdsMetrics + AdsActionResponse

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/performance/adapters/base-adapter.ts` | **MODIFICAR** — adicionar AdCredentials union + type guards + tipar fetchMetrics |
| `app/src/types/performance.ts` | **MODIFICAR** — adicionar clicks, impressions, cpa a UnifiedAdsMetrics |
| `app/src/lib/automation/adapters/types.ts` | **MODIFICAR** — expandir actionTaken + adicionar details |

**Leitura (verificar impacto):**
- `app/src/app/api/performance/metrics/route.ts` — mock pode precisar atualizar
- `app/src/lib/performance/engine/anomaly-engine.ts` — usa PerformanceMetricDoc

### S30-PRE-03: Fix AnomalyEngine + sensitive keys

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/performance/engine/anomaly-engine.ts` | **MODIFICAR** — `new Date() as any` → `Timestamp.now()` |
| `app/src/lib/utils/encryption.ts` | **MODIFICAR** — adicionar developerToken, appSecret a sensitiveKeys |

---

## Fase 1: Foundation — Arquivos Permitidos

### S30-FN-03: MonaraToken enhancement + isTokenExpiring per-provider

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/firebase/vault.ts` | **MODIFICAR** — MetaTokenMetadata + GoogleTokenMetadata + isTokenExpiring per-provider + refreshAndSave + getValidToken |

### S30-FN-01: Token Refresh Engine + api-helpers + constants

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/integrations/ads/constants.ts` | **CRIAR** — META_API, GOOGLE_ADS_API, RETRY_CONFIG |
| `app/src/lib/integrations/ads/api-helpers.ts` | **CRIAR** — fetchWithRetry, sanitizeForLog, sleep |
| `app/src/lib/integrations/ads/token-refresh.ts` | **CRIAR** — ensureFreshToken, tokenToCredentials |

**Leitura (padroes existentes — NAO MODIFICAR):**
- `app/src/lib/integrations/ads/capi-sync.ts` — padrao de retry existente (referencia)
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault API

### S30-FN-02: Integration Validation Real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/performance/integrations/validate/route.ts` | **MODIFICAR** — substituir 501 por validacao real (Meta + Google) |

**Leitura:**
- `app/src/lib/integrations/ads/token-refresh.ts` — ensureFreshToken (criado em FN-01)
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry (criado em FN-01)
- `app/src/lib/integrations/ads/constants.ts` — META_API, GOOGLE_ADS_API (criado em FN-01)
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault

---

## Fase 2: Meta Ads — Arquivos Permitidos

### S30-META-01: MetaMetricsAdapter fetchMetrics real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/performance/adapters/meta-adapter.ts` | **MODIFICAR** — substituir mock por Graph API v21.0 real |

**Leitura:**
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — META_API
- `app/src/lib/performance/adapters/base-adapter.ts` — AdCredentials, RawAdsData, normalize()

### S30-META-02: MetaAdsAdapter updateAdCreative real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/meta.ts` | **MODIFICAR** — reimplementar updateAdCreative (NAO descomentar — reimplementar com error handling) |

**Leitura:**
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — META_API
- `app/src/lib/automation/adapters/types.ts` — AdsActionResponse
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault

### S30-META-03: MetaAdsAdapter syncCustomAudience real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/meta.ts` | **MODIFICAR** — implementar syncCustomAudience com Graph API |

**Leitura:**
- Mesma lista de META-02

### S30-META-04: AdsLookalikeSync real — fix duplo (DT-03)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/ads-sync.ts` | **MODIFICAR** — fix collection raiz + fix constructor + sync real |

**Leitura (verificar callers):**
- `app/src/lib/automation/engine.ts` — provavel caller de `syncHotLeadsToMeta`
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault

**Verificacao de callers (OBRIGATORIA — signature muda):**
- Executar `rg "syncHotLeadsToMeta" app/src/`

---

## Fase 3: Google Ads — Arquivos Permitidos

### S30-GOOG-00: GoogleAdsAdapter constructor refactor (DT-07)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/google.ts` | **MODIFICAR** — constructor (accessToken, developerToken, customerId) + getHeaders() |

**Leitura (verificar callers — OBRIGATORIA):**
- Executar `rg "new GoogleAdsAdapter" app/src/`
- `app/src/lib/automation/engine.ts` — provavel instanciador

### S30-GOOG-01: GoogleMetricsAdapter fetchMetrics real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/performance/adapters/google-adapter.ts` | **MODIFICAR** — substituir mock por Google Ads API v18 real (GAQL searchStream) |

**Leitura:**
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — GOOGLE_ADS_API
- `app/src/lib/performance/adapters/base-adapter.ts` — AdCredentials, RawAdsData

### S30-GOOG-02: GoogleAdsAdapter pauseAdEntity real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/google.ts` | **MODIFICAR** — substituir mock por campaigns:mutate real |

### S30-GOOG-03: GoogleAdsAdapter adjustBudget real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/google.ts` | **MODIFICAR** — substituir mock por campaignBudgets:mutate real |

### S30-GOOG-04: GoogleAdsAdapter getEntityStatus real

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/automation/adapters/google.ts` | **MODIFICAR** — substituir mock por GAQL search real |

---

## Fase 4: Performance & Offline — Arquivos Permitidos

### S30-CAPI-00: Refatorar CAPISyncEngine (DT-04, DT-15)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/integrations/ads/capi-sync.ts` | **MODIFICAR** — adicionar brandId ao constructor + vault + v21.0 |

**Leitura:**
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry

**Verificacao de callers (OBRIGATORIA — constructor muda):**
- Executar `rg "new CAPISyncEngine\|CAPISyncEngine\." app/src/`

### S30-PERF-01: Performance Metrics Real + hybrid cache

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/performance/metrics/route.ts` | **MODIFICAR** — substituir 501 por fetch real + cache hybrid 15min |

**Leitura:**
- `app/src/lib/integrations/ads/token-refresh.ts` — ensureFreshToken, tokenToCredentials
- `app/src/lib/performance/adapters/meta-adapter.ts` — MetaMetricsAdapter
- `app/src/lib/performance/adapters/google-adapter.ts` — GoogleMetricsAdapter
- `app/src/lib/performance/adapters/base-adapter.ts` — normalize, AdCredentials
- `app/src/lib/firebase/config.ts` — db

### S30-PERF-02: Google Offline Conversions

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/integrations/ads/capi-sync.ts` | **MODIFICAR** — adicionar sendToGoogleOfflineConversions |

**Leitura:**
- `app/src/lib/firebase/vault.ts` — MonaraTokenVault
- `app/src/lib/integrations/ads/api-helpers.ts` — fetchWithRetry
- `app/src/lib/integrations/ads/constants.ts` — GOOGLE_ADS_API

---

## Fase 5: STRETCH — Arquivos Permitidos

### S30-RL-01: Rate Limiting por brandId + API call counters

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/guards/rate-limiter.ts` | **CRIAR** — guard function checkRateLimit() com counters expandidos |
| `app/src/app/api/intelligence/audience/scan/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/intelligence/autopsy/run/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/intelligence/spy/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/funnels/generate/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/social/generate/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/design/generate/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/copy/generate/route.ts` | **MODIFICAR** — integrar rate limiting |

**Leitura (padroes — NAO MODIFICAR):**
- `app/src/lib/guards/` — padroes de guard existentes
- `app/src/lib/firebase/config.ts` — referencia de `db`

---

## Proibicoes Consolidadas (PRD P-01 a P-13 + Arch Review PA-01 a PA-08)

### PRD (Iuran) — P-01 a P-13

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **P-01** | **NUNCA adicionar SDK npm** (facebook-nodejs-business-sdk, google-ads-api) | REST puro via fetch(). Zero dependencia nova |
| **P-02** | **NUNCA colocar access_token em LOGS** | Mascarar: `token=***${last4}`. Usar `sanitizeForLog()` |
| **P-03** | **NUNCA buscar leads de collection raiz `/leads`** | SEMPRE `brands/{brandId}/leads` — isolamento multi-tenant |
| **P-04** | **NUNCA armazenar tokens em plain text** | TUDO passa por `encrypt()` via MonaraTokenVault |
| **P-05** | **NUNCA retornar 500 para falha de API externa** | Usar 502 (Bad Gateway). 500 e reservado para erros internos |
| **P-06** | **NUNCA bloquear response esperando persist de metricas** | Fire-and-forget para persist no Firestore |
| **P-07** | **NUNCA mudar URL de API existente** | Todas as rotas mantem exatamente o mesmo path |
| **P-08** | **NUNCA remover parametro `mock=true`** | Mock continua funcionando como fallback |
| **P-09** | **NUNCA hardcodar IDs de teste** (ad_account, customer_id) | Tudo vem do MonaraTokenVault, isolado por brandId |
| **P-10** | **NUNCA ignorar rate limits da plataforma** | Meta: 200/h por ad account. Google: 15000/dia por dev token |
| **P-11** | **NUNCA quebrar os 224 testes existentes** | Zero regressao — novos testes ADICIONAM |
| **P-12** | **NUNCA usar `firebase-admin` ou `google-cloud/*`** | Restricao de ambiente Windows 11 24H2 |
| **P-13** | **NUNCA rate-limitar rotas `/api/admin/*`** | Admin isento — previne self-lockout |

### Arch Review (Athos) — PA-01 a PA-08

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **PA-01** | **NUNCA importar `MetaAdsAdapter` sem verificar qual** | perf = `MetaMetricsAdapter`, automation = `MetaAdsAdapter` |
| **PA-02** | **NUNCA usar buffer fixo em `isTokenExpiring()`** | Meta=24h, Google=15min. Buffer per-provider |
| **PA-03** | **NUNCA passar access token como argumento de adapter constructors** | Constructors recebem `brandId` ou `credentials`. Tokens vem do vault |
| **PA-04** | **NUNCA usar `process.env` para credenciais de Ads em codigo multi-tenant** | Usar MonaraTokenVault. Env vars sao fallback DEV only |
| **PA-05** | **NUNCA chamar API externa sem `fetchWithRetry()` ou `AbortSignal.timeout()`** | Timeout obrigatorio em serverless |
| **PA-06** | **NUNCA logar access tokens completos** | Usar `sanitizeForLog()` — mascarar em logs |
| **PA-07** | **NUNCA fazer fetch real se cache Firestore < 15min** | Hybrid cache previne rate limit abuse |
| **PA-08** | **NUNCA implementar circuit breaker em S30** | Cache HYBRID e suficiente para o volume atual |

---

## Modulos Protegidos (NAO TOCAR — producao estavel)

### Intelligence Core (S27-S29 — producao estavel)
- `app/src/lib/intelligence/attribution/*` — **NAO MODIFICAR** (Attribution Engine)
- `app/src/lib/intelligence/personalization/engine.ts` — **NAO MODIFICAR** (PersonalizationEngine)
- `app/src/lib/intelligence/personalization/middleware.ts` — **NAO MODIFICAR**
- `app/src/lib/intelligence/personalization/propensity.ts` — **NAO MODIFICAR** (PropensityEngine)
- `app/src/lib/intelligence/autopsy/engine.ts` — **NAO MODIFICAR** (AutopsyEngine)
- `app/src/lib/intelligence/offer-lab/scoring.ts` — **NAO MODIFICAR**
- `app/src/lib/intelligence/creative/*` — **NAO MODIFICAR**

### AI Pipeline Core (Sigma — producao estavel)
- `app/src/lib/ai/embeddings.ts` — **NAO MODIFICAR**
- `app/src/lib/ai/rag.ts` — **NAO MODIFICAR**
- `app/src/lib/ai/pinecone.ts` — **NAO MODIFICAR**
- `app/src/lib/ai/gemini.ts` — **NAO MODIFICAR**
- `app/src/lib/utils/api-response.ts` — **NAO MODIFICAR** (padrao Sigma)
- `app/src/lib/auth/conversation-guard.ts` — **NAO MODIFICAR** (padrao Sigma)

### Firebase Core
- `app/src/lib/firebase/config.ts` — **NAO MODIFICAR** (configuracao)
- `app/src/lib/firebase/firestore.ts` — **NAO MODIFICAR**

### Automation (fora do escopo S30)
- `app/src/lib/automation/adapters/instagram.ts` — **NAO MODIFICAR** (S32)
- `app/src/lib/automation/budget-optimizer.ts` — **NAO MODIFICAR**

### Sprint 25-28 Types
- `app/src/types/prediction.ts` — **PROIBIDO**
- `app/src/types/creative-ads.ts` — **PROIBIDO**
- `app/src/types/text-analysis.ts` — **PROIBIDO**
- `app/src/types/autopsy.ts` — **NAO MODIFICAR** (schema estavel S29)
- `app/src/types/offer.ts` — **NAO MODIFICAR** (schema estavel S29)

### Testes existentes
- Todos os 224 testes existentes — **NAO MODIFICAR** (P-11, exceto adaptar imports)

---

## Resumo: Arquivos Novos a Criar (Sprint 30)

| Arquivo | Story | Tipo |
|:--------|:------|:-----|
| `app/src/lib/integrations/ads/constants.ts` | S30-FN-01 | Constantes de API |
| `app/src/lib/integrations/ads/api-helpers.ts` | S30-FN-01 | Helpers: retry, sanitizer, sleep |
| `app/src/lib/integrations/ads/token-refresh.ts` | S30-FN-01 | Token refresh engine |
| `app/src/lib/guards/rate-limiter.ts` | S30-RL-01 (STRETCH) | Guard function |

---

## Resumo: Arquivos Modificados (Sprint 30 — por Fase)

### Fase 0: Pre-requisitos

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/performance/adapters/meta-adapter.ts` | S30-PRE-01 | Rename class → MetaMetricsAdapter |
| `app/src/lib/performance/adapters/google-adapter.ts` | S30-PRE-01 | Rename class → GoogleMetricsAdapter |
| `app/src/lib/performance/adapters/base-adapter.ts` | S30-PRE-02 | AdCredentials union + tipar fetchMetrics |
| `app/src/types/performance.ts` | S30-PRE-02 | Adicionar clicks, impressions, cpa |
| `app/src/lib/automation/adapters/types.ts` | S30-PRE-02 | Expandir actionTaken + details |
| `app/src/lib/performance/engine/anomaly-engine.ts` | S30-PRE-03 | Date → Timestamp |
| `app/src/lib/utils/encryption.ts` | S30-PRE-03 | Adicionar sensitive keys |

### Fase 1: Foundation

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/firebase/vault.ts` | S30-FN-03 | Metadata interfaces + isTokenExpiring per-provider + novos metodos |
| `app/src/lib/integrations/ads/constants.ts` | S30-FN-01 | **CRIAR** |
| `app/src/lib/integrations/ads/api-helpers.ts` | S30-FN-01 | **CRIAR** |
| `app/src/lib/integrations/ads/token-refresh.ts` | S30-FN-01 | **CRIAR** |
| `app/src/app/api/performance/integrations/validate/route.ts` | S30-FN-02 | Substituir 501 por validacao real |

### Fase 2: Meta Ads

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/performance/adapters/meta-adapter.ts` | S30-META-01 | Substituir mock por Graph API v21.0 real |
| `app/src/lib/automation/adapters/meta.ts` | S30-META-02, META-03 | Reimplementar updateAdCreative + implementar syncCustomAudience |
| `app/src/lib/automation/adapters/ads-sync.ts` | S30-META-04 | Fix duplo (collection + constructor) + sync real |

### Fase 3: Google Ads

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/automation/adapters/google.ts` | S30-GOOG-00/02/03/04 | Constructor 3 params + getHeaders + pause/budget/status reais |
| `app/src/lib/performance/adapters/google-adapter.ts` | S30-GOOG-01 | Substituir mock por Google Ads API v18 real |

### Fase 4: Performance & Offline

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/integrations/ads/capi-sync.ts` | S30-CAPI-00, PERF-02 | brandId + vault + v21.0 + Google Offline Conversions |
| `app/src/app/api/performance/metrics/route.ts` | S30-PERF-01 | Substituir 501 por fetch real + hybrid cache 15min |

### Fase 5: STRETCH

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/guards/rate-limiter.ts` | S30-RL-01 | **CRIAR** |
| 7+ rotas API | S30-RL-01 | Integrar rate limiting |

---

## Resumo de Impacto por Contrato

| Lane (contract-map.yaml) | Contrato | Impacto | Risco |
|:--------------------------|:---------|:--------|:------|
| `performance` | `performance.ts` | Adapters implementados com APIs reais, UnifiedAdsMetrics expandida | Alto — core da Sprint |
| `automation` | `types.ts` | AdsActionResponse expandida, GoogleAdsAdapter refatorado, ads-sync corrigido | Alto — 4 stories |
| `integrations` | N/A | Token refresh engine, api-helpers, CAPI refatorado | Alto — infraestrutura nova |
| `types` (cross-cutting) | N/A | performance.ts expandido, AdCredentials criado | Medio — expansao aditiva |
| `api_routes` | N/A | metrics + validate rotas substituem 501 por real | Medio — mesma interface |
| `guards` | N/A | rate-limiter.ts (STRETCH) | Baixo — modulo novo isolado |

**NENHUM contrato ativo sera quebrado.** Justificativas:
1. Rotas mantem exatamente mesmos paths e shapes de response (P-07, RC-01 a RC-12)
2. `mock=true` preservado como fallback em todas as rotas (P-08)
3. Tipos sao EXPANDIDOS (novos campos) — nunca reduzidos
4. Adapters substituem mocks por implementacao real — mesma interface abstrata
5. MonaraToken.metadata continua `Record<string, any>` na runtime (RC-06)
6. Token refresh e infraestrutura nova — zero impacto em codigo existente
7. 224/224 testes mantidos em cada gate (P-11)

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Incorpora proibicoes do PRD (Iuran, P-01 a P-13) e Proibicoes Arquiteturais do Arch Review (Athos, PA-01 a PA-08)*
*Sprint 30: Ads Integration Foundation (Meta + Google) | 07/02/2026*
*19 stories | 4 arquivos novos | 14+ arquivos modificados*
*Principio No Global Context: Darllyson le APENAS os arquivos listados aqui por fase*
