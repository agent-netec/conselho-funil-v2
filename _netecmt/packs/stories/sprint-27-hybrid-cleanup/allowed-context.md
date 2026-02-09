# Allowed Context: Sprint 27 — Hybrid (Backlog Cleanup + Attribution Revival)
**Lane:** cross-cutting (intelligence_wing + test infra + contract hygiene)
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

> Incorpora proibições do PRD (P1–P8) e do Architecture Review (P9–P14).

---

## Contexto Global

### Leitura Obrigatória (antes de qualquer story)
- `_netecmt/packs/stories/sprint-27-hybrid-cleanup/stories.md` — Stories, ACs e checklist
- `_netecmt/packs/stories/sprint-27-hybrid-cleanup/story-pack-index.md` — Ordem de execução e estimativas
- `_netecmt/solutioning/architecture/arch-sprint-27.md` — Architecture Review completo (4 ressalvas)

### Referência de Tipos (LEITURA, NÃO MODIFICAR exceto se listado nas stories)
- `app/src/types/attribution.ts` — **MODIFICÁVEL** (ST-07, ST-12)
- `app/src/types/performance.ts` — **LEITURA APENAS** (schema `PerformanceMetric`)
- `app/src/types/cross-channel.ts` — **LEITURA APENAS** (P10)
- `app/src/types/journey.ts` — **LEITURA APENAS** (P13)
- `app/src/types/intelligence.ts` — LEITURA
- `app/src/types/database.ts` — LEITURA
- `app/src/types/context.ts` — LEITURA

### Tipos INTOCÁVEIS (Sprint 25 — produção estável)
- `app/src/types/prediction.ts` — **PROIBIDO** (P3)
- `app/src/types/creative-ads.ts` — **PROIBIDO** (P3)
- `app/src/types/text-analysis.ts` — **PROIBIDO** (P3)
- `app/src/types/social-inbox.ts` — **PROIBIDO** (P4)

---

## Epic 1: Test Infrastructure Fix (S27-ST-01 a ST-04)

### Escrita (Modificar)

| Arquivo | Story | Ação |
|:--------|:------|:-----|
| `app/.env.test` | ST-01 | **CRIAR** — mock env vars |
| `app/jest.config.js` (ou `.ts`) | ST-04 | Adicionar `testPathIgnorePatterns` |
| `app/src/__tests__/hooks/use-brands.test.ts` | ST-02 | Atualizar mocks |
| `app/src/lib/agents/spy/__tests__/ethical-guardrails.test.ts` | ST-02 | Atualizar mocks |
| `app/src/__tests__/lib/automation/maestro-flow.test.ts` | ST-02 | Atualizar mocks |
| `app/src/app/api/assets/metrics/route.test.ts` | ST-02 | Atualizar mocks |
| `app/src/app/api/intelligence/keywords/__tests__/route.test.ts` | ST-02 | Atualizar mocks |
| `app/src/__tests__/lib/ai/rag.test.ts` | ST-03 | Ajustar expectations de stubs |

### Leitura (Contexto)
- Tipos atuais para verificar interfaces dos mocks
- `app/src/types/database.ts` — Interface `Brand` para ST-02
- `app/src/types/competitors.ts` — Interface `CompetitorProfile` para ST-02

---

## Epic 2: Contract & Type Hygiene (S27-ST-05, ST-06)

### Escrita (Modificar)

| Arquivo | Story | Ação |
|:--------|:------|:-----|
| `_netecmt/core/contract-map.yaml` | ST-05 | Fix path: `operations/` → `intelligence/` |
| `app/src/types/mcp-global.d.ts` | ST-06 | **CRIAR** — tipo global `Window.mcp` |
| `app/src/lib/mcp/adapters/bright-data.ts` | ST-06 | Remover `@ts-ignore` |
| `app/src/lib/mcp/adapters/glimpse.ts` | ST-06 | Remover `@ts-ignore` |
| `app/src/lib/mcp/adapters/firecrawl.ts` | ST-06 | Remover `@ts-ignore` |
| `app/src/lib/mcp/adapters/exa.ts` | ST-06 | Remover `@ts-ignore` |
| `app/src/lib/mcp/adapters/browser.ts` | ST-06 | Remover `@ts-ignore` |

### Leitura (Contexto)
- `_netecmt/core/contract-map.yaml` — Verificar path atual antes de editar
- `app/src/lib/mcp/adapters/*.ts` — Verificar padrão de uso de `window.mcp`

---

## Epic 3: Attribution Module Activation (S27-ST-07 a ST-11)

### Escrita (Modificar)

| Arquivo | Story | Ação |
|:--------|:------|:-----|
| `app/src/types/attribution.ts` | ST-07 | Remover `@stub` de `CampaignAttributionStats` |
| `app/src/lib/intelligence/config.ts` | ST-08 | Adicionar constantes de coleção |
| `app/src/lib/hooks/use-attribution-data.ts` | ST-09 | Conectar spend real |
| `app/src/app/api/intelligence/attribution/sync/route.ts` | ST-10 | **CRIAR** — consumer de bridge |
| `app/src/app/api/intelligence/attribution/stats/route.ts` | ST-10 | **CRIAR** — consumer de aggregator |
| `app/src/app/api/intelligence/attribution/overlap/route.ts` | ST-10 | **CRIAR** — consumer de overlap |
| `app/src/app/intelligence/attribution/page.tsx` | ST-11 | Ajustes de UI (se necessário) |

### Leitura (Contexto — NÃO MODIFICAR)

| Arquivo | Justificativa |
|:--------|:-------------|
| `app/src/lib/intelligence/attribution/engine.ts` | Entender API do motor (P1 — não alterar lógica) |
| `app/src/lib/intelligence/attribution/bridge.ts` | Entender `AttributionBridgeService` para criar consumer (P1) |
| `app/src/lib/intelligence/attribution/aggregator.ts` | Entender `CrossChannelAggregator` + schema mismatch (P1, P9) |
| `app/src/lib/intelligence/attribution/overlap.ts` | Entender `ChannelOverlapAnalyzer` (P1) |
| `app/src/types/performance.ts` | Schema `PerformanceMetric` — fonte real de dados (P9) |
| `app/src/types/cross-channel.ts` | Schema `CrossChannelMetricDoc` (P10) |
| `app/src/types/journey.ts` | `JourneyEvent`, `JourneyTransaction` usados pelo engine (P13) |
| `app/src/app/intelligence/attribution/page.tsx` | Entender consumo de dados antes de alterar hook |

---

## Epic 4: Attribution Stubs Resolution (S27-ST-12)

### Escrita (Modificar)

| Arquivo | Story | Ação |
|:--------|:------|:-----|
| `app/src/types/attribution.ts` | ST-12 | Verificar stubs restantes (pode já estar resolvido por ST-07) |
| `app/src/lib/intelligence/config.ts` | ST-12 | Verificar stubs restantes (pode já estar resolvido por ST-08) |

---

## Proibições (P1–P14)

### Proibições do PRD (P1–P8)

| # | Proibição | Escopo |
|:--|:----------|:-------|
| **P1** | **NUNCA alterar lógica de negócio** dos módulos attribution core: `engine.ts`, `bridge.ts`, `aggregator.ts`, `overlap.ts` | Código testado — apenas conectar, não reescrever. **Nota:** `use-attribution-data.ts` (hook) NÃO é core e pode ser alterado (esclarecimento Arch Review) |
| **P2** | **NUNCA remover exports existentes** de `types/attribution.ts` | `AttributionModel`, `AttributionPoint`, etc. são contratuais |
| **P3** | **NUNCA alterar interfaces Sprint 25**: `prediction.ts`, `creative-ads.ts`, `text-analysis.ts` | Intocáveis — produção estável |
| **P4** | **NUNCA alterar `types/social-inbox.ts`** | Usado pelo Social Command Center |
| **P5** | **NUNCA remover stubs que NÃO são do escopo attribution** | Stubs de RAG, assets panel, etc. permanecem TODO |
| **P6** | **NUNCA usar `any`** em novos tipos ou correções | `unknown` com index signature quando necessário |
| **P7** | **NUNCA alterar formato do `contract-map.yaml`** — apenas fix path | Mudança cirúrgica no ST-05 |
| **P8** | **NUNCA alterar lógica de chamada dos MCP adapters** | ST-06: apenas tipar, não mudar comportamento |

### Proibições Adicionais do Architecture Review (P9–P14)

| # | Proibição | Justificativa |
|:--|:----------|:-------------|
| **P9** | **NUNCA alterar schema de `PerformanceMetric` ou `PerformanceMetricDoc`** em `types/performance.ts` | Ambos contratuais — `PerformanceMetric` é schema real, `PerformanceMetricDoc` é legado. Não fundir nem renomear |
| **P10** | **NUNCA alterar `types/cross-channel.ts`** | Schema usado por `aggregator.ts` e `overlap.ts` |
| **P11** | **NUNCA injetar attribution consumers em pipelines existentes** (chat, ingest, social) | Risco R4 — criar rotas/consumers isolados |
| **P12** | **Se dados reais não existirem em Firestore, usar fallback visual** | Mostrar "Sem dados de spend" na UI em vez de 0 hardcoded |
| **P13** | **NUNCA alterar `types/journey.ts`** | Usado por engine.ts e bridge.ts ativamente |
| **P14** | **Novas rotas API DEVEM seguir padrão envelope existente** | `{ success: true, data: {...} }` ou `{ error: string, code: string }` |

---

## Resumo de Impacto por Contrato

| Lane (contract-map.yaml) | Contrato | Impacto | Risco |
|:--------------------------|:---------|:--------|:------|
| `intelligence_wing` | `intelligence-storage.md` (v2.0, Active) | Adições apenas — novos consumers e rotas | Médio |
| `performance_war_room` | `performance-spec.md` (v1.0, DRAFT) | Leitura apenas — sem alteração | Baixo |
| `personalization_engine` | Path fix no contract-map (ST-05) | Textual — sem impacto runtime | Muito Baixo |
| Sem lane (MCP adapters) | N/A | Apenas tipagem | Mínimo |

**Nenhum contrato ativo será quebrado.** Todas as alterações são adições ou completions de stubs.

---

## Gap de Cobertura no Contract-Map (Backlog Sprint 28)

Os seguintes arquivos não estão cobertos por nenhuma lane:
- `app/src/lib/hooks/use-attribution-data.ts`
- `app/src/types/attribution.ts` (tipo compartilhado)
- `app/src/lib/intelligence/attribution/budget-optimizer.ts`

Registrar como backlog para Sprint 28: expandir `intelligence_wing` ou criar lane `attribution` dedicada.

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Incorpora proibições do PRD (Iuran) e Architecture Review (Athos)*
*Sprint 27: Hybrid — Backlog Cleanup + Attribution Revival | 06/02/2026*
