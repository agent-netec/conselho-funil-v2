# Architecture Review: Sprint 31 — Automation Engine & Rules Runtime

**Versao:** 1.0  
**Responsavel:** Athos (Architect)  
**Status:** APROVADO COM RESSALVAS (12 DTs, 3 Blocking → RESOLVIDOS)  
**Data:** 07/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-31-automation-rules-runtime.md`  
**Arch Review Predecessora:** `_netecmt/solutioning/architecture/arch-sprint-30.md`  
**Sprint Predecessora:** Sprint 30 (QA 98/100)  
**Baseline:** 227/227 testes, tsc=0, build=103+ rotas

---

## 1. Sumario Executivo

Apos leitura completa de 11 arquivos-fonte (`types/automation.ts`, `types/personalization.ts`, `api/automation/kill-switch/route.ts`, `api/webhooks/dispatcher/route.ts`, `app/automation/page.tsx`, `lib/firebase/personalization.ts`, `lib/intelligence/personalization/propensity.ts`, `components/layout/sidebar.tsx`, `lib/automation/normalizer.ts`, `lib/intelligence/personalization/maestro.ts`, `lib/auth/brand-guard.ts`), 2 artefatos de referencia (PRD S31, arch-sprint-30) e o `core/contract-map.yaml`, esta Architecture Review **APROVA** a Sprint 31 com **12 Decision Topics** (DT-01 a DT-12), sendo **3 blocking** que devem ser resolvidos antes ou durante a implementacao.

O PRD esta **bem estruturado** — as 4 fases com 4 gates sao corretas, as decisoes D-31.01 (Hybrid API + Hook) e D-31.02 (Firestore Direct) sao acertadas, e o faseamento Automation Page → Kill-Switch → Rules Runtime → DLQ e logicamente solido. A analise de codigo revela, porem, **9 descobertas criticas** que o PRD desconhece ou subestima, incluindo **import path errado para requireBrandAccess**, **property name errada para brand store**, e **EventNormalizer sem suporte a Google (impacta DLQ retry)**.

### Descobertas Criticas (Divergencias vs PRD)

> **DC-01: PRD usa import path ERRADO para `requireBrandAccess`**
>
> O PRD (RF-31.03, RF-31.05, RF-31.09) importa de `@/lib/guards/auth`:
> ```typescript
> import { requireBrandAccess } from '@/lib/guards/auth';
> ```
> **O path real e:** `@/lib/auth/brand-guard`:
> ```typescript
> import { requireBrandAccess } from '@/lib/auth/brand-guard';
> ```
> Evidencia: `rg "requireBrandAccess" app/src/app/api/` → 25+ rotas, TODAS importam de `@/lib/auth/brand-guard`.
>
> **Impacto:** Se o dev seguir o PRD literalmente, `tsc` falhara IMEDIATAMENTE em 3 novas rotas. Erro trivial mas blocking.

> **DC-02: `useBrandStore()` nao tem `activeBrandId` — property chama-se `selectedBrand`**
>
> O PRD (RF-31.02, secao 6.3) assume:
> ```typescript
> brandId = useBrandStore().activeBrandId
> ```
> **A store real** (`lib/stores/brand-store.ts`) nao tem `activeBrandId`. O property correto e:
> ```typescript
> brandId = useBrandStore().selectedBrand?.id
> ```
> `selectedBrand` e um objeto `Brand | null`, nao uma string. O ID deve ser extraido com `?.id`.
>
> **Impacto:** Se o dev seguir o PRD, `tsc` falhara na Automation Page (`activeBrandId` nao existe no tipo `BrandState`).

> **DC-03: DLQ collection name inconsistente: hifens vs underscores**
>
> - TODO existente no dispatcher (L63): `brands/{brandId}/dead-letter-queue` (HIFENS)
> - Contrato em `webhook-security-spec.md`: `brands/{brandId}/dead-letter-queue` (HIFENS)
> - PRD S31: `brands/{brandId}/dead_letter_queue` (UNDERSCORES)
>
> O Firestore suporta ambos, mas inconsistencia entre o contrato existente e o PRD gera confusao e potencial data split.
>
> **Impacto:** Escolher UM padrao e atualizar ambos os lados.

> **DC-04: `EventNormalizer` NAO suporta plataforma `google`**
>
> `normalizer.ts` L22-29: O switch so implementa `instagram` e `meta`. Para qualquer outra plataforma, faz `throw new Error('Plataforma ${platform} não suportada')`.
>
> O PRD (S31-DLQ-02) propoe que o retry chame `EventNormalizer.normalize()` com o payload original, incluindo `webhookType: 'google'`. Isso vai SEMPRE lancar erro para items DLQ de webhooks Google.
>
> **Impacto:** DLQ retry para Google e impossivel ate que EventNormalizer suporte Google.

> **DC-05: Webhook dispatcher extrai `platform` INCORRETAMENTE**
>
> `dispatcher/route.ts` L21: `const platform = req.nextUrl.pathname.split('/').pop() as 'meta' | 'instagram' | 'google'`
>
> O pathname e `/api/webhooks/dispatcher`, entao `.pop()` retorna `'dispatcher'`, NAO o nome da plataforma. O `as` cast forca o tipo mas o valor runtime e `'dispatcher'`.
>
> Isso significa que o campo `webhookType` na DLQ sera `'dispatcher'` ao inves de `'meta'`/`'instagram'`/`'google'`. O retry vai falhar porque `EventNormalizer.normalize({ platform: 'dispatcher', ... })` nao existe.
>
> **Impacto:** O `platform` deve vir do body ou de um query param, nao do path. Pre-existente, mas S31 precisa resolver para a DLQ funcionar.

> **DC-06: `getAudienceScans()` tem `limit(10)` hard-capped**
>
> `personalization.ts` L10: `query(scansRef, orderBy("metadata.createdAt", "desc"), limit(10))`
>
> O `PersonalizationResolver` busca scans e faz match por `scan.id === rule.targetPersonaId`. Se uma rule aponta para um scan mais antigo que os 10 mais recentes, o match NUNCA acontece — o scan nao esta no resultado.
>
> **Impacto:** Resolver pode retornar `fallback: true` incorretamente para rules que apontam para scans antigos.

> **DC-07: `AutomationLog.context.gapDetails` e tipado como `any`**
>
> `types/automation.ts` L41: `gapDetails: any`
>
> O PRD popula gapDetails com `{ reason, severity, platform, type }` no kill-switch. O tipo `any` aceita qualquer coisa, mas nao da type safety. Deveria ser tipado.

> **DC-08: Kill-Switch route NAO tem `requireBrandAccess` atualmente**
>
> `kill-switch/route.ts` — zero import de brand-guard, zero chamada a requireBrandAccess. Qualquer chamada POST sem auth consegue disparar kill-switch para qualquer brandId.
>
> O PRD corretamente propoe adicionar auth, mas o import path esta errado (DC-01).

> **DC-09: `contentVariations` em `DynamicContentRule` e um OBJETO, nao array**
>
> `types/personalization.ts` L42-46:
> ```typescript
> contentVariations: {
>   headline: string;
>   vslId?: string;
>   offerId?: string;
> };
> ```
> E um unico objeto `{ headline, vslId?, offerId? }`. O `ResolveResult.variations` do PRD e tipado como `DynamicContentRule['contentVariations'][]` — um ARRAY de objetos. Isso e correto (cada rule matched contribui um objeto), mas a nomenclatura pode confundir devs que pensam que `contentVariations` ja e plural/array.
>
> **Impacto:** Naming correto mas requer cuidado na implementacao. O flatten `matched.map(r => r.contentVariations)` retorna `Array<{ headline, vslId?, offerId? }>` — correto.

---

## 2. Analise por Decision Topic

### DT-01 — Import Path Errado: requireBrandAccess (P0, BLOCKING)

**Problema (DC-01 detalhado):**

O PRD define 3 novas rotas (`/api/personalization/resolve`, `/api/webhooks/retry`, `/api/automation/kill-switch` update) com import:

```typescript
import { requireBrandAccess } from '@/lib/guards/auth'; // ← NAO EXISTE
```

O path correto, usado em 25+ rotas existentes:

```typescript
import { requireBrandAccess } from '@/lib/auth/brand-guard'; // ← CORRETO
```

**Evidencia:** `rg "from '@/lib/auth/brand-guard'" app/src/app/api/` → 25+ matches. Zero matches para `@/lib/guards/auth`.

**Acao:** Corrigir em RF-31.03, RF-31.05, RF-31.09 ANTES de implementar.

| Arquivo Novo | Import Correto |
|:------------|:--------------|
| `api/personalization/resolve/route.ts` | `from '@/lib/auth/brand-guard'` |
| `api/webhooks/retry/route.ts` | `from '@/lib/auth/brand-guard'` |
| `api/automation/kill-switch/route.ts` | `from '@/lib/auth/brand-guard'` |

**Severidade:** P0 | **Blocking:** SIM (tsc falhara em 3 rotas com path errado)

---

### DT-02 — Brand Store: `selectedBrand?.id`, nao `activeBrandId` (P0, BLOCKING)

**Problema (DC-02 detalhado):**

O PRD (secao 6.3) instrui:
```typescript
brandId = useBrandStore().activeBrandId
```

A store real (`lib/stores/brand-store.ts`) tem:

```typescript
interface BrandState {
  selectedBrand: Brand | null; // ← Brand object, nao string
  brands: Brand[];
  isLoading: boolean;
  setSelectedBrand: (brand: Brand | null) => void;
  // ...
}
```

**Nao existe** `activeBrandId` no tipo `BrandState`. O acesso correto e:

```typescript
const { selectedBrand } = useBrandStore();
const brandId = selectedBrand?.id;
```

**Impacto em S31:**

| Item PRD | Onde usa brandId | Fix |
|:---------|:----------------|:----|
| S31-AUTO-03 | `automation/page.tsx` useEffect | `useBrandStore().selectedBrand?.id` |
| S31-KS-04 | `sidebar.tsx` badge query | `useBrandStore().selectedBrand?.id` |
| S31-DLQ-03 | DLQ tab na Automation Page | Mesmo page — ja corrigido pelo fix acima |

**Padrao existente no codebase:** Verificar como outras pages acessam brandId. O pattern mais comum e:

```typescript
const { selectedBrand } = useBrandStore();
if (!selectedBrand) return <SelectBrandMessage />;
const brandId = selectedBrand.id;
```

**Severidade:** P0 | **Blocking:** SIM (tsc falhara na Automation Page — `activeBrandId` nao existe)

---

### DT-03 — Webhook Dispatcher: `platform` extraido INCORRETAMENTE (P0, BLOCKING)

**Problema (DC-05 detalhado):**

```typescript
// dispatcher/route.ts L21 — BUG PRE-EXISTENTE
const platform = req.nextUrl.pathname.split('/').pop() as 'meta' | 'instagram' | 'google';
// pathname = "/api/webhooks/dispatcher" → .pop() = "dispatcher"
```

O valor runtime de `platform` e `'dispatcher'`, NAO `'meta'`/`'instagram'`/`'google'`. O `as` cast mascara o bug em compilacao.

**Impacto na S31:**

1. **S31-DLQ-01:** O campo `webhookType` sera persistido como `'dispatcher'` (invalido) ao inves do nome real da plataforma.
2. **S31-DLQ-02:** O retry chama `EventNormalizer.normalize({ platform: dlqItem.webhookType, ... })` → com `'dispatcher'` vai lançar erro.
3. **DLQ inteira e inutilizavel** se o `platform` estiver errado.

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | Extrair platform do body ou de um header customizado (`X-Webhook-Platform`) | Seguro, body ja contem indicacao de plataforma |
| B | Mudar a URL para `/api/webhooks/{platform}` com rota dinamica | Mudanca maior, impacta consumers |
| C | Extrair do query param `?platform=meta` | Simples, nao requer mudanca na rota |

**Implementacao recomendada (Opcao A):**

O payload ja contem pistas de plataforma (ex: Meta envia `object: 'page'`, Instagram envia `object: 'instagram'`). Alternativa mais segura: usar o query param `brandId` ja existente e adicionar `platform` como query param:

```typescript
const platform = req.nextUrl.searchParams.get('platform') as 'meta' | 'instagram' | 'google';
if (!platform || !['meta', 'instagram', 'google'].includes(platform)) {
  return createApiError(400, 'Valid platform query param is required (meta|instagram|google)');
}
```

Isso requer atualizar os webhooks registrados nas plataformas para incluir `?platform=meta&brandId=X`. Como os webhooks sao configurados via MonaraTokenVault (manual), o impacto e minimo.

**Severidade:** P0 | **Blocking:** SIM (DLQ inteira e inutilizavel sem platform correto)

---

### DT-04 — DLQ Collection Name: Padronizar para `dead_letter_queue` (P1, NON-BLOCKING)

**Problema (DC-03 detalhado):**

| Fonte | Collection Name | Notacao |
|:------|:---------------|:--------|
| TODO em `dispatcher/route.ts` L63 | `dead-letter-queue` | Hifens |
| `webhook-security-spec.md` (contrato) | `dead-letter-queue` | Hifens |
| PRD S31 (Apendice A) | `dead_letter_queue` | Underscores |

**Recomendacao:** Usar `dead_letter_queue` (underscores) conforme o PRD.

**Justificativas:**
1. **Consistencia com outras collections:** `automation_rules`, `automation_logs`, `personalization_rules`, `audience_scans` — TODAS usam underscores.
2. **Firestore best practice:** Underscores sao mais comuns em collection IDs no ecossistema Firestore.
3. **Dev experience:** Hifens em nomes de collection exigem bracket notation em alguns cenarios.

**Acao:** Atualizar `webhook-security-spec.md` para `dead_letter_queue` e registrar no `contract-map.yaml`.

**Severidade:** P1 | **Blocking:** Nao (mas padronizar antes de implementar evita data split)

---

### DT-05 — EventNormalizer: Nao Suporta Google → DLQ Retry Parcialmente Quebrado (P1, NON-BLOCKING)

**Problema (DC-04 detalhado):**

```typescript
// normalizer.ts L22-29 — ATUAL
static normalize(event: RawWebhookEvent): { leadId: string; interaction: LeadContext['lastInteraction'] } {
  switch (event.platform) {
    case 'instagram': return this.normalizeInstagram(payload);
    case 'meta':      return this.normalizeMeta(payload);
    default:          throw new Error(`Plataforma ${platform} não suportada`);
  }
}
```

O tipo `DeadLetterItem.webhookType` inclui `'google'`, mas o `EventNormalizer` nao implementa `normalizeGoogle()`. O retry de DLQ items com `webhookType: 'google'` vai SEMPRE falhar.

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | Adicionar stub `normalizeGoogle()` que lanca erro descritivo | Explicita o gap, DLQ item vai para `abandoned` |
| B | Implementar `normalizeGoogle()` completo | Fora de escopo S31 — nao sabemos o payload |
| C | Ignorar | Items Google ficam em `pending` eternamente |

**Implementacao recomendada (Opcao A):**

Adicionar ao switch:
```typescript
case 'google':
  throw new Error('Google webhook normalization not yet implemented. DLQ retry unavailable for Google.');
```

Isso garante que o retry marca o item como `abandoned` com erro descritivo, ao inves de um erro generico.

**Impacto real:** Webhooks Google nao passam pelo dispatcher atualmente (Google nao usa webhooks push para Ads). Portanto, items Google na DLQ sao improvaveis em S31. Risco baixo.

**Severidade:** P1 | **Blocking:** Nao (Google webhooks nao existem no fluxo atual)

---

### DT-06 — getAudienceScans: limit(10) Pode Causar False Negatives no Resolver (P1, NON-BLOCKING)

**Problema (DC-06 detalhado):**

```typescript
// personalization.ts L10 — ATUAL
const q = query(scansRef, orderBy("metadata.createdAt", "desc"), limit(10));
```

O `PersonalizationResolver.resolve()` faz:
1. Busca rules ativas → cada rule tem `targetPersonaId` (ref a um AudienceScan)
2. Busca scans via `getAudienceScans(brandId)` → retorna MAX 10 scans recentes
3. Match: `rule.targetPersonaId` in scans onde `scan.propensity.segment === lead.segment`

**Edge case:** Se uma brand tem 15 scans e uma rule aponta para o scan #12 (mais antigo), esse scan nao esta nos 10 retornados. O match nao acontece. O Resolver retorna `fallback: true` incorretamente.

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | No Resolver, buscar scans DIRETAMENTE por IDs necessarios (`getDoc` por `targetPersonaId`), nao via `getAudienceScans()` | Eficiente, sem N+1 se agrupado |
| B | Aumentar limit para 50 em `getAudienceScans` | Hack, nao resolve com 51+ scans |
| C | Manter como esta | False negatives para rules apontando para scans antigos |

**Implementacao recomendada (Opcao A):**

```typescript
// resolver.ts — Approach otimizado
static async resolve(brandId: string, leadId: string): Promise<ResolveResult> {
  const lead = await getLeadState(brandId, leadId);
  const activeRules = (await getPersonalizationRules(brandId)).filter(r => r.isActive);

  // Buscar APENAS os scans referenciados pelas rules (sem limit artificial)
  const targetScanIds = [...new Set(activeRules.map(r => r.targetPersonaId))];
  const scans = await Promise.all(
    targetScanIds.map(id => getDoc(doc(db, 'brands', brandId, 'audience_scans', id)))
  );

  const scanSegmentMap = new Map<string, string>();
  for (const snap of scans) {
    if (snap.exists()) {
      const data = snap.data() as AudienceScan;
      scanSegmentMap.set(snap.id, data.propensity.segment);
    }
  }

  // Match como no PRD
  const matched = activeRules.filter(rule => {
    const scanSegment = scanSegmentMap.get(rule.targetPersonaId);
    return scanSegment === lead.segment;
  });

  return {
    segment: lead.segment,
    variations: matched.map(r => r.contentVariations),
    fallback: matched.length === 0
  };
}
```

**Vantagens sobre o approach do PRD:**
1. **Zero false negatives** — busca scans por ID direto, sem limit
2. **Menos dados transferidos** — busca APENAS os scans necessarios (nao todos)
3. **Performance previsivel** — O(rules) queries, nao O(all_scans)

**Desvantagem:** Se houver 20 rules ativas com 20 targetPersonaIds distintos, sao 20 getDoc calls. Mitigacao: `Promise.all` paraleliza. Em media, brands terao 3-5 rules — 3-5 queries paralelas e trivial.

**Severidade:** P1 | **Blocking:** Nao (marcas novas com poucos scans nao serao afetadas)

---

### DT-07 — AutomationLog.gapDetails: Tipar ao inves de `any` (P2, NON-BLOCKING)

**Problema (DC-07):**

```typescript
// types/automation.ts L41 — ATUAL
context: {
  funnelId: string;
  gapDetails: any;  // ← any e perigoso
  entityId: string;
};
```

O PRD popula `gapDetails` com `{ reason, severity, platform, type }` no kill-switch. O `any` aceita qualquer coisa mas nao ajuda o dev.

**Recomendacao:** Tipar minimamente:

```typescript
context: {
  funnelId: string;
  gapDetails: {
    reason: string;
    severity: string;
    platform?: string;
    type?: string;
    [key: string]: unknown;  // Extensivel para outros producers
  };
  entityId: string;
};
```

**Nota:** O `[key: string]: unknown` mantem compatibilidade com producers existentes que possam enviar campos diferentes (ex: `AutomationEngine.evaluateAutopsy`). Preferivel a `any` pois forca type checking nos consumers.

**Severidade:** P2 | **Blocking:** Nao

---

### DT-08 — Slack Notification: Validacao de URL + Timeout Correto (P1, NON-BLOCKING)

**Analise do RF-31.04 (Slack Helper):**

O PRD propoe `AbortSignal.timeout(5000)` — 5 segundos. Correto para Slack webhooks (resposta tipica em <1s).

**Pontos adicionais nao cobertos pelo PRD:**

1. **Validacao de URL:** O `SLACK_WEBHOOK_URL` deve iniciar com `https://hooks.slack.com/` ou `https://hooks.slack-gov.com/`. Aceitar qualquer URL permite SSRF (Server-Side Request Forgery).

```typescript
export function isValidSlackWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'hooks.slack.com' || parsed.hostname === 'hooks.slack-gov.com')
    );
  } catch {
    return false;
  }
}
```

2. **MonaraTokenVault como alternativa a env var:** O PRD menciona `process.env.SLACK_WEBHOOK_URL || MonaraTokenVault`. Recomendo priorizar env var para simplicidade (Slack webhook URL nao e per-brand, e per-workspace). Se futuro multi-team, migrar para vault.

3. **Response body do Slack:** Slack retorna `"ok"` como texto plano em sucesso. O helper nao precisa parsear JSON.

**Severidade:** P1 | **Blocking:** Nao (funciona sem validacao, mas SSRF e risco de seguranca)

---

### DT-09 — Notification Badge: Sidebar e Icon-Only (72px), Badge Precisa de Layout Especial (P2, NON-BLOCKING)

**Problema:**

O PRD (S31-KS-04) propoe adicionar um badge de notificacao no Sidebar no item "Automation". Porem, o Sidebar desktop tem apenas **72px de largura** (icon-only mode, sem labels). A `sidebar.tsx` L139 confirma: `'w-[72px] hidden md:flex'`.

**Implicacoes para o badge:**

| Modo | Largura | Items | Badge Strategy |
|:-----|:--------|:------|:---------------|
| Desktop | 72px | Icone-only, tooltip on hover | Badge dot (bolinha) sobreposto ao icone, sem numero |
| Mobile | 280px | Icone + label | Badge pill com numero (ex: "3") |

O PRD assume um badge com count numerico. Em 72px isso nao cabe esteticamente. O pattern correto em sidebars icon-only e um **dot indicator** (bolinha vermelha sem numero):

```tsx
{unreadCount > 0 && (
  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
)}
```

No mobile (280px), pode exibir o count completo.

**Recomendacao adicional:** A Automation Page NAO esta no Sidebar como item individual. O Sidebar usa `NAV_GROUPS` de `lib/constants.ts`. Verificar se "Automation" esta mapeado como nav item e qual e seu `href`. Se nao estiver, o badge nao tem onde ser colocado.

**Severidade:** P2 | **Blocking:** Nao (funcionalidade de badge e enhancement)

---

### DT-10 — Resolver Logic: Matching Correto mas com Edge Case de Segment Stale (P1, NON-BLOCKING)

**Analise do matching engine proposto:**

```
rule.targetPersonaId → scan.id → scan.propensity.segment === lead.segment
```

**Validacao:** A logica e CORRETA. O fluxo e:

1. Lead tem `segment: 'hot'` (vindo do PropensityEngine)
2. Rule tem `targetPersonaId: 'scan_abc'`
3. Scan `scan_abc` tem `propensity.segment: 'hot'`
4. Como `scan.propensity.segment === lead.segment` → match → retorna `contentVariations`

**Edge case: Segment stale**

O `PropensityEngine.calculate()` e chamado pelo `PersonalizationMaestro.processInteraction()` — mas e FIRE-AND-FORGET (`fireAndForgetPersist`). Se o Resolver e chamado ANTES do persist completar, o `lead.segment` no Firestore pode estar desatualizado.

| Cenario | lead.segment em Firestore | lead.segment real | Match |
|:--------|:-------------------------|:-----------------|:------|
| Normal | `hot` | `hot` | CORRETO |
| Race condition | `cold` (stale) | `hot` (calculado mas nao persistido) | INCORRETO — retorna fallback |

**Mitigacao:** Aceitar como limitacao documentada. O persist e rapido (~100ms) e a window de race e pequena. Uma solucao perfeita requereria calcular propensity inline no Resolver, o que adiciona complexidade desnecessaria.

**Recomendacao:** Documentar na API response que o `segment` reflete o ULTIMO estado persistido. Se o lead acabou de interagir, pode haver delay de segundos.

**Severidade:** P1 | **Blocking:** Nao (race window e sub-segundo)

---

### DT-11 — DLQ Retry: Idempotencia e Processamento Duplicado (P1, NON-BLOCKING)

**Analise do RF-31.09 (Webhook Retry API):**

O retry chama `PersonalizationMaestro.processInteraction()`. Se o webhook original JA foi processado com sucesso (erro ocorreu APOS o processamento, na resposta), o retry RE-PROCESSA a mesma interacao.

**Impacto de re-processamento:**

```typescript
// maestro.ts — processInteraction
static async processInteraction(brandId: string, leadId: string, interaction: ...) {
  const context = await this.getLeadContext(brandId, leadId);
  if (!context) {
    // Cria novo lead
    await setDoc(leadRef, newContext);
  } else {
    // Atualiza awareness + interaction
    await updateDoc(leadRef, updatedFields);
  }
}
```

O Maestro usa `updateDoc` (nao `addDoc`) para leads existentes. Portanto, re-processar a MESMA interacao:
- NAO cria leads duplicados (setDoc/updateDoc e idempotente por leadId)
- PODE atualizar `awarenessLevel` indevidamente (se o lead ja avancou alem)
- PODE sobrescrever `lastInteraction` com dados antigos

**Mitigacao recomendada:** Adicionar check no retry:

```typescript
// Antes de re-processar, verificar timestamp do DLQ item vs lastInteraction do lead
const lead = await PersonalizationMaestro.getLeadContext(brandId, leadId);
if (lead && lead.lastInteraction?.timestamp?.toMillis() > dlqItem.timestamp.toMillis()) {
  // Lead ja tem interacao mais recente — skip re-processamento
  await updateDoc(dlqRef, { status: 'resolved', resolvedAt: Timestamp.now() });
  return createApiSuccess({ message: 'DLQ item resolved (lead already updated)', skipped: true });
}
```

**Severidade:** P1 | **Blocking:** Nao (re-processamento causa dados stale, nao data loss)

---

### DT-12 — DeadLetterItem.webhookType: Expandir Union (P2, NON-BLOCKING)

**Problema:**

O PRD define:
```typescript
webhookType: 'meta' | 'instagram' | 'google';
```

Porem, o `EventNormalizer.RawWebhookEvent.platform` tambem inclui `'stripe'`:
```typescript
platform: 'meta' | 'instagram' | 'google' | 'stripe';
```

Se no futuro webhooks Stripe passarem pelo dispatcher, a DLQ nao conseguira armazenar `'stripe'`.

**Recomendacao:** Alinhar com `RawWebhookEvent`:

```typescript
webhookType: 'meta' | 'instagram' | 'google' | 'stripe';
```

**Severidade:** P2 | **Blocking:** Nao

---

## 3. Tabela Consolidada de Decision Topics

| DT | Titulo | Severidade | Blocking? | Fase | Item PRD | Acao |
|:---|:-------|:-----------|:----------|:-----|:---------|:-----|
| **DT-01** | Import path errado: requireBrandAccess | **P0** | ~~SIM~~ **RESOLVIDO** | F1-F4 | RF-31.03/05/09 | PRD corrigido para `@/lib/auth/brand-guard` |
| **DT-02** | Brand store: selectedBrand?.id, nao activeBrandId | **P0** | ~~SIM~~ **RESOLVIDO** | F1 | RF-31.02 | PRD corrigido para `selectedBrand?.id` |
| **DT-03** | Dispatcher: platform extraido incorretamente | **P0** | ~~SIM~~ **RESOLVIDO** | F4 | S31-DLQ-01/02 | Codigo fixado: platform via query param |
| DT-04 | DLQ collection name: underscores (nao hifens) | P1 | ~~Nao~~ **RESOLVIDO** | F4 | S31-DLQ-01 | TODO + contrato atualizados para `dead_letter_queue` |
| DT-05 | EventNormalizer: sem suporte Google | P1 | ~~Nao~~ **RESOLVIDO** | F4 | S31-DLQ-02 | Stub Google adicionado em `normalizer.ts` |
| DT-06 | getAudienceScans limit(10): false negatives | P1 | Nao | F3 | S31-RT-02 | Buscar scans por ID direto no Resolver |
| DT-07 | gapDetails: any → tipo estruturado | P2 | ~~Nao~~ **RESOLVIDO** | F2 | S31-KS-01 | Union type `CriticalGap \| KillSwitchGap` em automation.ts |
| DT-08 | Slack: validacao URL (anti-SSRF) | P1 | Nao | F2 | S31-KS-02 | Validar hostname === hooks.slack.com |
| DT-09 | Sidebar badge: 72px icon-only | P2 | Nao | F2 | S31-KS-04 | Dot indicator (sem numero) no desktop |
| DT-10 | Resolver: segment stale (race condition) | P1 | Nao | F3 | S31-RT-02 | Documentar como limitacao conhecida |
| DT-11 | DLQ retry: idempotencia | P1 | Nao | F4 | S31-DLQ-02 | Check timestamp antes de re-processar |
| DT-12 | DeadLetterItem.webhookType: adicionar 'stripe' | P2 | Nao | F4 | S31-DLQ-01 | Alinhar com RawWebhookEvent.platform |

---

## 4. Contract-Map Updates

O `contract-map.yaml` DEVE ser atualizado para registrar os novos modulos e rotas da S31:

### 4.1 Lane `automation` — Expandir paths

```yaml
automation:
  paths:
    - "app/src/lib/automation/engine.ts"
    - "app/src/lib/automation/budget-optimizer.ts"
    - "app/src/lib/automation/adapters/"
    - "app/src/lib/automation/normalizer.ts"
    # === S31 — Novos paths ===
    - "app/src/lib/firebase/automation.ts"          # S31-AUTO-01/02 (CRUD)
    - "app/src/app/automation/**"                    # S31-AUTO-03 (Page)
    - "app/src/app/api/automation/**"                # Kill-Switch (existente + S31-KS-01)
    - "app/src/lib/notifications/slack.ts"           # S31-KS-02 (Slack helper)
    - "app/src/types/automation.ts"                  # DeadLetterItem, InAppNotification
```

### 4.2 Lane `operations_infrastructure` — Expandir para DLQ

```yaml
operations_infrastructure:
  paths:
    - "app/src/app/api/webhooks/**"                  # Existente (dispatcher + S31 retry)
    - "app/src/lib/security/monara/**"
    # === S31 — DLQ ===
    # A rota /api/webhooks/retry vive aqui (mesma lane que dispatcher)
  contract: "_netecmt/contracts/webhook-security-spec.md"
```

### 4.3 Lane `personalization_engine` — Expandir para Resolver

```yaml
personalization_engine:
  paths:
    - "app/src/lib/intelligence/personalization/**"  # Existente (inclui novo resolver.ts)
    # === S31 — Rules Runtime ===
    # resolver.ts vive aqui (mesma lane que propensity.ts, engine.ts)
  contract: "_netecmt/contracts/personalization-engine-spec.md"
```

### 4.4 Nova rota `/api/personalization/resolve` — Ownership

A rota `app/src/app/api/personalization/resolve/route.ts` NAO esta coberta por nenhuma lane existente. O `intelligence_wing` cobre `app/src/app/api/intelligence/**`, mas a nova rota e `/api/personalization/**`.

**Opcoes:**
| Opcao | Lane | Justificativa |
|:------|:-----|:-------------|
| **A (Recomendada)** | Criar section na `personalization_engine` lane | Coerente — engine + API da mesma feature |
| B | Colocar em `intelligence_wing` | Impreciso — personalization != intelligence |

**Acao:** Adicionar path a `personalization_engine`:

```yaml
personalization_engine:
  paths:
    - "app/src/lib/intelligence/personalization/**"
    - "app/src/app/api/personalization/**"    # S31-RT-01 — Nova API
```

---

## 5. Riscos Arquiteturais

| # | Risco | Probabilidade | Impacto | Mitigacao |
|:--|:------|:-------------|:--------|:----------|
| RA-01 | **DLQ inteira quebrada se DT-03 (platform) nao for resolvido** | Alta (bug pre-existente) | Critico — zero retry funcional | **BLOCKING** — Fix obrigatorio na Fase 4 antes de DLQ persist |
| RA-02 | **Resolver retorna false negatives por limit(10) em scans** | Media (brands com >10 scans) | Medio — personalizacao nao funciona para rules antigas | DT-06: buscar scans por ID, nao por getAudienceScans |
| RA-03 | **3 queries paralelas no mount da Automation Page** | Baixa (Firestore e rapido) | Baixo — page lenta no primeiro load | Promise.all ja mitiga. Adicionar loading skeleton |
| RA-04 | **Slack webhook URL nao configurada** | Alta (nova config) | Baixo — notificacao nao enviada | Log warning + continuar. Firestore e source of truth |
| RA-05 | **Race condition: segment stale no Resolver** | Baixa (window sub-segundo) | Baixo — fallback retornado incorretamente | Documentar. Re-fetch na proxima chamada resolve |
| RA-06 | **Notification count query sem index Firestore** | Media | Medio — query lenta | Criar index composto `(isRead, createdAt)` em notifications collection |
| RA-07 | **Kill-Switch sem rate limit pode ser abusado** | Baixa | Medio — flood de logs/notifications | STRETCH S31-RL-01 mitiga. Sem STRETCH: cooldown check manual |

---

## 6. Validacao das Proibicoes do PRD

| # | Proibicao | Status | Validacao |
|:--|:----------|:-------|:----------|
| P-01 | Zero npm novas | APROVADA | Nenhuma dependencia nova. Slack via fetch(), DLQ via Firestore, hook via React built-in |
| P-02 | Zero Cloud Functions | APROVADA | Retry e manual via API Route. Zero Functions |
| P-03 | Zero firebase-admin | APROVADA | Todas as operacoes via firebase client SDK |
| P-04 | Zero Push/WhatsApp | APROVADA | Apenas Slack + In-App |
| P-06 | NAO ativar middleware morto | APROVADA | Rules Runtime usa API dedicada, zero middleware |
| P-07 | REST puro para Slack | APROVADA | fetch() direto, zero SDK |
| P-08 | Timestamp (nao Date) | APROVADA | Todos os schemas usam Timestamp |
| P-09 | SEMPRE brands/{brandId}/... | APROVADA | Todas as collections propostas sao scoped |
| P-10 | Fire-and-forget para Slack/notifications | APROVADA | .catch(console.error) em ambos |
| P-11 | Zero regressao (227 testes) | APROVADA | 15 testes novos ADICIONAM, nao substituem |
| P-12 | NUNCA hardcodar webhook URLs | APROVADA | process.env.SLACK_WEBHOOK_URL |
| P-13 | Payload DLQ max 10KB | APROVADA | `rawBody.substring(0, 10240)` |

**Todas as proibicoes sao respeitadas pelo PRD.** Zero violacoes.

---

## 7. Proibicoes Tecnicas Adicionais (Alem do PRD)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| **PA-01** | **NUNCA importar requireBrandAccess de `@/lib/guards/auth`** | Path correto: `@/lib/auth/brand-guard` (DT-01) |
| **PA-02** | **NUNCA acessar `useBrandStore().activeBrandId`** | Property correta: `useBrandStore().selectedBrand?.id` (DT-02) |
| **PA-03** | **NUNCA confiar em `pathname.split('/').pop()` para determinar platform** | Retorna 'dispatcher', nao o nome da plataforma (DT-03) |
| **PA-04** | **NUNCA aceitar Slack webhook URLs que nao iniciem com `https://hooks.slack.com/`** | Anti-SSRF (DT-08) |
| **PA-05** | **NUNCA usar `getAudienceScans()` no Resolver para buscar scans por matching** | Limit(10) causa false negatives. Usar getDoc por ID (DT-06) |
| **PA-06** | **NUNCA re-processar DLQ item sem verificar timestamp vs lead.lastInteraction** | Previne regressao de awareness level (DT-11) |

---

## 8. Estimativa Revisada (Athos)

### Correcoes de Premissas

| # | Premissa do PRD | Realidade | Impacto na Estimativa |
|:--|:----------------|:----------|:---------------------|
| **CP-01** | Import `requireBrandAccess` de `@/lib/guards/auth` | Path real: `@/lib/auth/brand-guard`. Trivial mas precisa ser corrigido em 3 arquivos | +0min (correcao durante implementacao) |
| **CP-02** | `useBrandStore().activeBrandId` | Correto: `selectedBrand?.id`. Precisa ajustar + adicionar null check | +10min (ajuste trivial + UI empty state) |
| **CP-03** | `platform` no dispatcher vem do path | `platform` retorna 'dispatcher'. Fix necessario para DLQ funcionar | +30min (adicionar query param extraction + validacao) |
| **CP-04** | Resolver usa `getAudienceScans()` | Limit(10) causa false negatives. Melhor buscar por ID | +20min (approach diferente, mais queries paralelas) |
| **CP-05** | DLQ retry e idempotente | Maestro pode regredir awareness. Adicionar timestamp check | +15min |

### Fase 1: Automation Page Real (~3-4h) → ~3.5-4.5h

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S31-AUTO-01 | M (~1.5h) | M (~1.5h) | = | Direto, CRUD padrao |
| S31-AUTO-02 | S (~1h) | S (~1h) | = | Direto |
| S31-AUTO-03 | M (~1.5h) | M+ (~2h) | +30min | CP-02: fix brandId access + null check + empty state + loading |
| **Subtotal F1** | **~3-4h** | **~3.5-4.5h** | **+30min** | |

### Fase 2: Kill-Switch Persistence (~3-4h) → ~3.5-4.5h

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S31-KS-01 | M (~1.5h) | M (~1.5h) | = | Direto, fix import path trivial |
| S31-KS-02 | S (~1h) | S+ (~1.25h) | +15min | DT-08: Slack URL validation |
| S31-KS-03 | S (~1h) | S (~1h) | = | Direto |
| S31-KS-04 | XS (~30min) | S (~45min) | +15min | DT-09: icon-only sidebar requer layout especial |
| **Subtotal F2** | **~3-4h** | **~3.5-4.5h** | **+30min** | |

### Fase 3: Rules Runtime (~3-4h) → ~3.5-4.5h

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S31-RT-01 | M (~2h) | M (~2h) | = | Direto, fix import path trivial |
| S31-RT-02 | M (~1.5h) | M+ (~1.75h) | +15min | DT-06: buscar scans por ID ao inves de getAudienceScans |
| S31-RT-03 | XS (~30min) | XS (~30min) | = | Direto |
| **Subtotal F3** | **~3-4h** | **~3.5-4.5h** | **+15min** | |

### Fase 4: Webhook DLQ (~2-3h) → ~3-4h

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| S31-DLQ-01 | S (~1h) | M (~1.5h) | +30min | DT-03 (fix platform extraction) + DT-04 (padronizar collection name) |
| S31-DLQ-02 | M (~1.5h) | M+ (~1.75h) | +15min | DT-11 (timestamp check pre-retry) + DT-05 (stub Google) |
| S31-DLQ-03 | XS (~30min) | XS (~30min) | = | Direto |
| **Subtotal F4** | **~2-3h** | **~3-4h** | **+45min** | |

### Total Consolidado

| Fase | PRD | Athos | Delta |
|:-----|:----|:------|:------|
| Fase 1 (Automation Page) | 3-4h | 3.5-4.5h | +30min |
| Fase 2 (Kill-Switch) | 3-4h | 3.5-4.5h | +30min |
| Fase 3 (Rules Runtime) | 3-4h | 3.5-4.5h | +15min |
| Fase 4 (DLQ) | 2-3h | 3-4h | +45min |
| QA Final | 1h | 1h | = |
| **TOTAL sem STRETCH** | **~12-16h** | **~14-18h** | **+2h** |
| STRETCH (Rate Limiting) | 3-4h | 3-4h | = |
| **TOTAL com STRETCH** | **~15-20h** | **~17-22h** | **+2h** |

**Incremento de ~2h justificado por:**
- DT-03: +30min (fix platform extraction no dispatcher — prerequisito para DLQ)
- DT-06: +20min (approach de busca por ID no Resolver)
- DT-08: +15min (Slack URL validation)
- DT-09: +15min (sidebar badge layout icon-only)
- DT-11: +15min (timestamp check no retry)
- CP-02: +10min (brandId fix + null check)
- CP-03: +5min (correcao em codigo de DLQ)

**A estimativa original do PRD (~12-16h) e REALISTA** com o delta de +2h. O total de ~14-18h e seguro para uma sprint de execucao sem integracoes externas novas.

---

## 9. Checklist de Retrocompatibilidade

| # | Item | Verificacao | Responsavel |
|:--|:-----|:-----------|:-----------|
| RC-01 | Kill-Switch route mantém mesmo path (`POST /api/automation/kill-switch`) | Nenhuma URL muda — apenas adiciona persist interno | Dandara |
| RC-02 | Dispatcher route mantém mesmo path (`POST /api/webhooks/dispatcher`) | Apenas adiciona DLQ persist no catch. Response identica | Dandara |
| RC-03 | `AutomationControlCenter` component props nao mudam | `rules`, `logs`, callbacks — mesma interface | Dandara |
| RC-04 | `getPersonalizationRules()` signature intocada | Continua `(brandId: string) => Promise<DynamicContentRule[]>` | Dandara |
| RC-05 | `getAudienceScans()` signature intocada | Resolver usa getDoc direto, nao altera funcao existente | Dandara |
| RC-06 | 227+ testes passando em cada Gate | `npm test` em G1, G2, G3, G4 | Dandara |
| RC-07 | tsc=0 em cada Gate | `npx tsc --noEmit` | Dandara |
| RC-08 | Build 103+ rotas | `npm run build` | Dandara |
| RC-09 | Tipos existentes `AutomationRule`, `AutomationLog` nao tem breaking changes | Apenas ADICIONA DeadLetterItem e InAppNotification | Dandara |
| RC-10 | Sidebar visual identico (exceto badge novo) | Badge e aditivo, zero mudanca no layout existente | Dandara |

---

## 10. Sequencia de Execucao Refinada (Athos)

```
[FASE 1 — Automation Page Real (GATE)]
  S31-AUTO-01 (Automation CRUD Firestore, M) — fundacao
  S31-AUTO-02 (Automation Logs Firestore, S) — depende de AUTO-01
  S31-AUTO-03 (Automation Page Conectada, M+) — depende de AUTO-01 + AUTO-02
    ★ FIX: Usar selectedBrand?.id (DT-02), nao activeBrandId
    ★ ADICIONAR: null check + empty state + loading skeleton

  ── GATE CHECK 1 ── (Page real + tsc=0 + build + tests) ──

[FASE 2 — Kill-Switch Persistence (GATE)]
  S31-KS-01 (Firestore Persist, M)
    ★ FIX: Import de @/lib/auth/brand-guard (DT-01)
  S31-KS-02 (Slack Notification, S+)
    ★ ADICIONAR: isValidSlackWebhookUrl() (DT-08)
  S31-KS-03 (In-App Notification, S) — depende de AUTO-01
  S31-KS-04 (Notification Badge, S)
    ★ ADAPTAR: dot indicator para desktop 72px (DT-09)

  ── GATE CHECK 2 ── (Kill-Switch completo + tsc=0 + build + tests) ──

[FASE 3 — Rules Runtime (GATE)]
  S31-RT-02 (Matching Engine, M+) — core
    ★ ALTERAR: Buscar scans por getDoc(targetPersonaId) (DT-06)
    ★ NAO usar getAudienceScans() com limit(10) (PA-05)
  S31-RT-01 (API /personalization/resolve, M)
    ★ FIX: Import de @/lib/auth/brand-guard (DT-01)
  S31-RT-03 (Hook usePersonalizedContent, XS)

  ── GATE CHECK 3 ── (Runtime funcional + tsc=0 + build + tests) ──

[FASE 4 — Webhook DLQ (GATE)]
  ★ PRE-REQUISITO: Fix platform extraction no dispatcher (DT-03)
    → Adicionar query param ?platform= com validacao
  S31-DLQ-01 (DLQ Persist, M) — depende de fix platform
    ★ Usar collection name dead_letter_queue (DT-04)
  S31-DLQ-02 (API /webhooks/retry, M+)
    ★ FIX: Import de @/lib/auth/brand-guard (DT-01)
    ★ ADICIONAR: Timestamp check pre-retry (DT-11)
    ★ ADICIONAR: Stub Google no EventNormalizer (DT-05)
  S31-DLQ-03 (DLQ UI na Automation Page, XS)

  ── GATE CHECK 4 ── (DLQ completa + tsc=0 + build + tests) ──

[FASE 5 — STRETCH]
  S31-RL-01 (Rate Limiting, M) — somente apos Gate 4 aprovado

[QA FINAL]
  Dandara valida CS-31.01 a CS-31.19 + RC-01 a RC-10 + regressao completa
```

**Mudancas vs PRD:**
- **DT-01**: Import path corrigido em TODAS as novas rotas
- **DT-02**: Brand store access corrigido na Automation Page
- **DT-03**: Fix platform extraction ANTES de DLQ persist (pre-requisito F4)
- **DT-06**: Resolver busca scans por ID direto (sem limit(10))
- **DT-08**: Slack URL validation adicionada
- **DT-09**: Badge adaptado para sidebar icon-only
- **DT-11**: Timestamp check no retry

---

## 11. Checklist de Blocking DTs (Gate para SM)

**TODOS OS 3 BLOCKING DTs FORAM RESOLVIDOS (07/02/2026):**

- [x] **DT-01**: ~~`requireBrandAccess` importa de `@/lib/guards/auth`~~ → **CORRIGIDO** no PRD para `@/lib/auth/brand-guard` em 3 locais (RF-31.03, RF-31.05, RF-31.09).

- [x] **DT-02**: ~~`useBrandStore().activeBrandId`~~ → **CORRIGIDO** no PRD para `useBrandStore().selectedBrand?.id` em 2 locais (secao 6.3 e R-01).

- [x] **DT-03**: ~~Dispatcher extrai `platform` do URL path (`.pop()` retorna `'dispatcher'`)~~ → **CORRIGIDO** no codigo (`dispatcher/route.ts`). Platform agora e extraido de query param `?platform=` com validacao contra whitelist `['meta', 'instagram', 'google']`. Webhook URLs devem incluir `?platform=meta&brandId=X`.

---

## 12. Veredito Final

### APROVADO COM RESSALVAS

O PRD da Sprint 31 e **estrategicamente correto** — ligar motores que estao em modo teatro (mocks) e EXATAMENTE o proximo passo apos S30 ter trazido Ads reais. As 4 fases sao bem sequenciadas, as proibicoes P-01 a P-13 sao completas e corretas, e o escopo e controlado (zero integracoes externas novas, apenas Firestore + fetch para Slack).

**Ressalvas obrigatorias:**

| ID | Ressalva | Resolver em | Work adicional |
|:---|:---------|:-----------|:--------------|
| ~~**R1**~~ | ~~DT-01 — Import path errado para requireBrandAccess em 3 rotas~~ | **RESOLVIDO** — PRD corrigido | 0min |
| ~~**R2**~~ | ~~DT-02 — Brand store property errada (activeBrandId → selectedBrand?.id)~~ | **RESOLVIDO** — PRD corrigido | 0min |
| ~~**R3**~~ | ~~DT-03 — Dispatcher platform extraction quebrada (retorna 'dispatcher')~~ | **RESOLVIDO** — Codigo fixado | 0min |
| ~~R4~~ | ~~DT-04 — Padronizar collection name para dead_letter_queue~~ | **RESOLVIDO** — TODO + contrato atualizados | 0min |
| R5 | DT-06 — Resolver buscar scans por ID (evitar limit(10)) | NESTA sprint (F3) | ~20min |
| R6 | DT-08 — Slack URL validation anti-SSRF | NESTA sprint (F2) | ~15min |
| R7 | DT-11 — Timestamp check no DLQ retry | NESTA sprint (F4) | ~15min |
| ~~R8~~ | ~~DT-05 — Stub Google no EventNormalizer~~ | **RESOLVIDO** — Stub adicionado em normalizer.ts | 0min |
| ~~R9~~ | ~~DT-07 — Tipar gapDetails (remover any)~~ | **RESOLVIDO** — Union type `CriticalGap \| KillSwitchGap` | 0min |
| R10 | DT-09 — Badge adaptado para sidebar 72px | NESTA sprint (F2) | ~15min |

**Nenhuma ressalva gera work > 2h.** A R3 (fix dispatcher) e a mais complexa (~30min) mas e essencial para a DLQ funcionar.

**Estimativa revisada:** ~14-18h (sem STRETCH) / ~17-22h (com STRETCH). Delta de +2h vs PRD.

**Os 3 blocking DTs (R1, R2, R3) foram RESOLVIDOS. O PRD pode prosseguir IMEDIATAMENTE para Story Packing (Leticia).**

---

## Apendice A: Mapa de Imports Corretos para Novas Rotas

```typescript
// === CORRETO (usar em TODAS as novas rotas) ===
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { Timestamp } from 'firebase/firestore';

// === ERRADO (NAO usar — path do PRD esta incorreto) ===
// import { requireBrandAccess } from '@/lib/guards/auth';  // ← NESTE PATH NAO EXISTE
```

## Apendice B: Brand Store — Pattern Correto

```typescript
// === Em pages client-side (automation/page.tsx, etc.) ===
'use client';
import { useBrandStore } from '@/lib/stores/brand-store';

export default function AutomationPage() {
  const { selectedBrand } = useBrandStore();

  // Null check obrigatorio
  if (!selectedBrand) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500">
        Selecione uma marca para continuar.
      </div>
    );
  }

  const brandId = selectedBrand.id;
  // ... carregar dados com brandId
}
```

## Apendice C: Fix para Dispatcher Platform Extraction (DT-03)

```typescript
// dispatcher/route.ts — FIX PROPOSTO

export async function POST(req: NextRequest) {
  // ANTES (ERRADO):
  // const platform = req.nextUrl.pathname.split('/').pop() as 'meta' | 'instagram' | 'google';

  // DEPOIS (CORRETO):
  const platformParam = req.nextUrl.searchParams.get('platform');
  const validPlatforms = ['meta', 'instagram', 'google'] as const;

  if (!platformParam || !validPlatforms.includes(platformParam as any)) {
    return createApiError(400, 'Valid platform query param required (meta|instagram|google)');
  }

  const platform = platformParam as 'meta' | 'instagram' | 'google';
  const brandId = req.nextUrl.searchParams.get('brandId');

  // ... resto do handler identico
}
```

**Impacto:** Webhooks registrados nas plataformas precisam incluir `?platform=meta&brandId=X` na URL. Como esses sao configurados manualmente via MonaraTokenVault setup, o impacto e controlado.

## Apendice D: Resolver Otimizado (DT-06)

```typescript
// resolver.ts — Approach sem limit(10)

import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getPersonalizationRules } from '@/lib/firebase/personalization';
import type { AudienceScan, DynamicContentRule, LeadState } from '@/types/personalization';

export interface ResolveResult {
  segment: string;
  variations: DynamicContentRule['contentVariations'][];
  fallback: boolean;
}

export class PersonalizationResolver {
  static async resolve(brandId: string, leadId: string): Promise<ResolveResult> {
    // 1. Buscar estado do lead
    const leadRef = doc(db, 'brands', brandId, 'leads', leadId);
    const leadSnap = await getDoc(leadRef);

    if (!leadSnap.exists()) {
      return { segment: 'unknown', variations: [], fallback: true };
    }

    const lead = leadSnap.data() as LeadState;
    const leadSegment = lead.segment || 'cold';

    // 2. Buscar rules ativas
    const allRules = await getPersonalizationRules(brandId);
    const activeRules = allRules.filter(r => r.isActive);

    if (activeRules.length === 0) {
      return { segment: leadSegment, variations: [], fallback: true };
    }

    // 3. Buscar APENAS os scans referenciados (sem limit artificial)
    const targetScanIds = [...new Set(activeRules.map(r => r.targetPersonaId))];
    const scanSnaps = await Promise.all(
      targetScanIds.map(id =>
        getDoc(doc(db, 'brands', brandId, 'audience_scans', id))
      )
    );

    // 4. Build map: scanId → segment
    const scanSegmentMap = new Map<string, string>();
    for (const snap of scanSnaps) {
      if (snap.exists()) {
        const data = snap.data() as AudienceScan;
        scanSegmentMap.set(snap.id, data.propensity.segment);
      }
    }

    // 5. Match rules cujo targetPersonaId aponta para scan do MESMO segment do lead
    const matched = activeRules.filter(rule => {
      const scanSegment = scanSegmentMap.get(rule.targetPersonaId);
      return scanSegment === leadSegment;
    });

    return {
      segment: leadSegment,
      variations: matched.map(r => r.contentVariations),
      fallback: matched.length === 0
    };
  }
}
```

---

*Architecture Review realizada por Athos (Architect) — NETECMT v2.0*  
*Sprint 31: Automation Engine & Rules Runtime | 07/02/2026*  
*12 Decision Topics | 3 Blocking + 3 Non-Blocking RESOLVIDOS (6/12) | Estimativa revisada: ~14-18h (sem STRETCH) / ~17-22h (com STRETCH)*  
*Veredito: APROVADO COM RESSALVAS (6 DTs resolvidos antecipadamente — pronto para Story Packing)*
