# Stories Distilled: Sprint 34 — A/B Testing & Segment Optimization
**Preparado por:** Leticia (SM)
**Data:** 09/02/2026
**Lanes:** ab_testing_optimization (nova) + governance (cross-cutting)
**Tipo:** Feature Sprint (A/B Testing & Segment Optimization)

> **IMPORTANTE:** Este documento incorpora os **14 Decision Topics (DTs)** e as resolucoes do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 2 blocking DTs (DT-11, DT-13) foram RESOLVIDOS e as correcoes estao embutidas nas stories.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess` (de `@/lib/auth/brand-guard`), `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`, REST puro via `fetch()` (zero SDK npm novo).

---

## Fase 0: Governanca & Backlog S33 [~2h + Gate]

> **Sequencia:** GOV-01 e GOV-02 (paralelos — sem dependencia mutua) → **GATE CHECK 0**
>
> Esta fase resolve 2 dividas herdadas da S33 e prepara o codebase para as features da S34.

---

### S34-GOV-01: Timer Leak Fix — Cleanup Per-Hook [M, ~1h]

**Objetivo:** Resolver warning `A worker process has failed to exit gracefully` nos testes Jest. Implementar cleanup em 2 camadas conforme DT-01 do Athos.

> **[ARCH DT-01 — NON-BLOCKING, RESOLVIDO]:** Camada 1: `afterEach` com `cleanup()` do `@testing-library/react` em cada um dos 3 arquivos de teste de hooks + `unmount()` per-test. Camada 2 (fallback): `--forceExit` no `jest.config.js` se Camada 1 nao eliminar 100% dos warnings.

**Acao:**
1. Em `app/src/__tests__/hooks/use-brands.test.ts`:
   - ADICIONAR import e `afterEach`:

```typescript
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

2. Em `app/src/__tests__/hooks/use-brand-assets.test.ts`:
   - ADICIONAR mesmo pattern de `cleanup()` no `afterEach`

3. Verificar se `use-funnels.test.ts` existe e aplicar mesmo pattern se sim.

4. Em `app/jest.setup.js`:
   - Verificar que `afterAll` global com `jest.clearAllTimers()` + `jest.useRealTimers()` + `jest.restoreAllMocks()` esta presente (adicionado em S33-GOV-02)
   - Se warnings persistirem apos Camada 1: adicionar `--forceExit` no `jest.config.js`:

```javascript
// jest.config.js — APENAS se Camada 1 nao resolver
module.exports = {
  // ... config existente ...
  forceExit: true, // @todo S35: investigar polyfill MessageChannel isolado
}
```

**Arquivos:**
- `app/src/__tests__/hooks/use-brands.test.ts` — **MODIFICAR** (adicionar afterEach cleanup)
- `app/src/__tests__/hooks/use-brand-assets.test.ts` — **MODIFICAR** (adicionar afterEach cleanup)
- `app/jest.setup.js` — **MODIFICAR** (se necessario — avaliar isolamento)

**DTs referenciados:** DT-01 (timer cleanup, 2 camadas)
**Dependencias:** Nenhuma
**Gate Check:** S34-GATE-00 (Sim)

**AC:**
- [ ] `afterEach` com `cleanup()` adicionado em `use-brands.test.ts`
- [ ] `afterEach` com `cleanup()` adicionado em `use-brand-assets.test.ts`
- [ ] `npm test` roda sem warning `worker has failed to exit gracefully` (Camada 1)
- [ ] Se warning persiste: `--forceExit` adicionado ao `jest.config.js` com `@todo S35` (Camada 2)
- [ ] `npx tsc --noEmit` = 0

---

### S34-GOV-02: engagementScore — `getTopEngagementExamples()` [S+, ~45min]

**Objetivo:** Implementar funcao que busca top-N interacoes com maior engagementScore e injetar como contexto adicional no prompt do Content Generation Engine. Resolve Nota N2 herdada de S32→S33.

> **[ARCH DT-02 — NON-BLOCKING, RESOLVIDO]:** Query `orderBy('engagementScore', 'desc').limit(5)` na subcollection `social_interactions`. Index single-field automatico do Firestore (nenhuma acao manual). Se nenhum doc tiver engagementScore, query retorna `[]` — engine continua sem exemplos (graceful degradation).

**Acao:**
1. CRIAR `app/src/lib/content/engagement-scorer.ts`:

```typescript
/**
 * Engagement Scorer — Busca top interacoes de alta performance
 * Collection: brands/{brandId}/social_interactions
 *
 * @module lib/content/engagement-scorer
 * @story S34-GOV-02
 * @arch DT-02
 */

import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SocialInteractionRecord } from '@/types/social';

/**
 * Busca as top-N interacoes com maior engagementScore para uma marca.
 *
 * DT-02: orderBy em campo unico (engagementScore) — index single-field automatico.
 * Docs sem engagementScore sao excluidos automaticamente pelo Firestore.
 * Se nenhuma interacao existir: retorna [] (graceful degradation).
 *
 * @param brandId - ID da marca
 * @param topN - Numero de exemplos a buscar (default: 5)
 * @returns Array de interacoes ordenadas por engagementScore desc
 */
export async function getTopEngagementExamples(
  brandId: string,
  topN: number = 5
): Promise<SocialInteractionRecord[]> {
  try {
    const colRef = collection(db, 'brands', brandId, 'social_interactions');
    const q = query(
      colRef,
      orderBy('engagementScore', 'desc'),
      limit(topN)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as SocialInteractionRecord[];
  } catch (error) {
    console.warn('[EngagementScorer] Failed to fetch examples:', error);
    return []; // Graceful degradation — NAO bloqueia geracao
  }
}

/**
 * Formata exemplos de alta performance para injecao no prompt de geracao.
 * Retorna string vazia se nao houver exemplos.
 */
export function formatEngagementContext(
  examples: SocialInteractionRecord[]
): string {
  if (!examples.length) return '';

  const formatted = examples
    .filter((e) => e.engagementScore && e.engagementScore > 0)
    .map((e) => `- "${e.content}" (engagement: ${(e.engagementScore! * 100).toFixed(0)}%, platform: ${e.platform})`)
    .join('\n');

  if (!formatted) return '';

  return `\n\n## High-Performance Content Examples from this Brand:\n${formatted}\n\nUse these successful examples as inspiration for tone, style, and engagement patterns.`;
}
```

2. Em `app/src/lib/content/generation-engine.ts`:
   - ADICIONAR import de `getTopEngagementExamples` e `formatEngagementContext`
   - Na funcao `generateContent()`, ADICIONAR chamada ANTES da geracao:

```typescript
// Apos montar filledPrompt, adicionar:
import { getTopEngagementExamples, formatEngagementContext } from '@/lib/content/engagement-scorer';

// Dentro de generateContent(), apos fillPrompt():
const engagementExamples = await getTopEngagementExamples(brandId);
const engagementContext = formatEngagementContext(engagementExamples);
const enrichedPrompt = filledPrompt + engagementContext;

// Usar enrichedPrompt em vez de filledPrompt na chamada a generateWithGemini()
```

**Arquivos:**
- `app/src/lib/content/engagement-scorer.ts` — **CRIAR**
- `app/src/lib/content/generation-engine.ts` — **MODIFICAR** (injetar engagement context)

**Leitura (NAO MODIFICAR):**
- `app/src/types/social.ts` — `SocialInteractionRecord` com `engagementScore?`
- `app/src/lib/firebase/config.ts` — `db`
- `app/src/lib/ai/gemini.ts` — `generateWithGemini()`

**DTs referenciados:** DT-02 (query + graceful degradation)
**Dependencias:** Nenhuma (SocialInteractionRecord ja existe desde S33-GOV-04)
**Gate Check:** S34-GATE-00 (Sim)

**AC:**
- [ ] `getTopEngagementExamples(brandId, topN?)` exportado de `engagement-scorer.ts`
- [ ] Query usa `orderBy('engagementScore', 'desc').limit(5)` (DT-02)
- [ ] Se nenhuma interacao existir: retorna `[]` (graceful degradation)
- [ ] `formatEngagementContext()` retorna string vazia se sem exemplos
- [ ] `generation-engine.ts` importa e injeta engagement context no prompt
- [ ] Geracao funciona normalmente SEM interacoes (NAO bloqueia)
- [ ] ZERO `any` (P-01), ZERO `Date` (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S34-GATE-00: Gate Check 0 — Governanca [XS, ~15min] — GATE

**Objetivo:** Validar que a governanca S33 esta resolvida. **Fase 1 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G0-01 | Cleanup per-hook adicionado | `rg "cleanup" app/src/__tests__/hooks/use-brands.test.ts` | 1+ match |
| G0-02 | Cleanup per-hook adicionado | `rg "cleanup" app/src/__tests__/hooks/use-brand-assets.test.ts` | 1+ match |
| G0-03 | Engagement scorer criado | Verificar existencia de `app/src/lib/content/engagement-scorer.ts` | Arquivo existe |
| G0-04 | Engagement injetado no engine | `rg "getTopEngagementExamples" app/src/lib/content/generation-engine.ts` | 1+ match |
| G0-05 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G0-06 | Testes passando | `npm test` | 0 fail, >= 286 passando |
| G0-07 | Timer warning | Verificar output do npm test | Zero `worker has failed to exit gracefully` (ou --forceExit documentado) |

**Regra ABSOLUTA:** Fase 1 so inicia se G0-01 a G0-07 todos aprovados.

**AC:**
- [ ] G0-01 a G0-07 todos aprovados
- [ ] Baseline intacto: tsc=0, testes >= 286 passando

---

## Fase 1: A/B Test Engine [~6.5-7h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S34-GATE-00 aprovado.
>
> **Sequencia:** AB-01 → AB-02 + AB-03 (paralelos) → AB-04 → AB-05 + AB-06 (paralelos) → AB-07 → **GATE CHECK 1**
>
> Esta fase cria o motor de A/B Testing completo: data model, CRUD Firestore, engine com hash assignment deterministico + significancia estatistica, APIs REST, e UI com wizard de criacao e dashboard de resultados.

---

### S34-AB-01: Types + Data Model (`types/ab-testing.ts`) [S, ~30min]

**Objetivo:** Criar todos os types necessarios para A/B Testing: `ABTest`, `ABTestVariant`, `OptimizationDecision`, enums de status, e Zod schemas de validacao.

> **[ARCH DT-03 — NON-BLOCKING, CONFIRMADO]:** Subcollection `brands/{brandId}/ab_tests` — 100% consistente com 7 subcollections existentes no projeto.
> **[ARCH DT-09 — NON-BLOCKING, RESOLVIDO]:** Constants com override opcional: campos `minImpressionsForDecision?`, `significanceThreshold?` no ABTest type.

**Acao:**
1. CRIAR `app/src/types/ab-testing.ts`:

```typescript
/**
 * A/B Testing & Segment Optimization Types
 * Collection: brands/{brandId}/ab_tests
 * Subcollection logs: brands/{brandId}/ab_tests/{testId}/optimization_log
 *
 * @sprint S34
 * @story S34-AB-01
 * @arch DT-03 (subcollection), DT-09 (threshold override)
 */

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// === Enums & Literals ===

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed';
export type TargetSegment = 'hot' | 'warm' | 'cold' | 'all';
export type ABEventType = 'impression' | 'click' | 'conversion';
export type OptimizationAction = 'pause_variant' | 'declare_winner' | 'early_stop' | 'continue';

// === ABTestVariant (embedded array no ABTest) ===

export interface ABTestVariant {
  id: string;
  name: string;
  contentVariations: {
    headline: string;
    cta?: string;
    offerId?: string;
    vslId?: string;
    body?: string;
  };
  weight: number;       // porcentagem do trafego (default 1/N)
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

// === ABTest (documento principal) ===

export interface ABTest {
  id: string;
  name: string;
  brandId: string;
  targetSegment: TargetSegment;
  variants: ABTestVariant[];
  status: ABTestStatus;
  metrics: {
    totalImpressions: number;
    totalConversions: number;
    totalRevenue: number;
  };
  winnerVariantId: string | null;
  significanceLevel: number | null;  // 0-1
  autoOptimize: boolean;
  startDate: Timestamp | null;
  endDate: Timestamp | null;
  // DT-09: Override opcional de thresholds
  minImpressionsForDecision?: number;
  significanceThreshold?: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === OptimizationDecision (subcollection optimization_log — DT-10) ===

export interface OptimizationDecision {
  id?: string;
  testId: string;
  variantId: string;
  action: OptimizationAction;
  reason: string;
  metrics: {
    impressions: number;
    conversions: number;
    cr: number;
    significance?: number;
  };
  executed: boolean;       // false se Kill-Switch ativo (PB-04)
  timestamp: Timestamp;
}

// === Significance Result ===

export interface SignificanceResult {
  zScore: number;
  pValue: number;
  significance: number;   // 1 - pValue (0-1)
  isSignificant: boolean;  // significance >= threshold
}

// === Segment Performance Types ===

export interface SegmentMetrics {
  segment: TargetSegment;
  totalLeads: number;
  conversions: number;
  totalRevenue: number;
  avgRevenue: number;
  conversionRate: number;  // conversions/totalLeads * 100
}

export interface SegmentBreakdownData {
  hot: SegmentMetrics;
  warm: SegmentMetrics;
  cold: SegmentMetrics;
}

// === Zod Validation Schemas ===

export const CreateABTestSchema = z.object({
  name: z.string().min(1).max(200),
  brandId: z.string().min(1),
  targetSegment: z.enum(['hot', 'warm', 'cold', 'all']),
  variants: z.array(z.object({
    name: z.string().min(1),
    contentVariations: z.object({
      headline: z.string().min(1),
      cta: z.string().optional(),
      offerId: z.string().optional(),
      vslId: z.string().optional(),
      body: z.string().optional(),
    }),
  })).min(2).max(5),
  autoOptimize: z.boolean().optional().default(false),
});

export const RecordEventSchema = z.object({
  brandId: z.string().min(1),
  variantId: z.string().min(1),
  eventType: z.enum(['impression', 'click', 'conversion']),
  value: z.number().optional(),
});

export const AssignVariantSchema = z.object({
  brandId: z.string().min(1),
  leadId: z.string().min(1),
});
```

**Arquivos:**
- `app/src/types/ab-testing.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/types/content.ts` — referencia de pattern (Zod schemas + types)

**DTs referenciados:** DT-03 (subcollection), DT-09 (threshold override)
**Dependencias:** Nenhuma
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] `ABTest` interface exportada com todos os campos do PRD
- [ ] `ABTestVariant` interface com `contentVariations`, metricas, `weight`
- [ ] `OptimizationDecision` interface com `executed: boolean` (para PB-04 Kill-Switch)
- [ ] `SignificanceResult` interface com `{ zScore, pValue, significance, isSignificant }`
- [ ] `SegmentMetrics` e `SegmentBreakdownData` interfaces para Fase 2
- [ ] `ABTestStatus` enum: draft, running, paused, completed
- [ ] `TargetSegment` enum: hot, warm, cold, all
- [ ] Zod schemas: `CreateABTestSchema` (min 2, max 5 variantes), `RecordEventSchema`, `AssignVariantSchema`
- [ ] Campos opcionais de override: `minImpressionsForDecision?`, `significanceThreshold?` (DT-09)
- [ ] `Timestamp` (nao Date) em todos os campos de data (P-06)
- [ ] ZERO `any` (P-01)
- [ ] `npx tsc --noEmit` = 0

---

### S34-AB-02: CRUD Firestore (`lib/firebase/ab-tests.ts`) [M, ~1h]

**Objetivo:** Criar CRUD helpers para a subcollection `brands/{brandId}/ab_tests` com isolamento multi-tenant nativo, Timestamp, e `increment()` atomico para metricas.

**Acao:**
1. CRIAR `app/src/lib/firebase/ab-tests.ts`:

```typescript
/**
 * A/B Tests — CRUD Helpers Firestore
 * Collection: brands/{brandId}/ab_tests
 *
 * @module lib/firebase/ab-tests
 * @story S34-AB-02
 * @arch DT-03 (subcollection pattern)
 */

import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ABTest, ABTestVariant, ABTestStatus } from '@/types/ab-testing';

/**
 * Cria um novo A/B test.
 * Variantes recebem weight = 1/N e metricas zeradas.
 */
export async function createABTest(
  brandId: string,
  data: {
    name: string;
    targetSegment: ABTest['targetSegment'];
    variants: Array<{ name: string; contentVariations: ABTestVariant['contentVariations'] }>;
    autoOptimize?: boolean;
  }
): Promise<ABTest> {
  const colRef = collection(db, 'brands', brandId, 'ab_tests');
  const now = Timestamp.now();
  const variantCount = data.variants.length;

  const variants: ABTestVariant[] = data.variants.map((v, i) => ({
    id: `variant_${i}`,
    name: v.name,
    contentVariations: v.contentVariations,
    weight: 1 / variantCount,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    revenue: 0,
  }));

  const testData = {
    name: data.name,
    brandId,
    targetSegment: data.targetSegment,
    variants,
    status: 'draft' as ABTestStatus,
    metrics: { totalImpressions: 0, totalConversions: 0, totalRevenue: 0 },
    winnerVariantId: null,
    significanceLevel: null,
    autoOptimize: data.autoOptimize ?? false,
    startDate: null,
    endDate: null,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(colRef, testData);
  return { id: docRef.id, ...testData };
}

/**
 * Lista A/B tests de uma marca, opcionalmente filtrados por status.
 */
export async function getABTests(
  brandId: string,
  status?: ABTestStatus
): Promise<ABTest[]> {
  const colRef = collection(db, 'brands', brandId, 'ab_tests');

  const q = status
    ? query(colRef, where('status', '==', status))
    : query(colRef);

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as ABTest[];
}

/**
 * Busca um A/B test especifico.
 */
export async function getABTest(
  brandId: string,
  testId: string
): Promise<ABTest | null> {
  const docRef = doc(db, 'brands', brandId, 'ab_tests', testId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as ABTest;
}

/**
 * Atualiza campos de um A/B test.
 */
export async function updateABTest(
  brandId: string,
  testId: string,
  data: Partial<Omit<ABTest, 'id' | 'brandId' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'ab_tests', testId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Remove um A/B test. Apenas testes em draft podem ser deletados.
 */
export async function deleteABTest(
  brandId: string,
  testId: string
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'ab_tests', testId);
  await deleteDoc(docRef);
}

/**
 * Incrementa metricas de uma variante atomicamente via Firestore increment().
 * Atualiza tanto a variante especifica quanto os totais do teste.
 */
export async function updateVariantMetrics(
  brandId: string,
  testId: string,
  variantId: string,
  delta: { impressions?: number; clicks?: number; conversions?: number; revenue?: number }
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'ab_tests', testId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) throw new Error('AB Test not found');

  const test = snap.data() as ABTest;
  const updatedVariants = test.variants.map((v) => {
    if (v.id !== variantId) return v;
    return {
      ...v,
      impressions: v.impressions + (delta.impressions ?? 0),
      clicks: v.clicks + (delta.clicks ?? 0),
      conversions: v.conversions + (delta.conversions ?? 0),
      revenue: v.revenue + (delta.revenue ?? 0),
    };
  });

  await updateDoc(docRef, {
    variants: updatedVariants,
    'metrics.totalImpressions': increment(delta.impressions ?? 0),
    'metrics.totalConversions': increment(delta.conversions ?? 0),
    'metrics.totalRevenue': increment(delta.revenue ?? 0),
    updatedAt: Timestamp.now(),
  });
}
```

**Arquivos:**
- `app/src/lib/firebase/ab-tests.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/firestore.ts` — referencia de CRUD patterns
- `app/src/lib/firebase/config.ts` — `db`, `Timestamp`
- `app/src/lib/firebase/automation.ts` — referencia de subcollection pattern

**DTs referenciados:** DT-03 (subcollection pattern)
**Dependencias:** S34-AB-01 (types existem)
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] `createABTest` cria teste com variantes em status `draft`, weight=1/N, metricas zeradas
- [ ] `getABTests` lista testes, filtra por status opcional
- [ ] `getABTest` retorna teste unico ou null
- [ ] `updateABTest` atualiza campos com `Timestamp.now()` no updatedAt
- [ ] `deleteABTest` remove teste
- [ ] `updateVariantMetrics` usa `increment()` do Firestore para atomicidade
- [ ] Path: `brands/{brandId}/ab_tests` (subcollection — DT-03)
- [ ] ZERO `any` (P-01), ZERO `Date` (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S34-AB-03: AB Test Engine + `hashAssign()` + Significance Calc [L, ~2h]

**Objetivo:** Criar o motor central de A/B Testing com: (a) metodos de gerenciamento do lifecycle do teste, (b) funcao `hashAssign()` dedicada com djb2 e separador `:`, (c) funcao utility de significancia estatistica Z-test em arquivo separado.

> **[ARCH DT-04 — NON-BLOCKING, RESOLVIDO]:** djb2 com separador `:`. Funcao dedicada `hashAssign()` no modulo AB Testing. NAO importar `hashString()` de `rag.ts` (DT-12).
> **[ARCH DT-05 — NON-BLOCKING, RESOLVIDO]:** Funcao utility em `significance.ts`. Retorno rico `{ zScore, pValue, significance, isSignificant }`. Aproximacao de p-value via erfc simplificada ou lookup table.
> **[ARCH DT-12 — NON-BLOCKING, RESOLVIDO]:** Funcao dedicada `hashAssign()`. NAO importar de `rag.ts`.

**Acao:**
1. CRIAR `app/src/lib/intelligence/ab-testing/significance.ts`:

```typescript
/**
 * Statistical Significance — Z-test for Proportions
 * Calcula significancia estatistica entre duas variantes de A/B test.
 *
 * ZERO lib estatistica externa (PB-01).
 * Implementacao inline da formula padrao Z-test para proporcoes.
 *
 * @module lib/intelligence/ab-testing/significance
 * @story S34-AB-03
 * @arch DT-05 (funcao utility dedicada)
 */

import type { SignificanceResult } from '@/types/ab-testing';

/**
 * Aproximacao do complementary error function (erfc).
 * Usado para converter Z-score em p-value (two-tailed).
 * Precisao suficiente para A/B testing (4 casas decimais).
 */
function approximateErfc(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);

  return 1 - sign * y;
}

/**
 * Converte Z-score em p-value (two-tailed).
 */
function zScoreToPValue(z: number): number {
  return approximateErfc(Math.abs(z) / Math.SQRT2);
}

/**
 * Z-test para proporcoes entre duas variantes.
 *
 * Formula: z = |p1 - p2| / sqrt(p_pool * (1 - p_pool) * (1/n1 + 1/n2))
 *
 * Retorno rico: { zScore, pValue, significance, isSignificant }
 *
 * Validacoes:
 * - Se n1 < 30 ou n2 < 30: retorna significance 0 (sample size minimo estatistico)
 * - Se impressoes < 100 em qualquer variante: isSignificant = false (PB-03)
 *
 * @param variantA - { conversions, impressions }
 * @param variantB - { conversions, impressions }
 * @param threshold - Limite de significancia (default: 0.95)
 */
export function calculateSignificance(
  variantA: { conversions: number; impressions: number },
  variantB: { conversions: number; impressions: number },
  threshold: number = 0.95
): SignificanceResult {
  const { conversions: cA, impressions: nA } = variantA;
  const { conversions: cB, impressions: nB } = variantB;

  // Guard: sample size minimo
  if (nA < 30 || nB < 30) {
    return { zScore: 0, pValue: 1, significance: 0, isSignificant: false };
  }

  const p1 = cA / nA;
  const p2 = cB / nB;
  const pPool = (cA + cB) / (nA + nB);

  const se = Math.sqrt(pPool * (1 - pPool) * (1 / nA + 1 / nB));

  // Guard: standard error zero (proporcoes identicas)
  if (se === 0) {
    return { zScore: 0, pValue: 1, significance: 0, isSignificant: false };
  }

  const zScore = Math.abs(p1 - p2) / se;
  const pValue = zScoreToPValue(zScore);
  const significance = 1 - pValue;

  // PB-03: ZERO decisao sem >= 100 impressoes
  const hasMinimumImpressions = nA >= 100 && nB >= 100;

  return {
    zScore,
    pValue,
    significance,
    isSignificant: hasMinimumImpressions && significance >= threshold,
  };
}
```

2. CRIAR `app/src/lib/intelligence/ab-testing/engine.ts`:

```typescript
/**
 * A/B Test Engine — Motor de experimentacao
 * Gerencia lifecycle de testes, assignment deterministico, e recording de eventos.
 *
 * @module lib/intelligence/ab-testing/engine
 * @story S34-AB-03
 * @arch DT-04 (djb2 hash), DT-12 (funcao dedicada)
 */

import { Timestamp } from 'firebase/firestore';
import {
  getABTest,
  updateABTest,
  updateVariantMetrics,
} from '@/lib/firebase/ab-tests';
import type { ABTest, ABTestVariant, ABEventType } from '@/types/ab-testing';

/**
 * Hash assignment deterministico via djb2.
 *
 * DT-04: djb2 com separador `:` evita colisao entre "abc"+"def" e "ab"+"cdef".
 * DT-12: Funcao DEDICADA. NAO importar hashString() de rag.ts.
 * PB-02: Hash puro, sem random, sem cookie.
 *
 * @param leadId - ID do lead
 * @param testId - ID do teste
 * @param variantCount - Numero de variantes
 * @returns Indice da variante (0 a variantCount-1)
 */
export function hashAssign(leadId: string, testId: string, variantCount: number): number {
  const input = `${leadId}:${testId}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  return (hash >>> 0) % variantCount;
}

/**
 * Classe principal do A/B Test Engine.
 */
export class ABTestEngine {
  /**
   * Inicia um teste (draft → running).
   */
  static async startTest(brandId: string, testId: string): Promise<void> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'draft') throw new Error(`Cannot start test in status: ${test.status}`);

    await updateABTest(brandId, testId, {
      status: 'running',
      startDate: Timestamp.now(),
    });
  }

  /**
   * Pausa um teste (running → paused).
   */
  static async pauseTest(brandId: string, testId: string): Promise<void> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running') throw new Error(`Cannot pause test in status: ${test.status}`);

    await updateABTest(brandId, testId, {
      status: 'paused',
    });
  }

  /**
   * Completa um teste (running/paused → completed).
   */
  static async completeTest(
    brandId: string,
    testId: string,
    winnerVariantId?: string,
    significanceLevel?: number
  ): Promise<void> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running' && test.status !== 'paused') {
      throw new Error(`Cannot complete test in status: ${test.status}`);
    }

    await updateABTest(brandId, testId, {
      status: 'completed',
      endDate: Timestamp.now(),
      winnerVariantId: winnerVariantId ?? null,
      significanceLevel: significanceLevel ?? null,
    });
  }

  /**
   * Atribui uma variante a um lead via hash deterministico.
   * PB-02: Mesmo lead + mesmo teste = SEMPRE mesma variante.
   *
   * @returns Variante atribuida ou null se teste nao esta running
   */
  static async assignVariant(
    brandId: string,
    testId: string,
    leadId: string
  ): Promise<ABTestVariant | null> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running') return null;

    // Filtrar variantes ativas (weight > 0)
    const activeVariants = test.variants.filter((v) => v.weight > 0);
    if (activeVariants.length === 0) return null;

    const index = hashAssign(leadId, testId, activeVariants.length);
    return activeVariants[index];
  }

  /**
   * Registra evento (impression, click, conversion) para uma variante.
   * Usa increment() do Firestore para atomicidade.
   */
  static async recordEvent(
    brandId: string,
    testId: string,
    variantId: string,
    eventType: ABEventType,
    value?: number
  ): Promise<void> {
    const delta: { impressions?: number; clicks?: number; conversions?: number; revenue?: number } = {};

    switch (eventType) {
      case 'impression':
        delta.impressions = 1;
        break;
      case 'click':
        delta.clicks = 1;
        break;
      case 'conversion':
        delta.conversions = 1;
        if (value) delta.revenue = value;
        break;
    }

    await updateVariantMetrics(brandId, testId, variantId, delta);
  }
}
```

3. CRIAR testes em `app/src/__tests__/lib/intelligence/ab-testing/engine.test.ts`:
   - Teste (1): `hashAssign` retorna resultado deterministico (mesmo input = mesmo output)
   - Teste (2): `hashAssign` distribui uniformemente entre 2-5 variantes
   - Teste (3): `hashAssign` com separador `:` nao colide entre inputs similares
   - Teste (4): `calculateSignificance` com dados conhecidos retorna resultado esperado
   - Teste (5): `calculateSignificance` com sample < 30 retorna significance 0
   - Teste (6): `calculateSignificance` com impressoes < 100 retorna isSignificant false
   - Teste (7): `ABTestEngine.assignVariant` retorna mesma variante para mesmo lead
   - Teste (8): `ABTestEngine.startTest` muda status de draft para running
   - Mock de `@/lib/firebase/ab-tests` (getABTest, updateABTest, etc.)

**Arquivos:**
- `app/src/lib/intelligence/ab-testing/engine.ts` — **CRIAR**
- `app/src/lib/intelligence/ab-testing/significance.ts` — **CRIAR**
- `app/src/__tests__/lib/intelligence/ab-testing/engine.test.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/rag.ts` — referencia de `hashString()` (djb2). NAO importar (DT-12)
- `app/src/lib/firebase/ab-tests.ts` — CRUD helpers (criado em AB-02)
- `app/src/types/ab-testing.ts` — types (criado em AB-01)

**DTs referenciados:** DT-04 (djb2), DT-05 (Z-test), DT-12 (funcao dedicada)
**Dependencias:** S34-AB-01 (types), S34-AB-02 (CRUD)
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] `hashAssign(leadId, testId, variantCount)` exportado — djb2 com separador `:` (DT-04)
- [ ] `hashAssign` e puro e deterministico — sem random, sem cookie (PB-02)
- [ ] `calculateSignificance(variantA, variantB, threshold?)` exportado de `significance.ts` (DT-05)
- [ ] Retorno rico: `{ zScore, pValue, significance, isSignificant }` (DT-05)
- [ ] Guard: sample < 30 → significance 0 (DT-05)
- [ ] Guard: impressoes < 100 → isSignificant false (PB-03)
- [ ] `ABTestEngine` com metodos estaticos: `startTest`, `pauseTest`, `completeTest`, `assignVariant`, `recordEvent`
- [ ] `assignVariant` retorna null para testes nao-running
- [ ] `recordEvent` incrementa metricas via CRUD helper
- [ ] 8+ testes passando (hash, significance, engine)
- [ ] ZERO lib externa (PB-01), ZERO import de `rag.ts` (DT-12)
- [ ] `npx tsc --noEmit` = 0

---

### S34-AB-04: API CRUD `/api/intelligence/ab-tests/` [M, ~1h]

**Objetivo:** Criar rotas REST para CRUD completo de A/B tests com validacao Zod e padroes Sigma.

**Acao:**
1. CRIAR `app/src/app/api/intelligence/ab-tests/route.ts`:
   - `POST` — Cria teste (valida com `CreateABTestSchema`)
   - `GET` — Lista testes (query param `status` opcional, `brandId` obrigatorio)

2. CRIAR `app/src/app/api/intelligence/ab-tests/[testId]/route.ts`:
   - `GET` — Busca teste unico
   - `PUT` — Atualiza teste (start/pause/complete + campos gerais). Body: `{ brandId, action?: 'start' | 'pause' | 'complete', ...fields }`
   - `DELETE` — Remove teste (apenas em status `draft`)

**Todas as rotas com:**
- `export const dynamic = 'force-dynamic'` (P-07)
- `requireBrandAccess(req, brandId)` (P-08)
- `createApiError`/`createApiSuccess` (Sigma)
- Validacao Zod no POST

**Arquivos:**
- `app/src/app/api/intelligence/ab-tests/route.ts` — **CRIAR**
- `app/src/app/api/intelligence/ab-tests/[testId]/route.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/ab-tests.ts` — CRUD helpers
- `app/src/lib/intelligence/ab-testing/engine.ts` — ABTestEngine
- `app/src/lib/utils/api-response.ts` — createApiError/Success
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess

**DTs referenciados:** Nenhum
**Dependencias:** S34-AB-02 (CRUD), S34-AB-03 (Engine)
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] POST `/api/intelligence/ab-tests` cria teste com validacao Zod
- [ ] GET `/api/intelligence/ab-tests` lista testes com filtro status opcional
- [ ] GET `/api/intelligence/ab-tests/[testId]` retorna teste unico
- [ ] PUT `/api/intelligence/ab-tests/[testId]` com `action: 'start'|'pause'|'complete'`
- [ ] DELETE `/api/intelligence/ab-tests/[testId]` apenas para status `draft`
- [ ] `force-dynamic` + `requireBrandAccess` + `createApiError`/`Success` em todas
- [ ] `npx tsc --noEmit` = 0

---

### S34-AB-05: API Assignment [S, ~30min]

**Objetivo:** Criar rota de assignment de variante para um lead.

**Acao:**
1. CRIAR `app/src/app/api/intelligence/ab-tests/[testId]/assign/route.ts`:
   - `POST` — Body: `{ brandId, leadId }`. Valida com `AssignVariantSchema`.
   - Retorna: `{ testId, variantId, variantName, contentVariations }`
   - Apenas testes em status `running` retornam assignment. Outros retornam 400.

**Arquivos:**
- `app/src/app/api/intelligence/ab-tests/[testId]/assign/route.ts` — **CRIAR**

**DTs referenciados:** DT-04 (hash assignment via engine)
**Dependencias:** S34-AB-03 (Engine com hashAssign)
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] POST com `{ brandId, leadId }` retorna variante atribuida
- [ ] Teste NAO running → erro 400
- [ ] Mesmo lead + mesmo teste = SEMPRE mesma variante (PB-02)
- [ ] `force-dynamic` + `requireBrandAccess` + `createApiError`/`Success`
- [ ] `npx tsc --noEmit` = 0

---

### S34-AB-06: API Event Recording [S, ~30min]

**Objetivo:** Criar rota para registrar eventos (impression, click, conversion) em variantes.

**Acao:**
1. CRIAR `app/src/app/api/intelligence/ab-tests/[testId]/event/route.ts`:
   - `POST` — Body: `{ brandId, variantId, eventType: 'impression' | 'click' | 'conversion', value?: number }`. Valida com `RecordEventSchema`.
   - Usa `ABTestEngine.recordEvent()` para incrementar metricas atomicamente.

**Arquivos:**
- `app/src/app/api/intelligence/ab-tests/[testId]/event/route.ts` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S34-AB-02 (updateVariantMetrics), S34-AB-03 (Engine)
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] POST aceita `{ brandId, variantId, eventType, value? }`
- [ ] Incrementa metricas atomicamente (impressions, clicks, conversions, revenue)
- [ ] `force-dynamic` + `requireBrandAccess` + `createApiError`/`Success`
- [ ] `npx tsc --noEmit` = 0

---

### S34-AB-07: UI A/B Testing Page + Sidebar [M+, ~1.5h]

**Objetivo:** Criar pagina dedicada `/intelligence/ab-testing/page.tsx` com wizard de criacao (3 steps), dashboard de resultados, e integracao no sidebar.

> **[ARCH DT-06 — NON-BLOCKING, RESOLVIDO]:** Pagina dedicada. Pattern unanime (6 features Intelligence existentes).
> **[ARCH DT-14 — NON-BLOCKING, RESOLVIDO]:** Verificar/adicionar `FlaskConical` no SIDEBAR_ICONS (`lib/icon-maps.ts`).

**Acao:**
1. CRIAR `app/src/app/intelligence/ab-testing/page.tsx`:
   - Lista de testes com cards (nome, status badge, target segment, variantes count)
   - Botao "New A/B Test" abre wizard
   - Clique em teste running/completed abre dashboard de resultados

2. CRIAR `app/src/components/intelligence/ab-test-wizard.tsx`:
   - Step 1: Nome + Target Segment (select hot/warm/cold/all)
   - Step 2: Adicionar variantes (min 2, max 5) com campos headline, CTA, body
   - Step 3: Review e confirmar
   - Submete para POST `/api/intelligence/ab-tests`

3. CRIAR `app/src/components/intelligence/ab-test-results.tsx`:
   - Tabela de variantes: impressions, clicks, CTR, conversions, CR, revenue
   - Highlight na variante lider (maior CR)
   - Badge de significancia: verde >= 95%, amarelo 80-95%, cinza < 80%
   - Chart de barras comparativo para CR (componente simples com divs proporcionais)

4. CRIAR `app/src/components/intelligence/ab-test-card.tsx`:
   - Card resumo para lista: nome, status badge, target segment, variante count, metricas resumidas

5. Em `app/src/lib/constants.ts`:
   - ADICIONAR item ao grupo `intelligence` no NAV_GROUPS:
   ```typescript
   { id: 'ab-testing', label: 'A/B Testing', href: '/intelligence/ab-testing', icon: 'FlaskConical' }
   ```

6. Em `app/src/lib/icon-maps.ts`:
   - Verificar se `FlaskConical` esta mapeado. Se nao, ADICIONAR:
   ```typescript
   import { FlaskConical } from 'lucide-react';
   // No objeto de icones:
   FlaskConical: FlaskConical,
   ```

**Arquivos:**
- `app/src/app/intelligence/ab-testing/page.tsx` — **CRIAR**
- `app/src/components/intelligence/ab-test-wizard.tsx` — **CRIAR**
- `app/src/components/intelligence/ab-test-results.tsx` — **CRIAR**
- `app/src/components/intelligence/ab-test-card.tsx` — **CRIAR**
- `app/src/lib/constants.ts` — **MODIFICAR** (adicionar item ao NAV_GROUPS)
- `app/src/lib/icon-maps.ts` — **MODIFICAR** (adicionar FlaskConical se ausente)

**Leitura (NAO MODIFICAR):**
- `app/src/components/layout/sidebar.tsx` — referencia (sidebar consome NAV_GROUPS)
- `app/src/lib/guards/resolve-icon.ts` — referencia de icon mapping

**DTs referenciados:** DT-06 (pagina dedicada), DT-14 (FlaskConical)
**Dependencias:** S34-AB-04, S34-AB-05, S34-AB-06 (APIs existem)
**Gate Check:** S34-GATE-01 (Sim)

**AC:**
- [ ] Pagina `/intelligence/ab-testing` renderiza lista de testes
- [ ] Wizard de criacao com 3 steps funcional (nome → variantes → review)
- [ ] Variantes min 2, max 5
- [ ] Dashboard de resultados com tabela + metricas por variante
- [ ] Badge de significancia: verde >= 95%, amarelo 80-95%, cinza < 80%
- [ ] Highlight na variante lider
- [ ] Sidebar item "A/B Testing" com icone `FlaskConical` no grupo Intelligence (DT-06)
- [ ] `FlaskConical` verificado/adicionado no icon-maps (DT-14)
- [ ] `npx tsc --noEmit` = 0

---

### S34-GATE-01: Gate Check 1 — A/B Test Engine [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | Types criados | `rg "ABTest" app/src/types/ab-testing.ts` | 1+ match |
| G1-02 | CRUD helpers | `rg "createABTest" app/src/lib/firebase/ab-tests.ts` | 1+ match |
| G1-03 | Engine criado | `rg "ABTestEngine" app/src/lib/intelligence/ab-testing/engine.ts` | 1+ match |
| G1-04 | hashAssign dedicado | `rg "hashAssign" app/src/lib/intelligence/ab-testing/engine.ts` | 1+ match (DT-04, DT-12) |
| G1-05 | hashAssign NAO importa rag | `rg "rag" app/src/lib/intelligence/ab-testing/engine.ts` | 0 matches (DT-12) |
| G1-06 | Significance calc | `rg "calculateSignificance" app/src/lib/intelligence/ab-testing/significance.ts` | 1+ match (DT-05) |
| G1-07 | API CRUD | `rg "force-dynamic" app/src/app/api/intelligence/ab-tests/route.ts` | 1+ match |
| G1-08 | API assign | Verificar existencia de `app/src/app/api/intelligence/ab-tests/[testId]/assign/route.ts` | Arquivo existe |
| G1-09 | API event | Verificar existencia de `app/src/app/api/intelligence/ab-tests/[testId]/event/route.ts` | Arquivo existe |
| G1-10 | UI page | Verificar existencia de `app/src/app/intelligence/ab-testing/page.tsx` | Arquivo existe |
| G1-11 | Sidebar item | `rg "ab-testing" app/src/lib/constants.ts` | 1+ match |
| G1-12 | FlaskConical icon | `rg "FlaskConical" app/src/lib/icon-maps.ts` | 1+ match (DT-14) |
| G1-13 | Testes engine | Verificar existencia de testes | 8+ testes passando |
| G1-14 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G1-15 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-15 todos aprovados.

**AC:**
- [ ] G1-01 a G1-15 todos aprovados

---

## Fase 2: Performance por Segmento [~4-4.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S34-GATE-01 aprovado.
>
> **PRE-REQUISITO INFRA:** Firestore composite index `leads` collection — `brandId` ASC + `segment` ASC. Documentar se nao existir.
>
> **Sequencia:** SEG-01 → SEG-02 + SEG-03 + SEG-04 (paralelos) → SEG-05 → **GATE CHECK 2**
>
> **[ARCH DT-13 — BLOCKING PARA STORY PACK, RESOLVIDO]:** O SegmentBreakdown e alimentado por dados de LEADS (collection `leads`), NAO por metricas de ads. A rota `/api/performance/metrics` permanece INALTERADA.

---

### S34-SEG-01: Segment Data Query via Leads Collection [S+, ~45min]

**Objetivo:** Criar modulo de consulta de leads por segmento para alimentar o SegmentBreakdown. A rota `/api/performance/metrics` permanece INALTERADA (DT-13).

> **[ARCH DT-07 — NON-BLOCKING, RESOLVIDO]:** Approach hibrido. SegmentBreakdown usa dados de leads. 3 queries paralelas (hot/warm/cold).
> **[ARCH DT-13 — BLOCKING, RESOLVIDO]:** NAO extender `/api/performance/metrics`. Dados vem da collection `leads` com `where('brandId','==',brandId).where('segment','==',param)`.

**PRE-REQUISITO:** Firestore composite index na collection `leads`: `brandId` (ASC) + `segment` (ASC). Sem este index, a query falha. Documentar como acao manual no Firebase Console.

**Acao:**
1. CRIAR `app/src/lib/intelligence/ab-testing/segment-query.ts`:

```typescript
/**
 * Segment Query — Busca leads por segmento de propensity
 * Collection: leads (top-level, filtrado por brandId)
 *
 * DT-13 (BLOCKING): Dados vem de LEADS, NAO de metricas de ads.
 * DT-07: Query com where('brandId','==',brandId).where('segment','==',param)
 *
 * PRE-REQUISITO: Firestore composite index (brandId ASC + segment ASC) na collection leads.
 *
 * @module lib/intelligence/ab-testing/segment-query
 * @story S34-SEG-01
 */

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { SegmentMetrics, SegmentBreakdownData, TargetSegment } from '@/types/ab-testing';

interface LeadDoc {
  id: string;
  brandId: string;
  segment: TargetSegment;
  converted?: boolean;
  revenue?: number;
  [key: string]: unknown;
}

/**
 * Busca leads de um segmento especifico para uma marca.
 * Requer composite index: brandId ASC + segment ASC.
 */
async function getLeadsBySegment(
  brandId: string,
  segment: TargetSegment
): Promise<LeadDoc[]> {
  const colRef = collection(db, 'leads');
  const q = query(
    colRef,
    where('brandId', '==', brandId),
    where('segment', '==', segment)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as LeadDoc[];
}

/**
 * Computa metricas agregadas para um segmento.
 */
function computeSegmentMetrics(
  segment: TargetSegment,
  leads: LeadDoc[]
): SegmentMetrics {
  const totalLeads = leads.length;
  const conversions = leads.filter((l) => l.converted).length;
  const totalRevenue = leads.reduce((sum, l) => sum + (l.revenue ?? 0), 0);

  return {
    segment,
    totalLeads,
    conversions,
    totalRevenue,
    avgRevenue: totalLeads > 0 ? totalRevenue / totalLeads : 0,
    conversionRate: totalLeads > 0 ? (conversions / totalLeads) * 100 : 0,
  };
}

/**
 * Busca breakdown completo por segmento: hot, warm, cold.
 * Executa 3 queries em paralelo para performance.
 */
export async function getSegmentBreakdown(
  brandId: string
): Promise<SegmentBreakdownData> {
  const [hotLeads, warmLeads, coldLeads] = await Promise.all([
    getLeadsBySegment(brandId, 'hot'),
    getLeadsBySegment(brandId, 'warm'),
    getLeadsBySegment(brandId, 'cold'),
  ]);

  return {
    hot: computeSegmentMetrics('hot', hotLeads),
    warm: computeSegmentMetrics('warm', warmLeads),
    cold: computeSegmentMetrics('cold', coldLeads),
  };
}

/**
 * Busca metricas de um segmento especifico.
 */
export async function getSegmentMetrics(
  brandId: string,
  segment: TargetSegment
): Promise<SegmentMetrics> {
  const leads = await getLeadsBySegment(brandId, segment);
  return computeSegmentMetrics(segment, leads);
}
```

**Arquivos:**
- `app/src/lib/intelligence/ab-testing/segment-query.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/config.ts` — `db`
- `app/src/types/ab-testing.ts` — `SegmentMetrics`, `SegmentBreakdownData`

**DTs referenciados:** DT-07 (query strategy), DT-13 (BLOCKING — dados de leads, nao ads)
**Dependencias:** S34-AB-01 (types)
**Gate Check:** S34-GATE-02 (Sim)

**AC:**
- [ ] `getSegmentBreakdown(brandId)` retorna `{ hot, warm, cold }` com metricas
- [ ] `getSegmentMetrics(brandId, segment)` retorna metricas de um segmento
- [ ] Query usa `where('brandId','==',brandId).where('segment','==',param)` (DT-13)
- [ ] 3 queries executadas em paralelo com `Promise.all` (DT-07)
- [ ] Rota `/api/performance/metrics` NAO modificada (DT-13 BLOCKING)
- [ ] Composite index documentado como pre-requisito
- [ ] ZERO `any` (P-01)
- [ ] `npx tsc --noEmit` = 0

---

### S34-SEG-02: SegmentFilter + SegmentBreakdown Components [M, ~1.5h]

**Objetivo:** Criar componentes visuais para filtro por segmento e breakdown comparativo.

**Acao:**
1. CRIAR `app/src/components/performance/segment-filter.tsx`:
   - Select com opcoes: All (default), Hot, Warm, Cold
   - Props: `value: TargetSegment | 'all'`, `onChange`
   - Estilo consistente com selects existentes

2. CRIAR `app/src/components/performance/segment-breakdown.tsx`:
   - 3 cards lado a lado: Hot, Warm, Cold
   - Cada card mostra: total leads, conversions, avg revenue, conversion rate
   - Cores: Hot (vermelho/laranja), Warm (amarelo), Cold (azul)
   - Props: `data: SegmentBreakdownData`, `loading?: boolean`

**Arquivos:**
- `app/src/components/performance/segment-filter.tsx` — **CRIAR**
- `app/src/components/performance/segment-breakdown.tsx` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S34-AB-01 (types — SegmentBreakdownData)
**Gate Check:** S34-GATE-02 (Sim)

**AC:**
- [ ] SegmentFilter renderiza select com All/Hot/Warm/Cold
- [ ] SegmentBreakdown renderiza 3 cards comparativos
- [ ] Cores: Hot=vermelho/laranja, Warm=amarelo, Cold=azul
- [ ] Dados de leads (NAO de ads) — DT-13
- [ ] `npx tsc --noEmit` = 0

---

### S34-SEG-03: Hook `useSegmentPerformance` [S, ~45min]

**Objetivo:** Criar hook que busca dados de segmento via `getSegmentBreakdown()` com SWR pattern (revalidacao a cada 60s).

**Acao:**
1. CRIAR `app/src/lib/hooks/use-segment-performance.ts`:

```typescript
/**
 * Hook useSegmentPerformance
 * Busca breakdown de metricas por segmento (hot/warm/cold).
 * SWR pattern com revalidacao a cada 60s.
 *
 * @story S34-SEG-03
 */

import { useState, useEffect, useCallback } from 'react';
import type { SegmentBreakdownData, TargetSegment } from '@/types/ab-testing';

interface UseSegmentPerformanceReturn {
  breakdown: SegmentBreakdownData | null;
  loading: boolean;
  error: string | null;
  selectedSegment: TargetSegment | 'all';
  setSelectedSegment: (segment: TargetSegment | 'all') => void;
  refresh: () => void;
}

export function useSegmentPerformance(brandId: string | null): UseSegmentPerformanceReturn {
  const [breakdown, setBreakdown] = useState<SegmentBreakdownData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<TargetSegment | 'all'>('all');

  const fetchBreakdown = useCallback(async () => {
    if (!brandId) return;
    setLoading(true);
    setError(null);

    try {
      const { getSegmentBreakdown } = await import('@/lib/intelligence/ab-testing/segment-query');
      const data = await getSegmentBreakdown(brandId);
      setBreakdown(data);
    } catch (err) {
      console.error('[useSegmentPerformance] Error:', err);
      setError('Failed to load segment data');
    } finally {
      setLoading(false);
    }
  }, [brandId]);

  useEffect(() => {
    fetchBreakdown();
    const interval = setInterval(fetchBreakdown, 60_000); // SWR: 60s revalidation
    return () => clearInterval(interval);
  }, [fetchBreakdown]);

  return {
    breakdown,
    loading,
    error,
    selectedSegment,
    setSelectedSegment,
    refresh: fetchBreakdown,
  };
}
```

**Arquivos:**
- `app/src/lib/hooks/use-segment-performance.ts` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S34-SEG-01 (segment-query)
**Gate Check:** S34-GATE-02 (Sim)

**AC:**
- [ ] Hook exportado com retorno tipado
- [ ] SWR pattern com revalidacao a cada 60s
- [ ] State: breakdown, loading, error, selectedSegment
- [ ] `npx tsc --noEmit` = 0

---

### S34-SEG-04: PerformanceAdvisor Extension — Segment Insights [S+, ~45min]

**Objetivo:** Extender o `PerformanceAdvisor` para aceitar parametro opcional `segmentData?` e gerar insights comparativos entre segmentos via Gemini.

> **[ARCH DT-08 — NON-BLOCKING, RESOLVIDO]:** Inject no prompt existente. Parametro opcional. Backward-compatible. Single Gemini call (ZERO dual-call).

**Acao:**
1. Em `app/src/lib/performance/engine/performance-advisor.ts`:
   - ADICIONAR parametro opcional `segmentData?: SegmentBreakdownData` em `generateInsights()`
   - Passar para o prompt builder

2. Em `app/src/lib/ai/prompts/performance-advisor.ts`:
   - ADICIONAR parametro opcional `segmentData?` em `buildPerformanceAdvisorPrompt()`
   - Adicionar bloco condicional no prompt:

```typescript
const segmentSection = segmentData ? `
### Breakdown por Segmento de Propensity:
- HOT (alta probabilidade de conversao): ${segmentData.hot.totalLeads} leads, CR: ${segmentData.hot.conversionRate.toFixed(1)}%, Revenue medio: $${segmentData.hot.avgRevenue.toFixed(2)}
- WARM (probabilidade media): ${segmentData.warm.totalLeads} leads, CR: ${segmentData.warm.conversionRate.toFixed(1)}%, Revenue medio: $${segmentData.warm.avgRevenue.toFixed(2)}
- COLD (baixa probabilidade): ${segmentData.cold.totalLeads} leads, CR: ${segmentData.cold.conversionRate.toFixed(1)}%, Revenue medio: $${segmentData.cold.avgRevenue.toFixed(2)}

Inclua insights comparativos entre segmentos nas recomendacoes. Identifique oportunidades de escala em segmentos subotimizados.
` : '';
```

**Arquivos:**
- `app/src/lib/performance/engine/performance-advisor.ts` — **MODIFICAR** (parametro segmentData)
- `app/src/lib/ai/prompts/performance-advisor.ts` — **MODIFICAR** (secao segment no prompt)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/gemini.ts` — generateWithGemini

**DTs referenciados:** DT-08 (inject no prompt existente, backward-compatible)
**Dependencias:** S34-SEG-01 (segment data)
**Gate Check:** S34-GATE-02 (Sim)

**AC:**
- [ ] `generateInsights()` aceita parametro opcional `segmentData?` (backward-compatible)
- [ ] `buildPerformanceAdvisorPrompt()` aceita parametro opcional `segmentData?`
- [ ] Quando segmentData presente: prompt inclui secao com metricas Hot/Warm/Cold
- [ ] Quando segmentData ausente: prompt identico ao anterior (zero breaking change)
- [ ] Single Gemini call (ZERO dual-call — DT-08)
- [ ] `npx tsc --noEmit` = 0

---

### S34-SEG-05: UI Integration na Pagina Performance [S, ~30min]

**Objetivo:** Integrar SegmentFilter e SegmentBreakdown na pagina Performance existente.

**Acao:**
1. Em `app/src/app/performance/page.tsx`:
   - ADICIONAR import de `SegmentFilter`, `SegmentBreakdown`, `useSegmentPerformance`
   - ADICIONAR SegmentFilter no topo (abaixo do header, acima das metricas de ads)
   - ADICIONAR SegmentBreakdown como secao nova abaixo do War Room existente
   - Quando segmentData disponivel: passar para PerformanceAdvisor

**Arquivos:**
- `app/src/app/performance/page.tsx` — **MODIFICAR** (integrar components)

**DTs referenciados:** Nenhum
**Dependencias:** S34-SEG-02, S34-SEG-03, S34-SEG-04
**Gate Check:** S34-GATE-02 (Sim)

**AC:**
- [ ] SegmentFilter renderiza no topo do Performance
- [ ] SegmentBreakdown renderiza 3 cards (Hot, Warm, Cold) com dados de leads
- [ ] War Room existente NAO afetado (zero breaking change)
- [ ] Insights do Advisor incluem comparacao entre segmentos (quando dados disponiveis)
- [ ] `npx tsc --noEmit` = 0

---

### S34-GATE-02: Gate Check 2 — Performance por Segmento [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | Segment query criado | `rg "getSegmentBreakdown" app/src/lib/intelligence/ab-testing/segment-query.ts` | 1+ match |
| G2-02 | Query usa leads (NAO ads) | `rg "collection.*leads" app/src/lib/intelligence/ab-testing/segment-query.ts` | 1+ match (DT-13) |
| G2-03 | Performance metrics INALTERADA | Verificar que `/api/performance/metrics/route.ts` NAO tem param `segment` | 0 matches para "segment" como query param novo |
| G2-04 | SegmentFilter criado | Verificar existencia de `app/src/components/performance/segment-filter.tsx` | Arquivo existe |
| G2-05 | SegmentBreakdown criado | Verificar existencia de `app/src/components/performance/segment-breakdown.tsx` | Arquivo existe |
| G2-06 | Hook criado | `rg "useSegmentPerformance" app/src/lib/hooks/use-segment-performance.ts` | 1+ match |
| G2-07 | Advisor extension | `rg "segmentData" app/src/lib/performance/engine/performance-advisor.ts` | 1+ match (DT-08) |
| G2-08 | Prompt extension | `rg "segmentData" app/src/lib/ai/prompts/performance-advisor.ts` | 1+ match |
| G2-09 | UI integration | `rg "SegmentBreakdown" app/src/app/performance/page.tsx` | 1+ match |
| G2-10 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G2-11 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 3 so inicia se G2-01 a G2-11 todos aprovados.

**AC:**
- [ ] G2-01 a G2-11 todos aprovados

---

## Fase 3: Auto-Optimization [~4.5-5.5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S34-GATE-02 aprovado.
>
> **Sequencia:** AO-01 + AO-02 (paralelos) → AO-03 → AO-04 → **GATE CHECK 3**
>
> **DT-11 (BLOCKING):** `getKillSwitchState(brandId)` NAO EXISTE. DEVE ser criado em AO-02 ANTES de AO-01 usar.

---

### S34-AO-01: AutoOptimizer Engine + OptimizationDecision Type [L, ~2h]

**Objetivo:** Criar motor de auto-optimization que avalia variantes e toma decisoes de pausar losers, declarar winners, e early stop.

> **[ARCH DT-09 — NON-BLOCKING, RESOLVIDO]:** Constants com override opcional. `MIN_IMPRESSIONS_FOR_DECISION = 100`, `SIGNIFICANCE_THRESHOLD = 0.95`, `LOSER_CR_RATIO = 0.5`, `EARLY_STOP_IMPRESSIONS = 500`.
> **[ARCH DT-10 — NON-BLOCKING, RESOLVIDO]:** Subcollection `optimization_log`. Append-only.

**Acao:**
1. CRIAR `app/src/lib/intelligence/ab-testing/auto-optimizer.ts`:

```typescript
/**
 * Auto-Optimizer Engine — Avalia variantes e toma decisoes automaticas
 *
 * Regras:
 * - Pause Loser: CR < 50% do lider E impressions >= 100
 * - Declare Winner: significancia >= 95% E impressions >= 200
 * - Early Stop: 0 conversoes apos 500 impressoes
 *
 * DT-09: Constants com override opcional no ABTest type.
 * DT-10: Decisoes persistidas em subcollection optimization_log.
 * PB-03: ZERO decisao sem >= 100 impressoes.
 * PB-04: ZERO execucao se Kill-Switch ativo — log-only mode.
 *
 * @module lib/intelligence/ab-testing/auto-optimizer
 * @story S34-AO-01
 */

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { getABTest, updateABTest } from '@/lib/firebase/ab-tests';
import { calculateSignificance } from './significance';
import { ABTestEngine } from './engine';
import type {
  ABTest,
  ABTestVariant,
  OptimizationDecision,
  OptimizationAction,
} from '@/types/ab-testing';

// === Constants (DT-09: defaults, override via ABTest fields) ===
const MIN_IMPRESSIONS_FOR_DECISION = 100;
const SIGNIFICANCE_THRESHOLD = 0.95;
const LOSER_CR_RATIO = 0.5;
const EARLY_STOP_IMPRESSIONS = 500;

export class AutoOptimizer {
  /**
   * Avalia um teste e retorna lista de decisoes.
   * NAO executa se Kill-Switch ativo (PB-04).
   *
   * @param brandId - ID da marca
   * @param testId - ID do teste
   * @param killSwitchActive - Estado do Kill-Switch (de getKillSwitchState)
   */
  static async evaluate(
    brandId: string,
    testId: string,
    killSwitchActive: boolean
  ): Promise<OptimizationDecision[]> {
    const test = await getABTest(brandId, testId);
    if (!test) throw new Error('AB Test not found');
    if (test.status !== 'running') throw new Error('Test is not running');
    if (!test.autoOptimize) throw new Error('Auto-optimize is disabled for this test');

    // DT-09: Override de thresholds
    const minImpressions = test.minImpressionsForDecision ?? MIN_IMPRESSIONS_FOR_DECISION;
    const sigThreshold = test.significanceThreshold ?? SIGNIFICANCE_THRESHOLD;

    const decisions: OptimizationDecision[] = [];
    const activeVariants = test.variants.filter((v) => v.weight > 0);

    if (activeVariants.length < 2) {
      return decisions; // Nada a comparar
    }

    // Encontrar lider (maior CR)
    const leader = activeVariants.reduce((best, v) => {
      const bestCR = best.impressions > 0 ? best.conversions / best.impressions : 0;
      const vCR = v.impressions > 0 ? v.conversions / v.impressions : 0;
      return vCR > bestCR ? v : best;
    });

    const leaderCR = leader.impressions > 0 ? leader.conversions / leader.impressions : 0;

    for (const variant of activeVariants) {
      if (variant.id === leader.id) continue;

      const vCR = variant.impressions > 0 ? variant.conversions / variant.impressions : 0;

      // Regra 3: Early Stop — 0 conversoes apos 500 impressoes
      if (variant.conversions === 0 && variant.impressions >= EARLY_STOP_IMPRESSIONS) {
        decisions.push(AutoOptimizer.createDecision(
          testId, variant.id, 'early_stop',
          `Zero conversions after ${variant.impressions} impressions`,
          variant, undefined
        ));
        continue;
      }

      // PB-03: ZERO decisao sem >= minImpressions
      if (variant.impressions < minImpressions) continue;

      // Regra 1: Pause Loser — CR < 50% do lider
      if (leaderCR > 0 && vCR < leaderCR * LOSER_CR_RATIO) {
        decisions.push(AutoOptimizer.createDecision(
          testId, variant.id, 'pause_variant',
          `CR ${(vCR * 100).toFixed(1)}% < 50% of leader CR ${(leaderCR * 100).toFixed(1)}%`,
          variant, undefined
        ));
        continue;
      }
    }

    // Regra 2: Declare Winner — significancia >= threshold
    if (activeVariants.length >= 2 &&
        leader.impressions >= minImpressions * 2) {
      // Comparar lider com segundo melhor
      const others = activeVariants.filter((v) => v.id !== leader.id);
      for (const other of others) {
        if (other.impressions < minImpressions) continue;
        const sig = calculateSignificance(
          { conversions: leader.conversions, impressions: leader.impressions },
          { conversions: other.conversions, impressions: other.impressions },
          sigThreshold
        );

        if (sig.isSignificant) {
          decisions.push(AutoOptimizer.createDecision(
            testId, leader.id, 'declare_winner',
            `Significance ${(sig.significance * 100).toFixed(1)}% >= ${(sigThreshold * 100)}% (vs variant ${other.id})`,
            leader, sig.significance
          ));
          break; // Uma vez declarado winner, nao precisa comparar com outros
        }
      }
    }

    // Se nenhuma decisao: continue para todas as variantes
    if (decisions.length === 0) {
      decisions.push(AutoOptimizer.createDecision(
        testId, leader.id, 'continue',
        'Insufficient data for decision',
        leader, undefined
      ));
    }

    // Aplicar decisoes (ou apenas logar se Kill-Switch ativo)
    for (const decision of decisions) {
      decision.executed = !killSwitchActive; // PB-04

      // Persistir em optimization_log (DT-10: append-only)
      await AutoOptimizer.logDecision(brandId, testId, decision);

      // Executar apenas se Kill-Switch NAO ativo
      if (!killSwitchActive) {
        await AutoOptimizer.executeDecision(brandId, testId, test, decision);
      }
    }

    return decisions;
  }

  /**
   * Cria um OptimizationDecision.
   */
  private static createDecision(
    testId: string,
    variantId: string,
    action: OptimizationAction,
    reason: string,
    variant: ABTestVariant,
    significance: number | undefined
  ): OptimizationDecision {
    return {
      testId,
      variantId,
      action,
      reason,
      metrics: {
        impressions: variant.impressions,
        conversions: variant.conversions,
        cr: variant.impressions > 0 ? variant.conversions / variant.impressions : 0,
        significance,
      },
      executed: true, // Default true, sera false se Kill-Switch ativo
      timestamp: Timestamp.now(),
    };
  }

  /**
   * Persiste decisao no optimization_log (subcollection append-only — DT-10).
   */
  private static async logDecision(
    brandId: string,
    testId: string,
    decision: OptimizationDecision
  ): Promise<void> {
    const logRef = collection(
      db, 'brands', brandId, 'ab_tests', testId, 'optimization_log'
    );
    await addDoc(logRef, decision);
  }

  /**
   * Executa a decisao: pausa variante, declara winner, ou early stop.
   */
  private static async executeDecision(
    brandId: string,
    testId: string,
    test: ABTest,
    decision: OptimizationDecision
  ): Promise<void> {
    switch (decision.action) {
      case 'pause_variant':
      case 'early_stop': {
        // Setar weight da variante para 0 (pausar)
        const updatedVariants = test.variants.map((v) =>
          v.id === decision.variantId ? { ...v, weight: 0 } : v
        );
        await updateABTest(brandId, testId, { variants: updatedVariants });
        break;
      }
      case 'declare_winner': {
        await ABTestEngine.completeTest(
          brandId,
          testId,
          decision.variantId,
          decision.metrics.significance
        );
        break;
      }
      case 'continue':
        // Noop
        break;
    }
  }

  /**
   * Busca historico de decisoes de optimization.
   */
  static async getOptimizationLog(
    brandId: string,
    testId: string,
    maxEntries: number = 50
  ): Promise<OptimizationDecision[]> {
    const logRef = collection(
      db, 'brands', brandId, 'ab_tests', testId, 'optimization_log'
    );
    const q = query(logRef, orderBy('timestamp', 'desc'), firestoreLimit(maxEntries));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as OptimizationDecision[];
  }
}
```

2. CRIAR testes em `app/src/__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts`:
   - Teste (1): Pause Loser — variante com CR < 50% do lider + >= 100 impressions → pause_variant
   - Teste (2): Declare Winner — significancia >= 95% → declare_winner
   - Teste (3): Early Stop — 0 conversoes apos 500 impressions → early_stop
   - Teste (4): Kill-Switch ativo → decisoes logadas mas executed = false (PB-04)
   - Teste (5): Continue — dados insuficientes → continue
   - Teste (6): Auto-optimize disabled → erro
   - Mock de firebase/firestore, ab-tests, engine, significance

**Arquivos:**
- `app/src/lib/intelligence/ab-testing/auto-optimizer.ts` — **CRIAR**
- `app/src/__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` — **CRIAR**

**DTs referenciados:** DT-09 (constants override), DT-10 (subcollection log)
**Dependencias:** S34-AB-03 (engine + significance), S34-AO-02 (getKillSwitchState — para chamador)
**Gate Check:** S34-GATE-03 (Sim)

**AC:**
- [ ] `AutoOptimizer.evaluate(brandId, testId, killSwitchActive)` exportado
- [ ] Regra 1: Pause Loser (CR < 50% do lider + >= minImpressions)
- [ ] Regra 2: Declare Winner (significancia >= threshold)
- [ ] Regra 3: Early Stop (0 conversoes apos 500 impressoes)
- [ ] Constants com override via campos do ABTest (DT-09)
- [ ] Decisions persistidas em subcollection `optimization_log` (DT-10, append-only)
- [ ] Kill-Switch ativo → `executed: false` em todas as decisoes (PB-04)
- [ ] PB-03: ZERO decisao sem >= 100 impressoes
- [ ] 6+ testes passando
- [ ] `npx tsc --noEmit` = 0

---

### S34-AO-02: Kill-Switch State + Automation Log Integration [M, ~1h]

**Objetivo:** CRIAR a funcao `getKillSwitchState(brandId)` que NAO EXISTE no codebase (DT-11 BLOCKING). Adicionar campo `killSwitchState` no Brand type. Integrar com automation_logs para historico.

> **[ARCH DT-11 — BLOCKING, RESOLVIDO]:** Campo `killSwitchState?: { active: boolean; activatedAt?: Timestamp; reason?: string }` no Brand type. Helper em `lib/firebase/automation.ts`. Leitura via `getBrand(brandId)` existente.

**Acao:**
1. Em `app/src/types/database.ts`:
   - ADICIONAR campo opcional no Brand type:

```typescript
// No interface Brand, adicionar:
killSwitchState?: {
  active: boolean;
  activatedAt?: Timestamp;
  reason?: string;
};
```

2. Em `app/src/lib/firebase/automation.ts`:
   - ADICIONAR funcoes:

```typescript
/**
 * Retorna o estado do Kill-Switch para uma marca.
 * Le o campo killSwitchState do documento da brand.
 *
 * DT-11 (BLOCKING): Esta funcao NAO EXISTIA antes da S34.
 * Prerequisito para PB-04 (ZERO auto-optimization se Kill-Switch ativo).
 *
 * @param brandId - ID da marca
 * @returns boolean — true se Kill-Switch ativo
 */
export async function getKillSwitchState(brandId: string): Promise<boolean> {
  try {
    const { getBrand } = await import('@/lib/firebase/firestore');
    const brand = await getBrand(brandId);
    return brand?.killSwitchState?.active ?? false;
  } catch (error) {
    console.error('[Automation] Failed to get kill-switch state:', error);
    return false; // Fail-open: se nao conseguir ler, assume desligado
  }
}

/**
 * Atualiza o estado do Kill-Switch para uma marca.
 */
export async function setKillSwitchState(
  brandId: string,
  active: boolean,
  reason?: string
): Promise<void> {
  const { doc, updateDoc, Timestamp } = await import('firebase/firestore');
  const { db } = await import('@/lib/firebase/config');

  const brandRef = doc(db, 'brands', brandId);
  await updateDoc(brandRef, {
    killSwitchState: {
      active,
      activatedAt: active ? Timestamp.now() : null,
      reason: reason ?? null,
    },
  });
}
```

3. Integrar com automation_logs: cada acao de auto-optimization ja gera entry via `AutoOptimizer.logDecision()`. Adicionalmente, registrar no `automation_logs` para visibilidade no ControlCenter:

```typescript
// Em auto-optimizer.ts, apos logDecision(), adicionar:
import { createAutomationLog } from '@/lib/firebase/automation';

// Dentro de evaluate(), apos o loop de decisions:
if (decisions.some(d => d.action !== 'continue')) {
  await createAutomationLog(brandId, {
    type: 'ab_optimization',
    action: decisions.map(d => `${d.action}: variant ${d.variantId}`).join(', '),
    details: { testId, decisions: decisions.length, killSwitchActive },
    timestamp: Timestamp.now(),
  });
}
```

**Arquivos:**
- `app/src/types/database.ts` — **MODIFICAR** (adicionar killSwitchState no Brand)
- `app/src/lib/firebase/automation.ts` — **MODIFICAR** (adicionar getKillSwitchState, setKillSwitchState)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/firestore.ts` — `getBrand()` (usa para ler killSwitchState)

**DTs referenciados:** DT-11 (BLOCKING — criar funcao inexistente)
**Dependencias:** Nenhuma (prerequisito para AO-01 usar)
**Gate Check:** S34-GATE-03 (Sim)

**AC:**
- [ ] `killSwitchState?: { active: boolean; activatedAt?: Timestamp; reason?: string }` no Brand type (DT-11)
- [ ] `getKillSwitchState(brandId)` exportado de `lib/firebase/automation.ts`
- [ ] `setKillSwitchState(brandId, active, reason?)` exportado
- [ ] `getKillSwitchState` retorna `false` se campo nao existe (backward-compatible)
- [ ] Automation log com type `ab_optimization` para visibilidade no ControlCenter
- [ ] ZERO `Date` (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S34-AO-03: API `/api/intelligence/ab-tests/[testId]/optimize/` [S, ~30min]

**Objetivo:** Criar rota de trigger de optimization (manual ou automatico).

**Acao:**
1. CRIAR `app/src/app/api/intelligence/ab-tests/[testId]/optimize/route.ts`:
   - `POST` — Body: `{ brandId }`
   - Busca estado do Kill-Switch via `getKillSwitchState(brandId)`
   - Chama `AutoOptimizer.evaluate(brandId, testId, killSwitchActive)`
   - Retorna lista de `OptimizationDecision[]`
   - Apenas testes com `autoOptimize: true` e status `running`

**Arquivos:**
- `app/src/app/api/intelligence/ab-tests/[testId]/optimize/route.ts` — **CRIAR**

**DTs referenciados:** DT-11 (usa getKillSwitchState)
**Dependencias:** S34-AO-01 (AutoOptimizer), S34-AO-02 (getKillSwitchState)
**Gate Check:** S34-GATE-03 (Sim)

**AC:**
- [ ] POST aceita `{ brandId }` e retorna `OptimizationDecision[]`
- [ ] Busca Kill-Switch state antes de executar (PB-04)
- [ ] Apenas testes com `autoOptimize: true` e status `running`
- [ ] `force-dynamic` + `requireBrandAccess` + `createApiError`/`Success`
- [ ] `npx tsc --noEmit` = 0

---

### S34-AO-04: UI Auto-Optimization [M, ~1.5h]

**Objetivo:** Adicionar funcionalidades de auto-optimization na pagina A/B Testing.

**Acao:**
1. Na pagina `/intelligence/ab-testing/page.tsx` (criada em AB-07):
   - Ao expandir um teste: toggle "Auto-Optimize" (liga/desliga flag `autoOptimize`)
   - Historico de decisoes automaticas (timeline com acao + motivo + timestamp)
   - Botao "Run Optimization Now" para trigger manual (POST `/api/intelligence/ab-tests/[testId]/optimize/`)
   - Badge "Auto" (azul) no card quando `autoOptimize: true`

2. A timeline de historico busca do `optimization_log` subcollection via `AutoOptimizer.getOptimizationLog()`.

3. Decisoes com `executed: false` mostram badge "Kill-Switch" (vermelho) indicando que foram logadas mas nao executadas.

**Arquivos:**
- `app/src/app/intelligence/ab-testing/page.tsx` — **MODIFICAR** (adicionar auto-opt UI)
- `app/src/components/intelligence/ab-test-results.tsx` — **MODIFICAR** (adicionar timeline + toggle)

**DTs referenciados:** Nenhum
**Dependencias:** S34-AO-03 (API optimize)
**Gate Check:** S34-GATE-03 (Sim)

**AC:**
- [ ] Toggle "Auto-Optimize" funcional (liga/desliga flag no teste)
- [ ] Badge "Auto" (azul) no card quando autoOptimize ativo
- [ ] Timeline de historico mostra decisoes com acao + motivo + timestamp
- [ ] Botao "Run Optimization Now" chama API optimize
- [ ] Decisoes com `executed: false` tem badge "Kill-Switch" (vermelho)
- [ ] `npx tsc --noEmit` = 0

---

### S34-GATE-03: Gate Check 3 — Auto-Optimization [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G3-01 | AutoOptimizer criado | `rg "AutoOptimizer" app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | 1+ match |
| G3-02 | Constants definidos | `rg "MIN_IMPRESSIONS_FOR_DECISION" app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | 1+ match (DT-09) |
| G3-03 | optimization_log subcollection | `rg "optimization_log" app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | 1+ match (DT-10) |
| G3-04 | getKillSwitchState criado | `rg "getKillSwitchState" app/src/lib/firebase/automation.ts` | 1+ match (DT-11) |
| G3-05 | killSwitchState no Brand type | `rg "killSwitchState" app/src/types/database.ts` | 1+ match (DT-11) |
| G3-06 | Kill-Switch respect | `rg "killSwitchActive" app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | 1+ match (PB-04) |
| G3-07 | API optimize | `rg "force-dynamic" app/src/app/api/intelligence/ab-tests/[testId]/optimize/route.ts` | 1+ match |
| G3-08 | Automation log integration | `rg "ab_optimization" app/src/lib/intelligence/ab-testing/auto-optimizer.ts` | 1+ match |
| G3-09 | Testes auto-optimizer | Verificar existencia de testes | 6+ testes passando |
| G3-10 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G3-11 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 4 so inicia se G3-01 a G3-11 todos aprovados.

**AC:**
- [ ] G3-01 a G3-11 todos aprovados

---

## Fase 4: Governanca Final [~0.5h]

> **PRE-REQUISITO ABSOLUTO:** S34-GATE-03 aprovado.

---

### S34-GOV-03: Atualizar contract-map.yaml [XS, ~15min]

**Objetivo:** Registrar nova lane `ab_testing_optimization` no `contract-map.yaml`.

**Acao:**
1. Em `_netecmt/core/contract-map.yaml`, ADICIONAR nova lane:

```yaml
ab_testing_optimization:
  paths:
    - "app/src/lib/intelligence/ab-testing/**"               # S34-AB-03, S34-AO-01
    - "app/src/lib/firebase/ab-tests.ts"                     # S34-AB-02
    - "app/src/app/api/intelligence/ab-tests/**"             # S34-AB-04/05/06, S34-AO-03
    - "app/src/app/intelligence/ab-testing/**"               # S34-AB-07
    - "app/src/components/intelligence/ab-test-*.tsx"         # S34-AB-07
    - "app/src/components/performance/segment-*.tsx"          # S34-SEG-02
    - "app/src/lib/hooks/use-segment-performance.ts"         # S34-SEG-03
    - "app/src/lib/content/engagement-scorer.ts"             # S34-GOV-02
    - "app/src/types/ab-testing.ts"                          # S34-AB-01
  contract: "_netecmt/contracts/ab-testing-optimization-spec.md"
```

**Arquivos:**
- `_netecmt/core/contract-map.yaml` — **MODIFICAR**

**DTs referenciados:** Nenhum
**Dependencias:** S34-GATE-03 aprovado
**Gate Check:** Nao

**AC:**
- [ ] Lane `ab_testing_optimization` criada com 9 paths
- [ ] Zero erro de parse YAML
- [ ] Zero conflito com lanes existentes

---

### S34-GOV-04: ACTIVE_SPRINT.md + ROADMAP.md [XS, ~15min]

**Objetivo:** Atualizar documentos de sprint com resultado final.

**Acao:**
1. Em `_netecmt/sprints/ACTIVE_SPRINT.md`:
   - Atualizar status de todas as fases e stories para CONCLUIDO
   - Atualizar milestones
   - Registrar metricas finais

2. Em `_netecmt/ROADMAP.md`:
   - Registrar S34 com features entregues

**Arquivos:**
- `_netecmt/sprints/ACTIVE_SPRINT.md` — **MODIFICAR**
- `_netecmt/ROADMAP.md` — **MODIFICAR**

**DTs referenciados:** Nenhum
**Dependencias:** S34-GOV-03 concluido
**Gate Check:** Nao

**AC:**
- [ ] ACTIVE_SPRINT.md reflete S34 com metricas finais
- [ ] ROADMAP.md tem entrada S34 com features entregues

---

## Testes Recomendados (Novos — Dandara)

> **Todos os testes de Firestore devem usar mocks de `firebase/firestore` (via `jest.mock()`). NUNCA chamar Firestore real em testes automatizados.**

| # | Teste | Tipo | Arquivo Sugerido | Story |
|:--|:------|:-----|:----------------|:------|
| T-01 | `hashAssign` deterministico (mesmo input = mesmo output) | Unit | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-02 | `hashAssign` distribuicao uniforme (2-5 variantes) | Unit | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-03 | `hashAssign` separador `:` nao colide | Unit | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-04 | `calculateSignificance` dados conhecidos | Unit | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-05 | `calculateSignificance` sample < 30 | Unit | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-06 | `calculateSignificance` impressoes < 100 | Unit | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-07 | `assignVariant` mesma variante para mesmo lead | Unit (mock) | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-08 | `startTest` muda status draft→running | Unit (mock) | `__tests__/lib/intelligence/ab-testing/engine.test.ts` | AB-03 |
| T-09 | Pause Loser: CR < 50% + >= 100 impressions | Unit (mock) | `__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | AO-01 |
| T-10 | Declare Winner: significancia >= 95% | Unit (mock) | `__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | AO-01 |
| T-11 | Early Stop: 0 conversoes apos 500 impressions | Unit (mock) | `__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | AO-01 |
| T-12 | Kill-Switch ativo: executed = false | Unit (mock) | `__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | AO-01 |
| T-13 | Continue: dados insuficientes | Unit (mock) | `__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | AO-01 |
| T-14 | Auto-optimize disabled: erro | Unit (mock) | `__tests__/lib/intelligence/ab-testing/auto-optimizer.test.ts` | AO-01 |

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 2 Blocking DTs compreendidos:
  - [ ] **DT-11**: `getKillSwitchState()` NAO EXISTE — criar em S34-AO-02 ANTES da Fase 3
  - [ ] **DT-13**: SegmentBreakdown usa LEADS, NAO ads. Rota performance INALTERADA.
- [ ] Confirmar pre-requisito infra: composite index `leads` (brandId + segment)
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-S33)
- [ ] Confirmar testes passando (baseline 286/286)

### Validacoes incrementais — Fase 0:
- [ ] Apos GOV-01: cleanup adicionado nos 2+ test files
- [ ] Apos GOV-02: engagement-scorer criado + injetado no generation-engine
- [ ] **GATE CHECK 0**: G0-01 a G0-07

### Validacoes incrementais — Fase 1:
- [ ] Apos AB-01: Types ab-testing.ts criado
- [ ] Apos AB-02: CRUD ab-tests.ts criado
- [ ] Apos AB-03: Engine + significance + hashAssign + testes
- [ ] Apos AB-04: API CRUD routes criadas
- [ ] Apos AB-05: API assign route criada
- [ ] Apos AB-06: API event route criada
- [ ] Apos AB-07: UI page + wizard + results + sidebar
- [ ] **GATE CHECK 1**: G1-01 a G1-15

### Validacoes incrementais — Fase 2:
- [ ] Apos SEG-01: segment-query.ts criado (usa leads, NAO ads)
- [ ] Apos SEG-02: SegmentFilter + SegmentBreakdown components
- [ ] Apos SEG-03: useSegmentPerformance hook
- [ ] Apos SEG-04: PerformanceAdvisor extension com segmentData
- [ ] Apos SEG-05: UI integration no Performance
- [ ] **GATE CHECK 2**: G2-01 a G2-11

### Validacoes incrementais — Fase 3:
- [ ] Apos AO-01: AutoOptimizer engine + testes
- [ ] Apos AO-02: getKillSwitchState + killSwitchState no Brand type
- [ ] Apos AO-03: API optimize route
- [ ] Apos AO-04: UI auto-opt (toggle + history + trigger)
- [ ] **GATE CHECK 3**: G3-01 a G3-11

### Validacoes incrementais — Fase 4:
- [ ] Apos GOV-03: contract-map.yaml com lane ab_testing_optimization
- [ ] Apos GOV-04: ACTIVE_SPRINT.md + ROADMAP.md atualizados

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] Testes → 0 fail, >= 286 + novos testes (~300-310 estimado)
- [ ] Build → >= ~109 + novas rotas (~113-115 estimado)
- [ ] Zero `any`, zero `Date`, zero `@ts-ignore`
- [ ] Todas rotas novas com `force-dynamic` + `requireBrandAccess`
- [ ] Contract-map atualizado com nova lane
- [ ] killSwitchState no Brand type (DT-11)
- [ ] Composite index documentado (DT-13)

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 14 Decision Topics do Architecture Review (Athos)*
*Sprint 34: A/B Testing & Segment Optimization | 09/02/2026*
*20 stories + 4 gates | 2 Blocking DTs (DT-11, DT-13) | Estimativa: ~17-19.5h*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), S+ = Small Extended, M = Medium (2-4h), M+ = Medium Extended, L = Large (> 4h)*
