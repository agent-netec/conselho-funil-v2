# PRD: Predictive Intelligence & Deep Research — Sprint 35

**Versao:** 1.0
**Responsavel:** Iuran (PM)
**Status:** Draft — Ready for Architecture Review
**Data:** 09/02/2026
**Predecessora:** Sprint 34 (A/B Testing & Segment Optimization) — CONCLUIDA (QA 98/100)
**Tipo:** Feature Sprint (Predictive Intelligence & Deep Research)
**Estimativa Total:** ~18-22h core
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5 (Opcao B aprovada)

---

## 1. Contexto Estrategico

### 1.1 Baseline pos-Sprint 34

| Metrica | Valor |
|:--------|:------|
| Testes passando | 302/302 (52 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | ~109 rotas (Next.js 16 Turbopack) |
| Trajetoria QA | S25(93) → S26(97) → S27(97) → S28(98) → Sigma(99) → S29(100) → S30(98) → S31(99) → S32(91) → S33(96) → **S34(98)** |
| Auth cobertura | 100% — `requireBrandAccess` em 25+ rotas brand-scoped |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Rate Limiting | `withRateLimit()` em 4 rotas |
| A/B Testing | Engine + Variants + Hash Assignment + Auto-Optimization (S34) |
| Propensity Engine | hot/warm/cold scoring + LeadState 12 campos (S28/S29) |
| Content Autopilot | Calendario + Generation (4 formatos) + Approval (6 estados) (S33) |
| Rules Runtime | PersonalizationResolver + API + Hook (S31) |
| Kill-Switch | Firestore + Slack + In-App (S31) |
| Ads Integration | Meta + Google REST puro, cache 15min (S30) |
| Performance | War Room + Sentry + PerformanceAdvisor Gemini JSON (S18/S30) |
| Social | Instagram Graph API real + LinkedIn scaffold + Response Engine (S32) |
| Stubs residuais | ~7 (performance.ts 4, intelligence.ts 2, embeddings.ts 1) |
| PredictionEngine scaffold | `types/predictive.ts` + `lib/intelligence/predictive/engine.ts` + ScaleSimulator (S25) |
| Exa MCP | Adapter REST funcional — semantic_search, link_discovery, trend_analysis (S23) |
| Firecrawl MCP | Adapter REST funcional — url_to_markdown, full_scrape (S23) |

### 1.2 Por que Sprint 35: Predictive Intelligence & Deep Research

O Agency Engine possui 4 capacidades maduras que, ate agora, operam de forma **isolada e reativa**:

1. **Propensity Engine (S28)** — classifica leads em hot/warm/cold com score 0-1, mas nao projeta TENDENCIAS futuras desses segmentos
2. **PredictionEngine scaffold (S25)** — calcula propensity individual e simula escala de investimento, mas NAO prediz churn, NAO estima LTV real, e o ScaleSimulator usa dados mockados
3. **Exa + Firecrawl MCPs (S23)** — disponveis para pesquisa semantica e scraping profundo, mas NAO existe motor de pesquisa de mercado que produza dossies automatizados
4. **PerformanceAdvisor (S18/S30)** — gera insights reativos (o que ACONTECEU), mas NAO gera alertas preditivos (o que VAI acontecer)

**Cinco problemas criticos que Sprint 35 resolve:**

1. **Zero predicao de churn** — O sistema sabe que um lead esta "cold" (Propensity Engine), mas NAO prevê QUANDO um lead quente vai esfriar. Nao existe modelo de churn baseado em recencia + engajamento + inatividade progressiva. Decisoes de retencao sao cegas.

2. **Zero estimativa de LTV** — O sistema coleta eventos e conversoes, mas NAO calcula o Lifetime Value real de cohorts por segmento. O `forecastCohortROI` no PredictionEngine usa valores HARDCODED (baseLtv = 5000). Sem LTV real, e impossivel otimizar investimento por segmento.

3. **Zero forecasting de audiencia** — O Propensity Engine classifica leads em tempo real, mas NAO projeta a evolucao futura dos segmentos (ex: "em 14 dias, 23% dos leads warm vao migrar para cold"). Sem forecasting, o Content Autopilot e A/B Testing nao conseguem antecipar demanda.

4. **Zero pesquisa de mercado automatizada** — O Spy Agent (S14) analisa concorrentes individuais, mas NAO existe motor que combine Exa (pesquisa semantica) + Firecrawl (scraping profundo) + Gemini (sintese) para gerar dossies de mercado completos (tamanho de mercado, tendencias, oportunidades, ameacas). Decisoes de posicionamento sao manuais.

5. **Zero alertas preditivos** — O Sentry Engine (S18) detecta ANOMALIAS passadas (queda de CTR ontem), mas NAO alerta sobre riscos FUTUROS (churn iminente em 15 leads hot, oportunidade de upsell em cohort X). O dashboard preditivo (ScaleSimulator) so simula escala — nao integra churn, LTV e forecast.

### 1.3 Backlog Herdado da S34 (3 ressalvas + 7 stubs)

| Nota | Descricao | Acao S35 |
|:-----|:----------|:---------|
| CS-34.04 | `updateVariantMetrics` sem `runTransaction` — atomicidade por variante nao garantida | S35-GOV-01: Wrapping com `runTransaction` no `updateVariantMetrics()` em `lib/firebase/ab-tests.ts` |
| CS-34.09 | `selectedSegment` no Performance page nao faz drill-down nas demais visoes | S35-GOV-02: Propagar `selectedSegment` para SegmentBreakdown, advisor insights, e charts |
| Timer leak | MessagePort em hooks tests — mitigado com `--forceExit`, polyfill isolado pendente | S35-GOV-03: Implementar polyfill isolado `MessageChannel` no `jest.setup.js` com cleanup em `afterAll` |

### 1.4 Inventario de Stubs Residuais (~7)

| Arquivo | Stub/TODO | Acao S35 |
|:--------|:---------|:---------|
| `performance.ts` (types) | 4 stubs — campos ou interfaces parciais | S35-GOV-04: Completar ou documentar como `@intentional-stub` |
| `intelligence.ts` (types) | 2 stubs — interfaces ou campos parciais | S35-GOV-04: Completar ou documentar como `@intentional-stub` |
| `embeddings.ts` (lib/ai) | 1 stub — funcao parcial | S35-GOV-04: Completar ou documentar como `@intentional-stub` |

### 1.5 Funcionalidades NOVAS (15 total + 4 GOV)

| # | Item | Justificativa |
|:--|:-----|:-------------|
| 1 | Churn Predictor Engine | Motor de predicao de churn baseado em recencia + engagement + inatividade |
| 2 | LTV Estimation Engine | Cohort-based LTV com Propensity scoring + historico de conversoes |
| 3 | Audience Behavior Forecasting | Projecoes 7/14/30d de migracoes entre segmentos hot/warm/cold |
| 4 | Types expandidos (`types/predictive.ts`) | Novos types para churn, LTV, forecast, research |
| 5 | API `/api/intelligence/predictive/churn` | Endpoint de predicao de churn por brandId |
| 6 | API `/api/intelligence/predictive/ltv` | Endpoint de estimativa de LTV por cohort |
| 7 | API `/api/intelligence/predictive/forecast` | Endpoint de projecao de audiencia |
| 8 | Deep Research Engine | Integracao Exa + Firecrawl para dossies de mercado automatizados |
| 9 | Market Dossier Generator | Relatorio consolidado via Gemini (mercado, tendencias, concorrentes, oportunidades) |
| 10 | Research Storage Firestore | Namespace `research-{brandId}` com cache 24h |
| 11 | API `/api/intelligence/research` | Endpoint para disparar e consultar pesquisas de mercado |
| 12 | ScaleSimulator Upgrade | Dashboard preditivo com projecoes de LTV/Churn/Revenue |
| 13 | Predictive Alerts | Notificacoes de churn iminente + oportunidades de upsell |
| 14 | Research Results UI | Dossie de mercado com secoes colapsiveis |
| 15 | Hook `usePredictiveData` | Hook unificado para dados preditivos (churn, LTV, forecast) |
| GOV-01 | Fix `updateVariantMetrics` atomicidade | Ressalva CS-34.04 |
| GOV-02 | Fix `selectedSegment` drill-down | Ressalva CS-34.09 |
| GOV-03 | Fix Timer leak (polyfill isolado) | Ressalva S33→S34 |
| GOV-04 | Cleanup 7 stubs residuais | Stubs herdados de sprints anteriores |

### 1.6 Divida Tecnica a Resolver (4 itens de governanca)

| # | Item | Origem |
|:--|:-----|:-------|
| GOV-01 | `updateVariantMetrics` sem `runTransaction` | Ressalva CS-34.04 |
| GOV-02 | `selectedSegment` sem drill-down | Ressalva CS-34.09 |
| GOV-03 | Timer leak MessagePort — polyfill isolado | Heranca S32→S33→S34 |
| GOV-04 | 7 stubs residuais (performance.ts, intelligence.ts, embeddings.ts) | Heranca multi-sprint |

---

## 2. Objetivo da Sprint

> **"Criar modelos preditivos leves para comportamento de audiencia — predicao de churn (recencia + engagement + inatividade progressiva), estimativa de LTV (cohort-based com Propensity scoring e historico de conversoes), e forecasting de segmentos (projecoes 7/14/30d de migracoes hot/warm/cold). Construir motor de pesquisa profunda que combina Exa (semantic search) + Firecrawl (deep scraping) + Gemini (sintese) para gerar dossies de mercado automatizados. Evoluir o ScaleSimulator para dashboard preditivo completo com projecoes reais e alertas de churn iminente/oportunidades de upsell. Resolver as 3 ressalvas herdadas da S34 e eliminar os 7 stubs residuais."**

### 2.1 North Star Metrics

| Metrica | Antes (S34) | Meta (S35) |
|:--------|:-----------|:-----------|
| Churn Prediction | **Inexistente** | **Funcional** (modelo baseado em recencia + engagement + inatividade) |
| LTV Estimation | **Hardcoded** (baseLtv = 5000) | **Funcional** (cohort-based com Propensity scoring + conversoes reais) |
| Audience Forecasting | **Inexistente** | **Projecoes 7/14/30d** por segmento hot/warm/cold |
| Deep Research Engine | **Inexistente** | **Funcional** (dossies de mercado automatizados via Exa + Firecrawl + Gemini) |
| Predictive Dashboard | **ScaleSimulator scaffold** | **Dashboard completo** com projecoes reais + alertas preditivos |
| Ressalvas S34 | **3 pendentes** | **Zero** ressalvas |
| Stubs residuais | **~7** | **Zero** stubs (ou documentados como `@intentional-stub`) |

### 2.2 Metricas Secundarias

| Metrica | Meta |
|:--------|:-----|
| Testes passando | >= 302/302 (zero regressao) + novos testes predictive + research (~320-330 estimado) |
| TypeScript errors | 0 |
| Build (rotas) | >= ~109 + novas rotas (~113-117 estimado) |
| QA Score | >= 98/100 |
| Novas dependencias npm | 0 (REST puro, zero SDK novo) |

---

## 3. Requisitos Funcionais

### RF-35.0: Governanca & Backlog S34 (Fase 0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.0.1 | Fix `updateVariantMetrics` atomicidade (CS-34.04) | Envolver o update de metricas em `runTransaction()` em `lib/firebase/ab-tests.ts`. O `updateVariantMetrics(brandId, testId, variantId, delta)` deve: (a) iniciar transacao, (b) ler documento corrente, (c) incrementar campos (impressions, clicks, conversions, revenue) dentro da transacao, (d) commit. Garante atomicidade para updates concorrentes. Nao usar `increment()` fora de transacao. |
| RF-35.0.2 | Fix `selectedSegment` drill-down (CS-34.09) | Propagar o estado `selectedSegment` (hot/warm/cold/all) da pagina Performance para: (a) SegmentBreakdown — highlight do segmento selecionado, (b) PerformanceAdvisor insights — filtrar insights pelo segmento, (c) Charts de metricas — filtrar dados pelo segmento. Usar React context ou prop drilling (avaliar com Athos). O filtro deve ser reativo — mudar o select atualiza todas as visoes sem refetch (filtro client-side sobre dados ja carregados). |
| RF-35.0.3 | Timer leak MessagePort — polyfill isolado | Implementar no `jest.setup.js` um polyfill `MessageChannel` isolado com: (a) `beforeAll` — criar polyfill global `MessageChannel` e `MessagePort`, (b) `afterAll` — cleanup/destroy. Alternativa: mock `MessageChannel` com `jest.fn()` que retorna no-op ports. Objetivo: zero warnings `A worker process has failed to exit gracefully` sem `--forceExit`. Se nao resolvivel completamente: documentar como `@known-issue` e manter `--forceExit`. |
| RF-35.0.4 | Cleanup 7 stubs residuais | Revisar cada stub: (a) Se implementavel — implementar com dados reais ou logica funcional. (b) Se intencional (aguarda feature futura) — documentar com `@intentional-stub Sprint XX` e justificativa. (c) Se dead code — remover. Os 7 stubs: `performance.ts` (4), `intelligence.ts` (2), `embeddings.ts` (1). Inventariar exato dos stubs no Arch Review. |

### RF-35.1: Churn Predictor (Fase 1 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.1.1 | Types expandidos para Churn | Expandir `types/predictive.ts` com: `ChurnPrediction { leadId: string; brandId: string; currentSegment: 'hot' \| 'warm' \| 'cold'; predictedSegment: 'hot' \| 'warm' \| 'cold'; churnRisk: number (0-1); riskLevel: 'critical' \| 'warning' \| 'safe'; daysSinceLastEvent: number; engagementTrend: 'rising' \| 'stable' \| 'declining'; factors: string[]; predictedAt: Timestamp; }`. Type `ChurnBatchResult { brandId: string; totalLeads: number; atRisk: number; predictions: ChurnPrediction[]; calculatedAt: Timestamp; }`. |
| RF-35.1.2 | Churn Predictor Engine | Novo modulo `lib/intelligence/predictive/churn-predictor.ts` com classe `ChurnPredictor`. Metodo principal: `predictBatch(brandId: string): Promise<ChurnBatchResult>`. Logica: (a) Buscar todos os leads da brand via Firestore `brands/{brandId}/leads`, (b) Para cada lead, calcular `daysSinceLastEvent` (ultimo evento em `brands/{brandId}/journey_events`), (c) Calcular `engagementTrend` baseado em contagem de eventos nos ultimos 7d vs 7-14d (crescendo/estavel/declinando), (d) Calcular `churnRisk` score 0-1: base = `daysSinceLastEvent / 30` (normalizado), ajustado por `engagementTrend` (declining: +0.2, stable: 0, rising: -0.2), ajustado por `currentSegment` (hot com inatividade: risco maior pois esperamos mais engajamento), (e) Classificar `riskLevel`: critical >= 0.7, warning >= 0.4, safe < 0.4, (f) Predizer `predictedSegment`: se churnRisk >= 0.7 e current=hot → warm; se churnRisk >= 0.7 e current=warm → cold; senao mantem. |
| RF-35.1.3 | Churn Predictor — limites e safeguards | Limitar batch a 500 leads por chamada (paginacao se necessario). Se lead nao possui eventos: `churnRisk = 0.8` (alto risco por falta de dados). Se lead criado < 48h: excluir da predicao (insuficiente para pattern). Todos os calculos sao locais (nao chamar Gemini para churn — modelo deterministico leve). |

### RF-35.2: LTV Estimation (Fase 1 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.2.1 | Types para LTV | Expandir `types/predictive.ts` com: `LTVEstimation { brandId: string; cohortId: string; cohortName: string; segment: 'hot' \| 'warm' \| 'cold' \| 'all'; leadsInCohort: number; totalRevenue: number; avgRevenuePerLead: number; projectedLTV: { m1: number; m3: number; m6: number; m12: number; }; growthMultiplier: number; confidenceScore: number (0-1); calculatedAt: Timestamp; }`. Type `LTVBatchResult { brandId: string; cohorts: LTVEstimation[]; overallLTV: number; calculatedAt: Timestamp; }`. |
| RF-35.2.2 | LTV Estimation Engine | Novo modulo `lib/intelligence/predictive/ltv-estimator.ts` com classe `LTVEstimator`. Metodo: `estimateBatch(brandId: string): Promise<LTVBatchResult>`. Logica: (a) Buscar leads agrupados por segmento (hot/warm/cold), (b) Para cada segmento, calcular `totalRevenue` (soma de `revenue` em journey_events type=purchase), (c) Calcular `avgRevenuePerLead = totalRevenue / leadsInCohort`, (d) Projetar LTV futuro usando multipliers por segmento: hot (m1: 1.3x, m3: 2.5x, m6: 3.8x, m12: 5.2x), warm (m1: 1.1x, m3: 1.8x, m6: 2.4x, m12: 3.0x), cold (m1: 1.0x, m3: 1.2x, m6: 1.5x, m12: 1.8x). Multipliers calibraveis no Arch Review. (e) `confidenceScore` baseado em volume: < 10 leads = 0.3, 10-50 = 0.6, 50-200 = 0.8, > 200 = 0.9. |
| RF-35.2.3 | LTV Engine — substituir hardcoded | Refatorar `PredictionEngine.forecastCohortROI()` em `lib/intelligence/predictive/engine.ts` para usar o `LTVEstimator` em vez dos valores hardcoded (`baseLtv = 5000`). Manter backward compatibility — o `forecastCohortROI` deve continuar funcionando mas agora alimentado por dados reais. |

### RF-35.3: Audience Behavior Forecasting (Fase 1 — P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.3.1 | Types para Forecast | Expandir `types/predictive.ts` com: `AudienceForecast { brandId: string; currentDistribution: { hot: number; warm: number; cold: number; }; projections: { days7: { hot: number; warm: number; cold: number; }; days14: { hot: number; warm: number; cold: number; }; days30: { hot: number; warm: number; cold: number; }; }; migrationRates: { hotToWarm: number; warmToCold: number; coldToChurned: number; warmToHot: number; coldToWarm: number; }; trendsNarrative: string; calculatedAt: Timestamp; }`. |
| RF-35.3.2 | Audience Forecasting Engine | Novo modulo `lib/intelligence/predictive/audience-forecaster.ts` com classe `AudienceForecaster`. Metodo: `forecast(brandId: string): Promise<AudienceForecast>`. Logica: (a) Buscar distribuicao atual de leads por segmento, (b) Calcular taxas de migracao historicas (ultimos 30 dias): quantos leads mudaram de segmento baseado nos re-calculos do Propensity Engine, (c) Aplicar taxas de migracao para projetar distribuicao futura (7/14/30d), (d) Usar Gemini para gerar `trendsNarrative` — um paragrafo em PT-BR explicando as tendencias ("Sua base de leads quentes deve reduzir 15% nos proximos 14 dias devido a queda de engajamento..."). |
| RF-35.3.3 | Forecast — Gemini integration | Chamar `generateWithGemini()` com prompt dedicado em `lib/ai/prompts/predictive-forecast.ts`. Input: currentDistribution + projections + migrationRates. Output esperado: narrativa de 2-3 frases explicando tendencias e sugerindo acoes. Temperature: 0.3 (deterministico). `responseMimeType: 'application/json'` com campo `narrative: string`. |

### RF-35.4: API Routes Predictive (Fase 1 — P0/P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.4.1 | API Churn | Rota `POST /api/intelligence/predictive/churn/route.ts`. Body: `{ brandId }`. Retorna `ChurnBatchResult`. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-35.4.2 | API LTV | Rota `POST /api/intelligence/predictive/ltv/route.ts`. Body: `{ brandId }`. Retorna `LTVBatchResult`. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-35.4.3 | API Forecast | Rota `POST /api/intelligence/predictive/forecast/route.ts`. Body: `{ brandId }`. Retorna `AudienceForecast`. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |

### RF-35.5: Deep Research Engine (Fase 2 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.5.1 | Types para Research | Novo type em `types/predictive.ts` (ou `types/research.ts` — decisao Athos): `ResearchQuery { brandId: string; topic: string; marketSegment?: string; competitors?: string[]; depth: 'quick' \| 'standard' \| 'deep'; }`. `ResearchSource { url: string; title: string; snippet: string; relevanceScore: number; source: 'exa' \| 'firecrawl'; fetchedAt: Timestamp; }`. `MarketDossier { id: string; brandId: string; topic: string; status: 'processing' \| 'completed' \| 'failed'; sections: { marketOverview: string; marketSize: string; trends: string[]; competitors: { name: string; strengths: string[]; weaknesses: string[]; }[]; opportunities: string[]; threats: string[]; recommendations: string[]; }; sources: ResearchSource[]; generatedAt: Timestamp; expiresAt: Timestamp; }`. |
| RF-35.5.2 | Research Engine | Novo modulo `lib/intelligence/research/engine.ts` com classe `ResearchEngine`. Metodo principal: `generateDossier(query: ResearchQuery): Promise<MarketDossier>`. Fluxo: (a) **Fase 1 — Coleta via Exa**: Usar `ExaAdapter` para buscar 10-15 resultados semanticos sobre o `topic` + `marketSegment`. Query otimizada para dados de mercado. (b) **Fase 2 — Deep Scrape via Firecrawl**: Para os top 5 resultados mais relevantes, usar `FirecrawlAdapter` para extrair conteudo completo (markdown). Fallback: se Firecrawl falhar, usar snippet do Exa. (c) **Fase 3 — Sintese via Gemini**: Enviar todo o conteudo coletado para `generateWithGemini()` com prompt dedicado que produz as secoes do dossie (marketOverview, marketSize, trends, competitors, opportunities, threats, recommendations). (d) **Fase 4 — Persist**: Salvar `MarketDossier` em Firestore `brands/{brandId}/research` com TTL de 24h. |
| RF-35.5.3 | Research Engine — depth modes | `quick` (1-2min): 5 resultados Exa, sem Firecrawl deep scrape, Gemini com resumo curto. `standard` (2-4min): 10 resultados Exa, top 3 com Firecrawl, dossie completo. `deep` (4-8min): 15 resultados Exa, top 5 com Firecrawl, dossie extenso com todas as secoes. Default: `standard`. |
| RF-35.5.4 | Research prompts | Novo arquivo `lib/ai/prompts/research-synthesis.ts` com: (a) `RESEARCH_SYSTEM_PROMPT` — instrucoes para Gemini atuar como analista de mercado senior. (b) `buildResearchPrompt(sources: ResearchSource[], query: ResearchQuery)` — builder que monta o prompt com contexto coletado. Output esperado: JSON com campos do `MarketDossier.sections`. Temperature: 0.4. |

### RF-35.6: Market Dossier Generator (Fase 2 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.6.1 | Gemini-powered synthesis | O `MarketDossierGenerator` (pode ser metodo do `ResearchEngine` ou modulo separado — decisao Athos) recebe os sources coletados e produz: (a) `marketOverview` — 2-3 paragrafos sobre o mercado, (b) `marketSize` — estimativa de tamanho (qualitativa se dados insuficientes), (c) `trends` — array de 3-5 tendencias identificadas, (d) `competitors` — array com analise de concorrentes (nome, strengths, weaknesses), (e) `opportunities` — array de 3-5 oportunidades, (f) `threats` — array de 2-3 ameacas, (g) `recommendations` — array de 3-5 recomendacoes acionaveis. Tudo em PT-BR. |
| RF-35.6.2 | Fallback e error handling | Se Exa retornar zero resultados: dossie com `status: 'failed'` e mensagem "Nenhuma fonte encontrada para o topico informado". Se Gemini falhar na sintese: retornar sources brutas com `status: 'failed'` e mensagem de erro. Se Firecrawl falhar em 1+ URLs: continuar com os que funcionaram (graceful degradation). |

### RF-35.7: Research Storage (Fase 2 — P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.7.1 | Firestore storage | Collection `brands/{brandId}/research` para dossies. Campos conforme `MarketDossier` type. Isolamento por brandId obrigatorio. `Timestamp` em todos os campos de data. |
| RF-35.7.2 | Cache 24h | Antes de gerar novo dossie, verificar se existe dossie recente (< 24h) para o mesmo `topic` + `brandId`. Se existir, retornar o cache. Se `expiresAt < now()`, regenerar. Query: `where('topic', '==', topic).where('expiresAt', '>', Timestamp.now()).orderBy('generatedAt', 'desc').limit(1)`. |
| RF-35.7.3 | Research CRUD helpers | Modulo `lib/firebase/research.ts` com funcoes: `saveResearch(brandId, dossier)`, `getResearch(brandId, dossierld)`, `listResearch(brandId, limit?)`, `getCachedResearch(brandId, topic)`. |

### RF-35.8: API Route Research (Fase 2 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.8.1 | API Research | Rota `POST /api/intelligence/research/route.ts`. Body: `{ brandId, topic, marketSegment?, competitors?: string[], depth?: 'quick' \| 'standard' \| 'deep' }`. Retorna `MarketDossier`. Se cache valido existir, retorna imediatamente. Se nao, gera novo dossie. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-35.8.2 | API Research List | Rota `GET /api/intelligence/research/route.ts`. Query params: `brandId`, `limit?`. Retorna lista de dossies salvos. Com `force-dynamic`, `requireBrandAccess`. |

### RF-35.9: Predictive Dashboard — ScaleSimulator Upgrade (Fase 3 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.9.1 | Dashboard Upgrade | Refatorar `components/intelligence/predictive/ScaleSimulator.tsx` para incluir 3 novas secoes alem do simulador de escala existente: (a) **Churn Overview** — card com total leads at-risk, distribuicao por riskLevel (critical/warning/safe), tabela dos top 10 leads com maior churnRisk. (b) **LTV por Segmento** — 3 cards (hot/warm/cold) com avgRevenuePerLead, projectedLTV m3/m6/m12, confidenceScore. Chart de barras comparativo. (c) **Audience Forecast** — grafico de area empilhada mostrando projecoes 7/14/30d dos segmentos, migration rates badges, trendsNarrative como insight box. Manter simulador de escala existente como tab separada ("Simulador"). |
| RF-35.9.2 | Tabs de navegacao | Adicionar tabs no topo do dashboard preditivo: `Visao Geral` (default — KPIs resumidos), `Churn` (detalhe churn predictions), `LTV` (detalhe LTV estimations), `Forecast` (detalhe audience forecasting), `Simulador` (ScaleSimulator existente). |
| RF-35.9.3 | Page update | Atualizar `app/intelligence/predictive/page.tsx` para usar o novo dashboard com tabs. Atualizar titulo e descricao para refletir scope expandido ("Inteligencia Preditiva" em vez de "Simulador de Futuro Financeiro"). |
| RF-35.9.4 | Hook `usePredictiveData` | Novo hook `lib/hooks/use-predictive-data.ts` que: (a) Chama as 3 APIs (churn, LTV, forecast) em paralelo. (b) Retorna `{ churn: ChurnBatchResult, ltv: LTVBatchResult, forecast: AudienceForecast, isLoading, error }`. (c) Cache com SWR pattern (revalidacao a cada 5 min). (d) Aceita `brandId` como parametro. |

### RF-35.10: Predictive Alerts (Fase 3 — P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.10.1 | Alert types | Expandir `types/predictive.ts` com: `PredictiveAlert { id: string; brandId: string; type: 'churn_imminent' \| 'upsell_opportunity' \| 'segment_shift' \| 'ltv_milestone'; severity: 'critical' \| 'warning' \| 'info'; title: string; description: string; data: Record<string, unknown>; dismissed: boolean; createdAt: Timestamp; }`. |
| RF-35.10.2 | Alert generation | Modulo `lib/intelligence/predictive/alert-generator.ts` com classe `PredictiveAlertGenerator`. Metodo: `generateAlerts(brandId, churnData, ltvData, forecastData): PredictiveAlert[]`. Regras: (a) `churn_imminent` — se >= 3 leads hot com churnRisk >= 0.7 → alerta critical. (b) `upsell_opportunity` — se cohort warm tem LTV m3 > 2x avgRevenuePerLead → alerta info de oportunidade de upsell. (c) `segment_shift` — se forecast mostra > 20% migracao hot→warm em 14d → alerta warning. (d) `ltv_milestone` — se LTV medio da brand ultrapassar threshold configuravel → alerta info. |
| RF-35.10.3 | Alert UI | Secao de alertas no topo do dashboard preditivo. Cards com icone por tipo (AlertTriangle para critical, Bell para warning, Info para info). Botao "Dispensar" por alerta. Limite de 5 alertas visiveis, restante em modal expandivel. |

### RF-35.11: Research Results UI (Fase 3 — P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.11.1 | Research page | Nova pagina `app/intelligence/research/page.tsx` (ou tab na pagina intelligence existente — decisao Athos). Componentes: (a) Formulario de pesquisa — input para topico, select para marketSegment, multiselect para competitors, radio para depth. (b) Lista de dossies anteriores — cards com titulo, data, status badge. (c) Dossie expandido — secoes colapsiveis (Accordion) para cada secao do dossie. |
| RF-35.11.2 | Dossier Viewer component | Novo componente `components/intelligence/research/dossier-viewer.tsx`. Recebe `MarketDossier` e renderiza: (a) Header com titulo + badge status + data. (b) Sections collapsiveis com Accordion (marketOverview, marketSize, trends, competitors, opportunities, threats, recommendations). (c) Sources section — lista de fontes com link, relevance badge, provider badge (Exa/Firecrawl). (d) Export button placeholder (para S36 — Reporting). |
| RF-35.11.3 | Sidebar integration | Adicionar item "Deep Research" no Sidebar sob secao Intelligence, com icone `Search` ou `Telescope` do Lucide. |

---

## 4. Requisitos Nao-Funcionais

| ID | Requisito | Criterio |
|:---|:----------|:---------|
| RNF-35.01 | Zero novas deps npm | `package.json` inalterado (exceto devDeps de teste se necessario) |
| RNF-35.02 | REST puro | Todas as chamadas externas via `fetch()`. Zero SDK novo. |
| RNF-35.03 | Churn API latencia | < 3s para batch de 500 leads (queries Firestore paralelas) |
| RNF-35.04 | LTV API latencia | < 2s para calculo por brand (queries Firestore + matematica local) |
| RNF-35.05 | Forecast API latencia | < 5s (Firestore queries + 1 call Gemini para narrativa) |
| RNF-35.06 | Research API latencia | < 30s (quick), < 120s (standard), < 300s (deep) — inclui Exa + Firecrawl + Gemini |
| RNF-35.07 | Research cache | Dossies cacheados retornam em < 500ms (read Firestore direto) |
| RNF-35.08 | Isolamento multi-tenant | Zero acesso cross-tenant em TODAS as funcionalidades. brandId obrigatorio em todas as queries. |
| RNF-35.09 | Padroes Sigma | `createApiError`/`createApiSuccess`, `requireBrandAccess`, `Timestamp`, `force-dynamic` em todas as rotas novas |
| RNF-35.10 | Churn modelo deterministico | Zero chamada Gemini para churn — modelo baseado em regras (leve, rapido, auditavel) |
| RNF-35.11 | LTV modelo baseado em dados | Multipliers configuraveis, nao hardcoded no tipo. Defaults razoaveis para cold start. |
| RNF-35.12 | Research graceful degradation | Falha em Exa/Firecrawl NAO causa crash — fallback documentado |
| RNF-35.13 | Predictive data freshness | Dados preditivos recalculados a cada request (nao cacheados — real-time). Research cacheado 24h. |

---

## 5. Fases de Implementacao

### Fase 0: Governanca & Backlog S34 (~2-3h) — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S35-GOV-01 | Fix `updateVariantMetrics` com `runTransaction` (CS-34.04) | DT-01 (transaction scope) | S (~30min) |
| S35-GOV-02 | Fix `selectedSegment` drill-down propagation (CS-34.09) | DT-02 (state management pattern) | M (~1h) |
| S35-GOV-03 | Timer leak MessagePort — polyfill isolado | DT-03 (mock vs polyfill) | M (~1h) |
| S35-GOV-04 | Cleanup 7 stubs residuais | DT-04 (implement vs intentional-stub) | S (~30min) |
| S35-GATE-00 | **Gate Check 0: tsc=0, testes passam, zero timer warnings (ou documentado), 7 stubs resolvidos, ressalvas S34 eliminadas** | — | XS (~15min) |

### Fase 1: Churn & LTV Prediction + Forecast (~6-8h) — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S35-PRED-01 | Types expandidos (`types/predictive.ts` — Churn, LTV, Forecast, Alerts) | DT-05 (type structure) | S (~30min) |
| S35-PRED-02 | Churn Predictor Engine (`lib/intelligence/predictive/churn-predictor.ts`) | DT-06 (scoring weights), DT-07 (batch size) | L (~2h) |
| S35-PRED-03 | LTV Estimation Engine (`lib/intelligence/predictive/ltv-estimator.ts`) + refactor `forecastCohortROI` | DT-08 (multiplier calibration) | L (~2h) |
| S35-PRED-04 | Audience Behavior Forecasting (`lib/intelligence/predictive/audience-forecaster.ts`) + Gemini prompt | DT-09 (migration rate calc) | M (~1.5h) |
| S35-PRED-05 | API routes `/api/intelligence/predictive/` (churn, ltv, forecast) | — | M (~1h) |
| S35-GATE-01 | **Gate Check 1: 3 engines funcionais, 3 APIs retornam dados, types compilam, tsc=0, testes passam** | — | XS (~15min) |

### Fase 2: Deep Research Engine (~5-6h) — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S35-RES-01 | Research Engine (`lib/intelligence/research/engine.ts`) — Exa + Firecrawl + Gemini pipeline | DT-10 (Exa query optimization), DT-11 (Firecrawl depth strategy) | L (~2h) |
| S35-RES-02 | Market Dossier Generator + Research prompts (`lib/ai/prompts/research-synthesis.ts`) | DT-12 (prompt structure) | M+ (~1.5h) |
| S35-RES-03 | Research Storage Firestore (`lib/firebase/research.ts`) + cache 24h | — | M (~1h) |
| S35-RES-04 | API route `/api/intelligence/research/` (POST generate + GET list) | — | S (~30min) |
| S35-GATE-02 | **Gate Check 2: research engine gera dossie funcional, cache funciona, API retorna dados, tsc=0, testes passam** | — | XS (~15min) |

### Fase 3: Predictive Dashboard & Alerts + Research UI (~4-5h) — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S35-DASH-01 | ScaleSimulator Upgrade — dashboard preditivo com tabs (Visao Geral, Churn, LTV, Forecast, Simulador) | DT-13 (tab layout), DT-14 (chart library reuse) | L (~2h) |
| S35-DASH-02 | Predictive Alerts (`lib/intelligence/predictive/alert-generator.ts`) + UI | DT-15 (threshold config) | M (~1h) |
| S35-DASH-03 | Research Results UI (page + dossier-viewer + sidebar) | — | M (~1h) |
| S35-DASH-04 | Hook `usePredictiveData` | — | S (~30min) |
| S35-GATE-03 | **Gate Check 3: dashboard renderiza 5 tabs, alertas funcionam, research UI funcional, tsc=0, testes passam** | — | XS (~15min) |

### Fase 4: Governanca Final (~0.5h)

| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S35-GOV-05 | Contract-map update — lanes `predictive_intelligence` + `deep_research` | XS (~15min) |
| S35-GOV-06 | ACTIVE_SPRINT.md + ROADMAP.md (resultado final) | XS (~15min) |

---

## 6. DTs Esperados (Decision Trees — para Athos)

| DT | Questao | Contexto |
|:---|:--------|:---------|
| DT-01 | `runTransaction` scope no `updateVariantMetrics`: transacao lê doc inteiro e atualiza os campos delta, ou usa FieldValue.increment dentro da transacao? | Pattern existente: `runTransaction` no rate-limiter (S32). `increment()` dentro de transacao e suportado pelo Firestore? |
| DT-02 | State management para `selectedSegment` drill-down: React context dedicado (`SegmentContext`) vs prop drilling direto? | Performance page tem ~5 componentes filhos que precisam do filtro. Context evita prop drilling mas adiciona complexidade. |
| DT-03 | Timer leak fix: mock `MessageChannel` com `jest.fn()` no-op vs polyfill real com cleanup? Ou `--forceExit` permanente com documentacao? | Problema persiste desde S32 (3 sprints). Polyfill pode causar side effects em outros testes. Mock e mais seguro. |
| DT-04 | 7 stubs: criterio para `@intentional-stub` vs implementacao? Se stub e usado apenas como type placeholder sem logica, documentar. Se tem consumer ativo, implementar. | Inventario exato necessario no Arch Review. |
| DT-05 | Types de Research: em `types/predictive.ts` (expandir) ou `types/research.ts` (novo)? | `predictive.ts` ja tem ~80 linhas. Research e conceptualmente diferente (pesquisa de mercado vs predicao). Separar? |
| DT-06 | Churn scoring weights: `daysSinceLastEvent / 30` como base vs formula exponencial (decaimento mais agressivo)? | Formula linear e simples e auditavel. Exponencial e mais realista mas menos previsivel para QA. |
| DT-07 | Batch size do ChurnPredictor: 500 leads hard limit vs paginacao automatica com cursor? | 500 e conservador. Brands grandes podem ter > 500 leads. Paginacao adiciona complexidade. |
| DT-08 | LTV multipliers: hardcoded no engine vs configuraveis por brand (Firestore `brands/{id}/config`)? | Config por brand e mais flexivel mas overengineering para MVP. Default constants com override opcional? |
| DT-09 | Migration rate calculation: diff entre snapshots semanais (precisa de historico) vs estimativa baseada em churn risk scores? | Historico de snapshots nao existe. Usar churn risk como proxy: churnRisk > 0.5 para lead hot → contabilizar como migracao hot→warm. Simples e sem historico. |
| DT-10 | Exa query optimization: query literal do usuario vs query enriquecida com context (topic + segment + "market size" + "trends 2026")? | Query enriquecida retorna resultados mais relevantes. Testar formato no Arch Review. |
| DT-11 | Firecrawl depth: `url_to_markdown` (rapido, menos dados) vs `full_scrape` (lento, mais dados) para top sources? | `url_to_markdown` e suficiente para pesquisa de mercado (artigos). `full_scrape` e para sites inteiros. Recomendacao: `url_to_markdown` para research. |
| DT-12 | Research synthesis prompt: single call com todo contexto (pode exceder token limit) vs chunked calls (processar em lotes)? | Top 5 sources markdown pode ser > 30k tokens. Truncar cada source a 2k tokens? Ou processar em 2 calls (resumo individual + sintese)? |
| DT-13 | Dashboard tabs: `@radix-ui/react-tabs` (ja no bundle via shadcn) vs custom tabs com state? | shadcn Tabs ja existe no projeto. Reutilizar. |
| DT-14 | Charts: recharts (ja no bundle via ScaleSimulator) vs custom SVG? | recharts ja importado. Reutilizar para consistencia. |
| DT-15 | Alert thresholds: hardcoded constants vs configuraveis por brand? | Constants para MVP. Override por brand em sprint futura. |

---

## 7. Proibicoes (P-01 a P-08 herdadas + PB-01 a PB-08 novas)

### Herdadas (obrigatorias desde Sigma)

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

### Novas S35

| ID | Proibicao |
|:---|:----------|
| PB-01 | ZERO chamada Gemini no Churn Predictor — modelo deterministico puro (regras, sem IA generativa) |
| PB-02 | ZERO LTV com valores hardcoded — refatorar `forecastCohortROI` para usar dados reais |
| PB-03 | ZERO research sem cache check — sempre verificar cache 24h antes de gerar novo dossie |
| PB-04 | ZERO research sem fallback — falha em Exa/Firecrawl nao pode causar crash (graceful degradation) |
| PB-05 | ZERO batch de churn sem limit — maximo 500 leads por request (safeguard de performance) |
| PB-06 | ZERO alerta preditivo sem threshold minimo — nao gerar alertas com < 10 leads no segmento |
| PB-07 | ZERO source de research sem attribution — todas as fontes devem ter URL e provider registrados |
| PB-08 | ZERO publicacao/execucao real — engines preditivos sao read-only (analise e projecao, nao acao) |

---

## 8. Criterios de Sucesso (CS-35.01 a CS-35.25)

| ID | Criterio | Verificacao |
|:---|:---------|:-----------|
| CS-35.01 | `updateVariantMetrics` usa `runTransaction` | Code review: `lib/firebase/ab-tests.ts` com `runTransaction()` envolvendo update |
| CS-35.02 | `selectedSegment` propaga drill-down para todas as visoes | Visual: mudar filtro atualiza SegmentBreakdown + Advisor + Charts |
| CS-35.03 | Timer leak resolvido (ou documentado como `@known-issue`) | Test runner: zero warnings MessagePort OU `@known-issue` documentado |
| CS-35.04 | 7 stubs resolvidos (implementados ou documentados `@intentional-stub`) | Code review: zero stubs sem documentacao |
| CS-35.05 | ChurnPredictor retorna `ChurnBatchResult` funcional | Teste: `predictBatch(brandId)` retorna predictions com churnRisk 0-1 |
| CS-35.06 | Churn scoring respeita recencia + engagement + inatividade | Teste: lead com 20d sem evento tem churnRisk > lead com 2d sem evento |
| CS-35.07 | ChurnPredictor limita batch a 500 leads | Teste: brand com 600 leads retorna max 500 predictions |
| CS-35.08 | LTVEstimator retorna `LTVBatchResult` funcional | Teste: `estimateBatch(brandId)` retorna cohorts com projectedLTV |
| CS-35.09 | LTV multipliers diferem por segmento | Teste: hot projectedLTV > warm projectedLTV > cold projectedLTV |
| CS-35.10 | `forecastCohortROI` refatorado (sem hardcoded baseLtv) | Code review: `PredictionEngine.forecastCohortROI` usa `LTVEstimator` |
| CS-35.11 | AudienceForecaster retorna projecoes 7/14/30d | Teste: `forecast(brandId)` retorna projections com 3 timeframes |
| CS-35.12 | AudienceForecaster inclui narrativa Gemini | Teste: `trendsNarrative` e string nao-vazia em PT-BR |
| CS-35.13 | API `/predictive/churn` funcional com auth | Teste: POST retorna 200 com brandId valido, 403 sem auth |
| CS-35.14 | API `/predictive/ltv` funcional com auth | Teste: POST retorna 200 com brandId valido, 403 sem auth |
| CS-35.15 | API `/predictive/forecast` funcional com auth | Teste: POST retorna 200 com brandId valido, 403 sem auth |
| CS-35.16 | ResearchEngine gera dossie completo | Teste: `generateDossier(query)` retorna MarketDossier com todas as secoes preenchidas |
| CS-35.17 | Research cache 24h funciona | Teste: segunda chamada com mesmo topic retorna cache (< 500ms) |
| CS-35.18 | Research graceful degradation | Teste: com Exa mockado para falhar, engine retorna `status: 'failed'` sem crash |
| CS-35.19 | API `/intelligence/research` POST + GET funcional | Teste: POST gera dossie, GET lista dossies por brandId |
| CS-35.20 | Dashboard preditivo com 5 tabs | Visual: Visao Geral, Churn, LTV, Forecast, Simulador renderizam |
| CS-35.21 | Predictive Alerts funcionam | Teste: com dados de churn mock (3+ hot at-risk), alerta `churn_imminent` gerado |
| CS-35.22 | Research UI com formulario + dossier viewer | Visual: formulario submete, dossie renderiza com secoes colapsiveis |
| CS-35.23 | Contract-map com lanes `predictive_intelligence` + `deep_research` | Code review: `contract-map.yaml` atualizado |
| CS-35.24 | Isolamento multi-tenant em TODAS as features novas | Code review: zero query sem brandId |
| CS-35.25 | Hook `usePredictiveData` retorna dados das 3 APIs | Teste: hook retorna churn + ltv + forecast em paralelo |

---

## 9. Riscos e Mitigacoes

| # | Risco | Probabilidade | Impacto | Mitigacao |
|:--|:------|:-------------|:--------|:----------|
| R-01 | Exa MCP indisponivel durante dev/test | Media | Alto (bloqueia research) | Mock do ExaAdapter para testes. Engine tem fallback para `status: 'failed'`. Dev pode testar com Exa real ou mock. |
| R-02 | Firecrawl timeout em URLs protegidas (Cloudflare) | Alta | Medio | Fallback ja existente (S23): Firecrawl → Jina → snippet Exa. Research continua com sources disponiveis. |
| R-03 | Gemini token limit excedido na sintese de research | Media | Medio | Truncar cada source a 2k tokens. Total input max ~12k tokens. Dentro do limite de Gemini 2.0 Flash (1M tokens). |
| R-04 | Churn predictions imprecisas (modelo muito simples) | Media | Baixo | Modelo e v1 — baseado em regras, auditavel. Calibracao de weights no Arch Review. V2 (ML) seria Sprint 38+. |
| R-05 | ScaleSimulator existente quebra com refatoracao | Baixa | Alto | Manter ScaleSimulator existente como tab "Simulador" sem modificacao funcional. Novas tabs sao adicionais. |
| R-06 | Performance de queries Firestore com muitos leads | Media | Medio | Batch limit 500. Queries com index compostos se necessario. Monitorar latencia nos testes. |
| R-07 | Timer leak nao resolvivel completamente | Alta | Baixo | Documentar como `@known-issue` e manter `--forceExit`. Nao e bloqueante para QA (mitigacao comprovada em 3 sprints). |
| R-08 | Research prompts produzem output inconsistente | Media | Medio | Zod validation no output Gemini. Fallback para template vazio com `status: 'failed'` se parse falhar. |

---

## 10. Out of Scope (explicito)

| Item | Motivo |
|:-----|:-------|
| ML models reais (TensorFlow/PyTorch) | Overengineering para v1. Modelo baseado em regras e suficiente. ML seria S38+. |
| Churn prediction individual (per-lead API) | Batch-only nesta sprint. API per-lead e S36+ se necessario. |
| Research com data em tempo real (web scraping continuo) | Research e on-demand com cache 24h. Scraping continuo seria S37+. |
| Report generation (PDF/email) | Research gera dossie visual. Export/email e S36 (Advanced Reporting). |
| Bayesian forecasting | Complexidade excessiva para v1. Projecao linear e suficiente. |
| LinkedIn Inbox Real (STRETCH pendente S32) | Avaliado pelo Conselho como P2. Apenas se houver tempo sobrando apos Fase 3. NAO e obrigatorio. |
| Notification push (push notifications) | Alertas sao in-app apenas. Push e S37+ (Enterprise). |
| Auto-actions baseadas em alertas | Alertas sao informativos. Auto-actions (ex: pausar campanha se churn alto) seria S36+. |
| Integration com Google Analytics/Mixpanel | REST puro para dados internos apenas. Third-party analytics e S37+. |
| BrandVoice Translator 2.0 (STRETCH S32→S33→S34) | Movido novamente. Avaliar em S36. |

---

## 11. Estimativa Total

| Fase | Esforco | Items |
|:-----|:--------|:------|
| Fase 0 — Governanca & Backlog S34 | ~2-3h | GOV-01 a GOV-04 + Gate 0 |
| Fase 1 — Churn & LTV Prediction + Forecast | ~6-8h | PRED-01 a PRED-05 + Gate 1 |
| Fase 2 — Deep Research Engine | ~5-6h | RES-01 a RES-04 + Gate 2 |
| Fase 3 — Predictive Dashboard & Alerts + Research UI | ~4-5h | DASH-01 a DASH-04 + Gate 3 |
| Fase 4 — Governanca Final | ~0.5h | GOV-05, GOV-06 |
| **TOTAL** | **~18-22h** | 19 items + 4 Gates |

---

## 12. Dependencias

| Dependencia | Status | Sprint Origem |
|:-----------|:-------|:-------------|
| Sprint 34 concluida (QA 98/100) | ✅ Confirmada | S34 |
| `PropensityEngine` (hot/warm/cold scoring) | ✅ Funcional (recencia + inatividade + scoring) | S28 |
| `PropensityResult` + `LeadState` types (12 campos) | ✅ Inclui campo `segment` | S28/S29 |
| `PredictionEngine` scaffold (engine.ts + types) | ✅ Funcional (propensity + ROI forecast + simulateScale) | S25 |
| `ScaleSimulator` componente (recharts + sliders) | ✅ UI funcional | S25 |
| A/B Testing Engine (variantes + metricas) | ✅ CRUD + auto-optimization | S34 |
| Attribution Engine (multi-touch) | ✅ Last Click, U-Shape, Linear | S27 |
| `ExaAdapter` (semantic_search + link_discovery + trend_analysis) | ✅ REST via MCP Router | S23 |
| `FirecrawlAdapter` (url_to_markdown + full_scrape) | ✅ REST via MCP Router | S23 |
| `generateWithGemini()` com JSON mode + system_instruction | ✅ Funcional | S28/S32 |
| `PerformanceAdvisor` (Gemini JSON insights) | ✅ Funcional | S18/S30 |
| Kill-Switch persistence | ✅ Firestore + Slack + In-App | S31 |
| Content Autopilot (dados de conteudo) | ✅ Calendario + Generation + Approval | S33 |
| Firestore subcollection pattern | ✅ Usado em 10+ collections | Multi-sprint |
| `createApiError`/`createApiSuccess` (Sigma) | ✅ 54+ rotas | Sigma |
| `requireBrandAccess` (Sigma) | ✅ 25+ rotas | Sigma |
| Zod para validacao | ✅ Formalizada | S32/S33 |
| recharts | ✅ No bundle (ScaleSimulator) | S25 |
| NAV_GROUPS em constants.ts | ✅ Sidebar 2.0 | S21 |
| Lucide Icons | ✅ No bundle (shadcn/ui) | — |
| Nenhum MCP/CLI novo | ✅ N/A | — |
| Nenhuma dependencia npm nova | ✅ N/A | — |

---

## 13. Arquivos Esperados (Novos e Modificados)

### Novos (~18-22 arquivos)

| Arquivo | Sprint Item | Tipo |
|:--------|:-----------|:-----|
| `app/src/lib/intelligence/predictive/churn-predictor.ts` | S35-PRED-02 | Engine |
| `app/src/lib/intelligence/predictive/ltv-estimator.ts` | S35-PRED-03 | Engine |
| `app/src/lib/intelligence/predictive/audience-forecaster.ts` | S35-PRED-04 | Engine |
| `app/src/lib/intelligence/predictive/alert-generator.ts` | S35-DASH-02 | Engine |
| `app/src/lib/intelligence/research/engine.ts` | S35-RES-01 | Engine |
| `app/src/lib/firebase/research.ts` | S35-RES-03 | CRUD Firestore |
| `app/src/lib/ai/prompts/predictive-forecast.ts` | S35-PRED-04 | Prompt |
| `app/src/lib/ai/prompts/research-synthesis.ts` | S35-RES-02 | Prompt |
| `app/src/app/api/intelligence/predictive/churn/route.ts` | S35-PRED-05 | API Route |
| `app/src/app/api/intelligence/predictive/ltv/route.ts` | S35-PRED-05 | API Route |
| `app/src/app/api/intelligence/predictive/forecast/route.ts` | S35-PRED-05 | API Route |
| `app/src/app/api/intelligence/research/route.ts` | S35-RES-04 | API Route |
| `app/src/app/intelligence/research/page.tsx` | S35-DASH-03 | UI Page |
| `app/src/components/intelligence/research/dossier-viewer.tsx` | S35-DASH-03 | UI Component |
| `app/src/components/intelligence/research/research-form.tsx` | S35-DASH-03 | UI Component |
| `app/src/components/intelligence/predictive/ChurnOverview.tsx` | S35-DASH-01 | UI Component |
| `app/src/components/intelligence/predictive/LTVBreakdown.tsx` | S35-DASH-01 | UI Component |
| `app/src/components/intelligence/predictive/ForecastChart.tsx` | S35-DASH-01 | UI Component |
| `app/src/components/intelligence/predictive/PredictiveAlerts.tsx` | S35-DASH-02 | UI Component |
| `app/src/lib/hooks/use-predictive-data.ts` | S35-DASH-04 | Hook |
| `app/src/__tests__/lib/intelligence/predictive/churn-predictor.test.ts` | S35-PRED-02 | Test |
| `app/src/__tests__/lib/intelligence/predictive/ltv-estimator.test.ts` | S35-PRED-03 | Test |
| `app/src/__tests__/lib/intelligence/research/engine.test.ts` | S35-RES-01 | Test |

### Modificados (~10-12 arquivos)

| Arquivo | Sprint Item | Alteracao |
|:--------|:-----------|:----------|
| `app/src/types/predictive.ts` | S35-PRED-01 | Expandir com ChurnPrediction, LTVEstimation, AudienceForecast, ResearchQuery, MarketDossier, PredictiveAlert |
| `app/src/lib/intelligence/predictive/engine.ts` | S35-PRED-03 | Refatorar `forecastCohortROI` para usar LTVEstimator |
| `app/src/components/intelligence/predictive/ScaleSimulator.tsx` | S35-DASH-01 | Adicionar tabs (Visao Geral, Churn, LTV, Forecast, Simulador) |
| `app/src/app/intelligence/predictive/page.tsx` | S35-DASH-01 | Atualizar titulo + descricao + integrar novo dashboard |
| `app/src/components/layout/sidebar.tsx` | S35-DASH-03 | Adicionar item "Deep Research" na secao Intelligence |
| `app/src/lib/firebase/ab-tests.ts` | S35-GOV-01 | Envolver `updateVariantMetrics` com `runTransaction` |
| `app/src/app/performance/page.tsx` | S35-GOV-02 | Propagar `selectedSegment` para componentes filhos |
| `app/jest.setup.js` | S35-GOV-03 | Polyfill/mock `MessageChannel` isolado |
| `app/src/types/performance.ts` | S35-GOV-04 | Resolver 4 stubs |
| `app/src/types/intelligence.ts` | S35-GOV-04 | Resolver 2 stubs |
| `app/src/lib/ai/embeddings.ts` | S35-GOV-04 | Resolver 1 stub |
| `_netecmt/core/contract-map.yaml` | S35-GOV-05 | Novas lanes `predictive_intelligence` + `deep_research` |

---

## 14. Contract-Map Update Esperado (S35-GOV-05)

```yaml
predictive_intelligence:
  paths:
    - "app/src/lib/intelligence/predictive/**"                     # S35-PRED-02/03/04, S35-DASH-02
    - "app/src/app/api/intelligence/predictive/**"                 # S35-PRED-05
    - "app/src/components/intelligence/predictive/**"              # S35-DASH-01/02
    - "app/src/app/intelligence/predictive/**"                     # S35-DASH-01
    - "app/src/lib/hooks/use-predictive-data.ts"                   # S35-DASH-04
    - "app/src/lib/ai/prompts/predictive-forecast.ts"              # S35-PRED-04
    - "app/src/lib/ai/prompts/predictive-scoring.ts"               # Pre-existente (S25)
    - "app/src/types/predictive.ts"                                # S35-PRED-01
  contract: "_netecmt/contracts/predictive-intelligence-spec.md"

deep_research:
  paths:
    - "app/src/lib/intelligence/research/**"                       # S35-RES-01/02
    - "app/src/lib/firebase/research.ts"                           # S35-RES-03
    - "app/src/app/api/intelligence/research/**"                   # S35-RES-04
    - "app/src/app/intelligence/research/**"                       # S35-DASH-03
    - "app/src/components/intelligence/research/**"                # S35-DASH-03
    - "app/src/lib/ai/prompts/research-synthesis.ts"               # S35-RES-02
  contract: "_netecmt/contracts/deep-research-spec.md"
```

---

## 15. Mapa de Dependencias Internas (Sprint 35)

```
Fase 0 (Governanca)
  S35-GOV-01 (Fix updateVariantMetrics) ─── independente (ab-tests.ts)
  S35-GOV-02 (Fix selectedSegment drill-down) ─── independente (performance/page.tsx)
  S35-GOV-03 (Timer leak polyfill) ─── independente (jest.setup.js)
  S35-GOV-04 (Cleanup 7 stubs) ─── independente (3 arquivos)
  │
  ▼ GATE 0
  │
Fase 1 (Churn & LTV Prediction + Forecast)
  S35-PRED-01 (Types) ─── base para tudo (predictive.ts expand)
  S35-PRED-02 (Churn Predictor) ←── S35-PRED-01, PropensityEngine (S28)
  S35-PRED-03 (LTV Estimator) ←── S35-PRED-01, PredictionEngine (S25), journey data
  S35-PRED-04 (Audience Forecaster) ←── S35-PRED-01, S35-PRED-02 (churn risk como proxy)
  S35-PRED-05 (APIs) ←── S35-PRED-02, S35-PRED-03, S35-PRED-04
  │
  ▼ GATE 1
  │
Fase 2 (Deep Research Engine)
  S35-RES-01 (Research Engine) ←── ExaAdapter (S23), FirecrawlAdapter (S23)
  S35-RES-02 (Dossier Generator + Prompts) ←── S35-RES-01, generateWithGemini (S28)
  S35-RES-03 (Research Storage) ─── independente (Firestore CRUD)
  S35-RES-04 (API) ←── S35-RES-01, S35-RES-02, S35-RES-03
  │
  ▼ GATE 2
  │
Fase 3 (Dashboard & UI)
  S35-DASH-01 (ScaleSimulator Upgrade) ←── S35-PRED-01 (types), S35-PRED-05 (APIs)
  S35-DASH-02 (Predictive Alerts) ←── S35-PRED-02 (churn), S35-PRED-03 (ltv), S35-PRED-04 (forecast)
  S35-DASH-03 (Research UI) ←── S35-RES-04 (API)
  S35-DASH-04 (Hook usePredictiveData) ←── S35-PRED-05 (APIs)
  │
  ▼ GATE 3
  │
Fase 4 (Governanca Final)
  S35-GOV-05 (Contract-map) ─── depende de TUDO acima
  S35-GOV-06 (ACTIVE_SPRINT + ROADMAP) ─── depende de TUDO acima
```

---

## 16. STRETCH: LinkedIn Inbox Real (P2)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-35.S.1 | LinkedIn Inbox Real | Se houver tempo apos Fase 3, implementar: (a) `GET /v2/socialActions` no LinkedIn adapter, (b) `GET /v2/ugcPosts` para posts publicados, (c) Integrar no `InboxAggregator`. TODO pendente desde S32 (scaffold ja existe com health check). |

**Criterio para ativar STRETCH:** Fases 0-3 concluidas com GATE CHECK 3 aprovado E tempo estimado restante >= 2h.

---

*PRD formalizado por Iuran (PM) sob aprovacao do Alto Conselho.*
*Sprint 35: Predictive Intelligence & Deep Research | 09/02/2026*
*Veredito: Unanimidade 5/5 — Estimativa aprovada: ~18-22h*
