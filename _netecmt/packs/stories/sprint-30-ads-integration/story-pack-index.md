# Story Pack: Sprint 30 — Ads Integration Foundation (Meta + Google)
**ID:** S30-00
**Lane:** performance + automation + integrations (cross-cutting)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)

## PRD & Architecture Review
- **PRD:** `_netecmt/solutioning/prd/prd-sprint-30-ads-integration-foundation.md` — Iuran (PM)
- **Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-30.md` — Athos (Architect)
- **Arch Status:** APROVADO COM RESSALVAS (16 DTs, 4 Blocking)
- **Tipo:** Feature Sprint (Alto Impacto de Negocio)

## Predecessora
- Sprint 29 (Assets & Persistence Hardening) — CONCLUIDA (QA 100/100)
- Baseline: `tsc --noEmit` = 0, `npm run build` = sucesso (103+ rotas), 224/224 testes passando

## Squad
| Papel | Agente | Responsabilidade |
|:------|:-------|:-----------------|
| PM | Iuran | PRD, escopo, proibicoes (P-01 a P-13) |
| Architect | Athos | 16 DTs, schemas, sequencia refinada, estimativa revisada |
| SM | Leticia | Story Pack, gates, allowed context |
| Dev | Darllyson | Implementacao guiada por stories |
| QA | Dandara | SC-01 a SC-16, RC-01 a RC-12 |

---

## Success Criteria (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| **SC-01** | `GET /api/performance/metrics?brandId=X&mock=false` retorna dados reais de Meta + Google | Chamada com token valido retorna array de PerformanceMetric com dados reais | Dandara |
| **SC-02** | `MetaMetricsAdapter.fetchMetrics()` chama Graph API v21.0 | Network log mostra request para `graph.facebook.com` | Dandara |
| **SC-03** | `GoogleMetricsAdapter.fetchMetrics()` chama Google Ads API v18 | Network log mostra request para `googleads.googleapis.com` | Dandara |
| **SC-04** | `GoogleAdsAdapter.pauseAdEntity()` envia mutate real | Campaign status muda no Google Ads dashboard | Dandara |
| **SC-05** | `GoogleAdsAdapter.adjustBudget()` ajusta budget real | Budget muda no Google Ads dashboard | Dandara |
| **SC-06** | `GoogleAdsAdapter.getEntityStatus()` retorna status real | Status e budget corretos vs dashboard | Dandara |
| **SC-07** | `MetaAdsAdapter.updateAdCreative()` atualiza criativo real | Ad creative muda no Meta Ads Manager | Dandara |
| **SC-08** | `MetaAdsAdapter.syncCustomAudience()` envia dados SHA256 | Custom Audience no Meta mostra novos usuarios | Dandara |
| **SC-09** | `AdsLookalikeSync` exporta leads hot (segment='hot') para Meta | Query usa `brands/{brandId}/leads` com filtro `segment` | Dandara |
| **SC-10** | `CAPISyncEngine` dispara para Google Offline Conversions | Conversao aparece no Google Ads attribution | Dandara |
| **SC-11** | `POST /api/performance/integrations/validate` valida tokens reais | Meta: GET /me retorna user. Google: GET /customers retorna account | Dandara |
| **SC-12** | Token refresh automatico funcional para Meta e Google | Token expirado e renovado antes da chamada API | Dandara |
| **SC-13** | Graceful degradation quando API indisponivel | Retorna cached + warning, nao 500 | Dandara |
| **SC-14** | 224+ testes passando (zero regressao) | `npm test` em cada Gate | Dandara |
| **SC-15** | tsc=0, build=103+ rotas | `npx tsc --noEmit && npm run build` | Dandara |
| **SC-16** | `credentials: any` substituido por `AdCredentials` tipado | Zero `any` em signatures de fetchMetrics | Dandara |

---

## Estrutura: 5 Fases + 5 Gates + 1 STRETCH

### Fase 0: Pre-requisitos (DT-02, DT-05, DT-06, DT-08, DT-09, DT-14) — ~55min
- **3 Stories** (todas paralelizaveis): S30-PRE-01, S30-PRE-02, S30-PRE-03
- **1 Gate**: S30-GATE-00

### -- GATE CHECK 0 -- (tsc + build + tests = 224/224 — baseline intacto) --

### Fase 1: Foundation (Gate) — ~4-4.5h
- **3 Stories** (sequenciais): S30-FN-03 → S30-FN-01 → S30-FN-02
- **1 Gate**: S30-GATE-01

### -- GATE CHECK 1 -- (tsc + build + tests + validation real + token refresh funcional) --

### Fase 2: Meta Ads (Gate) — ~6-8h
- **4 Stories**: S30-META-01, S30-META-02 | S30-META-03 (paralelos) → S30-META-04
- **1 Gate**: S30-GATE-02

### -- GATE CHECK 2 -- (tsc + build + tests + Meta funcional) --

### Fase 3: Google Ads (Gate) — ~5.5-7.5h
- **Pre-step**: Refatorar GoogleAdsAdapter constructor (DT-07)
- **5 Stories**: S30-GOOG-00 → S30-GOOG-01, S30-GOOG-02 | S30-GOOG-03 (paralelos) → S30-GOOG-04
- **1 Gate**: S30-GATE-03

### -- GATE CHECK 3 -- (tsc + build + tests + Google funcional) --

### Fase 4: Performance & Offline Conversions (Gate) — ~5-6h
- **Pre-step**: Refatorar CAPISyncEngine (DT-04, DT-15)
- **3 Stories**: S30-CAPI-00 → S30-PERF-01, S30-PERF-02
- **1 Gate**: S30-GATE-04

### -- GATE CHECK 4 -- (tsc + build + tests + metricas reais + CAPI multi-tenant) --

### Fase 5: STRETCH (Rate Limiting) — ~3-4h
- **1 Story**: S30-RL-01 — somente apos Gate 4 aprovado

### QA Final — ~2h
- Dandara valida SC-01 a SC-16 + RC-01 a RC-12

---

## Blocking DTs Checklist — Pre-flight (4 P0 BLOCKING do Arch Review)

> A SM NAO autoriza inicio da implementacao sem confirmacao dos 4 DTs blocking:

- [ ] **DT-01 (P0 BLOCKING)**: Darllyson entende que `isTokenExpiring()` tem buffer FIXO de 24h — INCOMPATIVEL com Google (tokens de 1h). DEVE receber `provider` como parametro: Meta=24h, Google=15min. Sem isso, Google refresh dispara a CADA chamada.
- [ ] **DT-02 (P0 BLOCKING)**: Darllyson entende que existem DOIS `MetaAdsAdapter` e DOIS `GoogleAdsAdapter` com nomes identicos em modulos diferentes (performance vs automation). Renomear os de performance para `MetaMetricsAdapter`/`GoogleMetricsAdapter` ANTES de implementar qualquer feature. Sem isso, imports cruzados sao inevitaveis.
- [ ] **DT-03 (P0 BLOCKING)**: Darllyson entende que `ads-sync.ts` tem BUG DUPLO: (1) query na collection raiz `/leads` e (2) constructor passa `metaToken` como `brandId`. A signature do metodo `syncHotLeadsToMeta` muda de `(brandId, metaToken, adAccountId)` para `(brandId)`. O token vem do vault, nao de parametro.
- [ ] **DT-04 (P0 BLOCKING)**: Darllyson entende que `capi-sync.ts` usa `process.env` para `META_CAPI_ACCESS_TOKEN` e `META_CAPI_PIXEL_ID` — single-tenant. DEVE migrar para `MonaraTokenVault` com `brandId` no constructor. Manter env vars como fallback para dev local. Tambem atualizar versao da Graph API de v18.0 para v21.0.

---

## Ordem de Execucao (Darllyson)

```
[FASE 0 — Pre-requisitos (GATE)]
  S30-PRE-01 (Rename MetaAdsAdapter/GoogleAdsAdapter perf, XS, ~20min) — paralelo
  S30-PRE-02 (Expand types: UnifiedAdsMetrics + AdsActionResponse + AdCredentials, S, ~30min) — paralelo
  S30-PRE-03 (Fix AnomalyEngine Date→Timestamp + sensitive keys, XS, ~10min) — paralelo

  ── S30-GATE-00 ── (tsc + build + tests = 224/224) ──

[FASE 1 — Foundation (GATE)]
  S30-FN-03 (MonaraToken enhancement + isTokenExpiring per-provider, S, ~45min, DT-01/DT-14)
    → S30-FN-01 (Token Refresh Engine + api-helpers.ts + constants.ts, M, ~2h, DT-13)
      → S30-FN-02 (Integration Validation Real, S, ~1.5h)

  ── S30-GATE-01 ── (tsc + build + tests + validation real + token refresh) ──

[FASE 2 — Meta Ads (GATE)]
  S30-META-01 (MetaMetricsAdapter fetchMetrics real, M, ~2.5h)
  S30-META-02 (MetaAdsAdapter updateAdCreative real, M, ~2h) — paralelo com META-03
  S30-META-03 (MetaAdsAdapter syncCustomAudience real, M, ~2h) — paralelo com META-02
    → S30-META-04 (AdsLookalikeSync real — fix DUPLO DT-03, S+, ~1.5h) — depende de META-03

  ── S30-GATE-02 ── (tsc + build + tests + Meta funcional) ──

[FASE 3 — Google Ads (GATE)]
  ★ S30-GOOG-00 (GoogleAdsAdapter constructor refactor 3 params + getHeaders, XS, ~30min, DT-07)
  S30-GOOG-01 (GoogleMetricsAdapter fetchMetrics real, M, ~3h)
  S30-GOOG-02 (GoogleAdsAdapter pauseAdEntity real, M-, ~1.5h) — paralelo com GOOG-03
  S30-GOOG-03 (GoogleAdsAdapter adjustBudget real, S, ~1.5h) — paralelo com GOOG-02
    → S30-GOOG-04 (GoogleAdsAdapter getEntityStatus real, S, ~1h)

  ── S30-GATE-03 ── (tsc + build + tests + Google funcional) ──

[FASE 4 — Performance & Offline (GATE)]
  ★ S30-CAPI-00 (Refatorar CAPISyncEngine: brandId + vault + v21.0, M, ~1.5h, DT-04/DT-15)
  S30-PERF-01 (Performance Metrics Real + hybrid cache 15min, M+, ~2.5h, DT-12)
  S30-PERF-02 (Google Offline Conversions, M, ~2h)

  ── S30-GATE-04 ── (tsc + build + tests + metricas reais + CAPI multi-tenant) ──

[FASE 5 — STRETCH]
  S30-RL-01 (Rate Limiting + API call counters, M, ~3-4h, DT-16) — somente apos Gate 4 aprovado

[QA FINAL]
  Dandara valida SC-01 a SC-16 + RC-01 a RC-12 + regressao completa
```

**Notas sobre paralelismo (Arch Review Secao 11):**
- F0: PRE-01, PRE-02, PRE-03 sao TODOS independentes (podem paralelizar)
- F1: Sequencial — FN-03 → FN-01 → FN-02 (dependencias diretas)
- F2: META-02 e META-03 podem paralelizar. META-04 depende de META-03
- F3: GOOG-00 primeiro. GOOG-02 e GOOG-03 podem paralelizar. GOOG-04 depende de GOOG-02/03
- F4: CAPI-00 primeiro. PERF-01 e PERF-02 podem paralelizar apos CAPI-00
- F5: STRETCH — so apos Gate 4 aprovado

---

## Estimativa Revisada (Arch Review — Athos, aceita pelo Conselho)

| Fase | Stories | Estimativa | Gate? | Delta vs PRD |
|:-----|:--------|:----------|:------|:-------------|
| **FASE 0** | | | | |
| Pre-requisitos | S30-PRE-01/02/03 | ~55min | — | +55min (Fase nao prevista no PRD) |
| **— S30-GATE-00 —** | — | ~15min | **SIM** | — |
| **Subtotal F0** | **3 + 1 gate** | **~1h10min** | | **+1h10min** |
| **FASE 1** | | | | |
| Foundation | S30-FN-03, FN-01, FN-02 | ~4-4.5h | — | +30min (DT-01, DT-14) |
| **— S30-GATE-01 —** | — | ~30min | **SIM** | — |
| **Subtotal F1** | **3 + 1 gate** | **~4.5-5h** | | **+30min** |
| **FASE 2** | | | | |
| Meta Ads | S30-META-01 a META-04 | ~6-8h | — | +1h (CP-02, DT-03) |
| **— S30-GATE-02 —** | — | ~30min | **SIM** | — |
| **Subtotal F2** | **4 + 1 gate** | **~6.5-8.5h** | | **+1h** |
| **FASE 3** | | | | |
| Google Ads | S30-GOOG-00 a GOOG-04 | ~5.5-7.5h | — | +0.5h (DT-07) |
| **— S30-GATE-03 —** | — | ~30min | **SIM** | — |
| **Subtotal F3** | **5 + 1 gate** | **~6-8h** | | **+0.5h** |
| **FASE 4** | | | | |
| Performance & Offline | S30-CAPI-00, PERF-01, PERF-02 | ~5-6h | — | +1.5-2h (DT-04, DT-12, DT-13, DT-15) |
| **— S30-GATE-04 —** | — | ~30min | **SIM** | — |
| **Subtotal F4** | **3 + 1 gate** | **~5.5-6.5h** | | **+1.5-2h** |
| **QA Final** | — | ~2h | — | — |
| **TOTAL (sem STRETCH)** | **18 stories + 5 gates** | **~23.5-30h** | **5 gates** | **+4.5-6h vs PRD** |
| **FASE 5 (STRETCH)** | | | | |
| Rate Limiting | S30-RL-01 | ~3-4h | Nao | = |
| **TOTAL (com STRETCH)** | **19 stories + 5 gates** | **~26.5-34h** | **5 gates** | **+4.5-6h vs PRD** |

**Razao do delta +5h justificada por:**
- DT-02: +55min (Fase 0 inteira — rename + types expansion)
- DT-01/DT-14: +30min (buffer per-provider + metadata tipada)
- DT-03: +30min (bug duplo ads-sync — constructor + collection)
- CP-02: +30min (meta.ts nao e "descomentar" — reimplementar com error handling)
- DT-04/DT-15: +1h (CAPI refactor para multi-tenant + v18→v21)
- DT-12: +30min (hybrid cache strategy)
- DT-13: +30min (fetchWithRetry helper compartilhado)
- DT-07: +30min (GoogleAdsAdapter constructor 3 params + callers)

---

## Decision Topics Incorporados (16 DTs do Arch Review)

| DT | Titulo | Severidade | Blocking? | Story Incorporada | Acao |
|:---|:-------|:-----------|:----------|:-------------------|:-----|
| **DT-01** | **Token refresh: buffer per-provider** | **P0** | **SIM** | S30-FN-03 | `isTokenExpiring()` receber provider, 24h Meta / 15min Google |
| **DT-02** | **Naming collision: dois MetaAdsAdapter** | **P0** | **SIM** | S30-PRE-01 | Renomear perf adapters: `MetaMetricsAdapter`, `GoogleMetricsAdapter` |
| **DT-03** | **ads-sync: bug duplo (collection + constructor)** | **P0** | **SIM** | S30-META-04 | Fix collection raiz + constructor + signature do metodo |
| **DT-04** | **CAPI: migrar env vars para vault** | **P0** | **SIM** | S30-CAPI-00 | CAPISyncEngine receber brandId, buscar de vault |
| **DT-05** | AdCredentials: union discriminada | P1 | Nao | S30-PRE-02 | MetaAdCredentials + GoogleAdCredentials com type guards |
| **DT-06** | AdsActionResponse: expandir actions | P1 | Nao | S30-PRE-02 | Adicionar `update_creative`, `sync_audience`, `get_status` |
| **DT-07** | GoogleAdsAdapter: adicionar accessToken | P1 | Nao | S30-GOOG-00 | Constructor com 3 params + `getHeaders()` helper |
| **DT-08** | UnifiedAdsMetrics: clicks + impressions | P1 | Nao | S30-PRE-02 | Adicionar campos ao tipo, eliminar intersection hack |
| **DT-09** | AnomalyEngine: Date → Timestamp | P2 | Nao | S30-PRE-03 | Substituir `new Date() as any` por `Timestamp.now()` |
| **DT-10** | SDK vs REST: decisao correta | P1 | Nao | — | APROVADA — zero alteracao |
| **DT-11** | Sandbox vs Production: strategy correta | P1 | Nao | — | APROVADA — adicionar warning para Google test token |
| **DT-12** | Performance route: hybrid cache 15min | P1 | Nao | S30-PERF-01 | Cache Firestore 15min antes de fetch real |
| **DT-13** | Error handling: fetchWithRetry + sanitizer | P1 | Nao | S30-FN-01 | Generalizar retry do capi-sync para helper compartilhado |
| **DT-14** | MonaraToken: metadata tipada por plataforma | P1 | Nao | S30-FN-03 | Metadata interfaces por provider + encrypt sensitive keys |
| **DT-15** | CAPI: upgrade v18→v21 + brandId | P1 | Nao | S30-CAPI-00 | Versao + multi-tenant |
| **DT-16** | Rate Limiting: reusar S29 + counters de API | P2 | Nao | S30-RL-01 | Adicionar `meta_api_call` e `google_api_call` counters |

---

## Correcoes de Premissa do PRD (Arch Review)

| # | Premissa do PRD | Realidade | Impacto |
|:--|:----------------|:----------|:--------|
| CP-01 | "`ads-sync.ts` tem bug de multi-tenant (collection raiz)" | Tem DOIS bugs: collection raiz + constructor passa token como brandId. Signature do metodo muda | +30min |
| CP-02 | "`meta.ts` ja tem chamadas Graph API comentadas — basta descomentar" | Codigo comentado esta INCOMPLETO: falta error handling, headers, timeout. E reimplementar, nao descomentar | +30min |
| CP-03 | "`base-adapter.ts` usa `credentials: any` — tipar" | Correto, mas ha DOIS adapter systems com nomes iguais. Desambiguar primeiro | +45min |
| CP-04 | "CAPI ja tem Meta CAPI funcional — so falta Google Offline" | CAPI usa env vars single-tenant e Graph API v18.0. Migrar para vault e v21.0 | +1h |
| CP-05 | "MonaraTokenVault.isTokenExpiring() com buffer 24h" | Buffer fixo nao funciona para Google (token 1h). Buffer per-provider | +15min |
| CP-06 | "UnifiedAdsMetrics ja tem os campos necessarios" | Nao tem clicks nem impressions. AnomalyEngine usa tipo diferente | +30min |

---

## Proibicoes (PRD P-01 a P-13 + Arch Review PA-01 a PA-08)

### PRD (Iuran) — P-01 a P-13

| # | Proibicao |
|:--|:----------|
| P-01 | **NUNCA adicionar SDK npm** (facebook-nodejs-business-sdk, google-ads-api) — REST puro via fetch() |
| P-02 | **NUNCA colocar access_token em LOGS** — mascarar: `token=***${last4}` |
| P-03 | **NUNCA buscar leads de collection raiz `/leads`** — SEMPRE `brands/{brandId}/leads` |
| P-04 | **NUNCA armazenar tokens em plain text** — TUDO passa por `encrypt()` |
| P-05 | **NUNCA retornar 500 para falha de API externa** — usar 502 (Bad Gateway) |
| P-06 | **NUNCA bloquear response esperando persist de metricas** — fire-and-forget |
| P-07 | **NUNCA mudar URL de API existente** — todas as rotas mantem mesmo path |
| P-08 | **NUNCA remover parametro `mock=true`** — mock continua como fallback |
| P-09 | **NUNCA hardcodar IDs de teste** (ad_account, customer_id) — tudo do vault |
| P-10 | **NUNCA ignorar rate limits da plataforma** — Meta: 200/h, Google: 15000/dia |
| P-11 | **NUNCA quebrar os 224 testes existentes** — zero regressao |
| P-12 | **NUNCA usar `firebase-admin` ou `google-cloud/*`** — restricao Windows 11 24H2 |
| P-13 | **NUNCA rate-limitar rotas `/api/admin/*`** — admin isento |

### Arch Review (Athos) — PA-01 a PA-08

| # | Proibicao |
|:--|:----------|
| PA-01 | **NUNCA importar `MetaAdsAdapter` sem verificar qual dos dois** — perf = `MetaMetricsAdapter`, automation = `MetaAdsAdapter` |
| PA-02 | **NUNCA usar buffer fixo em `isTokenExpiring()`** — Meta=24h, Google=15min |
| PA-03 | **NUNCA passar access token como primeiro argumento de adapter constructors** — constructors recebem `brandId` ou `credentials`. Tokens vem do vault |
| PA-04 | **NUNCA usar `process.env` para credenciais de Ads em codigo multi-tenant** — usar MonaraTokenVault |
| PA-05 | **NUNCA chamar API externa sem `fetchWithRetry()` ou `AbortSignal.timeout()`** — timeout obrigatorio |
| PA-06 | **NUNCA logar access tokens completos** — usar `sanitizeForLog()` |
| PA-07 | **NUNCA fazer fetch real de metricas se cache Firestore < 15min** — hybrid cache |
| PA-08 | **NUNCA implementar circuit breaker em S30** — cache HYBRID e suficiente |

---

## Ressalvas do Conselho (R1-R8)

| # | Ressalva | Incorporacao no Story Pack |
|:--|:---------|:--------------------------|
| R1 | Gate Checks sao BLOQUEANTES (5 gates) | S30-GATE-00 a GATE-04 entre cada fase |
| R2 | Rate Limiting e STRETCH | S30-RL-01 so apos Gate 4 aprovado |
| R3 | Padroes Sigma sao lei | `createApiError`, `requireBrandAccess`, `Timestamp`, `force-dynamic` obrigatorios |
| R4 | REST puro — zero SDK npm novo | D-02 do PRD aprovada pelo Athos |
| R5 | 4 Blocking DTs DEVEM ser resolvidos antes de features | DT-01 (F1), DT-02 (F0), DT-03 (F2), DT-04 (F4) |
| R6 | Estimativa revisada +5h vs PRD | Aceita pelo Conselho (23.5-30h sem STRETCH) |
| R7 | Fase 0 (pre-requisitos) e OBRIGATORIA antes de qualquer feature | Rename + types antes de tocar adapters |
| R8 | CAPI refactor antes de Google Offline | DT-04/DT-15 sao pre-step de Fase 4 |

---

## Milestones

| Milestone | Validacao | Stories Concluidas |
|:----------|:----------|:-------------------|
| **M0: Types & Naming Clean** | Gate Check 0 aprovado — baseline 224/224 intacto | S30-PRE-01/02/03, S30-GATE-00 |
| **M1: Foundation Ready** | Token refresh funcional + validation real | S30-FN-03, FN-01, FN-02, S30-GATE-01 |
| **M2: Meta Live** | fetchMetrics + updateAdCreative + syncCustomAudience + LookalikeSync funcionais | S30-META-01/02/03/04, S30-GATE-02 |
| **M3: Google Live** | fetchMetrics + pause + budget + status funcionais | S30-GOOG-00/01/02/03/04, S30-GATE-03 |
| **M4: Performance Real** | Metricas reais no dashboard + Google Offline + CAPI multi-tenant | S30-CAPI-00, PERF-01, PERF-02, S30-GATE-04 |
| **M5: Sprint Complete** | SC-01 a SC-16 aprovados | QA Final (Dandara) |
| **M6: (STRETCH) Rate Limited** | Rate limiting com counters de API | S30-RL-01 |

---

## Schemas Firestore (Referencia Arch Review)

| Collection | Path | Story | Status |
|:-----------|:-----|:------|:-------|
| Performance Cache | `brands/{brandId}/performance_cache/{date}` | S30-PERF-01 | Novo — cache hybrid 15min (DT-12) |
| Performance Configs | `brands/{brandId}/performance_configs` | S30-FN-02 | Existente — persistir status de integracao |
| Performance Metrics | `brands/{brandId}/performance_metrics` | S30-PERF-01 | Existente — metricas persistidas |
| Leads | `brands/{brandId}/leads/{leadId}` | S30-META-04 | Existente — query scoped (fix DT-03) |
| Secrets (Vault) | `brands/{brandId}/secrets` | S30-FN-03 | Existente — MonaraTokenVault |
| Quotas | `brands/{brandId}/quotas/{period}` | S30-RL-01 (STRETCH) | Herdado de S29 arch |

---

## Arquivos Criados (Novos)

| Arquivo | Fase | DT | Descricao |
|:--------|:-----|:---|:----------|
| `lib/integrations/ads/token-refresh.ts` | F1 | DT-01 | ensureFreshToken() + tokenToCredentials() |
| `lib/integrations/ads/api-helpers.ts` | F1 | DT-13 | fetchWithRetry() + sanitizeForLog() + sleep() |
| `lib/integrations/ads/constants.ts` | F1 | — | META_API, GOOGLE_ADS_API, RETRY_CONFIG |
| `lib/guards/rate-limiter.ts` | F5 | DT-16 | checkRateLimit() — STRETCH |

## Namespace Final (Apos S30 — referencia Arch Review Apendice A)

```
lib/performance/adapters/
  ├── base-adapter.ts        → AdsPlatformAdapter (abstract), AdCredentials, RawAdsData
  ├── meta-adapter.ts        → MetaMetricsAdapter (extends AdsPlatformAdapter)  ← RENAMED
  └── google-adapter.ts      → GoogleMetricsAdapter (extends AdsPlatformAdapter)  ← RENAMED

lib/automation/adapters/
  ├── types.ts               → IAdsAdapter, AdsActionResponse
  ├── meta.ts                → MetaAdsAdapter (class, uses vault)  ← NOME MANTIDO
  ├── google.ts              → GoogleAdsAdapter (implements IAdsAdapter)  ← NOME MANTIDO
  ├── ads-sync.ts            → AdsLookalikeSync (static methods)
  └── instagram.ts           → InstagramAdapter (out of scope S30)

lib/integrations/ads/
  ├── capi-sync.ts           → CAPISyncEngine (Meta CAPI + Google Offline)
  ├── token-refresh.ts       → ensureFreshToken(), tokenToCredentials()  ← NOVO
  ├── api-helpers.ts         → fetchWithRetry(), sanitizeForLog()  ← NOVO
  └── constants.ts           → META_API, GOOGLE_ADS_API, RETRY_CONFIG  ← NOVO
```

---
*Story Pack preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 30: Ads Integration Foundation (Meta + Google) | 07/02/2026*
*19 stories (3 pre-req + 5 gates + 7 feature core + 3 infra + 1 STRETCH) | 16 DTs incorporados | 4 Blocking | 5 Gates*
*Estimativa: 23.5-30h (sem STRETCH) / 26.5-34h (com STRETCH)*
*Baseline: 224/224 testes, tsc=0, build=103+ rotas, QA=100/100*
