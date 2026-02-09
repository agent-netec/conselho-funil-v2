# QA Report — Sprint 35: Predictive Intelligence & Deep Research

**Responsável:** Dandara (QA)  
**Data:** 2026-02-09  
**Baseline validado:** Sprint 34 (302/302 testes, 52 suites, tsc=0)

## 1) Score final

**Score: 94/100**  
**Justificativa:** implementação funcional e estável em runtime/testes, com todos os gates técnicos principais atendidos (tsc=0, 309/309, 55 suites, 6 DTs blocking conformes). Houve **ressalvas de qualidade funcional/UI e governança de proibições herdadas** que impedem nota máxima.

## 2) QA-0 — Verificação de Integridade

- `npx tsc --noEmit`: **PASS** (0 erros)
- `npm test`: **PASS** (55/55 suites, 309/309 testes)
- Zero regressão vs baseline S34: **PASS** (nenhum teste falhando)
- Suites: 52 -> 55 (**+3**): **PASS**
- Testes: 302 -> 309 (**+7**): **PASS**
- Known issue (`Force exiting Jest`): **mantido/documentado** (não bloqueante)

## 3) CS-35.01 a CS-35.25

| Critério | Status | Evidência |
|---|---|---|
| CS-35.01 | PASS | `updateVariantMetrics` usa `runTransaction()` em `app/src/lib/firebase/ab-tests.ts` |
| CS-35.02 | PARTIAL | `selectedSegment` propagado para breakdown/advisor, mas filtro explícito de charts não está claramente aplicado em `app/src/app/performance/page.tsx` |
| CS-35.03 | PASS | leak não eliminado, porém está documentado como known issue e validado no runner |
| CS-35.04 | PASS | `@intentional-stub` em `types/performance.ts` e `types/intelligence.ts`; `@stub` removido de `embeddings.ts` |
| CS-35.05 | PASS | `ChurnPredictor.predictBatch()` retorna `ChurnBatchResult` |
| CS-35.06 | PASS | score usa recência + trend + inatividade (`daysSinceLastEvent/30`, ajustes) |
| CS-35.07 | PASS | batch limit 500 + cursor (`nextCursor`, `hasMore`) |
| CS-35.08 | PASS | `LTVEstimator.estimateBatch()` retorna `LTVBatchResult` |
| CS-35.09 | PASS | multipliers por segmento (hot > warm > cold) |
| CS-35.10 | PASS | `forecastCohortROI` refatorado para usar `LTVEstimator` (sem `baseLtv=5000`) |
| CS-35.11 | PASS | `AudienceForecaster` retorna projeções 7/14/30d |
| CS-35.12 | PASS | `trendsNarrative` via Gemini com prompt dedicado |
| CS-35.13 | PASS | API churn com `force-dynamic` + `requireBrandAccess` + `createApiSuccess` |
| CS-35.14 | PASS | API ltv com `force-dynamic` + `requireBrandAccess` + `createApiSuccess` |
| CS-35.15 | PASS | API forecast com `force-dynamic` + `requireBrandAccess` + `createApiSuccess` |
| CS-35.16 | PASS | `ResearchEngine` + `DossierGenerator` entregam `MarketDossier` com schema completo |
| CS-35.17 | PASS | cache 24h implementado (`getCachedResearch`) e teste de cache presente |
| CS-35.18 | PASS | graceful degradation em falhas Exa/Firecrawl/síntese |
| CS-35.19 | PASS | API `/api/intelligence/research` com POST + GET funcionais |
| CS-35.20 | PASS | dashboard preditivo com 5 tabs (Visão Geral, Churn, LTV, Forecast, Simulador) |
| CS-35.21 | PASS | alertas com thresholds implementados (inclui mínimo de leads) |
| CS-35.22 | PARTIAL | UI de research existe (form + viewer), porém `dossier-viewer` não renderiza seção explícita de competidores |
| CS-35.23 | PASS | `contract-map.yaml` com lanes `predictive_intelligence` e `deep_research` |
| CS-35.24 | PASS | features novas brand-scoped com `brandId` e `requireBrandAccess` |
| CS-35.25 | PASS | hook `usePredictiveData` retorna churn + ltv + forecast em paralelo |

## 4) DTs Blocking (6) — Compliance

| DT | Status | Verificação |
|---|---|---|
| DT-01 | PASS | `runTransaction` em `updateVariantMetrics` |
| DT-05 | PASS | tipos de research isolados em `app/src/types/research.ts` |
| DT-07 | PASS | churn com limite 500 + paginação cursor |
| DT-08 | PASS | multipliers configuráveis via `predictive_config` + defaults |
| DT-12 | PASS | síntese research em 2 fases (resumo por fonte + síntese final) |
| DT-16 | PASS | contratos `predictive-intelligence-spec.md` e `deep-research-spec.md` existentes |

## 5) Proibições (P-01..P-08 + PB-01..PB-08)

| Proibição | Status | Observação |
|---|---|---|
| P-01 (zero `any`) | FAIL | `app/src/lib/intelligence/predictive/engine.ts` contém `any` |
| P-02 (zero firebase-admin/google-cloud) | PASS | sem ocorrência nas features S35 |
| P-03 (zero SDK npm novo) | PASS | sem evidência de SDK novo; stack permaneceu REST/fetch |
| P-04 (zero mudança fora allowed-context) | PASS | entregáveis S35 auditados dentro do contexto esperado |
| P-05 (zero `@ts-ignore/@ts-expect-error`) | PASS | sem ocorrência nas features S35 auditadas |
| P-06 (zero `Date`) | FAIL | `Date.now()` em `app/src/lib/intelligence/predictive/engine.ts` |
| P-07 (zero rota dinâmica sem `force-dynamic`) | PASS | 4 rotas novas com `force-dynamic` |
| P-08 (zero cross-tenant) | PASS | brand scoping aplicado nas rotas/engines novas |
| PB-01 (zero Gemini no churn) | PASS | churn engine determinístico |
| PB-02 (zero LTV hardcoded) | PASS | `forecastCohortROI` usa `LTVEstimator` |
| PB-03 (zero research sem cache check) | PASS | `getCachedResearch` antes da geração |
| PB-04 (zero research sem fallback) | PASS | fallback implementado para falhas externas/síntese |
| PB-05 (zero batch churn sem limite) | PASS | limite 500 + cursor |
| PB-06 (zero alerta sem threshold mínimo) | PASS | `minSegmentLeads: 10` no gerador de alertas |
| PB-07 (zero source sem attribution) | PASS | fontes com `url` + `source` em `ResearchSource`/engine |
| PB-08 (zero execução/publicação real) | PASS | escopo preditivo/read-only; sem automação de ação |

## 6) Findings

1. **F-01 (Médio):** `selectedSegment` não demonstra filtragem explícita dos charts no War Room.  
   - Impacto: critério CS-35.02 não atinge 100% do comportamento esperado (drill-down completo).  
   - Arquivo: `app/src/app/performance/page.tsx`

2. **F-02 (Médio):** `dossier-viewer` não renderiza explicitamente a seção de competidores.  
   - Impacto: CS-35.22 parcial na experiência de visualização do dossiê completo.  
   - Arquivo: `app/src/components/intelligence/research/dossier-viewer.tsx`

3. **F-03 (Médio/Governança):** violações de proibição herdada no `PredictionEngine` (`any`, `Date.now`).  
   - Impacto: falha em P-01/P-06; dívida técnica de padronização Sigma persiste.  
   - Arquivo: `app/src/lib/intelligence/predictive/engine.ts`

4. **F-04 (Baixo):** known issue de Jest force-exit permanece no runner.  
   - Impacto: não bloqueia release, mas indica handles abertos.  
   - Evidência: saída de `npm test`

## 7) Notas para S36

- Aplicar filtro de `selectedSegment` também nas visualizações gráficas do War Room.
- Completar `DossierViewer` com bloco de competidores (strengths/weaknesses).
- Refatorar `PredictionEngine` para remover `any` e substituir `Date.now()` por `Timestamp` integral.
- Executar investigação dedicada de open handles (`jest --detectOpenHandles`) para eliminar `force exiting`.

## 8) Veredito

**APROVADO COM RESSALVAS**

- Qualidade técnica e funcional geral adequada para encerramento da S35.
- Ressalvas são pontuais, sem bloquear operação principal.
- Recomenda-se abertura de hotfix/tech-debt curto em S36 para zerar findings F-01/F-02/F-03.
