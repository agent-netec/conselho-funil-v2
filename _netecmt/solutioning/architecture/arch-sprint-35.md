# Architecture Review: Sprint 35 — Predictive Intelligence & Deep Research

**Versao:** 1.0  
**Responsavel:** Athos (Architect)  
**Status:** APROVADO COM RESSALVAS (15 DTs originais + 1 DT adicional, 5 Blocking)  
**Data:** 09/02/2026  
**PRD Referencia:** `prd-sprint-35-predictive-intelligence-deep-research.md` (Iuran)  
**Baseline:** Sprint 34 concluida (QA 98/100, 302/302 testes, 52 suites, tsc=0, ~109 rotas)

---

## 1. Escopo do Review

Validacao arquitetural de 4 frentes:
- **S35-GOV:** Backlog S34 + 7 stubs
- **S35-PRED:** Churn, LTV, Forecast, APIs
- **S35-RES:** Deep Research Engine (Exa + Firecrawl + Gemini) + storage
- **S35-DASH:** Dashboard preditivo, alertas e Research UI

### 1.1 Documentos e Codigo Analisados

| Documento/Codigo | Status |
|:-----------------|:-------|
| PRD Sprint 35 | Lido integralmente — 604 linhas |
| ACTIVE_SPRINT.md | Lido |
| ROADMAP.md | Lido |
| SPRINT_HISTORY.md | Lido |
| contract-map.yaml | Lido |
| project-context.md | Lido (brownfield confirmado) |
| `lib/intelligence/predictive/engine.ts` | Lido |
| `types/predictive.ts` | Lido |
| `components/intelligence/predictive/ScaleSimulator.tsx` | Lido |
| `lib/firebase/ab-tests.ts` | Lido |
| `app/performance/page.tsx` | Lido |
| `jest.setup.js` | Lido |
| `types/performance.ts` | Lido |
| `types/intelligence.ts` | Lido |
| `lib/ai/embeddings.ts` | Lido |
| `lib/mcp/adapters/exa.ts` | Lido |
| `lib/mcp/adapters/firecrawl.ts` | Lido |
| `lib/mcp/router.ts` | Lido |
| `lib/ai/gemini.ts` | Lido |
| `lib/intelligence/personalization/propensity.ts` | Lido |

---

## 2. Decision Topics (DT-01 a DT-15)

### DT-01: `runTransaction` scope em `updateVariantMetrics` (BLOCKING)
**Decisao:** Usar `runTransaction()` com leitura do doc e update completo das variantes + totais.  
**Justificativa:** Atualiza array de variantes e totais no mesmo commit atomico; evita `increment()` fora de transacao e evita inconsistencias concorrentes.  
**Nota tecnica:** `transaction.update()` com objeto completo dos campos calculados localmente.

### DT-02: `selectedSegment` state (NON-BLOCKING)
**Decisao:** Prop drilling direto a partir da Performance page.  
**Justificativa:** Arvore pequena, menos complexidade que Context dedicado. Mantem debug simples e evita estado global desnecessario.

### DT-03: Timer leak (NON-BLOCKING)
**Decisao:** Mock leve de `MessageChannel` com cleanup em `afterAll`; manter `--forceExit` apenas como fallback documentado (`@known-issue`).  
**Justificativa:** O polyfill real atual (node:worker_threads) e a origem do leak; mock reduz side effects e permite teardown explicito.

### DT-04: 7 stubs — criterio (NON-BLOCKING)
**Decisao:**  
- **Implementar** se o stub possui consumer ativo.  
- **Marcar `@intentional-stub`** com sprint e justificativa se for compatibilidade legada sem consumer.  
- **Remover** se dead code.  
**Justificativa:** Alinha com governanca S26 e reduz ruido futuro.

### DT-05: Types de Research (BLOCKING)
**Decisao:** Criar `app/src/types/research.ts` e mover `ResearchQuery`, `ResearchSource`, `MarketDossier` para la.  
**Justificativa:** Research e dominio separado de predictive; reduz acoplamento e simplifica contract-map por lane (`deep_research`).

### DT-06: Churn scoring (NON-BLOCKING)
**Decisao:** Formula linear base `daysSinceLastEvent / 30`, com clamp [0,1] e ajustes por trend e segmento.  
**Justificativa:** Simples, auditavel e consistente com o Propensity Engine (S28). Exponencial adiciona opacidade sem ganho claro em v1.

### DT-07: Batch size (BLOCKING)
**Decisao:** Limite 500 por request com paginacao via cursor (`nextCursor`, `hasMore`).  
**Justificativa:** Escala para brands grandes sem quebrar RNF-35.03; paginacao evita tempo de execucao excessivo.

### DT-08: LTV multipliers (BLOCKING)
**Decisao:** Defaults hardcoded + override por brand em Firestore (`brands/{brandId}/predictive_config`).  
**Justificativa:** RNF-35.11 exige configuravel, mas defaults garantem cold start sem complexidade extra.

### DT-09: Migration rate (NON-BLOCKING)
**Decisao:** Estimativa baseada em churn risk atual (proxy) com smoothing e clamp.  
**Justificativa:** Nao ha snapshots historicos; proxy e suficiente para v1 e consistente com modelo deterministico.

### DT-10: Exa query (NON-BLOCKING)
**Decisao:** Query enriquecida com contexto (topic + segment + keywords de mercado e ano).  
**Justificativa:** Melhora relevancia e reduz ruído de resultados genericos.

### DT-11: Firecrawl depth (NON-BLOCKING)
**Decisao:**  
- `quick/standard`: `url_to_markdown`  
- `deep`: `url_to_markdown` + `full_scrape` apenas em 1-2 domínios quando necessario  
**Justificativa:** Balanceia latencia e cobertura; `full_scrape` e caro e tende a timeout.

### DT-12: Research synthesis (BLOCKING)
**Decisao:** Pipeline chunked em 2 fases:  
1) Resumo por fonte (cap por tokens).  
2) Sintese final com os resumos.  
**Justificativa:** Evita estouro de tokens e melhora consistencia do output JSON.

### DT-13: Dashboard tabs (NON-BLOCKING)
**Decisao:** Usar `@radix-ui/react-tabs` via shadcn.  
**Justificativa:** Ja no bundle, padrao consistente com UI existente.

### DT-14: Charts (NON-BLOCKING)
**Decisao:** Recharts.  
**Justificativa:** Ja utilizado no ScaleSimulator, reduz custo de implementacao.

### DT-15: Alert thresholds (NON-BLOCKING)
**Decisao:** Defaults em constants + override em `predictive_config`.  
**Justificativa:** Flexivel sem overengineering; permite ajuste por marca.

---

## 3. DT Adicional (Athos)

### DT-16: Lanes novas exigem contratos (BLOCKING - Governanca Final)
**Decisao:** Criar contratos:
- `_netecmt/contracts/predictive-intelligence-spec.md`
- `_netecmt/contracts/deep-research-spec.md`

**Justificativa:** "Contract First" e pre-requisito para atualizar o `contract-map.yaml` com novas lanes.

---

## 4. Inventario de Stubs (GOV-04)

| Arquivo | Stub | Acao |
|:--------|:-----|:-----|
| `types/performance.ts` | `PerformanceConfig.thresholds?` | **Intentional-stub** (se sem consumer) ou implementar no AnomalyEngine |
| `types/performance.ts` | `PerformanceConfig.minDataPoints?` | **Intentional-stub** (se sem consumer) ou implementar no AnomalyEngine |
| `types/performance.ts` | `PerformanceMetricDoc` | **Intentional-stub** (compatibilidade legada) |
| `types/performance.ts` | `PerformanceAlertDoc` | **Intentional-stub** (compatibilidade legada) |
| `types/intelligence.ts` | `SemanticSearchResult` | **Intentional-stub** (placeholder) |
| `types/intelligence.ts` | `MonitoringSource` | **Intentional-stub** (placeholder) |
| `lib/ai/embeddings.ts` | `cosineSimilarity` | **Implementado** — remover anotacao `@stub` (ja funcional) |

---

## 5. Allowed-Context (Darllyson)

Lista exata de arquivos permitidos para leitura/modificacao nesta sprint:

- `app/src/lib/intelligence/predictive/engine.ts`
- `app/src/lib/intelligence/predictive/churn-predictor.ts`
- `app/src/lib/intelligence/predictive/ltv-estimator.ts`
- `app/src/lib/intelligence/predictive/audience-forecaster.ts`
- `app/src/lib/intelligence/predictive/alert-generator.ts`
- `app/src/lib/intelligence/research/engine.ts`
- `app/src/lib/firebase/research.ts`
- `app/src/lib/firebase/ab-tests.ts`
- `app/src/lib/ai/prompts/predictive-forecast.ts`
- `app/src/lib/ai/prompts/research-synthesis.ts`
- `app/src/lib/ai/gemini.ts`
- `app/src/lib/ai/embeddings.ts`
- `app/src/lib/mcp/router.ts`
- `app/src/lib/mcp/adapters/exa.ts`
- `app/src/lib/mcp/adapters/firecrawl.ts`
- `app/src/lib/hooks/use-predictive-data.ts`
- `app/src/lib/hooks/use-segment-performance.ts`
- `app/src/lib/performance/engine/performance-advisor.ts`
- `app/src/lib/ai/prompts/performance-advisor.ts`
- `app/src/lib/intelligence/personalization/propensity.ts`
- `app/src/types/predictive.ts`
- `app/src/types/research.ts` (novo)
- `app/src/types/performance.ts`
- `app/src/types/intelligence.ts`
- `app/src/app/api/intelligence/predictive/churn/route.ts`
- `app/src/app/api/intelligence/predictive/ltv/route.ts`
- `app/src/app/api/intelligence/predictive/forecast/route.ts`
- `app/src/app/api/intelligence/research/route.ts`
- `app/src/app/intelligence/predictive/page.tsx`
- `app/src/app/intelligence/research/page.tsx`
- `app/src/app/performance/page.tsx`
- `app/src/components/intelligence/predictive/ScaleSimulator.tsx`
- `app/src/components/intelligence/predictive/ChurnOverview.tsx`
- `app/src/components/intelligence/predictive/LTVBreakdown.tsx`
- `app/src/components/intelligence/predictive/ForecastChart.tsx`
- `app/src/components/intelligence/predictive/PredictiveAlerts.tsx`
- `app/src/components/intelligence/research/dossier-viewer.tsx`
- `app/src/components/intelligence/research/research-form.tsx`
- `app/src/components/performance/segment-breakdown.tsx`
- `app/src/components/performance/segment-filter.tsx`
- `app/src/components/performance/war-room-dashboard.tsx`
- `app/src/components/performance/alert-center.tsx`
- `app/src/components/layout/sidebar.tsx`
- `app/jest.setup.js`
- `app/src/__tests__/lib/intelligence/predictive/churn-predictor.test.ts`
- `app/src/__tests__/lib/intelligence/predictive/ltv-estimator.test.ts`
- `app/src/__tests__/lib/intelligence/research/engine.test.ts`
- `_netecmt/core/contract-map.yaml`
- `_netecmt/contracts/predictive-intelligence-spec.md`
- `_netecmt/contracts/deep-research-spec.md`
- `_netecmt/sprints/ACTIVE_SPRINT.md`
- `_netecmt/ROADMAP.md`

---

## 6. Riscos Arquiteturais Adicionais

| Risco | Prob. | Impacto | Mitigacao |
|:------|:------|:--------|:----------|
| Estouro de tokens na sintese Research | Media | Medio | DT-12: pipeline chunked + truncamento por fonte |
| Pesquisa lenta em brands grandes | Media | Medio | Batch 500 + paginacao (DT-07) |
| Cache Research sem index composto | Media | Alto | Criar index `topic + expiresAt + generatedAt` no Firestore |
| URLs maliciosas em fontes | Baixa | Alto | Validar http/https e bloquear localhost/ips privados |
| Dados insuficientes para LTV | Media | Baixo | confidenceScore e defaults; degradacao graciosa |

---

## 7. Estimativa Ajustada

| Fase | PRD | Ajuste Athos | Justificativa |
|:-----|:----|:-------------|:-------------|
| Fase 0 | ~2-3h | ~2.5h | runTransaction + stubs cleanup |
| Fase 1 | ~6-8h | ~7-9h | paginacao + config por brand (DT-07/08) |
| Fase 2 | ~5-6h | ~6-7h | chunked synthesis (DT-12) |
| Fase 3 | ~4-5h | ~4-5h | Sem ajuste |
| Fase 4 | ~0.5h | ~0.5h | Contratos + contract-map |
| **TOTAL** | **~18-22h** | **~20-24h** | Aumento por paginacao + chunking |

---

## 8. Veredito Final

### APROVADO COM RESSALVAS

**Ressalvas (Blocking DTs):**
1. **DT-01** — `runTransaction` com update completo no `updateVariantMetrics`.
2. **DT-05** — Separacao de types de Research em `types/research.ts`.
3. **DT-07** — Paginacao para churn batch > 500.
4. **DT-08** — LTV multipliers configuraveis por brand (com defaults).
5. **DT-12** — Research synthesis chunked (2 fases).
6. **DT-16** — Criar contratos das novas lanes antes do contract-map.

**Observacao:** DT-16 e blocking apenas para a governanca final (GOV-05), nao bloqueia o inicio da implementacao tecnica.

---

## 9. Checklist de Conformidade

- [x] PRD lido e RF/RNF validado
- [x] 15 DTs respondidos com decisao e classificacao
- [x] DT adicional identificado (contratos)
- [x] Inventario de stubs detalhado
- [x] Allowed-context definido
- [x] Estimativa ajustada
- [x] Riscos adicionais mapeados
- [x] Veredito emitido

---

*Architecture Review realizado por Athos (Architect) sob o protocolo NETECMT v2.0.*  
*Sprint 35: Predictive Intelligence & Deep Research | 09/02/2026*  
*Veredito: APROVADO COM RESSALVAS — 16 DTs (5 Blocking), estimativa ajustada ~20-24h*
