# PRD: A/B Testing & Segment Optimization — Sprint 34

**Versao:** 1.0
**Responsavel:** Iuran (PM)
**Status:** Draft — Ready for Architecture Review
**Data:** 09/02/2026
**Predecessora:** Sprint 33 (Content Autopilot Foundation) — CONCLUIDA (QA 96/100)
**Tipo:** Feature Sprint (A/B Testing & Segment Optimization)
**Estimativa Total:** ~16-20h core
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5

---

## 1. Contexto Estrategico

### 1.1 Baseline pos-Sprint 33

| Metrica | Valor |
|:--------|:------|
| Testes passando | 286/286 (50 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | ~109 rotas (Next.js 16 Turbopack) |
| Trajetoria QA | S25(93) → S26(97) → S27(97) → S28(98) → Sigma(99) → S29(100) → S30(98) → S31(99) → S32(91) → **S33(96)** |
| Auth cobertura | 100% — `requireBrandAccess` em 25+ rotas brand-scoped |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Rate Limiting | `withRateLimit()` em 4 rotas |
| Content Autopilot | Calendario Editorial + Content Generation (4 formatos) + Approval Workflow (S33) |
| Personalization | Rules Runtime + PersonalizationResolver + DynamicContentRules (S31) |
| Propensity | PropensityEngine hot/warm/cold scoring + LeadState 12 campos (S28/S29) |
| Ads Integration | Meta + Google REST puro, cache 15min, token refresh (S30) |
| Performance | War Room + Sentry Anomaly Engine + PerformanceAdvisor (S18/S30) |
| BudgetOptimizer | Engine funcional com CrossChannelMetricDoc + OptimizationInsight (S29) |
| Automation | Maestro Engine + Kill-Switch persist + DLQ (S31) |
| Social | Instagram Graph API real + LinkedIn scaffold + Response Engine (S32) |
| BYO Keys | MonaraTokenVault com AES-256 — `brands/{brandId}/secrets` |

### 1.2 Por que Sprint 34: A/B Testing & Segment Optimization

O Agency Engine ja possui 3 pilares fundamentais que, ate agora, operam de forma **isolada**:

1. **Propensity Engine (S28)** — classifica leads em hot/warm/cold com score normalizado 0-1
2. **DynamicContentRules (S28/S31)** — permite variacoes de conteudo por persona, mas sem medicao de impacto
3. **Content Autopilot (S33)** — gera e agenda conteudo em 4 formatos, mas sem variacao por segmento

**O problema critico:** nenhum destes motores sabe qual variacao de conteudo PERFORMA MELHOR para cada segmento. O ciclo de feedback esta aberto — variamos conteudo, mas nao medimos qual variacao converte mais para leads hot vs cold.

**Sprint 34 fecha este ciclo** criando:

1. **A/B Test Engine** — motor de experimentacao com variantes por segmento, assignment deterministico por lead, e coleta de metricas (impressoes, clicks, conversoes, revenue)
2. **Performance por Segmento** — dashboard filtrado por propensity segment, permitindo visualizar metricas com granularidade hot/warm/cold
3. **Auto-Optimization** — motor que pausa automaticamente variantes perdedoras e promove as vencedoras quando atingem significancia estatistica, integrado com Kill-Switch e Automation Engine

**Tres problemas criticos que Sprint 34 resolve:**

1. **Zero medicao de variantes** — O sistema gera variacoes de conteudo (headlines, CTAs, ofertas) mas nao sabe qual delas converte melhor. Decisoes de conteudo sao cegas.

2. **Performance sem granularidade de segmento** — O Performance War Room (S18) mostra metricas globais por plataforma, mas nao permite filtrar por segmento de propensity (hot/warm/cold). Um ROAS de 3.0 global pode esconder que leads hot convertem 5x mais que cold.

3. **Otimizacao manual e reativa** — Quando uma variante nao performa, ninguem pausa. Quando uma vence, ninguem escala. O motor precisa de logica automatica para pausar losers e promover winners com base em significancia estatistica.

### 1.3 Backlog Herdado da S33 (2 itens)

| Nota | Descricao | Acao S34 |
|:-----|:----------|:---------|
| N1 | Timer Leak: MessagePort em hooks tests (heranca S32→S33) | S34-GOV-01: Fix per-hook cleanup/unmount + avaliar polyfill MessageChannel |
| N2 | BrandVoice 2.0: engagementScore (STRETCH S32→S33) | S34-GOV-02: Implementar `getTopEngagementExamples()` + peso no generation engine |

### 1.4 Inventario de Stubs/TODOs Existentes Relevantes

| Arquivo | Stub/TODO | Relacao S34 |
|:--------|:---------|:-----------|
| `budget-optimizer.ts` | Engine funcional mas sem trigger automatico | S34-AO-03 pode integrar |
| `DynamicContentRule` | contentVariations sem medicao de performance | S34-AB exatamente resolve isso |
| `PersonalizationResolver` | Resolve variacoes mas nao sabe qual performa melhor | S34-AB fecha o ciclo |

### 1.5 Funcionalidades NOVAS (10 total)

| # | Item | Justificativa |
|:--|:-----|:-------------|
| 1 | A/B Test Engine (data model + engine + assignment) | Motor de experimentacao inexistente |
| 2 | API `/api/intelligence/ab-tests` (CRUD) | Gerenciamento de testes |
| 3 | API `/api/intelligence/ab-tests/[testId]/event` | Coleta de metricas |
| 4 | UI A/B Testing Dashboard + Creation Wizard | Interface de gestao de testes |
| 5 | Segment Performance Filter | Granularidade hot/warm/cold no War Room |
| 6 | Segment Breakdown Component | Visualizacao comparativa por segmento |
| 7 | Auto-Optimization Engine | Logica de pausa/promocao automatica |
| 8 | API `/api/intelligence/ab-tests/[testId]/optimize` | Trigger de otimizacao |
| 9 | UI Auto-Optimization Dashboard (toggle + history) | Controle e historico de decisoes automaticas |
| 10 | engagementScore no Content Generation (N2 backlog) | STRETCH S32→S33→S34 |

### 1.6 Divida Tecnica a Resolver (2 itens de governanca)

| # | Item | Origem |
|:--|:-----|:-------|
| GOV-01 | Timer leak MessagePort em hooks tests | Nota N1 S32→S33 |
| GOV-02 | engagementScore no Content Generation | Nota N2 S32→S33 |

---

## 2. Objetivo da Sprint

> **"Criar o motor de A/B Testing por segmento de propensity — permitindo criar testes com variantes de conteudo (headline, CTA, oferta), atribuir variantes deterministicamente por lead, coletar metricas (impressoes, clicks, conversoes, revenue), visualizar performance filtrada por segmento hot/warm/cold, e otimizar automaticamente (pausar losers, promover winners) com base em significancia estatistica — fechando o ciclo de feedback entre personalizacao e performance, e resolvendo as 2 dividas tecnicas herdadas da S33."**

### 2.1 North Star Metrics

| Metrica | Antes (S33) | Meta (S34) |
|:--------|:-----------|:-----------|
| A/B Testing Engine | **Inexistente** | **Funcional** (CRUD + variantes por segmento + assignment deterministico) |
| Medicao de Variantes | **Inexistente** | **Metricas por variante** (impressoes, clicks, conversoes, revenue, CTR, CR) |
| Performance por Segmento | **Global apenas** | **Filtrado por hot/warm/cold** (dashboard + breakdown chart) |
| Auto-Optimization | **Inexistente** | **Automatico** (pausa losers + promove winners com significancia >= 95%) |
| Timer leak warnings | **Presente** (N1 S33) | **Zero** warnings de MessagePort |
| engagementScore | **Campo existe, nao usado** (N2 S33) | **Funcional** (injetado no Content Generation Engine) |

### 2.2 Metricas Secundarias

| Metrica | Meta |
|:--------|:-----|
| Testes passando | >= 286/286 (zero regressao) + novos testes AB, segment, optimization |
| TypeScript errors | 0 |
| Build (rotas) | >= ~109 + novas rotas ab-tests (~113-115 estimado) |
| QA Score | >= 98/100 |
| Novas dependencias npm | 0 |

---

## 3. Requisitos Funcionais

### RF-34.0: Governanca & Backlog S33 (Fase 0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-34.0.1 | Timer leak fix (N1) | Revisar os 3 testes de hooks (`use-funnels`, `use-brands`, `use-brand-assets`). Adicionar `cleanup()` ou `unmount()` explicito no `afterEach` de cada suite. Avaliar se o polyfill `MessageChannel` no `jest.setup.js` pode ser isolado ou substituido por mock. Objetivo: zero warnings `A worker process has failed to exit gracefully`. Se nao resolvivel completamente: documentar e configurar `--forceExit` como fallback temporario com `@todo S35`. |
| RF-34.0.2 | engagementScore (N2) | Implementar funcao `getTopEngagementExamples(brandId, limit?)` em `lib/firebase/content-calendar.ts` ou novo modulo `lib/content/engagement-scorer.ts`. Busca top-N interacoes da collection `brands/{brandId}/social_interactions` ordenadas por `engagementScore` desc. Injetar resultado como contexto adicional no prompt do `generation-engine.ts` ("Exemplos de conteudo de alta performance desta marca: ..."). O campo `engagementScore` ja existe como opcional no type `SocialInteractionRecord` (criado em S33-GOV-04). Multiplicador leve — nao obrigatorio para geracao funcionar (graceful degradation se nenhuma interacao existir). |

### RF-34.1: A/B Test Engine (Fase 1 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-34.1.1 | Data model Firestore | Collection `brands/{brandId}/ab_tests` (subcollection por brandId). Campos obrigatorios: `id` (string auto), `name` (string), `brandId` (string), `targetSegment` (enum: 'hot' \| 'warm' \| 'cold' \| 'all'), `variants` (ABTestVariant[]), `status` (enum: 'draft' \| 'running' \| 'paused' \| 'completed'), `metrics` ({ totalImpressions, totalConversions, totalRevenue }), `winnerVariantId` (string \| null), `significanceLevel` (number \| null — 0-1), `autoOptimize` (boolean — flag para auto-optimization engine), `startDate` (Timestamp \| null), `endDate` (Timestamp \| null), `createdAt` (Timestamp), `updatedAt` (Timestamp). |
| RF-34.1.2 | ABTestVariant type | Embedded array no ABTest. Campos: `id` (string), `name` (string), `contentVariations` ({ headline: string, cta?: string, offerId?: string, vslId?: string, body?: string }), `weight` (number — porcentagem do trafego, default 1/N), `impressions` (number), `clicks` (number), `conversions` (number), `revenue` (number). Campos calculados (nao persistidos): `ctr` (clicks/impressions), `conversionRate` (conversions/impressions). |
| RF-34.1.3 | AB Test Engine | Modulo `lib/intelligence/ab-testing/engine.ts` com classe `ABTestEngine`. Metodos: `createTest(brandId, params)` — cria teste com N variantes em status `draft`. `startTest(brandId, testId)` — muda status para `running`, registra `startDate`. `pauseTest(brandId, testId)` — muda para `paused`. `completeTest(brandId, testId)` — muda para `completed`, registra `endDate`. `assignVariant(brandId, testId, leadId)` — retorna variante para o lead usando hash deterministico (leadId + testId) para garantir consistencia (mesmo lead sempre ve a mesma variante). `recordEvent(brandId, testId, variantId, eventType, value?)` — incrementa metricas (impressions, clicks, conversions, revenue) na variante correspondente. |
| RF-34.1.4 | Assignment deterministico | Funcao `hashAssign(leadId: string, testId: string, variantCount: number): number`. Usa hash simples (djb2 ou similar — ja existe `djb2` no codebase via RAG stubs S28). O hash de `leadId + testId` determina o indice da variante. Garante que o mesmo lead sempre recebe a mesma variante no mesmo teste. NAO depende de estado — puro e deterministico. |
| RF-34.1.5 | CRUD helpers Firestore | Modulo `lib/firebase/ab-tests.ts` com funcoes: `createABTest(brandId, data)`, `getABTests(brandId, status?)`, `getABTest(brandId, testId)`, `updateABTest(brandId, testId, data)`, `deleteABTest(brandId, testId)`, `updateVariantMetrics(brandId, testId, variantId, delta)`. Todas com isolamento brandId obrigatorio, Timestamp. |
| RF-34.1.6 | API CRUD | Rota `/api/intelligence/ab-tests/route.ts` com metodos: `POST` (create test), `GET` (list tests, query param `status` opcional). Rota `/api/intelligence/ab-tests/[testId]/route.ts` com metodos: `GET` (get single), `PUT` (update/start/pause/complete), `DELETE` (delete). Todas com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-34.1.7 | API Assignment | Rota `/api/intelligence/ab-tests/[testId]/assign/route.ts` com `POST`. Body: `{ brandId, leadId }`. Retorna `{ testId, variantId, variantName, contentVariations }`. Apenas testes em status `running` retornam assignment. Testes em `draft`/`paused`/`completed` retornam erro 400. |
| RF-34.1.8 | API Event recording | Rota `/api/intelligence/ab-tests/[testId]/event/route.ts` com `POST`. Body: `{ brandId, variantId, eventType: 'impression' \| 'click' \| 'conversion', value?: number }`. Incrementa metricas na variante e no teste (totais). Usa `increment()` do Firestore para atomicidade. |
| RF-34.1.9 | UI Creation Wizard | Pagina `/intelligence/ab-testing/page.tsx` com wizard de criacao: Step 1 — nome, target segment (select hot/warm/cold/all). Step 2 — adicionar variantes (min 2, max 5) com campos headline, CTA, body. Step 3 — review e confirmar. Card com teste criado mostra status badge e botao Start/Pause. |
| RF-34.1.10 | UI Results Dashboard | Na mesma pagina, secao de resultados ao clicar em um teste running/completed: tabela de variantes com metricas (impressions, clicks, CTR, conversions, CR, revenue), highlight na variante lider, indicador de significancia estatistica (badge verde >= 95%, amarelo 80-95%, cinza < 80%). Chart de barras comparativo para CR por variante. |
| RF-34.1.11 | Sidebar integration | Adicionar item "A/B Testing" no Sidebar (`components/layout/sidebar.tsx`) sob secao Intelligence, com icone `FlaskConical` do Lucide. |
| RF-34.1.12 | Significancia estatistica | Funcao `calculateSignificance(variantA: { conversions, impressions }, variantB: { conversions, impressions }): number` retornando p-value (0-1). Implementar via Z-test para proporcoes (formula estatistica padrao, sem lib externa). Significancia = 1 - p-value. Exibir como porcentagem na UI. |

### RF-34.2: Performance por Segmento (Fase 2 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-34.2.1 | Segment filter no Performance dashboard | Adicionar componente `SegmentFilter` no topo da pagina `/performance/page.tsx`. Select com opcoes: All (default), Hot, Warm, Cold. Ao selecionar, refetch de metricas filtradas pelo segmento. |
| RF-34.2.2 | API extension — segment query param | Extender rota `/api/performance/metrics` para aceitar query param `segment` (hot \| warm \| cold). Quando presente, a rota filtra metricas apenas para leads do segmento correspondente. Usa dados de `brands/{brandId}/leads` onde `segment == param`. Quando ausente, comportamento atual (global) — zero breaking change. |
| RF-34.2.3 | Segment Breakdown Component | Novo componente `SegmentBreakdown` em `components/performance/segment-breakdown.tsx`. Exibe 3 cards lado a lado (Hot, Warm, Cold) com metricas resumidas: total leads, conversions, avg revenue, conversion rate. Cores: Hot (vermelho/laranja), Warm (amarelo), Cold (azul). |
| RF-34.2.4 | Segment Insights (Gemini) | Extender `PerformanceAdvisor` para aceitar parametro `segmentData?` com breakdown por segmento. Quando disponivel, Gemini gera insights comparativos: "Leads hot convertem 3.2x mais que cold via Instagram" ou "Segmento warm tem CPA 40% menor que hot — oportunidade de escala". Adicionar no prompt existente, nao substituir. |
| RF-34.2.5 | Hook `useSegmentPerformance` | Hook `lib/hooks/use-segment-performance.ts` que: (a) busca metricas filtradas pela API, (b) computa deltas entre segmentos, (c) retorna dados formatados para os componentes. Cache com SWR pattern (revalidacao a cada 60s). |

### RF-34.3: Auto-Optimization (Fase 3 — P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-34.3.1 | Auto-Optimizer Engine | Modulo `lib/intelligence/ab-testing/auto-optimizer.ts` com classe `AutoOptimizer`. Metodo principal: `evaluate(brandId, testId): Promise<OptimizationDecision[]>`. Avalia variantes de um teste e retorna decisoes de pausar/promover. |
| RF-34.3.2 | Regras de otimizacao | Regra 1: **Pause Loser** — Se variante tem CR < 50% do lider E impressions >= 100, marcar como `paused` (weight → 0). Regra 2: **Declare Winner** — Se significancia >= 95% E impressions >= 200 por variante, declarar lider como `winner`, completar teste, registrar `winnerVariantId`. Regra 3: **Early Stop** — Se uma variante tem 0 conversoes apos 500 impressoes, pausar automaticamente. Thresholds configuraveis no teste (campos `minImpressionsForDecision`, `significanceThreshold`). |
| RF-34.3.3 | OptimizationDecision type | Type `OptimizationDecision`: `{ testId, variantId, action: 'pause_variant' \| 'declare_winner' \| 'early_stop' \| 'continue', reason: string, metrics: { impressions, conversions, cr, significance? }, timestamp: Timestamp }`. Persistido em subcollection `brands/{brandId}/ab_tests/{testId}/optimization_log`. |
| RF-34.3.4 | Kill-Switch integration | Antes de executar qualquer acao automatica, verificar estado do Kill-Switch via `getKillSwitchState(brandId)` (existente em S31). Se Kill-Switch ativo: logar decisao mas NAO executar. Respeitar global kill-switch incondicionalmente. |
| RF-34.3.5 | API optimize | Rota `/api/intelligence/ab-tests/[testId]/optimize/route.ts` com `POST`. Body: `{ brandId }`. Executa `AutoOptimizer.evaluate()` e aplica decisoes. Retorna lista de `OptimizationDecision[]`. Apenas testes com `autoOptimize: true` e status `running` sao otimizaveis. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-34.3.6 | UI Auto-Optimization | Na pagina de A/B Testing, ao expandir um teste: (a) Toggle "Auto-Optimize" (liga/desliga `autoOptimize` flag). (b) Historico de decisoes automaticas (timeline com acao + motivo + timestamp). (c) Botao "Run Optimization Now" para trigger manual. Badge no card do teste: "Auto" (azul) quando `autoOptimize: true`. |
| RF-34.3.7 | Automation Log integration | Cada acao de auto-optimization gera entry no `automation_logs` (existente S31) com tipo `ab_optimization`. Aparece no ControlCenter da pagina de automacao e nas notificacoes in-app. |

---

## 4. Requisitos Nao-Funcionais

| ID | Requisito | Criterio |
|:---|:----------|:---------|
| RNF-34.01 | Zero novas deps npm | `package.json` inalterado |
| RNF-34.02 | REST puro | Todas as chamadas externas via `fetch()`. Zero SDK novo. |
| RNF-34.03 | AB Test API latencia | < 300ms para CRUD, < 100ms para assignment (hash puro + 1 read) |
| RNF-34.04 | Event recording latencia | < 200ms (Firestore `increment()` atomico) |
| RNF-34.05 | Segment filter latencia | < 500ms (Firestore query com index no campo `segment`) |
| RNF-34.06 | Isolamento multi-tenant | Zero acesso cross-tenant em TODAS as funcionalidades. brandId obrigatorio em todas as queries. |
| RNF-34.07 | Padroes Sigma | `createApiError`/`createApiSuccess`, `requireBrandAccess`, `Timestamp`, `force-dynamic` em todas as rotas novas |
| RNF-34.08 | Assignment consistency | Mesmo lead + mesmo teste = sempre mesma variante (hash deterministico) |
| RNF-34.09 | Statistical integrity | Z-test implementado sem lib externa. Nenhuma decisao automatica sem >= 100 impressoes. |
| RNF-34.10 | Kill-Switch respect | Auto-optimization NUNCA executa se Kill-Switch ativo. Log-only mode. |
| RNF-34.11 | Zero publicacao real | Testes controlam variacoes de conteudo/display. NAO publicam em plataformas externas. |

---

## 5. Fases de Implementacao

### Fase 0: Governanca & Backlog S33 (~2h) — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S34-GOV-01 | Timer leak fix — cleanup per-hook nos 3 testes + avaliar MessageChannel polyfill | DT-01 (potencial) | M (~1h) |
| S34-GOV-02 | engagementScore — `getTopEngagementExamples()` + inject no generation engine | DT-02 (potencial) | S+ (~45min) |
| S34-GATE-00 | **Gate Check 0: tsc=0, testes passam, zero timer warnings (ou --forceExit doc), engagementScore funcional** | — | XS (~15min) |

### Fase 1: A/B Test Engine (P0) — ~6-7h — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S34-AB-01 | Types + Data model (`types/ab-testing.ts`) | DT-03 (subcollection design) | S (~30min) |
| S34-AB-02 | CRUD Firestore (`lib/firebase/ab-tests.ts`) | — | M (~1h) |
| S34-AB-03 | AB Test Engine (`lib/intelligence/ab-testing/engine.ts`) + hash assignment + significance calc | DT-04 (hash strategy), DT-05 (z-test impl) | L (~2h) |
| S34-AB-04 | API CRUD `/api/intelligence/ab-tests/` + `[testId]/` | — | M (~1h) |
| S34-AB-05 | API Assignment `/api/intelligence/ab-tests/[testId]/assign/` | — | S (~30min) |
| S34-AB-06 | API Event `/api/intelligence/ab-tests/[testId]/event/` | — | S (~30min) |
| S34-AB-07 | UI A/B Testing page (creation wizard + results dashboard + sidebar) | DT-06 (UI layout) | M+ (~1.5h) |
| S34-GATE-01 | **Gate Check 1: CRUD funcional, assignment retorna variante consistente, event recording incrementa, UI renderiza, tsc=0, testes passam** | — | XS (~15min) |

### Fase 2: Performance por Segmento (P0) — ~4-5h — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S34-SEG-01 | API extension — segment query param em `/api/performance/metrics` | DT-07 (query strategy) | S+ (~45min) |
| S34-SEG-02 | SegmentFilter + SegmentBreakdown components | — | M (~1.5h) |
| S34-SEG-03 | Hook `useSegmentPerformance` | — | S (~45min) |
| S34-SEG-04 | PerformanceAdvisor extension — segment insights | DT-08 (prompt extension) | S+ (~45min) |
| S34-SEG-05 | UI integration na pagina Performance | — | S (~30min) |
| S34-GATE-02 | **Gate Check 2: filter funcional, breakdown renderiza 3 segmentos, insights comparam segmentos, tsc=0, testes passam** | — | XS (~15min) |

### Fase 3: Auto-Optimization (P1) — ~4-5h — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S34-AO-01 | AutoOptimizer engine + OptimizationDecision type | DT-09 (threshold config), DT-10 (log subcollection) | L (~2h) |
| S34-AO-02 | Kill-Switch integration + Automation Log integration | — | S (~30min) |
| S34-AO-03 | API `/api/intelligence/ab-tests/[testId]/optimize/` | — | S (~30min) |
| S34-AO-04 | UI auto-optimization (toggle + history + manual trigger) + testes | — | M (~1.5h) |
| S34-GATE-03 | **Gate Check 3: optimizer pausa losers corretamente, declara winner com significancia, respeita kill-switch, UI funcional, tsc=0, testes passam** | — | XS (~15min) |

### Fase 4: Governanca Final (~0.5h)

| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S34-GOV-03 | Contract-map update — nova lane `ab_testing_optimization` | XS (~15min) |
| S34-GOV-04 | ACTIVE_SPRINT.md + ROADMAP.md atualizados | XS (~15min) |

---

## 6. DTs Esperados (Decision Trees — para Athos)

Os DTs abaixo sao hipoteses de decisoes arquiteturais que o Athos deve validar:

| DT | Questao | Contexto |
|:---|:--------|:---------|
| DT-01 | Timer leak: per-hook `cleanup()`/`unmount()` em `afterEach` vs isolamento do polyfill `MessageChannel` no `jest.setup.js`? Ou `--forceExit` como fallback? | Nota N1 S32→S33. 3 hooks afetados: use-funnels, use-brands, use-brand-assets. |
| DT-02 | `getTopEngagementExamples()`: query com `orderBy('engagementScore', 'desc').limit(5)` na subcollection `social_interactions` — precisa de index? | engagementScore e campo opcional. Query pode retornar vazio (graceful). |
| DT-03 | `ab_tests` como subcollection `brands/{brandId}/ab_tests` — confirmar alinhamento com pattern existente | Patterns: `brands/{brandId}/rate_limits`, `brands/{brandId}/secrets`, `brands/{brandId}/content_calendar`. |
| DT-04 | Hash assignment: `djb2(leadId + testId) % variantCount` vs SHA-256 truncado? | djb2 ja existe no codebase (RAG stubs S28). Simples e deterministico. SHA-256 mais uniforme mas overhead desnecessario? |
| DT-05 | Z-test para proporcoes: implementar formula inline vs funcao utility? `z = (p1 - p2) / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))` | Zero lib estatistica. Formula padrao, ~15 linhas. Funcao utility reutilizavel parece melhor. |
| DT-06 | UI A/B Testing: pagina dedicada `/intelligence/ab-testing/page.tsx` ou tab na pagina Intelligence existente? | Pattern existente: paginas dedicadas para features complexas (offer-lab, creative, journey). A/B testing e complexa — pagina dedicada? |
| DT-07 | Segment filter no Performance: query Firestore com `where('segment', '==', param)` na collection `leads` + aggregate metricas client-side, ou pre-computar breakdown em collection separada? | Real-time vs performance. Collection leads pode ter muitos docs. |
| DT-08 | Prompt extension do PerformanceAdvisor: inject segment data no prompt existente ou segundo call dedicado? | Pattern existente: single call com prompt enriquecido. Dual-call e mais caro (2x Gemini). |
| DT-09 | Thresholds de auto-optimization: hardcoded constants vs configuraveis por teste? | Constants simples para MVP. Campos opcionais no ABTest type para override futuro. |
| DT-10 | Log de optimization: subcollection `ab_tests/{testId}/optimization_log` ou campo array no documento do teste? | Subcollection para append-only (pattern history log S33). Array limitado a 1MB doc size. |

---

## 7. Proibicoes (P-01 a P-08 herdadas + PB-01 a PB-06 novas)

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

### Novas S34

| ID | Proibicao |
|:---|:----------|
| PB-01 | ZERO lib estatistica externa — Z-test implementado inline (formula padrao, ~15 linhas) |
| PB-02 | ZERO assignment nao-deterministico — hash puro (leadId + testId), sem random, sem cookie |
| PB-03 | ZERO decisao automatica sem minimum impressions (>= 100 por variante) |
| PB-04 | ZERO auto-optimization se Kill-Switch ativo — log-only mode |
| PB-05 | ZERO drag-and-drop library (manter HTML5 nativo se UI necessitar) |
| PB-06 | ZERO publicacao real em plataformas — testes controlam apenas display/conteudo, nao execucao |

---

## 8. Criterios de Sucesso (CS-34.01 a CS-34.20)

| ID | Criterio | Verificacao |
|:---|:---------|:-----------|
| CS-34.01 | A/B Test CRUD funcional via API | Teste: POST cria, GET lista/filtra por status, PUT atualiza, DELETE remove |
| CS-34.02 | Variantes embedded no teste (min 2, max 5) | Teste: createTest com 2-5 variantes persiste corretamente |
| CS-34.03 | Assignment deterministico por lead | Teste: `assignVariant(brand, test, lead1)` retorna SEMPRE a mesma variante |
| CS-34.04 | Event recording incrementa metricas atomicamente | Teste: `recordEvent` incrementa impressions/clicks/conversions/revenue |
| CS-34.05 | UI creation wizard funcional (3 steps) | Visual: nome → variantes → review → criar |
| CS-34.06 | UI results dashboard mostra metricas por variante | Visual: tabela + chart + highlight lider + significance badge |
| CS-34.07 | Significancia estatistica calculada corretamente | Teste: Z-test com dados conhecidos retorna p-value esperado |
| CS-34.08 | Target segment filtra assignment | Teste: teste targetSegment='hot' so atribui para leads hot |
| CS-34.09 | Performance dashboard filtra por segmento | Visual: select Hot/Warm/Cold filtra metricas na pagina |
| CS-34.10 | SegmentBreakdown mostra 3 cards comparativos | Visual: Hot, Warm, Cold com metricas resumidas |
| CS-34.11 | PerformanceAdvisor gera insights por segmento | Teste: insights mencionam comparacao entre segmentos |
| CS-34.12 | AutoOptimizer pausa variante loser corretamente | Teste: variante com CR < 50% do lider + >= 100 impressions → paused |
| CS-34.13 | AutoOptimizer declara winner com significancia >= 95% | Teste: dados com significancia 95%+ → winner declarado |
| CS-34.14 | Kill-Switch bloqueia auto-optimization | Teste: Kill-Switch ON → decisoes logadas mas NAO executadas |
| CS-34.15 | Optimization log persistido em subcollection | Teste: decisoes em `ab_tests/{id}/optimization_log` |
| CS-34.16 | UI toggle auto-optimize funcional | Visual: toggle liga/desliga flag no teste |
| CS-34.17 | Timer leak resolvido (N1) | Test runner: zero warnings MessagePort (ou --forceExit documentado) |
| CS-34.18 | engagementScore funcional (N2) | Code review: `getTopEngagementExamples()` injetado no generation engine |
| CS-34.19 | Contract-map com lane `ab_testing_optimization` | Code review: `contract-map.yaml` tem nova lane |
| CS-34.20 | Isolamento multi-tenant em TODAS as features novas | Code review: zero query sem brandId |

---

## 9. Estimativa Total

| Fase | Esforco | Items |
|:-----|:--------|:------|
| Fase 0 — Governanca & Backlog S33 | ~2h | GOV-01, GOV-02 + Gate 0 |
| Fase 1 — A/B Test Engine | ~6-7h | AB-01 a AB-07 + Gate 1 |
| Fase 2 — Performance por Segmento | ~4-5h | SEG-01 a SEG-05 + Gate 2 |
| Fase 3 — Auto-Optimization | ~4-5h | AO-01 a AO-04 + Gate 3 |
| Fase 4 — Governanca Final | ~0.5h | GOV-03, GOV-04 |
| **TOTAL** | **~16-20h** | 18 items + 4 Gates |

---

## 10. Dependencias

| Dependencia | Status | Sprint Origem |
|:-----------|:-------|:-------------|
| Sprint 33 concluida (QA 96/100) | ✅ Confirmada | S33 |
| `PropensityEngine` (hot/warm/cold scoring) | ✅ Funcional | S28 |
| `PropensityResult` + `LeadState` types | ✅ 12 campos, segment field | S28/S29 |
| `PersonalizationResolver` (resolve por segment) | ✅ Matching engine | S31 |
| `DynamicContentRule` (variantes por persona) | ✅ CRUD ativo | S28 |
| `PerformanceAdvisor` (insights Gemini) | ✅ JSON mode | S18/S30 |
| `BudgetOptimizerEngine` (insights de realocacao) | ✅ Funcional | S29 |
| Content Generation Engine (4 formatos) | ✅ Brand Voice injection | S33 |
| `SocialInteractionRecord` (engagementScore field) | ✅ Campo opcional existe | S33 |
| Kill-Switch persistence + `getKillSwitchState()` | ✅ Firestore + Slack + In-App | S31 |
| `automation_logs` collection | ✅ CRUD via `lib/firebase/automation.ts` | S31 |
| `createApiError`/`createApiSuccess` (Sigma) | ✅ 54+ rotas | Sigma |
| `requireBrandAccess` (Sigma) | ✅ 25+ rotas | Sigma |
| `generateWithGemini()` com JSON mode | ✅ Funcional | S28/S32 |
| Firestore subcollection pattern | ✅ Usado em 6+ collections | Multi-sprint |
| Zod para validacao | ✅ Formalizada | S32/S33 |
| NAV_GROUPS em constants.ts | ✅ Sidebar 2.0 | S21 |
| Lucide Icons (`FlaskConical`, `BarChart3`) | ✅ No bundle (shadcn/ui) | — |
| `djb2` hash function | ✅ Existe no codebase (RAG stubs S28) | S28 |
| Nenhum MCP/CLI novo | ✅ N/A | — |
| Nenhuma dependencia npm nova | ✅ N/A | — |

---

## 11. Escopo NAO incluido em S34

| Item | Motivo |
|:-----|:-------|
| Funnel Analytics (drop-off por etapa) | Originalmente no ROADMAP S34, removido pelo Conselho — escopo separado S35 |
| Budget Optimizer Real (recomendacoes ROAS) | Engine ja existe (S29). Trigger automatico e S35 |
| Multi-Platform Publishing Real | Depende de OAuth flows + rate limiting per-platform |
| LinkedIn Real Inbox | Scaffold ja existe (S32). Inbox real e S35+ |
| Bayesian AB Testing | Complexidade excessiva para MVP. Z-test e suficiente. S35+ se necessario |
| Server-Side Rendering de variantes | Zero SSR neste sprint. Variantes resolvidas client-side via API |

---

## 12. Arquivos Esperados (Novos e Modificados)

### Novos (~16-20 arquivos)

| Arquivo | Sprint Item | Tipo |
|:--------|:-----------|:-----|
| `app/src/types/ab-testing.ts` | S34-AB-01 | Types |
| `app/src/lib/firebase/ab-tests.ts` | S34-AB-02 | CRUD Firestore |
| `app/src/lib/intelligence/ab-testing/engine.ts` | S34-AB-03 | Engine |
| `app/src/lib/intelligence/ab-testing/significance.ts` | S34-AB-03 | Utility (Z-test) |
| `app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | S34-AO-01 | Engine |
| `app/src/app/api/intelligence/ab-tests/route.ts` | S34-AB-04 | API Route |
| `app/src/app/api/intelligence/ab-tests/[testId]/route.ts` | S34-AB-04 | API Route |
| `app/src/app/api/intelligence/ab-tests/[testId]/assign/route.ts` | S34-AB-05 | API Route |
| `app/src/app/api/intelligence/ab-tests/[testId]/event/route.ts` | S34-AB-06 | API Route |
| `app/src/app/api/intelligence/ab-tests/[testId]/optimize/route.ts` | S34-AO-03 | API Route |
| `app/src/app/intelligence/ab-testing/page.tsx` | S34-AB-07 | UI Page |
| `app/src/components/intelligence/ab-test-wizard.tsx` | S34-AB-07 | UI Component |
| `app/src/components/intelligence/ab-test-results.tsx` | S34-AB-07 | UI Component |
| `app/src/components/intelligence/ab-test-card.tsx` | S34-AB-07 | UI Component |
| `app/src/components/performance/segment-filter.tsx` | S34-SEG-02 | UI Component |
| `app/src/components/performance/segment-breakdown.tsx` | S34-SEG-02 | UI Component |
| `app/src/lib/hooks/use-segment-performance.ts` | S34-SEG-03 | Hook |
| `app/src/lib/content/engagement-scorer.ts` | S34-GOV-02 | Engine (N2) |
| `app/src/__tests__/lib/intelligence/ab-testing/engine.test.ts` | S34-AB-03 | Test |
| `app/src/__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | S34-AO-01 | Test |

### Modificados (~8-10 arquivos)

| Arquivo | Sprint Item | Alteracao |
|:--------|:-----------|:----------|
| `app/src/components/layout/sidebar.tsx` | S34-AB-07 | Adicionar item A/B Testing em secao Intelligence |
| `app/src/app/performance/page.tsx` | S34-SEG-01, S34-SEG-05 | Adicionar SegmentFilter + SegmentBreakdown |
| `app/src/app/api/performance/metrics/route.ts` | S34-SEG-01 | Aceitar query param `segment` |
| `app/src/lib/performance/engine/performance-advisor.ts` | S34-SEG-04 | Aceitar `segmentData` param + prompt extension |
| `app/src/lib/ai/prompts/performance-advisor.ts` | S34-SEG-04 | Adicionar secao segment comparison no prompt |
| `app/src/lib/content/generation-engine.ts` | S34-GOV-02 | Injetar `getTopEngagementExamples()` no prompt |
| `app/src/__tests__/hooks/use-brands.test.ts` | S34-GOV-01 | Cleanup/unmount no afterEach |
| `app/src/__tests__/hooks/use-brand-assets.test.ts` | S34-GOV-01 | Cleanup/unmount no afterEach |
| `app/jest.setup.js` | S34-GOV-01 | Avaliar isolamento MessageChannel polyfill |
| `_netecmt/core/contract-map.yaml` | S34-GOV-03 | Nova lane `ab_testing_optimization` |

---

## 13. Contract-Map Update Esperado (S34-GOV-03)

```yaml
ab_testing_optimization:
  paths:
    - "app/src/lib/intelligence/ab-testing/**"               # S34-AB-03, S34-AO-01
    - "app/src/lib/firebase/ab-tests.ts"                     # S34-AB-02
    - "app/src/app/api/intelligence/ab-tests/**"             # S34-AB-04/05/06, S34-AO-03
    - "app/src/app/intelligence/ab-testing/**"               # S34-AB-07
    - "app/src/components/intelligence/ab-test-*.tsx"         # S34-AB-07
    - "app/src/components/performance/segment-*.tsx"          # S34-SEG-02
    - "app/src/lib/hooks/use-segment-performance.ts"         # S34-SEG-03
    - "app/src/lib/content/engagement-scorer.ts"             # S34-GOV-02
    - "app/src/types/ab-testing.ts"                          # S34-AB-01
  contract: "_netecmt/contracts/ab-testing-optimization-spec.md"
```

---

## 14. Mapa de Dependencias Internas (Sprint 34)

```
Fase 0 (Governanca)
  S34-GOV-01 (Timer Leak) ─── independente
  S34-GOV-02 (engagementScore) ─── depende de SocialInteractionRecord (S33)
  │
  ▼ GATE 0
  │
Fase 1 (A/B Test Engine)
  S34-AB-01 (Types) ─── base para tudo
  S34-AB-02 (CRUD) ←── S34-AB-01
  S34-AB-03 (Engine + Hash + Significance) ←── S34-AB-01, djb2 (S28)
  S34-AB-04 (API CRUD) ←── S34-AB-02, S34-AB-03
  S34-AB-05 (API Assign) ←── S34-AB-03
  S34-AB-06 (API Event) ←── S34-AB-02
  S34-AB-07 (UI) ←── S34-AB-04, S34-AB-05, S34-AB-06
  │
  ▼ GATE 1
  │
Fase 2 (Performance por Segmento)
  S34-SEG-01 (API extension) ←── PropensityEngine (S28), LeadState (S29)
  S34-SEG-02 (Components) ─── independente (UI)
  S34-SEG-03 (Hook) ←── S34-SEG-01
  S34-SEG-04 (Advisor extension) ←── PerformanceAdvisor (S18/S30)
  S34-SEG-05 (UI integration) ←── S34-SEG-02, S34-SEG-03
  │
  ▼ GATE 2
  │
Fase 3 (Auto-Optimization)
  S34-AO-01 (Engine) ←── S34-AB-03 (significance calc), Kill-Switch (S31)
  S34-AO-02 (Integrations) ←── Kill-Switch (S31), automation_logs (S31)
  S34-AO-03 (API) ←── S34-AO-01
  S34-AO-04 (UI) ←── S34-AO-03
  │
  ▼ GATE 3
  │
Fase 4 (Governanca Final)
  S34-GOV-03 (Contract-map) ─── depende de TUDO acima
  S34-GOV-04 (ACTIVE_SPRINT + ROADMAP) ─── depende de TUDO acima
```

---

*PRD formalizado por Iuran (PM) sob aprovacao do Alto Conselho.*
*Sprint 34: A/B Testing & Segment Optimization | 09/02/2026*
*Veredito: Unanimidade 5/5 — Estimativa aprovada: ~16-20h*
