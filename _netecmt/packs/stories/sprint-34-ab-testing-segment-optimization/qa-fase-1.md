---
title: "QA Sprint 34 — FASE QA-1: A/B Test Engine"
date: "2026-02-09"
qa: "Dandara"
scope:
  - "AB-01 a AB-07"
  - "CS-34.01 a CS-34.08"
  - "PB-01 a PB-03"
  - "DT-03 a DT-06"
---

## AB-01 (Types): **FAIL**
- **Arquivo**: `app/src/types/ab-testing.ts`
- **OK**:
  - `ABTest`, `ABTestVariant`, `OptimizationDecision`, `SegmentMetrics` presentes.
  - Zod schemas presentes: `CreateABTestSchema`, `RecordEventSchema`, `AssignVariantSchema`.
  - **DT-03**: `ABTestStatus` inclui `running`, `paused`, `completed`.
- **GAP**:
  - **Type `VariantMetrics` não existe** (exigido no checklist desta fase).

## AB-02 (CRUD Firestore): **FAIL**
- **Arquivo**: `app/src/lib/firebase/ab-tests.ts`
- **OK**:
  - Funções presentes: `createABTest`, `getABTest`, `updateABTest`, `deleteABTest`, `updateVariantMetrics`.
  - Multi-tenant: todas recebem `brandId` e usam path `brands/{brandId}/ab_tests`.
  - Uso de `increment()` para totais do teste (`metrics.totalImpressions`, `metrics.totalConversions`, `metrics.totalRevenue`).
- **GAP**:
  - **Nome esperado no checklist**: `listABTests` (ou `listABTests`). **Implementado como** `getABTests`.
  - **Atomicidade por variante**: `updateVariantMetrics()` atualiza métricas de variantes via **read → map → update** do array `variants` (sem `runTransaction()`), o que **não é atomicamente seguro** sob concorrência (ex.: múltiplos eventos simultâneos no mesmo `testId`).

## AB-03 (Engine): **PASS (com ressalva DT-04)**
- **Arquivo**: `app/src/lib/intelligence/ab-testing/engine.ts`
  - `hashAssign()` implementa **djb2 determinístico** e usa separador `:` (**PB-02**, **DT-05**).
  - Assignment determinístico por `leadId:testId`: `ABTestEngine.assignVariant()`.
- **Arquivo**: `app/src/lib/intelligence/ab-testing/significance.ts`
  - Z-test implementado inline, **sem lib estatística externa** (**PB-01**).
  - Guard de impressões: `isSignificant` só pode ser `true` com **nA>=100 e nB>=100** (**PB-03**).
- **Ressalva (DT-04)**:
  - A regra de 95% está implementada como `threshold = 0.95` (comparando `significance >= threshold`), e **não** como verificação explícita de \(z \ge 1.96\).

## AB-04 (APIs CRUD): **FAIL**
- **Arquivos**:
  - `app/src/app/api/intelligence/ab-tests/route.ts`
  - `app/src/app/api/intelligence/ab-tests/[testId]/route.ts`
- **OK**:
  - `export const dynamic = 'force-dynamic'` presente.
  - Uso de `createApiError`/`createApiSuccess`.
  - Uso de `requireBrandAccess(req, brandId)`.
  - POST com validação Zod (`CreateABTestSchema`).
- **GAP**:
  - **PUT** em `/api/intelligence/ab-tests/[testId]` **não** valida body com Zod (o checklist desta fase exige “Zod validation” nas rotas).

## AB-05 (API Assignment): **PASS**
- **Arquivo**: `app/src/app/api/intelligence/ab-tests/[testId]/assign/route.ts`
- **OK**:
  - `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`.
  - Validação Zod: `AssignVariantSchema`.
  - Assignment via `ABTestEngine.assignVariant()` (determinístico).

## AB-06 (API Event Recording): **PASS**
- **Arquivo**: `app/src/app/api/intelligence/ab-tests/[testId]/event/route.ts`
- **OK**:
  - `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`.
  - Validação Zod: `RecordEventSchema`.
  - Recording via `ABTestEngine.recordEvent()`.
- **Risco alinhado a AB-02**:
  - Mesmo chamando o engine, a atomicidade **por variante** depende de `updateVariantMetrics()` (atualmente sem transaction).

## AB-07 (UI): **PASS**
- **Página**: `app/src/app/intelligence/ab-testing/page.tsx`
  - Wizard de criação (3 steps) renderiza e chama API.
  - Results renderiza métricas por variante e destaca líder.
- **Componentes**:
  - `app/src/components/intelligence/ab-test-wizard.tsx` (3 steps)
  - `app/src/components/intelligence/ab-test-results.tsx` (métricas + highlight + history)
  - `app/src/components/intelligence/ab-test-card.tsx` (cards na lista)
- **Sidebar / Ícone**:
  - `app/src/lib/constants.ts` inclui item `{ id: 'ab-testing', href: '/intelligence/ab-testing', icon: 'FlaskConical' }`
  - `app/src/lib/icon-maps.ts` mapeia `FlaskConical` em `SIDEBAR_ICONS`
- **DT-06**: padrões visuais e estrutura de página consistente com features do grupo Intelligence.

---

## CS-34.01 a CS-34.08
- **CS-34.01 (CRUD funcional via API)**: **PASS** (rotas CRUD presentes e integradas a Firestore helpers)
- **CS-34.02 (Variantes embedded, min 2, max 5)**: **PASS** (Zod: `.min(2).max(5)` + wizard restringe 2–5)
- **CS-34.03 (Assignment determinístico — hash djb2)**: **PASS** (`hashAssign(leadId, testId, ...)`)
- **CS-34.04 (Event recording incrementa atomicamente)**: **FAIL** (totais usam `increment()`, mas métricas por variante dependem de update do array `variants` sem transaction)
- **CS-34.05 (UI wizard funcional)**: **PASS**
- **CS-34.06 (UI results mostra métricas)**: **PASS**
- **CS-34.07 (Z-test correta)**: **PASS** (Z-test implementado + p-value via `erfc` aproximado; sem lib externa)
- **CS-34.08 (Target segment filtra assignment)**: **FAIL** (assignment atual não valida/filtra por `targetSegment` do teste versus segmento real do lead)

---

## PB-01 a PB-03
- **PB-01 (ZERO lib estatística externa)**: **RESPEITADA** (`significance.ts` inline, sem deps)
- **PB-02 (Assignment determinístico)**: **RESPEITADA** (`hashAssign` puro; sem random/cookie)
- **PB-03 (Threshold >= 100 impressões)**: **RESPEITADA** (`calculateSignificance`: `nA>=100 && nB>=100` para `isSignificant=true`)

---

## DT-03 a DT-06
- **DT-03 (status enum inclui running/paused/completed)**: **IMPLEMENTADO** (`ABTestStatus`)
- **DT-04 (significância 95% (1.96))**: **DIVERGENTE** (implementado por `threshold=0.95` e `pValue` via `erfc`, sem constante explícita `1.96`)
- **DT-05 (assignment determinístico por leadId+testId)**: **IMPLEMENTADO**
- **DT-06 (UI patterns consistentes)**: **IMPLEMENTADO**

---

## Score parcial: **18/25**
- **Resultado bruto (checks aplicáveis nesta fase)**: **16/22**
- **Normalização para escala 25**: \(16/22 \times 25 \approx 18.18 \Rightarrow 18/25\)

---

## Findings
- **F-01 (Types incompletos vs checklist)**: falta `VariantMetrics` em `app/src/types/ab-testing.ts` (AB-01).
- **F-02 (Atomicidade de métricas por variante)**: `updateVariantMetrics()` atualiza o array `variants` sem transaction → suscetível a race conditions (AB-02 / CS-34.04).
- **F-03 (Zod validation incompleta no CRUD)**: PUT `/api/intelligence/ab-tests/[testId]` não valida body via Zod (AB-04).
- **F-04 (Segment filtering no assignment)**: não há enforcement de `targetSegment` no fluxo de assignment (CS-34.08).

