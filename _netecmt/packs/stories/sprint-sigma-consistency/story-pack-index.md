# Story Pack: Sprint Sigma — Sub-Sprint de Consistencia do Codebase
**ID:** SIG-00
**Lane:** cross-cutting (security + types + api_consistency + architecture + core)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)

## PRD & Architecture Review
- **PRD:** `_netecmt/solutioning/prd/prd-sprint-sigma-consistency.md` — Iuran (PM)
- **Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-sigma.md` — Athos (Architect)
- **Arch Status:** APROVADO COM RESSALVAS (14 DTs, 4 Blocking)
- **Auditoria:** `_netecmt/solutioning/audit-codebase-consistency-2026-02-07.md`
- **Deliberacao:** Aprovada por UNANIMIDADE pelo Alto Conselho — todas 5 DCs e 14 DTs aceitos

## Predecessora
- Sprint 28 (Hybrid Full: Cleanup & Foundations + Personalization Advance) — CONCLUIDA (QA 98/100)
- Baseline: `tsc --noEmit` = 0, `npm run build` = sucesso (103 rotas), 218/218 testes passando

## Squad
| Papel | Agente | Responsabilidade |
|:------|:-------|:-----------------|
| PM | Iuran | PRD, escopo, proibicoes |
| Architect | Athos | 14 DTs, sequencia, adapters, interfaces |
| SM | Leticia | Story Pack, gates, allowed context |
| Dev | Darllyson | Implementacao guiada por stories |
| QA | Dandara | SC-01 a SC-10, RC-01 a RC-13 |

---

## Success Criteria (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| **SC-01** | **Zero rotas API sem autenticacao** — 0/12 vulneraveis | `rg "requireBrandAccess" app/src/app/api/` = 10+ | Dandara |
| **SC-02** | **Zero tipos duplicados conflitantes** — 1 source of truth por entidade | Cada entidade (Message, Conversation, Funnel, AutopsyReport, SocialPlatform) tem 1 definicao canonica | Dandara |
| **SC-03** | **Hydration guards em stores persistidos** — 2/2 | `skipHydration: true` em brand-store e context-store | Dandara |
| **SC-04** | **force-dynamic em rotas dinamicas** — 7/7 | `rg "force-dynamic"` nas 7 rotas | Dandara |
| **SC-05** | **Credit tracking em rotas Gemini** — 10/10 | Deducao de credito verificada em cada rota | Dandara |
| **SC-06** | **Pinecone client unico** — pinecone.ts mantido, pinecone-client.ts deletado | `ls app/src/lib/ai/pinecone-client.ts` retorna "nao encontrado" | Dandara |
| **SC-07** | **Formato de erro API unificado** — `createApiError`/`createApiSuccess` | Nenhuma rota retorna formatos A-E legados | Dandara |
| **SC-08** | **Chat state — source of truth unica** — `useConversations` | `chat-store.ts` nao contem `currentConversation` nem `messages[]` | Dandara |
| **SC-09** | **chat-input-area.tsx <= 150 linhas**, 4+ hooks extraidos | `wc -l chat-input-area.tsx` <= 150 | Dandara |
| **SC-10** | **tsc=0, build sucesso, >= 218 testes pass, zero regressao** | `npx tsc --noEmit` = 0, `npm run build` sucesso, `npm test` >= 218 | Dandara |
| **RC-13** | **Testes unitarios para normalizePlatform() e normalizeAwareness()** | Testes existem e passam | Dandara |

---

## Estrutura: 4 Fases + 2 Gates + 2 Bonus (STRETCH)

### Fase 1: Seguranca (P0-A) — ~5-5.5h — GATE 1
- **2 Pre-works** (obrigatorios antes de SIG-SEC-01): SIG-PRE-SEC, SIG-PRE-CONV
- **3 Stories**: SIG-SEC-01, SIG-SEC-02, SIG-SEC-03
- **1 Gate**: SIG-GATE-01

### -- GATE CHECK 1 -- (tsc + build + tests + review SEC-01) --

### Fase 2: Consistencia de Tipos (P0-B) — ~7-8h — GATE 2
- **1 Pre-work** (obrigatorio antes das consolidacoes): SIG-PRE-TYP
- **7 Stories**: SIG-TYP-05, SIG-TYP-06, SIG-TYP-07, SIG-TYP-01, SIG-TYP-02, SIG-TYP-03, SIG-TYP-04
- **1 Gate**: SIG-GATE-02

### -- GATE CHECK 2 -- (tsc + build + tests + review TYP-01 a 07) --

### Fase 3: API Consistency (P1) — ~6h
- **3 Stories**: SIG-API-01, SIG-API-02, SIG-API-03

### Fase 4: Architecture (P1) — ~7.5h
- **3 Stories**: SIG-ARC-01, SIG-ARC-02, SIG-ARC-03

### Bonus STRETCH
- **2 Stories**: SIG-BNS-01, SIG-BNS-02

---

## Blocking DTs Checklist — Pre-flight (Secao 9 do Arch Review)

> A SM NAO autoriza inicio da implementacao sem confirmacao dos 4 DTs blocking:

- [ ] **DT-01 (P0 BLOCKING)**: Darllyson entende que auth tem 3 categorias — 10 rotas brand-access + 1 requireConversationAccess (chat) + 1 webhook-signature (ja implementada, apenas documentar). NAO aplicar requireBrandAccess uniformemente nas 12.
- [ ] **DT-02 (P0 BLOCKING)**: Darllyson entende que rotas social/* nao recebem brandId no body. ANTES de adicionar auth, mapear callers frontend e adicionar brandId como campo obrigatorio no body.
- [ ] **DT-05 (P0 BLOCKING)**: Darllyson entende que consolidacao de tipos PRECISA de type aliases em index.ts (re-exports + LegacyConversation) para proteger chat-store durante Fase 2. Sem aliases, chat-store quebra.
- [ ] **DT-11 (P0 BLOCKING)**: Darllyson entende que Pinecone — INVERTER decisao do PRD. MANTER pinecone.ts (6 consumers), absorver buildPineconeRecord de pinecone-client.ts, DELETAR pinecone-client.ts (0 consumers).

---

## Ordem de Execucao (Darllyson)

```
[FASE 1 — Seguranca (P0-A)]
  SIG-PRE-SEC (mapear callers frontend, S, ~1h)
    → SIG-PRE-CONV (criar requireConversationAccess, S, ~30min) [DT-01]
      → SIG-SEC-01 (auth 10 brand-access + 1 conversation + doc webhook, L, ~3h)
        → SIG-SEC-02 (force-dynamic 7 rotas, XS, ~15min) [DT-04]
          → SIG-SEC-03 (hydration guards, XS, ~30min) [DT-03]

  ── SIG-GATE-01 ── (tsc + build + tests + review, S, ~30min) ──

[FASE 2 — Tipos (P0-B)]
  SIG-PRE-TYP (criar social-platform.ts + awareness-adapter.ts, S, ~45min) [DT-07, DT-08]
    → SIG-TYP-05 (SocialPlatform consolidacao, S, ~45min)
      → SIG-TYP-06 (Date→Timestamp, S, ~30min)
        → SIG-TYP-07 (Awareness → Schwartz, S, ~45min)
    → SIG-TYP-01 (Message + alias, M, ~1.5h) [DT-05]
      → SIG-TYP-02 (Conversation + LegacyConversation, M, ~1.5h) [DT-05]
        → SIG-TYP-03 (Funnel, M, ~1.5h)
          → SIG-TYP-04 (AutopsyReport + adapter, M, ~1.5h) [DT-06]

  ── SIG-GATE-02 ── (tsc + build + tests + review, S, ~30min) ──

[FASE 3 — API Consistency (P1)]
  SIG-API-01 (criar api-response.ts, S, ~30min) [DT-09]
    → SIG-API-02 (migrar 30+ rotas, L, ~3.5h) [DT-10]
      → SIG-API-03 (credit tracking 10 rotas, M, ~2h)
        + SIG-BNS-02 (estimateTokens, XS, ~15min — STRETCH)

[FASE 4 — Architecture (P1)]
  SIG-ARC-01 (Pinecone — manter .ts, deletar -client.ts, S, ~1h) [DT-11]
    + SIG-BNS-01 (deletar vertex.ts, XS, ~10min — STRETCH)
  SIG-ARC-02 (Chat state → useConversations, L, ~3h) [DT-12, DT-14]
    → SIG-ARC-03 (chat-input-area → 4 hooks, L, ~3.5h) [DT-13]

[QA FINAL]
  Dandara valida SC-01 a SC-10 + RC-01 a RC-13
```

**Notas sobre paralelismo (Seção 8 do Arch Review):**
- SIG-TYP-05/06/07 sao independentes entre si (podem paralelizar) — executar ANTES de TYP-01/02/03/04
- SIG-ARC-01 e SIG-ARC-02 sao independentes (podem paralelizar)
- SIG-API-03 e SIG-BNS-02 se beneficiam de execucao conjunta

---

## Estimativa Revisada (Arch Review — Athos, aceita pelo Conselho)

| Fase | Stories | Estimativa | Gate? | Delta vs PRD |
|:-----|:--------|:----------|:------|:-------------|
| **FASE 1** | | | | |
| Pre-works Seguranca | SIG-PRE-SEC, SIG-PRE-CONV | ~1.5h | — | +1.5h (DT-01, DT-02) |
| Stories Seguranca | SIG-SEC-01 a SEC-03 | ~3.75h | — | = |
| **— SIG-GATE-01 —** | — | ~30min | **SIM** | — |
| **Subtotal F1** | **5 + 1 gate** | **~5-5.5h** | | **+1.5h** |
| **FASE 2** | | | | |
| Pre-work Tipos | SIG-PRE-TYP | ~45min | — | +45min (DT-07, DT-08) |
| Stories Tipos | SIG-TYP-05 a TYP-04 | ~7-8h | — | +1.25h |
| **— SIG-GATE-02 —** | — | ~30min | **SIM** | — |
| **Subtotal F2** | **8 + 1 gate** | **~7-8h** | | **+2h** |
| **FASE 3** | | | | |
| Stories API | SIG-API-01 a API-03 | ~6h | Nao | +0.5h |
| **Subtotal F3** | **3** | **~6h** | | **+0.5h** |
| **FASE 4** | | | | |
| Stories Architecture | SIG-ARC-01 a ARC-03 | ~7.5h | Nao | -0.5h |
| **Subtotal F4** | **3** | **~7.5h** | | **-0.5h** |
| **Bonus** | SIG-BNS-01, BNS-02 | ~25min | Nao | = |
| **QA Final** | — | ~1-2h | — | — |
| **TOTAL** | **22 stories** | **~27-33h** | **2 gates** | **+3.5h vs PRD** |

**Razao do delta +3.5h:** DT-01/DT-02 (+1.5h: 3 categorias de auth + brandId ausente), DT-05/06/07/08 (+1.5h: adapters obrigatorios), DT-10/13 (+0.5h: chat format + componente 428 linhas), DT-11 (-1h: inverter Pinecone simplifica).

---

## Decision Topics Incorporados (14 DTs do Arch Review)

| DT | Titulo | Severidade | Blocking? | Story Incorporada | Acao |
|:---|:-------|:-----------|:----------|:-------------------|:-----|
| **DT-01** | **Auth 3 categorias** | **P0** | **SIM** | SIG-PRE-CONV, SIG-SEC-01 | 10 brand-access + 1 conversation-access + 1 signature (doc) |
| **DT-02** | **Rotas social/* sem brandId** | **P0** | **SIM** | SIG-PRE-SEC, SIG-SEC-01 | Mapear callers + adicionar brandId no body |
| DT-03 | Hydration: skipHydration | P1 | Nao | SIG-SEC-03 | `skipHydration: true` + `rehydrate()` |
| DT-04 | force-dynamic: verificar antes | P2 | Nao | SIG-SEC-02 | Confirmar ausencia antes de adicionar |
| **DT-05** | **Type aliases obrigatorios** | **P0** | **SIM** | SIG-TYP-01, SIG-TYP-02 | Re-exports em index.ts + LegacyConversation |
| DT-06 | AutopsyReport adapter | P1 | Nao | SIG-TYP-04 | LegacyAutopsyReport + adaptLegacyAutopsyReport() |
| DT-07 | SocialPlatform adapter | P1 | Nao | SIG-PRE-TYP, SIG-TYP-05 | normalizePlatform() + NAO alterar Firestore |
| DT-08 | Awareness adapter | P1 | Nao | SIG-PRE-TYP, SIG-TYP-07 | normalizeAwareness() + NAO alterar Firestore |
| DT-09 | Schema api-response | P1 | Nao | SIG-API-01 | Schema definido no Arch Review |
| DT-10 | Chat route formato especial | P1 | Nao | SIG-API-02 | Encapsular em createApiSuccess |
| **DT-11** | **Pinecone INVERTER** | **P0** | **SIM** | SIG-ARC-01 | Manter pinecone.ts, deletar pinecone-client.ts |
| DT-12 | Chat-store depende index.ts | P1 | Nao | SIG-ARC-02 | Resolvido pela sequencia F2→F4 |
| DT-13 | chat-input-area interfaces | P1 | Nao | SIG-ARC-03 | 4 hooks com interfaces definidas |
| DT-14 | Chat state zero perda | P1 | Nao | SIG-ARC-02 | Firestore ja e source of truth |

---

## Correcoes de Premissa do PRD (Arch Review)

| # | Premissa do PRD | Realidade | Impacto |
|:--|:----------------|:----------|:--------|
| CP-01 | "requireBrandAccess em 12 rotas" | 10 brand-access + 1 conversation-access + 1 ja protegida | +1h (criar requireConversationAccess) |
| CP-02 | "Eliminar pinecone.ts, manter pinecone-client.ts" | pinecone.ts tem 6 consumers, pinecone-client.ts tem 0 | 0h (inverter e MAIS simples) |
| CP-03 | "chat-input-area.tsx 391 linhas" | 428 linhas reais | +15min de escopo |
| CP-04 | "Rotas social/* so precisam de requireBrandAccess" | Nao recebem brandId no body | +1h (alterar body + frontend callers) |
| CP-05 | "database.ts source of truth — re-export" | chat-store cria Conversation com messages[] embarcado | +30min (alias LegacyConversation) |
| CP-06 | "SocialPlatform consolidar em lowercase" | vault.ts + 3 consumers usam PascalCase + dados Firestore | +30min (adapter normalizePlatform) |

---

## Proibicoes (PRD P1-P12 + Arch Review PA-01 a PA-06)

### PRD (Iuran) — P1 a P12

| # | Proibicao |
|:--|:----------|
| P1 | NUNCA alterar logica de negocio dos modulos ativados em S25-S28 |
| P2 | NUNCA remover exports existentes de types/*.ts |
| P3 | NUNCA alterar interfaces Sprint 25 (prediction.ts, creative-ads.ts, text-analysis.ts) |
| P4 | NUNCA usar firebase-admin ou google-cloud/* |
| P5 | NUNCA usar `any` em novos tipos |
| P6 | NUNCA hardcodar brandId |
| P7 | NUNCA iniciar Fase 2 sem Gate Check 1 aprovado |
| P8 | NUNCA iniciar Fase 3 sem Gate Check 2 aprovado |
| P9 | NUNCA adicionar features novas |
| P10 | NUNCA alterar API publica (URL, metodo HTTP, params obrigatorios) |
| P11 | NUNCA remover stubs/TODOs de S29+ |
| P12 | NUNCA modificar testes existentes passando (exceto adaptar imports de tipos consolidados) |

### Arch Review (Athos) — PA-01 a PA-06

| # | Proibicao |
|:--|:----------|
| PA-01 | NUNCA alterar dados no Firestore durante consolidacao de tipos |
| PA-02 | NUNCA deletar pinecone.ts (manter e absorver funcoes de pinecone-client.ts) |
| PA-03 | NUNCA aplicar requireBrandAccess em webhooks/dispatcher |
| PA-04 | NUNCA remover campo `error` das respostas de erro |
| PA-05 | NUNCA remover re-exports de index.ts durante Fase 2 |
| PA-06 | NUNCA remover LegacyConversation alias antes da conclusao de SIG-ARC-02 (Fase 4) |

---

## Ressalvas do Conselho (R1-R5)

| # | Ressalva | Incorporacao no Story Pack |
|:--|:---------|:--------------------------|
| R1 | Gate Check 1 (Seguranca) e BLOQUEANTE | SIG-GATE-01 entre Fase 1 e Fase 2 |
| R2 | Gate Check 2 (Tipos) e BLOQUEANTE | SIG-GATE-02 entre Fase 2 e Fase 3 |
| R3 | Zero funcionalidade nova | Escopo travado — review final confirma 0 features |
| R4 | Retrocompatibilidade total | Nenhuma API publica muda (URL, metodo, params) |
| R5 | PRD precisa de Arch Review antes de stories | Arch Review APROVADO COM RESSALVAS — 07/02/2026 |

---

## Milestones

| Milestone | Validacao | Stories Concluidas |
|:----------|:----------|:-------------------|
| **M1: Security Hardened** | Gate Check 1 aprovado | SIG-PRE-SEC, SIG-PRE-CONV, SIG-SEC-01/02/03, SIG-GATE-01 |
| **M2: Types Consolidated** | Gate Check 2 aprovado | SIG-PRE-TYP, SIG-TYP-05/06/07/01/02/03/04, SIG-GATE-02 |
| **M3: API Unified** | 30+ rotas migradas + credit tracking | SIG-API-01/02/03 |
| **M4: Architecture Clean** | Pinecone + Chat + chat-input-area | SIG-ARC-01/02/03 |
| **M5: Sprint Complete** | SC-01 a SC-10 + RC-01 a RC-13 | QA Final (Dandara) |

---
*Story Pack preparado por Leticia (SM) — NETECMT v2.0*
*Sprint Sigma: Sub-Sprint de Consistencia do Codebase | 07/02/2026*
*22 stories | 14 DTs incorporados | 4 Blocking | 2 Gates | Estimativa: 27-33h*
*Baseline: 218/218 testes, tsc=0, build=103 rotas, QA=98/100*
