# PRD: Ads Integration Foundation (Meta + Google) — Sprint 30

**Versao:** 1.0  
**Responsavel:** Iuran (PM)  
**Status:** Draft — Ready for Architecture Review  
**Data:** 07/02/2026  
**Predecessora:** Sprint 29 (Assets & Persistence Hardening) — CONCLUIDA (QA 100/100)  
**Tipo:** Feature Sprint (Alto Impacto de Negocio)  
**Estimativa Total:** ~20-26h (7 items core + 1 STRETCH)

---

## 1. Contexto Estrategico

### 1.1 Baseline pos-Sprint 29

| Metrica | Valor |
|:--------|:------|
| Testes passando | 224/224 (42 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | 103+ rotas (Next.js 16.1.1 Turbopack) |
| Trajetoria QA | S25(93) → S26(97) → S27(97) → S28(98) → Sigma(99) → **S29(100)** |
| Auth cobertura | 100% — `requireBrandAccess` em TODAS as rotas brand-scoped |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Tipos consolidados | Zero `[key: string]: unknown` em interfaces core |
| Pinecone | Unificado (Sigma) |
| Discovery Hub | Funcional com multi-query (S29) |
| Persistencia | Autopsy + Offer funcionais no Firestore (S29) |
| LeadState | 12 campos concretos (PropensityEngine + Maestro) |
| BYO Keys | MonaraTokenVault com AES-256 — `brands/{brandId}/secrets` |

### 1.2 Por que Sprint 30 e a sprint de MAIOR IMPACTO DE NEGOCIO

O Conselho de Funil possui hoje uma **Agency Engine completa** — da inteligencia (Spy, Autopsy, Audience Scan, Keyword Mining) a geracao de conteudo (Creative Engine, Copy Gen, Design Gen, Social Gen). Porem, **toda a camada de Ads e Performance opera com dados falsos**:

- `MetaAdsAdapter.fetchMetrics()` — retorna mock hardcoded
- `GoogleAdsAdapter.fetchMetrics()` — retorna mock hardcoded
- `GET /api/performance/metrics` — retorna HTTP 501 se `mock=false`
- `POST /api/performance/integrations/validate` — retorna HTTP 501 se `mock=false`
- `GoogleAdsAdapter.pauseAdEntity()` — retorna mock, nao pausa nada
- `GoogleAdsAdapter.adjustBudget()` — retorna mock, nao ajusta nada
- `AdsLookalikeSync.syncHotLeadsToMeta()` — simula envio, nao exporta leads
- `CAPISyncEngine` — Meta CAPI funcional, Google Offline Conversions TODO
- Validacao de integracao — mock com `setTimeout(800ms)`

**Impacto direto:** O usuario configura credenciais, mas nao consegue ver metricas reais, pausar campanhas com baixo desempenho, nem exportar leads quentes para lookalikes. O Performance War Room e um **teatro** — tela bonita, dados falsos.

**Sprint 30 transforma teatro em realidade.** E o caminho mais curto para monetizacao, pois:
1. **Ads sao onde o dinheiro esta** — usuarios pagam por tools que otimizam ROAS
2. **Dados reais alimentam toda a engine** — Anomaly Engine, Performance Advisor, Budget Optimizer todos dependem de metricas reais
3. **Lookalike sync e upsell natural** — exportar leads hot para Meta Custom Audiences e diferencial competitivo
4. **Offline conversions fecham o loop** — atribuicao real de receita por canal

### 1.3 Inventario de Stubs/TODOs a Eliminar (9 total)

| # | Arquivo | Linha(s) | TODO/Stub | Estado Atual |
|:--|:--------|:---------|:----------|:-------------|
| 1 | `lib/performance/adapters/meta-adapter.ts` | L8 | `// TODO: Implementar integração real com Meta Graph API` | fetchMetrics retorna 1 metric mock |
| 2 | `lib/performance/adapters/google-adapter.ts` | L8 | `// TODO: Implementar integração real com Google Ads API` | fetchMetrics retorna 1 metric mock |
| 3 | `lib/automation/adapters/google.ts` | L14, L42, L70 | 3 TODOs: pauseAdEntity, adjustBudget, getEntityStatus | Todos retornam mock |
| 4 | `lib/automation/adapters/ads-sync.ts` | L40 | `// TODO: Implementar uploadCustomAudience` | Simula envio |
| 5 | `lib/integrations/ads/capi-sync.ts` | L34 | `// TODO: Disparar para Google Ads Offline Conversions` | Meta CAPI funcional, Google pendente |
| 6 | `app/api/performance/metrics/route.ts` | L36-37 | Retorna 501 se mock=false | Mock funcional, real nao |
| 7 | `app/api/performance/integrations/validate/route.ts` | L42 | Retorna 501 se mock=false | Mock funcional, real nao |
| 8 | `lib/automation/adapters/meta.ts` | L37-39, L70 | updateAdCreative e syncCustomAudience comentados | Console.log, nao chama Graph API |
| 9 | Rate Limiting (STRETCH S29) | — | S29-FT-04 nao executado | Zero guardrails de quota |

---

## 2. Objetivo da Sprint

> **"Substituir TODOS os mocks de Ads por integracoes reais com Meta Graph API e Google Ads API, habilitando metricas reais no Performance War Room, acoes automatizadas em campanhas, e sincronizacao de audiencias — transformando o Agency Engine em uma plataforma funcional de gestao de ads."**

### 2.1 North Star Metrics

| Metrica | Antes (S29) | Meta (S30) |
|:--------|:-----------|:-----------|
| Stubs/TODOs de Ads | **9** | **0** |
| Performance Metrics com dados reais | **0** (501 Not Implemented) | **100%** (Meta + Google + Aggregated) |
| Acoes de Ads funcionais (pause, budget) | **0/5** (todos mock) | **5/5** (Meta + Google reais) |
| Lookalike Sync | **0** (simulado) | **Funcional** (Meta Custom Audiences) |
| Offline Conversions | **1/2** (Meta OK, Google pendente) | **2/2** (Meta + Google) |

### 2.2 Metricas Secundarias

| Metrica | Meta |
|:--------|:-----|
| Testes passando | >= 224/224 (zero regressao) + novos testes de integracao |
| TypeScript errors | 0 |
| Build rotas | >= 103+ |
| QA Score | >= 100/100 |
| Novas dependencias npm | 0 (REST puro — ver Decisao D-02) |
| Tempo medio de fetch de metricas | < 3s (Graph API + Google Ads API) |
| Token refresh automatico | Funcional para Meta e Google |

---

## 3. Decisoes Estrategicas

### D-01: Opcao B — Implementacao com Camada de Abstracao (Adapter Pattern)

**Opcoes avaliadas:**

| Opcao | Descricao | Complexidade | Tempo | Risco |
|:------|:----------|:------------|:------|:------|
| A — Full SDK | Usar `facebook-nodejs-business-sdk` + `google-ads-api` npm packages | Alta | ~28h+ | Alto (deps pesadas, builds lentos, breaking changes frequentes) |
| **B — Adapter Layer (REST)** | **Manter adapter pattern existente, implementar via REST/fetch direto** | **Media** | **~20-26h** | **Medio (controle total, zero dep nova)** |
| C — Parcial | So metricas reais, acoes ficam para S31 | Baixa | ~12-14h | Baixo mas entrega incompleta |

**DECISAO: OPCAO B** — Adapter Layer com REST puro.

**Justificativas:**
1. **Zero dependencia npm nova** — O codebase tem zero dependencias novas desde S25. Manter essa disciplina reduz risco de build e tamanho do bundle.
2. **Controle total** — REST puro com `fetch()` permite controle granular de headers, timeouts, retries e error handling. SDKs oficiais frequentemente mudam APIs sem aviso.
3. **Pattern existente** — O codebase ja usa REST com `fetch()` para Meta CAPI (`capi-sync.ts` L68), Google Autocomplete, Jina Reader, Gemini API. O padrao esta estabelecido.
4. **Adapter isolation** — A `AdsPlatformAdapter` (base-adapter.ts) ja define a interface abstrata. Implementar REST dentro dela isola completamente a SDK.
5. **Swap facil** — Se no futuro SDKs se provarem mais estaveis, basta trocar o interior do adapter. A interface externa nao muda.

**Risco mitigado:** APIs REST do Meta e Google sao estáveis e bem documentadas. O Google Ads API tem endpoint REST (alem de gRPC), disponivel desde v14.

### D-02: REST Puro vs SDKs — Analise Tecnica

| Aspecto | SDK Oficial | REST Puro (fetch) |
|:--------|:-----------|:------------------|
| **Meta Graph API** | `facebook-nodejs-business-sdk` (~2MB, 400+ modules) | `fetch('https://graph.facebook.com/v21.0/...')` |
| **Google Ads API** | `google-ads-api` (~15MB, gRPC deps) | `fetch('https://googleads.googleapis.com/v18/...')` |
| **Bundle impact** | +17MB no node_modules | 0 |
| **Build time** | +30-60s (gRPC compile) | 0 |
| **Error handling** | SDK-specific exceptions | Standard HTTP errors |
| **Token refresh** | SDK auto-refresh (parcial) | Implementar manualmente (~50 linhas) |
| **Rate limiting** | SDK backoff (inconsistente) | Implementar retry com exponential backoff (~30 linhas) |
| **Breaking changes** | Frequentes (Meta SDK muda a cada trimestre) | Endpoint versionado (v21.0 estavel por 2+ anos) |

**Conclusao:** REST puro e a escolha correta para um projeto Next.js serverless. Os 80 linhas extras de token refresh + retry compensam amplamente a ausencia de 17MB de dependencias.

### D-03: Sandbox vs Production — Strategy

**DECISAO: Production-Ready com Feature Flags**

| Aspecto | Estrategia |
|:--------|:-----------|
| **Meta Graph API** | Implementar direto contra production API (v21.0). Nao existe "sandbox" separado — o Meta usa `access_token` de teste vs producao |
| **Google Ads API** | Implementar contra production API. Google oferece Test Account (customer ID de teste), mas a API e a mesma |
| **Feature Flag** | O parametro `mock=true` ja existe em ambas as rotas. Manter como fallback: se credenciais ausentes ou invalidas, retornar mock com warning |
| **Graceful Degradation** | Se a API falhar (rate limit, timeout, token expirado), retornar ultimo cache do Firestore + warning, nao 500 |

**Justificativa:** Nao faz sentido implementar sandbox separado e depois reimplementar para production. As APIs sao as mesmas. O parametro `mock=true` ja funciona como "sandbox local".

### D-04: OAuth2 Flow — Approach

**DECISAO: Manual Token Entry (S30) + OAuth2 UI (S31+)**

| Aspecto | S30 (Esta Sprint) | S31+ (Futuro) |
|:--------|:-------------------|:--------------|
| **Meta** | Usuario cola `access_token` + `ad_account_id` no form de integracao. MonaraTokenVault salva criptografado | OAuth2 redirect flow com `/api/auth/meta/callback` |
| **Google** | Usuario cola `refresh_token` + `developer_token` + `customer_id`. MonaraTokenVault salva criptografado | OAuth2 redirect flow com `/api/auth/google/callback` |
| **Token Refresh** | Implementar refresh automatico para Meta (Graph API long-lived) e Google (refresh_token → access_token) | Mesmo mecanismo, trigger automatico |

**Justificativa:** OAuth2 completo (redirect flow, consent screen, callback handling) e um feature de ~8h+ que nao agrega valor direto ao usuario que ja tem seus tokens. 85%+ dos usuarios de ferramentas de ads ja possuem tokens. A prioridade e fazer as integracoes funcionarem.

---

## 4. Escopo Detalhado

### Fase 1: Foundation — Token Management & Validation (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S30-FN-01 | **Token Refresh Engine** | Implementar refresh automatico de tokens para Meta (exchange long-lived) e Google (refresh_token → access_token via OAuth2 token endpoint). Guard `ensureFreshToken()` que verifica `expiresAt` antes de cada chamada API | M (~2h) | Novo |
| S30-FN-02 | **Integration Validation Real** | Substituir mock em `/api/performance/integrations/validate`. Meta: `GET /me?access_token=...` retorna user info se valido. Google: `GET /customers/{id}` retorna account info se valido. Persistir resultado em `PerformanceConfig.integrations[platform].status` | S (~1.5h) | Stub #7 |
| S30-FN-03 | **MonaraTokenVault Enhancement** | Adicionar metodo `refreshAndSave()` que chama refresh endpoint e atualiza token + expiresAt no vault. Adicionar campo `adAccountId` no schema MonaraToken | XS (~30min) | Enhancement |

**Gate Check 1:** Token refresh funcional + validation real retornando status correto + tsc=0 + tests passing.

### Fase 2: Meta Ads Integration — Real API (~5-7h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S30-META-01 | **Meta fetchMetrics Real** | Substituir mock em `meta-adapter.ts`. Implementar `GET /act_{ad_account_id}/insights` com campos: `spend`, `clicks`, `impressions`, `conversions`, `cpc`, `ctr`, `actions`. Normalizar para `RawAdsData` via `normalize()` existente. Suportar date_range via `time_range` param | M (~2.5h) | Stub #1 |
| S30-META-02 | **Meta updateAdCreative Real** | Substituir console.log em `meta.ts`. Implementar `POST /{ad_id}` com creative fields. Usar Graph API v21.0 | S (~1.5h) | Stub #8 (parcial) |
| S30-META-03 | **Meta syncCustomAudience Real** | Implementar `POST /{audience_id}/users` com `schema: ['EMAIL']` e dados SHA256-hashed. Incluir `uploadCustomAudience()` no MetaAdsAdapter | M (~2h) | Stub #4 + Stub #8 (parcial) |
| S30-META-04 | **AdsLookalikeSync Real** | Substituir simulacao em `ads-sync.ts`. Chamar `MetaAdsAdapter.syncCustomAudience()` com leads hot do PropensityEngine (segment='hot'). Corrigir query para usar `brands/{brandId}/leads` (nao collection raiz) | S (~1h) | Stub #4 |

**Gate Check 2:** Meta fetchMetrics retornando dados reais (ou graceful fallback) + updateAdCreative funcional + syncCustomAudience enviando para Graph API + tsc=0 + tests passing.

### Fase 3: Google Ads Integration — Real API (~5-7h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S30-GOOG-01 | **Google fetchMetrics Real** | Substituir mock em `google-adapter.ts`. Implementar `POST /customers/{id}/googleAds:searchStream` com GAQL query: `SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date BETWEEN '{start}' AND '{end}'`. Converter `cost_micros` (microunits) para valor real. Normalizar para `RawAdsData` | M (~3h) | Stub #2 |
| S30-GOOG-02 | **Google pauseAdEntity Real** | Substituir mock em `google.ts`. Implementar `POST /customers/{id}/campaigns:mutate` com `operation.update.status = PAUSED`. Suportar tambem adGroup pause | M (~2h) | Stub #3 (1/3) |
| S30-GOOG-03 | **Google adjustBudget Real** | Substituir mock em `google.ts`. Implementar `POST /customers/{id}/campaignBudgets:mutate` com `operation.update.amount_micros`. Converter de reais para micros (*1000000) | S (~1.5h) | Stub #3 (2/3) |
| S30-GOOG-04 | **Google getEntityStatus Real** | Substituir mock em `google.ts`. Implementar `POST /customers/{id}/googleAds:search` com GAQL: `SELECT campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.id = {id}` | S (~1h) | Stub #3 (3/3) |

**Gate Check 3:** Google fetchMetrics retornando dados reais + pause/budget/status funcionais + tsc=0 + tests passing.

### Fase 4: Performance Routes & Offline Conversions (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S30-PERF-01 | **Performance Metrics Real** | Substituir 501 em `/api/performance/metrics`. Quando `mock=false`: instanciar MetaAdsAdapter + GoogleAdsAdapter, chamar `fetchMetrics()` com credenciais do MonaraTokenVault, normalizar, persistir no Firestore `brands/{brandId}/performance_metrics`, retornar dados reais. Manter fallback `mock=true` | M (~2h) | Stub #6 |
| S30-PERF-02 | **Google Offline Conversions** | Implementar dispatch para Google Ads Offline Conversions em `capi-sync.ts`. Endpoint: `POST /customers/{id}/offlineUserDataJobs` com `operations.create.user_data`. Usar mesmo pattern de retry existente (`executeWithRetry`) | M (~2h) | Stub #5 |

**Gate Check 4:** `/api/performance/metrics?mock=false` retornando dados reais + Google Offline Conversions funcional + tsc=0 + tests passing.

### Fase 5: Rate Limiting (STRETCH herdado S29) (~3-4h)

| ID | Item | Descricao | Esforco | Stubs Resolvidos |
|:---|:-----|:----------|:--------|:----------------|
| S30-RL-01 | **Rate Limiting por brandId** | Implementar guard `checkRateLimit()` com Firestore counters atomicos. Schema: `brands/{brandId}/quotas/{period}`. Limites default: 500 API calls/dia, 100 scans/dia, 1000 AI credits/dia. Integrar em rotas de alto consumo. HTTP 429 quando excedido | M (~3-4h) | STRETCH S29 |

---

## 5. Fora de Escopo (Nao-Sprint-30)

| Item | Sprint Planejada | Justificativa |
|:-----|:----------------|:-------------|
| OAuth2 Redirect Flow (consent screen + callback) | S31 | Token manual e suficiente para S30 |
| Social Integration (Instagram Graph API, LinkedIn) | S32 | Sprint dedicada |
| Content Autopilot (scheduling, calendario editorial) | S33 | Sprint dedicada |
| A/B Testing Engine | S34 | Depende de metricas reais (S30) |
| TikTok Ads Adapter | S32 | Novo adapter, nao prioridade S30 |
| Automation Rules Runtime (Dynamic Content Rules) | S31 | Depende de ads real (S30) |
| Kill-Switch Persistence (Firestore + notificacao) | S31 | Sprint dedicada |
| UI de configuracao de integracao (wizard) | S31 | S30 foca em backend/adapters |

---

## 6. Arquitetura Tecnica

### 6.1 Flow de Fetch de Metricas (S30-PERF-01)

```
[GET /api/performance/metrics?brandId=X&mock=false]
  │
  ├── requireBrandAccess(req, brandId)
  │
  ├── MonaraTokenVault.getToken(brandId, 'meta')
  │   └── ensureFreshToken() → refresh se expiresAt < now + 24h
  │
  ├── MonaraTokenVault.getToken(brandId, 'google')
  │   └── ensureFreshToken() → refresh se expiresAt < now + 1h
  │
  ├── Promise.all([
  │     metaAdapter.fetchMetrics(metaToken, period),
  │     googleAdapter.fetchMetrics(googleToken, period)
  │   ])
  │
  ├── normalize() → UnifiedAdsMetrics para cada platform
  │
  ├── aggregate() → somar Meta + Google para 'aggregated'
  │
  ├── persistToFirestore() → brands/{brandId}/performance_metrics (fire-and-forget)
  │
  └── createApiSuccess({ metrics: [...meta, ...google, ...aggregated] })
```

### 6.2 Flow de Meta Graph API

```
Meta Graph API v21.0 (REST)

Endpoints utilizados:
1. GET /me?access_token={token}
   → Validacao de token
   → Response: { id, name, email }

2. GET /act_{ad_account_id}/insights?fields=spend,impressions,clicks,actions,cpc,ctr&time_range={"since":"YYYY-MM-DD","until":"YYYY-MM-DD"}&level=campaign
   → Fetch de metricas
   → Response: { data: [{ campaign_id, campaign_name, spend, impressions, ... }] }

3. POST /{ad_id}
   → Update de criativo
   → Body: { name, creative: { title, body, image_url } }

4. POST /{audience_id}/users
   → Sync de Custom Audience
   → Body: { schema: ['EMAIL'], data: [['sha256hash1'], ['sha256hash2']] }

5. POST /{pixel_id}/events?access_token={token}
   → CAPI (ja implementado em capi-sync.ts)
   → Body: { data: [{ event_name, event_time, user_data, custom_data }] }

Auth: Bearer token (access_token) em query param ou header
Rate Limit: 200 calls/hora por ad account (Graph API)
```

### 6.3 Flow de Google Ads API

```
Google Ads API v18 (REST)

Base URL: https://googleads.googleapis.com/v18

Headers obrigatorios:
  Authorization: Bearer {access_token}
  developer-token: {developer_token}
  login-customer-id: {manager_account_id} (opcional, se MCC)

Endpoints utilizados:
1. GET /customers/{customer_id}
   → Validacao de acesso
   → Response: { resourceName, id, descriptiveName }

2. POST /customers/{customer_id}/googleAds:searchStream
   → Fetch de metricas (GAQL)
   → Body: { query: "SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date BETWEEN 'YYYY-MM-DD' AND 'YYYY-MM-DD'" }
   → Response: [{ results: [{ campaign, metrics }] }]

3. POST /customers/{customer_id}/campaigns:mutate
   → Pause/Resume campaign
   → Body: { operations: [{ update: { resourceName, status: "PAUSED" }, updateMask: "status" }] }

4. POST /customers/{customer_id}/campaignBudgets:mutate
   → Adjust budget
   → Body: { operations: [{ update: { resourceName, amountMicros: "50000000" }, updateMask: "amountMicros" }] }

5. POST /customers/{customer_id}/offlineUserDataJobs
   → Offline Conversions
   → Body: { job: { type: "STORE_SALES_UPLOAD_FIRST_PARTY" }, operations: [{ create: { userIdentifiers, transactionAttribute } }] }

Auth: OAuth2 access_token (refresh via https://oauth2.googleapis.com/token)
Rate Limit: 15,000 operations/dia por developer token
Nota: cost_micros = valor em microunits (1 real = 1,000,000 micros)
```

### 6.4 Token Refresh Flow

```
[ensureFreshToken(brandId, provider)]
  │
  ├── MonaraTokenVault.getToken(brandId, provider)
  │
  ├── if token == null → throw Error("Token nao configurado")
  │
  ├── if !MonaraTokenVault.isTokenExpiring(token) → return token (valido)
  │
  ├── if provider == 'meta':
  │   └── GET /oauth/access_token?grant_type=fb_exchange_token&client_id={app_id}&client_secret={app_secret}&fb_exchange_token={current_token}
  │       → Response: { access_token, expires_in }
  │       → MonaraTokenVault.saveToken(brandId, { ...token, accessToken: new, expiresAt: now + expires_in })
  │
  ├── if provider == 'google':
  │   └── POST https://oauth2.googleapis.com/token
  │       → Body: { client_id, client_secret, refresh_token, grant_type: 'refresh_token' }
  │       → Response: { access_token, expires_in }
  │       → MonaraTokenVault.saveToken(brandId, { ...token, accessToken: new, expiresAt: now + expires_in })
  │
  └── return refreshedToken
```

### 6.5 Graceful Degradation Strategy

```
[Qualquer chamada a API externa]
  │
  ├── try:
  │   ├── ensureFreshToken()
  │   ├── fetch(endpoint, { signal: AbortSignal.timeout(10000) })
  │   ├── if response.ok → return data
  │   └── if response.status == 429 → retry com backoff
  │
  ├── catch (TokenExpiredError):
  │   ├── Tentar refresh
  │   └── Se falhar: return cached + warning "Token expirado, reconecte"
  │
  ├── catch (NetworkError):
  │   ├── return cachedMetrics (ultimo Firestore) + warning
  │   └── Log para Sentry
  │
  └── catch (UnknownError):
      ├── return createApiError(502, "Erro ao comunicar com {platform}")
      └── Log com stack trace
```

---

## 7. Requisitos Funcionais Detalhados

### RF-30.01: Meta fetchMetrics Real

**Arquivo:** `app/src/lib/performance/adapters/meta-adapter.ts`

**Substituir:** Mock hardcoded (L7-23)

**Implementar:**
```typescript
async fetchMetrics(credentials: { accessToken: string; adAccountId: string }, period: { start: Date; end: Date }): Promise<RawAdsData[]> {
  const timeRange = JSON.stringify({
    since: period.start.toISOString().split('T')[0],
    until: period.end.toISOString().split('T')[0]
  });

  const fields = 'campaign_id,campaign_name,spend,impressions,clicks,actions,cpc,ctr';
  const url = `https://graph.facebook.com/v21.0/act_${credentials.adAccountId}/insights?fields=${fields}&time_range=${timeRange}&level=campaign&limit=100`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${credentials.accessToken}` },
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Meta API Error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return (data.data || []).map(mapMetaInsightToRawAds);
}
```

**Mapper:**
```typescript
function mapMetaInsightToRawAds(insight: any): RawAdsData {
  const conversions = (insight.actions || [])
    .filter((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase')
    .reduce((sum: number, a: any) => sum + parseInt(a.value || '0'), 0);

  return {
    platform: 'meta',
    externalId: insight.campaign_id,
    name: insight.campaign_name,
    spend: parseFloat(insight.spend || '0'),
    clicks: parseInt(insight.clicks || '0'),
    impressions: parseInt(insight.impressions || '0'),
    conversions
  };
}
```

### RF-30.02: Google fetchMetrics Real

**Arquivo:** `app/src/lib/performance/adapters/google-adapter.ts`

**Substituir:** Mock hardcoded (L7-23)

**Implementar:**
```typescript
async fetchMetrics(credentials: { accessToken: string; developerToken: string; customerId: string }, period: { start: Date; end: Date }): Promise<RawAdsData[]> {
  const startDate = period.start.toISOString().split('T')[0];
  const endDate = period.end.toISOString().split('T')[0];

  const gaql = `SELECT campaign.id, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM campaign WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`;

  const url = `https://googleads.googleapis.com/v18/customers/${credentials.customerId}/googleAds:searchStream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.accessToken}`,
      'developer-token': credentials.developerToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: gaql }),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Google Ads API Error: ${JSON.stringify(error.error || error)}`);
  }

  const data = await response.json();
  return flatMapGoogleResults(data);
}
```

**Mapper:**
```typescript
function flatMapGoogleResults(responseArray: any[]): RawAdsData[] {
  const results: RawAdsData[] = [];
  for (const batch of responseArray) {
    for (const row of (batch.results || [])) {
      results.push({
        platform: 'google',
        externalId: row.campaign?.id || '',
        name: row.campaign?.name || '',
        spend: parseInt(row.metrics?.costMicros || '0') / 1_000_000,
        clicks: parseInt(row.metrics?.clicks || '0'),
        impressions: parseInt(row.metrics?.impressions || '0'),
        conversions: parseFloat(row.metrics?.conversions || '0')
      });
    }
  }
  return results;
}
```

### RF-30.03: Google pauseAdEntity Real

**Arquivo:** `app/src/lib/automation/adapters/google.ts`

**Substituir:** Mock em pauseAdEntity (L12-37)

**Implementar:**
```typescript
async pauseAdEntity(entityId: string, type: 'campaign' | 'adset'): Promise<AdsActionResponse> {
  try {
    const resourceName = `customers/${this.customerId}/campaigns/${entityId}`;
    const url = `https://googleads.googleapis.com/v18/customers/${this.customerId}/campaigns:mutate`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        operations: [{
          update: { resourceName, status: 'PAUSED' },
          updateMask: 'status'
        }]
      }),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) throw new Error(await response.text());

    return { success: true, externalId: entityId, platform: 'google', actionTaken: 'pause' };
  } catch (error: any) {
    return { success: false, externalId: entityId, platform: 'google', actionTaken: 'pause',
      error: { code: error.code || 'GOOGLE_ADS_API_ERROR', message: error.message, retryable: true }
    };
  }
}
```

### RF-30.04: Google adjustBudget Real

**Arquivo:** `app/src/lib/automation/adapters/google.ts`

**Substituir:** Mock em adjustBudget (L40-66)

**Nota:** Google Ads budgets sao em `amount_micros`. R$ 50,00 = 50000000 micros.

### RF-30.05: Google getEntityStatus Real

**Arquivo:** `app/src/lib/automation/adapters/google.ts`

**Substituir:** Mock em getEntityStatus (L69-75)

**GAQL:** `SELECT campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.id = {entityId}`

### RF-30.06: Meta updateAdCreative Real

**Arquivo:** `app/src/lib/automation/adapters/meta.ts`

**Substituir:** Console.log em updateAdCreative (L33-61)

**Implementar:** `POST https://graph.facebook.com/v21.0/{adId}` com body contendo creative fields.

### RF-30.07: Meta syncCustomAudience Real

**Arquivo:** `app/src/lib/automation/adapters/meta.ts`

**Substituir:** Console.log em syncCustomAudience (L67-72)

**Implementar:** `POST https://graph.facebook.com/v21.0/{audienceId}/users` com schema EMAIL + dados SHA256.

### RF-30.08: AdsLookalikeSync Real

**Arquivo:** `app/src/lib/automation/adapters/ads-sync.ts`

**Substituir:** Simulacao (L40-51)

**Correcao critica:** A query atual busca de `leads` (collection raiz). DEVE buscar de `brands/{brandId}/leads` (isolamento multi-tenant). Tambem filtrar por `segment == 'hot'` (campo PropensityEngine S28).

### RF-30.09: Performance Metrics Real

**Arquivo:** `app/src/app/api/performance/metrics/route.ts`

**Substituir:** 501 (L36-37)

**Implementar:** Instanciar adapters → fetch → normalize → aggregate → persist → return.

### RF-30.10: Integration Validation Real

**Arquivo:** `app/src/app/api/performance/integrations/validate/route.ts`

**Substituir:** 501 (L42-43)

**Implementar:**
- Meta: `GET /me?access_token={key}` — sucesso = valido
- Google: `GET /customers/{accountId}` com headers de auth — sucesso = valido
- Persistir status em `brands/{brandId}/performance_configs`

### RF-30.11: Google Offline Conversions

**Arquivo:** `app/src/lib/integrations/ads/capi-sync.ts`

**Substituir:** TODO na L34

**Implementar:** Apos Meta CAPI (ja funcional), adicionar dispatch para Google:
```typescript
// 3. Disparar para Google Ads Offline Conversions
const googleResult = await this.sendToGoogleOfflineConversions(payload, userData);
results.push({ platform: 'Google', ...googleResult });
```

Endpoint: `POST /customers/{id}/offlineUserDataJobs`

### RF-30.12: Token Refresh Engine

**Arquivo novo:** `app/src/lib/integrations/ads/token-refresh.ts`

**Funcao principal:**
```typescript
export async function ensureFreshToken(
  brandId: string,
  provider: 'meta' | 'google'
): Promise<MonaraToken>
```

**Comportamento:**
1. Busca token do vault
2. Se nao expirado → retorna
3. Se expirando → chama endpoint de refresh (Meta: fb_exchange_token, Google: refresh_token)
4. Salva novo token no vault
5. Retorna token atualizado

---

## 8. Mudancas no Schema MonaraToken

**Arquivo:** `app/src/lib/firebase/vault.ts`

**Adicionar ao MonaraToken:**

```typescript
export interface MonaraToken {
  brandId: string;
  provider: 'meta' | 'google' | 'instagram' | 'stripe';
  accessToken: string;          // AES-256 encrypted
  refreshToken?: string;        // AES-256 encrypted
  expiresAt: Timestamp;
  scopes: string[];
  metadata: Record<string, any>;
  updatedAt: Timestamp;
  // === Novos campos S30 ===
  adAccountId?: string;         // Meta: act_XXXX / Google: customer_id
  developerToken?: string;      // Google Ads only (AES-256 encrypted)
  pixelId?: string;             // Meta Pixel ID (para CAPI)
  appId?: string;               // Meta App ID (para refresh)
  appSecret?: string;           // Meta App Secret (AES-256 encrypted, para refresh)
  clientId?: string;            // Google OAuth Client ID (para refresh)
  clientSecret?: string;        // Google OAuth Client Secret (AES-256 encrypted, para refresh)
}
```

**Novos metodos no MonaraTokenVault:**

```typescript
static async refreshAndSave(brandId: string, provider: 'meta' | 'google'): Promise<MonaraToken>
static async getValidToken(brandId: string, provider: 'meta' | 'google'): Promise<MonaraToken>
```

---

## 9. Mudancas na Interface dos Adapters

### 9.1 base-adapter.ts — Tipar credentials

**Antes:**
```typescript
abstract fetchMetrics(credentials: any, period: { start: Date; end: Date }): Promise<RawAdsData[]>;
```

**Depois:**
```typescript
export interface AdCredentials {
  accessToken: string;
  adAccountId: string;
  developerToken?: string;   // Google only
  customerId?: string;       // Google only
  pixelId?: string;          // Meta only (CAPI)
}

abstract fetchMetrics(credentials: AdCredentials, period: { start: Date; end: Date }): Promise<RawAdsData[]>;
```

### 9.2 google.ts — Adicionar headers helper

**Adicionar metodo privado:**
```typescript
private getHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${this.accessToken}`,
    'developer-token': this.developerToken,
    'Content-Type': 'application/json'
  };
}
```

**Nota:** O constructor de `GoogleAdsAdapter` precisa receber `accessToken` alem de `developerToken` e `customerId`. Refatorar:
```typescript
constructor(accessToken: string, developerToken: string, customerId: string)
```

### 9.3 meta.ts — Descomentar chamadas reais

As chamadas ao Graph API estao **comentadas** no codigo atual (L38-39). Descomentar e implementar error handling.

### 9.4 ads-sync.ts — Corrigir query multi-tenant

**Antes (ERRADO):**
```typescript
const leadsRef = collection(db, 'leads');  // Collection RAIZ — violacao multi-tenant!
```

**Depois (CORRETO):**
```typescript
const leadsRef = collection(db, 'brands', brandId, 'leads');
const q = query(
  leadsRef,
  where('segment', '==', 'hot'),  // Campo do PropensityEngine (S28)
  limit(100)
);
```

---

## 10. Success Criteria

| # | Criterio | Verificacao | Responsavel |
|:--|:---------|:-----------|:-----------|
| SC-01 | `GET /api/performance/metrics?brandId=X&mock=false` retorna dados reais de Meta + Google | Chamada com token valido retorna array de PerformanceMetric com dados reais | Dandara |
| SC-02 | `MetaAdsAdapter.fetchMetrics()` chama Graph API v21.0 | Network log mostra request para `graph.facebook.com` | Dandara |
| SC-03 | `GoogleAdsAdapter.fetchMetrics()` chama Google Ads API v18 | Network log mostra request para `googleads.googleapis.com` | Dandara |
| SC-04 | `GoogleAdsAdapter.pauseAdEntity()` envia mutate real | Campaign status muda no Google Ads dashboard | Dandara |
| SC-05 | `GoogleAdsAdapter.adjustBudget()` ajusta budget real | Budget muda no Google Ads dashboard | Dandara |
| SC-06 | `GoogleAdsAdapter.getEntityStatus()` retorna status real | Status e budget corretos vs dashboard | Dandara |
| SC-07 | `MetaAdsAdapter.updateAdCreative()` atualiza criativo real | Ad creative muda no Meta Ads Manager | Dandara |
| SC-08 | `MetaAdsAdapter.syncCustomAudience()` envia dados SHA256 | Custom Audience no Meta mostra novos usuarios | Dandara |
| SC-09 | `AdsLookalikeSync` exporta leads hot (segment='hot') para Meta | Query usa `brands/{brandId}/leads` com filtro `segment` | Dandara |
| SC-10 | `CAPISyncEngine` dispara para Google Offline Conversions | Conversao aparece no Google Ads attribution | Dandara |
| SC-11 | `POST /api/performance/integrations/validate` valida tokens reais | Meta: GET /me retorna user. Google: GET /customers retorna account | Dandara |
| SC-12 | Token refresh automatico funcional para Meta e Google | Token expirado e renovado antes da chamada API | Dandara |
| SC-13 | Graceful degradation quando API indisponivel | Retorna cached + warning, nao 500 | Dandara |
| SC-14 | 224+ testes passando (zero regressao) | `npm test` em cada Gate | Dandara |
| SC-15 | tsc=0, build=103+ rotas | `npx tsc --noEmit && npm run build` | Dandara |
| SC-16 | `credentials: any` substituido por `AdCredentials` tipado | Zero `any` em signatures de fetchMetrics | Dandara |

---

## 11. Proibicoes (The Council's Laws)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| P-01 | **NUNCA adicionar SDK npm (facebook-nodejs-business-sdk, google-ads-api)** | REST puro via fetch(). Zero dependencia nova (D-02) |
| P-02 | **NUNCA colocar access_token em query params em LOGS** | Tokens sao PII. Logs devem mascarar: `token=***${last4}` |
| P-03 | **NUNCA buscar leads de collection raiz `/leads`** | SEMPRE usar `brands/{brandId}/leads` — isolamento multi-tenant |
| P-04 | **NUNCA armazenar tokens em plain text** | TUDO passa por `encrypt()` antes de `setDoc()`. MonaraTokenVault ja faz isso |
| P-05 | **NUNCA retornar 500 para falha de API externa** | Usar 502 (Bad Gateway) para erros de Meta/Google. 500 e reservado para erros internos |
| P-06 | **NUNCA bloquear response esperando persist de metricas** | Persistir no Firestore e fire-and-forget. Retornar dados ao usuario imediatamente |
| P-07 | **NUNCA mudar URL de API existente** | Todas as rotas mantem exatamente o mesmo path |
| P-08 | **NUNCA remover parametro `mock=true`** | Mock deve continuar funcionando como fallback para desenvolvimento e testes |
| P-09 | **NUNCA hardcodar IDs de teste (ad_account, customer_id)** | Tudo vem do MonaraTokenVault, isolado por brandId |
| P-10 | **NUNCA ignorar rate limits da plataforma** | Meta: 200/h por ad account. Google: 15000/dia por dev token. Implementar backoff |
| P-11 | **NUNCA quebrar os 224 testes existentes** | Zero regressao — novos testes ADICIONAM, nao substituem |
| P-12 | **NUNCA usar `firebase-admin` ou `google-cloud/*`** | Restricao de ambiente Windows 11 24H2 (project-context.md L319) |
| P-13 | **NUNCA rate-limitar rotas `/api/admin/*`** | Admin isento — previne self-lockout |

---

## 12. Riscos e Mitigacoes

| # | Risco | Probabilidade | Impacto | Mitigacao |
|:--|:------|:-------------|:--------|:----------|
| R-01 | **Token expirado durante fetch** | Alta (Meta tokens expiram em 60d, Google em 1h) | Media — fetch falha | Token refresh automatico (S30-FN-01). Buffer de 24h para Meta, 15min para Google |
| R-02 | **Rate limit da API atingido** | Media (200/h Meta, 15000/dia Google) | Media — requests bloqueados | Exponential backoff com jitter. Cache de metricas no Firestore (reusar se < 15min old) |
| R-03 | **Google Ads API requer developer token aprovado** | Alta — developer tokens novos sao "test" (limitados) | Alta — pode bloquear fetchMetrics em production | Documentar que usuario precisa de developer token aprovado. Fallback para mock com warning claro |
| R-04 | **Meta Graph API depreca versao** | Baixa (v21.0 estavel ate Q3 2027) | Media — endpoint para de funcionar | Versao configuravel via constante. Facil bump |
| R-05 | **cost_micros overflow em conversao** | Baixa | Baixa — valores incorretos | Usar BigInt ou dividir antes de operar. Testar com valores altos |
| R-06 | **Dados PII em logs** | Media (developer pode console.log payload) | Alta — violacao LGPD | P-02 enforce. Review de code antes de merge. Sanitize em logs |
| R-07 | **Firestore quota atingida com metricas frequentes** | Baixa (Free tier: 50k reads/dia) | Media — persists falham | Fire-and-forget + .catch(). Rate de persist: max 1x por brandId por 15min |
| R-08 | **ads-sync.ts query na collection raiz viola multi-tenant** | CERTA (bug existente) | Alta — vazamento de dados cross-tenant | S30-META-04 corrige: query em `brands/{brandId}/leads` |
| R-09 | **Sprint excede 26h** | Media (APIs externas sao imprevisiveis) | Media — feature incompleta | Rate Limiting (S30-RL-01) e STRETCH. Se estouro, mover para S31 |

---

## 13. Estimativas por Fase

| Fase | Items | Esforco | Acumulado |
|:-----|:------|:--------|:----------|
| **Fase 1: Foundation** | S30-FN-01, FN-02, FN-03 | ~3-4h | ~3-4h |
| **Fase 2: Meta Ads** | S30-META-01 a META-04 | ~5-7h | ~8-11h |
| **Fase 3: Google Ads** | S30-GOOG-01 a GOOG-04 | ~5-7h | ~13-18h |
| **Fase 4: Performance** | S30-PERF-01, PERF-02 | ~3-4h | ~16-22h |
| **QA Final** | Gate checks + regression | ~2h | ~18-24h |
| **STRETCH: Rate Limiting** | S30-RL-01 | ~3-4h | ~21-28h |

**Total sem STRETCH:** ~18-24h  
**Total com STRETCH:** ~21-28h

**Nota:** Estimativa inclui buffer de ~2h para debugging de APIs externas (token issues, response format surprises, rate limits inesperados).

---

## 14. Gate Checks

| Gate | Quando | Criterios | Acao se Falhar |
|:-----|:-------|:----------|:-------------|
| **Gate 1** | Apos Fase 1 (Foundation) | tsc=0, build OK, tests passing, validation real retornando status correto, token refresh funcional | NAO prosseguir para Fase 2 |
| **Gate 2** | Apos Fase 2 (Meta) | Meta fetchMetrics retorna dados reais, updateAdCreative + syncCustomAudience funcionais, tsc=0, tests passing | NAO prosseguir para Fase 3 |
| **Gate 3** | Apos Fase 3 (Google) | Google fetchMetrics + pause + budget + status funcionais, tsc=0, tests passing | NAO prosseguir para Fase 4 |
| **Gate 4** | Apos Fase 4 (Performance) | `/api/performance/metrics?mock=false` retorna dados reais, Google Offline Conversions funcional, tsc=0, tests passing | Finalizar sprint sem STRETCH |
| **Gate QA** | Apos todas as fases | SC-01 a SC-16 verificados, 224+ tests, tsc=0, build OK, zero regressao | Corrigir antes de fechar sprint |

---

## 15. Padroes Sigma Obrigatorios (Heranca)

Todos os padroes estabelecidos nas sprints anteriores DEVEM ser mantidos:

| Padrao | Descricao | Referencia |
|:-------|:----------|:-----------|
| `createApiError(status, message)` | Formato unico de resposta de erro API | Sigma PA-04 |
| `createApiSuccess(data)` | Formato unico de resposta de sucesso API | Sigma PA-04 |
| `requireBrandAccess(req, brandId)` | Auth em rotas brand-scoped | Sigma |
| `Timestamp` (nao `Date`) | Campos de data no Firestore | Sigma |
| `export const dynamic = 'force-dynamic'` | Rotas dinamicas no Vercel | Sigma |
| Isolamento multi-tenant por `brandId` | Zero acesso cross-tenant | Sigma |
| Fire-and-forget para persist nao-critica | `.catch()` para logging de persist | S29 PA-03 |
| Zero `[key: string]: unknown` | Interfaces tipadas | Sigma |
| Zero `firebase-admin` / `google-cloud/*` | Restricao de ambiente | project-context.md |

---

## 16. Arquivos Impactados (Mapa de Impacto)

### Arquivos Modificados

| Arquivo | Item(s) | Tipo de Mudanca |
|:--------|:--------|:---------------|
| `lib/performance/adapters/meta-adapter.ts` | S30-META-01 | Substituir mock por Graph API real |
| `lib/performance/adapters/google-adapter.ts` | S30-GOOG-01 | Substituir mock por Google Ads API real |
| `lib/performance/adapters/base-adapter.ts` | S30-FN-01 | Tipar `credentials: any` → `AdCredentials` |
| `lib/automation/adapters/google.ts` | S30-GOOG-02/03/04 | Substituir 3 mocks por chamadas API reais |
| `lib/automation/adapters/meta.ts` | S30-META-02/03 | Descomentar e implementar chamadas Graph API reais |
| `lib/automation/adapters/ads-sync.ts` | S30-META-04 | Corrigir query multi-tenant + chamar syncCustomAudience real |
| `lib/integrations/ads/capi-sync.ts` | S30-PERF-02 | Adicionar Google Offline Conversions dispatch |
| `app/api/performance/metrics/route.ts` | S30-PERF-01 | Substituir 501 por fetch real de metricas |
| `app/api/performance/integrations/validate/route.ts` | S30-FN-02 | Substituir mock por validacao real |
| `lib/firebase/vault.ts` | S30-FN-03 | Expandir MonaraToken + novos metodos |

### Arquivos Criados (Novos)

| Arquivo | Item | Descricao |
|:--------|:-----|:----------|
| `lib/integrations/ads/token-refresh.ts` | S30-FN-01 | Engine de refresh automatico de tokens |
| `lib/integrations/ads/api-helpers.ts` | S30-META/GOOG | Helpers compartilhados: retry, backoff, timeout, log sanitizer |
| `lib/guards/rate-limiter.ts` | S30-RL-01 (STRETCH) | Guard function de rate limiting por brandId |

### Arquivos NAO Tocados (Preservados)

| Arquivo | Justificativa |
|:--------|:-------------|
| `lib/automation/adapters/types.ts` | Interface `IAdsAdapter` e `AdsActionResponse` permanecem (ja adequadas) |
| `lib/automation/adapters/instagram.ts` | S32 — fora de escopo |
| `lib/utils/encryption.ts` | Funcional — zero alteracao |
| `lib/ai/*` | Pipeline de IA intocado |
| `lib/firebase/config.ts` | Configuracao intocada |
| Todos os 224 testes existentes | P-11 — zero regressao |
| `types/performance.ts` | Types ja adequados (UnifiedAdsMetrics, PerformanceMetric, PerformanceConfig) |

---

## 17. Testes Recomendados (Novos)

| # | Teste | Tipo | Arquivo Sugerido |
|:--|:------|:-----|:----------------|
| T-01 | Meta fetchMetrics com token invalido retorna erro descritivo | Unit | `__tests__/lib/performance/meta-adapter.test.ts` |
| T-02 | Google fetchMetrics com token invalido retorna erro descritivo | Unit | `__tests__/lib/performance/google-adapter.test.ts` |
| T-03 | Token refresh flow para Meta (mock fetch) | Unit | `__tests__/lib/integrations/token-refresh.test.ts` |
| T-04 | Token refresh flow para Google (mock fetch) | Unit | `__tests__/lib/integrations/token-refresh.test.ts` |
| T-05 | Performance metrics route com mock=false e token valido | Integration | `__tests__/api/performance-metrics.test.ts` |
| T-06 | Performance metrics route graceful degradation | Integration | `__tests__/api/performance-metrics.test.ts` |
| T-07 | Integration validate com Meta token real (mock fetch) | Unit | `__tests__/api/integrations-validate.test.ts` |
| T-08 | Google pauseAdEntity envia mutation correta | Unit | `__tests__/lib/automation/google-adapter.test.ts` |
| T-09 | AdsLookalikeSync query usa brandId scoped collection | Unit | `__tests__/lib/automation/ads-sync.test.ts` |
| T-10 | CAPISyncEngine dispara para Meta E Google | Unit | `__tests__/lib/integrations/capi-sync.test.ts` |
| T-11 | Rate limiter permite e bloqueia corretamente (STRETCH) | Unit | `__tests__/lib/guards/rate-limiter.test.ts` |
| T-12 | AdCredentials interface impede `any` em fetchMetrics | Type | Verificacao via tsc |

**Nota:** Todos os testes de API externa devem usar mocks de `fetch()` (via `jest.fn()`). NUNCA chamar APIs externas reais em testes automatizados.

---

## 18. Sequencia de Execucao Recomendada

```
[FASE 1 — Foundation (GATE)]
  S30-FN-03 (MonaraToken enhancement, XS) — primeiro, pois Meta/Google dependem
  S30-FN-01 (Token Refresh Engine, M) — depende de FN-03
  S30-FN-02 (Integration Validation Real, S) — depende de FN-01

  ── GATE CHECK 1 ── (tsc + build + tests + validation real) ──

[FASE 2 — Meta Ads (GATE)]
  S30-META-01 (Meta fetchMetrics, M) — core
  S30-META-02 (Meta updateAdCreative, S) — paralelo com META-03
  S30-META-03 (Meta syncCustomAudience, M) — paralelo com META-02
  S30-META-04 (AdsLookalikeSync real, S) — depende de META-03

  ── GATE CHECK 2 ── (tsc + build + tests + Meta funcional) ──

[FASE 3 — Google Ads (GATE)]
  S30-GOOG-01 (Google fetchMetrics, M) — core
  S30-GOOG-02 (Google pauseAdEntity, M) — paralelo com GOOG-03
  S30-GOOG-03 (Google adjustBudget, S) — paralelo com GOOG-02
  S30-GOOG-04 (Google getEntityStatus, S) — depende de GOOG-02/03

  ── GATE CHECK 3 ── (tsc + build + tests + Google funcional) ──

[FASE 4 — Performance & Offline Conversions (GATE)]
  S30-PERF-01 (Performance Metrics Real, M) — depende de META-01 + GOOG-01
  S30-PERF-02 (Google Offline Conversions, M) — independente

  ── GATE CHECK 4 ── (tsc + build + tests + metricas reais) ──

[FASE 5 — STRETCH]
  S30-RL-01 (Rate Limiting, M) — somente apos Gate 4 aprovado

[QA FINAL]
  Dandara valida SC-01 a SC-16 + regressao completa
```

---

## 19. Dependencias Externas

| Dependencia | Status | Acao |
|:-----------|:-------|:-----|
| Sprint 29 concluida (QA 100/100) | CONFIRMADA | Baseline seguro |
| MonaraTokenVault funcional (S18) | CONFIRMADA | Vault com encrypt/decrypt |
| PropensityEngine com campo `segment` (S28) | CONFIRMADA | Leads classificados como hot/warm/cold |
| `createApiError`/`createApiSuccess` (Sigma) | CONFIRMADA | 54+ rotas |
| `requireBrandAccess` (Sigma) | CONFIRMADA | Auth em todas as rotas |
| Meta Graph API v21.0 | EXTERNA | Disponivel publicamente |
| Google Ads API v18 (REST) | EXTERNA | Requer developer token |
| Google OAuth2 Token Endpoint | EXTERNA | `https://oauth2.googleapis.com/token` |
| Firebase Firestore (Client SDK) | CONFIRMADA | Configurado |
| Nenhum MCP/CLI novo | CONFIRMADA | N/A |
| Nenhuma dependencia npm nova | CONFIRMADA | REST puro via fetch() |

---

## 20. Glossario de Termos

| Termo | Definicao |
|:------|:----------|
| **Graph API** | REST API da Meta para acessar dados de Facebook/Instagram/Ads |
| **GAQL** | Google Ads Query Language — SQL-like para consultar dados no Google Ads |
| **cost_micros** | Formato de valores monetarios no Google Ads (1 real = 1,000,000 micros) |
| **CAPI** | Conversions API — API server-to-server da Meta para envio de eventos |
| **Offline Conversions** | Eventos de conversao enviados ao Google Ads fora do navegador (server-to-server) |
| **Custom Audience** | Audiencia personalizada no Meta Ads baseada em dados de CRM |
| **Lookalike** | Audiencia criada pelo Meta para encontrar usuarios similares a uma Custom Audience |
| **BYO Keys** | Bring Your Own Keys — modelo onde o usuario fornece suas proprias credenciais API |
| **MonaraTokenVault** | Sistema de armazenamento seguro de tokens com AES-256 |
| **Developer Token** | Token de acesso ao Google Ads API emitido pelo Google |
| **Long-Lived Token** | Access token do Meta com validade de 60 dias (vs 1h do short-lived) |

---

## Apendice A: Constantes e Configuracoes

```typescript
// lib/integrations/ads/constants.ts (NOVO)

export const META_API = {
  BASE_URL: 'https://graph.facebook.com/v21.0',
  RATE_LIMIT: 200,           // calls per hour per ad account
  TIMEOUT_MS: 10_000,
  TOKEN_REFRESH_BUFFER: 24 * 60 * 60 * 1000,  // 24h antes de expirar
} as const;

export const GOOGLE_ADS_API = {
  BASE_URL: 'https://googleads.googleapis.com/v18',
  TOKEN_URL: 'https://oauth2.googleapis.com/token',
  RATE_LIMIT: 15_000,        // operations per day per developer token
  TIMEOUT_MS: 15_000,
  TOKEN_REFRESH_BUFFER: 15 * 60 * 1000,  // 15min antes de expirar
} as const;

export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1_000,
  MAX_DELAY_MS: 30_000,
  JITTER_FACTOR: 0.3,
} as const;
```

---

## Apendice B: Mapa de Dependencias entre Items

```
S30-FN-03 (MonaraToken Enhancement)
  ↓
S30-FN-01 (Token Refresh Engine)
  ↓
S30-FN-02 (Integration Validation Real)
  ↓
  ├── S30-META-01 (Meta fetchMetrics) ←── depende de token refresh
  │     ↓
  │     S30-PERF-01 (Performance Metrics Real) ←── depende de META-01 + GOOG-01
  │
  ├── S30-META-02 (Meta updateAdCreative) ←── independente
  │
  ├── S30-META-03 (Meta syncCustomAudience) ←── independente
  │     ↓
  │     S30-META-04 (AdsLookalikeSync Real) ←── depende de META-03
  │
  ├── S30-GOOG-01 (Google fetchMetrics) ←── depende de token refresh
  │     ↓
  │     S30-PERF-01 (Performance Metrics Real) ←── depende de META-01 + GOOG-01
  │
  ├── S30-GOOG-02/03 (Google pause/budget) ←── independentes
  │     ↓
  │     S30-GOOG-04 (Google getEntityStatus) ←── verificacao pos-action
  │
  └── S30-PERF-02 (Google Offline Conversions) ←── independente (usa token refresh)

S30-RL-01 (Rate Limiting) ←── STRETCH, independente do resto
```

---

*PRD elaborado por Iuran (PM) — NETECMT v2.0*  
*Sprint 30: Ads Integration Foundation (Meta + Google) | 07/02/2026*  
*Tipo: Feature Sprint | Alto Impacto de Negocio*  
*Estimativa: ~20-26h (core) / ~23-30h (com STRETCH)*  
*9 stubs/TODOs eliminados | 0 dependencias npm novas | REST puro*  
*Proximo passo: Architecture Review (Athos)*
