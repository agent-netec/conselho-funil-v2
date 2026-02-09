# Stories Distilled: Sprint 35 — Predictive Intelligence & Deep Research
**Preparado por:** Leticia (SM)
**Data:** 09/02/2026
**Lanes:** predictive_intelligence (nova) + deep_research (nova) + governance (cross-cutting)
**Tipo:** Feature Sprint (Predictive Intelligence & Deep Research)

> **IMPORTANTE:** Este documento incorpora os **16 Decision Topics (DTs)** e as resolucoes do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 6 blocking DTs (DT-01, DT-05, DT-07, DT-08, DT-12, DT-16) foram RESOLVIDOS e as correcoes estao embutidas nas stories.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess` (de `@/lib/auth/brand-guard`), `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`, REST puro via `fetch()` (zero SDK npm novo).

---

## Fase 0: Governanca & Backlog S34 [~2.5h + Gate]

> **Sequencia:** GOV-01, GOV-02, GOV-03, GOV-04 (paralelos — sem dependencia mutua) → **GATE CHECK 0**
>
> Esta fase resolve 3 ressalvas herdadas da S34 + 7 stubs residuais e prepara o codebase para as features da S35.

---

### S35-GOV-01: Fix `updateVariantMetrics` com `runTransaction` [S, ~30min]

**Objetivo:** Resolver ressalva CS-34.04 — envolver o update de metricas de A/B tests em `runTransaction()` para garantir atomicidade em updates concorrentes.

> **[ARCH DT-01 — BLOCKING, RESOLVIDO]:** Usar `runTransaction()` com leitura do doc e update completo das variantes + totais. `transaction.update()` com objeto completo dos campos calculados localmente. NAO usar `increment()` fora de transacao.

**Acao:**
1. Em `app/src/lib/firebase/ab-tests.ts`, refatorar `updateVariantMetrics()`:

```typescript
import {
  // ... imports existentes ...
  runTransaction,
} from 'firebase/firestore';

/**
 * Incrementa metricas de uma variante atomicamente via runTransaction.
 * DT-01 (BLOCKING): transaction lê doc, calcula novos valores, e commita atomicamente.
 * Substitui pattern anterior de increment() fora de transacao.
 *
 * @story S35-GOV-01
 * @arch DT-01
 */
export async function updateVariantMetrics(
  brandId: string,
  testId: string,
  variantId: string,
  delta: { impressions?: number; clicks?: number; conversions?: number; revenue?: number }
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'ab_tests', testId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(docRef);
    if (!snap.exists()) throw new Error('AB Test not found');

    const test = snap.data() as ABTest;

    // Calcular novos valores para variantes
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

    // Calcular novos totais
    const newTotalImpressions = (test.metrics?.totalImpressions ?? 0) + (delta.impressions ?? 0);
    const newTotalConversions = (test.metrics?.totalConversions ?? 0) + (delta.conversions ?? 0);
    const newTotalRevenue = (test.metrics?.totalRevenue ?? 0) + (delta.revenue ?? 0);

    // Commit atomico — read + update no mesmo commit
    transaction.update(docRef, {
      variants: updatedVariants,
      'metrics.totalImpressions': newTotalImpressions,
      'metrics.totalConversions': newTotalConversions,
      'metrics.totalRevenue': newTotalRevenue,
      updatedAt: Timestamp.now(),
    });
  });
}
```

**Arquivos:**
- `app/src/lib/firebase/ab-tests.ts` — **MODIFICAR** (refatorar updateVariantMetrics)

**DTs referenciados:** DT-01 (BLOCKING — runTransaction scope)
**Dependencias:** Nenhuma
**Gate Check:** S35-GATE-00 (Sim)

**AC:**
- [ ] `updateVariantMetrics` usa `runTransaction()` com read+update atomico (DT-01)
- [ ] `transaction.get()` le doc corrente dentro da transacao
- [ ] `transaction.update()` commita variantes + totais calculados localmente
- [ ] NAO usa `increment()` fora de transacao
- [ ] Backward-compatible — mesma assinatura publica
- [ ] `npx tsc --noEmit` = 0

---

### S35-GOV-02: Fix `selectedSegment` Drill-Down Propagation [M, ~1h]

**Objetivo:** Resolver ressalva CS-34.09 — propagar o estado `selectedSegment` (hot/warm/cold/all) da pagina Performance para todas as visoes filhas: SegmentBreakdown, PerformanceAdvisor insights, e Charts de metricas.

> **[ARCH DT-02 — NON-BLOCKING, RESOLVIDO]:** Prop drilling direto a partir da Performance page. Arvore pequena (~5 componentes), menos complexidade que Context dedicado. Mantem debug simples.

**Acao:**
1. Em `app/src/app/performance/page.tsx`:
   - Passar `selectedSegment` como prop para: `SegmentBreakdown` (highlight do segmento selecionado), `PerformanceAdvisor` (filtrar insights pelo segmento), `Charts de metricas` (filtrar dados pelo segmento)
   - O filtro deve ser reativo — mudar o select atualiza todas as visoes sem refetch (filtro client-side sobre dados ja carregados)

```typescript
// Em performance/page.tsx, passar selectedSegment via props:
<SegmentBreakdown
  data={breakdown}
  loading={segmentLoading}
  selectedSegment={selectedSegment}  // highlight
/>

// Filtrar insights do Advisor pelo segmento (se != 'all')
// Filtrar dados de charts pelo segmento (se != 'all')
```

**Arquivos:**
- `app/src/app/performance/page.tsx` — **MODIFICAR** (propagar selectedSegment)

**Leitura (NAO MODIFICAR):**
- `app/src/components/performance/segment-breakdown.tsx` — entender props
- `app/src/components/performance/segment-filter.tsx` — source do selectedSegment
- `app/src/lib/hooks/use-segment-performance.ts` — hook com selectedSegment state

**DTs referenciados:** DT-02 (prop drilling direto)
**Dependencias:** Nenhuma
**Gate Check:** S35-GATE-00 (Sim)

**AC:**
- [ ] `selectedSegment` propagado via props (prop drilling, NAO Context — DT-02)
- [ ] SegmentBreakdown destaca (highlight) o segmento selecionado
- [ ] PerformanceAdvisor filtra insights pelo segmento quando != 'all'
- [ ] Charts filtram dados pelo segmento quando != 'all'
- [ ] Filtro reativo — zero refetch (client-side sobre dados ja carregados)
- [ ] `npx tsc --noEmit` = 0

---

### S35-GOV-03: Timer Leak MessagePort — Mock Isolado [S, ~30min]

**Objetivo:** Resolver heranca de timer leak (S32→S33→S34). Implementar mock leve de `MessageChannel` com cleanup explicito no `jest.setup.js`.

> **[ARCH DT-03 — NON-BLOCKING, RESOLVIDO]:** Mock leve de `MessageChannel` com cleanup em `afterAll`. Manter `--forceExit` apenas como fallback documentado (`@known-issue`). O polyfill real atual (node:worker_threads) e a origem do leak.

**Acao:**
1. Em `app/jest.setup.js`:

```javascript
// === MessageChannel Mock (S35-GOV-03 — DT-03) ===
// Mock leve para evitar timer leak de node:worker_threads.
// O polyfill real era a origem do leak.

if (typeof globalThis.MessageChannel === 'undefined') {
  const ports = [];
  globalThis.MessageChannel = class MockMessageChannel {
    constructor() {
      this.port1 = { postMessage: jest.fn(), close: jest.fn(), onmessage: null };
      this.port2 = { postMessage: jest.fn(), close: jest.fn(), onmessage: null };
      ports.push(this.port1, this.port2);
    }
  };

  afterAll(() => {
    ports.forEach(p => {
      if (p.close) p.close();
    });
    ports.length = 0;
  });
}
```

2. Se warnings persistirem: documentar como `@known-issue` e manter `--forceExit`:

```javascript
// @known-issue S35: MessageChannel mock reduz mas pode nao eliminar 100% dos warnings.
// --forceExit mantido como fallback (3 sprints sem regressao).
```

**Arquivos:**
- `app/jest.setup.js` — **MODIFICAR** (substituir polyfill por mock leve)

**DTs referenciados:** DT-03 (mock vs polyfill)
**Dependencias:** Nenhuma
**Gate Check:** S35-GATE-00 (Sim)

**AC:**
- [ ] Mock leve `MessageChannel` no `jest.setup.js` com `jest.fn()` no-op ports (DT-03)
- [ ] `afterAll` com cleanup explicito (close ports, limpar array)
- [ ] `npm test` roda sem warning `worker has failed to exit gracefully` (ideal)
- [ ] Se warning persiste: documentado como `@known-issue S35` (aceitavel)
- [ ] `npx tsc --noEmit` = 0

---

### S35-GOV-04: Cleanup 7 Stubs Residuais [S, ~30min]

**Objetivo:** Resolver os 7 stubs residuais herdados de sprints anteriores. Cada stub sera implementado, documentado como `@intentional-stub`, ou removido conforme criterio do Arch Review.

> **[ARCH DT-04 — NON-BLOCKING, RESOLVIDO]:** Implement se consumer ativo; `@intentional-stub Sprint XX` se legado sem consumer; remove se dead code.

**Acao:**
1. Em `app/src/types/performance.ts` (4 stubs):
   - `PerformanceConfig.thresholds?` → documentar `/** @intentional-stub S35 — sem consumer ativo, aguarda integration com AnomalyEngine futuro */`
   - `PerformanceConfig.minDataPoints?` → documentar `/** @intentional-stub S35 — sem consumer ativo */`
   - `PerformanceMetricDoc` → documentar `/** @intentional-stub S35 — compatibilidade legada, sem consumer ativo */`
   - `PerformanceAlertDoc` → documentar `/** @intentional-stub S35 — compatibilidade legada, sem consumer ativo */`

2. Em `app/src/types/intelligence.ts` (2 stubs):
   - `SemanticSearchResult` → documentar `/** @intentional-stub S35 — placeholder para semantic search futuro */`
   - `MonitoringSource` → documentar `/** @intentional-stub S35 — placeholder para monitoring pipeline futuro */`

3. Em `app/src/lib/ai/embeddings.ts` (1 stub):
   - `cosineSimilarity` → **remover anotacao `@stub`** (funcao ja e funcional)

**Arquivos:**
- `app/src/types/performance.ts` — **MODIFICAR** (documentar 4 stubs)
- `app/src/types/intelligence.ts` — **MODIFICAR** (documentar 2 stubs)
- `app/src/lib/ai/embeddings.ts` — **MODIFICAR** (remover anotacao @stub)

**DTs referenciados:** DT-04 (criterio implement/intentional-stub/remove)
**Dependencias:** Nenhuma
**Gate Check:** S35-GATE-00 (Sim)

**AC:**
- [ ] 4 stubs em `performance.ts` documentados com `@intentional-stub S35` + justificativa (DT-04)
- [ ] 2 stubs em `intelligence.ts` documentados com `@intentional-stub S35` + justificativa (DT-04)
- [ ] `cosineSimilarity` em `embeddings.ts` sem anotacao `@stub` (ja funcional — DT-04)
- [ ] Zero stubs sem documentacao no codebase
- [ ] `npx tsc --noEmit` = 0

---

### S35-GATE-00: Gate Check 0 — Governanca [XS, ~15min] — GATE

**Objetivo:** Validar que a governanca S34 esta resolvida. **Fase 1 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G0-01 | runTransaction em updateVariantMetrics | `rg "runTransaction" app/src/lib/firebase/ab-tests.ts` | 1+ match (DT-01) |
| G0-02 | selectedSegment propagado | `rg "selectedSegment" app/src/app/performance/page.tsx` | 2+ matches (DT-02) |
| G0-03 | MessageChannel mock | `rg "MockMessageChannel" app/jest.setup.js` | 1+ match (DT-03) |
| G0-04 | Stubs documentados | `rg "@intentional-stub" app/src/types/performance.ts` | 4 matches (DT-04) |
| G0-05 | Stubs documentados | `rg "@intentional-stub" app/src/types/intelligence.ts` | 2 matches (DT-04) |
| G0-06 | cosineSimilarity sem @stub | `rg "@stub" app/src/lib/ai/embeddings.ts` | 0 matches |
| G0-07 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G0-08 | Testes passando | `npm test` | 0 fail, >= 302 passando |

**Regra ABSOLUTA:** Fase 1 so inicia se G0-01 a G0-08 todos aprovados.

**AC:**
- [ ] G0-01 a G0-08 todos aprovados
- [ ] Baseline intacto: tsc=0, testes >= 302 passando

---

## Fase 1: Churn & LTV Prediction + Forecast [~7-9h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S35-GATE-00 aprovado.
>
> **Sequencia:** PRED-01 → PRED-02 + PRED-03 (paralelos) → PRED-04 → PRED-05 → **GATE CHECK 1**
>
> Esta fase cria os 3 engines preditivos (Churn, LTV, Forecast), expande os types, cria 3 APIs, e refatora o PredictionEngine existente.

---

### S35-PRED-01: Types Expandidos (`types/predictive.ts` + `types/research.ts` NOVO) [S, ~30min]

**Objetivo:** Expandir `types/predictive.ts` com types para Churn, LTV, Forecast e Alerts. Criar arquivo NOVO `types/research.ts` para types de Deep Research.

> **[ARCH DT-05 — BLOCKING, RESOLVIDO]:** Types de Research DEVEM ir em `types/research.ts` separado. Research e dominio separado de predictive; reduz acoplamento e simplifica contract-map por lane.

**Acao:**
1. Em `app/src/types/predictive.ts`, ADICIONAR:

```typescript
// === Churn Prediction Types (S35-PRED-02) ===

export interface ChurnPrediction {
  leadId: string;
  brandId: string;
  currentSegment: 'hot' | 'warm' | 'cold';
  predictedSegment: 'hot' | 'warm' | 'cold';
  churnRisk: number; // 0-1
  riskLevel: 'critical' | 'warning' | 'safe';
  daysSinceLastEvent: number;
  engagementTrend: 'rising' | 'stable' | 'declining';
  factors: string[];
  predictedAt: Timestamp;
}

export interface ChurnBatchResult {
  brandId: string;
  totalLeads: number;
  atRisk: number;
  predictions: ChurnPrediction[];
  nextCursor?: string;   // DT-07: paginacao cursor
  hasMore: boolean;       // DT-07: flag de continuacao
  calculatedAt: Timestamp;
}

// === LTV Estimation Types (S35-PRED-03) ===

export interface LTVEstimation {
  brandId: string;
  cohortId: string;
  cohortName: string;
  segment: 'hot' | 'warm' | 'cold' | 'all';
  leadsInCohort: number;
  totalRevenue: number;
  avgRevenuePerLead: number;
  projectedLTV: {
    m1: number;
    m3: number;
    m6: number;
    m12: number;
  };
  growthMultiplier: number;
  confidenceScore: number; // 0-1
  calculatedAt: Timestamp;
}

export interface LTVBatchResult {
  brandId: string;
  cohorts: LTVEstimation[];
  overallLTV: number;
  calculatedAt: Timestamp;
}

// === LTV Config (DT-08: configurable por brand) ===

export interface LTVMultiplierConfig {
  hot: { m1: number; m3: number; m6: number; m12: number };
  warm: { m1: number; m3: number; m6: number; m12: number };
  cold: { m1: number; m3: number; m6: number; m12: number };
}

export interface PredictiveConfig {
  ltvMultipliers?: LTVMultiplierConfig;
  alertThresholds?: {
    churnImminentCount?: number;       // default 3
    upsellMultiplier?: number;         // default 2
    segmentShiftPercent?: number;      // default 20
  };
}

// === Audience Forecast Types (S35-PRED-04) ===

export interface AudienceForecast {
  brandId: string;
  currentDistribution: {
    hot: number;
    warm: number;
    cold: number;
  };
  projections: {
    days7: { hot: number; warm: number; cold: number };
    days14: { hot: number; warm: number; cold: number };
    days30: { hot: number; warm: number; cold: number };
  };
  migrationRates: {
    hotToWarm: number;
    warmToCold: number;
    coldToChurned: number;
    warmToHot: number;
    coldToWarm: number;
  };
  trendsNarrative: string; // PT-BR, gerado por Gemini
  calculatedAt: Timestamp;
}

// === Predictive Alert Types (S35-DASH-02) ===

export type PredictiveAlertType = 'churn_imminent' | 'upsell_opportunity' | 'segment_shift' | 'ltv_milestone';
export type PredictiveAlertSeverity = 'critical' | 'warning' | 'info';

export interface PredictiveAlert {
  id: string;
  brandId: string;
  type: PredictiveAlertType;
  severity: PredictiveAlertSeverity;
  title: string;
  description: string;
  data: Record<string, unknown>;
  dismissed: boolean;
  createdAt: Timestamp;
}
```

2. CRIAR `app/src/types/research.ts` (DT-05 BLOCKING — arquivo separado):

```typescript
/**
 * Deep Research Types
 * Collection: brands/{brandId}/research
 *
 * DT-05 (BLOCKING): Separado de predictive.ts — dominio diferente.
 *
 * @sprint S35
 * @story S35-PRED-01 (types), S35-RES-01 (engine)
 * @arch DT-05
 */

import { Timestamp } from 'firebase/firestore';

export type ResearchDepth = 'quick' | 'standard' | 'deep';
export type ResearchStatus = 'processing' | 'completed' | 'failed';
export type ResearchProvider = 'exa' | 'firecrawl';

export interface ResearchQuery {
  brandId: string;
  topic: string;
  marketSegment?: string;
  competitors?: string[];
  depth: ResearchDepth;
}

export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  relevanceScore: number; // 0-1
  source: ResearchProvider;
  fetchedAt: Timestamp;
}

export interface MarketDossierSections {
  marketOverview: string;
  marketSize: string;
  trends: string[];
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
  }[];
  opportunities: string[];
  threats: string[];
  recommendations: string[];
}

export interface MarketDossier {
  id: string;
  brandId: string;
  topic: string;
  status: ResearchStatus;
  sections: MarketDossierSections;
  sources: ResearchSource[];
  generatedAt: Timestamp;
  expiresAt: Timestamp; // Cache 24h
}
```

**Arquivos:**
- `app/src/types/predictive.ts` — **MODIFICAR** (expandir com Churn, LTV, Forecast, Alert types)
- `app/src/types/research.ts` — **CRIAR** (DT-05 BLOCKING — types Research separados)

**Leitura (NAO MODIFICAR):**
- `app/src/types/predictive.ts` (estado atual antes de modificar)

**DTs referenciados:** DT-05 (BLOCKING — types/research.ts separado), DT-07 (paginacao cursor nos types), DT-08 (LTVMultiplierConfig + PredictiveConfig)
**Dependencias:** S35-GATE-00 aprovado
**Gate Check:** S35-GATE-01 (Sim)

**AC:**
- [ ] `ChurnPrediction` + `ChurnBatchResult` com `nextCursor` + `hasMore` (DT-07) exportados de `predictive.ts`
- [ ] `LTVEstimation` + `LTVBatchResult` + `LTVMultiplierConfig` + `PredictiveConfig` exportados (DT-08)
- [ ] `AudienceForecast` com `trendsNarrative: string` exportado
- [ ] `PredictiveAlert` + enums exportados
- [ ] `types/research.ts` CRIADO com `ResearchQuery`, `ResearchSource`, `MarketDossier`, `MarketDossierSections` (DT-05 BLOCKING)
- [ ] ZERO types Research em `predictive.ts` (P-17)
- [ ] `Timestamp` em todos os campos de data (P-06)
- [ ] ZERO `any` (P-01)
- [ ] `npx tsc --noEmit` = 0

---

### S35-PRED-02: Churn Predictor Engine [L, ~2.5h]

**Objetivo:** Criar motor de predicao de churn baseado em recencia + engagement + inatividade progressiva. Modelo DETERMINISTICO (regras, sem IA generativa). Batch de 500 leads com paginacao cursor.

> **[ARCH DT-06 — NON-BLOCKING]:** Formula linear `daysSinceLastEvent / 30` com clamp [0,1], ajustes por trend e segmento.
> **[ARCH DT-07 — BLOCKING]:** Limite 500 por request com paginacao via cursor (`nextCursor`, `hasMore`).

**Acao:**
1. CRIAR `app/src/lib/intelligence/predictive/churn-predictor.ts`:

```typescript
/**
 * Churn Predictor Engine
 * Modelo DETERMINISTICO de predicao de churn baseado em regras.
 *
 * PB-01: ZERO chamada Gemini — modelo puro (regras, sem IA generativa).
 * PB-05: Batch limite 500 leads por request.
 * DT-06: Formula linear daysSinceLastEvent / 30 com clamp [0,1].
 * DT-07 (BLOCKING): Paginacao com cursor (nextCursor, hasMore).
 *
 * @module lib/intelligence/predictive/churn-predictor
 * @story S35-PRED-02
 */

import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { ChurnPrediction, ChurnBatchResult } from '@/types/predictive';

const BATCH_LIMIT = 500;     // DT-07: hard limit
const MIN_LEAD_AGE_HOURS = 48; // Leads < 48h excluidos (insuficiente para pattern)
const DEFAULT_HIGH_RISK = 0.8; // Lead sem eventos = alto risco

export class ChurnPredictor {
  /**
   * Prediz churn em batch para uma marca.
   * DT-07 (BLOCKING): Paginacao com cursor.
   *
   * @param brandId - ID da marca
   * @param cursor - Cursor para paginacao (ID do ultimo lead processado)
   * @returns ChurnBatchResult com predictions, nextCursor e hasMore
   */
  static async predictBatch(
    brandId: string,
    cursor?: string
  ): Promise<ChurnBatchResult> {
    const now = Timestamp.now();

    // 1. Buscar leads da marca com paginacao (DT-07)
    const leadsRef = collection(db, 'brands', brandId, 'leads');
    let leadsQuery = query(
      leadsRef,
      orderBy('__name__'),
      limit(BATCH_LIMIT + 1) // +1 para saber se hasMore
    );

    if (cursor) {
      const cursorDoc = doc(db, 'brands', brandId, 'leads', cursor);
      const cursorSnap = await getDoc(cursorDoc);
      if (cursorSnap.exists()) {
        leadsQuery = query(
          leadsRef,
          orderBy('__name__'),
          startAfter(cursorSnap),
          limit(BATCH_LIMIT + 1)
        );
      }
    }

    const leadsSnapshot = await getDocs(leadsQuery);
    const allLeads = leadsSnapshot.docs;

    // Determinar paginacao
    const hasMore = allLeads.length > BATCH_LIMIT;
    const leadsToProcess = hasMore ? allLeads.slice(0, BATCH_LIMIT) : allLeads;
    const nextCursor = hasMore ? leadsToProcess[leadsToProcess.length - 1].id : undefined;

    // 2. Para cada lead, calcular churn risk
    const predictions: ChurnPrediction[] = [];

    for (const leadDoc of leadsToProcess) {
      const leadData = leadDoc.data();
      const leadId = leadDoc.id;

      // Filtrar leads criados < 48h (insuficiente para pattern)
      const createdAt = leadData.createdAt as Timestamp | undefined;
      if (createdAt) {
        const ageMs = now.toMillis() - createdAt.toMillis();
        if (ageMs < MIN_LEAD_AGE_HOURS * 60 * 60 * 1000) continue;
      }

      const currentSegment = (leadData.segment as 'hot' | 'warm' | 'cold') || 'cold';

      // Buscar ultimo evento do lead
      const eventsRef = collection(db, 'brands', brandId, 'journey_events');
      const eventsQuery = query(
        eventsRef,
        where('leadId', '==', leadId),
        orderBy('timestamp', 'desc'),
        limit(1)
      );
      const eventsSnap = await getDocs(eventsQuery);

      let daysSinceLastEvent: number;
      if (eventsSnap.empty) {
        daysSinceLastEvent = 30; // Sem eventos → default 30 dias
      } else {
        const lastEvent = eventsSnap.docs[0].data();
        const lastTs = lastEvent.timestamp as Timestamp;
        daysSinceLastEvent = (now.toMillis() - lastTs.toMillis()) / (1000 * 60 * 60 * 24);
      }

      // Calcular engagement trend (eventos 7d vs 7-14d)
      const engagementTrend = await ChurnPredictor.calculateEngagementTrend(
        brandId, leadId, now
      );

      // Calcular churn risk (DT-06: formula linear com clamp)
      const prediction = ChurnPredictor.calculateChurnRisk(
        leadId, brandId, currentSegment, daysSinceLastEvent, engagementTrend, eventsSnap.empty, now
      );

      predictions.push(prediction);
    }

    const atRisk = predictions.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'warning').length;

    return {
      brandId,
      totalLeads: leadsToProcess.length,
      atRisk,
      predictions,
      nextCursor,    // DT-07
      hasMore,       // DT-07
      calculatedAt: now,
    };
  }

  /**
   * Calcula engagement trend baseado em contagem de eventos.
   * Ultimos 7d vs 7-14d: crescendo/estavel/declinando.
   */
  private static async calculateEngagementTrend(
    brandId: string,
    leadId: string,
    now: Timestamp
  ): Promise<'rising' | 'stable' | 'declining'> {
    const eventsRef = collection(db, 'brands', brandId, 'journey_events');
    const sevenDaysAgo = Timestamp.fromMillis(now.toMillis() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = Timestamp.fromMillis(now.toMillis() - 14 * 24 * 60 * 60 * 1000);

    // Eventos ultimos 7 dias
    const recentQuery = query(
      eventsRef,
      where('leadId', '==', leadId),
      where('timestamp', '>=', sevenDaysAgo)
    );
    const recentSnap = await getDocs(recentQuery);
    const recentCount = recentSnap.size;

    // Eventos 7-14 dias atras
    const olderQuery = query(
      eventsRef,
      where('leadId', '==', leadId),
      where('timestamp', '>=', fourteenDaysAgo),
      where('timestamp', '<', sevenDaysAgo)
    );
    const olderSnap = await getDocs(olderQuery);
    const olderCount = olderSnap.size;

    if (recentCount > olderCount) return 'rising';
    if (recentCount < olderCount) return 'declining';
    return 'stable';
  }

  /**
   * Calcula churn risk score e predicao para um lead.
   * DT-06: Formula linear daysSinceLastEvent / 30, clamp [0,1],
   * ajustes por trend e segmento.
   */
  private static calculateChurnRisk(
    leadId: string,
    brandId: string,
    currentSegment: 'hot' | 'warm' | 'cold',
    daysSinceLastEvent: number,
    engagementTrend: 'rising' | 'stable' | 'declining',
    noEvents: boolean,
    now: Timestamp
  ): ChurnPrediction {
    let churnRisk: number;

    if (noEvents) {
      churnRisk = DEFAULT_HIGH_RISK; // Lead sem eventos = alto risco
    } else {
      // Base: daysSinceLastEvent / 30 (DT-06)
      churnRisk = Math.min(daysSinceLastEvent / 30, 1);

      // Ajuste por engagement trend
      if (engagementTrend === 'declining') churnRisk = Math.min(churnRisk + 0.2, 1);
      if (engagementTrend === 'rising') churnRisk = Math.max(churnRisk - 0.2, 0);

      // Ajuste por segmento (hot com inatividade = risco maior)
      if (currentSegment === 'hot' && daysSinceLastEvent > 5) {
        churnRisk = Math.min(churnRisk + 0.15, 1);
      }
    }

    // Clamp [0, 1]
    churnRisk = Math.max(0, Math.min(1, churnRisk));

    // Risk level
    const riskLevel: 'critical' | 'warning' | 'safe' =
      churnRisk >= 0.7 ? 'critical' :
      churnRisk >= 0.4 ? 'warning' : 'safe';

    // Predicted segment
    let predictedSegment = currentSegment;
    if (churnRisk >= 0.7 && currentSegment === 'hot') predictedSegment = 'warm';
    if (churnRisk >= 0.7 && currentSegment === 'warm') predictedSegment = 'cold';

    // Factors
    const factors: string[] = [];
    if (daysSinceLastEvent > 14) factors.push(`${Math.round(daysSinceLastEvent)}d sem atividade`);
    if (engagementTrend === 'declining') factors.push('Engajamento em declinio');
    if (noEvents) factors.push('Nenhum evento registrado');
    if (currentSegment === 'hot' && daysSinceLastEvent > 5) factors.push('Lead hot com inatividade');

    return {
      leadId,
      brandId,
      currentSegment,
      predictedSegment,
      churnRisk,
      riskLevel,
      daysSinceLastEvent: Math.round(daysSinceLastEvent),
      engagementTrend,
      factors,
      predictedAt: now,
    };
  }
}
```

2. CRIAR testes em `app/src/__tests__/lib/intelligence/predictive/churn-predictor.test.ts`:
   - Teste (1): Lead com 20d sem evento tem churnRisk > lead com 2d sem evento (CS-35.06)
   - Teste (2): Batch retorna max 500 predictions (CS-35.07, DT-07)
   - Teste (3): Brand com > 500 leads retorna `nextCursor` + `hasMore: true` (DT-07)
   - Teste (4): Lead sem eventos → churnRisk = 0.8 (DEFAULT_HIGH_RISK)
   - Teste (5): Lead criado < 48h excluido da predicao
   - Teste (6): engagementTrend declining → +0.2 no churnRisk
   - Teste (7): Lead hot com > 5d inatividade → +0.15 no churnRisk
   - Teste (8): churnRisk >= 0.7 e hot → predictedSegment = 'warm'
   - Mock de `firebase/firestore` (getDocs, query, collection, etc.)

**Arquivos:**
- `app/src/lib/intelligence/predictive/churn-predictor.ts` — **CRIAR**
- `app/src/__tests__/lib/intelligence/predictive/churn-predictor.test.ts` — **CRIAR**

**DTs referenciados:** DT-06 (formula linear), DT-07 (BLOCKING — paginacao cursor 500)
**Dependencias:** S35-PRED-01 (types ChurnPrediction, ChurnBatchResult)
**Gate Check:** S35-GATE-01 (Sim)

**AC:**
- [ ] `ChurnPredictor.predictBatch(brandId, cursor?)` exportado (CS-35.05)
- [ ] Formula: `daysSinceLastEvent / 30` com clamp [0,1] + ajustes (DT-06)
- [ ] Batch limite 500 leads (DT-07, PB-05)
- [ ] Paginacao cursor: `nextCursor` + `hasMore` na resposta (DT-07 BLOCKING)
- [ ] Lead sem eventos: `churnRisk = 0.8` (CS-35.06)
- [ ] Lead criado < 48h: excluido da predicao
- [ ] ZERO chamada Gemini (PB-01)
- [ ] `riskLevel`: critical >= 0.7, warning >= 0.4, safe < 0.4
- [ ] `predictedSegment`: hot+critical → warm; warm+critical → cold
- [ ] 8+ testes passando (mock Firestore)
- [ ] ZERO `any` (P-01), ZERO `Date` (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S35-PRED-03: LTV Estimation Engine + Refactor `forecastCohortROI` [L, ~2.5h]

**Objetivo:** Criar motor de estimativa de LTV cohort-based com multipliers configuraveis por brand. Refatorar `PredictionEngine.forecastCohortROI()` para usar dados reais em vez de hardcoded.

> **[ARCH DT-08 — BLOCKING]:** Defaults hardcoded + override por brand em Firestore (`brands/{brandId}/predictive_config`). RNF-35.11 exige configuravel.

**Acao:**
1. CRIAR `app/src/lib/intelligence/predictive/ltv-estimator.ts`:

```typescript
/**
 * LTV Estimation Engine
 * Cohort-based LTV com Propensity scoring + historico de conversoes.
 *
 * DT-08 (BLOCKING): Multipliers com defaults + override por brand
 *   em Firestore `brands/{brandId}/predictive_config`.
 * PB-02: ZERO valores hardcoded permanentes — refatorar forecastCohortROI.
 *
 * @module lib/intelligence/predictive/ltv-estimator
 * @story S35-PRED-03
 */

import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  LTVEstimation,
  LTVBatchResult,
  LTVMultiplierConfig,
  PredictiveConfig,
} from '@/types/predictive';

// === Default Multipliers (DT-08: override por brand) ===
const DEFAULT_MULTIPLIERS: LTVMultiplierConfig = {
  hot:  { m1: 1.3, m3: 2.5, m6: 3.8, m12: 5.2 },
  warm: { m1: 1.1, m3: 1.8, m6: 2.4, m12: 3.0 },
  cold: { m1: 1.0, m3: 1.2, m6: 1.5, m12: 1.8 },
};

export class LTVEstimator {
  /**
   * Estima LTV por cohort (segmento) para uma marca.
   * DT-08: Busca config customizada em predictive_config, fallback para defaults.
   */
  static async estimateBatch(brandId: string): Promise<LTVBatchResult> {
    const now = Timestamp.now();

    // 1. Buscar config customizada (DT-08)
    const multipliers = await LTVEstimator.getMultipliers(brandId);

    // 2. Buscar leads agrupados por segmento
    const segments: Array<'hot' | 'warm' | 'cold'> = ['hot', 'warm', 'cold'];
    const cohorts: LTVEstimation[] = [];

    for (const segment of segments) {
      const estimation = await LTVEstimator.estimateSegment(
        brandId, segment, multipliers[segment], now
      );
      cohorts.push(estimation);
    }

    // 3. Calcular overall LTV
    const totalLeads = cohorts.reduce((sum, c) => sum + c.leadsInCohort, 0);
    const totalRevenue = cohorts.reduce((sum, c) => sum + c.totalRevenue, 0);
    const overallLTV = totalLeads > 0 ? totalRevenue / totalLeads : 0;

    return {
      brandId,
      cohorts,
      overallLTV,
      calculatedAt: now,
    };
  }

  /**
   * Busca multipliers customizados para uma marca (DT-08).
   * Fallback: DEFAULT_MULTIPLIERS.
   */
  private static async getMultipliers(brandId: string): Promise<LTVMultiplierConfig> {
    try {
      const configRef = doc(db, 'brands', brandId, 'predictive_config', 'settings');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const config = configSnap.data() as PredictiveConfig;
        if (config.ltvMultipliers) return config.ltvMultipliers;
      }
    } catch {
      // Fallback silencioso para defaults
    }
    return DEFAULT_MULTIPLIERS;
  }

  /**
   * Estima LTV para um segmento especifico.
   */
  private static async estimateSegment(
    brandId: string,
    segment: 'hot' | 'warm' | 'cold',
    multiplier: { m1: number; m3: number; m6: number; m12: number },
    now: Timestamp
  ): Promise<LTVEstimation> {
    // Buscar leads do segmento
    const leadsRef = collection(db, 'brands', brandId, 'leads');
    const leadsQuery = query(leadsRef, where('segment', '==', segment));
    const leadsSnap = await getDocs(leadsQuery);
    const leadsInCohort = leadsSnap.size;

    // Buscar revenue total do segmento (eventos type=purchase)
    let totalRevenue = 0;
    if (leadsInCohort > 0) {
      const leadIds = leadsSnap.docs.map(d => d.id);

      // Para cada lead, buscar eventos de purchase
      // (Otimizacao: batch em lotes de 10 para where-in Firestore)
      for (let i = 0; i < leadIds.length; i += 10) {
        const batch = leadIds.slice(i, i + 10);
        const eventsRef = collection(db, 'brands', brandId, 'journey_events');
        const eventsQuery = query(
          eventsRef,
          where('leadId', 'in', batch),
          where('type', '==', 'purchase')
        );
        const eventsSnap = await getDocs(eventsQuery);
        for (const eventDoc of eventsSnap.docs) {
          totalRevenue += (eventDoc.data().revenue as number) ?? 0;
        }
      }
    }

    const avgRevenuePerLead = leadsInCohort > 0 ? totalRevenue / leadsInCohort : 0;

    // Projetar LTV futuro usando multipliers (DT-08)
    const projectedLTV = {
      m1:  avgRevenuePerLead * multiplier.m1,
      m3:  avgRevenuePerLead * multiplier.m3,
      m6:  avgRevenuePerLead * multiplier.m6,
      m12: avgRevenuePerLead * multiplier.m12,
    };

    // Confidence score baseado em volume
    let confidenceScore: number;
    if (leadsInCohort < 10) confidenceScore = 0.3;
    else if (leadsInCohort < 50) confidenceScore = 0.6;
    else if (leadsInCohort < 200) confidenceScore = 0.8;
    else confidenceScore = 0.9;

    return {
      brandId,
      cohortId: `${brandId}-${segment}`,
      cohortName: `Segmento ${segment.toUpperCase()}`,
      segment,
      leadsInCohort,
      totalRevenue,
      avgRevenuePerLead,
      projectedLTV,
      growthMultiplier: multiplier.m12,
      confidenceScore,
      calculatedAt: now,
    };
  }
}
```

2. Em `app/src/lib/intelligence/predictive/engine.ts`, refatorar `forecastCohortROI()`:

```typescript
// ANTES (hardcoded — PB-02 proibido):
// const baseLtv = 5000;

// DEPOIS (usa LTVEstimator):
import { LTVEstimator } from './ltv-estimator';

// Dentro de forecastCohortROI():
// Substituir baseLtv hardcoded por dados reais do LTVEstimator
const ltvData = await LTVEstimator.estimateBatch(brandId);
const overallLTV = ltvData.overallLTV || 0;
// Usar overallLTV em vez de baseLtv nos calculos
```

3. CRIAR testes em `app/src/__tests__/lib/intelligence/predictive/ltv-estimator.test.ts`:
   - Teste (1): `estimateBatch` retorna 3 cohorts (hot, warm, cold) (CS-35.08)
   - Teste (2): hot projectedLTV > warm > cold (CS-35.09)
   - Teste (3): Multipliers override por brand funciona (DT-08)
   - Teste (4): Confidence score: < 10 leads = 0.3, 10-50 = 0.6, > 200 = 0.9
   - Teste (5): Brand sem leads retorna cohorts vazios (graceful degradation)
   - Teste (6): Revenue calculada corretamente de journey_events type=purchase

**Arquivos:**
- `app/src/lib/intelligence/predictive/ltv-estimator.ts` — **CRIAR**
- `app/src/lib/intelligence/predictive/engine.ts` — **MODIFICAR** (refatorar forecastCohortROI)
- `app/src/__tests__/lib/intelligence/predictive/ltv-estimator.test.ts` — **CRIAR**

**DTs referenciados:** DT-08 (BLOCKING — multipliers configuraveis por brand)
**Dependencias:** S35-PRED-01 (types LTVEstimation, LTVBatchResult, LTVMultiplierConfig, PredictiveConfig)
**Gate Check:** S35-GATE-01 (Sim)

**AC:**
- [ ] `LTVEstimator.estimateBatch(brandId)` retorna `LTVBatchResult` funcional (CS-35.08)
- [ ] 3 cohorts: hot, warm, cold com projectedLTV diferenciado (CS-35.09)
- [ ] Multipliers com defaults + override via `brands/{brandId}/predictive_config` (DT-08 BLOCKING)
- [ ] `forecastCohortROI` refatorado — usa LTVEstimator em vez de `baseLtv = 5000` (PB-02, CS-35.10)
- [ ] Backward-compatible — `forecastCohortROI` mantém mesma assinatura publica
- [ ] Confidence score baseado em volume (< 10 = 0.3, 10-50 = 0.6, 50-200 = 0.8, > 200 = 0.9)
- [ ] 6+ testes passando
- [ ] ZERO `any` (P-01), ZERO `Date` (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S35-PRED-04: Audience Behavior Forecasting [M+, ~1.5h]

**Objetivo:** Criar engine de projecao de migracoes entre segmentos (7/14/30 dias) com narrativa Gemini em PT-BR.

> **[ARCH DT-09 — NON-BLOCKING]:** Estimativa baseada em churn risk atual como proxy (sem historico de snapshots).

**Acao:**
1. CRIAR `app/src/lib/intelligence/predictive/audience-forecaster.ts`:
   - Classe `AudienceForecaster` com metodo `forecast(brandId): Promise<AudienceForecast>`
   - Buscar distribuicao atual de leads por segmento
   - Calcular taxas de migracao baseadas em churn risk como proxy (DT-09)
   - Aplicar taxas para projecao 7/14/30d
   - Chamar Gemini para `trendsNarrative` em PT-BR (temperature 0.3, JSON mode)

2. CRIAR `app/src/lib/ai/prompts/predictive-forecast.ts`:
   - `FORECAST_SYSTEM_PROMPT` — instrucoes para Gemini gerar narrativa em PT-BR
   - `buildForecastPrompt(currentDistribution, projections, migrationRates)` — builder

```typescript
// Prompt template:
export const FORECAST_SYSTEM_PROMPT = `Voce e um analista de dados especializado em comportamento de audiencia.
Gere uma narrativa CURTA (2-3 frases) em PT-BR explicando as tendencias de migracao de segmentos.
Sugira 1 acao pratica baseada nos dados.
Responda APENAS em JSON: { "narrative": "..." }`;
```

**Arquivos:**
- `app/src/lib/intelligence/predictive/audience-forecaster.ts` — **CRIAR**
- `app/src/lib/ai/prompts/predictive-forecast.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/gemini.ts` — `generateWithGemini()`
- `app/src/lib/intelligence/personalization/propensity.ts` — referencia PropensityEngine

**DTs referenciados:** DT-09 (migracao baseada em churn risk proxy)
**Dependencias:** S35-PRED-01 (types AudienceForecast), S35-PRED-02 (churn risk como proxy)
**Gate Check:** S35-GATE-01 (Sim)

**AC:**
- [ ] `AudienceForecaster.forecast(brandId)` retorna `AudienceForecast` (CS-35.11)
- [ ] Projecoes 7/14/30d baseadas em migration rates (DT-09)
- [ ] Migration rates calculadas como proxy via churn risk (sem historico)
- [ ] `trendsNarrative` gerada por Gemini em PT-BR (CS-35.12)
- [ ] Gemini: temperature 0.3, `responseMimeType: 'application/json'`
- [ ] `npx tsc --noEmit` = 0

---

### S35-PRED-05: API Routes `/api/intelligence/predictive/` [M, ~1h]

**Objetivo:** Criar 3 rotas REST para churn, LTV e forecast com padroes Sigma.

**Acao:**
1. CRIAR `app/src/app/api/intelligence/predictive/churn/route.ts`:
   - `POST` — Body: `{ brandId, cursor? }`. Retorna `ChurnBatchResult`.
   - Padroes: `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`

2. CRIAR `app/src/app/api/intelligence/predictive/ltv/route.ts`:
   - `POST` — Body: `{ brandId }`. Retorna `LTVBatchResult`.

3. CRIAR `app/src/app/api/intelligence/predictive/forecast/route.ts`:
   - `POST` — Body: `{ brandId }`. Retorna `AudienceForecast`.

**Arquivos:**
- `app/src/app/api/intelligence/predictive/churn/route.ts` — **CRIAR**
- `app/src/app/api/intelligence/predictive/ltv/route.ts` — **CRIAR**
- `app/src/app/api/intelligence/predictive/forecast/route.ts` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S35-PRED-02 (ChurnPredictor), S35-PRED-03 (LTVEstimator), S35-PRED-04 (AudienceForecaster)
**Gate Check:** S35-GATE-01 (Sim)

**AC:**
- [ ] POST `/predictive/churn` retorna `ChurnBatchResult` com auth (CS-35.13)
- [ ] POST `/predictive/ltv` retorna `LTVBatchResult` com auth (CS-35.14)
- [ ] POST `/predictive/forecast` retorna `AudienceForecast` com auth (CS-35.15)
- [ ] `force-dynamic` + `requireBrandAccess` + `createApiError`/`Success` em todas
- [ ] Churn aceita `cursor?` para paginacao (DT-07)
- [ ] `npx tsc --noEmit` = 0

---

### S35-GATE-01: Gate Check 1 — Predictive Engines [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | Types predictive expandidos | `rg "ChurnPrediction" app/src/types/predictive.ts` | 1+ match |
| G1-02 | Types research separados | `rg "MarketDossier" app/src/types/research.ts` | 1+ match (DT-05) |
| G1-03 | ZERO research types em predictive | `rg "ResearchQuery\|MarketDossier\|ResearchSource" app/src/types/predictive.ts` | 0 matches (DT-05) |
| G1-04 | ChurnPredictor criado | `rg "ChurnPredictor" app/src/lib/intelligence/predictive/churn-predictor.ts` | 1+ match |
| G1-05 | Paginacao cursor | `rg "nextCursor" app/src/lib/intelligence/predictive/churn-predictor.ts` | 1+ match (DT-07) |
| G1-06 | ZERO Gemini em churn | `rg "generateWithGemini\|gemini" app/src/lib/intelligence/predictive/churn-predictor.ts` | 0 matches (PB-01) |
| G1-07 | LTVEstimator criado | `rg "LTVEstimator" app/src/lib/intelligence/predictive/ltv-estimator.ts` | 1+ match |
| G1-08 | Multipliers configuraveis | `rg "predictive_config" app/src/lib/intelligence/predictive/ltv-estimator.ts` | 1+ match (DT-08) |
| G1-09 | forecastCohortROI refatorado | `rg "LTVEstimator" app/src/lib/intelligence/predictive/engine.ts` | 1+ match (PB-02) |
| G1-10 | ZERO baseLtv hardcoded | `rg "baseLtv.*5000" app/src/lib/intelligence/predictive/engine.ts` | 0 matches |
| G1-11 | AudienceForecaster criado | `rg "AudienceForecaster" app/src/lib/intelligence/predictive/audience-forecaster.ts` | 1+ match |
| G1-12 | API churn | `rg "force-dynamic" app/src/app/api/intelligence/predictive/churn/route.ts` | 1+ match |
| G1-13 | API ltv | `rg "force-dynamic" app/src/app/api/intelligence/predictive/ltv/route.ts` | 1+ match |
| G1-14 | API forecast | `rg "force-dynamic" app/src/app/api/intelligence/predictive/forecast/route.ts` | 1+ match |
| G1-15 | Testes churn | Verificar existencia | 8+ testes passando |
| G1-16 | Testes ltv | Verificar existencia | 6+ testes passando |
| G1-17 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G1-18 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-18 todos aprovados.

**AC:**
- [ ] G1-01 a G1-18 todos aprovados

---

## Fase 2: Deep Research Engine [~6-7h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S35-GATE-01 aprovado.
>
> **Sequencia:** RES-01 + RES-03 (paralelos) → RES-02 → RES-04 → **GATE CHECK 2**
>
> Esta fase cria o motor de pesquisa profunda que combina Exa + Firecrawl + Gemini para gerar dossies de mercado.

---

### S35-RES-01: Research Engine (Exa + Firecrawl Pipeline) [L, ~2h]

**Objetivo:** Criar motor de pesquisa que integra ExaAdapter (busca semantica) + FirecrawlAdapter (scraping) para coleta de dados de mercado.

> **[ARCH DT-10 — NON-BLOCKING]:** Query Exa enriquecida com contexto (topic + segment + keywords de mercado + ano).
> **[ARCH DT-11 — NON-BLOCKING]:** `url_to_markdown` para quick/standard; `full_scrape` apenas em deep (1-2 dominios).

**Acao:**
1. CRIAR `app/src/lib/intelligence/research/engine.ts`:

```typescript
/**
 * Deep Research Engine
 * Pipeline: Exa (semantic search) → Firecrawl (deep scrape) → Gemini (synthesis)
 *
 * DT-10: Query Exa enriquecida com contexto.
 * DT-11: url_to_markdown para quick/standard, full_scrape para deep.
 * DT-12: Synthesis chunked 2 fases (delegada ao DossierGenerator).
 * PB-03: Cache check 24h obrigatorio antes de gerar.
 * PB-04: Graceful degradation — falha em Exa/Firecrawl NAO crash.
 * PB-07: Todas fontes com URL + provider (attribution).
 *
 * @module lib/intelligence/research/engine
 * @story S35-RES-01
 */

import { Timestamp } from 'firebase/firestore';
import type {
  ResearchQuery,
  ResearchSource,
  MarketDossier,
  ResearchDepth,
} from '@/types/research';

// Depth config
const DEPTH_CONFIG: Record<ResearchDepth, { exaResults: number; firecrawlTop: number; firecrawlMode: 'url_to_markdown' | 'full_scrape' }> = {
  quick:    { exaResults: 5,  firecrawlTop: 0,  firecrawlMode: 'url_to_markdown' },
  standard: { exaResults: 10, firecrawlTop: 3,  firecrawlMode: 'url_to_markdown' },
  deep:     { exaResults: 15, firecrawlTop: 5,  firecrawlMode: 'url_to_markdown' }, // DT-11: full_scrape apenas se necessario
};

export class ResearchEngine {
  /**
   * Gera dossie de mercado completo.
   * Fluxo: Cache check → Exa → Firecrawl → Gemini (chunked) → Persist
   */
  static async generateDossier(researchQuery: ResearchQuery): Promise<MarketDossier> {
    const { brandId, topic, marketSegment, competitors, depth } = researchQuery;
    const config = DEPTH_CONFIG[depth || 'standard'];

    // PB-03: Cache check 24h
    const { getCachedResearch } = await import('@/lib/firebase/research');
    const cached = await getCachedResearch(brandId, topic);
    if (cached) return cached;

    const now = Timestamp.now();
    const sources: ResearchSource[] = [];

    // Fase 1: Coleta via Exa (DT-10: query enriquecida)
    try {
      const exaSources = await ResearchEngine.fetchFromExa(
        topic, marketSegment, competitors, config.exaResults
      );
      sources.push(...exaSources);
    } catch (error) {
      console.warn('[ResearchEngine] Exa fetch failed:', error);
      // PB-04: graceful degradation — continua sem Exa
    }

    // Se zero resultados do Exa: fail early
    if (sources.length === 0) {
      return ResearchEngine.createFailedDossier(
        brandId, topic, now, 'Nenhuma fonte encontrada para o topico informado'
      );
    }

    // Fase 2: Deep Scrape via Firecrawl (top N mais relevantes)
    if (config.firecrawlTop > 0) {
      const topSources = sources
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, config.firecrawlTop);

      for (const source of topSources) {
        try {
          const enriched = await ResearchEngine.enrichWithFirecrawl(
            source, config.firecrawlMode
          );
          // Atualizar snippet com conteudo enriquecido
          const idx = sources.findIndex(s => s.url === source.url);
          if (idx >= 0 && enriched) sources[idx] = enriched;
        } catch (error) {
          console.warn(`[ResearchEngine] Firecrawl failed for ${source.url}:`, error);
          // PB-04: graceful degradation — continua com snippet original
        }
      }
    }

    // Fase 3: Synthesis via Gemini (chunked — DT-12, delegada ao RES-02)
    try {
      const { DossierGenerator } = await import('./dossier-generator');
      const sections = await DossierGenerator.synthesize(sources, researchQuery);

      const dossier: MarketDossier = {
        id: '',  // Sera preenchido pelo Firestore
        brandId,
        topic,
        status: 'completed',
        sections,
        sources,
        generatedAt: now,
        expiresAt: Timestamp.fromMillis(now.toMillis() + 24 * 60 * 60 * 1000), // 24h cache
      };

      // Fase 4: Persist
      const { saveResearch } = await import('@/lib/firebase/research');
      const savedId = await saveResearch(brandId, dossier);
      dossier.id = savedId;

      return dossier;
    } catch (error) {
      console.error('[ResearchEngine] Synthesis failed:', error);
      // PB-04: retornar sources brutas com status failed
      return ResearchEngine.createFailedDossier(
        brandId, topic, now, `Falha na sintese: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
        sources
      );
    }
  }

  /**
   * Fase 1: Busca semantica via Exa.
   * DT-10: Query enriquecida com contexto.
   */
  private static async fetchFromExa(
    topic: string,
    marketSegment: string | undefined,
    competitors: string[] | undefined,
    maxResults: number
  ): Promise<ResearchSource[]> {
    const { executeMcpTool } = await import('@/lib/mcp/router');

    // DT-10: Query enriquecida
    const enrichedQuery = [
      topic,
      marketSegment ? `segmento: ${marketSegment}` : '',
      'tamanho de mercado tendencias oportunidades 2026',
      competitors?.length ? `concorrentes: ${competitors.join(', ')}` : '',
    ].filter(Boolean).join(' ');

    const result = await executeMcpTool('exa', 'semantic_search', {
      query: enrichedQuery,
      numResults: maxResults,
    });

    // PB-07: attribution obrigatoria
    return (result?.results || []).map((r: Record<string, unknown>) => ({
      url: String(r.url || ''),
      title: String(r.title || ''),
      snippet: String(r.text || r.snippet || ''),
      relevanceScore: Number(r.score || 0),
      source: 'exa' as const,
      fetchedAt: Timestamp.now(),
    }));
  }

  /**
   * Fase 2: Enriquecimento via Firecrawl.
   * DT-11: url_to_markdown para quick/standard.
   */
  private static async enrichWithFirecrawl(
    source: ResearchSource,
    mode: 'url_to_markdown' | 'full_scrape'
  ): Promise<ResearchSource | null> {
    // Validar URL (seguranca: bloquear localhost/IPs privados)
    if (!source.url.startsWith('http://') && !source.url.startsWith('https://')) return null;
    if (source.url.includes('localhost') || source.url.match(/\d+\.\d+\.\d+\.\d+/)) return null;

    const { executeMcpTool } = await import('@/lib/mcp/router');
    const result = await executeMcpTool('firecrawl', mode, { url: source.url });

    if (!result?.content) return null;

    return {
      ...source,
      snippet: String(result.content).slice(0, 3000), // Truncar a 3k chars
      source: 'firecrawl' as const,
      fetchedAt: Timestamp.now(),
    };
  }

  /**
   * Cria dossie com status 'failed'.
   */
  private static createFailedDossier(
    brandId: string,
    topic: string,
    now: Timestamp,
    errorMessage: string,
    sources: ResearchSource[] = []
  ): MarketDossier {
    return {
      id: '',
      brandId,
      topic,
      status: 'failed',
      sections: {
        marketOverview: errorMessage,
        marketSize: '',
        trends: [],
        competitors: [],
        opportunities: [],
        threats: [],
        recommendations: [],
      },
      sources,
      generatedAt: now,
      expiresAt: now, // Nao cachear falhas
    };
  }
}
```

2. CRIAR testes em `app/src/__tests__/lib/intelligence/research/engine.test.ts`:
   - Teste (1): Dossie completo gerado com Exa + Firecrawl + Gemini mock (CS-35.16)
   - Teste (2): Cache hit retorna dossie existente (CS-35.17, PB-03)
   - Teste (3): Exa falha → `status: 'failed'` sem crash (CS-35.18, PB-04)
   - Teste (4): Firecrawl falha parcial → continua com snippets Exa (PB-04)
   - Teste (5): Depth 'quick' → 5 resultados Exa, sem Firecrawl
   - Teste (6): Depth 'standard' → 10 Exa + top 3 Firecrawl
   - Teste (7): Depth 'deep' → 15 Exa + top 5 Firecrawl
   - Teste (8): Todas sources com URL + provider (PB-07)

**Arquivos:**
- `app/src/lib/intelligence/research/engine.ts` — **CRIAR**
- `app/src/__tests__/lib/intelligence/research/engine.test.ts` — **CRIAR**

**DTs referenciados:** DT-10 (query Exa enriquecida), DT-11 (Firecrawl depth strategy)
**Dependencias:** S35-PRED-01 (types/research.ts), ExaAdapter (S23), FirecrawlAdapter (S23)
**Gate Check:** S35-GATE-02 (Sim)

**AC:**
- [ ] `ResearchEngine.generateDossier(query)` retorna `MarketDossier` (CS-35.16)
- [ ] Cache check 24h ANTES de gerar (PB-03)
- [ ] Exa query enriquecida com contexto (DT-10)
- [ ] Firecrawl: `url_to_markdown` para quick/standard (DT-11)
- [ ] Graceful degradation: Exa fail → `status: 'failed'` (PB-04, CS-35.18)
- [ ] Graceful degradation: Firecrawl fail parcial → continua com snippets (PB-04)
- [ ] Todas fontes com URL + provider (PB-07)
- [ ] URL validation: bloqueia localhost + IPs privados
- [ ] 8+ testes passando
- [ ] `npx tsc --noEmit` = 0

---

### S35-RES-02: Market Dossier Generator + Research Prompts (Chunked) [M+, ~1.5h]

**Objetivo:** Criar gerador de dossie que usa Gemini com pipeline chunked de 2 fases para evitar estouro de tokens.

> **[ARCH DT-12 — BLOCKING]:** Pipeline chunked: (1) Resumo por fonte com cap por tokens, (2) Sintese final com os resumos. Evita estouro de tokens.

**Acao:**
1. CRIAR modulo `DossierGenerator` (pode ser dentro de `lib/intelligence/research/` como `dossier-generator.ts`):

```typescript
/**
 * Market Dossier Generator — Synthesis via Gemini (Chunked)
 *
 * DT-12 (BLOCKING): Pipeline em 2 fases:
 *   Fase 1: Resumo individual por fonte (cap 500 tokens cada)
 *   Fase 2: Sintese final consolidada a partir dos resumos
 *
 * @module lib/intelligence/research/dossier-generator
 * @story S35-RES-02
 */

// Fase 1: Para cada fonte, gerar resumo curto via Gemini
// Fase 2: Com todos os resumos, gerar dossie consolidado
// Output: MarketDossierSections (JSON validado)
```

2. CRIAR `app/src/lib/ai/prompts/research-synthesis.ts`:

```typescript
export const RESEARCH_SYSTEM_PROMPT = `Voce e um analista de mercado senior.
Gere analises em PT-BR com dados factuais e recomendacoes acionaveis.
Responda SEMPRE em JSON valido.`;

export function buildSourceSummaryPrompt(source: { title: string; snippet: string; url: string }): string {
  // Prompt para Fase 1: resumo individual de cada fonte (DT-12)
}

export function buildSynthesisPrompt(summaries: string[], query: { topic: string; marketSegment?: string }): string {
  // Prompt para Fase 2: sintese consolidada (DT-12)
  // Output esperado: JSON com campos MarketDossierSections
}
```

**Arquivos:**
- `app/src/lib/intelligence/research/dossier-generator.ts` — **CRIAR**
- `app/src/lib/ai/prompts/research-synthesis.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/gemini.ts` — `generateWithGemini()`

**DTs referenciados:** DT-12 (BLOCKING — chunked 2 fases)
**Dependencias:** S35-RES-01 (ResearchEngine chama DossierGenerator)
**Gate Check:** S35-GATE-02 (Sim)

**AC:**
- [ ] Pipeline chunked 2 fases implementado (DT-12 BLOCKING)
- [ ] Fase 1: Resumo por fonte com cap por tokens
- [ ] Fase 2: Sintese final com resumos consolidados
- [ ] Output JSON validado com campos `MarketDossierSections`
- [ ] Gemini: temperature 0.4, `responseMimeType: 'application/json'`
- [ ] Tudo em PT-BR
- [ ] ZERO synthesis em single call (P-18, DT-12)
- [ ] `npx tsc --noEmit` = 0

---

### S35-RES-03: Research Storage Firestore + Cache 24h [M, ~1h]

**Objetivo:** Criar CRUD helpers para pesquisas em Firestore com cache de 24h.

**Acao:**
1. CRIAR `app/src/lib/firebase/research.ts`:

```typescript
/**
 * Research — CRUD Helpers Firestore
 * Collection: brands/{brandId}/research
 *
 * PB-03: Cache check 24h obrigatorio.
 *
 * @module lib/firebase/research
 * @story S35-RES-03
 */

// Funcoes:
// - saveResearch(brandId, dossier): string (retorna ID)
// - getResearch(brandId, dossierId): MarketDossier | null
// - listResearch(brandId, limit?): MarketDossier[]
// - getCachedResearch(brandId, topic): MarketDossier | null
//
// getCachedResearch: where('topic','==',topic).where('expiresAt','>',Timestamp.now())
//   .orderBy('generatedAt','desc').limit(1)
```

**Arquivos:**
- `app/src/lib/firebase/research.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/config.ts` — `db`, `Timestamp`

**DTs referenciados:** Nenhum (pattern standard Firestore)
**Dependencias:** S35-PRED-01 (types/research.ts — MarketDossier)
**Gate Check:** S35-GATE-02 (Sim)

**AC:**
- [ ] `saveResearch(brandId, dossier)` persiste e retorna ID
- [ ] `getResearch(brandId, dossierId)` retorna dossie ou null
- [ ] `listResearch(brandId, limit?)` retorna lista de dossies
- [ ] `getCachedResearch(brandId, topic)` verifica cache 24h (PB-03)
- [ ] Cache query: `where('topic','==',topic).where('expiresAt','>',now).limit(1)` (CS-35.17)
- [ ] Isolamento por brandId (`brands/{brandId}/research`) (P-08)
- [ ] `Timestamp` em todos os campos de data (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S35-RES-04: API Route `/api/intelligence/research/` [S, ~30min]

**Objetivo:** Criar rota REST para gerar e listar pesquisas de mercado.

**Acao:**
1. CRIAR `app/src/app/api/intelligence/research/route.ts`:
   - `POST` — Body: `{ brandId, topic, marketSegment?, competitors?, depth? }`. Retorna `MarketDossier`. Se cache valido, retorna imediatamente.
   - `GET` — Query params: `brandId`, `limit?`. Retorna lista de dossies.
   - Padroes: `force-dynamic`, `requireBrandAccess`, `createApiError`/`createApiSuccess`

**Arquivos:**
- `app/src/app/api/intelligence/research/route.ts` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S35-RES-01 (ResearchEngine), S35-RES-02 (DossierGenerator), S35-RES-03 (Storage)
**Gate Check:** S35-GATE-02 (Sim)

**AC:**
- [ ] POST gera dossie ou retorna cache (CS-35.19)
- [ ] GET lista dossies por brandId (CS-35.19)
- [ ] `force-dynamic` + `requireBrandAccess` + `createApiError`/`Success`
- [ ] `npx tsc --noEmit` = 0

---

### S35-GATE-02: Gate Check 2 — Deep Research [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | ResearchEngine criado | `rg "ResearchEngine" app/src/lib/intelligence/research/engine.ts` | 1+ match |
| G2-02 | DossierGenerator criado | `rg "DossierGenerator" app/src/lib/intelligence/research/dossier-generator.ts` | 1+ match |
| G2-03 | Chunked synthesis | `rg "Fase 1\|Fase 2\|summaries" app/src/lib/intelligence/research/dossier-generator.ts` | 2+ matches (DT-12) |
| G2-04 | Research storage | `rg "getCachedResearch" app/src/lib/firebase/research.ts` | 1+ match (PB-03) |
| G2-05 | Cache 24h | `rg "expiresAt" app/src/lib/firebase/research.ts` | 1+ match |
| G2-06 | Prompts research | Verificar existencia de `app/src/lib/ai/prompts/research-synthesis.ts` | Arquivo existe |
| G2-07 | API research | `rg "force-dynamic" app/src/app/api/intelligence/research/route.ts` | 1+ match |
| G2-08 | Graceful degradation | `rg "status.*failed" app/src/lib/intelligence/research/engine.ts` | 1+ match (PB-04) |
| G2-09 | URL validation | `rg "localhost" app/src/lib/intelligence/research/engine.ts` | 1+ match |
| G2-10 | Testes research | Verificar existencia | 8+ testes passando |
| G2-11 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G2-12 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 3 so inicia se G2-01 a G2-12 todos aprovados.

**AC:**
- [ ] G2-01 a G2-12 todos aprovados

---

## Fase 3: Predictive Dashboard & Alerts + Research UI [~4-5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S35-GATE-02 aprovado.
>
> **Sequencia:** DASH-01 + DASH-02 + DASH-03 + DASH-04 (paralelos) → **GATE CHECK 3**
>
> Esta fase cria a UI preditiva (dashboard com tabs), alertas, pagina de research, e hook unificado.

---

### S35-DASH-01: ScaleSimulator Upgrade — Dashboard Preditivo com 5 Tabs [L, ~2h]

**Objetivo:** Refatorar ScaleSimulator para dashboard preditivo completo com 5 tabs.

> **[ARCH DT-13 — NON-BLOCKING]:** shadcn Tabs via `@radix-ui/react-tabs` (ja no bundle).
> **[ARCH DT-14 — NON-BLOCKING]:** Recharts (ja importado no ScaleSimulator).

**Acao:**
1. Em `app/src/components/intelligence/predictive/ScaleSimulator.tsx`:
   - Adicionar shadcn Tabs no topo: `Visao Geral`, `Churn`, `LTV`, `Forecast`, `Simulador`
   - `Simulador` = conteudo atual do ScaleSimulator (MANTER intacto)
   - `Visao Geral` = KPIs resumidos (total at-risk, overall LTV, forecast highlights)

2. CRIAR `app/src/components/intelligence/predictive/ChurnOverview.tsx`:
   - Card com total leads at-risk
   - Distribuicao por riskLevel (critical/warning/safe)
   - Tabela dos top 10 leads com maior churnRisk

3. CRIAR `app/src/components/intelligence/predictive/LTVBreakdown.tsx`:
   - 3 cards (hot/warm/cold) com avgRevenuePerLead, projectedLTV m3/m6/m12, confidenceScore
   - Chart de barras comparativo (recharts)

4. CRIAR `app/src/components/intelligence/predictive/ForecastChart.tsx`:
   - Grafico de area empilhada (recharts) com projecoes 7/14/30d
   - Migration rates badges
   - trendsNarrative como insight box

5. Em `app/src/app/intelligence/predictive/page.tsx`:
   - Atualizar titulo: "Inteligencia Preditiva" (em vez de "Simulador de Futuro Financeiro")

**Arquivos:**
- `app/src/components/intelligence/predictive/ScaleSimulator.tsx` — **MODIFICAR** (adicionar tabs)
- `app/src/components/intelligence/predictive/ChurnOverview.tsx` — **CRIAR**
- `app/src/components/intelligence/predictive/LTVBreakdown.tsx` — **CRIAR**
- `app/src/components/intelligence/predictive/ForecastChart.tsx` — **CRIAR**
- `app/src/app/intelligence/predictive/page.tsx` — **MODIFICAR** (titulo + dashboard)

**DTs referenciados:** DT-13 (shadcn Tabs), DT-14 (recharts)
**Dependencias:** S35-PRED-05 (APIs), S35-DASH-04 (hook usePredictiveData)
**Gate Check:** S35-GATE-03 (Sim)

**AC:**
- [ ] 5 tabs renderizam: Visao Geral, Churn, LTV, Forecast, Simulador (CS-35.20)
- [ ] Tab Simulador = conteudo original do ScaleSimulator (zero breaking change) (R-05)
- [ ] shadcn Tabs usado (DT-13)
- [ ] Recharts para charts (DT-14)
- [ ] Titulo atualizado: "Inteligencia Preditiva"
- [ ] `npx tsc --noEmit` = 0

---

### S35-DASH-02: Predictive Alerts [M, ~1h]

**Objetivo:** Criar gerador de alertas preditivos baseado em dados de churn, LTV e forecast.

> **[ARCH DT-15 — NON-BLOCKING]:** Defaults em constants + override em `predictive_config`.

**Acao:**
1. CRIAR `app/src/lib/intelligence/predictive/alert-generator.ts`:
   - Classe `PredictiveAlertGenerator`
   - Metodo: `generateAlerts(brandId, churnData, ltvData, forecastData): PredictiveAlert[]`
   - Regras:
     - `churn_imminent`: >= 3 leads hot com churnRisk >= 0.7 → critical
     - `upsell_opportunity`: cohort warm com LTV m3 > 2x avgRevenue → info
     - `segment_shift`: forecast > 20% migracao hot→warm em 14d → warning
     - `ltv_milestone`: LTV medio ultrapassa threshold → info
   - PB-06: ZERO alerta com < 10 leads no segmento

2. CRIAR `app/src/components/intelligence/predictive/PredictiveAlerts.tsx`:
   - Cards com icone por tipo (AlertTriangle, Bell, Info de Lucide)
   - Botao "Dispensar" por alerta
   - Limite 5 visiveis, restante em modal

**Arquivos:**
- `app/src/lib/intelligence/predictive/alert-generator.ts` — **CRIAR**
- `app/src/components/intelligence/predictive/PredictiveAlerts.tsx` — **CRIAR**

**DTs referenciados:** DT-15 (defaults + override)
**Dependencias:** S35-PRED-02 (churn data), S35-PRED-03 (ltv data), S35-PRED-04 (forecast data)
**Gate Check:** S35-GATE-03 (Sim)

**AC:**
- [ ] `PredictiveAlertGenerator.generateAlerts()` retorna `PredictiveAlert[]` (CS-35.21)
- [ ] Regra `churn_imminent`: >= 3 leads hot at-risk → critical
- [ ] Regra `upsell_opportunity`: warm LTV m3 > 2x avgRevenue → info
- [ ] Regra `segment_shift`: > 20% migracao hot→warm → warning
- [ ] PB-06: ZERO alerta com < 10 leads no segmento
- [ ] UI com cards + icones + dismiss + limite 5 visiveis
- [ ] `npx tsc --noEmit` = 0

---

### S35-DASH-03: Research Results UI [M, ~1h]

**Objetivo:** Criar pagina de pesquisa com formulario, lista de dossies anteriores, e viewer de dossie expandido.

**Acao:**
1. CRIAR `app/src/app/intelligence/research/page.tsx`:
   - Formulario de pesquisa (topic, marketSegment, competitors, depth)
   - Lista de dossies anteriores (cards com titulo, data, status badge)
   - Ao clicar: expande dossie com DossierViewer

2. CRIAR `app/src/components/intelligence/research/research-form.tsx`:
   - Input topic, select marketSegment, multiselect competitors, radio depth (quick/standard/deep)

3. CRIAR `app/src/components/intelligence/research/dossier-viewer.tsx`:
   - Header com titulo + badge status + data
   - Sections colapsiveis (Accordion shadcn): marketOverview, marketSize, trends, competitors, opportunities, threats, recommendations
   - Sources section com link + relevance badge + provider badge (Exa/Firecrawl)

4. Em `app/src/lib/constants.ts`:
   - ADICIONAR item ao grupo `intelligence` no NAV_GROUPS:
   ```typescript
   { id: 'deep-research', label: 'Deep Research', href: '/intelligence/research', icon: 'Telescope' }
   ```

5. Em `app/src/lib/icon-maps.ts`:
   - Verificar/adicionar `Telescope` do Lucide

6. Em `app/src/components/layout/sidebar.tsx`:
   - Verificar que sidebar consome NAV_GROUPS (se nao, adicionar item manualmente)

**Arquivos:**
- `app/src/app/intelligence/research/page.tsx` — **CRIAR**
- `app/src/components/intelligence/research/research-form.tsx` — **CRIAR**
- `app/src/components/intelligence/research/dossier-viewer.tsx` — **CRIAR**
- `app/src/lib/constants.ts` — **MODIFICAR** (adicionar item NAV_GROUPS)
- `app/src/lib/icon-maps.ts` — **MODIFICAR** (adicionar Telescope)
- `app/src/components/layout/sidebar.tsx` — **MODIFICAR** (se necessario)

**DTs referenciados:** Nenhum
**Dependencias:** S35-RES-04 (API research)
**Gate Check:** S35-GATE-03 (Sim)

**AC:**
- [ ] Pagina `/intelligence/research` com formulario + lista + viewer (CS-35.22)
- [ ] DossierViewer com secoes colapsiveis (Accordion)
- [ ] Sources com URL + relevance badge + provider badge
- [ ] Sidebar com "Deep Research" no grupo Intelligence (CS-35.22)
- [ ] `npx tsc --noEmit` = 0

---

### S35-DASH-04: Hook `usePredictiveData` [S, ~30min]

**Objetivo:** Criar hook unificado que busca dados preditivos das 3 APIs em paralelo.

**Acao:**
1. CRIAR `app/src/lib/hooks/use-predictive-data.ts`:

```typescript
/**
 * Hook usePredictiveData
 * Chama 3 APIs (churn, LTV, forecast) em paralelo.
 * SWR pattern com revalidacao a cada 5 min.
 *
 * @story S35-DASH-04
 */

import { useState, useEffect, useCallback } from 'react';
import type { ChurnBatchResult, LTVBatchResult, AudienceForecast } from '@/types/predictive';

interface UsePredictiveDataReturn {
  churn: ChurnBatchResult | null;
  ltv: LTVBatchResult | null;
  forecast: AudienceForecast | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

export function usePredictiveData(brandId: string | null): UsePredictiveDataReturn {
  // Chama POST /api/intelligence/predictive/churn
  // Chama POST /api/intelligence/predictive/ltv
  // Chama POST /api/intelligence/predictive/forecast
  // Tudo em Promise.all (paralelo)
  // Revalidacao a cada 5 min (300_000ms)
  // ...
}
```

**Arquivos:**
- `app/src/lib/hooks/use-predictive-data.ts` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** S35-PRED-05 (APIs existem)
**Gate Check:** S35-GATE-03 (Sim)

**AC:**
- [ ] Hook retorna `{ churn, ltv, forecast, isLoading, error, refresh }` (CS-35.25)
- [ ] 3 APIs chamadas em paralelo via `Promise.all`
- [ ] SWR pattern com revalidacao a cada 5 min
- [ ] `npx tsc --noEmit` = 0

---

### S35-GATE-03: Gate Check 3 — Dashboard & UI [XS, ~15min] — GATE

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G3-01 | ScaleSimulator com tabs | `rg "Tabs\|TabsList" app/src/components/intelligence/predictive/ScaleSimulator.tsx` | 1+ match (DT-13) |
| G3-02 | ChurnOverview criado | Verificar existencia de `ChurnOverview.tsx` | Arquivo existe |
| G3-03 | LTVBreakdown criado | Verificar existencia de `LTVBreakdown.tsx` | Arquivo existe |
| G3-04 | ForecastChart criado | Verificar existencia de `ForecastChart.tsx` | Arquivo existe |
| G3-05 | PredictiveAlerts criado | `rg "PredictiveAlertGenerator" app/src/lib/intelligence/predictive/alert-generator.ts` | 1+ match |
| G3-06 | PB-06 guard | `rg "10\|threshold" app/src/lib/intelligence/predictive/alert-generator.ts` | 1+ match |
| G3-07 | Research page criada | Verificar existencia de `app/src/app/intelligence/research/page.tsx` | Arquivo existe |
| G3-08 | DossierViewer criado | Verificar existencia de `dossier-viewer.tsx` | Arquivo existe |
| G3-09 | Sidebar Deep Research | `rg "deep-research\|Deep Research" app/src/lib/constants.ts` | 1+ match |
| G3-10 | Telescope icon | `rg "Telescope" app/src/lib/icon-maps.ts` | 1+ match |
| G3-11 | Hook usePredictiveData | `rg "usePredictiveData" app/src/lib/hooks/use-predictive-data.ts` | 1+ match |
| G3-12 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G3-13 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 4 so inicia se G3-01 a G3-13 todos aprovados.

**AC:**
- [ ] G3-01 a G3-13 todos aprovados

---

## Fase 4: Governanca Final [~0.5h]

> **PRE-REQUISITO ABSOLUTO:** S35-GATE-03 aprovado.

---

### S35-GOV-05: Contratos + Contract-Map Update [S, ~30min]

**Objetivo:** Criar contratos das novas lanes e atualizar `contract-map.yaml`.

> **[ARCH DT-16 — BLOCKING]:** "Contract First" — criar contratos ANTES de atualizar contract-map.

**Acao:**
1. CRIAR `_netecmt/contracts/predictive-intelligence-spec.md`:
   - Documentar lane `predictive_intelligence` com paths, tipos exportados, e APIs

2. CRIAR `_netecmt/contracts/deep-research-spec.md`:
   - Documentar lane `deep_research` com paths, tipos exportados, e APIs

3. Em `_netecmt/core/contract-map.yaml`, ADICIONAR:

```yaml
predictive_intelligence:
  paths:
    - "app/src/lib/intelligence/predictive/**"
    - "app/src/app/api/intelligence/predictive/**"
    - "app/src/components/intelligence/predictive/**"
    - "app/src/app/intelligence/predictive/**"
    - "app/src/lib/hooks/use-predictive-data.ts"
    - "app/src/lib/ai/prompts/predictive-forecast.ts"
    - "app/src/lib/ai/prompts/predictive-scoring.ts"
    - "app/src/types/predictive.ts"
  contract: "_netecmt/contracts/predictive-intelligence-spec.md"

deep_research:
  paths:
    - "app/src/lib/intelligence/research/**"
    - "app/src/lib/firebase/research.ts"
    - "app/src/app/api/intelligence/research/**"
    - "app/src/app/intelligence/research/**"
    - "app/src/components/intelligence/research/**"
    - "app/src/lib/ai/prompts/research-synthesis.ts"
    - "app/src/types/research.ts"
  contract: "_netecmt/contracts/deep-research-spec.md"
```

**Arquivos:**
- `_netecmt/contracts/predictive-intelligence-spec.md` — **CRIAR** (DT-16 BLOCKING)
- `_netecmt/contracts/deep-research-spec.md` — **CRIAR** (DT-16 BLOCKING)
- `_netecmt/core/contract-map.yaml` — **MODIFICAR** (novas lanes)

**DTs referenciados:** DT-16 (BLOCKING — Contract First)
**Dependencias:** S35-GATE-03 aprovado
**Gate Check:** Nao

**AC:**
- [ ] Contrato `predictive-intelligence-spec.md` criado (DT-16)
- [ ] Contrato `deep-research-spec.md` criado (DT-16)
- [ ] `contract-map.yaml` com lanes `predictive_intelligence` + `deep_research` (CS-35.23)
- [ ] Zero erro de parse YAML
- [ ] Zero conflito com lanes existentes

---

### S35-GOV-06: ACTIVE_SPRINT.md + ROADMAP.md [XS, ~15min]

**Objetivo:** Atualizar documentos de sprint com resultado final.

**Acao:**
1. Em `_netecmt/sprints/ACTIVE_SPRINT.md`:
   - Atualizar status de todas as fases e stories para CONCLUIDO
   - Atualizar milestones
   - Registrar metricas finais

2. Em `_netecmt/ROADMAP.md`:
   - Registrar S35 com features entregues

**Arquivos:**
- `_netecmt/sprints/ACTIVE_SPRINT.md` — **MODIFICAR**
- `_netecmt/ROADMAP.md` — **MODIFICAR**

**DTs referenciados:** Nenhum
**Dependencias:** S35-GOV-05 concluido
**Gate Check:** Nao

**AC:**
- [ ] ACTIVE_SPRINT.md reflete S35 com metricas finais
- [ ] ROADMAP.md tem entrada S35 com features entregues

---

## Testes Recomendados (Novos — Dandara)

> **Todos os testes de Firestore devem usar mocks de `firebase/firestore` (via `jest.mock()`). NUNCA chamar Firestore real em testes automatizados.**

| # | Teste | Tipo | Arquivo Sugerido | Story |
|:--|:------|:-----|:----------------|:------|
| T-01 | Lead 20d sem evento > lead 2d sem evento (churnRisk) | Unit | `churn-predictor.test.ts` | PRED-02 |
| T-02 | Batch max 500 leads | Unit (mock) | `churn-predictor.test.ts` | PRED-02 |
| T-03 | Paginacao cursor nextCursor + hasMore | Unit (mock) | `churn-predictor.test.ts` | PRED-02 |
| T-04 | Lead sem eventos → churnRisk 0.8 | Unit | `churn-predictor.test.ts` | PRED-02 |
| T-05 | Lead criado < 48h excluido | Unit | `churn-predictor.test.ts` | PRED-02 |
| T-06 | engagementTrend declining → +0.2 | Unit | `churn-predictor.test.ts` | PRED-02 |
| T-07 | hot + inatividade → +0.15 | Unit | `churn-predictor.test.ts` | PRED-02 |
| T-08 | churnRisk >= 0.7 + hot → warm | Unit | `churn-predictor.test.ts` | PRED-02 |
| T-09 | LTV 3 cohorts retornados | Unit (mock) | `ltv-estimator.test.ts` | PRED-03 |
| T-10 | hot projectedLTV > warm > cold | Unit | `ltv-estimator.test.ts` | PRED-03 |
| T-11 | Multipliers override por brand | Unit (mock) | `ltv-estimator.test.ts` | PRED-03 |
| T-12 | Confidence score por volume | Unit | `ltv-estimator.test.ts` | PRED-03 |
| T-13 | Brand sem leads → graceful degradation | Unit (mock) | `ltv-estimator.test.ts` | PRED-03 |
| T-14 | Revenue de journey_events | Unit (mock) | `ltv-estimator.test.ts` | PRED-03 |
| T-15 | Dossie completo gerado | Unit (mock) | `engine.test.ts` | RES-01 |
| T-16 | Cache hit retorna dossie existente | Unit (mock) | `engine.test.ts` | RES-01 |
| T-17 | Exa fail → status failed | Unit (mock) | `engine.test.ts` | RES-01 |
| T-18 | Firecrawl fail parcial → continua | Unit (mock) | `engine.test.ts` | RES-01 |
| T-19 | Depth quick → 5 Exa, 0 Firecrawl | Unit (mock) | `engine.test.ts` | RES-01 |
| T-20 | Depth standard → 10 Exa, 3 Firecrawl | Unit (mock) | `engine.test.ts` | RES-01 |
| T-21 | Depth deep → 15 Exa, 5 Firecrawl | Unit (mock) | `engine.test.ts` | RES-01 |
| T-22 | Sources com attribution (URL + provider) | Unit | `engine.test.ts` | RES-01 |

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 6 Blocking DTs compreendidos:
  - [ ] **DT-01**: `runTransaction` com read+update completo (GOV-01)
  - [ ] **DT-05**: `types/research.ts` separado, NAO em predictive.ts (PRED-01)
  - [ ] **DT-07**: Batch 500 + paginacao cursor (PRED-02)
  - [ ] **DT-08**: LTV multipliers configuraveis por brand (PRED-03)
  - [ ] **DT-12**: Research synthesis chunked 2 fases (RES-02)
  - [ ] **DT-16**: Contratos ANTES de contract-map (GOV-05)
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-S34)
- [ ] Confirmar testes passando (baseline 302/302)

### Validacoes incrementais — Fase 0:
- [ ] Apos GOV-01: runTransaction em updateVariantMetrics
- [ ] Apos GOV-02: selectedSegment propagado para todas visoes
- [ ] Apos GOV-03: MessageChannel mock com cleanup
- [ ] Apos GOV-04: 7 stubs documentados/resolvidos
- [ ] **GATE CHECK 0**: G0-01 a G0-08

### Validacoes incrementais — Fase 1:
- [ ] Apos PRED-01: Types expandidos + types/research.ts criado
- [ ] Apos PRED-02: ChurnPredictor + paginacao cursor + testes
- [ ] Apos PRED-03: LTVEstimator + config por brand + forecastCohortROI refatorado + testes
- [ ] Apos PRED-04: AudienceForecaster + narrativa Gemini
- [ ] Apos PRED-05: 3 APIs funcionais
- [ ] **GATE CHECK 1**: G1-01 a G1-18

### Validacoes incrementais — Fase 2:
- [ ] Apos RES-01: ResearchEngine com Exa + Firecrawl + graceful degradation + testes
- [ ] Apos RES-02: DossierGenerator chunked 2 fases + prompts
- [ ] Apos RES-03: Research storage Firestore + cache 24h
- [ ] Apos RES-04: API research POST + GET
- [ ] **GATE CHECK 2**: G2-01 a G2-12

### Validacoes incrementais — Fase 3:
- [ ] Apos DASH-01: Dashboard com 5 tabs (ScaleSimulator intacto)
- [ ] Apos DASH-02: Alertas preditivos engine + UI
- [ ] Apos DASH-03: Research page + dossier viewer + sidebar
- [ ] Apos DASH-04: Hook usePredictiveData
- [ ] **GATE CHECK 3**: G3-01 a G3-13

### Validacoes incrementais — Fase 4:
- [ ] Apos GOV-05: Contratos + contract-map.yaml com 2 novas lanes
- [ ] Apos GOV-06: ACTIVE_SPRINT.md + ROADMAP.md atualizados

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] Testes → 0 fail, >= 302 + novos testes (~320-330 estimado)
- [ ] Build → >= ~109 + novas rotas (~113-117 estimado)
- [ ] Zero `any`, zero `Date`, zero `@ts-ignore`
- [ ] Todas rotas novas com `force-dynamic` + `requireBrandAccess`
- [ ] Contract-map atualizado com 2 novas lanes
- [ ] Contratos criados (DT-16)
- [ ] types/research.ts separado (DT-05)
- [ ] Paginacao cursor no churn (DT-07)
- [ ] LTV multipliers configuraveis (DT-08)
- [ ] Research synthesis chunked (DT-12)
- [ ] Zero research sem cache check (PB-03)
- [ ] Zero research sem fallback (PB-04)
- [ ] Zero Gemini em churn (PB-01)

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 16 Decision Topics do Architecture Review (Athos)*
*Sprint 35: Predictive Intelligence & Deep Research | 09/02/2026*
*19 stories + 4 gates | 6 Blocking DTs (DT-01, DT-05, DT-07, DT-08, DT-12, DT-16) | Estimativa: ~20-24h*
*Legenda: XS = Extra Small (< 15min), S = Small (< 1h), M = Medium (1-2h), M+ = Medium Extended (~1.5h), L = Large (> 2h)*
