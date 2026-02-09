# Architecture Review: Sprint 34 — A/B Testing & Segment Optimization

**Versao:** 1.0
**Responsavel:** Athos (Architect)
**Status:** APROVADO COM RESSALVAS (10 DTs originais + 4 DTs adicionais, 2 Blocking)
**Data:** 09/02/2026
**PRD Referencia:** `prd-sprint-34-ab-testing-segment-optimization.md` (Iuran)
**Baseline:** Sprint 33 concluida (QA 96/100, 286/286 testes, 50 suites, tsc=0, ~109 rotas)

---

## 1. Escopo do Review

Validacao arquitetural de 5 dominios da Sprint 34:
- **S34-GOV:** Governanca & Backlog S33 (Timer leak N1, engagementScore N2)
- **S34-AB:** A/B Test Engine (data model + engine + hash assignment + significance + CRUD + UI)
- **S34-SEG:** Performance por Segmento (filter + breakdown + advisor insights)
- **S34-AO:** Auto-Optimization (pause losers + declare winners + kill-switch + logging)
- **S34-GOV-FINAL:** Governanca Final (contract-map + docs)

### 1.1 Documentos Analisados

| Documento | Status |
|:----------|:-------|
| PRD Sprint 34 (Iuran) | Lido integralmente — 486 linhas |
| ACTIVE_SPRINT.md | Lido — S34 em planejamento |
| ROADMAP.md | Lido — S34 registrado, mapa de dependencias confirmado |
| contract-map.yaml | Lido — 17 lanes existentes, proposta de nova lane |
| s34-backlog-notes.md | Lido — N1 (timer leak), N2 (engagementScore) |
| arch-sprint-33.md | Lido — referencia de formato e DTs |
| jest.setup.js | Lido — polyfill MessageChannel, afterAll global |
| use-brands.test.ts | Lido — cleanup patterns (apenas beforeEach) |
| use-brand-assets.test.ts | Lido — cleanup patterns (apenas beforeEach) |
| rag.ts | Lido — funcao `hashString()` (djb2, S28) |
| firestore.ts | Lido — subcollection patterns |
| automation.ts (firebase) | Lido — `brands/{brandId}/automation_logs` pattern |
| performance-advisor.ts (engine) | Lido — `generateInsights()`, single Gemini call |
| performance-advisor.ts (prompts) | Lido — `buildPerformanceAdvisorPrompt()` template |
| constants.ts | Lido — NAV_GROUPS (5 grupos, NavItem/NavGroup types) |
| sidebar.tsx | Lido — renderizacao de NAV_GROUPS, SIDEBAR_ICONS |
| automation/engine.ts | Lido — `checkKillSwitch()` static method |
| personalization/engine.ts | Lido — PropensityEngine.calculate(), segment counts |
| types/social.ts | Lido — SocialInteractionRecord com engagementScore? |
| types/database.ts | Lido — Brand, BrandAsset types |
| gemini.ts | Lido — `generateWithGemini()` com systemPrompt → system_instruction |
| content/generation-engine.ts | Lido — 4 formatos, Brand Voice injection, Zod |
| content-calendar.ts | Lido — subcollection `brands/{brandId}/content_calendar` |

### 1.2 Patterns Sigma Confirmados no Codebase

| Pattern | Evidencia | Arquivo Referencia |
|:--------|:----------|:-------------------|
| `createApiError(status, msg)` | 54+ rotas | `lib/utils/api-response.ts` |
| `createApiSuccess(data)` | 54+ rotas | `lib/utils/api-response.ts` |
| `requireBrandAccess(req, brandId)` | 25+ rotas | `lib/auth/brand-guard.ts` |
| `Timestamp.now()` (nao Date) | Todos os CRUD helpers | `lib/firebase/firestore.ts` |
| `export const dynamic = 'force-dynamic'` | Todas as rotas dinamicas | Todas as rotas API |
| Subcollection `brands/{brandId}/*` | 6+ subcollections | automation_logs, content_calendar, etc. |
| `generateWithGemini()` + JSON mode | 15+ chamadas | `lib/ai/gemini.ts` |
| Prompts em `lib/ai/prompts/` | 8+ prompts | `lib/ai/prompts/*.ts` |
| `writeBatch()` para atomic multi-doc | assets, agency | `lib/firebase/assets.ts` |
| `runTransaction()` para atomic r/w | rate-limiter | `lib/middleware/rate-limiter.ts` |
| `djb2` hash function | `hashString()` | `lib/ai/rag.ts` (S28) |
| Zod validation | schemas em 5+ modulos | social, content, audience |
| `collection(db, 'brands', brandId, 'sub')` | Padrao Firestore isolamento | automation.ts, vault.ts, content-calendar.ts |

---

## 2. Decision Topics Originais (DT-01 a DT-10)

### DT-01: Timer Leak — Estrategia de Cleanup (NON-BLOCKING)

**Questao:** `cleanup()`/`unmount()` per-hook em `afterEach` vs isolamento do polyfill `MessageChannel` no `jest.setup.js` vs `--forceExit`?

**Evidencia coletada:**

1. `jest.setup.js` (L4-9): Importa `MessageChannel` de `node:worker_threads` e seta como global.
2. `jest.setup.js` (L98-103): `afterAll` global com `jest.clearAllTimers()` + `jest.useRealTimers()` + `jest.restoreAllMocks()` — adicionado na S33 mas insuficiente.
3. `use-brands.test.ts` (L17-21): Apenas `beforeEach` com `jest.clearAllMocks()`. **Nenhum `afterEach`**. Nenhum `unmount()`.
4. `use-brand-assets.test.ts` (L25-27): Apenas `beforeEach` com `jest.clearAllMocks()`. **Nenhum `afterEach`**. Nenhum `unmount()`.
5. `s34-backlog-notes.md`: Causa raiz confirmada como `MessagePort` via `--detectOpenHandles`. 3 hooks afetados.

**Decisao: ESTRATEGIA EM 2 CAMADAS**

| Camada | Acao | Justificativa |
|:-------|:-----|:-------------|
| **Camada 1 (Preferencial)** | Adicionar `afterEach` com `cleanup()` do `@testing-library/react` em cada um dos 3 arquivos de teste de hooks. O `renderHook()` retorna `{ result, unmount }` — chamar `unmount()` no `afterEach`. | React Testing Library exige teardown explicito. O `cleanup()` global (se importado) nem sempre limpa MessagePort. O `unmount()` per-test garante que o hook e desmontado e o MessagePort fechado. |
| **Camada 2 (Fallback)** | Se Camada 1 nao eliminar 100% dos warnings: adicionar `--forceExit` no `jest.config.js` com comentario `// @todo S35: investigar polyfill MessageChannel isolado`. | `--forceExit` e seguro para CI/CD (o Jest ja passou todos os testes). Nao mascarara falhas reais. |

**Rejeicao de alternativas:**
- Remover polyfill `MessageChannel`: **Nao** — necessario para jsdom + React hooks que usam `structuredClone`/`postMessage`.
- Isolar polyfill em `setupFilesAfterFramework`: **Complexo** — o Jest nao permite isolamento granular de globals por suite sem projetos separados. Desproporcional para S34.

**Pattern de referencia para Camada 1:**
```typescript
// Em cada teste de hook (use-brands.test.ts, use-brand-assets.test.ts, use-funnels.test.ts)
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})
```

**Classificacao:** NON-BLOCKING — warning apenas, zero impacto funcional.

---

### DT-02: engagementScore Query — Index Firestore (NON-BLOCKING)

**Questao:** `orderBy('engagementScore', 'desc').limit(5)` na subcollection `social_interactions` — precisa de index composto?

**Evidencia coletada:**

1. `types/social.ts` (L82-93): `SocialInteractionRecord` com `engagementScore?: number` — campo **opcional** (0.0 a 1.0).
2. Collection path confirmado: `brands/{brandId}/social_interactions` (subcollection, ja isolada por brandId).
3. Firestore single-field indexes: **automaticos** para todos os campos. Um `orderBy('engagementScore', 'desc')` sem `where()` adicional usa o index single-field automatico.
4. Campo opcional: documentos sem `engagementScore` sao excluidos automaticamente pelo Firestore em queries `orderBy` — comportamento desejado (graceful degradation).

**Decisao: `orderBy('engagementScore', 'desc').limit(5)` — SEM index composto necessario**

| Aspecto | Decisao |
|:--------|:--------|
| **Query** | `orderBy('engagementScore', 'desc').limit(5)` |
| **Index** | Single-field automatico do Firestore (nenhuma acao manual) |
| **Graceful degradation** | Se nenhum doc tiver `engagementScore`, query retorna `[]`. Engine continua sem exemplos. |
| **Localizacao do modulo** | `lib/content/engagement-scorer.ts` (novo) conforme PRD |
| **Injecao no prompt** | Adicionar bloco condicional em `generation-engine.ts`: se exemplos.length > 0, injetar secao "Exemplos de alta performance" no prompt |

**Observacao:** Se futuramente for necessario filtrar por `platform` + ordenar por `engagementScore`, **ai sim** sera necessario index composto. Mas para MVP S34, a query simples e suficiente.

**Classificacao:** NON-BLOCKING — query simples com index automatico.

---

### DT-03: `ab_tests` como Subcollection — Confirmar Pattern (NON-BLOCKING)

**Questao:** `brands/{brandId}/ab_tests` — confirmar alinhamento com pattern existente?

**Evidencia coletada (subcollections existentes):**

| Subcollection | Arquivo | Sprint |
|:-------------|:--------|:-------|
| `brands/{brandId}/automation_rules` | `lib/firebase/automation.ts` L37 | S31 |
| `brands/{brandId}/automation_logs` | `lib/firebase/automation.ts` L84 | S31 |
| `brands/{brandId}/notifications` | `lib/firebase/automation.ts` L125 | S31 |
| `brands/{brandId}/dead_letter_queue` | `lib/firebase/automation.ts` L153 | S31 |
| `brands/{brandId}/content_calendar` | `lib/firebase/content-calendar.ts` L44 | S33 |
| `brands/{brandId}/social_interactions` | `lib/firebase/content-calendar.ts` (ref) | S33 |
| `brands/{brandId}/secrets` | `lib/firebase/vault.ts` | S18 |

**Decisao: CONFIRMADO — `brands/{brandId}/ab_tests` segue pattern existente**

Subcollection por `brandId` e o padrao universal do projeto para dados brand-scoped. **7 subcollections existentes seguem este pattern.** Zero excecoes.

**Beneficios confirmados:**
- Isolamento multi-tenant nativo (P-08 satisfeito pela estrutura)
- Security Rules do Firestore podem ser aplicadas a nivel de subcollection
- Queries nao necessitam `where('brandId', '==', ...)` — path ja isola
- Consistente com toda a equipe e docs existentes

**Classificacao:** NON-BLOCKING — confirmacao de pattern.

---

### DT-04: Hash Assignment — djb2 vs SHA-256 (NON-BLOCKING)

**Questao:** `djb2(leadId + testId) % variantCount` vs SHA-256 truncado?

**Evidencia coletada:**

1. `lib/ai/rag.ts` (L289-307): `hashString()` implementa djb2 com seed 5381, 32-bit unsigned, retorna 8-char hex.
2. djb2 e sincrono, deterministico, sem dependencias.
3. SHA-256 requer `crypto.subtle.digest()` (async) ou `node:crypto` (sync mas import pesado).
4. Para A/B testing com 2-5 variantes, a uniformidade do djb2 32-bit e mais que suficiente.
5. PB-02 proibe assignment nao-deterministico — ambos sao deterministicos, mas djb2 e mais simples.

**Decisao: djb2 — Reutilizar logica existente, NAO reutilizar funcao diretamente**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Algoritmo** | djb2 | Simples, sincrono, deterministico, 32-bit suficiente para 2-5 variantes |
| **Implementacao** | Nova funcao `hashAssign(leadId, testId, variantCount): number` em `lib/intelligence/ab-testing/engine.ts` | Semantica diferente de `hashString()` no RAG (retorna hex, nao indice). Funcao dedicada e mais clara e testavel. |
| **Formula** | `djb2(leadId + ':' + testId) >>> 0 % variantCount` | Separador `:` evita colisao entre "abc"+"def" e "ab"+"cdef" |
| **Rejeicao SHA-256** | Overhead async desnecessario. 32-bit com 2-5 buckets tem distribuicao excelente. |

**Nota tecnica:** O operador `>>> 0` garante unsigned 32-bit antes do modulo, evitando indices negativos.

**Pattern:**
```typescript
function hashAssign(leadId: string, testId: string, variantCount: number): number {
  const input = `${leadId}:${testId}`;
  let hash = 5381;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) + hash) + input.charCodeAt(i);
    hash = hash & 0xFFFFFFFF;
  }
  return (hash >>> 0) % variantCount;
}
```

**Classificacao:** NON-BLOCKING — escolha clara com precedente no codebase.

---

### DT-05: Z-test — Formula Inline vs Funcao Utility (NON-BLOCKING)

**Questao:** Z-test para proporcoes — inline ou funcao utility reutilizavel?

**Evidencia coletada:**

1. `performance/engine/anomaly-engine.ts` (L11-20): Ja existe `calculateZScore()` para metricas de performance — mas e Z-score (desvio da media), **nao** Z-test para proporcoes (duas amostras).
2. `intelligence/mmm/correlator.ts`: Tem `pearsonCorrelation` — prova que funcoes estatisticas sao modularizadas no projeto.
3. Formula do Z-test para proporcoes e padrao: ~15 linhas, sem lib.
4. PB-01 proibe lib estatistica externa.

**Decisao: FUNCAO UTILITY DEDICADA em `lib/intelligence/ab-testing/significance.ts`**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Modulo** | `lib/intelligence/ab-testing/significance.ts` | Arquivo separado do engine para SRP (Single Responsibility) e testabilidade isolada |
| **Funcao principal** | `calculateSignificance(variantA, variantB): { zScore, pValue, significance, isSignificant }` | Retorna objeto rico (nao so p-value) para UI e logging |
| **p-value** | Aproximacao via tabela de lookup ou `erfc()` simplificada (nao precisa de precisao de 6 casas decimais) | Tabela com ~20 entries para Z-scores comuns (1.0 a 4.0) e suficiente. Alternativa: formula `erfc` em ~10 linhas |
| **Rejeicao inline** | Formula inline no engine dificulta testes unitarios e viola DRY se precisar ser usada em relatorios futuros |
| **Validacoes** | Retornar `significance: 0` se `n1 < 30` ou `n2 < 30` (minimum sample size estatistico). Retornar `isSignificant: false` se `impressions < 100` (PB-03). |

**Formula de referencia:**
```typescript
function zTestForProportions(
  conversionsA: number, impressionsA: number,
  conversionsB: number, impressionsB: number
): { zScore: number; pValue: number; significance: number; isSignificant: boolean } {
  const p1 = conversionsA / impressionsA;
  const p2 = conversionsB / impressionsB;
  const pPool = (conversionsA + conversionsB) / (impressionsA + impressionsB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / impressionsA + 1 / impressionsB));
  if (se === 0) return { zScore: 0, pValue: 1, significance: 0, isSignificant: false };
  const z = Math.abs(p1 - p2) / se;
  const pValue = approximatePValue(z); // lookup table ou erfc
  const significance = 1 - pValue;
  return { zScore: z, pValue, significance, isSignificant: significance >= 0.95 };
}
```

**Classificacao:** NON-BLOCKING — design claro, funcao utility e o padrao do projeto.

---

### DT-06: UI A/B Testing — Pagina Dedicada vs Tab (NON-BLOCKING)

**Questao:** Pagina dedicada `/intelligence/ab-testing/page.tsx` ou tab na pagina Intelligence existente?

**Evidencia coletada (patterns existentes):**

| Feature | Path | Tipo | Complexidade |
|:--------|:-----|:-----|:-------------|
| Offer Lab | `/intelligence/offer-lab/page.tsx` | Pagina dedicada | Alta (wizard + score) |
| Creative | `/intelligence/creative/page.tsx` | Pagina dedicada | Alta (ranking + generation) |
| Journey | `/intelligence/journey/page.tsx` | Pagina dedicada | Alta (timeline + events) |
| Discovery | `/intelligence/discovery/page.tsx` | Pagina dedicada | Alta (keywords + spy) |
| Attribution | `/intelligence/attribution/page.tsx` | Pagina dedicada | Alta (charts + modelos) |
| Personalization | `/intelligence/personalization/page.tsx` | Pagina dedicada | Alta (rules + resolver) |

**Decisao: PAGINA DEDICADA `/intelligence/ab-testing/page.tsx`**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Rota** | `/intelligence/ab-testing/page.tsx` | 100% consistente com 6 features existentes no grupo Intelligence |
| **Sidebar** | Adicionar `{ id: 'ab-testing', label: 'A/B Testing', href: '/intelligence/ab-testing', icon: 'FlaskConical' }` no grupo `intelligence` em `NAV_GROUPS` | FlaskConical existe no bundle Lucide (shadcn/ui) |
| **Posicao no sidebar** | Apos `journey` (ultimo item atual) | Features de experimentacao sao logicamente "apos" analise de dados |
| **Rejeicao tab** | A/B Testing tem wizard de criacao (3 steps), tabela de resultados, charts, auto-optimization toggle e historico — complexidade incompativel com tab |

**Impacto no `constants.ts`:**
```typescript
// Grupo intelligence.items — adicionar como ultimo item:
{ id: 'ab-testing', label: 'A/B Testing', href: '/intelligence/ab-testing', icon: 'FlaskConical' }
```

**Impacto no `sidebar.tsx`:** Zero — sidebar renderiza dinamicamente a partir de `NAV_GROUPS`.

**SIDEBAR_ICONS:** Verificar se `FlaskConical` esta mapeado em `lib/guards/resolve-icon.ts` / `lib/icon-maps.ts`. Se nao, adicionar. Pattern existente para icones novos.

**Classificacao:** NON-BLOCKING — pattern unanime no codebase.

---

### DT-07: Segment Filter — Query Strategy (NON-BLOCKING)

**Questao:** Firestore `where('segment', '==', param)` + client aggregate vs pre-computar breakdown?

**Evidencia coletada:**

1. Performance metrics vem dos adapters (Meta/Google), nao diretamente dos leads. A rota `/api/performance/metrics` busca `PerformanceMetricDoc` — metricas de ads por plataforma/campanha/ad.
2. Leads vivem em collection top-level `leads` com campo `brandId` + `segment` (LeadState S29, 12 campos incluindo `segment`).
3. Para filtrar metricas de performance POR segmento, o flow seria: buscar leads do segmento → cross-reference com eventos de conversao → agregar metricas. **Isso e complexo e lento.**
4. Alternativa pragmatica: o SegmentBreakdown mostra **leads** agrupados por segmento com suas metricas proprias (total leads, conversions, avg revenue, CR), nao metricas de ads.

**Decisao: APPROACH HIBRIDO — 2 queries separadas**

| Componente | Query | Dados |
|:-----------|:------|:------|
| **SegmentFilter no Performance** | `where('brandId', '==', brandId).where('segment', '==', param)` na collection `leads` + aggregate client-side | Leads filtrados por segmento com suas metricas de conversao |
| **SegmentBreakdown** | 3 queries paralelas (hot/warm/cold) com `limit(1000)` + `count()` aggregation | Cards comparativos de leads por segmento |
| **Metricas de Ads (existente)** | Inalterado — `/api/performance/metrics` continua retornando metricas globais por plataforma | War Room existente nao muda |

**Decisao tecnica: Firestore Composite Index NECESSARIO**

Para a query `where('brandId', '==', brandId).where('segment', '==', param)` na collection `leads`:
- **Index composto:** `brandId` (ASC) + `segment` (ASC)
- Firestore exige index composto para queries com 2+ campos em `where()`
- Documentar no Story Pack como pre-requisito

**Graceful degradation:** Se `segment` nao existir no lead (dados antigos pre-S29), o lead nao aparece nos resultados filtrados — comportamento correto.

**Rejeicao de pre-compute:** Collection separada com breakdown pre-computado exige trigger function (Cloud Functions / firebase-admin proibido por P-02) ou cron job. Overhead desproporcional para MVP. Revisitar em S35 se performance for insuficiente.

**Classificacao:** NON-BLOCKING — approach pragmatico, index composto documentado.

---

### DT-08: PerformanceAdvisor Prompt — Inject vs Dual Call (NON-BLOCKING)

**Questao:** Inject segment data no prompt existente vs segundo call dedicado?

**Evidencia coletada:**

1. `performance-advisor.ts` (engine, L24-43): `generateInsights(metrics, alerts, targetRoas)` — single call a `generateWithGemini()`.
2. `performance-advisor.ts` (prompts, L6-70): `buildPerformanceAdvisorPrompt(metrics, alerts, targetRoas)` — funcao pura que constroi prompt.
3. Pattern existente: SEMPRE single call com prompt enriquecido. Nenhum modulo do codebase faz dual-call para Gemini para a mesma feature.
4. Custo: Gemini 2.0 Flash cobra por input token. Dual-call duplica o custo para cada request.

**Decisao: INJECT no prompt existente — EXTENSAO da funcao builder**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Funcao** | Adicionar parametro opcional `segmentData?: SegmentBreakdownData` em `buildPerformanceAdvisorPrompt()` | Backward-compatible — sem segmentData, prompt e identico ao atual |
| **Prompt section** | Adicionar bloco condicional: `### Breakdown por Segmento de Propensity:` com Hot/Warm/Cold metricas | Gemini recebe contexto adicional e gera insights comparativos |
| **Engine** | Adicionar parametro opcional `segmentData?` em `generateInsights()` e passar para o builder | Extensao simples, 1 parametro novo |
| **Rejeicao dual-call** | 2x custo Gemini, 2x latencia, complexidade de merge de resultados. Zero beneficio para o usuario. |

**Pattern de extensao:**
```typescript
export const buildPerformanceAdvisorPrompt = (
  metrics: PerformanceMetricDoc[],
  alerts: PerformanceAlertDoc[],
  targetRoas: number,
  segmentData?: { hot: SegmentMetrics; warm: SegmentMetrics; cold: SegmentMetrics }
) => {
  // ... prompt existente inalterado ...
  
  const segmentSection = segmentData ? `
### Breakdown por Segmento de Propensity:
- HOT (alta probabilidade de conversao): ${segmentData.hot.totalLeads} leads, CR: ${segmentData.hot.conversionRate}%, Revenue medio: $${segmentData.hot.avgRevenue}
- WARM (probabilidade media): ${segmentData.warm.totalLeads} leads, CR: ${segmentData.warm.conversionRate}%, Revenue medio: $${segmentData.warm.avgRevenue}  
- COLD (baixa probabilidade): ${segmentData.cold.totalLeads} leads, CR: ${segmentData.cold.conversionRate}%, Revenue medio: $${segmentData.cold.avgRevenue}

Inclua insights comparativos entre segmentos nas recomendacoes.
` : '';

  return `${basePrompt}${segmentSection}`;
};
```

**Classificacao:** NON-BLOCKING — extensao backward-compatible.

---

### DT-09: Auto-Optimization Thresholds — Hardcoded vs Configuraveis (NON-BLOCKING)

**Questao:** Thresholds hardcoded como constants vs configuraveis por teste?

**Evidencia coletada:**

1. PRD RF-34.3.2: Define 3 regras com thresholds especificos (CR < 50% lider, significancia >= 95%, 0 conversoes apos 500 impressoes).
2. PRD RF-34.3.2 tambem menciona: "Thresholds configuraveis no teste (campos `minImpressionsForDecision`, `significanceThreshold`)".
3. Pattern existente: `AI_COST_GUARD_CONFIG` em `constants.ts` usa defaults com override por brand. BudgetOptimizer usa constants fixos.

**Decisao: HYBRID — Constants com override opcional no ABTest type**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Defaults** | Constants no modulo `auto-optimizer.ts`: `MIN_IMPRESSIONS_FOR_DECISION = 100`, `SIGNIFICANCE_THRESHOLD = 0.95`, `LOSER_CR_RATIO = 0.5`, `EARLY_STOP_IMPRESSIONS = 500` | Defaults sensatos para MVP. Facil de encontrar e ajustar. |
| **Override** | Campos opcionais no ABTest type: `minImpressionsForDecision?: number`, `significanceThreshold?: number` | Permite override per-test sem mudar defaults globais |
| **Logica** | `const minImpressions = test.minImpressionsForDecision ?? MIN_IMPRESSIONS_FOR_DECISION` | Nullish coalescing — limpo e TypeScript-friendly |
| **UI** | Na Fase 1, NAO expor na UI. Wizard cria com defaults. Override via API PUT direto (power users). Expor na UI em S35 se necessario. | Reduz complexidade da UI na S34 sem perder flexibilidade |

**Classificacao:** NON-BLOCKING — design flexivel com baixa complexidade.

---

### DT-10: Optimization Log — Subcollection vs Array Field (NON-BLOCKING)

**Questao:** Subcollection `ab_tests/{testId}/optimization_log` ou campo array no documento do teste?

**Evidencia coletada:**

1. Pattern existente: `brands/{brandId}/automation_logs` (subcollection) em `lib/firebase/automation.ts` — append-only log para eventos de automacao.
2. Firestore document size limit: **1 MB**. Um `OptimizationDecision` com ~500 bytes, em array, permitiria ~2000 entries. Para testes de longa duracao com decisoes frequentes, isso pode ser insuficiente.
3. Pattern de history log imutavel ja estabelecido na S33 (approval workflow history como subcollection).
4. Subcollection permite query com `orderBy('timestamp', 'desc').limit(N)` — paginacao nativa.

**Decisao: SUBCOLLECTION `brands/{brandId}/ab_tests/{testId}/optimization_log`**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Path** | `brands/{brandId}/ab_tests/{testId}/optimization_log` | Nested subcollection — isolamento total por brandId + testId |
| **Pattern** | Identico a `brands/{brandId}/automation_logs` | Reuso de pattern comprovado |
| **Append-only** | Apenas `addDoc()`, nunca `updateDoc()` ou `deleteDoc()` | Historico imutavel para auditoria |
| **Query** | `orderBy('timestamp', 'desc').limit(50)` | Paginacao para UI de historico |
| **Rejeicao array** | Limite de 1MB, nao paginavel, requer read+write do doc inteiro para adicionar 1 entry |

**Nota sobre profundidade:** Firestore suporta subcollections aninhadas sem limite de profundidade. `brands/{brandId}/ab_tests/{testId}/optimization_log` e um path de 3 niveis — perfeitamente valido.

**Classificacao:** NON-BLOCKING — pattern estabelecido no projeto.

---

## 3. Decision Topics Adicionais (DT-11 a DT-14)

### DT-11: `getKillSwitchState(brandId)` — Funcao Inexistente (BLOCKING)

**Questao:** O PRD referencia `getKillSwitchState(brandId)` como dependencia existente da S31. Essa funcao existe?

**Evidencia coletada:**

1. **PRD RF-34.3.4:** "verificar estado do Kill-Switch via `getKillSwitchState(brandId)` (existente em S31)".
2. **PRD Secao 10 (Dependencias):** "Kill-Switch persistence + `getKillSwitchState()` | ✅ Funcional | S31".
3. **Busca no codebase:** `getKillSwitchState` **NAO EXISTE** em nenhum arquivo.
4. **Codigo existente S31:**
   - `AutomationEngine.checkKillSwitch(report)` em `lib/automation/engine.ts` (L143-149) — metodo estatico que avalia um `LegacyAutopsyReport`, **nao** le estado do Firestore.
   - `POST /api/automation/kill-switch/route.ts` — endpoint para **ativar** kill-switch (write), nao para ler estado.
   - `lib/firebase/automation.ts` — CRUD para logs/notifications, mas **nenhuma funcao que le o estado ativo do kill-switch**.
5. O kill-switch na S31 persiste um log de ativacao em `automation_logs` e envia notificacao, mas **nao ha funcao helper que retorna `boolean` indicando se o kill-switch esta ativo para uma marca**.

**Decisao: CRIAR `getKillSwitchState(brandId)` na S34 como prerequisito**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Localizacao** | `lib/firebase/automation.ts` (junto com outros helpers de automacao) | Modulo existente de CRUD de automacao |
| **Implementacao** | Query `brands/{brandId}/automation_logs` onde `type == 'kill_switch'`, `orderBy('timestamp', 'desc').limit(1)`. Se o ultimo log e de ativacao (`action: 'activate'`), retorna `true`. Se e de desativacao ou nao existe, retorna `false`. | Kill-switch e um toggle — ultimo estado e o valido |
| **Alternativa** | Adicionar campo `killSwitchActive: boolean` no documento da brand (top-level). Mais simples e performante (1 read vs query). | **Preferivel** — campo booleano com `Timestamp` de ultima mudanca |
| **Recomendacao final** | **Campo no brand doc** — `killSwitchState?: { active: boolean; activatedAt?: Timestamp; reason?: string }`. Leitura com `getBrand(brandId)` (existente) e suficiente. | Zero nova query, zero novo index, reuso de helper existente |
| **Sprint Item** | Integrar na S34-AO-02 (Kill-Switch integration) | Adicionar ~15min ao estimate da AO-02 |

**Impacto:** Este gap precisa ser resolvido **antes** da implementacao da Fase 3 (Auto-Optimization). Sem `getKillSwitchState`, a regra PB-04 ("ZERO auto-optimization se Kill-Switch ativo") nao pode ser verificada em runtime.

**Classificacao:** **BLOCKING** — prerequisito funcional para PB-04 e RF-34.3.4.

---

### DT-12: `hashString` Coupling — Extracao vs Import do RAG (NON-BLOCKING)

**Questao:** A funcao djb2 vive em `lib/ai/rag.ts`. Importar do RAG para AB Testing cria acoplamento semantico indesejado?

**Evidencia coletada:**

1. `hashString()` em `rag.ts` (L289-307): Retorna string hex de 8 chars. Para AB testing, precisamos de um **indice numerico** (`% variantCount`).
2. Imports cruzados entre dominios (intelligence → ai/rag) sao comuns no projeto, mas a semantica e diferente: RAG usa hash para deduplicacao, AB testing para assignment.

**Decisao: FUNCAO DEDICADA `hashAssign()` no modulo AB Testing**

| Aspecto | Decisao | Justificativa |
|:--------|:--------|:-------------|
| **Funcao** | `hashAssign(leadId, testId, variantCount): number` em `lib/intelligence/ab-testing/engine.ts` | Semantica propria, retorno diferente (number vs string), testavel isoladamente |
| **Algoritmo** | Mesmo djb2 (copiar logica, ~8 linhas) | Duplicacao aceitavel de 8 linhas vs acoplamento semantico com RAG |
| **Nao importar de rag.ts** | `hashString` retorna hex string e precisaria de `parseInt()` + `%` — conversao desnecessaria |

**Classificacao:** NON-BLOCKING — decisao de design, zero impacto funcional.

---

### DT-13: Performance API Segment Filter — Data Flow (NON-BLOCKING)

**Questao:** O PRD diz "extender `/api/performance/metrics` para aceitar query param `segment`". Mas metricas de performance vem dos ads adapters (Meta/Google), nao dos leads. Como filtrar metricas de ads por segmento de lead?

**Evidencia coletada:**

1. `/api/performance/metrics` retorna `PerformanceMetricDoc[]` — metricas por campanha/ad com spend, clicks, conversions, ROAS.
2. Leads tem campo `segment` (hot/warm/cold) mas nao estao diretamente vinculados a campanhas especificas.
3. A correlacao lead → campanha nao existe no modelo de dados atual.

**Decisao: SEPARAR CONCERNS — `/api/performance/metrics` NAO filtra por segmento**

| Componente | Implementacao | Justificativa |
|:-----------|:-------------|:-------------|
| **SegmentBreakdown** | Nova rota dedicada `/api/intelligence/segments/breakdown` OU query client-side na collection `leads` | Mostra metricas DE LEADS por segmento (total, conversions, avg revenue), NAO metricas de ads |
| **SegmentFilter** | Filtra a exibicao do SegmentBreakdown, nao as metricas de ads | Semantica correta — filtro e sobre leads, nao sobre campanhas |
| **Performance War Room** | Inalterado — `/api/performance/metrics` continua retornando metricas de ads globais | Zero breaking change |
| **Hook `useSegmentPerformance`** | Busca dados de leads agrupados por segmento via Firestore query | Dados de segmento sao do dominio intelligence, nao performance |

**Recomendacao ao PRD:** Refinar RF-34.2.2 — a extensao da rota `/api/performance/metrics` para `segment` param NAO e viavel sem correlacao lead → campanha. Em vez disso, o `SegmentBreakdown` deve ser alimentado por dados de leads diretamente. A rota performance/metrics permanece inalterada.

**Classificacao:** NON-BLOCKING — clarificacao de data flow, sem impacto na estimativa total.

---

### DT-14: `FlaskConical` no SIDEBAR_ICONS — Mapeamento de Icone (NON-BLOCKING)

**Questao:** O icone `FlaskConical` proposto para A/B Testing existe no mapeamento `SIDEBAR_ICONS`?

**Evidencia coletada:**

1. `sidebar.tsx` usa `resolveIcon(SIDEBAR_ICONS, item.icon, ...)` para mapear string → componente Lucide.
2. `SIDEBAR_ICONS` e definido em `lib/guards/resolve-icon.ts` ou `lib/icon-maps.ts`.
3. O Lucide bundle (via shadcn/ui) inclui `FlaskConical` — mas precisa estar mapeado em `SIDEBAR_ICONS`.

**Decisao: Verificar e adicionar `FlaskConical` no mapa de icones**

| Acao | Detalhe |
|:-----|:--------|
| Verificar `lib/icon-maps.ts` | Se `FlaskConical` ja esta mapeado, zero acao |
| Se nao mapeado | Adicionar `FlaskConical: FlaskConical` no objeto `SIDEBAR_ICONS` + import do Lucide |
| Fallback | `resolve-icon.ts` ja tem fallback generico — item apareceria mesmo sem mapeamento, mas com icone errado |

**Classificacao:** NON-BLOCKING — acao trivial durante implementacao.

---

## 4. Matriz de Classificacao

### 4.1 DTs Originais (PRD)

| DT | Tema | Classificacao | Decisao Resumida |
|:---|:-----|:-------------|:-----------------|
| DT-01 | Timer leak cleanup | **NON-BLOCKING** | Camada 1: `cleanup()` + `unmount()` per-hook. Camada 2: `--forceExit` fallback. |
| DT-02 | engagementScore query | **NON-BLOCKING** | `orderBy('engagementScore', 'desc').limit(5)`. Index automatico. Graceful degradation. |
| DT-03 | ab_tests subcollection | **NON-BLOCKING** | Confirmado: `brands/{brandId}/ab_tests`. Pattern universal (7 existentes). |
| DT-04 | Hash assignment | **NON-BLOCKING** | djb2 com separador `:`. Funcao dedicada `hashAssign()`. Rejeicao SHA-256. |
| DT-05 | Z-test implementacao | **NON-BLOCKING** | Funcao utility em `significance.ts`. Retorno rico `{ zScore, pValue, significance, isSignificant }`. |
| DT-06 | UI layout | **NON-BLOCKING** | Pagina dedicada `/intelligence/ab-testing`. Pattern unanime (6 features existentes). |
| DT-07 | Segment filter query | **NON-BLOCKING** | Hibrido: SegmentBreakdown com dados de leads. Index composto necessario. |
| DT-08 | Advisor prompt | **NON-BLOCKING** | Inject no prompt existente. Parametro opcional `segmentData?`. Backward-compatible. |
| DT-09 | Optimization thresholds | **NON-BLOCKING** | Constants + override opcional no ABTest type. UI com defaults, override via API. |
| DT-10 | Optimization log | **NON-BLOCKING** | Subcollection `optimization_log`. Append-only. Pattern de `automation_logs`. |

### 4.2 DTs Adicionais (Athos)

| DT | Tema | Classificacao | Decisao Resumida |
|:---|:-----|:-------------|:-----------------|
| DT-11 | `getKillSwitchState()` inexistente | **BLOCKING** | Criar funcao ou campo `killSwitchState` no brand doc. Prerequisito para PB-04. |
| DT-12 | hashString coupling | **NON-BLOCKING** | Funcao dedicada `hashAssign()`. Nao importar de rag.ts. |
| DT-13 | Performance API data flow | **NON-BLOCKING** | SegmentBreakdown usa dados de leads, nao metricas de ads. Rota performance inalterada. |
| DT-14 | FlaskConical icon mapping | **NON-BLOCKING** | Verificar/adicionar no SIDEBAR_ICONS. Trivial. |

---

## 5. Validacao de Proibicoes

| Proibicao | Risco Identificado | Mitigacao |
|:----------|:-------------------|:----------|
| P-01 (ZERO `any`) | Nenhum — tipos definidos no PRD | Enforcement via tsc |
| P-02 (ZERO firebase-admin) | Nenhum — todas as queries via Client SDK | Pattern existente |
| P-03 (ZERO SDK npm novo) | Nenhum — Z-test inline, djb2 inline | PB-01 reforça |
| P-04 (ZERO fora do allowed-context) | DT-11 adiciona campo no Brand type | Documentar no Story Pack como mudanca cross-lane |
| P-05 (ZERO ts-ignore) | Nenhum | Enforcement via tsc |
| P-06 (ZERO Date) | Nenhum — PRD especifica Timestamp em todos os campos | Pattern existente |
| P-07 (ZERO rota sem force-dynamic) | 5-6 novas rotas | Checklist no Gate Check |
| P-08 (ZERO cross-tenant) | Nenhum — subcollection isola por brandId | Pattern existente |
| PB-01 (ZERO lib estatistica) | Nenhum — Z-test inline (DT-05) | Funcao utility ~15 linhas |
| PB-02 (ZERO assignment nao-deterministico) | Nenhum — djb2 e puro e deterministico (DT-04) | Teste unitario obrigatorio |
| PB-03 (ZERO decisao sem >= 100 impressoes) | Nenhum — guard em `AutoOptimizer.evaluate()` | Teste unitario obrigatorio |
| PB-04 (ZERO auto-opt com Kill-Switch) | **DT-11 BLOCKING** — funcao nao existe | Criar `getKillSwitchState()` como prerequisito |
| PB-05 (ZERO drag-and-drop lib) | Nenhum — S34 nao tem D&D | N/A |
| PB-06 (ZERO publicacao real) | Nenhum — AB testing controla display, nao publicacao | Design do engine |

---

## 6. Validacao de Dependencias

| Dependencia | Status Verificado | Observacao |
|:-----------|:-----------------|:-----------|
| PropensityEngine (S28) | ✅ Confirmado | `PropensityEngine.calculate()` retorna `{ score, segment }` |
| PersonalizationResolver (S31) | ✅ Confirmado | Matching engine por segment |
| PerformanceAdvisor (S18/S30) | ✅ Confirmado | `generateInsights()` com builder pattern |
| Kill-Switch (S31) | ⚠️ **Parcial** | POST endpoint existe. `getKillSwitchState()` NAO existe (DT-11) |
| automation_logs (S31) | ✅ Confirmado | `createAutomationLog(brandId, log)` funcional |
| Content Generation Engine (S33) | ✅ Confirmado | 4 formatos, Brand Voice, Zod |
| SocialInteractionRecord (S33) | ✅ Confirmado | `engagementScore?: number` em `types/social.ts` |
| djb2 hash (S28) | ✅ Confirmado | `hashString()` em `lib/ai/rag.ts` |
| createApiError/Success (Sigma) | ✅ Confirmado | 54+ rotas |
| requireBrandAccess (Sigma) | ✅ Confirmado | 25+ rotas |
| generateWithGemini (S28) | ✅ Confirmado | systemPrompt → system_instruction, JSON mode |
| NAV_GROUPS (S21) | ✅ Confirmado | 5 grupos, NavItem type com id/label/href/icon |
| Lucide FlaskConical | ✅ Disponivel | No bundle via shadcn/ui |

---

## 7. Contract-Map Proposto

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

**Cross-lane touches (documentar no Story Pack):**
- `lib/constants.ts` — adicionar item em NAV_GROUPS (lane: core)
- `lib/icon-maps.ts` — adicionar FlaskConical (lane: core)
- `lib/performance/engine/performance-advisor.ts` — parametro segmentData (lane: performance_war_room)
- `lib/ai/prompts/performance-advisor.ts` — secao segment (lane: ai_retrieval)
- `lib/content/generation-engine.ts` — inject engagement (lane: content_autopilot)
- `lib/firebase/automation.ts` — getKillSwitchState (lane: automation)
- `types/database.ts` — killSwitchState no Brand type (lane: dashboard) — **se DT-11 optar por campo no brand doc**
- `jest.setup.js` — cleanup (lane: infrastructure)
- `__tests__/hooks/use-brands.test.ts` — cleanup (lane: infrastructure)
- `__tests__/hooks/use-brand-assets.test.ts` — cleanup (lane: infrastructure)

---

## 8. Riscos e Mitigacoes

| Risco | Probabilidade | Impacto | Mitigacao |
|:------|:-------------|:--------|:----------|
| Timer leak nao resolvido pela Camada 1 | Media | Baixo (warning apenas) | Camada 2: `--forceExit` com `@todo S35` |
| Firestore composite index esquecido | Baixa | Alto (query falha) | Documentar no Story Pack como pre-requisito |
| Z-test com imprecisao na aproximacao de p-value | Baixa | Medio (decisoes de otimizacao incorretas) | Teste unitario com dados conhecidos (tabela Z padrao) |
| Leads sem campo `segment` (dados antigos) | Media | Baixo | Graceful degradation — nao aparecem no filtro |
| Kill-Switch state inconsistente | Media | Alto (auto-opt indesejada) | DT-11: campo booleano atomico no brand doc |
| UI wizard complexo demais | Baixa | Medio (UX ruim) | 3 steps simples, pattern wizard existente no Offer Lab |

---

## 9. Estimativa Ajustada

| Fase | PRD Original | Ajuste Athos | Justificativa |
|:-----|:------------|:-------------|:-------------|
| Fase 0 | ~2h | ~2h | Sem mudanca. DT-01 e DT-02 sao straightforward. |
| Fase 1 | ~6-7h | ~6.5-7h | DT-12 adiciona ~15min para funcao hashAssign dedicada. |
| Fase 2 | ~4-5h | ~4-4.5h | DT-13 simplifica — nao extende `/api/performance/metrics`, SegmentBreakdown usa leads direto. Economia de ~30min na rota, adicao de ~15min para index composto. |
| Fase 3 | ~4-5h | ~4.5-5.5h | DT-11 adiciona ~30min para criar `getKillSwitchState()` + campo no Brand type. |
| Fase 4 | ~0.5h | ~0.5h | Sem mudanca. |
| **TOTAL** | **~16-20h** | **~17-19.5h** | Dentro da faixa estimada pelo PRD. |

---

## 10. Ressalvas para o Story Pack (Leticia)

1. **DT-11 (BLOCKING):** A funcao `getKillSwitchState(brandId)` nao existe no codebase. Deve ser criada na S34-AO-02 ANTES de implementar a logica de auto-optimization. Sugestao: campo `killSwitchState?: { active: boolean; activatedAt?: Timestamp; reason?: string }` no Brand type + helper em `lib/firebase/automation.ts`.

2. **DT-13 (CLARIFICACAO):** O SegmentBreakdown deve ser alimentado por dados de leads (collection `leads`), NAO por metricas de ads. A rota `/api/performance/metrics` permanece inalterada. Ajustar RF-34.2.2 no Story Pack.

3. **Firestore Composite Index:** Para a query de segment filter em leads (`brandId` + `segment`), documentar a necessidade de index composto como pre-requisito da Fase 2.

4. **Cross-lane touches:** 10 arquivos fora da lane principal `ab_testing_optimization` serao modificados. Documentar em `allowed-context.md` do Story Pack.

5. **SIDEBAR_ICONS:** Verificar se `FlaskConical` esta no mapa de icones. Se nao, adicionar na S34-AB-07 (trivial, ~2 linhas).

---

## 11. Veredito Final

### APROVADO COM RESSALVAS

**Justificativa:**

A Sprint 34 e arquiteturalmente solida. Os 10 DTs originais do PRD foram validados contra evidencia do codebase e todos receberam decisao clara com justificativa tecnica. O design segue rigorosamente os patterns Sigma estabelecidos:

- Subcollection `brands/{brandId}/ab_tests` — 100% consistente com 7 subcollections existentes
- djb2 hash assignment — reutiliza algoritmo comprovado no codebase (S28)
- Z-test inline — funcao utility isolada, zero lib externa (PB-01)
- Single Gemini call — pattern unanime no codebase
- Pagina dedicada — consistente com 6 features Intelligence existentes

**2 DTs BLOCKING identificados:**

| DT | Tema | Acao Requerida |
|:---|:-----|:---------------|
| **DT-11** | `getKillSwitchState()` inexistente | Criar funcao/campo antes da Fase 3. Sem isso, PB-04 nao pode ser verificado em runtime. |
| **DT-13** | Data flow do SegmentBreakdown | Clarificar no Story Pack que SegmentBreakdown usa dados de leads, nao metricas de ads. RF-34.2.2 do PRD precisa de refinamento. |

**Nota:** DT-13 e classificado como BLOCKING para o Story Pack (clarificacao necessaria), mas NON-BLOCKING para a implementacao — a solucao alternativa (leads direto) e mais simples que a proposta original.

**Proximo passo:** Leticia (SM) pode iniciar o Story Packing com as ressalvas acima incorporadas.

---

## 12. Checklist de Conformidade Arquitetural

- [x] Todos os DTs do PRD (1-10) avaliados com decisao e justificativa
- [x] DTs adicionais identificados (11-14)
- [x] Classificacao BLOCKING vs NON-BLOCKING definida
- [x] Proibicoes (P-01 a P-08, PB-01 a PB-06) validadas
- [x] Dependencias verificadas contra codebase real
- [x] Contract-map proposto com cross-lane touches documentados
- [x] Riscos e mitigacoes mapeados
- [x] Estimativa ajustada dentro da faixa do PRD
- [x] Ressalvas para Story Pack documentadas
- [x] Veredito final emitido

---

*Architecture Review realizado por Athos (Architect) sob o protocolo NETECMT v2.0.*
*Sprint 34: A/B Testing & Segment Optimization | 09/02/2026*
*Veredito: APROVADO COM RESSALVAS — 14 DTs (2 Blocking), estimativa confirmada ~17-19.5h*
