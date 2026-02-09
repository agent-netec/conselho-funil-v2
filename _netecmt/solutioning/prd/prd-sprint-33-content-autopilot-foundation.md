# PRD: Content Autopilot Foundation — Sprint 33

**Versao:** 1.0
**Responsavel:** Iuran (PM)
**Status:** Draft — Ready for Architecture Review
**Data:** 08/02/2026
**Predecessora:** Sprint 32 (Social Integration 2.0 + Rate Limiting) — CONCLUIDA (QA 91/100)
**Tipo:** Feature Sprint (Content Autopilot)
**Estimativa Total:** ~14-17h core
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5

---

## 1. Contexto Estrategico

### 1.1 Baseline pos-Sprint 32

| Metrica | Valor |
|:--------|:------|
| Testes passando | 257/257 (47 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | 105 rotas (Next.js 16.1.1 Turbopack) |
| Trajetoria QA | S25(93) → S26(97) → S27(97) → S28(98) → Sigma(99) → S29(100) → S30(98) → S31(99) → **S32(91)** |
| Auth cobertura | 100% — `requireBrandAccess` em 25+ rotas brand-scoped |
| API formato | `createApiError`/`createApiSuccess` em 54+ rotas |
| Rate Limiting | `withRateLimit()` em 4 rotas (chat 30/min, scan 10/min, metrics 60/min, spy 5/min) |
| Social | Instagram Graph API real + LinkedIn scaffold + Response Engine (Gemini+Zod) |
| Automation | Maestro Engine + Rules Runtime + Kill-Switch + DLQ (S31) |
| Ads | Meta + Google REST puro, cache 15min, token refresh (S30) |
| BYO Keys | MonaraTokenVault com AES-256 — `brands/{brandId}/secrets` |
| Novas deps npm S32 | 1 (zod formalizada — Finding F-01, pendente oficializacao) |

### 1.2 Por que Sprint 33: Content Autopilot Foundation

O **Content Autopilot** e um dos tres modulos originais da Ala de Operacoes, definido desde a concepcao do Agency Engine (vide `project-context.md`). Enquanto o Social Command Center (S17/S32), o Performance War Room (S18/S30) e o Automation Maestro (S20/S31) ja estao funcionais, o Content Autopilot permanece **inexistente no codebase**.

A visao original descreve: *"Geracao e agendamento automatizado de conteudo — Posts, Stories, Reels Scripts, Carrosseis"*. Sprint 33 entrega as fundacoes desse motor.

**Tres problemas criticos que Sprint 33 resolve:**

1. **Calendario Editorial NAO existe** — Nenhum mecanismo de planejamento de conteudo. Marcas nao conseguem visualizar, organizar ou reordenar publicacoes futuras. A Ala de Operacoes opera sem agenda.

2. **Geracao de conteudo e manual** — O sistema tem Brand Voice (S17), Creative Automation (S25) e Response Engine (S32), mas nao existe um pipeline dedicado a gerar conteudo editorial formatado (post feed, story, carousel outline, reel script). Cada formato requer prompt especializado.

3. **Workflow de aprovacao inexistente** — Zero controle humano antes de conteudo ser considerado pronto. Sem state machine de aprovacao, nao ha como um gestor revisar, aprovar ou rejeitar conteudo gerado — pre-requisito para qualquer forma de publicacao futura (S34+).

**Adicionalmente, Sprint 33 resolve 5 dividas herdadas da S32:**

| Nota S32 | Descricao | Acao S33 |
|:---------|:----------|:---------|
| N1 | zod adicionada mas nao oficializada | S33-GOV-01: Oficializar no README/package.json |
| N3 | Response Engine sem historico de autor | S33-GOV-04: Criar collection `social_interactions` |
| N4 | Worker timer leak warning | S33-GOV-02: Investigar/resolver |
| N5 | Instagram usa `graph.instagram.com` vs PRD | S33-GOV-03: Documentar decisao |
| STRETCH | BrandVoice Translator 2.0 engagementScore | S33-BV-01: Escopo minimo |

### 1.3 Inventario de Stubs/TODOs a Criar (0 stubs — feature nova)

Sprint 33 NAO elimina stubs existentes. E inteiramente feature nova — criando o Content Autopilot do zero.

### 1.4 Funcionalidades NOVAS (7 total)

| # | Item | Justificativa |
|:--|:-----|:-------------|
| 1 | Calendario Editorial (data model + CRUD + UI) | Modulo ausente da Ala de Operacoes |
| 2 | Content Generation Engine | Pipeline dedicado para 4 formatos |
| 3 | API /api/content/generate | Endpoint de geracao com integracao ao calendario |
| 4 | API /api/content/calendar | CRUD completo do calendario |
| 5 | Approval Workflow (state machine) | Pre-requisito para publicacao futura |
| 6 | UI de aprovacao (reviewer dashboard) | Interface humana de controle |
| 7 | engagementScore no Response Engine | STRETCH herdado S32 (escopo minimo) |

### 1.5 Divida Tecnica a Resolver (4 itens de governanca)

| # | Item | Origem |
|:--|:-----|:-------|
| GOV-01 | Oficializar zod como dependencia padrao | Nota N1 S32 |
| GOV-02 | Timer leak em testes (worker exit warning) | Nota N4 S32 |
| GOV-03 | Documentar decisao Instagram domain | Nota N5 S32 |
| GOV-04 | Collection social_interactions + type | Nota N3 S32 |

---

## 2. Objetivo da Sprint

> **"Criar as fundacoes do Content Autopilot — calendario editorial com CRUD e drag-and-drop, pipeline de geracao de conteudo com 4 formatos especializados (post, story, carousel, reel) integrado a Brand Voice, workflow de aprovacao com state machine de 7 estados, e resolver a divida tecnica herdada da S32 (zod, timer leak, Instagram domain, social_interactions) — entregando a infraestrutura completa para publicacao automatizada em sprints futuras."**

### 2.1 North Star Metrics

| Metrica | Antes (S32) | Meta (S33) |
|:--------|:-----------|:-----------|
| Calendario Editorial | **Inexistente** | **Funcional** (CRUD + UI semanal/mensal + drag reorder) |
| Content Generation | **Inexistente** | **4 formatos** (post, story, carousel, reel) com Brand Voice |
| Approval Workflow | **Inexistente** | **State machine** (7 estados: draft→pending_review→approved→scheduled→published + rejected) |
| social_interactions | **Inexistente** | **Collection Firestore** + SocialInteractionRecord type |
| zod oficializada | **Informal** (F-01 S32) | **Oficial** (documentada no README) |
| Timer leak warnings | **Presente** (N4 S32) | **Zero** warnings de timer |
| Instagram domain doc | **Ausente** | **Documentada** |

### 2.2 Metricas Secundarias

| Metrica | Meta |
|:--------|:-----|
| Testes passando | >= 257/257 (zero regressao) + novos testes para calendar, generation, approval |
| TypeScript errors | 0 |
| Build (rotas) | >= 105 + novas rotas content (estimado ~107-109) |
| QA Score | >= 95/100 (aspiracional 98) |
| Novas dependencias npm | 0 |

---

## 3. Requisitos Funcionais

### RF-33.0: Governanca & Divida S32 (Fase 0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-33.0.1 | Oficializar zod | Adicionar nota no README.md (secao Dependencies) e confirmar em `package.json` como dependencia padrao do projeto. Nota N1 S32 resolvida. |
| RF-33.0.2 | Timer leak fix | Investigar e resolver warning `worker has failed to exit gracefully` nos testes Jest. Provavel causa: timer/interval nao limpo em modulos com polling ou retry. Adicionar `afterAll` cleanup se necessario. |
| RF-33.0.3 | Instagram domain doc | Criar/atualizar documentacao em `_netecmt/docs/tools/` ou ADR explicando que `graph.instagram.com` e o dominio correto (vs `graph.facebook.com` mencionado no PRD S32). Ambos sao validos, mas o adapter usa `graph.instagram.com`. |
| RF-33.0.4 | Collection `social_interactions` | Criar collection `brands/{brandId}/social_interactions` no Firestore com type `SocialInteractionRecord` em `types/social.ts`. Campos: `id`, `authorId`, `authorName`, `platform`, `content`, `sentiment`, `responseId`, `engagementScore`, `brandId`, `createdAt` (Timestamp). Base para RAG futuro do Response Engine. |

### RF-33.1: Calendario Editorial (Fase 1 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-33.1.1 | Data model Firestore | Collection `brands/{brandId}/content_calendar` (subcollection por brandId). Campos obrigatorios: `id` (string auto), `title` (string), `format` (enum: 'post' \| 'story' \| 'carousel' \| 'reel'), `platform` (enum: 'instagram' \| 'linkedin' \| 'x' \| 'tiktok'), `scheduledDate` (Timestamp), `status` (enum: 'draft' \| 'pending_review' \| 'approved' \| 'scheduled' \| 'published' \| 'rejected'), `content` (string — corpo do conteudo), `metadata` (object — prompt params, generation info), `order` (number — para reorder no dia), `brandId` (string), `createdAt` (Timestamp), `updatedAt` (Timestamp). |
| RF-33.1.2 | CRUD helpers | Modulo `lib/firebase/content-calendar.ts` com funcoes: `createCalendarItem(brandId, data)`, `getCalendarItems(brandId, startDate, endDate)`, `updateCalendarItem(brandId, itemId, data)`, `deleteCalendarItem(brandId, itemId)`, `reorderCalendarItems(brandId, date, orderedIds[])`. Todas com Timestamp, isolamento brandId obrigatorio. |
| RF-33.1.3 | API CRUD | Rota `/api/content/calendar` com metodos: `POST` (create), `GET` (read com query params `start`, `end`, `view=week\|month`), `PUT` (update), `DELETE` (delete). Rota adicional `/api/content/calendar/reorder` para `POST` reorder. Todas com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-33.1.4 | UI Calendario Semanal | Pagina `/app/content/calendar/page.tsx` com visualizacao semanal como default. Grid 7 colunas (Seg-Dom), cards de conteudo por dia mostrando titulo + formato (icone) + status (badge). Navegacao por seta (semana anterior/proxima). |
| RF-33.1.5 | UI Calendario Mensal | Toggle para visualizacao mensal. Grid de calendario com mini-cards por dia (maximo 3 visiveis + indicador "+N"). Click no dia expande para lista completa. |
| RF-33.1.6 | Drag and Drop (HTML5 nativo) | Reorder de items dentro do mesmo dia e entre dias usando HTML5 Drag and Drop API nativa (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). ZERO biblioteca externa. Atualiza `order` e `scheduledDate` via API reorder. |
| RF-33.1.7 | Sidebar integration | Adicionar item "Content Calendar" no Sidebar (`components/layout/sidebar.tsx`) sob a secao de Operacoes, com icone `Calendar` do Lucide. |

### RF-33.2: Content Generation Pipeline (Fase 2 — P0)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-33.2.1 | Generation Engine | Modulo `lib/content/generation-engine.ts` com funcao principal `generateContent(brandId, params)`. Params: `{ format, platform, topic, tone?, keywords?, targetAudience? }`. Retorna `{ content, metadata, suggestions[] }`. |
| RF-33.2.2 | Brand Voice injection | Engine busca dados da marca via `getBrand(brandId)` (existente). Injeta no prompt: nome da marca, tom de voz, guidelines, publico-alvo, cores/visual (se disponivel no BrandKit). |
| RF-33.2.3 | Formato: Post Feed | Prompt especializado para post de feed. Output: texto principal (max 2200 chars), hashtags sugeridas (5-15), call-to-action, sugestao de visual. Estrutura: hook → desenvolvimento → CTA. |
| RF-33.2.4 | Formato: Story | Prompt especializado para story. Output: texto curto (max 150 chars), sugestao de background, sticker/poll suggestions, swipe-up CTA (se aplicavel). Tom casual e urgente. |
| RF-33.2.5 | Formato: Carousel Outline | Prompt especializado para carrossel. Output: titulo do carrossel, slides[] (3-10 slides com titulo + corpo de cada), CTA final, sugestao de cover. Narrativa progressiva. |
| RF-33.2.6 | Formato: Reel Script | Prompt especializado para reel. Output: hook (3s), roteiro por cena (com timing), texto overlay sugerido, musica/trend reference, CTA final. Duracao alvo: 15-60s. |
| RF-33.2.7 | Gemini integration | Usa `generateWithGemini()` (existente) com `responseMimeType: 'application/json'` e Zod schema para validacao do output. Modelo: `gemini-2.0-flash`. System instruction com Brand Voice. |
| RF-33.2.8 | API Generate | Rota `/api/content/generate` com `POST`. Body: `{ brandId, format, platform, topic, tone?, keywords?, targetAudience? }`. Retorna content gerado + metadata. Opcao `insertToCalendar: true` para inserir diretamente no slot do calendario. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-33.2.9 | Fallback | Se Gemini falha: retorna content com flag `{ generated: false, error: 'generation_failed' }` + sugestao de template manual. NAO quebra o fluxo. |

### RF-33.3: Approval Workflow (Fase 3 — P1)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-33.3.1 | State machine | Estados validos: `draft` → `pending_review` → `approved` → `scheduled` → `published`. Transicoes alternativas: qualquer estado (exceto `published`) → `rejected`. `rejected` → `draft` (re-edit). Transicoes invalidas devem retornar erro. |
| RF-33.3.2 | Transicao engine | Modulo `lib/content/approval-engine.ts` com funcao `transitionStatus(brandId, itemId, newStatus, comment?)`. Valida transicao permitida, atualiza Firestore, registra log de transicao em subcollection `brands/{brandId}/content_calendar/{itemId}/history`. |
| RF-33.3.3 | History log | Cada transicao de status gera registro: `{ fromStatus, toStatus, comment?, timestamp (Timestamp), userId? }`. Imutavel — append-only. |
| RF-33.3.4 | API approval | Rota `/api/content/calendar/approve` com `POST`. Body: `{ brandId, itemId, action: 'approve' \| 'reject' \| 'submit_review' \| 'schedule', comment? }`. Mapeamento: `submit_review` = draft→pending_review, `approve` = pending_review→approved, `reject` = *→rejected, `schedule` = approved→scheduled. Com `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`. |
| RF-33.3.5 | UI Review Dashboard | Pagina `/app/content/review/page.tsx` com lista de items em `pending_review`. Cards com: titulo, formato (icone), plataforma, preview do conteudo (truncado), data agendada. Botoes: Approve (verde), Reject (vermelho). Modal de comentario ao rejeitar (obrigatorio). |
| RF-33.3.6 | Status badges | Componente `StatusBadge` reutilizavel para exibir status com cores: draft (cinza), pending_review (amarelo), approved (azul), scheduled (roxo), published (verde), rejected (vermelho). Usado no calendario e no review dashboard. |
| RF-33.3.7 | Sidebar integration | Adicionar item "Content Review" no Sidebar sob Operacoes, com icone `ClipboardCheck` do Lucide. Badge com contagem de items pending_review (fetch via API). |

### RF-33.4: BrandVoice 2.0 — engagementScore (STRETCH herdado S32)

| ID | Requisito | Detalhe |
|:---|:----------|:--------|
| RF-33.4.1 | engagementScore field | Adicionar campo `engagementScore` (number, 0.0-1.0) na `social_interactions` collection (RF-33.0.4). Score computado a partir de metricas da resposta (likes, replies, shares se disponiveis). |
| RF-33.4.2 | Peso no Content Generation | No `generation-engine.ts`, quando disponivel, buscar top-5 interacoes com maior `engagementScore` do brandId. Injetar como context no prompt ("Exemplos de conteudo de alta performance desta marca: ..."). Multiplicador leve — NAO obrigatorio para geracao funcionar. |

---

## 4. Requisitos Nao-Funcionais

| ID | Requisito | Criterio |
|:---|:----------|:---------|
| RNF-33.01 | Zero novas deps npm | `package.json` inalterado (exceto possivel doc update em scripts/README) |
| RNF-33.02 | REST puro | Todas as chamadas externas via `fetch()`. Zero SDK novo. |
| RNF-33.03 | Calendar API latencia | < 500ms para CRUD operations (Firestore read/write) |
| RNF-33.04 | Content Generation latencia | < 8s para gerar conteudo (Gemini + Brand Voice assembly) |
| RNF-33.05 | Drag and Drop | Zero biblioteca externa. HTML5 nativo (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). |
| RNF-33.06 | Isolamento multi-tenant | Zero acesso cross-tenant em TODAS as funcionalidades. brandId obrigatorio em todas as queries. |
| RNF-33.07 | Padroes Sigma | `createApiError`/`createApiSuccess`, `requireBrandAccess`, `Timestamp`, `force-dynamic` em todas as rotas novas |
| RNF-33.08 | State machine integrity | Transicoes invalidas DEVEM retornar erro. NUNCA permitir skip de estado (exceto rejected que aceita qualquer origem). |
| RNF-33.09 | Zero publicacao real | Scheduling e dados apenas. NAO executa publicacao em plataformas externas (S34+). |

---

## 5. Fases de Implementacao

### Fase 0: Governanca & Divida S32 (~1.5h) — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S33-GOV-01 | Oficializar zod como dep padrao (README + package.json nota) | — | XS (~15min) |
| S33-GOV-02 | Investigar/resolver timer leak em testes (worker exit warning) | DT-01 (potencial) | S (~45min) |
| S33-GOV-03 | Documentar decisao Instagram domain (`graph.instagram.com`) | — | XS (~15min) |
| S33-GOV-04 | Collection `social_interactions` + type `SocialInteractionRecord` | DT-02 (potencial) | XS (~15min) |
| S33-GATE-00 | **Gate Check 0: tsc=0, testes passam, zero timer warnings, governance resolvida** | — | XS (~15min) |

### Fase 1: Calendario Editorial (P0) — ~4-5h — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S33-CAL-01 | Data model Firestore + CRUD helpers (`lib/firebase/content-calendar.ts`) | DT-03 (potencial — subcollection design) | M (~1.5h) |
| S33-CAL-02 | API CRUD `/api/content/calendar` + `/api/content/calendar/reorder` | DT-04 (potencial — query params date range) | M (~1.5h) |
| S33-CAL-03 | UI Calendario (semanal + mensal + drag HTML5 + sidebar item) + testes | DT-05 (potencial — drag reorder API call) | M+ (~2h) |
| S33-GATE-01 | **Gate Check 1: CRUD funcional, UI renderiza, drag reorder funciona, tsc=0, testes passam** | — | XS (~15min) |

### Fase 2: Content Generation Pipeline (P0) — ~4-5h — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S33-GEN-01 | Generation Engine (`lib/content/generation-engine.ts`) + Brand Voice injection | DT-06 (potencial — prompt design) | L (~2.5h) |
| S33-GEN-02 | 4 prompts especializados (post, story, carousel, reel) + Zod schemas | DT-07 (potencial — schema design) | M (~1.5h) |
| S33-GEN-03 | API `/api/content/generate` + integracao com calendario + testes | — | S+ (~1h) |
| S33-GATE-02 | **Gate Check 2: 4 formatos geram output valido, API funcional, tsc=0, testes passam** | — | XS (~15min) |

### Fase 3: Approval Workflow + BrandVoice 2.0 (P1) — ~4-5h — Gate Check obrigatorio

| ID | Item | DTs esperados | Estimativa |
|:---|:-----|:--------------|:-----------|
| S33-APR-01 | Approval Engine (`lib/content/approval-engine.ts`) — state machine + history log | DT-08 (potencial — transition validation) | M (~1.5h) |
| S33-APR-02 | API `/api/content/calendar/approve` + testes | — | S (~1h) |
| S33-APR-03 | UI Review Dashboard + StatusBadge component + sidebar item | — | M (~1.5h) |
| S33-BV-01 | (STRETCH) engagementScore no social_interactions + peso no generation engine | — | S (~1h) |
| S33-GATE-03 | **Gate Check 3: state machine funcional, UI review funciona, tsc=0, testes passam** | — | XS (~15min) |

### Fase 4: Governanca Final (~0.5h)

| ID | Item | Estimativa |
|:---|:-----|:-----------|
| S33-GOV-05 | Contract-map update — nova lane `content_autopilot` com todos os paths | XS (~15min) |
| S33-GOV-06 | ACTIVE_SPRINT.md + ROADMAP.md atualizados | XS (~15min) |

---

## 6. DTs Esperados (Decision Trees — para Athos)

Os DTs abaixo sao hipoteses de decisoes arquiteturais que o Athos deve validar:

| DT | Questao | Contexto |
|:---|:--------|:---------|
| DT-01 | Timer leak: cleanup global em `jest.setup.js` vs per-test `afterAll`? | Nota N4 S32. Warning `worker has failed to exit gracefully`. |
| DT-02 | `social_interactions` como subcollection `brands/{brandId}/social_interactions` ou top-level com brandId field? | Pattern existente usa subcollection para isolamento (ex: `brands/{brandId}/secrets`). |
| DT-03 | `content_calendar` como subcollection `brands/{brandId}/content_calendar` — confirmar alinhamento com pattern Firestore do projeto | Patterns existentes: `brands/{brandId}/rate_limits`, `brands/{brandId}/secrets`. |
| DT-04 | Date range query: Firestore `where('scheduledDate', '>=', start).where('scheduledDate', '<=', end)` — precisa de composite index? | Firestore pode exigir index para range query + orderBy. |
| DT-05 | Drag reorder: atualizar `order` field otimisticamente no client e persist via batch write, ou round-trip completo? | HTML5 nativo sem lib. UX deve ser responsiva. |
| DT-06 | Prompts de geracao: inline no engine ou em arquivo separado `lib/ai/prompts/content-generation.ts`? | Pattern existente: prompts separados em `lib/ai/prompts/` (ex: `social-generation.ts`, `audience-scan.ts`). |
| DT-07 | Zod schema para output do Gemini: um schema por formato ou schema unificado com discriminated union? | S32 usou Zod schema por response. Content tem 4 formatos distintos. |
| DT-08 | Transition validation: lista de adjacencia fixa (hardcoded map) ou state machine library? | Zero dep nova → hardcoded map. Confirmar. |

---

## 7. Proibicoes (P-01 a P-08 herdadas + PA-01 a PA-03 novas)

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

### Novas S33

| ID | Proibicao |
|:---|:----------|
| PA-01 | ZERO publicacao real em plataformas externas — scheduling e apenas dados, NAO execucao. Publicacao real e escopo S34+. |
| PA-02 | ZERO OAuth flow novo — usar `MonaraTokenVault` existente para credenciais. |
| PA-03 | ZERO drag-and-drop library nova — usar exclusivamente HTML5 Drag and Drop API nativa (`draggable`, `onDragStart`, `onDragOver`, `onDrop`). |

---

## 8. Criterios de Sucesso (CS-33.01 a CS-33.15)

| ID | Criterio | Verificacao |
|:---|:---------|:-----------|
| CS-33.01 | Calendario Editorial CRUD funcional via API | Teste: POST cria item, GET retorna por range, PUT atualiza, DELETE remove |
| CS-33.02 | UI calendario renderiza items por semana e mes | Visual: cards aparecem nos dias corretos nas duas views |
| CS-33.03 | Reorder funcional via drag HTML5 nativo | Manual: arrastar item entre dias atualiza `scheduledDate` e `order` |
| CS-33.04 | Content Generation produz output para 4 formatos | Teste: `generateContent()` retorna JSON valido para post, story, carousel, reel |
| CS-33.05 | Geracao respeita Brand Voice (`getBrand` + BrandKit injetado no prompt) | Code review: prompt inclui nome da marca, tom, guidelines |
| CS-33.06 | API `/api/content/generate` retorna content + metadata | Teste: POST retorna `{ content, metadata, suggestions }` |
| CS-33.07 | State machine de approval funcional (5 estados + 2 terminais) | Teste: transicoes validas passam, transicoes invalidas retornam erro |
| CS-33.08 | UI de review permite approve/reject com comentario | Visual: botoes funcionais + modal de comentario no reject |
| CS-33.09 | engagementScore computado no Response Engine (STRETCH) | Code review: campo existe e e populado quando disponivel |
| CS-33.10 | `social_interactions` collection criada com type `SocialInteractionRecord` | Code review + type check |
| CS-33.11 | Timer leak resolvido (zero warnings em `npm test`) | Test runner: output sem `worker has failed to exit gracefully` |
| CS-33.12 | zod oficializada na documentacao (README) | Grep: README menciona zod como dependencia oficial |
| CS-33.13 | Contract-map atualizado com lane `content_autopilot` | Code review: `contract-map.yaml` tem nova lane |
| CS-33.14 | Todas as rotas novas com `force-dynamic` + `requireBrandAccess` + `createApiError`/`createApiSuccess` | Grep: confirma padroes em todas as rotas `/api/content/*` |
| CS-33.15 | Isolamento multi-tenant em todas as queries (brandId obrigatorio) | Code review: zero query sem brandId |

---

## 9. Estimativa Total

| Fase | Esforco | Items |
|:-----|:--------|:------|
| Fase 0 — Governanca & Divida S32 | ~1.5h | GOV-01 a GOV-04 + Gate 0 |
| Fase 1 — Calendario Editorial | ~4-5h | CAL-01 a CAL-03 + Gate 1 |
| Fase 2 — Content Generation Pipeline | ~4-5h | GEN-01 a GEN-03 + Gate 2 |
| Fase 3 — Approval Workflow + BV 2.0 | ~4-5h | APR-01 a APR-03 + BV-01 (STRETCH) + Gate 3 |
| Fase 4 — Governanca Final | ~0.5h | GOV-05, GOV-06 |
| **TOTAL** | **~14-17h** | 16 items + 4 Gates + STRETCH |

**Observacao:** BV-01 (engagementScore) e STRETCH. Se o tempo for critico, pode ser movido para S34 sem impacto na sprint.

---

## 10. Dependencias

| Dependencia | Status |
|:-----------|:-------|
| Sprint 32 concluida (QA 91/100) | ✅ Confirmada |
| `getBrand(brandId)` funcional | ✅ Usada no Response Engine (S32) |
| `generateWithGemini()` com `responseMimeType: 'application/json'` | ✅ Funcional desde S28, JSON mode desde S32 |
| `createApiError`/`createApiSuccess` (Sigma) | ✅ 54+ rotas |
| `requireBrandAccess` (Sigma) | ✅ 25+ rotas |
| Firestore subcollection pattern (`brands/{brandId}/*`) | ✅ Usado em rate_limits, secrets, etc. |
| Zod para validacao de schemas | ✅ Formalizada em S32 (F-01) |
| Sidebar component com secao Operacoes | ✅ Sidebar 2.0 (S21) |
| BrandKit/BrandVoice types | ✅ Desde S17 |
| Lucide Icons (`Calendar`, `ClipboardCheck`) | ✅ Ja no bundle (shadcn/ui) |
| Timestamp (Firestore) | ✅ Padrao desde Sigma |
| Firebase Firestore (Client SDK) | ✅ Configurado |
| Nenhum MCP/CLI novo | ✅ N/A |
| Nenhuma dependencia npm nova | ✅ N/A |

---

## 11. Escopo Movido para S34 (NAO incluir em S33)

| Item | Motivo |
|:-----|:-------|
| Multi-Platform Scheduling Real (publicacao efetiva em plataformas) | Requer OAuth flows reais + rate limiting per-platform. Complexidade alta. |
| Performance Feedback Loop (engagement → proximo ciclo) | Depende de publicacao real para ter dados de engagement. |
| LinkedIn real inbox | Nota N2 S32. Scaffold ja existe (S32-LI-01). Inbox real e S34. |
| A/B Testing de conteudo | Depende de calendario + metricas reais. Sprint 34 tema principal. |

---

## 12. Arquivos Esperados (Novos e Modificados)

### Novos (~12-15 arquivos)

| Arquivo | Sprint Item | Tipo |
|:--------|:-----------|:-----|
| `app/src/lib/firebase/content-calendar.ts` | S33-CAL-01 | CRUD Firestore |
| `app/src/app/api/content/calendar/route.ts` | S33-CAL-02 | API Route |
| `app/src/app/api/content/calendar/reorder/route.ts` | S33-CAL-02 | API Route |
| `app/src/app/content/calendar/page.tsx` | S33-CAL-03 | UI Page |
| `app/src/lib/content/generation-engine.ts` | S33-GEN-01 | Engine |
| `app/src/lib/ai/prompts/content-generation.ts` | S33-GEN-02 | Prompts |
| `app/src/app/api/content/generate/route.ts` | S33-GEN-03 | API Route |
| `app/src/lib/content/approval-engine.ts` | S33-APR-01 | Engine |
| `app/src/app/api/content/calendar/approve/route.ts` | S33-APR-02 | API Route |
| `app/src/app/content/review/page.tsx` | S33-APR-03 | UI Page |
| `app/src/components/content/calendar-view.tsx` | S33-CAL-03 | UI Component |
| `app/src/components/content/status-badge.tsx` | S33-APR-03 | UI Component |
| `app/src/components/content/review-card.tsx` | S33-APR-03 | UI Component |
| `app/src/types/content.ts` | S33-CAL-01 | Types |

### Modificados (~5-8 arquivos)

| Arquivo | Sprint Item | Alteracao |
|:--------|:-----------|:----------|
| `app/src/components/layout/sidebar.tsx` | S33-CAL-03, S33-APR-03 | Adicionar items Content Calendar + Content Review |
| `app/src/types/social.ts` ou `types/social-inbox.ts` | S33-GOV-04 | Adicionar `SocialInteractionRecord` type |
| `_netecmt/core/contract-map.yaml` | S33-GOV-05 | Nova lane `content_autopilot` |
| `app/jest.setup.js` ou testes especificos | S33-GOV-02 | Fix timer leak |
| `README.md` ou `package.json` | S33-GOV-01 | Oficializar zod |
| `_netecmt/docs/tools/` ou ADR | S33-GOV-03 | Doc Instagram domain |
| `app/src/lib/agents/engagement/response-engine.ts` | S33-BV-01 (STRETCH) | engagementScore context |

---

## 13. Contract-Map Update Esperado (S33-GOV-05)

```yaml
content_autopilot:
  paths:
    - "app/src/lib/content/**"                          # S33-GEN-01, S33-APR-01
    - "app/src/lib/firebase/content-calendar.ts"        # S33-CAL-01
    - "app/src/lib/ai/prompts/content-generation.ts"    # S33-GEN-02
    - "app/src/app/api/content/**"                      # S33-CAL-02, S33-GEN-03, S33-APR-02
    - "app/src/app/content/**"                          # S33-CAL-03, S33-APR-03
    - "app/src/components/content/**"                   # S33-CAL-03, S33-APR-03
    - "app/src/types/content.ts"                        # S33-CAL-01
  contract: "_netecmt/contracts/content-autopilot-spec.md"
```

---

*PRD formalizado por Iuran (PM) sob aprovacao do Alto Conselho.*
*Sprint 33: Content Autopilot Foundation | 08/02/2026*
*Veredito: Unanimidade 5/5 — Estimativa aprovada: ~14-17h*
