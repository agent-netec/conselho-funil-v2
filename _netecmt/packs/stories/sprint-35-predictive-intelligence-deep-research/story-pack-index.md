# Story Pack Index — Sprint 35: Predictive Intelligence & Deep Research

**Sprint:** 35
**Tipo:** Feature Sprint (Predictive Intelligence & Deep Research)
**SM:** Leticia
**Data:** 09/02/2026
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5 (Opcao B aprovada)
**PRD:** `_netecmt/solutioning/prd/prd-sprint-35-predictive-intelligence-deep-research.md`
**Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-35.md` — APROVADO COM RESSALVAS (16 DTs, 6 Blocking: DT-01, DT-05, DT-07, DT-08, DT-12, DT-16)

---

## Organizacao do Pack

| Arquivo | Conteudo |
|:--------|:---------|
| `story-pack-index.md` | Este arquivo (indice e visao geral) |
| `stories.md` | Stories detalhadas com acceptance criteria |
| `allowed-context.md` | Arquivos que Darllyson pode ler/modificar |

---

## Baseline pos-Sprint 34

| Metrica | Valor |
|:--------|:------|
| Testes passando | 302/302 (52 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | ~109 rotas (Next.js 16 Turbopack) |
| QA Score S34 | 98/100 (Aprovada com Ressalvas) |
| Auth cobertura | 100% — `requireBrandAccess` em 25+ rotas |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Stubs residuais | ~7 (performance.ts 4, intelligence.ts 2, embeddings.ts 1) |

---

## Fases e Sequencia

### Fase 0: Governanca & Backlog S34 (~2.5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S35-GOV-01 | Fix `updateVariantMetrics` com `runTransaction` (CS-34.04) | DT-01 (BLOCKING) | S (~30min) | — |
| S35-GOV-02 | Fix `selectedSegment` drill-down propagation (CS-34.09) | DT-02 | M (~1h) | — |
| S35-GOV-03 | Timer leak MessagePort — mock isolado + cleanup | DT-03 | S (~30min) | — |
| S35-GOV-04 | Cleanup 7 stubs residuais (implement/intentional-stub/remove) | DT-04 | S (~30min) | — |
| S35-GATE-00 | **Gate Check 0** | — | XS (~15min) | GOV-01, GOV-02, GOV-03, GOV-04 |

### Fase 1: Churn & LTV Prediction + Forecast (~7-9h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S35-PRED-01 | Types expandidos (`types/predictive.ts` + `types/research.ts` NOVO) | DT-05 (BLOCKING) | S (~30min) | S35-GATE-00 |
| S35-PRED-02 | Churn Predictor Engine + batch 500 + paginacao cursor | DT-06, DT-07 (BLOCKING) | L (~2.5h) | S35-PRED-01 |
| S35-PRED-03 | LTV Estimation Engine + refactor `forecastCohortROI` + config por brand | DT-08 (BLOCKING) | L (~2.5h) | S35-PRED-01 |
| S35-PRED-04 | Audience Behavior Forecasting + Gemini prompt narrativa | DT-09 | M+ (~1.5h) | S35-PRED-01, S35-PRED-02 |
| S35-PRED-05 | API routes `/api/intelligence/predictive/` (churn, ltv, forecast) | — | M (~1h) | S35-PRED-02, S35-PRED-03, S35-PRED-04 |
| S35-GATE-01 | **Gate Check 1** | — | XS (~15min) | S35-PRED-05 |

### Fase 2: Deep Research Engine (~6-7h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S35-RES-01 | Research Engine (Exa + Firecrawl pipeline) | DT-10, DT-11 | L (~2h) | S35-GATE-01, S35-PRED-01 (types/research.ts) |
| S35-RES-02 | Market Dossier Generator + Research prompts (chunked 2 fases) | DT-12 (BLOCKING) | M+ (~1.5h) | S35-RES-01 |
| S35-RES-03 | Research Storage Firestore + cache 24h | — | M (~1h) | S35-PRED-01 (types/research.ts) |
| S35-RES-04 | API route `/api/intelligence/research/` (POST generate + GET list) | — | S (~30min) | S35-RES-01, S35-RES-02, S35-RES-03 |
| S35-GATE-02 | **Gate Check 2** | — | XS (~15min) | S35-RES-04 |

### Fase 3: Predictive Dashboard & Alerts + Research UI (~4-5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S35-DASH-01 | ScaleSimulator Upgrade — dashboard preditivo com 5 tabs | DT-13, DT-14 | L (~2h) | S35-GATE-02, S35-PRED-05 |
| S35-DASH-02 | Predictive Alerts (alert-generator + UI) | DT-15 | M (~1h) | S35-PRED-02, S35-PRED-03, S35-PRED-04 |
| S35-DASH-03 | Research Results UI (page + dossier-viewer + sidebar) | — | M (~1h) | S35-RES-04 |
| S35-DASH-04 | Hook `usePredictiveData` | — | S (~30min) | S35-PRED-05 |
| S35-GATE-03 | **Gate Check 3** | — | XS (~15min) | S35-DASH-01, S35-DASH-02, S35-DASH-03, S35-DASH-04 |

### Fase 4: Governanca Final (~0.5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S35-GOV-05 | Contratos + Contract-map update — lanes `predictive_intelligence` + `deep_research` | DT-16 (BLOCKING) | S (~30min) | S35-GATE-03 |
| S35-GOV-06 | ACTIVE_SPRINT.md + ROADMAP.md (resultado final) | — | XS (~15min) | S35-GOV-05 |

---

## Resumo de Esforco

| Fase | Stories | Esforco Total |
|:-----|:--------|:-------------|
| Fase 0 (Governanca S34) | 4 + gate | ~2.5h |
| Fase 1 (Churn & LTV Prediction + Forecast) | 5 + gate | ~7-9h + 15min |
| Fase 2 (Deep Research Engine) | 4 + gate | ~6-7h + 15min |
| Fase 3 (Dashboard & Alerts + Research UI) | 4 + gate | ~4-5h + 15min |
| Fase 4 (Governanca Final) | 2 | ~45min |
| **Total** | **19 stories + 4 gates** | **~20-24h** |

---

## Blocking DTs (Pre-flight — Darllyson DEVE compreender antes de comecar)

- [ ] **DT-01 (BLOCKING — GOV-01):** `updateVariantMetrics` DEVE usar `runTransaction()` com leitura do doc e update completo das variantes + totais. NAO usar `increment()` fora de transacao. `transaction.update()` com objeto completo dos campos calculados localmente.
- [ ] **DT-05 (BLOCKING — PRED-01):** Types de Research DEVEM ir em `types/research.ts` NOVO, NAO em `types/predictive.ts`. Research e dominio separado de predictive; reduz acoplamento e simplifica contract-map por lane.
- [ ] **DT-07 (BLOCKING — PRED-02):** ChurnPredictor DEVE limitar a 500 leads por request E implementar paginacao com cursor (`nextCursor`, `hasMore`). Resposta paginada obrigatoria.
- [ ] **DT-08 (BLOCKING — PRED-03):** LTV multipliers DEVEM ter defaults hardcoded + override por brand em Firestore (`brands/{brandId}/predictive_config`). RNF-35.11 exige configuravel.
- [ ] **DT-12 (BLOCKING — RES-02):** Research synthesis DEVE ser chunked em 2 fases: (1) resumo por fonte com cap por tokens, (2) sintese final com os resumos. Evita estouro de tokens e melhora consistencia do output JSON.
- [ ] **DT-16 (BLOCKING — GOV-05):** DEVEM ser criados os contratos `predictive-intelligence-spec.md` + `deep-research-spec.md` em `_netecmt/contracts/` ANTES de atualizar o `contract-map.yaml`. "Contract First" obrigatorio.

---

## Non-Blocking DTs (Incorporados nas stories)

| DT | Decisao | Story |
|:---|:--------|:------|
| DT-02 | Prop drilling direto (arvore pequena, sem Context dedicado) | S35-GOV-02 |
| DT-03 | Mock leve MessageChannel + cleanup afterAll; `--forceExit` como fallback `@known-issue` | S35-GOV-03 |
| DT-04 | Implement se consumer ativo; `@intentional-stub` se legado; remove se dead code | S35-GOV-04 |
| DT-06 | Formula linear `daysSinceLastEvent / 30` com clamp [0,1] | S35-PRED-02 |
| DT-09 | Estimativa baseada em churn risk atual (proxy) com smoothing | S35-PRED-04 |
| DT-10 | Query Exa enriquecida com contexto (topic + segment + keywords + ano) | S35-RES-01 |
| DT-11 | `url_to_markdown` para quick/standard; `full_scrape` apenas em deep (1-2 dominios) | S35-RES-01 |
| DT-13 | `@radix-ui/react-tabs` via shadcn (ja no bundle) | S35-DASH-01 |
| DT-14 | Recharts (ja importado no ScaleSimulator) | S35-DASH-01 |
| DT-15 | Defaults em constants + override em `predictive_config` | S35-DASH-02 |

---

## Inventario de Stubs (GOV-04 — DT-04)

| Arquivo | Stub | Acao |
|:--------|:-----|:-----|
| `types/performance.ts` | `PerformanceConfig.thresholds?` | `@intentional-stub` (sem consumer ativo) |
| `types/performance.ts` | `PerformanceConfig.minDataPoints?` | `@intentional-stub` (sem consumer ativo) |
| `types/performance.ts` | `PerformanceMetricDoc` | `@intentional-stub` (compatibilidade legada) |
| `types/performance.ts` | `PerformanceAlertDoc` | `@intentional-stub` (compatibilidade legada) |
| `types/intelligence.ts` | `SemanticSearchResult` | `@intentional-stub` (placeholder) |
| `types/intelligence.ts` | `MonitoringSource` | `@intentional-stub` (placeholder) |
| `lib/ai/embeddings.ts` | `cosineSimilarity` | **Remover anotacao @stub** (ja funcional) |

---

## Gate Checks (4 obrigatorios)

| Gate | Pre-requisito | Criterio |
|:-----|:-------------|:---------|
| S35-GATE-00 | Fase 0 completa | tsc=0, testes passam (>= 302), `updateVariantMetrics` com `runTransaction`, `selectedSegment` propaga drill-down, timer leak mock/documentado, 7 stubs resolvidos (implement/intentional-stub/remove) |
| S35-GATE-01 | Fase 1 completa | 3 engines funcionais (ChurnPredictor + LTVEstimator + AudienceForecaster), 3 APIs retornam dados, types compilam, paginacao churn funcional, LTV multipliers configuraveis por brand, tsc=0, testes passam |
| S35-GATE-02 | Fase 2 completa | ResearchEngine gera dossie funcional (Exa + Firecrawl + Gemini chunked), cache 24h funciona, API POST gera + GET lista, graceful degradation testado, tsc=0, testes passam |
| S35-GATE-03 | Fase 3 completa | Dashboard renderiza 5 tabs (Visao Geral, Churn, LTV, Forecast, Simulador), alertas preditivos funcionam, Research UI com formulario + dossier viewer, sidebar com "Deep Research", hook `usePredictiveData` retorna dados, tsc=0, testes passam |

---

## Success Criteria (CS-35.01 a CS-35.25)

| ID | Criterio | Verificacao | Story |
|:---|:---------|:-----------|:------|
| CS-35.01 | `updateVariantMetrics` usa `runTransaction` | Code review: `lib/firebase/ab-tests.ts` com `runTransaction()` | S35-GOV-01 |
| CS-35.02 | `selectedSegment` propaga drill-down para todas as visoes | Visual: mudar filtro atualiza SegmentBreakdown + Advisor + Charts | S35-GOV-02 |
| CS-35.03 | Timer leak resolvido (ou documentado como `@known-issue`) | Test runner: zero warnings MessagePort OU `@known-issue` documentado | S35-GOV-03 |
| CS-35.04 | 7 stubs resolvidos (implementados ou documentados `@intentional-stub`) | Code review: zero stubs sem documentacao | S35-GOV-04 |
| CS-35.05 | ChurnPredictor retorna `ChurnBatchResult` funcional | Teste: `predictBatch(brandId)` retorna predictions com churnRisk 0-1 | S35-PRED-02 |
| CS-35.06 | Churn scoring respeita recencia + engagement + inatividade | Teste: lead com 20d sem evento tem churnRisk > lead com 2d sem evento | S35-PRED-02 |
| CS-35.07 | ChurnPredictor limita batch a 500 leads com paginacao cursor | Teste: brand com 600 leads retorna max 500 + `nextCursor` + `hasMore: true` | S35-PRED-02 |
| CS-35.08 | LTVEstimator retorna `LTVBatchResult` funcional | Teste: `estimateBatch(brandId)` retorna cohorts com projectedLTV | S35-PRED-03 |
| CS-35.09 | LTV multipliers diferem por segmento E sao configuraveis | Teste: hot projectedLTV > warm > cold; override por brand funciona | S35-PRED-03 |
| CS-35.10 | `forecastCohortROI` refatorado (sem hardcoded baseLtv) | Code review: `PredictionEngine.forecastCohortROI` usa `LTVEstimator` | S35-PRED-03 |
| CS-35.11 | AudienceForecaster retorna projecoes 7/14/30d | Teste: `forecast(brandId)` retorna projections com 3 timeframes | S35-PRED-04 |
| CS-35.12 | AudienceForecaster inclui narrativa Gemini | Teste: `trendsNarrative` e string nao-vazia em PT-BR | S35-PRED-04 |
| CS-35.13 | API `/predictive/churn` funcional com auth | Teste: POST retorna 200 com brandId valido, 403 sem auth | S35-PRED-05 |
| CS-35.14 | API `/predictive/ltv` funcional com auth | Teste: POST retorna 200 com brandId valido, 403 sem auth | S35-PRED-05 |
| CS-35.15 | API `/predictive/forecast` funcional com auth | Teste: POST retorna 200 com brandId valido, 403 sem auth | S35-PRED-05 |
| CS-35.16 | ResearchEngine gera dossie completo (chunked 2 fases) | Teste: `generateDossier(query)` retorna MarketDossier com todas as secoes | S35-RES-01/02 |
| CS-35.17 | Research cache 24h funciona | Teste: segunda chamada com mesmo topic retorna cache (< 500ms) | S35-RES-03 |
| CS-35.18 | Research graceful degradation | Teste: com Exa mockado para falhar, engine retorna `status: 'failed'` sem crash | S35-RES-01 |
| CS-35.19 | API `/intelligence/research` POST + GET funcional | Teste: POST gera dossie, GET lista dossies por brandId | S35-RES-04 |
| CS-35.20 | Dashboard preditivo com 5 tabs | Visual: Visao Geral, Churn, LTV, Forecast, Simulador renderizam | S35-DASH-01 |
| CS-35.21 | Predictive Alerts funcionam | Teste: com dados de churn mock (3+ hot at-risk), alerta `churn_imminent` gerado | S35-DASH-02 |
| CS-35.22 | Research UI com formulario + dossier viewer | Visual: formulario submete, dossie renderiza com secoes colapsiveis | S35-DASH-03 |
| CS-35.23 | Contract-map com lanes `predictive_intelligence` + `deep_research` | Code review: `contract-map.yaml` atualizado | S35-GOV-05 |
| CS-35.24 | Isolamento multi-tenant em TODAS as features novas | Code review: zero query sem brandId | ALL |
| CS-35.25 | Hook `usePredictiveData` retorna dados das 3 APIs | Teste: hook retorna churn + ltv + forecast em paralelo | S35-DASH-04 |

---

## Proibicoes (P-01 a P-08 herdadas + PB-01 a PB-08 novas)

### Herdadas (desde Sigma)

| ID | Proibicao |
|:---|:----------|
| P-01 | ZERO `any` em codigo novo |
| P-02 | ZERO `firebase-admin` ou `google-cloud/*` |
| P-03 | ZERO SDK npm novo (REST puro via `fetch()`) |
| P-04 | ZERO mudanca fora do allowed-context |
| P-05 | ZERO `@ts-ignore` ou `@ts-expect-error` |
| P-06 | ZERO `Date` — usar `Timestamp` do Firestore |
| P-07 | ZERO rota sem `force-dynamic` (quando dinamica) |
| P-08 | ZERO acesso cross-tenant (brandId obrigatorio) |

### Novas S35 (PRD + Athos)

| ID | Proibicao |
|:---|:----------|
| PB-01 | ZERO chamada Gemini no Churn Predictor — modelo deterministico puro (regras, sem IA generativa) |
| PB-02 | ZERO LTV com valores hardcoded — refatorar `forecastCohortROI` para usar dados reais |
| PB-03 | ZERO research sem cache check — sempre verificar cache 24h antes de gerar novo dossie |
| PB-04 | ZERO research sem fallback — falha em Exa/Firecrawl NAO pode causar crash (graceful degradation) |
| PB-05 | ZERO batch de churn sem limit — maximo 500 leads por request com paginacao cursor (DT-07) |
| PB-06 | ZERO alerta preditivo sem threshold minimo — nao gerar alertas com < 10 leads no segmento |
| PB-07 | ZERO source de research sem attribution — todas as fontes devem ter URL e provider registrados |
| PB-08 | ZERO publicacao/execucao real — engines preditivos sao read-only (analise e projecao, nao acao) |

---

## Mapa de Dependencias (Ordem de Execucao)

```
Fase 0 (paralelos — sem dependencia mutua):
  GOV-01 ──┐
  GOV-02 ──┤
  GOV-03 ──┼──→ GATE-00
  GOV-04 ──┘
           │
Fase 1 (sequencial com paralelos):
  PRED-01 → PRED-02 ──┐
             PRED-03 ──┼──→ PRED-05 → GATE-01
             PRED-04 ──┘
                       │
Fase 2 (sequencial com paralelos):
  RES-01 → RES-02 ──┐
           RES-03 ──┼──→ RES-04 → GATE-02
                    │
Fase 3 (paralelos com merge):
  DASH-01 ──┐
  DASH-02 ──┤
  DASH-03 ──┼──→ GATE-03
  DASH-04 ──┘
             │
Fase 4 (sequencial):
  GOV-05 → GOV-06
```

---

## Riscos Arquiteturais (Athos)

| Risco | Prob. | Impacto | Mitigacao |
|:------|:------|:--------|:----------|
| Estouro de tokens na sintese Research | Media | Medio | DT-12: pipeline chunked + truncamento por fonte |
| Pesquisa lenta em brands grandes | Media | Medio | Batch 500 + paginacao (DT-07) |
| Cache Research sem index composto | Media | Alto | Criar index `topic + expiresAt + generatedAt` no Firestore |
| URLs maliciosas em fontes | Baixa | Alto | Validar http/https e bloquear localhost/ips privados |
| Dados insuficientes para LTV | Media | Baixo | confidenceScore e defaults; degradacao graciosa |
| Exa MCP indisponivel durante dev/test | Media | Alto | Mock do ExaAdapter para testes. Fallback `status: 'failed'` |
| Firecrawl timeout em URLs protegidas | Alta | Medio | Firecrawl → Jina → snippet Exa. Graceful degradation. |
| Timer leak nao resolvivel completamente | Alta | Baixo | `@known-issue` + `--forceExit` (nao bloqueante) |

---

## Pre-requisitos Infra (Documentar ANTES da Fase 2)

| # | Pre-requisito | Fase | Acao |
|:--|:-------------|:-----|:-----|
| INFRA-01 | Firestore composite index: `research` subcollection — `topic` ASC + `expiresAt` ASC + `generatedAt` DESC | Fase 2 | Criar index no console Firebase OU documentar para deploy. Cache query falha sem ele. |

---

*Story Pack preparado por Leticia (SM) | Sprint 35 | 09/02/2026*
*19 stories + 4 Gates | 6 Blocking DTs (DT-01, DT-05, DT-07, DT-08, DT-12, DT-16) | 16 DTs total incorporados*
*Estimativa ajustada (Athos): ~20-24h*
