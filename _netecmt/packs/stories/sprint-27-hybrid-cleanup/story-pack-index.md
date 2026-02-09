# Story Pack: Sprint 27 — Hybrid (Backlog Cleanup + Attribution Revival)
**ID:** S27-00
**Lane:** cross-cutting (intelligence_wing + test infra + contract hygiene)
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)

## PRD & Architecture Review
- **PRD:** `_netecmt/solutioning/prd/prd-sprint-27-hybrid-cleanup-attribution.md` — Iuran (PM)
- **Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-27.md` — Athos (Architect)
- **Arch Status:** ✅ APROVADO com 4 Ressalvas

## Predecessora
- Sprint 26 (Technical Debt Cleanup) — ✅ CONCLUÍDA (QA 97/100)
- Baseline: `tsc --noEmit` = 0, `npm run build` = sucesso

## Success Criteria (Sprint Level)

| # | Critério | Validação | Responsável |
|:--|:---------|:----------|:-----------|
| CS-01 | `npm test` — **≤ 2 testes falhando** (env-dependent aceitos) | Dandara executa e conta | QA |
| CS-02 | Jest NÃO executa specs Playwright | `npm test` não mostra `smoke/*.spec.ts` | QA |
| CS-03 | `contract-map.yaml` `personalization_engine` aponta para `intelligence/personalization/**` | Diff visual | QA |
| CS-04 | `@ts-ignore` count ≤ 3 (redução de 5 para ≤ 3) | `grep -r "@ts-ignore" --include="*.ts"` | QA |
| CS-05 | Attribution page renderiza com dados | Screenshot de `/intelligence/attribution` | QA |
| CS-06 | `CampaignAttributionStats` não é mais stub | `types/attribution.ts` sem `@stub` | QA |
| CS-07 | ≥ 1 consumer registrado para cada módulo attribution | `grep -r "import.*from.*attribution"` | QA |
| CS-08 | `npx tsc --noEmit` = 0 erros | Build limpo mantido | QA |
| CS-09 | `npm run build` (Next.js) sucesso | 96+ rotas compiladas | QA |
| CS-10 | Zero regressão funcional | Smoke tests passam | QA |

## Duas Frentes (Parallelizable)

### Frente 1: Backlog Cleanup (Stabilization) — 4-5h
- Epic 1: Test Infrastructure Fix [P1] — ST-01 a ST-04
- Epic 2: Contract & Type Hygiene [P2] — ST-05, ST-06

### Frente 2: Attribution Revival (Feature) — 3-5h
- Epic 3: Attribution Module Activation [P1] — ST-07 a ST-11
- Epic 4: Attribution Stubs Resolution [P2] — ST-12

> **Nota (Arch Review):** Frentes 1 e 2 podem ser executadas em paralelo — não há dependência entre elas.

## Ordem de Execução (Darllyson)

```
[Frente 1 — Backlog]
  ST-04 (Jest config)
    → ST-01 (env vars)
    → ST-02 (mocks)
    → ST-03 (stubs test)
    → ST-05 (contract-map)
    → ST-06 (ts-ignore)

[Frente 2 — Attribution]
  ST-07 (tipos — XS)
    → ST-08 (config — XS)
    → ST-12 (stubs attr — XS)
    → ST-09 (spend data — L, ATENÇÃO: hook direto, NÃO via aggregator)
    → ST-10 (wiring — bridge + overlap via budget-optimizer)
    → ST-11 (UI validation)

[QA Final — Dandara]
  CS-01 a CS-10
```

## Estimativa Revisada (Arch Review)

| Fase | Stories | PRD Estimativa | Estimativa Revisada | Delta |
|:-----|:--------|:--------------|:-------------------|:------|
| Epic 1: Test Infrastructure | ST-01 a ST-04 | 2-3h | 2-3h | = |
| Epic 2: Contract & Hygiene | ST-05, ST-06 | 1-2h | 1.5-2h | ≈ |
| Epic 3: Attribution Activation | ST-07 a ST-11 | 4-6h | **3-5h** | -1h |
| Epic 4: Attribution Stubs | ST-12 | 30min | **15min** | -15min |
| QA Final | — | 1h | 1h | = |
| **Total** | **12 stories** | **8.5-12.5h** | **7.5-11h** | **-1.5h** |

**Razão da redução:** engine.ts e overlap.ts já wired + CampaignAttributionStats já correto + config.ts já funcional (correções Arch Review).

## Correções do Arch Review Incorporadas

| # | Correção | Impacto |
|:--|:---------|:--------|
| 1 | `engine.ts` NÃO é dead code — já tem consumer (`use-attribution-data.ts`) | ST-10 reduzido: wiring para 2 módulos, não 4 |
| 2 | `overlap.ts` tem 1 consumer (`budget-optimizer.ts`) — cadeia não chega à UI | ST-10: expor budget-optimizer via API |
| 3 | `CampaignAttributionStats` já tem campos corretos — apenas remover @stub | ST-07: esforço S→XS |
| 4 | `config.ts` já funciona — expansão é nice-to-have | ST-08: esforço S→XS |
| 5 | Schema mismatch aggregator (`PerformanceMetricDoc` vs `PerformanceMetric`) | ST-09: hook direto, NÃO via aggregator |
| 6 | Jest config sem `testPathIgnorePatterns` confirmado | ST-04: sem alteração |

## Ressalvas da Aprovação (Athos)

1. **Schema Mismatch do Aggregator** — NÃO ativar aggregator com dados reais sem adapter. Hook busca spend diretamente. Aggregator completo → Sprint 28.
2. **Feature Flag para Attribution** — Considerar `NEXT_PUBLIC_ENABLE_ATTRIBUTION=true` para rollback. Remoção na Sprint 28.
3. **Backlog de contract-map** — `use-attribution-data.ts`, `types/attribution.ts`, `budget-optimizer.ts` não estão em nenhuma lane. Registrar para Sprint 28.
4. **Dados de Teste (Seed)** — Se coleções vazias, dev DEVE criar seed para validar ST-11. Sem seed = page sem dados.

---
*Story Pack preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 27: Hybrid — Backlog Cleanup + Attribution Revival | 06/02/2026*
