# 🗺️ Roadmap: Conselho de Funil — Agency Engine

> **Objetivo Final:** Transformar o Conselho de Funil em uma Agência de Marketing Autônoma que erradica a necessidade de agências externas — 24/7, com inteligência enterprise e execução automatizada.

**Última Atualização:** 09/02/2026
**Responsável:** Equipe NETECMT (Iuran, Athos, Leticia, Darllyson, Dandara)

---

## 📊 Visão Geral do Roadmap

### Fases Concluídas

| Sprint | Nome | Tipo | Foco | QA | Status |
|:-------|:-----|:-----|:-----|:---|:-------|
| **11** | Brain Expansion & Visual Intelligence | Feature | Visual Intelligence Engine, Party Mode UI, RAG Hardening | — | ✅ |
| **12** | Deep Intelligence | Feature | Feedback Loop, Brand Voice, Multi-Agent Consensus | — | ✅ |
| **13** | Intelligence Wing Foundation | Feature | Storage Foundation, Scout Agent, Analyst Agent, Keyword Mgmt | — | ✅ |
| **14** | Competitor Intelligence Expansion | Feature | Spy Agent, Tech Stack Detection, Funnel Tracker, Dossier | — | ✅ |
| **17** | Social Command Center | Feature | Unified Inbox, BrandVoice Translator, Sentiment Gate | — | ✅ |
| **18** | Performance War Room | Feature | Command Center, Sentry Engine, BYO Keys, Unified API | — | ✅ |
| **19** | Funnel Autopsy & Offer Lab | Feature | Motor Autopsy, Offer Engineering (Hormozi), Score Irresistibilidade | — | ✅ |
| **20** | Automation & Personalization | Feature | Maestro Engine, Meta/Instagram Adapters, Webhooks, Token Vault | — | ✅ |
| **21** | UX/UI War Room & Navigation | Feature | Sidebar 2.0, Discovery Hub, AI Cost Guard, Saneamento de Rotas | — | ✅ |
| **22** | Estabilização do Produto | Stabilization | Smoke Tests, Fix Gemini Model, Error Handling, Seed Data | — | ✅ |
| **23** | Intelligence Scale | Feature | Firecrawl Integration, Elite Asset Extraction, Fallback System | — | ✅ |
| **24** | ROI & UX Intelligence | Feature | Assets Panel, Deep RAG Expansion, Multi-tenant Guardrails | — | ✅ |
| **25** | Predictive & Creative Engine | Feature | Conversion Predictor (CPS), Ad Generation Pipeline, Multi-Input | 93 | ✅ |
| **26** | Technical Debt Cleanup | Stabilization | 161→0 erros TypeScript, Path Fixes, Stubs Documentados | 97 | ✅ |
| **27** | Hybrid: Backlog Cleanup + Attribution Revival | Hybrid | 14→1 test suites, Attribution Revival (4 módulos), Dashboard | 97 | ✅ |
| **28** | Hybrid: Cleanup & Foundations + Personalization | Hybrid | RAG Stubs, Adapter Layer, Personalization Engine, Dashboard + Rules | 98 | ✅ |
| **Sigma** | Codebase Consistency | Stabilization | Auth 25+ rotas, tipos consolidados, API unificada, Pinecone dedup | 99 | ✅ |
| **29** | Assets & Persistence Hardening | Hybrid | Discovery Hub, Persistência Autopsy/Offer, LeadState 12 campos | 100 | ✅ |
| **30** | Ads Integration Foundation | Feature | Meta + Google REST puro, cache 15min, token refresh, CAPI, Offline Conversions | 98 | ✅ |
| **31** | Automation Engine & Rules Runtime | Feature | Automation Page real, Kill-Switch persist + Slack, Rules Runtime, DLQ | 99 | ✅ |
| **32** | Social Integration 2.0 + Rate Limiting | Feature | Rate Limiting 4 rotas, Instagram Graph API, LinkedIn Scaffold, Response Engine | 91 | ✅ |
| **33** | Content Autopilot Foundation | Feature | Calendário Editorial, Content Generation 4 formatos, Approval Workflow 6 estados | 96 | ✅ |
| **34** | A/B Testing & Segment Optimization | Feature | A/B Engine, Segment Performance, Auto-Optimization, Z-test significance | 98 | ✅ |

### Trajetória de Qualidade (QA Scores)
```
S25 (93) → S26 (97) → S27 (97) → S28 (98) → Sigma (99) → S29 (100) → S30 (98) → S31 (99) → S32 (91) → S33 (96) → S34 (98)
```

---

## 🏛️ Arquitetura: As 3 Alas do Agency Engine

### 🔭 Ala de Inteligencia (Intelligence Wing)
*Sprints 13, 14, 23, 24, 27, 28, 31*

| Funcionalidade | Descrição | Sprint | Status |
|:---------------|:----------|:-------|:-------|
| Social Listening | Monitorar menções, hashtags, sentimento | 13 | ✅ |
| Competitor Intelligence | Dossiê, tech stack, funnel tracking | 14 | ✅ |
| News & Trend Radar | Feed de oportunidades via RSS/Google News | 13 | ✅ |
| Keyword Mining | Demanda por plataforma e estágio de funil | 13 | ✅ |
| Deep Crawling (Firecrawl) | Crawling profundo com fallback system | 23 | ✅ |
| Elite Asset Extraction | Headlines, CTAs, hooks de alta performance | 23, 24 | ✅ |
| Attribution Engine | Multi-touch (Last Click, U-Shape, Linear) | 27 | ✅ |
| Audience Deep-Scan (IA) | Persona + propensity via Gemini | 28 | ✅ |
| Propensity Engine | Scoring hot/warm/cold com recência | 28 | ✅ |
| Personalization Resolver | Resolução de conteúdo dinâmico por segment do lead | 31 | ✅ |

### 📚 Ala de Biblioteca (Library Wing)
*Sprints 12, 24, 25*

| Funcionalidade | Descrição | Sprint | Status |
|:---------------|:----------|:-------|:-------|
| Creative Vault | Banco de criativos versionados | 24 | ✅ |
| Deep RAG Pipeline | Elite assets injetados no RAG | 24, 28 | ✅ |
| Copy DNA | Headlines e hooks categorizados | 24 | ✅ |
| Funnel Blueprints | Templates de funis validados | 19 | ✅ |
| Conversion Predictor (CPS) | Scoring preditivo 6 dimensões | 25 | ✅ |

### ⚙️ Ala de Operacoes (Operations Wing)
*Sprints 17, 18, 19, 20, 25, 28, 30, 31, 32*

| Funcionalidade | Descrição | Sprint | Status |
|:---------------|:----------|:-------|:-------|
| Social Command Center | Unified Inbox + BrandVoice | 17 | ✅ |
| Performance War Room | Dashboard + Sentry Anomaly Engine | 18 | ✅ |
| Funnel Autopsy | Diagnóstico forense de funis via URL | 19 | ✅ |
| Offer Engineering Lab | Wizard Hormozi + Score Irresistibilidade | 19 | ✅ |
| Automation Maestro | Motor personalização (Schwartz) | 20 | ✅ |
| Creative Automation | Geração de 3-5 variações multi-formato | 25 | ✅ |
| Dynamic Content Rules | CRUD de regras por persona/scan | 28 | ✅ |
| Ads Integration (Meta + Google) | REST puro, cache 15min, CAPI, Offline Conversions | 30 | ✅ |
| Rules Runtime | Resolução de conteúdo dinâmico por segment via API + Hook | 31 | ✅ |
| Kill-Switch Persistence | Firestore + Slack (anti-SSRF) + In-App notifications | 31 | ✅ |
| Webhook DLQ | Dead Letter Queue com retry manual | 31 | ✅ |
| Rate Limiting | Guardrails de quota por brandId (4 rotas, Firestore transactions) | 32 | ✅ |
| Instagram Graph API | Adapter REST puro com vault + token refresh | 32 | ✅ |
| LinkedIn API Scaffold | Vault check + health check (inbox Sprint 34) | 32 | ✅ |
| Social Response Engine | Motor de respostas com Gemini JSON + Zod + fallback | 32 | ✅ |

---

## 📈 Detalhe por Sprint

### Sprint 11-12: Fundações de IA
- Visual Intelligence Engine (Gemini Vision)
- Multi-Agent Consensus (Party Mode)
- RAG Hardening (Pinecone Serverless)
- Automated Feedback Loop (CTR/CVR no RAG)

### Sprint 13-14: Ala de Inteligência
- Intelligence Storage Foundation (Pinecone/Firestore isolado)
- Scout Agent MVP (RSS + Google News + deduplicação)
- Analyst Agent (sentimento + keywords via Gemini)
- Spy Agent (tech stack, funnel tracker, dossiê SWOT)
- Ethical Guardrails (robots.txt + PII sanitization)

### Sprint 17-18: Operações Sociais e Performance
- Unified Inbox (Instagram, WhatsApp, X, LinkedIn)
- BrandVoice Translator (Style Transfer, toneMatch)
- Sentiment Gate (bloqueio automático < 0.3)
- Performance Command Center (dashboard multicanal)
- Sentry Engine (detecção anomalias, alertas real-time)
- BYO Keys (AES-256-GCM para credenciais)

### Sprint 19-20: Automação e Personalização
- Motor Autopsy (5 heurísticas forenses)
- Offer Lab (fórmula Hormozi, Score Irresistibilidade)
- Personalization Maestro (5 níveis Schwartz)
- Meta/Instagram Adapters (ads + social)
- Webhook Infrastructure + MonaraTokenVault

### Sprint 21-22: UX e Estabilização
- Sidebar 2.0 (navegação hierárquica)
- Discovery Hub (Keywords + Spy unificados)
- AI Cost Guard (governança tokens/budget)
- Smoke Tests automatizados (6/6 endpoints P0)
- Fix Gemini model (gemini-2.0-flash estável)

### Sprint 23-24: Inteligência em Escala
- Firecrawl Integration (deep crawling, bypass Cloudflare)
- Fallback system (Firecrawl → Jina → Local)
- Elite Asset Panel (headlines, CTAs, hooks com scoring)
- Deep RAG Expansion (assets de elite no pipeline)
- Multi-tenant Guardrails (isolamento total por brandId)

### Sprint 25: Predictive & Creative Engine
- Conversion Predictor (CPS) — 6 dimensões + benchmark
- Creative Automation Pipeline — 3-5 variações (Meta Feed, Stories, Google)
- Elite Asset Remixing (Schwartz, Halbert AIDA, Brunson)
- Brand Voice Compliance Gate (toneMatch >= 0.75)
- Multi-Input Intelligence (texto, VSL, ad copies)
- QA: 93/100

### Sprint 26: Technical Debt Cleanup
- 161→0 erros TypeScript (73 arquivos)
- Path fixes (relativos → absolutos `@/`)
- 9 stubs documentados (`@stub`, `@todo`, `@see`)
- Type aliases de compatibilidade legada
- Zero mudança funcional, zero regressão
- QA: 97/100

### Sprint 27: Hybrid — Backlog Cleanup + Attribution Revival
- 14→1 test suites falhando (+28 testes passando)
- `@ts-ignore` 5→0 via `mcp-global.d.ts`
- Attribution Revival: 4 módulos dead code ativados
- 3 novas rotas API attribution (`/sync`, `/stats`, `/overlap`)
- Dashboard Attribution (chart, tabela, feature flag gate)
- Spend data conectado via hook direto Firestore
- QA: 97/100

### Sprint 28: Hybrid — Cleanup & Foundations + Personalization Advance
- Dead test removido, contract-map corrigido, adapter layer criado
- RAG stubs implementados (Jaccard, hash-based 768d, djb2)
- Feature flag attribution removida (always-on)
- `generateWithGemini` estendido com `system_instruction` (DT-02)
- Zod schema `AudienceScanResponseSchema` + safeParse + fallback (DT-03)
- Retry logic exponential backoff, `as any` eliminado
- Propensity Engine (hot/warm/cold com scoring, recência, inatividade)
- Dashboard Personalization (scans, persona detail, propensity badge)
- Componentes reutilizáveis (AudienceScanCard, PersonaDetailView, PropensityBadge)
- CRUD Dynamic Content Rules (create, update, delete, toggle)
- QA: 98/100

### Sprint Sigma: Codebase Consistency
- Auth unificada em 25+ rotas (`requireBrandAccess`)
- Tipos consolidados (duplicatas eliminadas)
- API unificada (`createApiError`/`createApiSuccess` em 54+ rotas)
- Pinecone deduplicação
- `force-dynamic` em todas as rotas dinâmicas
- `Timestamp` substituindo `Date` em todo Firestore
- QA: 99/100

### Sprint 29: Assets & Persistence Hardening
- Discovery Hub Assets (`use-intelligence-assets.ts`, `assets-panel.tsx`, `processAssetText()`)
- Persistência Autopsy/Offer em Firestore (2 TODOs eliminados)
- LeadState expandido para 12 campos (incluindo `segment`)
- Contract-map cleanup (`budget-optimizer.ts` registrado)
- Reporting Types ativados (`AIAnalysisResult`, `ReportMetrics`)
- QA: 100/100

### Sprint 30: Ads Integration Foundation
- Meta Ads Adapter Real (Graph API v21.0): `updateAdCreative`, `syncCustomAudience`
- Google Ads Adapter Real (REST): `pauseAdEntity`, `adjustBudget`, `getEntityStatus`
- Performance Metrics Real (Firestore + API cache 15min)
- Integration Validation Real (Meta + Google)
- CAPI v21.0 + Google Offline Conversions
- Token Refresh Engine per-provider
- QA: 98/100

### Sprint 31: Automation Engine & Rules Runtime
- Automation Page Real (MOCK_RULES/LOGS/VARIATIONS → Firestore)
- Kill-Switch Persistence (Firestore + Slack anti-SSRF + In-App)
- Rules Runtime (PersonalizationResolver + API + Hook)
- Webhook DLQ (dead_letter_queue + retry manual + UI)
- 12 DTs resolvidos (3 Blocking)
- Rate Limiting adiado → S32 P0
- QA: 99/100

---

## 🔮 Roadmap Forward: Sprint 33-39+

> **Base:** Deliberação do Alto Conselho (Party Mode) em 09/02/2026 — unanimidade 5/5.
> **Sequência:** B (Predictive Intelligence) → A (Advanced Reporting) → C (Enterprise Foundation) — respeitando dependências.
> **Fase atual:** Sprint 35 em planejamento.

### 🎛️ Modelo Operacional — Sprint Controller (Estabelecido na S32)
Cada sprint é coordenada por um **Sprint Controller** — um chat central que orquestra a execução:
1. O Sprint Controller delibera, emite o veredito e gera os prompts de invocação
2. Cada agente (Iuran, Athos, Leticia, Darllyson, Dandara) é invocado **individualmente em janelas separadas do Cursor**
3. A execução é **sempre sequencial**: `/iuran` (PRD) → `/athos` (Arch Review) → `/leticia` (Story Pack) → `/darllyson` (Dev) → `/dandara` (QA)
4. Um agente só é invocado **após o anterior concluir** e o Sprint Controller confirmar
5. O Sprint Controller nunca executa código — apenas coordena, valida e gera prompts

**Este modelo deve ser seguido em todas as sprints futuras.**

### Visão Geral Forward

```
[FASE 3 — Foundations Completion]
  Sprint 29: Assets & Persistence Hardening ✅
  Sprint 30: Ads Integration Foundation (Meta + Google real) ✅

[FASE 4 — Automation & Execution]
  Sprint 31: Automation Engine & Rules Runtime ✅
  Sprint 32: Social Integration 2.0 (Instagram + LinkedIn real) ✅

[FASE 5 — Scale & Intelligence]
  Sprint 33: Content Autopilot (publicação automatizada) ✅
  Sprint 34: A/B Testing & Segment Optimization ✅

[FASE 6 — Predictive & Reporting]
  Sprint 35: Predictive Intelligence & Deep Research ← PRÓXIMA
  Sprint 36: Advanced Reporting & Briefing Bot

[FASE 7 — Enterprise & Platform]
  Sprint 37: Enterprise Foundation (Multi-Workspace + RBAC)
  Sprint 38: White-Label & Agency Billing
  Sprint 39+: Img2Img Pipeline, TikTok Adapter, Mobile PWA
```

---

### Sprint 29: Assets & Persistence Hardening [Hybrid — Cleanup + Feature]
**Tema:** Eliminar stubs residuais, implementar persistência faltante e fechar o ciclo de dados.

| # | Item | Stubs/TODOs afetados | Tipo |
|:--|:-----|:---------------------|:-----|
| 1 | **Discovery Hub Assets** — Implementar `use-intelligence-assets.ts`, `assets-panel.tsx`, `processAssetText()` em `assets.ts` | 3 stubs completos | Feature |
| 2 | **Persistência API** — Autopsy `run/route.ts` salvar em Firestore, Offer `save/route.ts` ativar Firestore save | 2 TODOs de persistence | Fix |
| 3 | **LeadState Real** — Expandir `LeadState` stub em `personalization.ts` com campos derivados do Propensity | 1 stub type | Feature |
| 4 | **Contract-map Cleanup** — Registrar `budget-optimizer.ts` em lane, revisar ownership | QA S28 nota N1 | Governance |
| 5 | **Reporting Types** — Ativar `AIAnalysisResult` e `ReportMetrics` para `briefing-bot.ts` | 2 stubs type | Cleanup |
| 6 | **Rate Limiting** — Guardrails de quota por marca para scans e API calls | Segurança | Feature |

**Estimativa:** ~12-16h | **Tipo:** Hybrid (Cleanup + Feature)

---

### Sprint 30: Ads Integration Foundation [Feature — High Impact]
**Tema:** Substituir mocks por integrações reais com Meta Ads e Google Ads. Passo crítico para monetização.

| # | Item | Stubs/TODOs afetados | Tipo |
|:--|:-----|:---------------------|:-----|
| 1 | **Meta Ads Adapter Real** — Implementar `updateAdCreative()`, `syncCustomAudience()`, CAPI real | `meta.ts`, `ads-sync.ts` (3 TODOs) | Feature |
| 2 | **Google Ads Adapter Real** — Implementar `pauseAdEntity()`, `adjustBudget()`, `getEntityStatus()` | `google.ts` (3 TODOs) | Feature |
| 3 | **Performance Metrics Real** — Substituir mock por Firestore/API real em `/performance/metrics` | `route.ts` retorna 501 se !mock | Feature |
| 4 | **Integration Validation Real** — Validação real com Meta/Google SDKs em `/integrations/validate` | 1 TODO mock validation | Feature |
| 5 | **Ads Lookalike Sync** — Exportar leads hot para Meta Custom Audiences | PRD S29 RF-29.4 | Feature |
| 6 | **Offline Conversion** — Google Ads Offline Conversions dispatch | `capi-sync.ts` (1 TODO) | Feature |

**Estimativa:** ~18-24h | **Tipo:** Feature Sprint (alto impacto de negócio)
**Dependência:** BYO Keys (S18) já implementado — chaves do cliente disponíveis via vault

---

### Sprint 31: Automation Engine & Rules Runtime [Feature] ✅ CONCLUÍDA
**Tema:** Tornar a automação real — rules aplicadas em runtime, kill-switch funcional, variações reais.
**QA:** 99/100 | **Testes:** 243/243 (+16) | **Rotas:** 105 (+2) | **tsc:** 0

| # | Item | Tipo | Status |
|:--|:-----|:-----|:-------|
| 1 | **Rules Runtime** — API `/api/personalization/resolve` + hook `usePersonalizedContent` + `PersonalizationResolver` matching engine | Feature | ✅ |
| 2 | **Automation Page Real** — MOCK_RULES/LOGS/VARIATIONS → Firestore real + CRUD `lib/firebase/automation.ts` | Fix | ✅ |
| 3 | **Kill-Switch Persistence** — Firestore `automation_logs` + Slack (anti-SSRF) + In-App + Badge sidebar | Feature | ✅ |
| 4 | ~~Segmentação Persistida~~ — Já implementada em S29 (campo `segment` em LeadState). Deliberação cancelou. | Cancelado | ⏭️ |
| 5 | **Webhook DLQ** — `dead_letter_queue` no Firestore + API retry + UI tab + timestamp check anti-duplicação | Reliability | ✅ |
| + | **Rate Limiting** — STRETCH adiado pela 4ª vez → **P0 obrigatório na S32** | Feature | ⏸️ |

**Estimativa:** ~14-18h | **Executado:** ~14h core | **DTs:** 12 (3 Blocking → resolvidos)
**Artefatos:** PRD, Arch Review, Story Pack (3 arquivos) em `_netecmt/solutioning/` e `_netecmt/packs/stories/sprint-31-automation-rules/`

---

### Sprint 32: Social Integration 2.0 + Rate Limiting [Feature] ✅ CONCLUÍDA
**Tema:** Conectar realmente as redes sociais — Instagram Graph API, LinkedIn API, inbox com dados reais. **Rate Limiting implementado como P0 obrigatório (4ª vez no roadmap — ENTREGUE).**
**QA:** 91/100 | **Testes:** 257/257 (+14) | **Rotas:** 105 | **tsc:** 0

| # | Item | Tipo | Status |
|:--|:-----|:-----|:-------|
| 0 | **Rate Limiting por brandId** — withRateLimit() HOF + Firestore runTransaction, 4 rotas | Feature | ✅ |
| 1 | **Instagram Graph API Real** — Adapter REST puro, vault + token refresh, degradação graciosa | Feature | ✅ |
| 2 | **LinkedIn API Scaffold** — Vault check + GET /v2/me health check | Feature | ✅ |
| 3 | **Social Response Engine** — Gemini JSON + Zod validation + fallback, prompt redesenhado | Feature | ✅ |
| 4 | ~~BrandVoice Translator 2.0~~ — STRETCH movido para S33 | Enhancement | ⏸️ |
| 5 | ~~TikTok Adapter~~ — Removido do escopo | Removido | ⏭️ |

**Estimativa:** ~10.75h core | **DTs:** 8 (2 Blocking → resolvidos)
**Finding:** F-01 (zod dep — oficializar em S33)
**Artefatos:** PRD, Arch Review, Story Pack em `_netecmt/solutioning/` e `_netecmt/packs/stories/sprint-32-social-rate-limiting/`

---

### Sprint 33: Content Autopilot Foundation [Feature] ✅ CONCLUÍDA
**Tema:** Fundacoes do Content Autopilot — calendario editorial, geracao de conteudo com Brand Voice, workflow de aprovacao com state machine.
**QA:** 96/100 APROVADA COM RESSALVAS | **Testes:** 286/286 (+29, 50 suites) | **Rotas:** ~109 (+4 content routes) | **tsc:** 0
**Findings:** F-01 (timer leak MessagePort — documentado para S34), F-02 (reorder intra-dia limitado), F-03 (sem touch fallback D&D)
**Nota:** QA original Dandara 93/100 REPROVADO → Override Conselho 96/100 (G0-08 + P-06 UI reclassificados)

| # | Item | Tipo | Status |
|:--|:-----|:-----|:-------|
| 0 | **Governanca S32** — zod oficializada, timer leak fix, Instagram ADR, SocialInteractionRecord | Governanca | ✅ |
| 1 | **Calendario Editorial** — CRUD Firestore, API REST (4 metodos), UI semanal/mensal com drag HTML5 nativo | Feature | ✅ |
| 2 | **Content Generation Pipeline** — 4 formatos (post, story, carousel, reel), Brand Voice injection, Zod validation | Feature | ✅ |
| 3 | **Approval Workflow** — State machine 6 estados, adjacency map (DT-08), history log imutavel, UI review | Feature | ✅ |
| 4 | ~~BrandVoice 2.0 engagementScore~~ — STRETCH movido para S34 | Enhancement | ⏸️ |

**Estimativa:** ~16.5h core | **DTs:** 10 (3 Blocking — DT-04, DT-05, DT-08 → resolvidos)
**Artefatos:** PRD, Arch Review, Story Pack em `_netecmt/solutioning/` e `_netecmt/packs/stories/sprint-33-content-autopilot-foundation/`

**Estimativa:** ~20-26h | **Tipo:** Feature Sprint (alta complexidade)

---

### Sprint 34: A/B Testing & Segment Optimization [Feature] — CONCLUIDA (QA 98/100)
**Tema:** Criar motor de A/B Testing por segmento de propensity — variantes com assignment deterministico, metricas por variante, performance filtrada por segmento, e auto-optimization com significancia estatistica.
**PRD:** `_netecmt/solutioning/prd/prd-sprint-34-ab-testing-segment-optimization.md`
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5

| # | Item | Tipo | Status |
|:--|:-----|:-----|:-------|
| 0 | **Governanca S33** — Timer leak fix (N1), engagementScore (N2) | Governanca | ✅ |
| 1 | **A/B Test Engine** — CRUD + variantes por segmento + hash assignment deterministico + Z-test significancia | Feature | ✅ |
| 2 | **Performance por Segmento** — Dashboard filtrado por hot/warm/cold + SegmentBreakdown + Advisor insights | Feature | ✅ |
| 3 | **Auto-Optimization** — Pausar losers, promover winners com significancia >= 95%, Kill-Switch respect | Feature | ✅ |

**Estimativa:** ~16-20h | **Tipo:** Feature Sprint (alta complexidade)
**Dependencias:** Rules Runtime (S31), Propensity Engine (S28), Content Autopilot (S33), Kill-Switch (S31)

---

### Sprint 35: Predictive Intelligence & Deep Research [Feature — High Impact] — CONCLUIDA (Execução Dev)
**Tema:** Modelos preditivos leves para comportamento/churn/LTV, motor de pesquisa profunda para dossiês automatizados, e resolução da dívida técnica S34.
**Deliberação:** Veredito do Conselho (Party Mode) — unanimidade 5/5 (Opção B aprovada, 09/02/2026)

| Fase | # | Item | Tipo | Prioridade |
|:-----|:--|:-----|:-----|:-----------|
| **Fase 0: Governance** | 0.1 | Resolver `updateVariantMetrics` sem `runTransaction` (ressalva S34 CS-34.04) | Fix | ✅ |
| | 0.2 | Resolver `selectedSegment` sem drill-down (ressalva S34 CS-34.09) | Fix | ✅ |
| | 0.3 | Timer leak MessagePort — solução definitiva (polyfill isolado) | Fix | ✅ |
| | 0.4 | Cleanup 7 stubs residuais (performance.ts, intelligence.ts, embeddings.ts) | Cleanup | ✅ |
| **Fase 1: Churn & LTV Prediction** | 1.1 | **Churn Predictor** — modelo baseado em recência + engagement + inatividade (builds on Propensity Engine S28) | Feature | ✅ |
| | 1.2 | **LTV Estimation** — cohort-based com Propensity scoring + histórico de conversões | Feature | ✅ |
| | 1.3 | **Audience Behavior Forecasting** — tendências de segmento hot/warm/cold projetadas 7/14/30d | Feature | ✅ |
| **Fase 2: Deep Research Engine** | 2.1 | **Research Engine** — integração Exa + Firecrawl para dossiês de mercado automatizados | Feature | ✅ |
| | 2.2 | **Market Dossier Generator** — relatório consolidado (tamanho de mercado, tendências, concorrentes, oportunidades) | Feature | ✅ |
| | 2.3 | **Research Storage** — namespace `research-{brandId}` em Firestore + cache 24h | Feature | ✅ |
| **Fase 3: Predictive Dashboard** | 3.1 | **ScaleSimulator Upgrade** — dashboard preditivo com projeções de LTV/Churn/Revenue | Feature | ✅ |
| | 3.2 | **Predictive Alerts** — notificações de churn iminente e oportunidades de upsell | Feature | ✅ |
| | 3.3 | **Deep Research UI** — página, viewer e navegação lateral integrada | Feature | ✅ |

**Resultado:** Engines e APIs preditivas + Deep Research entregues com contratos de lane e atualização de contract-map.
**Estimativa:** ~18-22h | **Tipo:** Feature Sprint (alta complexidade, alto impacto)
**Dependências:** Propensity Engine (S28), A/B Testing (S34), Attribution (S27), Exa/Firecrawl MCPs (S23), ScaleSimulator scaffold (S25)

---

### Sprint 36: Advanced Reporting & Briefing Bot [Feature]
**Tema:** Transformar todo o stack existente em relatórios automatizados — briefing semanal, templates por módulo, scheduling, export.
**Dependência:** Sprint 35 (dados preditivos alimentam os relatórios)

| # | Item | Tipo | Prioridade |
|:--|:-----|:-----|:-----------|
| 1 | **Briefing Bot Engine** — motor de geração de relatórios semanais com Gemini (builds on `briefing-bot.ts` scaffold) | Feature | P0 |
| 2 | **Report Templates** — 5 templates: Performance, Attribution, A/B Testing, Content Autopilot, Predictive | Feature | P0 |
| 3 | **Scheduled Reports** — cron-like via Firestore (diário/semanal/mensal) com history log | Feature | P0 |
| 4 | **Report Delivery** — envio por email (Resend/SendGrid REST) + Slack webhook | Feature | P1 |
| 5 | **Export Engine** — PDF/HTML de relatórios com branding da marca | Feature | P1 |
| 6 | **Report Dashboard** — UI para visualizar/agendar/compartilhar relatórios | Feature | P0 |
| 7 | **Resolver stubs** — `ReportMetrics`, `AIAnalysisResult` (tipos ativos para briefing-bot) | Cleanup | P1 |

**Estimativa:** ~16-20h | **Tipo:** Feature Sprint (conecta features existentes)
**Dependências:** Performance War Room (S18), Attribution (S27), A/B Testing (S34), Content Autopilot (S33), Predictive (S35)

---

### Sprint 37: Enterprise Foundation — Multi-Workspace & RBAC [Enterprise]
**Tema:** Infraestrutura para agências gerenciarem múltiplas marcas com controle de acesso granular.
**Dependência:** Sprint 36 (reporting estável, produto "completo" para escalar)

| # | Item | Tipo | Prioridade |
|:--|:-----|:-----|:-----------|
| 1 | **Workspace Model** — `workspaces` collection, workspace switcher, brandId scoping por workspace | Enterprise | P0 |
| 2 | **RBAC Engine** — roles (owner, admin, editor, viewer), permission matrix, middleware de autorização | Enterprise | P0 |
| 3 | **Invite System** — convite por email, aceite, remoção de membros | Enterprise | P0 |
| 4 | **Workspace Dashboard** — overview multi-marca (KPIs agregados por workspace) | Enterprise | P1 |
| 5 | **Billing Foundation** — Stripe integration scaffold (plans, usage metering, invoices) | Enterprise | P1 |
| 6 | **Data Isolation Audit** — validação de que todas as queries respeitam workspace boundary | Security | P0 |

**Estimativa:** ~22-28h | **Tipo:** Enterprise Sprint (pode exigir 2 sprints — avaliar no Arch Review)
**Dependências:** Todas as sprints anteriores (produto feature-complete antes de escalar)

---

### Sprint 38+: White-Label, Img2Img & Beyond [Vision]
**Tema:** Funcionalidades avançadas de plataforma e IA generativa visual.

| # | Item | Tipo | Sprint Estimada |
|:--|:-----|:-----|:----------------|
| 1 | **White-Label Engine** — logo, cores, domínio customizável por agência | Enterprise | S38 |
| 2 | **Img2Img Reference Pipeline** — geração de criativos baseados em referências visuais de alta performance | Feature | S38-39 |
| 3 | **TikTok Adapter** — API integration para publicação e inbox | Feature | S39 |
| 4 | **Mobile PWA** — Progressive Web App com push notifications | Feature | S39+ |
| 5 | **AI Agent Marketplace** — plugins de agentes customizáveis por vertical | Vision | S40+ |

---

### Mapa de Dependências entre Sprints

```
S29 (Assets & Persistence) ✅
  ↓
S30 (Ads Integration) ✅ ← dependia de S29
  ↓
S31 (Automation & Rules Runtime) ✅ ← dependia de S30 + S28
  ↓
S32 (Social Integration 2.0 + Rate Limiting) ✅ ← Rate Limiting herança S29→S31 — ENTREGUE
  ↓
S33 (Content Autopilot) ✅ ← depende de S32 (social real ✅) + S31 (scheduling ✅)
  ↓
S34 (A/B Testing) ✅ ← depende de S31 (rules runtime ✅) + S28 (propensity ✅) + S33 (content ✅)
  ↓
S35 (Predictive Intelligence) ← depende de S28 (propensity) + S34 (A/B) + S27 (attribution) + S23 (MCPs)
  ↓
S36 (Advanced Reporting) ← depende de S35 (dados preditivos) + S18/S27/S33/S34 (fontes de dados)
  ↓
S37 (Enterprise Foundation) ← depende de S36 (produto completo antes de escalar)
  ↓
S38+ (White-Label, Img2Img, Beyond) ← depende de S37 (multi-workspace)
```

### Inventário de Stubs/TODOs por Sprint de Resolução

| Sprint | Stubs Resolvidos | Arquivos Impactados |
|:-------|:----------------|:-------------------|
| S29 | 8 stubs/TODOs | assets.ts, use-intelligence-assets.ts, assets-panel.tsx, autopsy route, offer route, LeadState, reporting types, contract-map |
| S30 | 9 stubs/TODOs | meta.ts, google.ts, ads-sync.ts, capi-sync.ts, performance metrics route, integrations validate route, meta-adapter.ts, google-adapter.ts, offline-conversion |
| S31 | 5 stubs/TODOs | automation page (3 mocks), kill-switch route (2 TODOs), webhook dispatcher (1 TODO) — **CONCLUÍDO** |
| S32 | 3 stubs/TODOs | inbox-aggregator.ts (2x), social-generation.ts — **CONCLUÍDO** |
| S35 | ~7 stubs/TODOs (planejado) | performance.ts (4), intelligence.ts (2), embeddings.ts (1), linkedin-adapter.ts (1 STRETCH) |
| **Total Eliminado** | **25+ stubs/TODOs** | Codebase progressivamente limpo |

---

## 🔐 Decisões Arquiteturais Chave

### APIs do Sistema vs. APIs do Cliente

| Tipo | Quem Gerencia | Exemplos |
|:-----|:-------------|:---------|
| Sistema | Nós | Gemini, Pinecone, Firebase, Cohere |
| Cliente | Usuário configura | Meta, Google Ads, TikTok, Twitter, LinkedIn |

### Isolamento de Dados (Multi-Tenant)

| Namespace | Visibilidade | Uso |
|:----------|:-------------|:----|
| `knowledge` | Universal | Base de conhecimento compartilhada |
| `brand-{id}` | Privado | Dados da marca (leads, scans, rules) |
| `research-{id}` | Temporário | Dados de pesquisa de mercado |

### Stack Tecnológico

| Camada | Tecnologia |
|:-------|:-----------|
| Frontend | Next.js 16 (App Router, Turbopack) |
| UI | Tailwind CSS, shadcn/ui, Lucide Icons |
| IA | Google Gemini (2.0 Flash), Cohere (embeddings) |
| Vector DB | Pinecone Serverless |
| Database | Firebase Firestore (Client SDK) |
| Validação | Zod (schemas de contrato) |
| Testes | Jest (302 tests, 52 suites) |

---

## 📈 Metricas de Sucesso do Agency Engine

| Métrica | Meta | Estado Atual |
|:--------|:-----|:-------------|
| Tempo para criar conteúdo | -80% vs. manual | Em progresso |
| Consistência de marca | 100% (BrandKit enforced) | ✅ BrandVoice ativo |
| Cobertura de monitoramento | 24/7 automático | ✅ Sentry + Scout |
| Custo vs. agência tradicional | -90% | Em progresso |
| Build TypeScript | 0 erros | ✅ Mantido S26-S34 |
| Test suite | 100% pass | ✅ 302/302 (S34) |
| QA Score | ≥ 95/100 | ✅ S34: 98/100 (APROVADO COM RESSALVAS) |
| Sprints concluídas | 24 sprints | ✅ S11-S34 (incluindo Sigma) |

---

*Roadmap mantido pela equipe NETECMT v2.0*
*Conselho de Funil — Agency Engine | Atualizado em 09/02/2026 (S34 concluída — Roadmap Forward S35-39+ definido pelo Alto Conselho)*
