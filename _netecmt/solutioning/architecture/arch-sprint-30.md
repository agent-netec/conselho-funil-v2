# Architecture Review: Sprint 30 — Ads Integration Foundation (Meta + Google)

**Versao:** 1.0  
**Responsavel:** Athos (Architect)  
**Status:** APROVADO COM RESSALVAS (16 DTs, 4 Blocking)  
**Data:** 07/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-30-ads-integration-foundation.md`  
**Arch Review Predecessora:** `_netecmt/solutioning/architecture/arch-sprint-29.md`  
**Sprint Predecessora:** Sprint 29 (QA 100/100)  
**Baseline:** 224/224 testes, tsc=0, build=103+ rotas

---

## 1. Sumario Executivo

Apos leitura completa de 16 arquivos-fonte (2 performance adapters, 1 base adapter, 2 automation adapters, 1 ads-sync, 1 capi-sync, 2 rotas de performance, 1 vault, 1 performance advisor, 1 anomaly engine, 1 encryption, 1 journey types, 1 performance types, 1 automation types), 3 padroes Sigma (api-response, conversation-guard, social-platform) e 3 artefatos de referencia (PRD S30, arch-sigma, arch-29), esta Architecture Review **APROVA** a Sprint 30 com **16 Decision Topics** (DT-01 a DT-16), sendo **4 blocking** que devem ser resolvidos antes ou durante a implementacao.

O PRD esta **excepcionalmente bem estruturado** — as 5 fases com 4 gates sao corretas, a decisao REST puro (D-02) e acertada, e o faseamento foundation → meta → google → performance e logicamente solido. A analise de codigo revela, porem, **10 descobertas criticas** que o PRD desconhece ou subestima, incluindo **colisao de nomes entre dois MetaAdsAdapter**, **bug de constructor em ads-sync.ts**, e **token refresh buffer fixo incompativel com Google**.

### Descobertas Criticas (Divergencias vs PRD)

> **DC-01: Existem DOIS `MetaAdsAdapter` com MESMO NOME em modulos diferentes**
>
> - `lib/performance/adapters/meta-adapter.ts`: `MetaAdsAdapter extends AdsPlatformAdapter` — fetchMetrics (READ-ONLY, para dashboards)
> - `lib/automation/adapters/meta.ts`: `MetaAdsAdapter` (classe independente) — updateAdCreative, syncCustomAudience (WRITE actions, gestao de ads)
>
> Ambas as classes chamam-se `MetaAdsAdapter` mas tem propositos e hierarquias completamente diferentes. O PRD trata como se fossem uma unica classe. Se um dev importar o adapter errado, o TypeScript nao vai alertar (nomes iguais, modulos diferentes). Isso e uma armadilha de naming collision.
>
> **Impacto:** A nomenclatura deve ser desambiguada para evitar confusao durante S30. O mesmo ocorre com `GoogleAdsAdapter` (performance vs automation).

> **DC-02: `ads-sync.ts` tem BUG DE CONSTRUCTOR alem do bug multi-tenant**
>
> L15: `static async syncHotLeadsToMeta(brandId: string, metaToken: string, adAccountId: string)`
> L38: `const metaAdapter = new MetaAdsAdapter(metaToken, adAccountId)`
>
> O constructor de `MetaAdsAdapter` (automation) espera `(brandId: string, adAccountId?: string)`. O `ads-sync.ts` passa `metaToken` (access token) como primeiro argumento, que e armazenado como `this.brandId`. Depois, `getAccessToken()` chama `MonaraTokenVault.getToken(this.brandId, 'meta')` — usando o ACCESS TOKEN como ID de brand. Isso NUNCA funcionou em producao.
>
> **Impacto:** O fix do PRD para multi-tenant (S30-META-04) deve corrigir AMBOS os bugs: query na collection raiz E constructor com argumento errado.

> **DC-03: `MonaraTokenVault.isTokenExpiring()` usa buffer FIXO de 24h — incompativel com Google**
>
> `vault.ts` L84-88: O buffer e hardcoded em 24 horas. Google access_tokens expiram em 1 hora. Um buffer de 24h significa que TODOS os tokens Google sao SEMPRE considerados "expirando", triggando refresh a cada chamada.
>
> **Impacto:** O PRD (S30-FN-01) preve token refresh com buffer de 24h (Meta) e 15min (Google). O metodo `isTokenExpiring()` precisa de buffer per-provider, nao fixo.

> **DC-04: CAPI Sync usa env vars, nao MonaraTokenVault — quebra multi-tenant**
>
> `capi-sync.ts` L61-62: `process.env.META_CAPI_ACCESS_TOKEN` e `process.env.META_CAPI_PIXEL_ID`
> Env vars sao globais — nao suportam multi-tenant. Se dois brands usam a CAPI, ambos usam o mesmo pixel e token. S30 deveria migrar para `MonaraTokenVault.getToken(brandId, 'meta')` com `pixelId` vindo do token metadata.
>
> **Impacto:** Se S30 nao migrar isso agora, o capi-sync continuara single-tenant enquanto todo o resto e multi-tenant. Divergencia silenciosa.

> **DC-05: CAPI usa Graph API v18.0, PRD usa v21.0**
>
> `capi-sync.ts` L68: `https://graph.facebook.com/v18.0/${pixelId}/events`
> O PRD define v21.0 como versao padrao para todas as chamadas Meta.
> Manter v18.0 no CAPI e v21.0 no resto e inconsistente e pode causar confusao em debugging.

> **DC-06: `GoogleAdsAdapter` (automation) nao tem `accessToken` — impossivel fazer chamadas autenticadas**
>
> `google.ts` L7: `constructor(developerToken: string, customerId: string)` — sem `accessToken`.
> O PRD (secao 9.2) corretamente identifica que precisa adicionar `accessToken`, mas nao quantifica o impacto: TODOS os callers existentes de `GoogleAdsAdapter` (automation) precisam ser atualizados para passar 3 argumentos ao inves de 2.

> **DC-07: `AdsActionResponse.actionTaken` nao suporta novas acoes de S30**
>
> `types.ts` L5: `actionTaken: 'pause' | 'adjust_budget' | 'resume'`
> S30 adiciona `updateAdCreative` (Meta) e `syncCustomAudience` (Meta). Esses valores nao existem no union type. O MetaAdsAdapter (automation, L47) ja usa `'resume'` como placeholder para `'update'`, o que e semanticamente incorreto.

> **DC-08: `UnifiedAdsMetrics` nao tem `clicks` nem `impressions` — dados perdem-se na normalizacao**
>
> `performance.ts` L11-19: `UnifiedAdsMetrics` tem `spend, revenue, roas, cac, ctr, cpc, conversions`.
> Sem `clicks` nem `impressions`. Porem, o adapter `normalize()` (base-adapter.ts L22-40) CALCULA `ctr` e `cpc` a partir de clicks/impressions, mas o tipo de retorno `NormalizedAdapterResult` (L14) adiciona esses campos via intersection type.
> O tipo `PerformanceMetric.data` (L30) usa `UnifiedAdsMetrics` sem clicks/impressions. Resultado: ao persistir no Firestore, clicks e impressions sao PERDIDOS.
>
> `PerformanceMetricDoc` (L99-109) TEM clicks/impressions, mas e "legado". O `AnomalyEngine` usa `PerformanceMetricDoc`, nao `PerformanceMetric`.

> **DC-09: `AnomalyEngine.detect()` usa `new Date()` ao inves de `Timestamp`**
>
> `anomaly-engine.ts` L64: `createdAt: new Date() as any` — viola padrao Sigma (`Timestamp`, nao `Date`).
> S30 vai alimentar o AnomalyEngine com dados reais. O `as any` deve ser corrigido agora.

> **DC-10: Nao existe metodo `refreshAndSave()` no MonaraTokenVault — PRD assume que sera criado em S30-FN-03**
>
> `vault.ts` L41-89: MonaraTokenVault tem apenas `saveToken()`, `getToken()`, `isTokenExpiring()`.
> O PRD preve adicionar `refreshAndSave()` e `getValidToken()`. Correto — esses metodos sao novos e devem ser criados.

---

## 2. Analise por Decision Topic

### DT-01 — OAuth2 Token Refresh: Buffer Per-Provider, Nao Fixo (P0, BLOCKING)

**Problema (DC-03 detalhado):**

`MonaraTokenVault.isTokenExpiring()` tem buffer fixo de 24h:

```typescript
// vault.ts L84-88 — ATUAL
static isTokenExpiring(token: MonaraToken): boolean {
  const buffer = 24 * 60 * 60 * 1000; // 24 horas — FIXO
  const now = Date.now();
  return token.expiresAt.toMillis() - now < buffer;
}
```

| Provider | Token Lifetime | Buffer Ideal | Buffer Atual | Resultado |
|:---------|:--------------|:-------------|:-------------|:----------|
| Meta | 60 dias (long-lived) | 24h | 24h | OK |
| Google | 1 hora | 5-15min | 24h | **SEMPRE EXPIRANDO** |

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | Tornar `isTokenExpiring()` provider-aware: receber provider como parametro, usar buffer de 24h para Meta e 15min para Google | Correto, minimo impacto |
| B | Usar dois metodos separados (`isMetaTokenExpiring`, `isGoogleTokenExpiring`) | Over-engineering — um if basta |
| C | Manter 24h fixo | **INCORRETO** — Google refresh a cada chamada, desperdicio de quota |

**Implementacao recomendada:**

```typescript
static isTokenExpiring(token: MonaraToken, provider?: 'meta' | 'google'): boolean {
  const buffers: Record<string, number> = {
    meta: 24 * 60 * 60 * 1000,    // 24h antes de expirar (tokens duram 60 dias)
    google: 15 * 60 * 1000,        // 15min antes de expirar (tokens duram 1h)
  };
  const buffer = buffers[provider || token.provider] || buffers.meta;
  const now = Date.now();
  return token.expiresAt.toMillis() - now < buffer;
}
```

**Impacto no `ensureFreshToken()` (S30-FN-01):**
- A funcao proposta no PRD ja passa `provider` — basta repassar para `isTokenExpiring(token, provider)`.

**Severidade:** P0 | **Blocking:** SIM (sem isso, Google refresh dispara SEMPRE)

---

### DT-02 — Naming Collision: Dois MetaAdsAdapter (P0, BLOCKING)

**Problema (DC-01 detalhado):**

| Classe | Modulo | Heranca | Proposito | Metodos |
|:-------|:-------|:--------|:----------|:--------|
| `MetaAdsAdapter` | `lib/performance/adapters/meta-adapter.ts` | `extends AdsPlatformAdapter` | Fetch de metricas (READ) | `fetchMetrics()` |
| `MetaAdsAdapter` | `lib/automation/adapters/meta.ts` | Nenhuma | Gestao de ads (WRITE) | `updateAdCreative()`, `syncCustomAudience()` |

O mesmo ocorre com `GoogleAdsAdapter`:

| Classe | Modulo | Heranca | Proposito | Metodos |
|:-------|:-------|:--------|:----------|:--------|
| `GoogleAdsAdapter` | `lib/performance/adapters/google-adapter.ts` | `extends AdsPlatformAdapter` | Fetch de metricas (READ) | `fetchMetrics()` |
| `GoogleAdsAdapter` | `lib/automation/adapters/google.ts` | `implements IAdsAdapter` | Gestao de ads (WRITE) | `pauseAdEntity()`, `adjustBudget()`, `getEntityStatus()` |

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | Renomear adapters de performance: `MetaMetricsAdapter`, `GoogleMetricsAdapter`. Manter automation com nomes atuais (mais callers). | Minimo impacto — performance adapters tem 0 callers externos hoje |
| B | Renomear adapters de automation: `MetaActionsAdapter`, `GoogleActionsAdapter` | Mais callers a atualizar (ads-sync, automation engine, etc.) |
| C | Manter nomes iguais, confiar que imports nao colidem | **PERIGOSO** — S30 vai fazer MUITAS mudancas e um import errado passa silenciosamente |

**Justificativa Opcao A:**
- Performance adapters (`meta-adapter.ts`, `google-adapter.ts`) sao NOVOS (S30 implementa real pela primeira vez). Nenhum consumer externo importa deles atualmente — a rota de metrics instancia inline.
- Automation adapters (`meta.ts`, `google.ts`) tem callers existentes: `ads-sync.ts`, `automation/engine.ts`, testes.
- Renomear o lado com MENOS callers minimiza impacto.

**Renomeacoes propostas:**

```typescript
// lib/performance/adapters/meta-adapter.ts
export class MetaMetricsAdapter extends AdsPlatformAdapter { ... }

// lib/performance/adapters/google-adapter.ts
export class GoogleMetricsAdapter extends AdsPlatformAdapter { ... }
```

**Severidade:** P0 | **Blocking:** SIM (sem isso, imports cruzados sao inevitaveis durante S30)

---

### DT-03 — ads-sync.ts: Bug de Constructor + Bug de Collection (P0, BLOCKING)

**Problema (DC-02 detalhado):**

O `ads-sync.ts` tem DOIS bugs, nao um:

**Bug 1 — Collection raiz (ja documentado no PRD):**
```typescript
// L20 — ERRADO: collection raiz
const leadsRef = collection(db, 'leads');
```
Fix: `collection(db, 'brands', brandId, 'leads')`

**Bug 2 — Constructor com argumento errado (NAO documentado no PRD):**
```typescript
// L38 — ERRADO: metaToken passado como brandId
const metaAdapter = new MetaAdsAdapter(metaToken, adAccountId);
```

O `MetaAdsAdapter` (automation, `meta.ts`) constructor espera `(brandId, adAccountId?)`:
```typescript
constructor(brandId: string, adAccountId?: string) {
  this.brandId = brandId;      // ← metaToken armazenado como brandId!
  this.adAccountId = adAccountId;
}
```

Depois, `getAccessToken()` chama:
```typescript
const token = await MonaraTokenVault.getToken(this.brandId, 'meta');
// ← Busca token usando ACCESS TOKEN como brand ID — NUNCA funciona
```

**Fix completo para ads-sync.ts:**

```typescript
static async syncHotLeadsToMeta(brandId: string) {
  // 1. Buscar credenciais do vault
  const token = await MonaraTokenVault.getToken(brandId, 'meta');
  if (!token) throw new Error(`Meta token not found for brand ${brandId}`);

  // 2. Buscar leads hot (scoped por brandId)
  const leadsRef = collection(db, 'brands', brandId, 'leads');
  const q = query(
    leadsRef,
    where('segment', '==', 'hot'),
    limit(100)
  );

  const snap = await getDocs(q);
  if (snap.empty) return { success: true, count: 0 };

  // 3. Usar adapter com brandId correto
  const metaAdapter = new MetaAdsAdapter(brandId, token.metadata?.adAccountId);
  const leadIds = snap.docs.map(d => d.id);

  const result = await metaAdapter.syncCustomAudience(
    token.metadata?.audienceId || '',
    leadIds
  );

  return {
    success: result,
    count: leadIds.length,
    platform: 'meta',
    syncedAt: Timestamp.now()
  };
}
```

**Nota:** A signature do metodo muda: de `(brandId, metaToken, adAccountId)` para `(brandId)`. O token vem do vault, nao de parametro. Verificar TODOS os callers de `syncHotLeadsToMeta`.

**Severidade:** P0 | **Blocking:** SIM (bug duplo — fix parcial do PRD deixa o constructor quebrado)

---

### DT-04 — CAPI Sync: Migrar de Env Vars para MonaraTokenVault (P0, BLOCKING)

**Problema (DC-04 detalhado):**

```typescript
// capi-sync.ts L61-62 — SINGLE-TENANT
const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
const pixelId = process.env.META_CAPI_PIXEL_ID;
```

Env vars sao globais. Se Brand A e Brand B usam CAPI, ambos enviam conversoes para o MESMO pixel. Isso viola multi-tenant e pode causar dados corrompidos no Meta Ads Manager dos clientes.

**Fix recomendado:**

1. `CAPISyncEngine` deve receber `brandId` no constructor
2. Buscar `accessToken` e `pixelId` do `MonaraTokenVault`
3. Manter env vars como fallback para desenvolvimento local (sem multi-tenant)

```typescript
export class CAPISyncEngine {
  private brandId: string;
  private readonly MAX_RETRIES = 3;

  constructor(brandId: string) {
    this.brandId = brandId;
  }

  private async getMetaCredentials(): Promise<{ accessToken: string; pixelId: string }> {
    const token = await MonaraTokenVault.getToken(this.brandId, 'meta');
    if (token?.accessToken && token?.metadata?.pixelId) {
      return { accessToken: token.accessToken, pixelId: token.metadata.pixelId };
    }
    // Fallback para env vars (desenvolvimento local)
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;
    const pixelId = process.env.META_CAPI_PIXEL_ID;
    if (!accessToken || !pixelId) throw new Error('Meta CAPI credentials missing');
    return { accessToken, pixelId };
  }
}
```

**Impacto adicional (DC-05):** Atualizar versao da Graph API de v18.0 para v21.0 no CAPI no mesmo PR.

**Severidade:** P0 | **Blocking:** SIM (multi-tenant violation em producao)

---

### DT-05 — AdCredentials: Union Type Discriminada, Nao Interface Unica (P1, Nao Blocking)

**Problema:** O PRD (secao 9.1) propoe:

```typescript
export interface AdCredentials {
  accessToken: string;
  adAccountId: string;
  developerToken?: string;   // Google only
  customerId?: string;       // Google only
  pixelId?: string;          // Meta only
}
```

Campos opcionais para cada plataforma sao frageis — e possivel criar uma `AdCredentials` para Google sem `developerToken` e o TypeScript nao vai alertar.

**Recomendacao: Discriminated Union**

```typescript
export interface MetaAdCredentials {
  platform: 'meta';
  accessToken: string;
  adAccountId: string;         // act_XXXX
  pixelId?: string;            // Para CAPI
}

export interface GoogleAdCredentials {
  platform: 'google';
  accessToken: string;
  developerToken: string;      // OBRIGATORIO para Google
  customerId: string;          // OBRIGATORIO para Google
  managerAccountId?: string;   // MCC (opcional)
}

export type AdCredentials = MetaAdCredentials | GoogleAdCredentials;

// Type guards
export function isMetaCredentials(c: AdCredentials): c is MetaAdCredentials {
  return c.platform === 'meta';
}

export function isGoogleCredentials(c: AdCredentials): c is GoogleAdCredentials {
  return c.platform === 'google';
}
```

**Vantagens:**
1. `developerToken` e OBRIGATORIO para Google (nao opcional)
2. TypeScript forca a verificacao de plataforma antes de acessar campos
3. Type guards facilitam narrowing sem `as` casts
4. Pattern consistente com `SocialPlatform` (Sigma)

**Impacto no `base-adapter.ts`:**

```typescript
// ANTES
abstract fetchMetrics(credentials: any, period: { start: Date; end: Date }): Promise<RawAdsData[]>;

// DEPOIS
abstract fetchMetrics(credentials: AdCredentials, period: { start: Date; end: Date }): Promise<RawAdsData[]>;
```

Cada adapter faz narrowing no inicio:
```typescript
// MetaMetricsAdapter
async fetchMetrics(credentials: AdCredentials, period: ...): Promise<RawAdsData[]> {
  if (!isMetaCredentials(credentials)) throw new Error('Expected Meta credentials');
  // credentials e agora MetaAdCredentials — TypeScript sabe que adAccountId existe
}
```

**Severidade:** P1 | **Blocking:** Nao (a interface flat do PRD funciona, mas a union e mais segura)

---

### DT-06 — AdsActionResponse: Expandir Union de Actions (P1, Nao Blocking)

**Problema (DC-07):**

```typescript
// types.ts L5 — ATUAL
actionTaken: 'pause' | 'adjust_budget' | 'resume';
```

S30 adiciona:
- `updateAdCreative` (Meta, S30-META-02)
- `syncCustomAudience` (Meta, S30-META-03)
- `getEntityStatus` (Google, S30-GOOG-04) — retorna dados, nao e acao, mas se precisar

**Fix:**

```typescript
actionTaken: 'pause' | 'adjust_budget' | 'resume' | 'update_creative' | 'sync_audience' | 'get_status';
```

Tambem adicionar campo opcional `details` para retornar info extra:

```typescript
export interface AdsActionResponse {
  success: boolean;
  externalId: string;
  platform: 'meta' | 'google';
  actionTaken: 'pause' | 'adjust_budget' | 'resume' | 'update_creative' | 'sync_audience' | 'get_status';
  newValue?: number;
  details?: Record<string, unknown>;  // Ex: { audienceSize: 1500 } para sync_audience
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
}
```

**Severidade:** P1 | **Blocking:** Nao

---

### DT-07 — GoogleAdsAdapter (Automation): Adicionar accessToken ao Constructor (P1, Nao Blocking)

**Problema (DC-06):**

```typescript
// google.ts L7 — ATUAL: sem accessToken
constructor(developerToken: string, customerId: string) {
```

O Google Ads API REST requer header `Authorization: Bearer {access_token}`. Sem ele, nenhuma chamada funciona.

**Fix:**

```typescript
export class GoogleAdsAdapter implements IAdsAdapter {
  private accessToken: string;
  private developerToken: string;
  private customerId: string;

  constructor(accessToken: string, developerToken: string, customerId: string) {
    this.accessToken = accessToken;
    this.developerToken = developerToken;
    this.customerId = customerId;
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'developer-token': this.developerToken,
      'Content-Type': 'application/json',
    };
  }
}
```

**Impacto nos callers:** Verificar TODOS os locais que instanciam `new GoogleAdsAdapter(...)`. O `automation/engine.ts` provavelmente cria a instancia — precisa passar `accessToken` obtido do vault.

**Severidade:** P1 | **Blocking:** Nao (mas sem isso nenhuma chamada Google funciona)

---

### DT-08 — UnifiedAdsMetrics: Adicionar clicks e impressions (P1, Nao Blocking)

**Problema (DC-08):**

```typescript
// performance.ts — ATUAL
export interface UnifiedAdsMetrics {
  spend: number;
  revenue: number;
  roas: number;
  cac: number;
  ctr: number;
  cpc: number;
  conversions: number;
  // SEM clicks, SEM impressions!
}
```

O `base-adapter.ts` compensa com intersection type (L14):
```typescript
type NormalizedAdapterResult = UnifiedAdsMetrics & { clicks: number; impressions: number; cpa: number };
```

Mas `PerformanceMetric.data` (L30) e `UnifiedAdsMetrics` SEM os campos extras. Ao persistir no Firestore, clicks e impressions sao PERDIDOS.

O `AnomalyEngine` usa `PerformanceMetricDoc` (tipo legado, L99+) que TEM clicks/impressions. Resultado: o AnomalyEngine e o Performance route usam tipos DIFERENTES.

**Recomendacao:** Adicionar `clicks` e `impressions` a `UnifiedAdsMetrics`:

```typescript
export interface UnifiedAdsMetrics {
  spend: number;
  revenue: number;
  roas: number;
  cac: number;
  ctr: number;
  cpc: number;
  cpa: number;          // NOVO (ja calculado no normalize, mas nao estava no tipo)
  conversions: number;
  clicks: number;       // NOVO
  impressions: number;  // NOVO
}
```

**Impacto:**
- `PerformanceMetric.data` automaticamente ganha clicks/impressions
- Pode eliminar `NormalizedAdapterResult` em `base-adapter.ts` (redundante)
- `PerformanceMetricDoc` pode ser simplificado (remover intersection)
- Mock em `metrics/route.ts` (L68-76) precisa adicionar clicks/impressions
- AnomalyEngine pode migrar gradualmente de `PerformanceMetricDoc` para `PerformanceMetric`

**Severidade:** P1 | **Blocking:** Nao (funciona sem, mas dados incompletos no Firestore)

---

### DT-09 — AnomalyEngine: Corrigir `new Date() as any` (P2, Nao Blocking)

**Problema (DC-09):**

```typescript
// anomaly-engine.ts L64
createdAt: new Date() as any // Firestore Timestamp seria usado aqui
```

Viola padrao Sigma (`Timestamp`, nao `Date`). S30 vai alimentar o AnomalyEngine com dados reais — esse `as any` deve ser corrigido.

**Fix:** Substituir por `Timestamp.now()` e remover o `as any`:

```typescript
createdAt: Timestamp.now()
```

Importar `Timestamp` de `firebase/firestore` no topo do arquivo.

**Severidade:** P2 | **Blocking:** Nao

---

### DT-10 — SDK vs REST: Decisao CORRETA, com Ressalvas (P1, Nao Blocking)

**Analise da decisao D-02 do PRD:**

O PRD decidiu por **REST puro via `fetch()`**. Concordo plenamente. Evidencias do codebase:

| Integracao Existente | Metodo | Arquivo |
|:--------------------|:-------|:--------|
| Meta CAPI | `fetch()` REST | `capi-sync.ts` L68 |
| Firebase Auth | `fetch()` REST | `conversation-guard.ts` L61 |
| Gemini API | REST via wrapper | `gemini.ts` |
| Jina Reader | `fetch()` REST | `url-scraper.ts` |

**Pattern ja estabelecido:** O codebase usa `fetch()` para TODAS as integracoes externas. Adicionar SDKs (17MB+) quebraria essa consistencia.

**Ressalvas tecnicas para REST puro:**

1. **Google Ads API v18 REST:** Disponivel em `https://googleads.googleapis.com/v18/`. Documentacao REST e secundaria (Google prioriza gRPC), mas o endpoint e estavel e funcional. O PRD usou GAQL via `searchStream` — correto.

2. **Meta Graph API v21.0 REST:** Excelentemente documentado. Porem, o token de longa duracao (60 dias) requer `fb_exchange_token` que precisa de `app_id` e `app_secret`. Esses campos DEVEM estar no MonaraToken (o PRD preve isso na secao 8).

3. **Timeout strategy:** O PRD preve 10s para Meta e 15s para Google via `AbortSignal.timeout()`. Correto. Porem, `AbortSignal.timeout()` requer Node 18+ / browser. Verificar que o ambiente Vercel suporta (Next.js 16.1.1 com Node 20+ — OK).

**Veredito:** Decisao APROVADA sem alteracoes.

**Severidade:** P1 | **Blocking:** Nao

---

### DT-11 — Sandbox vs Production: Strategy CORRETA (P1, Nao Blocking)

**Analise da decisao D-03 do PRD:**

| Aspecto | PRD | Athos |
|:--------|:----|:------|
| Meta | Production API + mock fallback | CORRETO — Meta nao tem sandbox separado |
| Google | Production API + test account | CORRETO — test account usa mesma API |
| Feature flag | `mock=true` existente | CORRETO — ja implementado em ambas rotas |
| Graceful degradation | Cached + warning | CORRETO — ver DT-14 (cache strategy) |

**Adicional nao previsto no PRD: Google Developer Token Test Mode**

O Google emite developer tokens em dois modos:
- **Test**: Limitado a 15 requests/dia, acesso apenas a test accounts
- **Approved**: Full access (requer revisao pelo Google, pode levar semanas)

Isso nao e um "sandbox" separado — e o MESMO endpoint, mas com restricoes severas no modo test. O PRD lista isso como R-03 (risco) mas nao define como LIDAR.

**Recomendacao:** Adicionar warning claro na UI e na response quando o token estiver em modo test:

```typescript
// Detectar modo test: se fetchMetrics retorna erro com reason "DEVELOPER_TOKEN_NOT_APPROVED"
// Retornar: createApiSuccess({ metrics: [], warning: 'Google developer token em modo test. Metricas limitadas.' })
```

**Severidade:** P1 | **Blocking:** Nao

---

### DT-12 — Performance Metrics Route: HYBRID Strategy (Firestore Cache + Real-time) (P1, Nao Blocking)

**Problema:** O PRD (S30-PERF-01) propoe fetch direto das APIs a cada GET request:

```
GET /api/performance/metrics?brandId=X&mock=false
  → fetch Meta API + fetch Google API → normalize → persist → return
```

**Risco:** Cada pageview no dashboard dispara 2 chamadas API externas. Com 10 usuarios refreshing a cada 30s:
- Meta: 20 calls/min = 1200/h (vs limite de 200/h por ad account)
- Google: 20 calls/min = 1200/h (vs limite de ~600/h = 15000/dia)

O rate limit seria atingido em MINUTOS.

**Recomendacao: HYBRID Strategy**

```
GET /api/performance/metrics?brandId=X&mock=false
  │
  ├── 1. Buscar cache: brands/{brandId}/performance_cache/{date}
  │     ├── Se existe E updatedAt < 15min → RETORNAR cache direto (fast path)
  │     └── Se nao existe OU stale → continuar para step 2
  │
  ├── 2. Fetch real: Promise.all([metaAdapter, googleAdapter])
  │
  ├── 3. Normalize + aggregate
  │
  ├── 4. Persist cache (fire-and-forget):
  │     brands/{brandId}/performance_cache/{date}
  │     { metrics, updatedAt: Timestamp.now() }
  │
  └── 5. Return dados frescos
```

**Constantes:**

```typescript
const CACHE_TTL_MS = 15 * 60 * 1000;  // 15 minutos
const CACHE_COLLECTION = 'performance_cache';
```

**Vantagens:**
- 1 fetch real a cada 15min por brand (vs N por pageview)
- Rate limits nunca atingidos em uso normal
- Paginas carregam em <100ms (cache hit) vs 3-10s (API fetch)
- Graceful degradation: se API falhar, cache stale ainda esta la

**O PRD ja menciona "persistir no Firestore fire-and-forget" (secao 6.1), mas nao define o READ-BACK do cache.** Este DT complementa a estrategia.

**Severidade:** P1 | **Blocking:** Nao (funciona sem cache, mas rate limits serao problema)

---

### DT-13 — Error Handling / Retry / Circuit Breaker Strategy (P1, Nao Blocking)

**Analise da estrategia proposta no PRD (secao 6.5):**

O PRD define graceful degradation com retry em 429 e fallback para cache. Correto em principio. Detalhamento:

**1. Retry Strategy — Reusar `executeWithRetry()` do capi-sync.ts**

`capi-sync.ts` L108-120 ja implementa retry com exponential backoff. Generalizar para helper compartilhado:

```typescript
// lib/integrations/ads/api-helpers.ts (NOVO — previsto no PRD secao 16)

export async function fetchWithRetry(
  url: string,
  options: RequestInit,
  config: {
    maxRetries?: number;     // Default: 3
    baseDelayMs?: number;    // Default: 1000
    maxDelayMs?: number;     // Default: 30000
    timeoutMs?: number;      // Default: 10000
    retryOn?: number[];      // Default: [429, 500, 502, 503]
  } = {}
): Promise<Response> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000, timeoutMs = 10000, retryOn = [429, 500, 502, 503] } = config;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (response.ok || !retryOn.includes(response.status)) {
        return response;
      }

      // Rate limited — respeitar Retry-After header
      if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('Retry-After') || '0') * 1000;
        if (retryAfter > 0) {
          await sleep(Math.min(retryAfter, maxDelayMs));
          continue;
        }
      }

      if (attempt === maxRetries) return response; // Retorna o erro apos esgotar retries

    } catch (error) {
      if (attempt === maxRetries) throw error;
    }

    // Exponential backoff com jitter
    const delay = Math.min(baseDelayMs * Math.pow(2, attempt) * (0.7 + Math.random() * 0.6), maxDelayMs);
    await sleep(delay);
  }

  throw new Error('fetchWithRetry: unreachable');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**2. Circuit Breaker — NAO IMPLEMENTAR em S30**

Circuit breakers sao uteis para servicos com alta frequencia de chamadas (milhares/segundo). O Conselho de Funil faz dezenas de chamadas/hora — insuficiente para justificar a complexidade. O cache HYBRID (DT-12) ja atua como pseudo-circuit-breaker: se a API falhar, o cache serve como fallback por 15 minutos.

**3. Log Sanitizer — OBRIGATORIO (P-02 do PRD)**

```typescript
// lib/integrations/ads/api-helpers.ts

export function sanitizeForLog(url: string): string {
  return url
    .replace(/access_token=[^&]+/, 'access_token=***REDACTED***')
    .replace(/Bearer [^\s]+/, 'Bearer ***REDACTED***');
}
```

**Severidade:** P1 | **Blocking:** Nao

---

### DT-14 — MonaraToken Schema: Novos Campos Obrigatorios (P1, Nao Blocking)

**Analise da proposta do PRD (secao 8):**

O PRD propoe adicionar 7 campos opcionais ao MonaraToken. Analise:

| Campo PRD | Necessario em S30? | Onde usado? | Veredicto |
|:----------|:------------------|:-----------|:----------|
| `adAccountId?: string` | SIM | Meta fetchMetrics, syncCustomAudience | **ACEITO** — mas mover para `metadata` |
| `developerToken?: string` | SIM | Google API headers | **ACEITO** — mas deve ser ENCRYPTED |
| `pixelId?: string` | SIM | Meta CAPI | **ACEITO** — migra capi-sync de env vars |
| `appId?: string` | SIM | Meta token refresh | **ACEITO** |
| `appSecret?: string` | SIM | Meta token refresh | **ACEITO** — ENCRYPTED |
| `clientId?: string` | SIM | Google token refresh | **ACEITO** |
| `clientSecret?: string` | SIM | Google token refresh | **ACEITO** — ENCRYPTED |

**Recomendacao: Usar `metadata` para campos plataforma-especificos**

O MonaraToken ja tem `metadata: Record<string, any>`. Em vez de adicionar 7 campos top-level que so se aplicam a algumas plataformas, usar `metadata` com tipagem:

```typescript
export interface MonaraToken {
  brandId: string;
  provider: 'meta' | 'google' | 'instagram' | 'stripe';
  accessToken: string;                // AES-256 encrypted
  refreshToken?: string;              // AES-256 encrypted
  expiresAt: Timestamp;
  scopes: string[];
  metadata: MetaTokenMetadata | GoogleTokenMetadata | Record<string, any>;
  updatedAt: Timestamp;
}

// Metadata tipada por plataforma
export interface MetaTokenMetadata {
  adAccountId: string;                // act_XXXX
  pixelId?: string;                   // Para CAPI
  appId: string;                      // Para token refresh
  appSecret: string;                  // AES-256 encrypted — para token refresh
}

export interface GoogleTokenMetadata {
  customerId: string;                 // Google Ads customer ID
  developerToken: string;             // AES-256 encrypted
  clientId: string;                   // OAuth Client ID — para token refresh
  clientSecret: string;               // AES-256 encrypted — para token refresh
  managerAccountId?: string;          // MCC (opcional)
}
```

**Vantagens sobre campos top-level:**
1. Zero breaking change — `metadata` ja existe e e `Record<string, any>`
2. Tipagem por plataforma — TypeScript garante campos corretos
3. `saveToken()` ja serializa `metadata` como esta — zero mudanca no metodo de save
4. Campos sensiveis (appSecret, developerToken, clientSecret) devem ser encrypted via `encryptSensitiveFields()` antes do save

**ATENCAO:** `encryptSensitiveFields()` em `encryption.ts` L38-49 ja lista `clientSecret` e `apiKey` como sensitive keys. Porem, NAO lista `developerToken` nem `appSecret`. Adicionar esses campos a lista:

```typescript
const sensitiveKeys = [
  'accessToken', 'refreshToken', 'token', 'clientSecret', 'apiKey',
  'developerToken', 'appSecret',  // ← ADICIONAR para S30
  'email', 'firstName', 'lastName', 'phone', 'ipAddress'
];
```

**Severidade:** P1 | **Blocking:** Nao

---

### DT-15 — CAPI Sync: Upgrade para v21.0 e Adicionar brandId (P1, Nao Blocking)

**Problema (DC-04 + DC-05 combinados):**

1. CAPI usa `v18.0`, resto do codebase S30 usa `v21.0`
2. CAPI usa env vars, resto usa MonaraTokenVault

**Fix combinado:** Refatorar `CAPISyncEngine` para:
- Receber `brandId` no constructor
- Buscar credenciais do vault (com fallback env vars para dev)
- Usar v21.0

Tambem necessario para S30-PERF-02 (Google Offline Conversions): o `CAPISyncEngine.syncOfflineConversion()` precisa de `brandId` para buscar credenciais Google do vault.

**Severidade:** P1 | **Blocking:** Nao (funciona com env vars em dev, mas multi-tenant quebra em producao)

---

### DT-16 — Rate Limiting (STRETCH): Reusar Arch Review S29 (P2, Nao Blocking)

**Analise:** O PRD herda S29-FT-04 (Rate Limiting) como STRETCH. A `arch-sprint-29.md` (DT-09) ja define completamente:
- Guard function `checkRateLimit()`
- Schema Firestore `brands/{brandId}/quotas/{period}`
- DEFAULT_LIMITS (500 API calls/dia, 1000 AI credits/dia, 100 scans/dia)
- Admin routes isentas

**Adicional para S30:** Se rate limiting entrar em escopo, adicionar counters para chamadas de APIs externas:

| Action | Rotas | Default Limit |
|:-------|:------|:-------------|
| `meta_api_call` | fetchMetrics, updateAdCreative, syncCustomAudience | 200/h (rate limit da Meta) |
| `google_api_call` | fetchMetrics, pause, budget, status, offline | 15000/dia (rate limit do Google) |

Isso previne que o Conselho de Funil exceda os rate limits das PROPRIAS plataformas.

**Severidade:** P2 | **Blocking:** Nao (STRETCH)

---

## 3. Tabela Consolidada de Decision Topics

| DT | Titulo | Severidade | Blocking? | Fase | Item PRD | Acao |
|:---|:-------|:-----------|:----------|:-----|:---------|:-----|
| **DT-01** | Token refresh: buffer per-provider | **P0** | **SIM** | F1 | S30-FN-01/FN-03 | `isTokenExpiring()` receber provider, 24h Meta / 15min Google |
| **DT-02** | Naming collision: dois MetaAdsAdapter | **P0** | **SIM** | F1 | Pre-requisito | Renomear perf adapters: `MetaMetricsAdapter`, `GoogleMetricsAdapter` |
| **DT-03** | ads-sync: bug duplo (collection + constructor) | **P0** | **SIM** | F2 | S30-META-04 | Fix collection raiz + constructor + signature do metodo |
| **DT-04** | CAPI: migrar env vars para vault | **P0** | **SIM** | F4 | S30-PERF-02 | CAPISyncEngine receber brandId, buscar de vault |
| **DT-05** | AdCredentials: union discriminada | P1 | Nao | F1 | S30-FN-01 | MetaAdCredentials + GoogleAdCredentials com type guards |
| **DT-06** | AdsActionResponse: expandir actions | P1 | Nao | F2/F3 | S30-META-02/03 | Adicionar `update_creative`, `sync_audience`, `get_status` |
| **DT-07** | GoogleAdsAdapter: adicionar accessToken | P1 | Nao | F3 | S30-GOOG-02/03/04 | Constructor com 3 params + `getHeaders()` helper |
| **DT-08** | UnifiedAdsMetrics: clicks + impressions | P1 | Nao | F1 | S30-FN-01 | Adicionar campos ao tipo, eliminar intersection hack |
| **DT-09** | AnomalyEngine: Date → Timestamp | P2 | Nao | F4 | S30-PERF-01 | Substituir `new Date() as any` por `Timestamp.now()` |
| **DT-10** | SDK vs REST: decisao correta | P1 | Nao | — | D-02 | APROVADA — zero alteracao |
| **DT-11** | Sandbox vs Production: strategy correta | P1 | Nao | — | D-03 | APROVADA — adicionar warning para Google test token |
| **DT-12** | Performance route: hybrid cache 15min | P1 | Nao | F4 | S30-PERF-01 | Cache Firestore 15min antes de fetch real |
| **DT-13** | Error handling: fetchWithRetry + sanitizer | P1 | Nao | F1 | Novo | Generalizar retry do capi-sync para helper compartilhado |
| **DT-14** | MonaraToken: metadata tipada por plataforma | P1 | Nao | F1 | S30-FN-03 | Metadata interfaces por provider + encrypt sensitive keys |
| **DT-15** | CAPI: upgrade v18→v21 + brandId | P1 | Nao | F4 | S30-PERF-02 | Versao + multi-tenant |
| **DT-16** | Rate Limiting: reusar S29 + counters de API | P2 | Nao | F5 | S30-RL-01 | Adicionar `meta_api_call` e `google_api_call` counters |

---

## 4. Interface `AdCredentials` Proposta

```typescript
// lib/performance/adapters/base-adapter.ts (ou types/ads-credentials.ts)

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

### Funcao de Bridge: MonaraToken → AdCredentials

```typescript
// lib/integrations/ads/token-refresh.ts

export function tokenToCredentials(token: MonaraToken): AdCredentials {
  if (token.provider === 'meta') {
    const meta = token.metadata as MetaTokenMetadata;
    return {
      platform: 'meta',
      accessToken: token.accessToken,
      adAccountId: meta.adAccountId,
      pixelId: meta.pixelId,
    };
  }

  if (token.provider === 'google') {
    const google = token.metadata as GoogleTokenMetadata;
    return {
      platform: 'google',
      accessToken: token.accessToken,
      developerToken: google.developerToken,
      customerId: google.customerId,
      managerAccountId: google.managerAccountId,
    };
  }

  throw new Error(`Unsupported provider: ${token.provider}`);
}
```

---

## 5. OAuth2 Token Refresh Strategy

### 5.1 Meta: Long-Lived Token Exchange

```
Meta token lifecycle:
  Short-lived (1h) → Exchange → Long-lived (60 dias) → Exchange → Long-lived (60 dias)

[ensureFreshToken(brandId, 'meta')]
  │
  ├── MonaraTokenVault.getToken(brandId, 'meta')
  │
  ├── isTokenExpiring(token, 'meta') → buffer 24h
  │     ├── Se NAO expirando → return token (fast path)
  │     └── Se expirando → continuar
  │
  ├── GET https://graph.facebook.com/v21.0/oauth/access_token
  │   ?grant_type=fb_exchange_token
  │   &client_id={appId}              ← de token.metadata.appId
  │   &client_secret={appSecret}      ← de token.metadata.appSecret (decrypted)
  │   &fb_exchange_token={accessToken} ← token atual
  │
  ├── if response.ok:
  │     MonaraTokenVault.saveToken(brandId, {
  │       ...token,
  │       accessToken: response.access_token,
  │       expiresAt: Timestamp.fromMillis(Date.now() + response.expires_in * 1000)
  │     })
  │     return refreshedToken
  │
  └── if response.error:
      Log error, return token original (pode estar stale mas tentar)
```

### 5.2 Google: OAuth2 Refresh Token → Access Token

```
Google token lifecycle:
  Authorization Code → Access Token (1h) + Refresh Token (indefinido)
  Refresh Token → Access Token (1h) → Refresh Token → ...

[ensureFreshToken(brandId, 'google')]
  │
  ├── MonaraTokenVault.getToken(brandId, 'google')
  │
  ├── isTokenExpiring(token, 'google') → buffer 15min
  │     ├── Se NAO expirando → return token (fast path)
  │     └── Se expirando → continuar
  │
  ├── POST https://oauth2.googleapis.com/token
  │   Body: {
  │     client_id: token.metadata.clientId,
  │     client_secret: token.metadata.clientSecret,  ← decrypted
  │     refresh_token: token.refreshToken,             ← decrypted
  │     grant_type: 'refresh_token'
  │   }
  │
  ├── if response.ok:
  │     MonaraTokenVault.saveToken(brandId, {
  │       ...token,
  │       accessToken: response.access_token,
  │       expiresAt: Timestamp.fromMillis(Date.now() + response.expires_in * 1000)
  │     })
  │     return refreshedToken
  │
  └── if response.error:
      Log error, return token original (pode estar stale mas tentar)
```

### 5.3 Quem Chama ensureFreshToken?

| Caller | Quando | Provider |
|:-------|:-------|:---------|
| Performance Metrics Route | Antes de fetch real | `meta` + `google` |
| Integration Validate Route | Durante validacao | Per platform |
| AdsLookalikeSync | Antes de sync | `meta` |
| CAPISyncEngine | Antes de dispatch | `meta` + `google` |
| Automation Engine (pause/budget) | Antes de acao | Per platform |

**Padrao:** `ensureFreshToken()` e chamado NO ROUTE HANDLER, nao dentro dos adapters. Os adapters recebem `AdCredentials` ja com token valido.

---

## 6. Correcoes nas Premissas do PRD

| # | Premissa do PRD | Realidade | Impacto na Estimativa |
|:--|:----------------|:----------|:---------------------|
| **CP-01** | "`ads-sync.ts` tem bug de multi-tenant (collection raiz)" | Tem DOIS bugs: collection raiz + constructor passa token como brandId. Signature do metodo muda | +30min (fix + callers) |
| **CP-02** | "`meta.ts` ja tem chamadas Graph API comentadas — basta descomentar" | Codigo comentado (L38-39) esta INCOMPLETO: falta error handling, falta headers corretos, falta timeout. Nao e "descomentar" — e reimplementar | +30min (mais complexo que "descomentar") |
| **CP-03** | "`base-adapter.ts` usa `credentials: any` — S30 deve tipar" | Correto, mas ha DOIS adapter systems com nomes iguais. Precisa desambiguar primeiro | +45min (rename + update imports) |
| **CP-04** | "CAPI ja tem Meta CAPI funcional — so falta Google Offline" | CAPI usa env vars single-tenant e Graph API v18.0. Precisa migrar para vault e v21.0 | +1h (refactor CAPI + vault integration) |
| **CP-05** | "MonaraTokenVault.isTokenExpiring() com buffer 24h" | Buffer fixo nao funciona para Google (token 1h). Precisa buffer per-provider | +15min |
| **CP-06** | "UnifiedAdsMetrics ja tem os campos necessarios" | Nao tem clicks nem impressions. AnomalyEngine usa tipo diferente (PerformanceMetricDoc) | +30min (expandir tipo + reconciliar) |

---

## 7. Estimativa Revisada (Athos)

### Fase 0 — Pre-requisitos (NAO prevista no PRD)

| Item | Descricao | Esforco | DT |
|:-----|:----------|:--------|:---|
| Renomear MetaAdsAdapter/GoogleAdsAdapter (perf) | `MetaMetricsAdapter`, `GoogleMetricsAdapter` | XS (~20min) | DT-02 |
| Expandir UnifiedAdsMetrics | Adicionar clicks, impressions, cpa | XS (~15min) | DT-08 |
| Expandir AdsActionResponse | Adicionar actions novas | XS (~10min) | DT-06 |
| Fix AnomalyEngine Date→Timestamp | Trivial | XS (~5min) | DT-09 |
| Adicionar sensitive keys a encryption.ts | developerToken, appSecret | XS (~5min) | DT-14 |
| **Subtotal F0** | | **~55min** | |

### Fase 1 — Foundation (~3.5-4.5h)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S30-FN-03 (MonaraToken enhancement) | XS (~30min) | S (~45min) | +15min | DT-14: metadata tipada + DT-01: isTokenExpiring per-provider |
| S30-FN-01 (Token Refresh Engine) | M (~2h) | M (~2h) | = | Design solido no PRD |
| S30-FN-02 (Integration Validation Real) | S (~1.5h) | S (~1.5h) | = | Direto |
| **Subtotal F1** | **~3-4h** | **~4-4.5h** | **+30min** | DT-01, DT-14 |

### Fase 2 — Meta Ads (~6-8h)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S30-META-01 (Meta fetchMetrics) | M (~2.5h) | M (~2.5h) | = | Implementacao clara no PRD |
| S30-META-02 (Meta updateAdCreative) | S (~1.5h) | M (~2h) | +30min | CP-02: nao e "descomentar", e reimplementar com error handling |
| S30-META-03 (Meta syncCustomAudience) | M (~2h) | M (~2h) | = | Design claro |
| S30-META-04 (AdsLookalikeSync) | S (~1h) | S+ (~1.5h) | +30min | DT-03: bug duplo (collection + constructor + signature) |
| **Subtotal F2** | **~5-7h** | **~6-8h** | **+1h** | CP-02, DT-03 |

### Fase 3 — Google Ads (~5.5-7.5h)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S30-GOOG-01 (Google fetchMetrics) | M (~3h) | M (~3h) | = | Design claro no PRD |
| S30-GOOG-02 (Google pauseAdEntity) | M (~2h) | M- (~1.5h) | -30min | DT-07: getHeaders() reusavel simplifica |
| S30-GOOG-03 (Google adjustBudget) | S (~1.5h) | S (~1.5h) | = | Direto |
| S30-GOOG-04 (Google getEntityStatus) | S (~1h) | S (~1h) | = | Direto |
| *Adicional: Constructor refactor* | — | XS (~30min) | +30min | DT-07: accessToken no constructor + callers |
| **Subtotal F3** | **~5-7h** | **~5.5-7.5h** | **+0.5h** | DT-07 |

### Fase 4 — Performance & Offline Conversions (~4-5.5h)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S30-PERF-01 (Performance Metrics Real) | M (~2h) | M+ (~2.5h) | +30min | DT-12: hybrid cache strategy |
| S30-PERF-02 (Google Offline Conversions) | M (~2h) | M+ (~2.5-3h) | +30min-1h | DT-04 + DT-15: refactor CAPI (brandId + vault + v21.0) |
| *Adicional: api-helpers.ts (fetchWithRetry)* | — | S (~30min) | +30min | DT-13: helper compartilhado |
| **Subtotal F4** | **~3-4h** | **~5-6h** | **+1.5-2h** | DT-04, DT-12, DT-13, DT-15 |

### Fase 5 — STRETCH (Rate Limiting)

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S30-RL-01 | M (~3-4h) | M (~3-4h) | = | Design S29 reutilizado + DT-16 (counters API) |

### QA Final

| Item | Estimativa |
|:-----|:----------|
| Gate checks (4 gates) | ~1.5h |
| Regression (224+ testes) | ~30min |
| Novos testes (T-01 a T-12) | Incluidos em cada story |
| **Subtotal QA** | **~2h** |

### Total Consolidado

| Fase | PRD | Athos | Delta |
|:-----|:----|:------|:------|
| Fase 0 (Pre-requisitos) | — | ~55min | +55min |
| Fase 1 (Foundation) | 3-4h | 4-4.5h | +30min |
| Fase 2 (Meta Ads) | 5-7h | 6-8h | +1h |
| Fase 3 (Google Ads) | 5-7h | 5.5-7.5h | +0.5h |
| Fase 4 (Performance) | 3-4h | 5-6h | +1.5-2h |
| QA Final | 2h | 2h | = |
| **TOTAL sem STRETCH** | **~18-24h** | **~23.5-30h** | **+4.5-6h** |
| STRETCH (Rate Limiting) | 3-4h | 3-4h | = |
| **TOTAL com STRETCH** | **~21-28h** | **~26.5-34h** | **+4.5-6h** |

**Incremento de ~5h justificado por:**
- DT-02: +55min (Fase 0 inteira — pre-requisitos de naming/types)
- DT-01/DT-14: +30min (buffer per-provider + metadata tipada)
- DT-03: +30min (bug duplo ads-sync)
- CP-02: +30min (meta.ts nao e "descomentar")
- DT-04/DT-15: +1h (CAPI refactor para multi-tenant)
- DT-12: +30min (hybrid cache)
- DT-13: +30min (fetchWithRetry helper)
- DT-07: +30min (GoogleAdsAdapter constructor)

---

## 8. Mapa de Impacto por Arquivo

### Arquivos Criados (Novos)

| Arquivo | Fase | DT | Descricao |
|:--------|:-----|:---|:----------|
| `lib/integrations/ads/token-refresh.ts` | F1 | DT-01 | ensureFreshToken() + tokenToCredentials() |
| `lib/integrations/ads/api-helpers.ts` | F1 | DT-13 | fetchWithRetry() + sanitizeForLog() + sleep() |
| `lib/integrations/ads/constants.ts` | F1 | — | META_API, GOOGLE_ADS_API, RETRY_CONFIG (PRD Apendice A) |
| `lib/guards/rate-limiter.ts` | F5 | DT-16 | checkRateLimit() — STRETCH |

### Arquivos Modificados

| Arquivo | DTs/Fase | Tipo de Mudanca |
|:--------|:---------|:---------------|
| `lib/performance/adapters/base-adapter.ts` | DT-05/F1 | Tipar `credentials: any` → `AdCredentials` |
| `lib/performance/adapters/meta-adapter.ts` | DT-02/F2 | Renomear `MetaMetricsAdapter` + substituir mock por Graph API real |
| `lib/performance/adapters/google-adapter.ts` | DT-02/F3 | Renomear `GoogleMetricsAdapter` + substituir mock por Google Ads API real |
| `lib/automation/adapters/google.ts` | DT-07/F3 | Adicionar accessToken no constructor + getHeaders() + implementar pause/budget/status reais |
| `lib/automation/adapters/meta.ts` | F2 | Implementar updateAdCreative e syncCustomAudience reais (NAO apenas descomentar) |
| `lib/automation/adapters/ads-sync.ts` | DT-03/F2 | Fix collection raiz + constructor + signature metodo |
| `lib/automation/adapters/types.ts` | DT-06 | Expandir AdsActionResponse.actionTaken |
| `lib/integrations/ads/capi-sync.ts` | DT-04, DT-15/F4 | Migrar env vars → vault + v18→v21 + adicionar brandId + Google Offline |
| `app/api/performance/metrics/route.ts` | DT-12/F4 | Substituir 501 por fetch real + hybrid cache |
| `app/api/performance/integrations/validate/route.ts` | F1 | Substituir 501 por validacao real (GET /me + GET /customers) |
| `lib/firebase/vault.ts` | DT-01, DT-14/F1 | isTokenExpiring per-provider + metadata interfaces + refreshAndSave + getValidToken |
| `types/performance.ts` | DT-08 | Adicionar clicks, impressions, cpa a UnifiedAdsMetrics |
| `lib/performance/engine/anomaly-engine.ts` | DT-09 | Date → Timestamp |
| `lib/utils/encryption.ts` | DT-14 | Adicionar developerToken, appSecret a sensitiveKeys |

### Arquivos NAO Tocados (Preservados)

| Arquivo | Justificativa |
|:--------|:-------------|
| `lib/automation/adapters/instagram.ts` | S32 — fora de escopo |
| `lib/utils/api-response.ts` | Padrao Sigma — zero alteracao |
| `lib/auth/conversation-guard.ts` | Padrao Sigma — zero alteracao |
| `types/social-platform.ts` | Padrao Sigma — zero alteracao |
| `lib/ai/*` | Pipeline de IA intocado |
| `lib/firebase/config.ts` | Configuracao intocada |
| Todos os 224 testes existentes | P-11 — zero regressao |

---

## 9. Proibicoes Tecnicas Adicionais (Alem do PRD)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| **PA-01** | **NUNCA importar `MetaAdsAdapter` sem verificar qual dos dois e (performance vs automation)** | Apos renomear (DT-02), performance = `MetaMetricsAdapter`, automation = `MetaAdsAdapter` |
| **PA-02** | **NUNCA usar buffer fixo em `isTokenExpiring()`** | Meta = 24h, Google = 15min. Buffer fixo causa refresh excessivo (DT-01) |
| **PA-03** | **NUNCA passar access token como primeiro argumento de adapter constructors** | Constructors recebem `brandId` (automation) ou `credentials` (performance). Tokens vem do vault |
| **PA-04** | **NUNCA usar `process.env` para credenciais de Ads em codigo multi-tenant** | Usar MonaraTokenVault. Env vars sao single-tenant (DT-04) |
| **PA-05** | **NUNCA chamar API externa sem `fetchWithRetry()` ou `AbortSignal.timeout()`** | Timeout obrigatorio para evitar requests pendurados em serverless |
| **PA-06** | **NUNCA logar access tokens completos** | Usar `sanitizeForLog()` — mascarar tokens em logs (P-02 do PRD) |
| **PA-07** | **NUNCA fazer fetch real de metricas se cache Firestore < 15min** | Hybrid cache previne rate limit abuse (DT-12) |
| **PA-08** | **NUNCA implementar circuit breaker em S30** | Complexidade desnecessaria para o volume atual. Cache HYBRID e suficiente |

---

## 10. Checklist de Retrocompatibilidade

| # | Item | Verificacao | Responsavel |
|:--|:-----|:-----------|:-----------|
| RC-01 | Nenhuma URL de API muda | Todas as rotas mantem mesmo path | Dandara |
| RC-02 | `mock=true` continua funcionando em ambas as rotas | Parametro preservado como fallback | Dandara |
| RC-03 | Performance Metrics route retorna mesmo shape de response | `createApiSuccess({ metrics: [...] })` — formato identico | Dandara |
| RC-04 | Integration Validate route retorna mesmo shape | `createApiSuccess({ message: '...' })` — formato identico | Dandara |
| RC-05 | AdsActionResponse retrocompativel | Novos valores de `actionTaken` adicionados (nao substituem) | Dandara |
| RC-06 | MonaraToken.metadata continua `Record<string, any>` na runtime | Type overlay nao quebra saves existentes | Dandara |
| RC-07 | `UnifiedAdsMetrics` novos campos aditivos | clicks, impressions, cpa ADICIONADOS (nao substituem) | Dandara |
| RC-08 | Renomear MetaAdsAdapter (perf) nao quebra callers | Atualmente 0 callers externos — rota instancia inline | Dandara |
| RC-09 | `CAPISyncEngine` env var fallback funciona sem vault | Dev local sem vault continua funcionando | Dandara |
| RC-10 | 224+ testes passando em cada Gate | `npm test` em G1, G2, G3, G4 | Dandara |
| RC-11 | tsc=0 em cada Gate | `npx tsc --noEmit` | Dandara |
| RC-12 | Build 103+ rotas | `npm run build` | Dandara |

---

## 11. Sequencia de Execucao Refinada (Athos)

```
[FASE 0 — Pre-requisitos (DT-02, DT-06, DT-08, DT-09, DT-14)]
  ★ Renomear MetaAdsAdapter → MetaMetricsAdapter (performance)
  ★ Renomear GoogleAdsAdapter → GoogleMetricsAdapter (performance)
  ★ Expandir UnifiedAdsMetrics (clicks, impressions, cpa)
  ★ Expandir AdsActionResponse.actionTaken
  ★ Fix AnomalyEngine Date → Timestamp
  ★ Adicionar sensitive keys a encryption.ts

  ── GATE CHECK 0 ── (tsc + build + tests — DEVE ser 224/224) ──

[FASE 1 — Foundation (GATE)]
  S30-FN-03 (MonaraToken enhancement + isTokenExpiring per-provider, DT-01/DT-14)
    → S30-FN-01 (Token Refresh Engine + api-helpers.ts, DT-13)
      → S30-FN-02 (Integration Validation Real)

  ── GATE CHECK 1 ── (tsc + build + tests + validation real) ──

[FASE 2 — Meta Ads (GATE)]
  S30-META-01 (MetaMetricsAdapter fetchMetrics real)
  S30-META-02 (MetaAdsAdapter updateAdCreative real — NAO descomentar, reimplementar)
  S30-META-03 (MetaAdsAdapter syncCustomAudience real)
    → S30-META-04 (AdsLookalikeSync — fix DUPLO: collection + constructor, DT-03)

  ── GATE CHECK 2 ── (tsc + build + tests + Meta funcional) ──

[FASE 3 — Google Ads (GATE)]
  ★ Primeiro: Refatorar GoogleAdsAdapter constructor (3 params, DT-07)
  S30-GOOG-01 (GoogleMetricsAdapter fetchMetrics real)
  S30-GOOG-02 (GoogleAdsAdapter pauseAdEntity real)
  S30-GOOG-03 (GoogleAdsAdapter adjustBudget real)
  S30-GOOG-04 (GoogleAdsAdapter getEntityStatus real)

  ── GATE CHECK 3 ── (tsc + build + tests + Google funcional) ──

[FASE 4 — Performance & Offline (GATE)]
  ★ Primeiro: Refatorar CAPISyncEngine (brandId + vault, DT-04/DT-15)
  S30-PERF-01 (Performance Metrics Real + hybrid cache, DT-12)
  S30-PERF-02 (Google Offline Conversions)

  ── GATE CHECK 4 ── (tsc + build + tests + metricas reais + CAPI multi-tenant) ──

[FASE 5 — STRETCH]
  S30-RL-01 (Rate Limiting + API call counters, DT-16)

[QA FINAL]
  Dandara valida SC-01 a SC-16 + RC-01 a RC-12 + regressao completa
```

**Mudancas vs PRD:**
- **Fase 0 adicionada**: Pre-requisitos de naming/types antes de tocar em qualquer adapter
- **DT-02**: Renomear ANTES de implementar (previne collision durante dev)
- **DT-03**: ads-sync fix inclui CONSTRUCTOR, nao apenas collection
- **DT-04**: CAPI refactor ANTES de Google Offline Conversions (Fase 4)
- **DT-07**: GoogleAdsAdapter constructor refatorado ANTES de implementar actions
- **DT-12**: Cache hybrid na rota de metrics
- **DT-13**: fetchWithRetry como helper compartilhado criado em Fase 1

---

## 12. Checklist de Blocking DTs (Gate para SM)

Leticia (SM) NAO deve iniciar Story Packing sem confirmar que Darllyson compreendeu:

- [ ] **DT-01**: `isTokenExpiring()` DEVE ter buffer per-provider (24h Meta, 15min Google). Buffer fixo causa refresh a cada chamada Google.
- [ ] **DT-02**: EXISTEM dois `MetaAdsAdapter` (e dois `GoogleAdsAdapter`) em modulos diferentes. Renomear os de performance ANTES de implementar. Sem isso, imports cruzados sao inevitaveis.
- [ ] **DT-03**: `ads-sync.ts` tem BUG DUPLO: (1) collection raiz `/leads` e (2) constructor passa `metaToken` como `brandId`. O metodo `syncHotLeadsToMeta` muda de signature `(brandId, metaToken, adAccountId)` para `(brandId)`.
- [ ] **DT-04**: `capi-sync.ts` usa `process.env` (single-tenant). Migrar para `MonaraTokenVault` com `brandId` no constructor. Manter env vars como fallback para dev local.

---

## 13. Veredito Final

### APROVADO COM RESSALVAS

O PRD da Sprint 30 e **o mais ambicioso e estrategico desde o inicio do projeto** — substituir teatro (mocks) por realidade (APIs de Ads reais) e exatamente o que o Conselho de Funil precisa para monetizacao. A decisao D-02 (REST puro) e acertada. O faseamento com gates e solido. As proibicoes P-01 a P-13 sao completas e corretas.

**Ressalvas obrigatorias:**

1. **DT-01 e P0 BLOCKING**: O buffer fixo de 24h em `isTokenExpiring()` causa refresh infinito para Google (tokens de 1h). DEVE ser per-provider.

2. **DT-02 e P0 BLOCKING**: Existem DOIS `MetaAdsAdapter` e DOIS `GoogleAdsAdapter` com nomes identicos em modulos diferentes (performance vs automation). Renomear os de performance para `MetaMetricsAdapter`/`GoogleMetricsAdapter` ANTES de iniciar implementacao. Sem isso, imports cruzados sao inevitaveis em uma sprint que toca TODOS esses arquivos.

3. **DT-03 e P0 BLOCKING**: `ads-sync.ts` tem bug DUPLO — collection raiz E constructor que passa access token como brandId. O PRD so documenta o primeiro. O fix completo muda a signature do metodo.

4. **DT-04 e P0 BLOCKING**: `capi-sync.ts` usa `process.env` para credenciais Meta — single-tenant. Enquanto todo o resto do codebase e multi-tenant via MonaraTokenVault, o CAPI e o ponto cego. S30 deve migrar para vault (com fallback env vars para dev).

5. **Estimativa ajustada +5h**: Justificada por Fase 0 (pre-requisitos), bugs nao documentados, CAPI refactor, e hybrid cache strategy.

6. **PA-01 a PA-08**: 8 proibicoes tecnicas adicionais (alem das 13 do PRD).

7. **DT-05 recomenda AdCredentials como union discriminada** ao inves de interface flat com campos opcionais. Nao-blocking mas significativamente mais type-safe.

8. **DT-12 recomenda hybrid cache de 15min** na rota de performance metrics para evitar rate limit abuse. Sem cache, 10 usuarios refreshing atingem o rate limit da Meta em minutos.

**O PRD pode prosseguir para Story Packing (Leticia) apos confirmacao dos 4 blocking DTs.**

---

## Apendice A: Diagrama de Namespaces Apos Renomeacao (DT-02)

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

## Apendice B: MonaraTokenVault API Apos S30

```typescript
export class MonaraTokenVault {
  // EXISTENTES
  static async saveToken(brandId, tokenData): Promise<void>
  static async getToken(brandId, provider): Promise<MonaraToken | null>
  static isTokenExpiring(token, provider?): boolean  // ← MODIFIED (DT-01: per-provider buffer)

  // NOVOS (S30-FN-03)
  static async refreshAndSave(brandId, provider): Promise<MonaraToken>
  static async getValidToken(brandId, provider): Promise<MonaraToken>  // getToken + auto-refresh
}
```

## Apendice C: Mapa Completo de Callers a Atualizar (DT-03, DT-07)

### Callers de `AdsLookalikeSync.syncHotLeadsToMeta()`:

```
rg "syncHotLeadsToMeta" app/src/
```

Resultado esperado: `automation/engine.ts` ou similar. VERIFICAR antes de implementar — a mudanca de signature de 3 params para 1 param e BREAKING.

### Callers de `new GoogleAdsAdapter(...)`:

```
rg "new GoogleAdsAdapter" app/src/
```

Resultado esperado: `automation/engine.ts` ou similar. VERIFICAR antes de implementar — constructor muda de 2 params para 3.

---

*Architecture Review realizada por Athos (Architect) — NETECMT v2.0*  
*Sprint 30: Ads Integration Foundation (Meta + Google) | 07/02/2026*  
*16 Decision Topics | 4 Blocking | Estimativa revisada: ~23.5-30h (sem STRETCH) / ~26.5-34h (com STRETCH)*  
*Veredito: APROVADO COM RESSALVAS*
