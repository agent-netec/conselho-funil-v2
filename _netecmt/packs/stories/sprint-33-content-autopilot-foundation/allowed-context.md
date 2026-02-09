# Allowed Context — Sprint 33: Content Autopilot Foundation
**Preparado por:** Leticia (SM)
**Data:** 08/02/2026
**Sprint:** 33
**Destinatario:** Darllyson (Dev)

> **REGRA ABSOLUTA:** Darllyson so pode ler e modificar os arquivos listados abaixo. Qualquer arquivo fora desta lista requer aprovacao explicita da SM (Leticia) ou do Arch (Athos).

---

## LEITURA OBRIGATORIA (Ler ANTES de iniciar qualquer story)

| # | Arquivo | Conteudo |
|:--|:--------|:---------|
| R-01 | `_netecmt/solutioning/prd/prd-sprint-33-content-autopilot-foundation.md` | PRD completo com requisitos e Success Criteria |
| R-02 | `_netecmt/solutioning/architecture/arch-sprint-33.md` | Architecture Review com 10 DTs (3 Blocking) |
| R-03 | `_netecmt/packs/stories/sprint-33-content-autopilot-foundation/stories.md` | Stories com ACs detalhados e codigo de referencia |
| R-04 | `_netecmt/packs/stories/sprint-33-content-autopilot-foundation/story-pack-index.md` | Indice do pack com fases, gates e dependencias |

---

## PODE MODIFICAR (Arquivos alvo da sprint)

### Novos Arquivos (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| M-01 | `app/src/types/content.ts` | S33-CAL-01 | Types (CalendarItem, ContentFormat, etc.) + Zod Schemas (4 formatos) |
| M-02 | `app/src/lib/firebase/content-calendar.ts` | S33-CAL-01 | CRUD helpers Firestore (create, get, update, delete, reorder) |
| M-03 | `app/src/app/api/content/calendar/route.ts` | S33-CAL-02 | API Route (GET, POST, PUT, DELETE) |
| M-04 | `app/src/app/api/content/calendar/reorder/route.ts` | S33-CAL-02 | API Route (POST reorder via writeBatch) |
| M-05 | `app/src/app/content/calendar/page.tsx` | S33-CAL-03 | UI Pagina Calendario (semanal + mensal + drag HTML5) |
| M-06 | `app/src/components/content/calendar-view.tsx` | S33-CAL-03 | UI Componente grid do calendario |
| M-07 | `app/src/lib/content/generation-engine.ts` | S33-GEN-01 | Content Generation Engine (Gemini + Brand Voice) |
| M-08 | `app/src/lib/ai/prompts/content-generation.ts` | S33-GEN-02 | 4 prompts especializados + system instruction |
| M-09 | `app/src/app/api/content/generate/route.ts` | S33-GEN-03 | API Route (POST geracao de conteudo) |
| M-10 | `app/src/lib/content/approval-engine.ts` | S33-APR-01 | Approval Engine (state machine + history log) |
| M-11 | `app/src/app/api/content/calendar/approve/route.ts` | S33-APR-02 | API Route (POST transicao de status) |
| M-12 | `app/src/app/content/review/page.tsx` | S33-APR-03 | UI Pagina Review Dashboard |
| M-13 | `app/src/components/content/status-badge.tsx` | S33-APR-03 | UI Componente StatusBadge (6 cores por status) |
| M-14 | `app/src/components/content/review-card.tsx` | S33-APR-03 | UI Componente ReviewCard (approve/reject) |

### Arquivos Existentes (MODIFICAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-15 | `app/src/types/social.ts` | S33-GOV-04 | Adicionar interface `SocialInteractionRecord` |
| M-16 | `app/jest.setup.js` | S33-GOV-02 | Adicionar `afterAll` global (timer cleanup) + `writeBatch` mock |
| M-17 | `app/src/lib/constants.ts` | S33-CAL-03, S33-APR-03 | Adicionar 2 items ao grupo `execution` no NAV_GROUPS (Calendario + Aprovacoes) |
| M-18 | `app/src/lib/guards/resolve-icon.ts` | S33-CAL-03, S33-APR-03 | Registrar icons `Calendar` e `ClipboardCheck` do Lucide no mapa |

### Governanca (MODIFICAR / CRIAR)

| # | Arquivo | Story | Modificacao |
|:--|:--------|:------|:-----------|
| M-19 | `_netecmt/docs/tools/instagram-domain-decision.md` | S33-GOV-03 | **CRIAR** — ADR Instagram domain |
| M-20 | `_netecmt/core/contract-map.yaml` | S33-GOV-05 | Nova lane `content_autopilot` |
| M-21 | `_netecmt/sprints/ACTIVE_SPRINT.md` | S33-GOV-06 | Atualizar para S33 |
| M-22 | `_netecmt/ROADMAP.md` | S33-GOV-06 | Adicionar entrada S33 |
| M-23 | `README.md` ou `app/README.md` | S33-GOV-01 | Adicionar nota zod como dep oficial |

### Testes (CRIAR)

| # | Arquivo | Story | Descricao |
|:--|:--------|:------|:----------|
| T-01 | `app/src/__tests__/lib/firebase/content-calendar.test.ts` | S33-CAL-01, S33-CAL-02 | Testes CRUD + writeBatch reorder (4+ testes) |
| T-02 | `app/src/__tests__/lib/content/generation-engine.test.ts` | S33-GEN-01, S33-GEN-03 | Testes geracao 4 formatos + fallback (4+ testes) |
| T-03 | `app/src/__tests__/lib/content/approval-engine.test.ts` | S33-APR-01, S33-APR-02 | Testes state machine + history (6+ testes) |

---

## PODE LER (Referencia — NAO MODIFICAR)

### Utilitarios e Patterns

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-01 | `app/src/lib/utils/api-response.ts` | `createApiError(status, message, details?)` / `createApiSuccess(data)` — pattern obrigatorio para todas as rotas |
| L-02 | `app/src/lib/auth/brand-guard.ts` | `requireBrandAccess(req, brandId)` — guard obrigatorio em rotas brand-scoped. **IMPORT PATH CORRETO: `@/lib/auth/brand-guard`** |
| L-03 | `app/src/lib/utils/encryption.ts` | `encrypt(text)` / `decrypt(text)` — pattern para vault credentials |

### Firebase & Data

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-04 | `app/src/lib/firebase/config.ts` | `db` — instancia Firestore. `Timestamp` importado de `firebase/firestore` |
| L-05 | `app/src/lib/firebase/firestore.ts` | `getBrand(brandId)` — busca dados da marca (nome, brandKit, tone, voice). Patterns CRUD existentes. |
| L-06 | `app/src/lib/firebase/scoped-data.ts` | `getBrandKit(brandId)` — busca Brand Kit completo (voice guidelines) |
| L-07 | `app/src/lib/firebase/vault.ts` | Pattern subcollection `brands/{brandId}/secrets` — referencia de isolamento |
| L-08 | `app/src/lib/firebase/assets.ts` | Pattern `writeBatch()` — referencia para reorder atomico (DT-05) |

### AI & Prompts

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-09 | `app/src/lib/ai/gemini.ts` | `generateWithGemini(prompt, options?)` — suporta `responseMimeType: 'application/json'`, `systemPrompt`, `temperature`, `brandId`, `feature` |
| L-10 | `app/src/lib/ai/prompts/social-generation.ts` | Referencia de pattern: prompts exportados como constantes com placeholders |
| L-11 | `app/src/lib/ai/prompts/audience-scan.ts` | Referencia alternativa de pattern de prompts |

### Types

| # | Arquivo | Types Relevantes |
|:--|:--------|:-----------------|
| L-12 | `app/src/types/social-inbox.ts` | `SocialInteraction`, `BrandVoiceSuggestion` — referencia |
| L-13 | `app/src/types/social.ts` | Types sociais existentes (antes da modificacao GOV-04) |

### Layout & UI

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-14 | `app/src/components/layout/sidebar.tsx` | Sidebar le de `constants.ts` via `NAV_GROUPS`. NAO modificar diretamente — alteracoes via `constants.ts` (M-17) |

### Middleware

| # | Arquivo | Conteudo Relevante |
|:--|:--------|:-------------------|
| L-15 | `app/src/lib/middleware/rate-limiter.ts` | Referencia de pattern `runTransaction()` |

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
| P-09 | ZERO publicacao real em plataformas externas | Scheduling e dados apenas — PA-01 |
| P-10 | ZERO drag-and-drop library | HTML5 nativo exclusivamente — PA-03 |
| P-11 | ZERO `orderBy` combinado com `where` em campo diferente | In-memory sort — PA-04 / DT-04 BLOCKING |
| P-12 | ZERO updates sequenciais para reorder | `writeBatch()` obrigatorio — PA-05 / DT-05 BLOCKING |
| P-13 | ZERO transicao de status sem adjacency map | `VALID_TRANSITIONS` obrigatorio — PA-06 / DT-08 BLOCKING |

---

## DECISION TOPICS (DTs) — Resumo Rapido

| DT | Prioridade | Status | Resumo |
|:---|:-----------|:-------|:-------|
| DT-01 | NON-BLOCKING | RESOLVIDO | Timer leak: `afterAll` global + `--detectOpenHandles` |
| DT-02 | NON-BLOCKING | RESOLVIDO | `social_interactions` como subcollection `brands/{brandId}/social_interactions` |
| DT-03 | NON-BLOCKING | RESOLVIDO | `content_calendar` subcollection + campo `createdBy` |
| DT-04 | **P0 BLOCKING** | RESOLVIDO | Range query campo unico + in-memory sort. ZERO composite index. |
| DT-05 | **P0 BLOCKING** | RESOLVIDO | Reorder via `writeBatch()`. ZERO updates sequenciais. |
| DT-06 | NON-BLOCKING | RESOLVIDO | Prompts em `lib/ai/prompts/content-generation.ts` (arquivo separado) |
| DT-07 | NON-BLOCKING | RESOLVIDO | 4 Zod schemas separados com mapa `CONTENT_SCHEMAS` |
| DT-08 | **P0 BLOCKING** | RESOLVIDO | State machine via adjacency map `VALID_TRANSITIONS`. ZERO skip. |
| DT-09 | NON-BLOCKING | RESOLVIDO | Sidebar items no grupo `execution`. Icons registrados. |
| DT-10 | NON-BLOCKING | RESOLVIDO | Nova lane `content_autopilot` no contract-map |

---

## MAPA DE DEPENDENCIAS (Ordem de Execucao)

```
Fase 0 (paralelo):
  GOV-01 ──┐
  GOV-02 ──┤
  GOV-03 ──┼──→ GATE-00
  GOV-04 ──┘

Fase 1 (sequencial):
  CAL-01 → CAL-02 → CAL-03 → GATE-01

Fase 2 (sequencial):
  GEN-01 → GEN-02 → GEN-03 → GATE-02

Fase 3 (sequencial):
  APR-01 → APR-02 → APR-03 → [BV-01 STRETCH] → GATE-03

Fase 4 (sequencial):
  GOV-05 → GOV-06
```

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 33: Content Autopilot Foundation | 08/02/2026*
*14 arquivos novos + 9 modificacoes + 3 test files = 26 arquivos no escopo*
*15 arquivos de leitura (referencia)*
