# Story Pack: Sprint 26 — Technical Debt Cleanup
**ID:** S26-00
**Lane:** cross-cutting (todas as lanes afetadas)
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)
- [Error Inventory](error-inventory.md)
- [QA Report](qa-report.md) — **97/100** ✅

## Success Criteria
- `npx tsc --noEmit` retorna **0 erros** (atualmente: 161 erros em 73 arquivos)
- Nenhum módulo novo quebrado como efeito colateral
- Zero regressão funcional nas features existentes
- Código morto removido ou stubbed com `// TODO: Sprint XX`

## Priorização (Tiers do Athos)

| Tier | Severidade | Erros | Esforço | Critério |
|------|-----------|-------|---------|----------|
| 1 | P0 — Runtime Blockers | ~15 | 1-2h | Crash em produção se rota for chamada |
| 2 | P1 — Dead Code / Tests | ~100 | 4-6h | Não afeta runtime, polui codebase |
| 3 | P2 — Cosmetic / Typing | ~46 | 2-3h | Warnings ignorados pelo Next.js |

## Ordem de Execução
1. Tier 1 (S26-ST-01 a ST-03) — **Fazer primeiro**
2. Tier 2 (S26-ST-04 a ST-07) — **Bulk cleanup**
3. Tier 3 (S26-ST-08 a ST-11) — **Polish**
4. QA final — `tsc --noEmit` = 0

## 📋 Backlog Consolidado para Sprint 27+

> Items identificados durante o Architecture Review e QA da Sprint 26.

| ID | Item | Origem | Prioridade |
|:---|:-----|:-------|:-----------|
| BKL-01 | **Corrigir 14 testes pré-existentes que falham** — mascaram possíveis regressões futuras (6 env vars ausentes, 5 mocks desatualizados, 2 stubs TODO, 1 Playwright/Jest incompatibilidade) | QA Report S26 — Seção 5.1 | P1 |
| BKL-02 | **Configurar Jest para excluir `tests/smoke/*.spec.ts`** — Playwright e Jest colidem no mesmo runner | QA Report S26 — Seção 5.1 | P2 |
| BKL-03 | **Corrigir discrepância no `contract-map.yaml`**: `personalization_engine` aponta para `operations/personalization/**` mas código real está em `intelligence/personalization/**` | Arch Review S26 — Seção 2.3 | P2 |
| BKL-04 | **Implementar 9 stubs TODO** quando módulos forem ativados (assets, rag, embeddings, etc.) | QA Report S26 — CS-04 | P3 |
| BKL-05 | **Resolver `@ts-ignore` nos 5 MCP adapters** (bright-data, glimpse, firecrawl, exa, browser) | QA Report S26 — CS-03 | P3 |
