---
title: "QA Sprint 34 — FASE QA-2: Performance por Segmento"
date: "2026-02-09"
qa: "Dandara"
scope:
  - "SEG-01 a SEG-05"
  - "CS-34.09 a CS-34.11"
  - "DT-07, DT-08, DT-13 (BLOCKING)"
---

## Resultado (SEG-01 a SEG-05)

| Item | Status | Evidência |
|---|---|---|
| **SEG-01 (Segment Query — DT-13 BLOCKING)** | **PASS** | `app/src/lib/intelligence/ab-testing/segment-query.ts` consulta `collection(db, 'leads')` e filtra por `where('brandId','==',brandId)` + `where('segment','==',segment)`; inclui comentário de **índice composto** `brandId ASC + segment ASC`. A rota `app/src/app/api/performance/metrics/route.ts` **não** adiciona query param `segment`. |
| **SEG-02 (Components)** | **PASS** | `SegmentFilter` possui dropdown com `all/hot/warm/cold` em `app/src/components/performance/segment-filter.tsx`. `SegmentBreakdown` renderiza **3 cards** (HOT/WARM/COLD) com métricas em `app/src/components/performance/segment-breakdown.tsx` (cores: vermelho/amarelo/azul). |
| **SEG-03 (Hook)** | **PASS (com ressalva)** | `app/src/lib/hooks/use-segment-performance.ts` implementa revalidação **a cada 60s** via `setInterval(..., 60_000)` e retorna tipagem explícita (`breakdown/loading/error/selectedSegment/...`). **Ressalva**: não usa a lib `swr`; é “SWR pattern” manual. |
| **SEG-04 (PerformanceAdvisor — DT-08)** | **PASS** | `app/src/lib/performance/engine/performance-advisor.ts` aceita `segmentData?: SegmentBreakdownData` e repassa para `buildPerformanceAdvisorPrompt(...)`. O prompt em `app/src/lib/ai/prompts/performance-advisor.ts` injeta seção condicional quando `segmentData` existe; quando ausente, `segmentSection=''` (backward-compatible). |
| **SEG-05 (UI Integration)** | **PASS** | `app/src/app/performance/page.tsx` integra `SegmentFilter` + `SegmentBreakdown` e usa `useSegmentPerformance(selectedBrand?.id || null)`. |

--- 

## Success Criteria (CS-34.09 a CS-34.11)

| Critério | Status | Evidência / Observação |
|---|---|---|
| **CS-34.09: Dashboard filtra por segmento** | **FAIL** | Em `app/src/app/performance/page.tsx`, `selectedSegment` é exibido (texto “Segment insights: ...”), mas **não** há aplicação do filtro em nenhuma fonte/visão de dados (não filtra War Room, não filtra o breakdown, e não alimenta o Advisor). O hook mantém `selectedSegment`, porém o fetch do breakdown não depende dele. |
| **CS-34.10: SegmentBreakdown mostra 3 cards** | **PASS** | `app/src/components/performance/segment-breakdown.tsx` renderiza 3 cards (HOT/WARM/COLD) com Leads/Conversions/Avg Revenue/CR. |
| **CS-34.11: PerformanceAdvisor gera insights por segmento** | **FAIL** | A capacidade existe (DT-08 implementado), porém **não há call-site** no app passando `segmentData` para o `PerformanceAdvisor`. Busca por `new PerformanceAdvisor`/uso de `generateInsights(` não retorna nenhum consumidor além do próprio engine. A UI atual contém um card estático de “AI Strategic Insight”. |

---

## Decision Topics (DTs)

| DT | Status | Nota |
|---|---|---|
| **DT-07 (Query strategy + index composto em leads)** | **IMPLEMENTADO** | `segment-query.ts` executa 3 queries em paralelo (`Promise.all`) e documenta o índice composto `brandId + segment`. |
| **DT-08 (Advisor: segmentData opcional + inject no prompt)** | **IMPLEMENTADO** | Param opcional no engine + seção condicional no prompt; mantém single Gemini call. |
| **DT-13 (BLOCKING — SegmentBreakdown usa LEADS, não ADS; `/api/performance/metrics` inalterada)** | **IMPLEMENTADO** | `segment-query.ts` consulta **leads** (não ads). `/api/performance/metrics` não foi estendido com `segment` (nenhum query param novo relacionado a segmento). |

---

## Score parcial: **16/20**

**Método:** 10 checks \(\*2 pontos cada\) = 20 pontos: SEG-01..SEG-05 (5), CS-34.09..CS-34.11 (3), DT-07..DT-08 (2). DT-13 é reportado à parte por ser blocking.

- **PASS**: SEG-01, SEG-02, SEG-03, SEG-04, SEG-05, CS-34.10, DT-07, DT-08 → **8 \* 2 = 16**
- **FAIL**: CS-34.09, CS-34.11 → **0**

---

## Findings

- **F-01 (CS-34.09 — filtro não aplicado)**: `selectedSegment` hoje não altera nenhuma consulta/visão; existe apenas como estado + texto.  
- **F-02 (CS-34.11 — Advisor não consumido)**: DT-08 está implementado no engine/prompt, mas falta integração (ex.: endpoint/UI) que realmente invoque o Advisor com `segmentData`.  
- **F-03 (SEG-03 — “SWR” apenas por pattern)**: revalidação 60s está OK, mas sem `swr` library (se o requisito era a lib, isso precisa alinhar/ajustar).  
