# Allowed Context — Sprint 34: A/B Testing & Segment Optimization
**Preparado por:** Leticia (SM)
**Data:** 09/02/2026
**Sprint:** 34
**Destinatario:** Darllyson (Dev)

> **REGRA ABSOLUTA:** Darllyson so pode ler e modificar os arquivos listados abaixo. Qualquer arquivo fora desta lista requer aprovacao explicita da SM (Leticia) ou do Arch (Athos).

---

## LEITURA OBRIGATORIA (Ler ANTES de iniciar qualquer story)

| # | Arquivo | Conteudo |
|:--|:--------|:---------|
| R-01 | `_netecmt/solutioning/prd/prd-sprint-34-ab-testing-segment-optimization.md` | PRD completo com requisitos e Success Criteria |
| R-02 | `_netecmt/solutioning/architecture/arch-sprint-34.md` | Architecture Review com 14 DTs (2 Blocking: DT-11, DT-13) |
| R-03 | `_netecmt/packs/stories/sprint-34-ab-testing-segment-optimization/stories.md` | Stories com ACs detalhados e codigo de referencia |
| R-04 | `_netecmt/packs/stories/sprint-34-ab-testing-segment-optimization/story-pack-index.md` | Indice do pack com fases, gates e dependencias |

---

## PODE MODIFICAR (Arquivos alvo da sprint)

### Novos Arquivos (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| M-01 | `app/src/types/ab-testing.ts` | S34-AB-01 | Types (ABTest, ABTestVariant, OptimizationDecision, SegmentMetrics) + Zod Schemas |
| M-02 | `app/src/lib/firebase/ab-tests.ts` | S34-AB-02 | CRUD helpers Firestore (create, get, list, update, delete, updateVariantMetrics) |
| M-03 | `app/src/lib/intelligence/ab-testing/engine.ts` | S34-AB-03 | ABTestEngine class + hashAssign() dedicada (DT-04, DT-12) |
| M-04 | `app/src/lib/intelligence/ab-testing/significance.ts` | S34-AB-03 | Z-test utility (calculateSignificance) — DT-05, PB-01 |
| M-05 | `app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | S34-AO-01 | AutoOptimizer engine (pause/winner/early-stop) — DT-09, DT-10 |
| M-06 | `app/src/lib/intelligence/ab-testing/segment-query.ts` | S34-SEG-01 | Segment data query via leads collection — DT-07, DT-13 |
| M-07 | `app/src/app/api/intelligence/ab-tests/route.ts` | S34-AB-04 | API Route CRUD (POST create, GET list) |
| M-08 | `app/src/app/api/intelligence/ab-tests/[testId]/route.ts` | S34-AB-04 | API Route (GET single, PUT update/start/pause/complete, DELETE) |
| M-09 | `app/src/app/api/intelligence/ab-tests/[testId]/assign/route.ts` | S34-AB-05 | API Route (POST assign variant to lead) |
| M-10 | `app/src/app/api/intelligence/ab-tests/[testId]/event/route.ts` | S34-AB-06 | API Route (POST record event: impression/click/conversion) |
| M-11 | `app/src/app/api/intelligence/ab-tests/[testId]/optimize/route.ts` | S34-AO-03 | API Route (POST trigger optimization) |
| M-12 | `app/src/app/intelligence/ab-testing/page.tsx` | S34-AB-07 | UI Pagina A/B Testing (lista + wizard + results + auto-opt) |
| M-13 | `app/src/components/intelligence/ab-test-wizard.tsx` | S34-AB-07 | UI Wizard de criacao (3 steps) |
| M-14 | `app/src/components/intelligence/ab-test-results.tsx` | S34-AB-07 | UI Results dashboard (tabela + chart + significance badge + timeline) |
| M-15 | `app/src/components/intelligence/ab-test-card.tsx` | S34-AB-07 | UI Card resumo para lista de testes |
| M-16 | `app/src/components/performance/segment-filter.tsx` | S34-SEG-02 | UI SegmentFilter (select All/Hot/Warm/Cold) |
| M-17 | `app/src/components/performance/segment-breakdown.tsx` | S34-SEG-02 | UI SegmentBreakdown (3 cards comparativos) |
| M-18 | `app/src/lib/hooks/use-segment-performance.ts` | S34-SEG-03 | Hook useSegmentPerformance (SWR 60s) |
| M-19 | `app/src/lib/content/engagement-scorer.ts` | S34-GOV-02 | Engagement scorer (getTopEngagementExamples) — DT-02 |

### Arquivos Existentes (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-20 | `app/src/lib/constants.ts` | S34-AB-07 | Adicionar item `{ id: 'ab-testing', label: 'A/B Testing', href: '/intelligence/ab-testing', icon: 'FlaskConical' }` ao grupo `intelligence` em NAV_GROUPS |
| M-21 | `app/src/lib/icon-maps.ts` | S34-AB-07 | Verificar/adicionar `FlaskConical` no mapa de icones (DT-14) |
| M-22 | `app/src/lib/performance/engine/performance-advisor.ts` | S34-SEG-04 | Adicionar parametro opcional `segmentData?: SegmentBreakdownData` em `generateInsights()` (DT-08) |
| M-23 | `app/src/lib/ai/prompts/performance-advisor.ts` | S34-SEG-04 | Adicionar secao condicional de segment comparison no prompt (DT-08) |
| M-24 | `app/src/lib/content/generation-engine.ts` | S34-GOV-02 | Importar e injetar `getTopEngagementExamples()` no prompt de geracao (DT-02) |
| M-25 | `app/src/lib/firebase/automation.ts` | S34-AO-02 | Adicionar `getKillSwitchState()` + `setKillSwitchState()` (DT-11 BLOCKING) |
| M-26 | `app/src/types/database.ts` | S34-AO-02 | Adicionar campo `killSwitchState?` no Brand type (DT-11 BLOCKING) |
| M-27 | `app/src/app/performance/page.tsx` | S34-SEG-05 | Integrar SegmentFilter + SegmentBreakdown |
| M-28 | `app/src/__tests__/hooks/use-brands.test.ts` | S34-GOV-01 | Adicionar `afterEach` com `cleanup()` (DT-01) |
| M-29 | `app/src/__tests__/hooks/use-brand-assets.test.ts` | S34-GOV-01 | Adicionar `afterEach` com `cleanup()` (DT-01) |
| M-30 | `app/jest.setup.js` | S34-GOV-01 | Avaliar isolamento MessageChannel polyfill (se necessario) |

### Governanca (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-31 | `_netecmt/core/contract-map.yaml` | S34-GOV-03 | Nova lane `ab_testing_optimization` |
| M-32 | `_netecmt/sprints/ACTIVE_SPRINT.md` | S34-GOV-04 | Atualizar com resultado final |
| M-33 | `_netecmt/ROADMAP.md` | S34-GOV-04 | Adicionar entrada S34 |

### Testes (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| T-01 | `app/src/__tests__/lib/intelligence/ab-testing/engine.test.ts` | S34-AB-03 | Testes: hashAssign, significance, ABTestEngine (8+ testes) |
| T-02 | `app/src/__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | S34-AO-01 | Testes: pause loser, declare winner, early stop, kill-switch, continue (6+ testes) |

---

## CROSS-LANE TOUCHES (Documentados — Arch Review Ressalva #4)

> **IMPORTANTE:** Os 10 arquivos abaixo pertencem a lanes diferentes da lane principal `ab_testing_optimization`. Foram autorizados pelo Arch Review (Athos) e estao incluidos no allowed-context.

| # | Arquivo | Lane Original | Modificacao S34 | Story |
|:--|:--------|:-------------|:----------------|:------|
| CL-01 | `app/src/lib/constants.ts` | core | Adicionar item NAV_GROUPS | S34-AB-07 |
| CL-02 | `app/src/lib/icon-maps.ts` | core | Adicionar FlaskConical | S34-AB-07 |
| CL-03 | `app/src/lib/performance/engine/performance-advisor.ts` | performance_war_room | Parametro segmentData | S34-SEG-04 |
| CL-04 | `app/src/lib/ai/prompts/performance-advisor.ts` | ai_retrieval | Secao segment no prompt | S34-SEG-04 |
| CL-05 | `app/src/lib/content/generation-engine.ts` | content_autopilot | Inject engagement context | S34-GOV-02 |
| CL-06 | `app/src/lib/firebase/automation.ts` | automation | getKillSwitchState helper | S34-AO-02 |
| CL-07 | `app/src/types/database.ts` | dashboard | killSwitchState no Brand | S34-AO-02 |
| CL-08 | `app/jest.setup.js` | infrastructure | Cleanup isolamento | S34-GOV-01 |
| CL-09 | `app/src/__tests__/hooks/use-brands.test.ts` | infrastructure | afterEach cleanup | S34-GOV-01 |
| CL-10 | `app/src/__tests__/hooks/use-brand-assets.test.ts` | infrastructure | afterEach cleanup | S34-GOV-01 |

---

## PODE LER (Referencia — NAO MODIFICAR)

### Utilitarios e Patterns

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-01 | `app/src/lib/utils/api-response.ts` | `createApiError(status, message, details?)` / `createApiSuccess(data)` — pattern obrigatorio |
| L-02 | `app/src/lib/auth/brand-guard.ts` | `requireBrandAccess(req, brandId)` — guard obrigatorio. **IMPORT: `@/lib/auth/brand-guard`** |
| L-03 | `app/src/lib/ai/rag.ts` | `hashString()` (djb2 S28) — referencia APENAS. NAO importar (DT-12) |

### Firebase & Data

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-04 | `app/src/lib/firebase/config.ts` | `db` — instancia Firestore. `Timestamp` de `firebase/firestore` |
| L-05 | `app/src/lib/firebase/firestore.ts` | `getBrand(brandId)` — busca dados da marca (inclui killSwitchState apos S34-AO-02) |
| L-06 | `app/src/lib/firebase/vault.ts` | Pattern subcollection `brands/{brandId}/secrets` |
| L-07 | `app/src/lib/firebase/content-calendar.ts` | Pattern subcollection + CRUD (referencia S33) |

### AI & Prompts

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-08 | `app/src/lib/ai/gemini.ts` | `generateWithGemini(prompt, options?)` — responseMimeType, systemPrompt, temperature |
| L-09 | `app/src/lib/ai/prompts/social-generation.ts` | Referencia de pattern (prompts exportados como constantes) |

### Types

| # | Arquivo | Types Relevantes |
|:--|:--------|:-----------------|
| L-10 | `app/src/types/social.ts` | `SocialInteractionRecord` com `engagementScore?` (para GOV-02) |
| L-11 | `app/src/types/database.ts` | `Brand` type (antes da modificacao AO-02) |
| L-12 | `app/src/types/automation.ts` | `AutomationLog` types (para integrar ab_optimization) |

### Layout & UI

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-13 | `app/src/components/layout/sidebar.tsx` | Sidebar consome NAV_GROUPS. NAO modificar — alteracoes via `constants.ts` (M-20) |
| L-14 | `app/src/lib/guards/resolve-icon.ts` | Fallback de icones — referencia |
| L-15 | `app/src/app/intelligence/offer-lab/page.tsx` | Referencia de pattern (pagina Intelligence com wizard) |
| L-16 | `app/src/components/intelligence/keyword-management.tsx` | Referencia de pattern (components Intelligence) |

### Performance (Referencia para extensao)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-17 | `app/src/lib/performance/engine/anomaly-engine.ts` | `calculateZScore()` — Z-score para metricas (diferente do Z-test S34) |
| L-18 | `app/src/app/performance/page.tsx` | Estrutura da pagina Performance (antes de SEG-05) |

### Automation (Referencia para integracao)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-19 | `app/src/lib/automation/engine.ts` | `AutomationEngine.checkKillSwitch()` — metodo estatico existente (avalia report, NAO le Firestore) |
| L-20 | `app/src/app/api/automation/kill-switch/route.ts` | POST endpoint Kill-Switch (write only) |
| L-21 | `app/src/components/automation/ControlCenter.tsx` | ControlCenter UI (para entender onde automation_logs aparecem) |

---

## PROIBICOES ABSOLUTAS

| # | Proibicao | Motivo |
|:--|:----------|:-------|
| P-01 | ZERO `any` em codigo novo | Padrao Sigma — types explicitos |
| P-02 | ZERO `Date` — sempre `Timestamp` do Firestore | Consistencia Firestore (P-06) |
| P-03 | ZERO `firebase-admin` ou `google-cloud/*` | Client SDK apenas (P-02 herdada) |
| P-04 | NUNCA ler/modificar arquivos fora desta lista | Isolamento de contexto (P-04) |
| P-05 | ZERO deps npm novas | Padrao Sigma — REST puro via fetch() (P-03) |
| P-06 | NUNCA omitir `force-dynamic` em novas rotas | Next.js dynamic routes (P-07) |
| P-07 | NUNCA omitir `requireBrandAccess` em rotas brand-scoped | Multi-tenant isolation (P-08) |
| P-08 | ZERO `@ts-ignore` ou `@ts-expect-error` | (P-05 herdada) |
| P-09 | ZERO lib estatistica externa | Z-test inline funcao utility (PB-01) |
| P-10 | ZERO assignment nao-deterministico | Hash puro djb2 (PB-02) |
| P-11 | ZERO decisao automatica sem >= 100 impressoes | Guard no AutoOptimizer (PB-03) |
| P-12 | ZERO auto-optimization se Kill-Switch ativo | Log-only mode (PB-04) |
| P-13 | ZERO publicacao real em plataformas | Testes controlam display apenas (PB-06) |
| P-14 | ZERO import de `hashString` do `rag.ts` | Funcao dedicada `hashAssign()` (DT-12) |
| P-15 | ZERO extensao de `/api/performance/metrics` com param segment | Dados de leads direto (DT-13 BLOCKING) |

---

## DECISION TOPICS (DTs) — Resumo Rapido

| DT | Prioridade | Status | Resumo |
|:---|:-----------|:-------|:-------|
| DT-01 | NON-BLOCKING | RESOLVIDO | Timer leak: `cleanup()` per-hook (Camada 1) + `--forceExit` fallback (Camada 2) |
| DT-02 | NON-BLOCKING | RESOLVIDO | `orderBy('engagementScore','desc').limit(5)`. Index automatico. Graceful degradation. |
| DT-03 | NON-BLOCKING | RESOLVIDO | `brands/{brandId}/ab_tests` subcollection. Pattern universal (7 existentes). |
| DT-04 | NON-BLOCKING | RESOLVIDO | djb2 com separador `:`. Funcao dedicada `hashAssign()`. |
| DT-05 | NON-BLOCKING | RESOLVIDO | Z-test utility em `significance.ts`. Retorno rico. |
| DT-06 | NON-BLOCKING | RESOLVIDO | Pagina dedicada `/intelligence/ab-testing`. Pattern unanime. |
| DT-07 | NON-BLOCKING | RESOLVIDO | SegmentBreakdown com dados de leads. 3 queries paralelas. Index composto necessario. |
| DT-08 | NON-BLOCKING | RESOLVIDO | Inject segmentData no prompt existente. Backward-compatible. Single Gemini call. |
| DT-09 | NON-BLOCKING | RESOLVIDO | Constants + override opcional no ABTest type. |
| DT-10 | NON-BLOCKING | RESOLVIDO | Subcollection `optimization_log`. Append-only. |
| DT-11 | **BLOCKING** | RESOLVIDO | `getKillSwitchState()` NAO EXISTE — criar em S34-AO-02. Campo `killSwitchState` no Brand. |
| DT-12 | NON-BLOCKING | RESOLVIDO | Funcao dedicada `hashAssign()`. NAO importar de rag.ts. |
| DT-13 | **BLOCKING** | RESOLVIDO | SegmentBreakdown usa LEADS, nao ads. Rota performance INALTERADA. Composite index necessario. |
| DT-14 | NON-BLOCKING | RESOLVIDO | `FlaskConical` — verificar/adicionar no SIDEBAR_ICONS. |

---

## PRE-REQUISITOS INFRA

| # | Pre-requisito | Acao | Verificacao |
|:--|:-------------|:-----|:-----------|
| INFRA-01 | Firestore composite index `leads`: `brandId` ASC + `segment` ASC | Criar no Firebase Console (ou via firebase.json) | Query `where('brandId',...).where('segment',...)` funciona |

---

## MAPA DE DEPENDENCIAS (Ordem de Execucao)

```
Fase 0 (paralelo):
  GOV-01 ──┐
  GOV-02 ──┼──→ GATE-00
           │
Fase 1 (sequencial com paralelos):
  AB-01 → AB-02 ──┐
         AB-03 ──┼──→ AB-04 → AB-05 ──┐
                 │          AB-06 ──┼──→ AB-07 → GATE-01
                 │                  │
Fase 2 (sequencial com paralelos):
  SEG-01 → SEG-02 ──┐
           SEG-03 ──┼──→ SEG-05 → GATE-02
           SEG-04 ──┘
                    │
Fase 3 (sequencial com paralelos):
  AO-01 ──┐
  AO-02 ──┼──→ AO-03 → AO-04 → GATE-03
           │
Fase 4 (sequencial):
  GOV-03 → GOV-04
```

---

## RESUMO DE IMPACTO

| Metrica | Valor |
|:--------|:------|
| Arquivos novos (CRIAR) | 19 |
| Arquivos existentes (MODIFICAR) | 11 |
| Arquivos de teste (CRIAR) | 2 |
| Arquivos de governanca (MODIFICAR) | 3 |
| Cross-lane touches | 10 |
| Arquivos de leitura (referencia) | 21 |
| **Total no escopo** | **35 arquivos** |

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 34: A/B Testing & Segment Optimization | 09/02/2026*
*19 arquivos novos + 11 modificacoes + 2 test files + 3 governanca = 35 arquivos no escopo*
*21 arquivos de leitura (referencia)*
*10 cross-lane touches documentados (Ressalva #4 Athos)*
