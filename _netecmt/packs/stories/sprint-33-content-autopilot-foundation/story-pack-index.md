# Story Pack Index — Sprint 33: Content Autopilot Foundation

**Sprint:** 33
**Tipo:** Feature Sprint (Content Autopilot)
**SM:** Leticia
**Data:** 08/02/2026
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5
**PRD:** `_netecmt/solutioning/prd/prd-sprint-33-content-autopilot-foundation.md`
**Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-33.md` — APROVADO COM RESSALVAS (10 DTs, 3 Blocking)

---

## Organizacao do Pack

| Arquivo | Conteudo |
|:--------|:---------|
| `story-pack-index.md` | Este arquivo (indice e visao geral) |
| `stories.md` | Stories detalhadas com acceptance criteria |
| `allowed-context.md` | Arquivos que Darllyson pode ler/modificar |

---

## Baseline pos-Sprint 32

| Metrica | Valor |
|:--------|:------|
| Testes passando | 257/257 (47 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | 105 rotas (Next.js 16.1.1 Turbopack) |
| QA Score | 91/100 |

---

## Fases e Sequencia

### Fase 0: Governanca & Divida S32 (~1.5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S33-GOV-01 | Oficializar zod como dep padrao (README) | — | XS (~15min) | — |
| S33-GOV-02 | Timer leak fix (worker exit warning) | DT-01 | S (~45min) | — |
| S33-GOV-03 | Documentar decisao Instagram domain | — | XS (~15min) | — |
| S33-GOV-04 | Collection social_interactions + type SocialInteractionRecord | DT-02 | XS (~15min) | — |
| S33-GATE-00 | **Gate Check 0** | — | XS (~15min) | GOV-01 a GOV-04 |

### Fase 1: Calendario Editorial (P0 — ~5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S33-CAL-01 | Data model Firestore + CRUD helpers + types | DT-03, DT-04 (BLOCKING), DT-05 (BLOCKING) | M (~1.5h) | S33-GATE-00 |
| S33-CAL-02 | API CRUD `/api/content/calendar` + `/reorder` | DT-04 (BLOCKING), DT-05 (BLOCKING) | M (~1.5h) | S33-CAL-01 |
| S33-CAL-03 | UI Calendario (semanal + mensal + drag HTML5 + sidebar) + testes | DT-09 | M+ (~2h) | S33-CAL-02 |
| S33-GATE-01 | **Gate Check 1** | — | XS (~15min) | S33-CAL-03 |

### Fase 2: Content Generation Pipeline (P0 — ~5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S33-GEN-01 | Generation Engine + Brand Voice injection | DT-06 | L (~2.5h) | S33-GATE-01 |
| S33-GEN-02 | 4 prompts especializados + Zod schemas | DT-06, DT-07 | M (~1.5h) | S33-GEN-01 |
| S33-GEN-03 | API `/api/content/generate` + integracao calendario + testes | — | S+ (~1h) | S33-GEN-02 |
| S33-GATE-02 | **Gate Check 2** | — | XS (~15min) | S33-GEN-03 |

### Fase 3: Approval Workflow + BrandVoice 2.0 (P1 — ~5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S33-APR-01 | Approval Engine (state machine + history log) | DT-08 (BLOCKING) | M (~1.5h) | S33-GATE-02 |
| S33-APR-02 | API `/api/content/calendar/approve` + testes | — | S (~1h) | S33-APR-01 |
| S33-APR-03 | UI Review Dashboard + StatusBadge + sidebar | DT-09 | M (~1.5h) | S33-APR-02 |
| S33-BV-01 | (STRETCH) engagementScore + peso no generation engine | — | S (~1h) | S33-APR-03 |
| S33-GATE-03 | **Gate Check 3** | — | XS (~15min) | S33-APR-03 (ou BV-01 se executado) |

### Fase 4: Governanca Final (~0.5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S33-GOV-05 | Contract-map update — lane content_autopilot | DT-10 | XS (~15min) | S33-GATE-03 |
| S33-GOV-06 | ACTIVE_SPRINT.md + ROADMAP.md | — | XS (~15min) | S33-GOV-05 |

---

## Resumo de Esforco

| Fase | Stories | Esforco Total |
|:-----|:--------|:-------------|
| Fase 0 (Governanca S32) | 4 + gate | ~1.5h |
| Fase 1 (Calendario Editorial) | 3 + gate | ~5h + 15min |
| Fase 2 (Content Generation) | 3 + gate | ~5h + 15min |
| Fase 3 (Approval + BV 2.0) | 3 + gate + STRETCH | ~4h + 15min (+1h STRETCH) |
| Fase 4 (Governanca Final) | 2 | ~30min |
| **Total Core** | **15 stories + 4 gates** | **~16.5h** |
| **Total com STRETCH** | **16 stories + 4 gates** | **~17.5h** |

---

## Blocking DTs (Pre-flight — Darllyson DEVE compreender antes de comecar)

- [ ] **DT-04 (BLOCKING)**: Range query DEVE usar `where()` em campo unico (`scheduledDate`) + in-memory sort. ZERO `orderBy` combinado com `where` em campo diferente. ZERO composite index.
- [ ] **DT-05 (BLOCKING)**: Reorder DEVE usar `writeBatch()` para atomicidade. ZERO updates sequenciais (`updateDoc` em loop). Mock de `writeBatch` adicionado no `jest.setup.js`.
- [ ] **DT-08 (BLOCKING)**: State machine DEVE usar adjacency map (`VALID_TRANSITIONS`). ZERO transicao sem validacao. ZERO skip de estado. `published` e terminal (zero transicao de saida).

---

## Gate Checks (4 obrigatorios)

| Gate | Pre-requisito | Criterio |
|:-----|:-------------|:---------|
| S33-GATE-00 | Fase 0 completa | tsc=0, testes passam, zero timer warnings, zod oficializada, social_interactions type criado |
| S33-GATE-01 | Fase 1 completa | CRUD funcional, UI renderiza semana/mes, drag reorder atualiza order+scheduledDate, tsc=0, testes passam |
| S33-GATE-02 | Fase 2 completa | 4 formatos geram output JSON valido via Gemini, Brand Voice injetado, API funcional, tsc=0, testes passam |
| S33-GATE-03 | Fase 3 completa | State machine funcional (6 estados, transicoes validas/invalidas), UI review approve/reject funciona, tsc=0, testes passam |

---

## Success Criteria (CS-33.01 a CS-33.15)

| ID | Criterio | Verificacao |
|:---|:---------|:-----------|
| CS-33.01 | Calendario Editorial CRUD funcional via API | Teste: POST cria item, GET retorna por range, PUT atualiza, DELETE remove |
| CS-33.02 | UI calendario renderiza items por semana e mes | Visual: cards aparecem nos dias corretos nas duas views |
| CS-33.03 | Reorder funcional via drag HTML5 nativo | Manual: arrastar item entre dias atualiza `scheduledDate` e `order` |
| CS-33.04 | Content Generation produz output para 4 formatos | Teste: `generateContent()` retorna JSON valido para post, story, carousel, reel |
| CS-33.05 | Geracao respeita Brand Voice (getBrand + BrandKit injetado no prompt) | Code review: prompt inclui nome da marca, tom, guidelines |
| CS-33.06 | API `/api/content/generate` retorna content + metadata | Teste: POST retorna `{ content, metadata, suggestions }` |
| CS-33.07 | State machine de approval funcional (6 estados) | Teste: transicoes validas passam, transicoes invalidas retornam erro |
| CS-33.08 | UI de review permite approve/reject com comentario | Visual: botoes funcionais + modal de comentario no reject |
| CS-33.09 | (STRETCH) engagementScore computado no social_interactions | Code review: campo existe e e populado quando disponivel |
| CS-33.10 | `social_interactions` collection criada com type `SocialInteractionRecord` | Code review + type check |
| CS-33.11 | Timer leak resolvido (zero warnings em `npm test`) | Test runner: output sem `worker has failed to exit gracefully` |
| CS-33.12 | zod oficializada na documentacao (README) | Grep: README menciona zod como dependencia oficial |
| CS-33.13 | Contract-map atualizado com lane `content_autopilot` | Code review: `contract-map.yaml` tem nova lane |
| CS-33.14 | Todas rotas novas com `force-dynamic` + `requireBrandAccess` + `createApiError`/`createApiSuccess` | Grep: confirma padroes em todas as rotas `/api/content/*` |
| CS-33.15 | Isolamento multi-tenant em todas as queries (brandId obrigatorio) | Code review: zero query sem brandId |

---

## Proibicoes (P-01 a P-08 herdadas + PA-01 a PA-06 novas)

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

### Novas S33 (PRD + Athos)

| ID | Proibicao |
|:---|:----------|
| PA-01 | ZERO publicacao real em plataformas externas — scheduling e apenas dados |
| PA-02 | ZERO OAuth flow novo — usar MonaraTokenVault existente |
| PA-03 | ZERO drag-and-drop library nova — HTML5 nativo exclusivamente |
| PA-04 | ZERO `orderBy` combinado com `where` em campo diferente (usar in-memory sort — DT-04) |
| PA-05 | ZERO updates sequenciais para reorder — DEVE usar `writeBatch()` (DT-05) |
| PA-06 | ZERO transicao de status sem validacao via adjacency map (DT-08) |

---

*Story Pack preparado por Leticia (SM) | Sprint 33 | 08/02/2026*
*16 stories (15 core + 1 STRETCH) + 4 Gates | Estimativa: 16.5h (sem STRETCH) / 17.5h (com STRETCH)*
