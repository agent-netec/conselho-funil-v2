---
title: "QA Sprint 34 — FASE QA-3: Auto-Optimization"
date: "2026-02-09"
qa: "Dandara"
scope:
  - "AO-01 a AO-04"
  - "CS-34.12 a CS-34.16"
  - "DT-09 a DT-12 (DT-11 BLOCKING)"
  - "PB-04 a PB-06"
---

## Escopo (conforme solicitação)
Validado **apenas**: AO-01..AO-04, CS-34.12..CS-34.16, DT-09..DT-12 (DT-11 BLOCKING), PB-04..PB-06.

---

## AO-01 a AO-04 (PASS/FAIL)

| Item | Status | Evidência (arquivo) | Nota |
|---|---|---|---|
| **AO-01 — AutoOptimizer Engine** | **PASS** | `app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | Regras principais presentes (pause loser, declare winner por significância, early stop), `OptimizationDecision` coerente e log em `optimization_log`. |
| **AO-02 — Kill-Switch (DT-11 BLOCKING)** | **FAIL (BLOCKING)** | `app/src/lib/firebase/automation.ts`, `app/src/types/database.ts`, `app/src/app/api/automation/kill-switch/route.ts` | Helpers + type existem, mas **não há nenhum call-site** que persista `brand.killSwitchState` ao acionar Kill-Switch; logo `getKillSwitchState()` tende a retornar `false` mesmo após `/api/automation/kill-switch`. |
| **AO-03 — API Optimize** | **FAIL** | `app/src/app/api/intelligence/ab-tests/[testId]/optimize/route.ts` | Rota existe e checa Kill-Switch antes de avaliar, mas **não usa Zod** para validar `{ brandId }` (requisito explícito). |
| **AO-04 — UI Auto-Optimization** | **PASS** | `app/src/components/intelligence/ab-test-results.tsx`, `app/src/app/intelligence/ab-testing/page.tsx` | Toggle liga/desliga `autoOptimize`, botão de trigger manual chama `/optimize`, e histórico lê `optimization_log` e exibe badge “Kill-Switch” quando `executed=false`. |

---

## Success Criteria (CS-34.12 a CS-34.16 — PASS/FAIL)

| Critério | Status | Evidência / Observação |
|---|---|---|
| **CS-34.12: Pausa loser corretamente** | **PASS** | `AutoOptimizer.evaluate()` pausa variante quando `CR < 50%` do líder e `impressions >= minImpressions` (default 100). |
| **CS-34.13: Declara winner >= 95%** | **PASS** | `AutoOptimizer.evaluate()` declara winner quando `calculateSignificance(...).isSignificant` com threshold default `0.95` (com override por teste) e líder com impressões suficientes (>= 200 por default). |
| **CS-34.14: Kill-Switch bloqueia (log-only)** | **FAIL (BLOCKING)** | Embora `AutoOptimizer` suporte log-only via `killSwitchActive`, o estado **não é efetivamente ativado** via endpoint existente de Kill-Switch (não grava `brand.killSwitchState`). |
| **CS-34.15: optimization_log em subcollection** | **PASS** | Persistência via `addDoc(collection(db,'brands',brandId,'ab_tests',testId,'optimization_log'), decision)` em `auto-optimizer.ts`. |
| **CS-34.16: UI toggle funcional** | **PASS** | `ABTestResults` dispara `onToggleAutoOptimize`, e `page.tsx` persiste via `PUT /api/intelligence/ab-tests/[testId]` com `{ autoOptimize: nextValue }`. |

---

## Decision Topics (DT-09 a DT-12 — IMPLEMENTADO/DIVERGENTE)

| DT | Status | Evidência | Nota |
|---|---|---|---|
| **DT-09 (thresholds: defaults + override opcional)** | **IMPLEMENTADO** | `app/src/types/ab-testing.ts`, `app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | Usa `test.minImpressionsForDecision ?? 100` e `test.significanceThreshold ?? 0.95`. |
| **DT-10 (OptimizationDecision + optimization_log subcollection)** | **IMPLEMENTADO** | `app/src/types/ab-testing.ts`, `app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | `OptimizationDecision.executed` presente; `optimization_log` subcollection usada. |
| **DT-11 (Kill-Switch state helper + brand field) — BLOCKING** | **DIVERGENTE** | `app/src/lib/firebase/automation.ts`, `app/src/types/database.ts`, `app/src/app/api/automation/kill-switch/route.ts` | **Detalhe abaixo**. |
| **DT-12 (hashAssign dedicado; não importar rag.ts)** | **IMPLEMENTADO** | `app/src/lib/intelligence/ab-testing/engine.ts` | `hashAssign()` existe e não importa `rag.ts`. |

### DT-11 (BLOCKING) — Detalhamento
- **Implementado**:
  - `killSwitchState?: { active; activatedAt?; reason? }` no `Brand` em `app/src/types/database.ts`.
  - `getKillSwitchState(brandId): Promise<boolean>` e `setKillSwitchState(...)` em `app/src/lib/firebase/automation.ts`.
- **Divergente / Gap**:
  - O endpoint atual `POST /api/automation/kill-switch` (`app/src/app/api/automation/kill-switch/route.ts`) **não chama** `setKillSwitchState()` (nem grava `brands/{brandId}.killSwitchState`).
  - Resultado: `getKillSwitchState()` tende a retornar `false` (fallback) e **não garante** o bloqueio PB-04/CS-34.14 no fluxo real de Kill-Switch.

---

## Proibições (PB-04 a PB-06 — RESPEITADA/VIOLADA)

| Proibição | Status | Evidência / Observação |
|---|---|---|
| **PB-04: ZERO auto-optimization se Kill-Switch ativo** | **VIOLADA (por divergência DT-11)** | `AutoOptimizer` suporta log-only se `killSwitchActive=true`, porém o estado não é ativado/persistido pelo fluxo de Kill-Switch atual. |
| **PB-05: ZERO drag-and-drop library** | **RESPEITADA** | Não há sinais de `react-beautiful-dnd`, `@dnd-kit`, `react-dnd`, `sortablejs`, `dragula` no app (busca textual). |
| **PB-06: ZERO publicação real** | **RESPEITADA** | Fase AO escreve apenas em Firestore (AB test doc + logs); não há chamadas de publicação externa no escopo do optimizer/optimize route/UI. |

---

## Score parcial: **16/25**

**Método (normalização para 25):**
- Checks aplicáveis nesta fase = **17** (AO:4 + CS:5 + DT:4 + PB:3 + DT-11 incluso em DT-09..12).
- PASS/IMPLEMENTADO/RESPEITADA = **11/17** → \(11/17 \times 25 \approx 16.17\) → **16/25**.

---

## Findings

1. **F-01 (BLOCKING — DT-11 / PB-04 / CS-34.14):** `getKillSwitchState()` existe, mas **não há integração** que torne o Kill‑Switch “ativo” no runtime (endpoint `/api/automation/kill-switch` não grava `brand.killSwitchState`). Isso impede garantir “log-only / zero ação automática”.
2. **F-02 (AO-03):** Rota `POST /api/intelligence/ab-tests/[testId]/optimize` **sem validação Zod** do body `{ brandId }` (drift do padrão Sigma exigido no Story Pack).
3. **F-03 (Observação UI):** histórico mostra `Timestamp: {entry.timestamp?.toMillis?.() ?? 0}` (epoch ms) sem formatação humana; não bloqueia, mas reduz legibilidade.

