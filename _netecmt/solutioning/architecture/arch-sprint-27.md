# 🏛️ Architecture Review: Sprint 27 — Hybrid: Backlog Cleanup + Attribution Revival

**Versão:** 1.0  
**Responsável:** Athos (Architect)  
**Status:** ✅ APROVADO com Ressalvas  
**Data:** 06/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-27-hybrid-cleanup-attribution.md`  
**Sprint Predecessora:** Sprint 26 (QA 97/100) — `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/qa-report.md`

---

## 1. Sumário Executivo

Após análise profunda do codebase pós-Sprint 26, inventário de consumers reais, validação de schemas e verificação de contratos, esta Architecture Review **APROVA** a execução da Sprint 27 com **4 ressalvas importantes** e **6 correções nas premissas** do PRD que alteram estimativas de esforço e abordagem técnica.

### Descoberta Crítica

> **O PRD assume que todos os 4 módulos attribution core têm 0 consumers. Isso é INCORRETO.**
>
> - `engine.ts` já tem **1 consumer ativo**: `use-attribution-data.ts` → `attribution/page.tsx`. O motor de atribuição já é invocado pela UI e funciona — apenas falta dados reais de spend.
> - `overlap.ts` já tem **1 consumer**: `budget-optimizer.ts` (importa `ChannelOverlapAnalyzer`).
> - Apenas `bridge.ts` e `aggregator.ts` são verdadeiramente dead code (0 consumers).
>
> Isso **reduz o escopo real** de ST-10 (Wiring) significativamente: 2 módulos já estão wired, não 4.

### Descoberta Secundária: Schema Impedance Mismatch

> O `aggregator.ts` espera dados no formato `PerformanceMetricDoc` (campo `platform`, sub-objeto `metrics`), mas o Firestore real armazena dados no formato `PerformanceMetric` (campo `source`, sub-objeto `data`). **Ativar o aggregator sem adapter vai causar runtime errors.** Isso impacta diretamente ST-09 (spend data) e ST-10 (wiring).

---

## 2. Contract Safety Check

### 2.1 Lanes Impactadas

| Lane (contract-map.yaml) | Contrato | Status | Risco |
|:--------------------------|:---------|:-------|:------|
| `intelligence_wing` | `intelligence-storage.md` (v2.0, Active) | ⚠️ ATENÇÃO | Médio — módulos attribution, config, hooks tocados |
| `performance_war_room` | `performance-spec.md` (v1.0, DRAFT) | ✅ SEGURO | Baixo — apenas leitura de `PerformanceMetricDoc` |
| `personalization_engine` | `personalization-engine-spec.md` | ⚠️ PATH ERRADO | Baixo — apenas fix de path no contract-map (ST-05) |
| Sem lane (MCP adapters) | N/A | ✅ SEGURO | Mínimo — apenas tipagem de `@ts-ignore` |

### 2.2 Veredito de Contratos

**NENHUM contrato ativo será quebrado.** Justificativas:

1. **`intelligence-storage.md` (v2.0)**: O contrato não menciona attribution explicitamente. Os módulos attribution estão sob o glob `app/src/lib/intelligence/**` mas não possuem cláusula contratual específica. Todas as alterações são **adições** (novos consumers, novas rotas) e **completions** de stubs existentes.
2. **`types/attribution.ts`**: NÃO está listado explicitamente em nenhuma lane do `contract-map.yaml` — é um tipo compartilhado. Alterações são ADIÇÕES ao stub `CampaignAttributionStats`, não remoções.
3. **Sprint 25 types intocados**: `prediction.ts`, `creative-ads.ts`, `text-analysis.ts` — NENHUM é impactado.
4. **`types/social-inbox.ts`**: NÃO impactado — proibição P4 do PRD.

### 2.3 Anomalia a Corrigir (ST-05)

> O `contract-map.yaml` mapeia `personalization_engine` para `app/src/lib/operations/personalization/**`, mas o código real está em `app/src/lib/intelligence/personalization/**`. ST-05 corrige isso. **Mudança cirúrgica**: apenas o value do path, sem alterar a estrutura YAML.

**Verificação**: O path errado no contract-map significa que o módulo `maestro.ts` (4 consumers ativos) está na prática sob `intelligence_wing`, não sob `personalization_engine`. A correção alinha documentação com realidade, sem impacto funcional.

---

## 3. Análise de Código Morto vs Código Ativo

### 3.1 Reclassificação dos Módulos Attribution (CORREÇÃO DO PRD)

| Módulo | Linhas | Consumers | PRD diz | Realidade | Status Real |
|:-------|:-------|:----------|:--------|:----------|:------------|
| `engine.ts` | 179 | `use-attribution-data.ts` → `page.tsx` | Dead (0) | **ATIVO (1 chain)** | ✅ Já wired |
| `bridge.ts` | 187 | 0 | Dead (0) | Dead (0) | 🔴 Precisa consumer |
| `aggregator.ts` | 139 | 0 | Dead (0) | Dead (0) | 🔴 Precisa consumer |
| `overlap.ts` | 127 | `budget-optimizer.ts` | Dead (0) | **SEMI-ATIVO (1)** | ⚠️ Consumer sem consumers |
| **Total** | **632** | **2 de 4 já wired** | **0 de 4** | — | — |

### 3.2 Consumer Layer (Corrigido)

| Módulo | Consumers | Status |
|:-------|:----------|:-------|
| `use-attribution-data.ts` (125L) | `attribution/page.tsx` (230L) | **ATIVO** — hook funcional, importa `AttributionEngine` |
| `budget-optimizer.ts` (84L) | **0 consumers** | **DEAD CODE** — importa `ChannelOverlapAnalyzer` mas ninguém importa budget-optimizer |
| `attribution/page.tsx` (230L) | Rota Next.js `/intelligence/attribution` | **ATIVO** — renderiza mas sem dados de spend |

### 3.3 Cadeia de Imports Validada (Pós Sprint 26)

```
✅ engine.ts
   ├── ../../../types/journey (JourneyEvent, JourneyTransaction) → EXISTE
   └── ../../../types/attribution (AttributionResult, AttributionPoint) → EXISTE
   
✅ bridge.ts
   ├── ../config (db) → EXISTE (criado Sprint 26)
   ├── firebase/firestore (collection, doc, etc.) → EXISTE
   ├── ../../../types/attribution (AttributionBridge, AttributionPoint, AttributionResult) → EXISTE
   ├── ../../../types/journey (JourneyEvent, JourneyTransaction) → EXISTE
   └── ./engine (AttributionEngine) → EXISTE
   
✅ aggregator.ts
   ├── ../config (db) → EXISTE (criado Sprint 26)
   ├── firebase/firestore → EXISTE
   ├── ./bridge (AttributionBridgeService) → EXISTE
   ├── ../../../types/performance (PerformanceMetricDoc, AdPlatform, UnifiedAdsMetrics) → EXISTE
   └── ../../../types/cross-channel (CrossChannelMetricDoc) → EXISTE
   
✅ overlap.ts
   ├── ../config (db) → EXISTE (criado Sprint 26)
   ├── firebase/firestore → EXISTE
   ├── ../../../types/attribution (AttributionBridge) → EXISTE
   └── ../../../types/cross-channel (ChannelOverlapDoc) → EXISTE
```

**Conclusão**: Todos os 4 módulos **compilam sem erros TypeScript** pós-Sprint 26. A questão não é de compilação, é de **runtime** (dados reais e consumers).

### 3.4 Schema Impedance Mismatch (DESCOBERTA CRÍTICA)

O `aggregator.ts` lê de `performance_metrics` e espera o schema `PerformanceMetricDoc`:

```typescript
// aggregator.ts espera:
interface PerformanceMetricDoc {
  platform: AdPlatform;          // 'meta' | 'google' | ...
  metrics: UnifiedAdsMetrics & { clicks: number; impressions: number };
  // ...
}
```

Mas o Firestore real (conforme `PerformanceMetric` contratual) usa:

```typescript
// Firestore armazena:
interface PerformanceMetric {
  source: 'meta' | 'google' | ...;  // 'source' NÃO 'platform'
  data: UnifiedAdsMetrics;           // 'data' NÃO 'metrics', SEM clicks/impressions
  // ...
}
```

| Campo | PerformanceMetricDoc (aggregator espera) | PerformanceMetric (Firestore real) | Match? |
|:------|:----------------------------------------|:----------------------------------|:-------|
| Identificador de plataforma | `platform` | `source` | ❌ |
| Sub-objeto de métricas | `metrics` | `data` | ❌ |
| `clicks`, `impressions` | Presente (extensão) | Ausente | ❌ |
| `name`, `level`, `externalId` | Presente | Ausente | ❌ |

**Impacto**: Ativar `aggregator.ts` com dados reais vai causar `undefined` em `m.platform`, `m.metrics.spend`, etc. **ST-09 e ST-10 precisam de um adapter layer.**

---

## 4. Correções nas Premissas das Stories

### ⚠️ Correção 1: engine.ts NÃO é dead code

**Premissa PRD:** "4 módulos core com 0 consumers"  
**Realidade:** `engine.ts` já é importado por `use-attribution-data.ts` (linha 7):
```typescript
import { AttributionEngine } from '../intelligence/attribution/engine';
```
O hook chama `AttributionEngine.linear()`, `.uShape()`, `.timeDecay()` diretamente. O engine está **funcional e ativo**.

**Impacto em ST-10:** Engine.ts **não precisa de novo consumer** — já tem. Reduz escopo de wiring para 3 módulos (bridge, aggregator, overlap-effective).

### ⚠️ Correção 2: overlap.ts tem 1 consumer (budget-optimizer.ts)

**Premissa PRD:** "overlap.ts — 0 consumers"  
**Realidade:** `budget-optimizer.ts` (linha 4):
```typescript
import { ChannelOverlapAnalyzer } from '../intelligence/attribution/overlap';
```
Porém, `budget-optimizer.ts` em si tem **0 consumers** — ninguém o importa. Então o overlap está "semi-wired": tem um consumer direto, mas a cadeia não chega à UI.

**Impacto em ST-10:** Para overlap, basta ativar `budget-optimizer.ts` expondo-o via API route ou conectando ao hook, em vez de criar consumer do zero.

### ⚠️ Correção 3: CampaignAttributionStats já tem campos corretos

**Premissa PRD (ST-07):** "Remover @stub, adicionar campos reais"  
**Realidade:** O stub criado na Sprint 26 **já contém todos os campos que o hook e a page acessam**:

| Campo no Stub | Usado pelo Hook? | Usado pela Page? |
|:--------------|:-----------------|:-----------------|
| `campaignName: string` | ✅ (linha 88) | ✅ (linha 34, 200) |
| `spend: number` | ✅ (linha 89) | ❌ (não exibido na table) |
| `conversions: Record<AttributionModel, number>` | ✅ (linha 90-96) | ✅ (linha 36-38, 202-204) |
| `roi: Record<AttributionModel, number>` | ✅ (linha 91) | ❌ (não exibido) |
| `variation: number` | ✅ (linha 107) | ✅ (linha 45, 206-208) |

**Impacto em ST-07:** O esforço é **S→XS** — apenas remover o `@stub` tag e o `@todo`. Os campos já estão corretos e funcionais.

### ⚠️ Correção 4: config.ts já funciona — expansão é opcional

**Premissa PRD (ST-08):** "Expandir de re-export stub para config real com coleções"  
**Realidade:** O `config.ts` atual exporta `{ db } from '@/lib/firebase/config'` e é o **único import** que `bridge.ts`, `aggregator.ts` e `overlap.ts` usam dele. Eles fazem `import { db } from '../config'` e usam `db` diretamente com Firestore operations.

**Impacto em ST-08:** A expansão com constantes de coleção é **nice-to-have**, não bloqueante. O módulo já funciona para todos os 3 consumers.

### ⚠️ Correção 5: Schema mismatch bloqueia ativação direta do aggregator

**Premissa PRD (ST-09):** "Conectar spend data via CrossChannelAggregator"  
**Realidade:** O aggregator espera `PerformanceMetricDoc` (stub criado na Sprint 26), mas Firestore real usa `PerformanceMetric` com schema diferente (campos `source`/`data` vs `platform`/`metrics`).

**Impacto em ST-09:** Necessário um **adapter/mapper** entre `PerformanceMetric` → `PerformanceMetricDoc`, ou alternativa: o hook busca spend diretamente da collection real sem passar pelo aggregator. Esforço sobe de **L para L+**.

### ⚠️ Correção 6: Jest config não tem `testPathIgnorePatterns`

**Premissa PRD (ST-04):** "Adicionar testPathIgnorePatterns"  
**Realidade confirmada:** O `jest.config.js` atual não tem nenhum ignore pattern. A colisão Jest/Playwright é real — Playwright spec em `tests/smoke/api-smoke.spec.ts` é coletado pelo Jest runner.

**Impacto:** Nenhum — a story está correta. Fix direto.

---

## 5. Decisões Técnicas

### DT-01: Estratégia de Ativação de Consumers

| Módulo | Estratégia Recomendada | Justificativa |
|:-------|:----------------------|:-------------|
| `engine.ts` | **Nenhuma ação** — já ativo via hook | Consumer chain funcional |
| `bridge.ts` | **Criar rota API** `/api/intelligence/attribution/sync` | Consumer isolado, não injeta em pipeline existente. Reduz risco R4 do PRD |
| `aggregator.ts` | **Hook direto + adapter** — hook busca spend de `performance_metrics` com mapping | Evita schema mismatch runtime. Adapta para schema real |
| `overlap.ts` | **Expor `budget-optimizer.ts` via rota API** ou integrar no hook | Budget-optimizer já consome overlap; falta cadeia até UI |

### DT-02: Spend Data — Abordagem Recomendada

**Problema:** `use-attribution-data.ts` seta `spend: 0` (linha 89). O aggregator tem a lógica mas schema incompatível.

**Opção A (RECOMENDADA — Adapter no Hook):**
```typescript
// No use-attribution-data.ts — buscar spend diretamente
const metricsRef = collection(db, 'brands', activeBrand.id, 'performance_metrics');
// Mapear PerformanceMetric.data.spend para CampaignAttributionStats.spend
// Agrupar por campaign usando UTM ↔ campaign name mapping
```

**Opção B (Aggregator com Adapter Layer):**
```typescript
// Novo: lib/intelligence/attribution/metric-adapter.ts
function adaptMetric(pm: PerformanceMetric): PerformanceMetricDoc {
  return {
    ...pm,
    platform: pm.source as AdPlatform,
    metrics: { ...pm.data, clicks: 0, impressions: 0 },
    name: '', level: 'campaign', externalId: ''
  };
}
```

**Decisão:** Opção A para MVP. O aggregator pode ser ativado com adapter na Sprint 28 quando houver dados reais multi-plataforma. Para Sprint 27, o hook pode buscar spend diretamente sem intermediário.

**Nota sobre P1 (proibição de alterar lógica):** A Opção A altera o **hook** (`use-attribution-data.ts`), NÃO os módulos core. P1 protege `engine.ts`, `bridge.ts`, `aggregator.ts`, `overlap.ts` — o hook não é coberto por P1.

### DT-03: Rota API para Attribution (Consumer de bridge + aggregator)

```typescript
// Nova rota: app/src/app/api/intelligence/attribution/stats/route.ts
// Consumer oficial que conecta bridge + aggregator + engine
// GET /api/intelligence/attribution/stats?brandId=X&days=30
// Response: { stats: CampaignAttributionStats[], meta: { processed: number } }
```

Esta rota serve como **consumer server-side** que pode ser usada pelo hook (substituindo o Firestore direto) ou por integrações futuras. Dá consumer a bridge e aggregator simultaneamente.

### DT-04: @ts-ignore nos MCP Adapters — Estratégia de Tipagem

Os 5 `@ts-ignore` seguem o mesmo padrão:

```typescript
// @ts-ignore
if (typeof window !== 'undefined' && (window as any).mcp) {
```

**Fix recomendado:** Criar declaração global de tipo para `window.mcp`:

```typescript
// Em app/src/types/mcp-global.d.ts (novo)
declare global {
  interface Window {
    mcp?: {
      callTool: (server: string, tool: string, args: Record<string, unknown>) => Promise<unknown>;
    };
  }
}
export {};
```

Com isso, os 5 `@ts-ignore` podem ser substituídos por `@ts-expect-error` com justificativa, ou removidos completamente se o tipo global resolver. **Nenhuma lógica de chamada é alterada** (P8 respeitada).

### DT-05: .env.test para Testes com Env Vars

```bash
# app/.env.test — valores mock para ambiente de teste
NEXT_PUBLIC_FIREBASE_API_KEY=test-api-key-mock
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=test.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=test-project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=test.appspot.com
GOOGLE_AI_API_KEY=test-gemini-key-mock
PINECONE_API_KEY=test-pinecone-key-mock
```

**Alternativa (mais robusta):** `describe.skipIf(!process.env.X)` para testes que precisam de serviços reais. Recomendo **ambos**: `.env.test` para mocks + `skipIf` para testes que precisam do serviço real.

### DT-06: Módulos Referenciados em Contratos Ativos

| Módulo | Contrato Ativo | Referenciado? | Ação |
|:-------|:---------------|:-------------|:-----|
| `lib/intelligence/attribution/*` | `intelligence-storage.md` (v2.0) | Via glob `lib/intelligence/**` | ⚠️ Ativar consumers — contrato não proíbe |
| `lib/hooks/use-attribution-data.ts` | `intelligence-storage.md` (v2.0) | Via glob `lib/hooks/use-intelligence*.ts` | ⚠️ NÃO — glob é `use-intelligence*`, não `use-attribution*` |
| `types/attribution.ts` | Nenhuma lane específica | Tipo compartilhado | ✅ Seguro — apenas completar stub |
| `types/performance.ts` | `performance-spec.md` (DRAFT) | Sim — schemas | ✅ Apenas leitura — sem alteração |
| `types/cross-channel.ts` | Nenhuma lane | Tipo compartilhado | ✅ Sem alteração necessária |
| `lib/mcp/adapters/*` | Nenhuma lane | Sem contrato | ✅ Tipagem segura |
| `jest.config.js` | Nenhuma lane | Config de tooling | ✅ Seguro |

**Nota importante:** `use-attribution-data.ts` NÃO cai sob o glob `use-intelligence*.ts` da lane `intelligence_wing`. O hook de attribution é **tecnicamente fora de qualquer lane**. Isso é um gap no contract-map — registrar como item de backlog para Sprint 28.

---

## 6. Mapa de Risco de Regressão

### 6.1 Tier 1 — Risco: BAIXO ✅ (Frente 1: Backlog)

| Story | Ação | Risco | Mitigação |
|:------|:-----|:------|:----------|
| ST-01 | Criar `.env.test` com mocks | Muito Baixo | Não altera código, apenas config |
| ST-03 | Ajustar expectativas de testes stub | Muito Baixo | Testes isolados |
| ST-04 | `testPathIgnorePatterns` no Jest | Muito Baixo | Config de tooling |
| ST-05 | Fix path em `contract-map.yaml` | Muito Baixo | Mudança textual, sem impacto runtime |

### 6.2 Tier 2 — Risco: MÉDIO ⚠️ (Frente 1: Mocks & Types)

| Story | Ação | Risco | Mitigação |
|:------|:-----|:------|:----------|
| ST-02 | Atualizar mocks em 5 test files | **Médio** | Mocks incorretos podem expor bugs reais — documentar findings, NÃO corrigir lógica |
| ST-06 | Tipar MCP adapters, remover `@ts-ignore` | **Médio** | Criar tipo global `Window.mcp` + testar cada adapter. Se tipo impossível, manter `@ts-expect-error` com justificativa |

### 6.3 Tier 3 — Risco: MÉDIO-ALTO ⚠️ (Frente 2: Attribution)

| Story | Ação | Risco | Mitigação |
|:------|:-----|:------|:----------|
| ST-07 | Completar `CampaignAttributionStats` | Baixo | Campos já corretos, apenas remover `@stub` |
| ST-08 | Expandir `config.ts` | Baixo | Re-export já funciona; expansão é aditiva |
| ST-09 | Conectar spend data | **ALTO** | Schema mismatch com aggregator. Usar Opção A (hook direto). Testar com dados mock primeiro |
| ST-10 | Wire consumers (bridge, aggregator) | **MÉDIO-ALTO** | bridge precisa rota nova; aggregator tem schema mismatch. Fazer bridge primeiro (isolado), aggregator depois |
| ST-11 | Validar UI attribution page | Baixo | Page já renderiza; verificar com dados reais |
| ST-12 | Resolver stubs attribution | Baixo | Dependência de ST-07 e ST-08 (já resolvidos) |

**ST-09 e ST-10 são as stories mais arriscadas da sprint.** O schema mismatch do aggregator é o principal obstáculo técnico.

### 6.4 Diagrama de Dependências Impactadas

```
┌──────────────────────────────────────────────────────────────────────┐
│                    SPRINT 27 — IMPACT MAP                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌── FRENTE 1: BACKLOG ──────────────────────────────────────────┐   │
│  │                                                                │   │
│  │  [CONFIG] jest.config.js ── testPathIgnorePatterns (ST-04)     │   │
│  │  [CONFIG] .env.test ── mock env vars (ST-01)                   │   │
│  │  [TESTS] 5 test files ── atualizar mocks (ST-02)              │   │
│  │  [TESTS] 2 test files ── ajustar expectations stubs (ST-03)   │   │
│  │  [YAML] contract-map.yaml ── fix path (ST-05)                 │   │
│  │  [TYPES] mcp-global.d.ts ── novo tipo Window.mcp (ST-06)      │   │
│  │  [CODE] 5 MCP adapters ── remover @ts-ignore (ST-06)          │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌── FRENTE 2: ATTRIBUTION REVIVAL ──────────────────────────────┐   │
│  │                                                                │   │
│  │  [ATIVO] engine.ts ───→ use-attribution-data.ts ───→ page.tsx │   │
│  │          (179L)          (125L)                      (230L)    │   │
│  │          JÁ WIRED ✅     spend: 0 ← PRECISA FIX     RENDERIZA │   │
│  │                                                                │   │
│  │  [DEAD] bridge.ts ──→ ? (PRECISA CONSUMER)                    │   │
│  │         (187L)        → Criar /api/attribution/sync            │   │
│  │                                                                │   │
│  │  [DEAD] aggregator.ts ──→ ? (PRECISA CONSUMER)                │   │
│  │         (139L)           → ⚠️ SCHEMA MISMATCH com Firestore   │   │
│  │                           → Precisa adapter ou hook direto     │   │
│  │                                                                │   │
│  │  [SEMI] overlap.ts ──→ budget-optimizer.ts (0 consumers)      │   │
│  │         (127L)         → Expor via API route                   │   │
│  │                                                                │   │
│  │  [TYPES] attribution.ts ── remover @stub (ST-07)              │   │
│  │  [CONFIG] config.ts ── expandir (ST-08, opcional)              │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
│  ┌── CONTRATOS TOCADOS ──────────────────────────────────────────┐   │
│  │                                                                │   │
│  │  intelligence-storage.md (v2.0, Active) ── APENAS ADIÇÕES      │   │
│  │  performance-spec.md (v1.0, DRAFT) ── LEITURA APENAS           │   │
│  │  contract-map.yaml ── FIX PATH personalization_engine          │   │
│  │  types/attribution.ts ── COMPLETION de stub (sem remoções)     │   │
│  │                                                                │   │
│  └────────────────────────────────────────────────────────────────┘   │
│                                                                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 7. Proibições Recomendadas (Allowed Context)

### 7.1 Proibições do PRD — Avaliação

| # | Proibição | Avaliação |
|:--|:----------|:----------|
| P1 | NUNCA alterar lógica de negócio dos módulos attribution | ✅ CORRETA — manter. **Esclarecimento**: `use-attribution-data.ts` (hook) NÃO é módulo core; pode ser alterado para conectar spend |
| P2 | NUNCA remover exports de `types/attribution.ts` | ✅ CORRETA |
| P3 | NUNCA alterar interfaces Sprint 25 | ✅ CORRETA |
| P4 | NUNCA alterar `types/social-inbox.ts` | ✅ CORRETA |
| P5 | NUNCA remover stubs non-attribution | ✅ CORRETA |
| P6 | NUNCA usar `any` em novos tipos | ✅ CORRETA |
| P7 | NUNCA alterar formato do `contract-map.yaml` | ✅ CORRETA |
| P8 | NUNCA alterar lógica de chamada dos MCP adapters | ✅ CORRETA |

### 7.2 Proibições ADICIONAIS Recomendadas

| # | Nova Proibição | Justificativa |
|:--|:---------------|:-------------|
| P9 | **NUNCA alterar o schema de `PerformanceMetric` ou `PerformanceMetricDoc`** em `types/performance.ts` | Ambos são contratuais — `PerformanceMetric` é o schema real, `PerformanceMetricDoc` é o legado. Não fundir nem renomear |
| P10 | **NUNCA alterar `types/cross-channel.ts`** | Schema usado por `aggregator.ts` e `overlap.ts` — intocável |
| P11 | **NUNCA injetar attribution consumers em pipelines existentes** (chat, ingest, social) | Risco R4 do PRD. Criar rotas/consumers isolados |
| P12 | **Para ST-09: se dados reais não existirem em Firestore, usar fallback visual** | Mostrar "Sem dados de spend" na UI em vez de 0 hardcoded. Evita confusão do usuário |
| P13 | **NUNCA alterar `types/journey.ts`** | Usado por engine.ts e bridge.ts ativamente — contratual implícito |
| P14 | **Ao criar nova rota API, seguir padrão envelope existente** | `{ success: true, data: {...} }` ou `{ error: string, code: string }` |

---

## 8. Sequência de Execução Revisada

### 8.1 Frente 1: Backlog (sem alteração do PRD)

```
ST-04 (Jest config) → ST-01 (env vars) → ST-02 (mocks) → ST-03 (stubs test)
  → ST-05 (contract-map) → ST-06 (ts-ignore)
```

✅ Sequência do PRD está correta.

### 8.2 Frente 2: Attribution Revival (REVISADA)

```
ST-07 (tipos — minimal) → ST-08 (config — minimal) → ST-12 (stubs — minimal)
  → ST-09 (spend data — Opção A: hook direto)
  → ST-10 (wiring — bridge rota + overlap via budget-optimizer)
  → ST-11 (UI validation)
```

**Mudanças vs PRD:**
- ST-07: Esforço reduzido de **S → XS** (apenas remover @stub)
- ST-08: Esforço reduzido de **S → XS** (já funcional, adicionar constantes de coleção)
- ST-09: Abordagem alterada — **hook direto** em vez de via aggregator (schema mismatch)
- ST-10: Escopo reduzido — engine.ts e overlap.ts já têm consumers. Wiring real necessário apenas para bridge e aggregator

### 8.3 Estimativa Revisada

| Fase | Stories | PRD Estimativa | Estimativa Revisada | Delta |
|:-----|:--------|:--------------|:-------------------|:------|
| Epic 1: Test Infrastructure | ST-01 a ST-04 | 2-3h | 2-3h | = |
| Epic 2: Contract & Hygiene | ST-05, ST-06 | 1-2h | 1.5-2h | ≈ |
| Epic 3: Attribution Activation | ST-07 a ST-11 | 4-6h | **3-5h** | -1h |
| Epic 4: Attribution Stubs | ST-12 | 30min | **15min** | -15min |
| QA Final | — | 1h | 1h | = |
| **Total** | **12 stories** | **8.5-12.5h** | **7.5-11h** | **-1.5h** |

**Razão da redução:** engine.ts e overlap.ts já wired + CampaignAttributionStats já correto + config.ts já funcional.

---

## 9. Checklist de Pré-Execução (para Darllyson)

### Antes de começar qualquer fix:

- [ ] **Ler este architecture review por completo**
- [ ] **Confirmar que `npx tsc --noEmit` retorna 0 erros** (baseline pós-Sprint 26)
- [ ] **Confirmar que `npm run build` compila com sucesso** (baseline)
- [ ] **Executar `npm test` e confirmar baseline de 14 failures** (pré-existentes)
- [ ] **Verificar que `.env.test` NÃO existe** (será criado em ST-01)

### Validações por Story:

**ST-04 (Jest config):**
- [ ] Após fix, `npm test` NÃO deve listar `api-smoke.spec.ts` na suite
- [ ] Count de failures deve cair de 14 para 13

**ST-01 (env vars):**
- [ ] Criar `.env.test` com mocks
- [ ] Após fix, failures de env var (6) devem ser resolvidas
- [ ] Count: 13 → ~7

**ST-02 (mocks):**
- [ ] Atualizar mocks em 5 test files
- [ ] Se mock expõe bug real: **DOCUMENTAR, NÃO CORRIGIR** lógica

**ST-05 (contract-map):**
- [ ] Diff deve mostrar APENAS mudança de `operations/personalization/**` → `intelligence/personalization/**`
- [ ] NENHUMA outra alteração no YAML

**ST-06 (@ts-ignore):**
- [ ] Criar `types/mcp-global.d.ts` primeiro
- [ ] Remover `@ts-ignore` um adapter por vez
- [ ] `npx tsc --noEmit` = 0 após cada adapter

**ST-07 (CampaignAttributionStats):**
- [ ] Remover `@stub`, `@todo`, `@see` do JSDoc
- [ ] NÃO alterar os campos — já estão corretos
- [ ] Manter `[key: string]: unknown` por segurança

**ST-08 (config.ts):**
- [ ] Adicionar constantes de coleção (opcionais): `ATTRIBUTION_BRIDGES`, `EVENTS`, `TRANSACTIONS`
- [ ] Manter re-export de `db` intocado

**ST-09 (spend data — ATENÇÃO):**
- [ ] **NÃO usar aggregator.ts diretamente** — schema mismatch
- [ ] Buscar spend no hook via `performance_metrics` collection com mapping manual
- [ ] Se coleção vazia: fallback visual "Sem dados de spend" (P12)
- [ ] Testar com dados mock antes de Firestore real

**ST-10 (wiring):**
- [ ] Engine.ts: **PULAR** — já wired via hook
- [ ] Bridge.ts: Criar rota `/api/intelligence/attribution/sync`
- [ ] Aggregator.ts: Conectar via rota `/api/intelligence/attribution/stats` (com adapter se necessário)
- [ ] Overlap.ts: Conectar via budget-optimizer → rota API

**ST-11 (UI validation):**
- [ ] `/intelligence/attribution` renderiza
- [ ] Gráfico mostra dados (pode ser mock/seed)
- [ ] Tabela mostra Last Click, U-Shape, Linear
- [ ] Card "Valor Oculto" aparece com variação correta
- [ ] Sem erros no console

### Após conclusão de AMBAS as frentes:

- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (96+ rotas)
- [ ] `npm test` → ≤ 2 failures (env-dependent aceitos)
- [ ] `grep -r "@ts-ignore" --include="*.ts" app/src/` → ≤ 3
- [ ] `grep -r "@stub" --include="*.ts" app/src/types/attribution.ts` → 0
- [ ] Attribution page acessível e renderiza dados
- [ ] Nenhum arquivo de contrato alterado além de `contract-map.yaml` (ST-05)

---

## 10. Ressalvas da Aprovação

### Ressalva 1: Schema Mismatch do Aggregator

O `aggregator.ts` espera `PerformanceMetricDoc` mas Firestore usa `PerformanceMetric` com schema diferente. **Para Sprint 27, NÃO ativar o aggregator com dados reais sem adapter.** O hook deve buscar spend diretamente. Ativação completa do aggregator deve ser delegada para Sprint 28 com adapter layer.

### Ressalva 2: Feature Flag para Attribution

Embora o PRD sugira ativação direta, recomendo um **feature flag simples** (env var `NEXT_PUBLIC_ENABLE_ATTRIBUTION=true`) para permitir rollback rápido se a page de attribution causar problemas com dados reais. O flag pode ser removido na Sprint 28 após estabilização.

### Ressalva 3: Backlog items de contract-map

Além do fix de `personalization_engine` (ST-05), identificar que:
- `use-attribution-data.ts` NÃO está coberto por nenhuma lane (gap no contract-map)
- `types/attribution.ts` NÃO está em nenhuma lane específica
- `budget-optimizer.ts` NÃO está em nenhuma lane

Registrar como backlog para Sprint 28: expandir `intelligence_wing` ou criar lane `attribution` dedicada.

### Ressalva 4: Dados de Teste (Seed)

Se as coleções Firestore de attribution (`attribution_bridges`, `events`, `transactions`, `performance_metrics` por brand) estiverem vazias, a page vai renderizar "Nenhum dado encontrado". Para validação de ST-11, o dev DEVE ou:
- Criar dados seed manualmente
- Criar um script de seed reutilizável
- Usar a funcionalidade existente de ingestão para gerar dados

Sem seed, ST-11 não pode ser validado como "page funcional com dados reais".

---

## 11. Registro de Decisão Arquitetural

| Campo | Valor |
|:------|:------|
| **ID** | ADR-S27-001 |
| **Data** | 06/02/2026 |
| **Decisor** | Athos (Architect) |
| **Contexto** | PRD assume 4 módulos dead code; schema mismatch entre tipos |
| **Descoberta** | engine.ts e overlap.ts já têm consumers; aggregator tem schema mismatch |
| **Decisão** | Aprovar com 6 correções de premissa, 6 proibições extras, adapter no hook para spend |
| **Alternativa rejeitada** | Ativar aggregator diretamente — causaria runtime errors por schema mismatch |
| **Consequências** | Escopo de wiring reduzido; spend data via hook direto; aggregator fica para Sprint 28 |

---

## 12. Veredito Final

> **✅ APROVADO com 4 Ressalvas**
>
> A Sprint 27 (Hybrid: Backlog Cleanup + Attribution Revival) é viável e bem estruturada. As correções de premissa identificadas **reduzem o esforço total** (~1.5h a menos) mas introduzem a necessidade de um adapter para spend data. O maior risco (schema mismatch do aggregator) é mitigável usando o hook direto. A ativação completa com aggregator/bridge pode ser incremental.
>
> **Prioridade de execução**: Frente 1 (Backlog) primeiro para estabilizar baseline, depois Frente 2 (Attribution) com validação incremental.

---

*Architecture Review por Athos (Architect) — NETECMT v2.0*  
*Sprint 27: Hybrid — Backlog Cleanup + Attribution Revival | 06/02/2026*  
*Status: ✅ APROVADO com 4 Ressalvas*
