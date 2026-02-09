# Story Pack Index — Sprint 34: A/B Testing & Segment Optimization

**Sprint:** 34
**Tipo:** Feature Sprint (A/B Testing & Segment Optimization)
**SM:** Leticia
**Data:** 09/02/2026
**Deliberacao:** Veredito do Conselho (Party Mode) — unanimidade 5/5
**PRD:** `_netecmt/solutioning/prd/prd-sprint-34-ab-testing-segment-optimization.md`
**Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-34.md` — APROVADO COM RESSALVAS (14 DTs, 2 Blocking: DT-11, DT-13)

---

## Organizacao do Pack

| Arquivo | Conteudo |
|:--------|:---------|
| `story-pack-index.md` | Este arquivo (indice e visao geral) |
| `stories.md` | Stories detalhadas com acceptance criteria |
| `allowed-context.md` | Arquivos que Darllyson pode ler/modificar |

---

## Baseline pos-Sprint 33

| Metrica | Valor |
|:--------|:------|
| Testes passando | 286/286 (50 suites, 0 fail) |
| TypeScript errors | 0 |
| Build | ~109 rotas (Next.js 16 Turbopack) |
| QA Score S33 | 96/100 |

---

## Fases e Sequencia

### Fase 0: Governanca & Backlog S33 (~2h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S34-GOV-01 | Timer leak fix — cleanup per-hook (Camada 1) + `--forceExit` fallback (Camada 2) | DT-01 | M (~1h) | — |
| S34-GOV-02 | engagementScore — `getTopEngagementExamples()` + inject no generation engine | DT-02 | S+ (~45min) | — |
| S34-GATE-00 | **Gate Check 0** | — | XS (~15min) | GOV-01, GOV-02 |

### Fase 1: A/B Test Engine (P0 — ~6.5-7h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S34-AB-01 | Types + Data model (`types/ab-testing.ts`) | DT-03 | S (~30min) | S34-GATE-00 |
| S34-AB-02 | CRUD Firestore (`lib/firebase/ab-tests.ts`) | — | M (~1h) | S34-AB-01 |
| S34-AB-03 | AB Test Engine + `hashAssign()` dedicada + significance calc (`significance.ts`) | DT-04, DT-05, DT-12 | L (~2h) | S34-AB-01 |
| S34-AB-04 | API CRUD `/api/intelligence/ab-tests/` + `[testId]/` | — | M (~1h) | S34-AB-02, S34-AB-03 |
| S34-AB-05 | API Assignment `/api/intelligence/ab-tests/[testId]/assign/` | — | S (~30min) | S34-AB-03 |
| S34-AB-06 | API Event `/api/intelligence/ab-tests/[testId]/event/` | — | S (~30min) | S34-AB-02 |
| S34-AB-07 | UI A/B Testing page (wizard + results + sidebar + FlaskConical icon) | DT-06, DT-14 | M+ (~1.5h) | S34-AB-04, S34-AB-05, S34-AB-06 |
| S34-GATE-01 | **Gate Check 1** | — | XS (~15min) | S34-AB-07 |

### Fase 2: Performance por Segmento (P0 — ~4-4.5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S34-SEG-01 | Segment data query via leads collection (NAO extender `/api/performance/metrics`) | DT-07, DT-13 (BLOCKING) | S+ (~45min) | S34-GATE-01 |
| S34-SEG-02 | SegmentFilter + SegmentBreakdown components | — | M (~1.5h) | S34-SEG-01 |
| S34-SEG-03 | Hook `useSegmentPerformance` | — | S (~45min) | S34-SEG-01 |
| S34-SEG-04 | PerformanceAdvisor extension — segment insights (inject no prompt existente) | DT-08 | S+ (~45min) | S34-SEG-01 |
| S34-SEG-05 | UI integration na pagina Performance | — | S (~30min) | S34-SEG-02, S34-SEG-03 |
| S34-GATE-02 | **Gate Check 2** | — | XS (~15min) | S34-SEG-05 |

### Fase 3: Auto-Optimization (P1 — ~4.5-5.5h)
| ID | Story | DTs | Esforco | Dependencia |
|:---|:------|:----|:--------|:------------|
| S34-AO-01 | AutoOptimizer engine + OptimizationDecision type | DT-09, DT-10 | L (~2h) | S34-GATE-02, S34-AB-03 |
| S34-AO-02 | **CRIAR `getKillSwitchState()`** + campo `killSwitchState` no Brand type + Automation Log integration | DT-11 (BLOCKING) | M (~1h) | S34-GATE-02 |
| S34-AO-03 | API `/api/intelligence/ab-tests/[testId]/optimize/` | — | S (~30min) | S34-AO-01, S34-AO-02 |
| S34-AO-04 | UI auto-optimization (toggle + history + manual trigger) + testes | — | M (~1.5h) | S34-AO-03 |
| S34-GATE-03 | **Gate Check 3** | — | XS (~15min) | S34-AO-04 |

### Fase 4: Governanca Final (~0.5h)
| ID | Story | Esforco | Dependencia |
|:---|:------|:--------|:------------|
| S34-GOV-03 | Contract-map update — lane `ab_testing_optimization` | XS (~15min) | S34-GATE-03 |
| S34-GOV-04 | ACTIVE_SPRINT.md + ROADMAP.md atualizados | XS (~15min) | S34-GOV-03 |

---

## Resumo de Esforco

| Fase | Stories | Esforco Total |
|:-----|:--------|:-------------|
| Fase 0 (Governanca S33) | 2 + gate | ~2h |
| Fase 1 (A/B Test Engine) | 7 + gate | ~6.5-7h + 15min |
| Fase 2 (Performance por Segmento) | 5 + gate | ~4-4.5h + 15min |
| Fase 3 (Auto-Optimization) | 4 + gate | ~4.5-5.5h + 15min |
| Fase 4 (Governanca Final) | 2 | ~30min |
| **Total** | **20 stories + 4 gates** | **~17-19.5h** |

---

## Blocking DTs (Pre-flight — Darllyson DEVE compreender antes de comecar)

- [ ] **DT-11 (BLOCKING)**: A funcao `getKillSwitchState(brandId)` NAO EXISTE no codebase. DEVE ser criada na S34-AO-02 ANTES de implementar logica de auto-optimization. Implementar campo `killSwitchState?: { active: boolean; activatedAt?: Timestamp; reason?: string }` no Brand type (`types/database.ts`) + helper em `lib/firebase/automation.ts`. Sem isso, PB-04 nao pode ser verificado em runtime.
- [ ] **DT-13 (BLOCKING para Story Pack)**: O `SegmentBreakdown` DEVE ser alimentado por dados de LEADS (collection `leads`), NAO por metricas de ads. A rota `/api/performance/metrics` permanece INALTERADA. Em vez de extender a rota, usar query Firestore em leads com `where('brandId','==',brandId).where('segment','==',param)`. **Pre-requisito: Firestore composite index (`brandId` ASC + `segment` ASC) na collection `leads`.**

---

## Pre-requisitos Infra (Documentar ANTES da Fase 2)

| # | Pre-requisito | Fase | Acao |
|:--|:-------------|:-----|:-----|
| INFRA-01 | Firestore composite index: `leads` collection — `brandId` ASC + `segment` ASC | Fase 2 | Criar index no console Firebase OU documentar para deploy. Query `where('brandId','==',brandId).where('segment','==',param)` falha sem ele. |

---

## Gate Checks (4 obrigatorios)

| Gate | Pre-requisito | Criterio |
|:-----|:-------------|:---------|
| S34-GATE-00 | Fase 0 completa | tsc=0, testes passam, zero timer warnings (ou `--forceExit` documentado), engagementScore funcional |
| S34-GATE-01 | Fase 1 completa | CRUD funcional, assignment retorna variante consistente, event recording incrementa, significance calc testado, UI renderiza, sidebar com A/B Testing, tsc=0, testes passam |
| S34-GATE-02 | Fase 2 completa | Segment query funcional, SegmentBreakdown renderiza 3 segmentos com dados de leads, PerformanceAdvisor gera insights comparativos, tsc=0, testes passam |
| S34-GATE-03 | Fase 3 completa | AutoOptimizer pausa losers, declara winners >= 95%, Kill-Switch bloqueia (log-only), optimization_log persiste, UI toggle + history funcional, tsc=0, testes passam |

---

## Success Criteria (CS-34.01 a CS-34.20)

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
| CS-34.10 | SegmentBreakdown mostra 3 cards comparativos | Visual: Hot, Warm, Cold com metricas resumidas (dados de leads) |
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

## Proibicoes (P-01 a P-08 herdadas + PB-01 a PB-06 novas)

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

### Novas S34 (PRD + Athos)

| ID | Proibicao |
|:---|:----------|
| PB-01 | ZERO lib estatistica externa — Z-test implementado inline (~15 linhas, funcao utility) |
| PB-02 | ZERO assignment nao-deterministico — hash puro djb2 (`leadId:testId`), sem random, sem cookie |
| PB-03 | ZERO decisao automatica sem >= 100 impressoes por variante |
| PB-04 | ZERO auto-optimization se Kill-Switch ativo — log-only mode |
| PB-05 | ZERO drag-and-drop library (manter HTML5 nativo se UI necessitar) |
| PB-06 | ZERO publicacao real em plataformas — testes controlam apenas display/conteudo |

---

*Story Pack preparado por Leticia (SM) | Sprint 34 | 09/02/2026*
*20 stories + 4 Gates | 2 Blocking DTs (DT-11, DT-13) | 14 DTs total incorporados*
*Estimativa ajustada (Athos): ~17-19.5h*
