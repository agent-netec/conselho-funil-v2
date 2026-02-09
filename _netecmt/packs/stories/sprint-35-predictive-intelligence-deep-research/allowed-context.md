# Allowed Context — Sprint 35: Predictive Intelligence & Deep Research
**Preparado por:** Leticia (SM)
**Data:** 09/02/2026
**Sprint:** 35
**Destinatario:** Darllyson (Dev)

> **REGRA ABSOLUTA:** Darllyson so pode ler e modificar os arquivos listados abaixo. Qualquer arquivo fora desta lista requer aprovacao explicita da SM (Leticia) ou do Arch (Athos).

---

## LEITURA OBRIGATORIA (Ler ANTES de iniciar qualquer story)

| # | Arquivo | Conteudo |
|:--|:--------|:---------|
| R-01 | `_netecmt/solutioning/prd/prd-sprint-35-predictive-intelligence-deep-research.md` | PRD completo com requisitos e Success Criteria |
| R-02 | `_netecmt/solutioning/architecture/arch-sprint-35.md` | Architecture Review com 16 DTs (6 Blocking: DT-01, DT-05, DT-07, DT-08, DT-12, DT-16) |
| R-03 | `_netecmt/packs/stories/sprint-35-predictive-intelligence-deep-research/stories.md` | Stories com ACs detalhados e codigo de referencia |
| R-04 | `_netecmt/packs/stories/sprint-35-predictive-intelligence-deep-research/story-pack-index.md` | Indice do pack com fases, gates e dependencias |

---

## PODE MODIFICAR (Arquivos alvo da sprint)

### Novos Arquivos (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| M-01 | `app/src/types/research.ts` | S35-PRED-01 | Types Research: ResearchQuery, ResearchSource, MarketDossier (DT-05 BLOCKING — arquivo separado) |
| M-02 | `app/src/lib/intelligence/predictive/churn-predictor.ts` | S35-PRED-02 | ChurnPredictor engine com batch 500 + paginacao cursor (DT-07 BLOCKING) |
| M-03 | `app/src/lib/intelligence/predictive/ltv-estimator.ts` | S35-PRED-03 | LTVEstimator engine com multipliers configuraveis por brand (DT-08 BLOCKING) |
| M-04 | `app/src/lib/intelligence/predictive/audience-forecaster.ts` | S35-PRED-04 | AudienceForecaster engine com Gemini narrative |
| M-05 | `app/src/lib/intelligence/predictive/alert-generator.ts` | S35-DASH-02 | PredictiveAlertGenerator engine |
| M-06 | `app/src/lib/intelligence/research/engine.ts` | S35-RES-01 | ResearchEngine (Exa + Firecrawl + Gemini pipeline) |
| M-07 | `app/src/lib/firebase/research.ts` | S35-RES-03 | Research CRUD helpers Firestore + cache 24h |
| M-08 | `app/src/lib/ai/prompts/predictive-forecast.ts` | S35-PRED-04 | Prompt Gemini para narrativa de forecast |
| M-09 | `app/src/lib/ai/prompts/research-synthesis.ts` | S35-RES-02 | Prompts Gemini para sintese de research (chunked 2 fases — DT-12 BLOCKING) |
| M-10 | `app/src/app/api/intelligence/predictive/churn/route.ts` | S35-PRED-05 | API Route churn prediction |
| M-11 | `app/src/app/api/intelligence/predictive/ltv/route.ts` | S35-PRED-05 | API Route LTV estimation |
| M-12 | `app/src/app/api/intelligence/predictive/forecast/route.ts` | S35-PRED-05 | API Route audience forecast |
| M-13 | `app/src/app/api/intelligence/research/route.ts` | S35-RES-04 | API Route research (POST generate + GET list) |
| M-14 | `app/src/app/intelligence/research/page.tsx` | S35-DASH-03 | Research page UI |
| M-15 | `app/src/components/intelligence/research/dossier-viewer.tsx` | S35-DASH-03 | Dossier Viewer component (secoes colapsiveis) |
| M-16 | `app/src/components/intelligence/research/research-form.tsx` | S35-DASH-03 | Research form component |
| M-17 | `app/src/components/intelligence/predictive/ChurnOverview.tsx` | S35-DASH-01 | Churn Overview tab component |
| M-18 | `app/src/components/intelligence/predictive/LTVBreakdown.tsx` | S35-DASH-01 | LTV Breakdown tab component |
| M-19 | `app/src/components/intelligence/predictive/ForecastChart.tsx` | S35-DASH-01 | Forecast Chart tab component |
| M-20 | `app/src/components/intelligence/predictive/PredictiveAlerts.tsx` | S35-DASH-02 | Predictive Alerts UI component |
| M-21 | `app/src/lib/hooks/use-predictive-data.ts` | S35-DASH-04 | Hook usePredictiveData (churn + ltv + forecast em paralelo) |

### Arquivos Existentes (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-22 | `app/src/types/predictive.ts` | S35-PRED-01 | Expandir com ChurnPrediction, ChurnBatchResult, LTVEstimation, LTVBatchResult, AudienceForecast, PredictiveAlert |
| M-23 | `app/src/lib/intelligence/predictive/engine.ts` | S35-PRED-03 | Refatorar `forecastCohortROI` para usar LTVEstimator (PB-02) |
| M-24 | `app/src/components/intelligence/predictive/ScaleSimulator.tsx` | S35-DASH-01 | Adicionar tabs (Visao Geral, Churn, LTV, Forecast, Simulador) via shadcn Tabs (DT-13) |
| M-25 | `app/src/app/intelligence/predictive/page.tsx` | S35-DASH-01 | Atualizar titulo + descricao + integrar novo dashboard |
| M-26 | `app/src/components/layout/sidebar.tsx` | S35-DASH-03 | Adicionar item "Deep Research" na secao Intelligence |
| M-27 | `app/src/lib/firebase/ab-tests.ts` | S35-GOV-01 | Envolver `updateVariantMetrics` com `runTransaction` (DT-01 BLOCKING) |
| M-28 | `app/src/app/performance/page.tsx` | S35-GOV-02 | Propagar `selectedSegment` para SegmentBreakdown + Advisor + Charts (DT-02, prop drilling) |
| M-29 | `app/jest.setup.js` | S35-GOV-03 | Mock leve `MessageChannel` com cleanup afterAll (DT-03) |
| M-30 | `app/src/types/performance.ts` | S35-GOV-04 | Resolver 4 stubs (documentar `@intentional-stub`) |
| M-31 | `app/src/types/intelligence.ts` | S35-GOV-04 | Resolver 2 stubs (documentar `@intentional-stub`) |
| M-32 | `app/src/lib/ai/embeddings.ts` | S35-GOV-04 | Remover anotacao `@stub` de `cosineSimilarity` (ja funcional) |
| M-33 | `app/src/lib/constants.ts` | S35-DASH-03 | Adicionar item "Deep Research" ao grupo `intelligence` em NAV_GROUPS |
| M-34 | `app/src/lib/icon-maps.ts` | S35-DASH-03 | Verificar/adicionar icone `Telescope` ou `Search` (Lucide) |

### Testes (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| T-01 | `app/src/__tests__/lib/intelligence/predictive/churn-predictor.test.ts` | S35-PRED-02 | Testes: churn scoring, batch limit 500, paginacao, edge cases (8+ testes) |
| T-02 | `app/src/__tests__/lib/intelligence/predictive/ltv-estimator.test.ts` | S35-PRED-03 | Testes: LTV calculation, multipliers, config override, confidence score (6+ testes) |
| T-03 | `app/src/__tests__/lib/intelligence/research/engine.test.ts` | S35-RES-01 | Testes: dossier generation, chunked synthesis, graceful degradation, cache (8+ testes) |

### Governanca (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| G-01 | `_netecmt/core/contract-map.yaml` | S35-GOV-05 | Novas lanes `predictive_intelligence` + `deep_research` |
| G-02 | `_netecmt/contracts/predictive-intelligence-spec.md` | S35-GOV-05 | **CRIAR** — Contrato da lane predictive_intelligence (DT-16 BLOCKING) |
| G-03 | `_netecmt/contracts/deep-research-spec.md` | S35-GOV-05 | **CRIAR** — Contrato da lane deep_research (DT-16 BLOCKING) |
| G-04 | `_netecmt/sprints/ACTIVE_SPRINT.md` | S35-GOV-06 | Atualizar com resultado final |
| G-05 | `_netecmt/ROADMAP.md` | S35-GOV-06 | Adicionar entrada S35 |

---

## CROSS-LANE TOUCHES (Documentados — Arch Review)

> **IMPORTANTE:** Os arquivos abaixo pertencem a lanes diferentes das lanes principais `predictive_intelligence` e `deep_research`. Foram autorizados pelo Arch Review (Athos) e estao incluidos no allowed-context.

| # | Arquivo | Lane Original | Modificacao S35 | Story |
|:--|:--------|:-------------|:----------------|:------|
| CL-01 | `app/src/lib/firebase/ab-tests.ts` | ab_testing_optimization | `runTransaction` no `updateVariantMetrics` | S35-GOV-01 |
| CL-02 | `app/src/app/performance/page.tsx` | performance_war_room | Propagar `selectedSegment` drill-down | S35-GOV-02 |
| CL-03 | `app/jest.setup.js` | infrastructure | Mock MessageChannel | S35-GOV-03 |
| CL-04 | `app/src/types/performance.ts` | performance_war_room | Documentar 4 stubs | S35-GOV-04 |
| CL-05 | `app/src/types/intelligence.ts` | intelligence | Documentar 2 stubs | S35-GOV-04 |
| CL-06 | `app/src/lib/ai/embeddings.ts` | ai_retrieval | Remover anotacao @stub | S35-GOV-04 |
| CL-07 | `app/src/lib/constants.ts` | core | Adicionar item NAV_GROUPS | S35-DASH-03 |
| CL-08 | `app/src/lib/icon-maps.ts` | core | Adicionar icone research | S35-DASH-03 |
| CL-09 | `app/src/components/layout/sidebar.tsx` | core | Adicionar "Deep Research" | S35-DASH-03 |
| CL-10 | `app/src/lib/intelligence/predictive/engine.ts` | predictive (pre-existente S25) | Refatorar `forecastCohortROI` | S35-PRED-03 |

---

## PODE LER (Referencia — NAO MODIFICAR)

### Utilitarios e Patterns

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-01 | `app/src/lib/utils/api-response.ts` | `createApiError(status, message, details?)` / `createApiSuccess(data)` — pattern obrigatorio |
| L-02 | `app/src/lib/auth/brand-guard.ts` | `requireBrandAccess(req, brandId)` — guard obrigatorio. **IMPORT: `@/lib/auth/brand-guard`** |

### Firebase & Data

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-03 | `app/src/lib/firebase/config.ts` | `db` — instancia Firestore. `Timestamp` de `firebase/firestore` |
| L-04 | `app/src/lib/firebase/firestore.ts` | `getBrand(brandId)` — busca dados da marca |
| L-05 | `app/src/lib/firebase/vault.ts` | Pattern subcollection `brands/{brandId}/secrets` |
| L-06 | `app/src/lib/firebase/personalization.ts` | Pattern subcollection + Firestore CRUD (referencia) |

### AI & Prompts

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-07 | `app/src/lib/ai/gemini.ts` | `generateWithGemini(prompt, options?)` — responseMimeType, systemPrompt, temperature |
| L-08 | `app/src/lib/ai/prompts/social-generation.ts` | Referencia de pattern (prompts exportados como constantes) |
| L-09 | `app/src/lib/ai/prompts/performance-advisor.ts` | Referencia de pattern (prompt builder com secoes condicionais) |

### MCP Adapters (Referencia para Research)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-10 | `app/src/lib/mcp/router.ts` | MCP Router — executeMcpTool() para chamar adapters |
| L-11 | `app/src/lib/mcp/adapters/exa.ts` | ExaAdapter — semantic_search, link_discovery, trend_analysis |
| L-12 | `app/src/lib/mcp/adapters/firecrawl.ts` | FirecrawlAdapter — url_to_markdown, full_scrape |

### Intelligence (Referencia para Predictive)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-13 | `app/src/lib/intelligence/personalization/propensity.ts` | PropensityEngine — hot/warm/cold scoring (base para churn) |
| L-14 | `app/src/lib/intelligence/predictive/engine.ts` | PredictionEngine scaffold existente (forecastCohortROI — sera refatorado) |
| L-15 | `app/src/components/intelligence/predictive/ScaleSimulator.tsx` | UI existente do ScaleSimulator (sera refatorada em DASH-01) |

### Performance (Referencia para GOV-02)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-16 | `app/src/lib/hooks/use-segment-performance.ts` | Hook useSegmentPerformance (referencia para drill-down) |
| L-17 | `app/src/components/performance/segment-breakdown.tsx` | SegmentBreakdown component (alvo do drill-down) |
| L-18 | `app/src/components/performance/segment-filter.tsx` | SegmentFilter component (source do selectedSegment) |
| L-19 | `app/src/components/performance/war-room-dashboard.tsx` | War Room Dashboard (referencia layout) |
| L-20 | `app/src/components/performance/alert-center.tsx` | Alert Center (referencia pattern de alertas) |
| L-21 | `app/src/lib/performance/engine/performance-advisor.ts` | PerformanceAdvisor (referencia para integrar segmentData) |

### Types (Referencia)

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-22 | `app/src/types/predictive.ts` | Types existentes do PredictionEngine (sera expandido em PRED-01) |
| L-23 | `app/src/types/performance.ts` | Types performance (stubs a documentar em GOV-04) |
| L-24 | `app/src/types/intelligence.ts` | Types intelligence (stubs a documentar em GOV-04) |

### Layout & UI

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-25 | `app/src/lib/guards/resolve-icon.ts` | Fallback de icones — referencia |
| L-26 | `app/src/app/intelligence/offer-lab/page.tsx` | Referencia de pattern (pagina Intelligence) |

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
| P-09 | ZERO chamada Gemini no ChurnPredictor | Modelo deterministico puro (PB-01) |
| P-10 | ZERO LTV com valores hardcoded permanentes | Refatorar forecastCohortROI (PB-02) |
| P-11 | ZERO research sem cache check 24h | Sempre verificar antes de gerar (PB-03) |
| P-12 | ZERO research sem fallback | Graceful degradation obrigatorio (PB-04) |
| P-13 | ZERO batch churn sem limit 500 + paginacao | Safeguard performance (PB-05, DT-07) |
| P-14 | ZERO alerta sem threshold minimo (< 10 leads) | (PB-06) |
| P-15 | ZERO source sem attribution (URL + provider) | (PB-07) |
| P-16 | ZERO publicacao/execucao real | Engines read-only (PB-08) |
| P-17 | ZERO types Research em predictive.ts | Arquivo separado `types/research.ts` (DT-05 BLOCKING) |
| P-18 | ZERO research synthesis em single call | Pipeline chunked 2 fases (DT-12 BLOCKING) |

---

## DECISION TOPICS (DTs) — Resumo Rapido

| DT | Prioridade | Status | Resumo |
|:---|:-----------|:-------|:-------|
| DT-01 | **BLOCKING** | RESOLVIDO | `runTransaction()` com read+update completo no `updateVariantMetrics` |
| DT-02 | NON-BLOCKING | RESOLVIDO | Prop drilling direto (arvore pequena, sem Context) |
| DT-03 | NON-BLOCKING | RESOLVIDO | Mock leve MessageChannel + cleanup afterAll; `--forceExit` fallback |
| DT-04 | NON-BLOCKING | RESOLVIDO | Implement se consumer ativo; `@intentional-stub` se legado; remove se dead |
| DT-05 | **BLOCKING** | RESOLVIDO | `types/research.ts` separado (NAO expandir predictive.ts) |
| DT-06 | NON-BLOCKING | RESOLVIDO | Formula linear `daysSinceLastEvent / 30` com clamp [0,1] |
| DT-07 | **BLOCKING** | RESOLVIDO | Batch 500 + paginacao com cursor (`nextCursor`, `hasMore`) |
| DT-08 | **BLOCKING** | RESOLVIDO | LTV multipliers com defaults + override por brand em `predictive_config` |
| DT-09 | NON-BLOCKING | RESOLVIDO | Estimativa migracao baseada em churn risk (proxy, sem historico) |
| DT-10 | NON-BLOCKING | RESOLVIDO | Query Exa enriquecida com contexto |
| DT-11 | NON-BLOCKING | RESOLVIDO | `url_to_markdown` para quick/standard; `full_scrape` somente em deep |
| DT-12 | **BLOCKING** | RESOLVIDO | Synthesis chunked 2 fases (resumo por fonte + sintese final) |
| DT-13 | NON-BLOCKING | RESOLVIDO | shadcn Tabs via `@radix-ui/react-tabs` (ja no bundle) |
| DT-14 | NON-BLOCKING | RESOLVIDO | Recharts (ja importado no ScaleSimulator) |
| DT-15 | NON-BLOCKING | RESOLVIDO | Defaults constants + override em `predictive_config` |
| DT-16 | **BLOCKING** | RESOLVIDO | Criar contratos antes do contract-map ("Contract First") |

---

## MAPA DE DEPENDENCIAS (Ordem de Execucao)

```
Fase 0 (paralelos):
  GOV-01 ──┐
  GOV-02 ──┤
  GOV-03 ──┼──→ GATE-00
  GOV-04 ──┘
           │
Fase 1 (PRED-01 primeiro, depois paralelos):
  PRED-01 → PRED-02 ──┐
             PRED-03 ──┼──→ PRED-05 → GATE-01
             PRED-04 ──┘
                       │
Fase 2 (RES-01 primeiro, depois paralelos):
  RES-01 → RES-02 ──┐
           RES-03 ──┼──→ RES-04 → GATE-02
                    │
Fase 3 (paralelos):
  DASH-01 ──┐
  DASH-02 ──┤
  DASH-03 ──┼──→ GATE-03
  DASH-04 ──┘
             │
Fase 4 (sequencial):
  GOV-05 → GOV-06
```

---

## RESUMO DE IMPACTO

| Metrica | Valor |
|:--------|:------|
| Arquivos novos (CRIAR) | 21 |
| Arquivos existentes (MODIFICAR) | 13 |
| Arquivos de teste (CRIAR) | 3 |
| Arquivos de governanca (CRIAR/MODIFICAR) | 5 |
| Cross-lane touches | 10 |
| Arquivos de leitura (referencia) | 26 |
| **Total no escopo** | **42 arquivos** |

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 35: Predictive Intelligence & Deep Research | 09/02/2026*
*21 arquivos novos + 13 modificacoes + 3 test files + 5 governanca = 42 arquivos no escopo*
*26 arquivos de leitura (referencia)*
*10 cross-lane touches documentados (Arch Review Athos)*
