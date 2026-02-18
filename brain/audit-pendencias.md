# Auditoria de Pendências — Conselho de Funil

> **Data:** 2026-02-18
> **Escopo:** Análise completa pós-Sprint X (commit pendente)
> **Método:** 4 agentes paralelos auditando stubs, mocks, gaps de implementação, qualidade de código

---

## Índice

1. [P0 — Bugs Críticos em Produção](#p0--bugs-criticos-em-producao)
2. [P1 — Dados Fake Visíveis ao Usuário](#p1--dados-fake-visiveis-ao-usuario)
3. [P2 — Segurança: Rotas sem Auth Guard](#p2--seguranca-rotas-sem-auth-guard)
4. [P3 — Botões Mortos / Stubs](#p3--botoes-mortos--stubs)
5. [P4 — Gaps de Implementação (Sprints W/X)](#p4--gaps-de-implementacao-sprints-wx)
6. [P5 — Qualidade de Código (Sprint X)](#p5--qualidade-de-codigo-sprint-x)
7. [P6 — Roadmap Items Pendentes](#p6--roadmap-items-pendentes)
8. [P7 — Débito Técnico](#p7--debito-tecnico)
9. [P8 — Código Morto](#p8--codigo-morto)

---

## P0 — Bugs Críticos em Produção

Problemas que corrompem dados ou criam vulnerabilidades de segurança.

### P0-1. `approvedBy: 'current-user'` hardcoded no Vault
- **Arquivo:** `app/src/app/vault/page.tsx:85`
- **Problema:** Toda aprovação no Creative Vault grava a string literal `'current-user'` no Firestore, em vez do UID real do usuário autenticado.
- **Impacto:** Impossível rastrear quem aprovou qual conteúdo. Auditoria de aprovações inútil.
- **Fix:** Extrair `userId` via `getAuth().currentUser?.uid` ou passar do contexto de auth.

### P0-2. `brandId: 'default'` hardcoded em Offline Conversion API
- **Arquivo:** `app/src/app/api/integrations/offline-conversion/route.ts:32`
- **Problema:** Todas as transações de conversão offline são atribuídas a uma brand inexistente `'default'`.
- **Impacto:** Dados financeiros desvinculados da brand real. Attribution dashboard não recebe esses dados.
- **Fix:** Derivar `brandId` do request body ou do contexto de auth.

### P0-3. API Keys sem verificação de expiração de token
- **Arquivo:** `app/src/app/api/settings/api-keys/route.ts` e `[keyId]/route.ts`
- **Problema:** O `verifyUser` customizado usa Firebase Identity Toolkit REST API (`accounts:lookup`) que **aceita tokens expirados**. Um token roubado/expirado permite listar e criar API keys.
- **Impacto:** Vulnerabilidade de segurança — tokens expirados dão acesso ao management de API keys.
- **Fix:** Usar `requireBrandAccess` ou validar claim `exp` do token manualmente.

### P0-4. `mock=true` aceito em produção na Validate Integration API
- **Arquivo:** `app/src/app/api/performance/integrations/validate/route.ts:39-53`
- **Problema:** Endpoint aceita `mock=true` no body que faz skip de toda validação. Qualquer `apiKey.startsWith('sk_')` ou `apiKey === 'mock_key'` retorna "válido".
- **Impacto:** Integrações falsas podem ser marcadas como válidas em produção.
- **Fix:** Remover path de mock ou restringir a `NODE_ENV === 'development'`.

### P0-5. `activeBrand` não existe no Zustand store — 3 páginas quebradas
O store `brand-store.ts` expõe `selectedBrand`, mas 3 páginas fazem destructure de `activeBrand` que **não existe no BrandState**. Resultado: `brandId` é sempre `undefined` e todas as API calls falham.

| # | Arquivo | Linha |
|---|---------|-------|
| 1 | `app/src/app/intelligence/journey/page.tsx` | 34 |
| 2 | `app/src/app/settings/tracking/page.tsx` | 21 |
| 3 | `app/src/app/settings/integrations/payments/page.tsx` | 82 |

**Fix:** Trocar `const { activeBrand } = useBrandStore()` por `const activeBrand = useActiveBrand()` (hook correto).

### P0-6. Fetch para rotas API inexistentes — 2 páginas
| # | Arquivo | Rota chamada | Problema |
|---|---------|-------------|---------|
| 1 | `app/src/app/performance/page.tsx` | `POST /api/performance/sync` | Rota não existe — botão "Sync Data" retorna 404 |
| 2 | `components/intelligence/competitors/funnel-cloner-wizard.tsx` | `POST /api/intelligence/funnel/clone` | Rota não existe — wizard de clone retorna 404 |

### P0-7. Next.js 16 params pattern incorreto — 4 rotas
As rotas `[testId]` usam o pattern antigo (`context: { params: { testId } }`) em vez do novo (`params: Promise<{ testId }>`):

- `api/intelligence/ab-tests/[testId]/assign/route.ts`
- `api/intelligence/ab-tests/[testId]/event/route.ts`
- `api/intelligence/ab-tests/[testId]/optimize/route.ts`
- `api/intelligence/ab-tests/[testId]/route.ts`

**Fix:** Migrar para `params: Promise<{ testId: string }>` + `const { testId } = await params`.

---

## P1 — Dados Fake Visíveis ao Usuário

Mocks renderizados em produção que enganam o usuário.

### P1-1. Intelligence Page — 6 arrays de dados mock
- **Arquivo:** `app/src/app/intelligence/page.tsx:24-140`
- **Dados fake:** `MOCK_KEYWORDS` (4 keywords com volume inventado: 12500, 8400...), `MOCK_SOCIAL_VOLUME` (7 dias), `MOCK_EMOTIONS` (joy: 45, anger: 12...), `MOCK_COMPETITORS`, `MOCK_DOSSIER` (brandId: "brand_123")
- **Linha 250:** Fallback `keywords.length > 0 ? keywords : MOCK_KEYWORDS` — mostra dados falsos quando não há keywords reais
- **Linha 256:** `competitors={MOCK_COMPETITORS}` — sempre passa mock

### P1-2. Campaign Command Center — Métricas e anomalias fake
- **Arquivo:** `app/src/app/campaigns/[id]/page.tsx:43-54`
- **Dados fake:** CTR 0.65%, CPC R$2.45, Conversion 3.2%, ROAS 2.1x. Comment: `// Mock metrics for ST-11.17`. Também 2 anomalias hardcoded.

### P1-3. Sources Tab — Fontes de monitoramento fake
- **Arquivo:** `app/src/components/intelligence/sources-tab.tsx:40-69`
- **Dados fake:** 3 fontes hardcoded (Reddit r/copywriting, ClickFunnels Blog, Twitter #MarketingTrends) com scores de relevância fabricados.

### P1-4. Console.log com dump de dados sensíveis
- **Arquivo:** `app/src/app/api/decisions/route.ts:219` — `console.log('Decision data to save:', JSON.stringify(sanitizedData, null, 2))` — dump completo de dados de decisão em cada request
- **Arquivo:** `app/src/app/api/funnels/generate/route.ts:145-147` — dump de resposta raw do Gemini
- **Arquivo:** `app/src/app/api/chat/route.ts:363` — leak de seleção interna de agentes

---

## P2 — Segurança: Rotas sem Auth Guard

12 rotas de API que aceitam `brandId`/`funnelId` do usuário mas **não usam `requireBrandAccess`** — potenciais vetores IDOR (Insecure Direct Object Reference):

| # | Rota | Aceita | Risco |
|---|------|--------|-------|
| 1 | `/api/assets/delete` | `assetId` + `brandId` body | Qualquer user pode deletar assets de outra brand |
| 2 | `/api/assets/metrics` | `brandId` query param | Qualquer user pode ver métricas de outra brand |
| 3 | `/api/decisions` | `funnelId` query/body | Acesso a decisões de outros funnels |
| 4 | `/api/library` | user data | Sem auth check |
| 5 | `/api/copy/generate` | `funnelId` | Gerar copy para funnel alheio |
| 6 | `/api/copy/decisions` | `funnelId` | Acessar decisões de copy |
| 7 | `/api/ingest/process-worker` | `assetId` | Processar asset alheio |
| 8 | `/api/ingest/url` | — | Sem auth check |
| 9 | `/api/social-inbox` (GET) | `brandId` | Ver inbox social de outra brand |
| 10 | `/api/funnels/generate` | `funnelId` | Gerar funil para outro user |
| 11 | `/api/campaigns/[id]/generate-ads` | campaign data | Gerar ads para campanha alheia |
| 12 | `/api/intelligence/attribution/sync` | — | Sem auth check |

**Fix:** Adicionar `requireBrandAccess(req, brandId)` com `handleSecurityError` em cada rota.

**Nota:** Rotas corretamente SEM auth: `/api/auth/*` (callbacks OAuth), `/api/cron/*` (CRON_SECRET), `/api/webhooks/*` (external), `/api/admin/*` (admin key), `/api/tracking/*` (public pixel).

---

## P3 — Botões Mortos / Stubs

Botões visíveis na UI que não fazem nada além de exibir toast "em breve" ou `console.log`.

### Toasts "Em Breve"
| # | Arquivo | Botão | Linha |
|---|---------|-------|-------|
| 1 | `vault/page.tsx` | "Novo Ativo" | 142 |
| 2 | `vault/page.tsx` | "Histórico" | 146 |
| 3 | `spy-agent.tsx` | "Aplicar Insights" | 429 |
| 4 | `keywords-miner.tsx` | "Enviar para Conselho de Copy" | 371 |

### Console.log como handler
| # | Arquivo | Botão | Linha |
|---|---------|-------|-------|
| 1 | `intelligence/page.tsx` | "Add Competitor" | 261 |
| 2 | `intelligence/page.tsx` | "Trigger Dossier" | 263 |
| 3 | `automation/page.tsx` | "View Details" | 378 |
| 4 | `performance/page.tsx` | "Acknowledge Alert" | 352 |
| 5 | `modern-animated-sign-in.tsx` | "Google Login" | 430 |
| 6 | `modern-animated-sign-in.tsx` | Form submit (debug log) | 397 |

---

## P4 — Gaps de Implementação (Sprints W/X)

### Sprint W — Itens não checados no roadmap mas implementados
O roadmap `master-roadmap.md` mostra `[ ]` para todos os items W, mas a análise do codebase confirma que **quase tudo foi implementado**:

| Task | Status Real | Nota |
|------|-------------|------|
| W-1.1 Multi-condição AND/OR | **Implementado** | `types/automation.ts`, `engine.ts` |
| W-1.2 Trend triggers | **Implementado** | `trendPeriodDays` + `trendDirection` |
| W-1.3 UI form builder | **NÃO implementado** | Backend pronto, falta UI de criação de regras compostas |
| W-2.1 Council debate (4 counselors) | **Implementado** | `evaluate.ts` com `ADS_COUNSELOR_IDS` |
| W-2.2 Verdict na UI | **Implementado** | `CouncilDebateResult` type |
| W-2.3 Persistir debate | **Implementado** | `automation_log.context.councilDebate` |
| W-3.1 Meta API real | **Implementado** | `adapters/meta.ts` |
| W-3.2 Google Ads API | **Implementado** | `adapters/google.ts` |
| W-3.3 Status tracking | **Implementado** | `ExecutionResult` interface |
| W-3.4 Webhook CAPI | **Implementado** | `webhooks/meta-capi/route.ts` |
| W-4.1 Before/after (24-72h) | **Implementado** | `measure-impact/route.ts` |
| W-4.2 Sugestões proativas | **Implementado** | `suggestions/route.ts` |
| W-4.3 Dashboard timeline+ROI | **NÃO implementado** | Backend pronto, falta UI |
| W-5.1 Auto-template / flag | **Implementado** | `content/analytics/route.ts` |
| W-5.2 Feed RAG | **Implementado** | Pinecone upsert com `social_case_study` |

**Ação:** Atualizar `master-roadmap.md` para marcar W como concluído. Itens W-1.3 e W-4.3 são apenas UI.

### Sprint X — Itens implementados mas com gaps

| Task | Status | Gap |
|------|--------|-----|
| X-1.1 Case studies | Implementado | `req.json()` antes do try/catch |
| X-1.2 A/B variations | Implementado | Gemini error text leaks para client |
| X-1.3 Campaign pipeline | Implementado | OK |
| X-2.1 DNA wizard | Implementado | `platform_optimization` type mismatch — AI retorna "Instagram (Reels)" mas enum espera `'instagram'` |
| X-2.2 DNA tracking | Implementado | OK |
| X-2.3 Inline edit | Implementado | OK |
| X-2.4 Scheduling | Implementado | OK |
| X-2.5 Council review | Implementado | Agent IDs hardcoded — risco de coupling |
| X-3.1 Voice editor | Implementado | Grava direto no Firestore client-side (bypass de `requireBrandAccess`) |
| X-3.2 Voice samples | Implementado | 3 imports não utilizados (`generateEmbedding`, `upsertToPinecone`, `buildPineconeRecord`) |
| X-4.1 Reference campaigns | Implementado | Gemini analisa URL sem fetch do conteúdo real (hallucina) |
| X-4.2 Auto-tag | Implementado | OK |
| X-4.3 Versionamento | Implementado | OK |
| X-4.4 Re-análise | **STUB** | Endpoint retorna lista de IDs mas não faz processamento real |
| X-5 Glimpse SEO | Skipped | Conforme spec |
| X-6.1 Notifications | Implementado | Dynamic import desnecessário para `doc`/`getDoc` |
| X-6.2 API Keys | Implementado | **Segurança: token expirado aceito** (ver P0-3) |
| X-6.3 2FA/MFA | Não implementado | Depende de Firebase TOTP project config |

---

## P5 — Qualidade de Código (Sprint X)

### Padrão repetido em 6 rotas: `req.json()` antes do try/catch

**Rotas afetadas:**
- `api/social/cases/route.ts`
- `api/social/ab-variations/route.ts`
- `api/vault/dna/extract/route.ts`
- `api/vault/council-review/route.ts`
- `api/assets/reference/route.ts`
- `api/assets/reanalyze/route.ts`

**Problema:** Se o body não for JSON válido, crash com 500 genérico em vez de 400 controlado.
**Fix:** Mover `await req.json()` para dentro do primeiro try/catch.

### Gemini error text vazando para o client (5 rotas)
**Rotas:** `ab-variations`, `dna/extract`, `council-review`, `assets/reference`, `voice-samples`
**Fix:** Trocar `Gemini API error: ${errText}` por mensagem genérica.

### Inconsistência de notificação
- `dna-wizard.tsx` usa `notify` do `notification-store`
- `voice-profile-editor.tsx` usa `toast` do `sonner`
**Fix:** Padronizar em um único sistema.

### `verifyUser` duplicado (copy-paste)
- `api/settings/api-keys/route.ts`
- `api/settings/api-keys/[keyId]/route.ts`
**Fix:** Extrair para utility compartilhado ou usar `requireBrandAccess`.

---

## P6 — Roadmap Items Pendentes

### Pendências do Sprint R (documentadas em `sprint-r-pendencias.md`)
| Item | Prioridade | Status |
|------|-----------|--------|
| R-2.3 Bundle Size Audit | Baixa | Pendente — rodar `next-bundle-analyzer` |
| R-3.1 Sentry Error Tracking | Média | Pendente — `npm install @sentry/nextjs` |
| R-3.3 Uptime Monitoring | Baixa | Pendente — serviço externo |
| R-4.2 Confirmação dupla delete brand | Média | Pendente — UI component |
| NEXT_PUBLIC_ENCRYPTION_KEY removal | Baixa | Pendente — cleanup |

### Sprints P e Q (dependem de designer)
| Sprint | Status | Blocker |
|--------|--------|---------|
| P — UX/UI Redesign | Não iniciado | Requer designer |
| Q — Landing Page & Auth | Não iniciado | Depende de P |

### TODOs no código
| Arquivo | Linha | TODO |
|---------|-------|------|
| `offline-conversion/route.ts` | 32 | `brandId: 'default' // TODO: Obter do contexto` |
| `rate-limiter.ts` | 133 | `// TODO R-3.4: Send Slack alert for rate limiter failures` |
| `linkedin-adapter.ts` | 85 | `// TODO: Implementar GET inbox real` (retorna `[]`) |
| `engine.ts` | 128 | `// TODO: migrar para collectionGroup query` |

---

## P7 — Débito Técnico

### ~150+ console.log em produção
Os `console.log` deveriam usar o `logger.ts` estruturado que já existe em `lib/utils/logger.ts`. Os mais críticos:

| Módulo | Arquivo | Count | Risco |
|--------|---------|-------|-------|
| Asset Metrics | `api/assets/metrics/route.ts` | 11 | Extremamente verboso |
| Meta Adapter | `automation/adapters/meta.ts` | 10 | Cada operação logada |
| Funnel Generate | `api/funnels/generate/route.ts` | 8 | Inclui dump de AI response |
| Copy Generate | `api/copy/generate/route.ts` | 8 | Flow logging |
| Embeddings | `lib/ai/embeddings.ts` | 7 | Cache hit/miss em cada call |
| URL Scraper | `lib/ai/url-scraper.ts` | 7 | Flow logging |
| Design Generate | `api/design/generate/route.ts` | 6 | Flow logging |
| Admin Upload | `api/admin/upload-knowledge/route.ts` | 6 | Flow logging |

**Total estimado:** ~150+ ocorrências que poluem os logs do Vercel.

### Google Login button morto
- **Arquivo:** `components/ui/modern-animated-sign-in.tsx:430`
- Botão "Google Login" faz `console.log('Google login clicked')` — não implementa OAuth Google para auth.

### LinkedIn inbox retorna array vazio
- **Arquivo:** `lib/integrations/social/linkedin-adapter.ts:85`
- `getInbox()` retorna `[]` com TODO para implementar. Social Command Center não tem inbox real do LinkedIn.

### Stale build version hardcoded
- **Arquivo:** `components/council/asset-preview.tsx:53`
- `console.log('[AssetPreview] Build Version: 11.24.4 (Ultra-Resilient Parser Active)')` — versão hardcoded desatualizada logada em cada render.

---

## P8 — Código Morto

### Componentes sem nenhum import (19 arquivos)

| # | Componente | Nota |
|---|-----------|------|
| 1 | `components/analytics/funnel-analytics.tsx` | Não importado |
| 2 | `components/analytics/funnel-dropoff-chart.tsx` | Não importado |
| 3 | `components/agency/AgencyMembersManager.tsx` | Não importado |
| 4 | `components/chat/ads-strategy-card.tsx` | Não importado |
| 5 | `components/chat/chat-input.tsx` | Substituído por `chat-input-area.tsx` |
| 6 | `components/chat/counselor-badges.tsx` | Não importado |
| 7 | `components/chat/counselor-multi-selector.tsx` | Não importado |
| 8 | `components/context/scope-selector.tsx` | Não importado |
| 9 | `components/copy/copy-scorecard.tsx` | Não importado |
| 10 | `components/council/asset-preview.tsx` | Não importado (e tem build version hardcoded) |
| 11 | `components/funnel-autopsy/FunnelMap.tsx` | Não importado |
| 12 | `components/intelligence/competitors/tech-stack-badges.tsx` | Não importado |
| 13 | `components/intelligence/competitors/funnel-cloner-wizard.tsx` | Não importado + chama rota inexistente |
| 14 | `components/intelligence/personalization/PropensityBadge.tsx` | Não importado |
| 15 | `components/brands/new-project-modal.tsx` | Não importado |
| 16 | `components/personalization/audience-scan-card.tsx` | Não importado |
| 17 | `components/performance/budget-pacing-widget.tsx` | Não importado |
| 18 | `components/layout/user-usage-widget.tsx` | Não importado |
| 19 | `components/content/status-badge.tsx` | Não importado |

### Lib files sem nenhum import (8 arquivos)

| # | Arquivo | Nota |
|---|---------|------|
| 1 | `lib/ai/rag-helpers-fixed.ts` | Código morto |
| 2 | `lib/ai/ocr-processor.ts` | Código morto |
| 3 | `lib/agency/migration.ts` | Código morto |
| 4 | `lib/automation/budget-optimizer.ts` | Código morto |
| 5 | `lib/automation/scaling-predictor.ts` | Código morto |
| 6 | `lib/intelligence/mmm/correlator.ts` | Código morto |
| 7 | `lib/intelligence/config.ts` | Código morto |
| 8 | `lib/performance/encryption.ts` | Duplicata de `lib/utils/encryption.ts` |

### Rotas API órfãs (25+ rotas sem consumer no frontend)

Excluindo cron/webhook/auth que são chamadas externamente:

| Rota | Nota |
|------|------|
| `/api/ai/analyze-visual` | 0 consumers |
| `/api/assets/import` | Self-reference apenas |
| `/api/assets/reanalyze` | 0 consumers (Sprint X stub) |
| `/api/assets/reference` | 0 consumers |
| `/api/brands/[brandId]/assets/url` | 0 consumers |
| `/api/brands/[brandId]/duplicate` | 0 consumers |
| `/api/brands/[brandId]/export` | 0 consumers |
| `/api/brands/[brandId]/logo-lock` | 0 consumers |
| `/api/content/analytics` | Self-reference apenas |
| `/api/content/generate` | Self-reference apenas |
| `/api/content/calendar/metrics` | 0 consumers |
| `/api/content/calendar/publish` | 0 consumers |
| `/api/funnels/export` | 0 consumers |
| `/api/integrations/offline-conversion` | 0 consumers |
| `/api/intelligence/attribution/overlap` | Self-reference apenas |
| `/api/intelligence/offer/calculate-score` | 0 consumers |
| `/api/pinecone/health` | 0 consumers |
| `/api/pinecone/migrate` | 0 consumers |
| `/api/reporting/anomaly-check` | 0 consumers |
| `/api/settings/api-keys/[keyId]` | 0 consumers |
| `/api/social/generate` | 0 consumers |
| `/api/social-inbox/metrics` | 0 consumers |
| `/api/user/export` | 0 consumers |
| `/api/vault/ab-test` | 0 consumers |
| `/api/vault/publish` | 0 consumers |

### Types duplicados

| Type | Definição 1 | Definição 2 | Divergência |
|------|------------|------------|-------------|
| `FunnelStage` | `types/index.ts:55` (6 campos, type union restrita) | `types/database.ts:369` (10+ campos, `type: string`) | Schemas incompatíveis |
| `Decision` | `types/index.ts:105` (simples, has `rationale`) | `types/database.ts:436` (rico, has `proposalId`, `parecer`) | Campos diferentes |
| `SocialPlatform` | `types/social-platform.ts:6` (canonical) | Re-exportado em `social.ts`, `vault.ts`, `social-inbox.ts` | OK mas confuso |

---

## Resumo por Prioridade

| Prioridade | Count | Ação |
|-----------|-------|------|
| **P0 — Crítico** | 7 | Fix imediato — `'current-user'`, `'default'`, token, mock, `activeBrand` bug, rotas 404, params |
| **P1 — Alto** | 4 | Remover mock data visível ao usuário |
| **P2 — Segurança** | 12 | Adicionar `requireBrandAccess` em 12 rotas |
| **P3 — Stubs** | 10 | Implementar ou esconder botões mortos |
| **P4 — Gaps** | 2 | UI faltante (W-1.3 form builder, W-4.3 dashboard ROI) |
| **P5 — Code Quality** | 15 | Fix `req.json()`, Gemini error leak, imports mortos |
| **P6 — Roadmap** | 7+ | Sentry, bundle audit, Sprints P/Q |
| **P7 — Debt** | ~150+ | Migrar console.log → logger.ts |
| **P8 — Dead Code** | ~52 | 19 components + 8 libs + 25 rotas órfãs |

**Total: ~260+ findings**

---

## Recomendação: Próximo Sprint

**Sprint Y — Integrity & Security** (~2-3 sessões)

### Sessão 1: P0 fixes
1. Fix `approvedBy: 'current-user'` → user.uid real
2. Fix `brandId: 'default'` → derivar do contexto
3. Fix `activeBrand` em 3 páginas → `useActiveBrand()`
4. Criar rota `/api/performance/sync` (ou remover botão)
5. Fix Next.js 16 params pattern em 4 rotas `[testId]`
6. Remover mock validation path em validate API
7. Fix `verifyUser` inseguro em api-keys (usar `requireBrandAccess` ou validar `exp`)

### Sessão 2: P1 + P2 security
1. Remover mock data de intelligence/page, campaigns/[id]/page, sources-tab
2. Adicionar `requireBrandAccess` nas 12 rotas sem auth guard
3. Fix `req.json()` pattern nos 6 endpoints do Sprint X
4. Sanitizar Gemini error messages (5 rotas)

### Sessão 3: Cleanup
1. Deletar 19 componentes mortos + 8 lib files mortos
2. Migrar top 30 console.log mais verbosos para `logger.ts`
3. Atualizar `master-roadmap.md` com checkboxes corretos para W e X
4. Unificar types duplicados (`FunnelStage`, `Decision`)

> **Última atualização:** 2026-02-18
