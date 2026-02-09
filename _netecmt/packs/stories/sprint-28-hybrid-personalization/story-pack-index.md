# Story Pack: Sprint 28 — Hybrid Full (Cleanup & Foundations + Personalization Advance)
**ID:** S28-00
**Lane:** cross-cutting (personalization_engine + intelligence_wing + ai_retrieval + performance_war_room + core)
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)

## PRD & Architecture Review
- **PRD:** `_netecmt/solutioning/prd/prd-sprint-28-hybrid-cleanup-personalization.md` — Iuran (PM)
- **Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-28.md` — Athos (Architect)
- **Arch Status:** ✅ APROVADO com 10 DTs (3 Blocking)
- **Deliberação:** `_netecmt/solutioning/prd/roadmap-sprint-28-deliberation.md` — Opção D (Hybrid Full)

## Predecessora
- Sprint 27 (Hybrid: Backlog Cleanup + Attribution Revival) — ✅ CONCLUÍDA (QA 97/100)
- Baseline: `tsc --noEmit` = 0, `npm run build` = sucesso (99 rotas), 1 dead test restante

## Success Criteria (Sprint Level)

| # | Critério | Validação | Responsável |
|:--|:---------|:----------|:-----------|
| CS-01 | `npm test` — **0 testes falhando** | Dandara executa test suite completa | QA |
| CS-02 | `npx tsc --noEmit` = **0 erros** | Build limpo mantido | QA |
| CS-03 | `npm run build` (Next.js) sucesso | 99+ rotas compiladas sem erro | QA |
| CS-04 | `contract-map.yaml` `personalization_engine` aponta para paths corretos (engine-only, sem overlap) | Diff visual — Opção A do DT-01 | QA |
| CS-05 | Adapter layer aggregator funcional | Schema `PerformanceMetricDoc` ↔ `PerformanceMetric` mapeado | QA |
| CS-06 | Attribution files registrados em lanes | `contract-map.yaml` inclui attribution paths | QA |
| CS-07 | Feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION` removida | `grep` retorna 0 ocorrências no codebase | QA |
| CS-08 | RAG stubs implementados | `keywordMatchScore`, `generateLocalEmbedding`, `hashString` retornam valores reais (não 0) | QA |
| CS-09 | Deep-Scan executa e retorna persona + propensity | `POST /api/intelligence/audience/scan` retorna JSON válido com persona e score | QA |
| CS-10 | Testes de contrato Gemini existem e passam | Test suite valida schema Zod, fallback e PII sanitization | QA |
| CS-11 | Propensity segmenta hot/warm/cold corretamente | Testes unitários com edge cases passando | QA |
| CS-12 | UI Personalization renderiza com dados | `/intelligence/personalization` mostra scan results, persona detail, propensity badge | QA |
| CS-13 | Zero regressão funcional | Rotas P0 acessíveis, attribution dashboard intacto | QA |

## Duas Fases com QA Checkpoint

### Fase 1: Cleanup & Foundations (~4.5-5.5h)
- **Epic 1**: Cleanup & Foundations [P1-P3] — S28-CL-01 a CL-06
- Blocking gates: S28-CL-02 (contract-map), S28-CL-03 (adapter layer)
- Governance: S28-CL-04 (lanes), S28-CL-05 (feature flag)
- Fundações: S28-CL-06 (RAG stubs — DT-05, DT-06, DT-10)

### ── GATE CHECK OBRIGATÓRIO (~25min) ──
- [ ] S28-CL-02 concluído — `contract-map.yaml` personalization_engine com paths corretos (Opção A do DT-01)
- [ ] S28-CL-03 concluído — adapter layer `adaptToPerformanceMetricDoc()` criado e testado
- [ ] `npx tsc --noEmit` = 0 erros
- [ ] `npm run build` sucesso
- [ ] Diff review de CL-02 e CL-03

### Fase 2: Personalization Advance (~11.5-16.5h)
- **Epic 2**: Personalization Advance [P0-P2] — S28-PS-01 a PS-06
- **Pre-flight obrigatório**: Blocking DTs checklist (DT-02, DT-03, DT-07)
- Sequência Athos: DT-02 primeiro → PS-01 → PS-02 (Zod) → PS-03 → PS-04 → PS-05 → PS-06 (stretch)

> **Nota:** S28-CL-04, CL-05 e CL-06 podem ser executados em paralelo após o Gate Check, pois são independentes entre si.

## Blocking DTs Checklist — Pre-flight Fase 2 (Seção 9 do Arch Review)

> A SM NÃO autoriza início da Fase 2 sem confirmação dos 3 DTs blocking:

- [ ] **DT-02 (P0 BLOCKING)**: Darllyson entende que precisa estender `generateWithGemini` em `gemini.ts` para suportar `systemPrompt` → `system_instruction` no body do Gemini API. DEVE ser o PRIMEIRO item da Fase 2.
- [ ] **DT-03 (P0 BLOCKING)**: Story S28-PS-02 inclui criação do Zod schema `AudienceScanResponseSchema` em `lib/intelligence/personalization/schemas/audience-scan-schema.ts` como primeiro deliverable.
- [ ] **DT-07 (P0 BLOCKING condicional)**: Darllyson investiga se `personalizationMiddleware` está registrado no Next.js `middleware.ts`. Se sim: adicionar auth guard (P0). Se não: dead code, documentar e adiar para S29.

## Ordem de Execução (Darllyson)

```
[FASE 1 — Cleanup & Foundations]
  S28-CL-01 (dead test, XS, ~15min)
    → S28-CL-02 (contract-map GATE, S, ~30min) [DT-01: Opção A]
      → S28-CL-03 (adapter GATE, M, ~2h) [DT-04: pure function]
  
  ── GATE CHECK ── (tsc + build + review de CL-02/CL-03, ~25min) ──

  S28-CL-04 (lanes, XS, ~15min) ║ S28-CL-05 (feature flag, S, ~1h) ║ S28-CL-06 (RAG, M, ~1.5h)
                                 ║       (parallelizável)             ║ [DT-05/06/10]

[FASE 2 — Personalization Advance]
  ★ PRE-FLIGHT: Confirmar DT-02, DT-03, DT-07 compreendidos
  ★ PRIMEIRO: Estender generateWithGemini com systemPrompt (DT-02)
  
  S28-PS-01 (API scan + DT-02 + DT-07 + DT-09, L+, ~5h)
    → S28-PS-02 (testes contrato + Zod, M, ~2.5h) [DT-03]
      → S28-PS-03 (propensity, M, ~2h)
        → S28-PS-04 (UI dashboard, L, ~3h)
          → S28-PS-05 (componentes, M, ~2h)
            → S28-PS-06 (rules, M, ~2h — STRETCH)

[QA FINAL — Dandara]
  CS-01 a CS-13 + validar DTs blocking resolvidos
```

## Estimativa Revisada (Arch Review — Athos)

| Fase | Stories | Estimativa | Sem Stretch | Delta vs PRD |
|:-----|:--------|:----------|:------------|:-------------|
| **FASE 1** | | | | |
| Epic 1: Cleanup & Foundations | S28-CL-01 a CL-06 | 4.5-5.5h | 4.5-5.5h | -30min |
| **— GATE CHECK —** | — | ~25min | ~25min | — |
| **FASE 2** | | | | |
| Epic 2: Personalization Advance | S28-PS-01 a PS-06 | 11.5-16.5h | 9.5-14.5h | +1.5h |
| **QA Final** | — | 1-2h | 1-2h | — |
| **Total** | **12 stories** | **~17-24h** | **~15.5-22h** | **+2h** |

**Razão do delta +2h:** DT-02 (estender gemini.ts com system_instruction, +1h) e DT-03 (Zod schema formal + testes de fallback, +30min) são obrigatórios para qualidade. hashString parcialmente implementado compensa -30min.

## Decision Topics Incorporados (10 DTs do Arch Review)

| DT | Título | Severidade | Blocking? | Story Incorporada | Ação |
|:---|:-------|:-----------|:----------|:-------------------|:-----|
| DT-01 | Lane Overlap contract-map | P1 | Não | S28-CL-02 | Opção A: engine-only path, API fica em `intelligence_wing` |
| **DT-02** | **SystemPrompt ignorado** | **P0** | **SIM** | S28-PS-01 | Estender `generateWithGemini` com `systemPrompt` → `system_instruction` |
| **DT-03** | **Sem validação Zod** | **P0** | **SIM** | S28-PS-01/PS-02 | `AudienceScanResponseSchema` + `safeParse` + fallback |
| DT-04 | Adapter schema mismatch | P1 | Não | S28-CL-03 | Pure function em `adapters/metric-adapter.ts` |
| DT-05 | hashString upgrade | P3 | Não | S28-CL-06 | djb2 com padding (já funciona, apenas upgrade) |
| DT-06 | generateLocalEmbedding | P2 | Não | S28-CL-06 | Hash-based 768d via `crypto.subtle` (async). Documentar: zero capacidade semântica |
| **DT-07** | **Middleware sem auth** | **P0** | **SIM (condicional)** | S28-PS-01 | Investigar registro no Next.js middleware.ts. Se registrado: P0 fix. Se não: dead code |
| DT-08 | `as any` no engine.ts | P2 | Não | S28-PS-01 | Remover após DT-02 |
| DT-09 | Retry logic | P1 | Não | S28-PS-01 | Exponential backoff 1s→2s→4s, max 3 retries no engine.ts (NÃO no gemini.ts) |
| DT-10 | keywordMatchScore | P2 | Não | S28-CL-06 | Jaccard Similarity com Set de tokens |

## Correções de Premissa do PRD (Arch Review)

| # | Premissa do PRD | Realidade | Impacto |
|:--|:----------------|:----------|:--------|
| CP-01 | "3 stubs retornando 0" | `hashString` já tem implementação funcional | -15min no CL-06 |
| CP-02 | Engine usa systemPrompt corretamente | systemPrompt é IGNORADO pelo generateWithGemini | +1h no PS-01 |
| CP-03 | Multi-tenant OK para Personalization | Middleware tem gap de auth | +30min investigação |
| CP-04 | Contract-map fix é "XS" | Requer análise de overlap + decisão lane ownership | +15min de design |

## Ressalvas do Conselho (R1-R3)

| # | Ressalva | Incorporação no Story Pack |
|:--|:---------|:--------------------------|
| R1 | F2 e F5 são BLOCKING GATES — Fase 2 não inicia sem eles | Gate Check entre Epic 1 e Epic 2 |
| R2 | Testes contrato Gemini obrigatórios | S28-PS-02 obrigatoriamente antes de S28-PS-04 |
| R3 | PRD precisa Arch Review antes de stories | ✅ Arch Review APROVADO — 06/02/2026 |

---
*Story Pack preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 28: Hybrid Full — Cleanup & Foundations + Personalization Advance | 06/02/2026*
*12 stories | 10 DTs incorporados | 3 Blocking | Estimativa: 15.5-24h*
