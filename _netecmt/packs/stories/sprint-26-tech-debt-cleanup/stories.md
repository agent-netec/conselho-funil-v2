# Stories Distilled: Sprint 26 — Technical Debt Cleanup
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026
**Lane:** cross-cutting

---

## Epic 1: Tier 1 — Runtime Blockers [P0]

### S26-ST-01: Fix `useActiveBrand` Destructuring [P0, S]

**Objetivo:** 4 arquivos fazem `const { activeBrand } = useActiveBrand()` mas o hook retorna `Brand | null` diretamente, não um objeto com propriedade `activeBrand`.

**Arquivos afetados:**
- `app/src/app/intelligence/creative/page.tsx:22`
- `app/src/lib/hooks/use-attribution-data.ts:16`
- `app/src/lib/hooks/use-intelligence.ts:19,52,91`

**Ação:** Substituir `const { activeBrand } = useActiveBrand()` por `const activeBrand = useActiveBrand()`.

**AC:**
- [ ] 0 erros TS2339 relacionados a `activeBrand`
- [ ] Funcionalidade preservada

---

### S26-ST-02: Fix Paths Relativos Incorretos e Stubs de Tipos Fantasmas [P0, M]

**Objetivo:** A maioria dos "módulos inexistentes" no inventário **EXISTE no codebase** — o problema real são **paths relativos incorretos** nos imports (ex: `../../types/x` resolve para `lib/types/` em vez de `src/types/`). Apenas `lib/intelligence/config` genuinamente não existe. Além disso, 2 módulos são **CÓDIGO ATIVO** e requerem stubs funcionais.

> ⚠️ **CORREÇÃO DO ARCH REVIEW (Athos):** A premissa original assumia "módulos inexistentes". Após análise profunda, a maioria são paths errados para módulos existentes. O dev deve priorizar **correção de paths** sobre criação de stubs quando o módulo-alvo existe.

**Classificação por tipo de problema:**

#### A) Módulos DEAD CODE com paths errados (0 consumers — stub ou fix path)

| Arquivo | Import "faltante" | Módulo existe? | Problema real | Ação |
|---------|-------------------|:--------------:|---------------|------|
| `lib/agents/publisher/curation-engine.ts` | `../firebase/intelligence` | ✅ | Path errado: resolve para `agents/firebase/` | Fix path para `@/lib/firebase/intelligence` OU stub |
| `lib/agents/publisher/curation-engine.ts` | `../firebase/vault`, `../vault/pinecone-vault`, `../ai/embeddings` | ✅ | Paths errados (mesma razão) | Fix path OU stub |
| `lib/intelligence/attribution/aggregator.ts` | `../../types/performance`, `../../types/cross-channel` | ✅ | Path errado: `../../types/` resolve para `lib/types/` | Fix path para `@/types/performance` etc. OU stub |
| `lib/intelligence/attribution/bridge.ts` | `../../types/attribution`, `../../types/journey` | ✅ | Path errado (idem) | Fix path OU stub |
| `lib/intelligence/attribution/overlap.ts` | `../../types/attribution`, `../../types/cross-channel` | ✅ | Path errado (idem) | Fix path OU stub |
| `lib/performance/engine/anomaly-engine.ts` | `../../types/performance` | ✅ | Path errado | Fix path OU stub |
| `lib/performance/engine/performance-advisor.ts` | `../ai/gemini`, `../ai/prompts/performance-advisor` | ✅ | Path errado: `../ai/` resolve para `performance/ai/` | Fix path para `@/lib/ai/gemini` etc. |
| `lib/ai/prompts/performance-advisor.ts` | `../../types/performance` | ✅ | Path errado | Fix path para `@/types/performance` |
| `lib/agents/trend/trend-agent.ts` | `SemanticSearchResult` de `@/types/intelligence` | ❌ (tipo fantasma) | Tipo não exportado | Adicionar stub em `types/intelligence.ts` |
| `lib/reporting/briefing-bot.ts` | `AIAnalysisResult`, `ReportMetrics` de `@/types/reporting` | ❌ (tipos fantasma) | Tipos não exportados | Adicionar stubs em `types/reporting.ts` |
| `components/intelligence/sources-tab.tsx` | `MonitoringSource` de `@/types/intelligence` | ❌ (tipo fantasma) | Tipo não exportado | Adicionar stub em `types/intelligence.ts` |

#### B) Módulo genuinamente inexistente — criar stub config

| Arquivo | Import faltante | Ação |
|---------|----------------|------|
| `lib/intelligence/attribution/aggregator.ts` | `../config` | ⚠️ Criar `lib/intelligence/config.ts` — re-export de `db` do firebase/config |
| `lib/intelligence/attribution/bridge.ts` | `../config` | Idem (mesmo módulo) |
| `lib/intelligence/attribution/overlap.ts` | `../config` | Idem (mesmo módulo) |

> Stub mínimo: `export { db } from '@/lib/firebase/config';` com `// TODO: Sprint XX — módulo config de intelligence`

#### C) Módulos CÓDIGO ATIVO — stubs funcionais obrigatórios ⚠️

| Arquivo | Tipo faltante | Consumers ativos | Ação |
|---------|--------------|:----------------:|------|
| `lib/intelligence/personalization/maestro.ts` | `LeadState` de `@/types/personalization` | **4** (audience/scan, webhooks/dispatcher, middleware, 2 tests) | **CRIAR stub funcional** em `types/personalization.ts` — verificar quais campos `maestro.ts` acessa antes |
| `lib/hooks/use-attribution-data.ts` | `CampaignAttributionStats` | **1** (intelligence/attribution/page.tsx) | **CRIAR stub funcional** em `types/attribution.ts` — verificar quais campos o hook acessa |

> ⚠️ **ATENÇÃO:** Estes 2 módulos NÃO são dead code. Stubs devem ser **minimamente funcionais** (com campos reais), não vazios. Seguir padrão DT-02 do Arch Review (index signature `[key: string]: unknown`).

#### D) Tipos renomeados — fix via type alias, NÃO stub novo

| Tipo importado | Existe como | Ação |
|---------------|------------|------|
| `PerformanceMetricDoc` | `PerformanceMetric` em `types/performance.ts` | `export type PerformanceMetricDoc = PerformanceMetric;` |
| `PerformanceAlertDoc` | `PerformanceAnomaly` em `types/performance.ts` | `export type PerformanceAlertDoc = PerformanceAnomaly;` |

> ⚠️ APENAS adicionar aliases no final de `types/performance.ts`. NUNCA renomear ou alterar interfaces existentes.

#### E) social/mocks.ts e normalizer.ts — verificar antes de redirecionar

| Arquivo | Import atual | Ação |
|---------|-------------|------|
| `lib/intelligence/social/mocks.ts` | `../../types/social` | ⚠️ **VERIFICAR** se os tipos usados estão em `social.ts` ou `social-inbox.ts` antes de redirecionar. Não assumir `social-inbox` automaticamente |
| `lib/intelligence/social/normalizer.ts` | `../../types/social` | Idem — checar se importa `SocialInteraction` (que está em `social.ts`, não `social-inbox.ts`) |

#### F) Módulos de página / componentes

| Arquivo | Import faltante | Ação |
|---------|----------------|------|
| `app/src/app/intelligence/discovery/page.tsx` | `assets-panel`, `use-intelligence-assets` | Stub ou criar |

**AC:**
- [ ] 0 erros TS2307 (module not found) e TS2305 (export not found) em rotas ativas
- [ ] Stubs claramente marcados com `// TODO: Implementar na Sprint XX` e `@stub` no JSDoc
- [ ] Stubs de tipos ativos (`LeadState`, `CampaignAttributionStats`) com campos reais verificados
- [ ] `lib/intelligence/config.ts` criado como re-export
- [ ] Type aliases adicionados em `types/performance.ts` (NÃO alterações)

---

### S26-ST-03: Fix `params` → `Promise<params>` Route Journey [P0, S]

**Objetivo:** Next.js 15 mudou a API de route handlers — `params` agora é `Promise`.

**Arquivo:** `app/src/app/api/intelligence/journey/[leadId]/route.ts:14`

**Ação:** Mudar `{ params }: { params: { leadId: string } }` para `{ params }: { params: Promise<{ leadId: string }> }` e `await params` no body.

**AC:**
- [ ] 0 erros TS2344 na rota journey
- [ ] Rota funciona corretamente com `await params`

---

## Epic 2: Tier 2 — Dead Code & Broken Tests [P1]

### S26-ST-04: Limpar Imports de Módulos Inexistentes em Código Morto [P1, M]

**Objetivo:** Vários arquivos importam módulos que nunca foram criados ou foram removidos.

**Arquivos:**
- `src/__tests__/lib/ai/embeddings.test.ts` — `cosineSimilarity`
- `src/__tests__/lib/ai/rag.test.ts` — `keywordMatchScore`, `generateLocalEmbedding`, `hashString`
- `src/__tests__/lib/automation/maestro-flow.test.ts` — `metadata` em tipo
- `src/app/api/automation/kill-switch/__tests__/security.test.ts` — `KillSwitchRequest`
- `src/app/api/ingest/__tests__/process.test.ts` — `processAssetText`, `./route`
- `src/app/api/ingest/__tests__/url.test.ts` — `./route`
- `src/lib/firebase/__tests__/agency-multi-tenancy.test.ts` — `../agency/engine`, `./config`
- `src/lib/agents/engagement/brand-voice-translator.ts` — `SOCIAL_RESPONSE_PROMPT`

**Ação:** Stub exports faltantes ou remover testes obsoletos.

**AC:**
- [ ] 0 erros TS2305/TS2307 em arquivos `__tests__`
- [ ] Testes removidos ou corrigidos

---

### S26-ST-05: Atualizar Mocks Desatualizados [P1, M]

**Objetivo:** Testes com mocks que não correspondem mais às interfaces atuais.

**Arquivos:**
- `use-brands.test.ts:58` — Mock `Brand` incompleto
- `ethical-guardrails.test.ts:5` — `socialMedia` faltante em `CompetitorProfile`
- `maestro-flow.test.ts:92` — `metadata` não existe em tipo de evento
- `hierarchical-isolation.test.ts` — Tuple type `[]` errors (8 erros)

**AC:**
- [ ] Mocks atualizados para corresponder aos tipos atuais
- [ ] 0 erros em arquivos de teste

---

### S26-ST-06: Remover Extensões `.ts` de Imports [P1, S]

**Objetivo:** 7 imports terminam com `.ts` sem `allowImportingTsExtensions`.

**Arquivos:**
- `lib/intelligence/journey/bridge.ts` (2x)
- `lib/intelligence/predictive/engine.ts` (5x)
- `lib/reporting/engine.ts` (2x)

**Ação:** Remover `.ts` dos imports.

**AC:**
- [ ] 0 erros TS5097

---

### S26-ST-07: Fix Tipos Incompatíveis em Módulos Legados [P1, L]

**Objetivo:** Props faltantes, tipos incompatíveis e propriedades inexistentes em módulos de sprints anteriores.

**Arquivos principais:**
- `ingest/url/route.ts` — `'firecrawl'` vs union type atualizado
- `spy/route.ts` — `Partial<CompetitorTechStack>` vs `CompetitorTechStack`
- `mcp.config.ts` — `glimpse` faltando em Record (3x)
- `adaptation-pipeline.ts` — `id` faltante
- `inbox-aggregator.ts` — `requires_human_review` faltante
- `OfferBuilder.tsx` — `stacking`, `analysis`, `description` (7 erros)
- `scoped-data.ts` — `undefined` vs `RecordMetadataValue` (4 erros)
- `funnels/[id]/page.tsx` — `.url` em `FunnelContext` (3x)
- `chat/route.ts` — `brandId` possivelmente undefined (2x)
- `campaigns/generate-ads/route.ts` — 3 args vs 2
- `assets/metrics/route.ts` — `describeIndexStats` em Promise
- `automation/page.tsx` — `MOCK_VARIATIONS` implicit any
- `intelligence/page.tsx` — `emotions` tipo incompatível
- `vault.ts` — `createdAt` em Omit
- `copy-gen.ts` — `aiConfiguration` em BrandKit (2x)
- `offer-lab/scoring.ts` — `scoring` em Omit + `complementarityScore` undefined
- `personalization/engine.ts` — `DocumentReference` vs `string`
- `agency/engine.ts` — Cast inseguro
- `mcp/router.ts` — `RateLimitConfig` vs Record
- `performance/base-adapter.ts` — `clicks` em `UnifiedAdsMetrics`
- `attribution/bridge.ts` — implicit any + `limit` not found (9 erros)
- `attribution/overlap.ts` — implicit any + index type (7 erros)
- `glimpse-mock.ts` — `scope`, `inheritToChildren` faltantes (3x)
- `bulk-ingest.ts` — `.namespace` em Promise
- `spy-agent.ts` — `.defaultViewport`, `.headless` em Chromium

**AC:**
- [ ] 0 erros de tipo em módulos legados
- [ ] Interfaces atualizadas ou stubs criados

---

## Epic 3: Tier 3 — Cosmetic & Typing [P2]

### S26-ST-08: Fix Framer-Motion Breaking Changes [P2, S]

**Objetivo:** API do framer-motion mudou entre versões.

**Erros:**
- `shared/reports/[token]/page.tsx` — `ease: number[]` vs `Easing` (3x)
- `counselor-multi-selector.tsx` — `mode="popover"` (2x)
- `sidebar.tsx` — `exit={false}` inválido
- `party-mode/counselor-selector.tsx` — `mode="popover"`

**Ação:** Corrigir `ease` para `[0.4, 0, 0.2, 1] as const`, `mode` para `"wait"`, `exit` para `undefined`.

**AC:**
- [ ] 0 erros relacionados a framer-motion/motion-dom

---

### S26-ST-09: Adicionar Tipagem Explícita (Implicit `any`) [P2, S]

**Objetivo:** Parâmetros sem tipo explícito em callbacks.

**Arquivos:**
- `rag.test.ts:73` — `sum`, `v` em reduce
- `attribution/bridge.ts:90,102,137` — `p`, `a`, `b`, `idx`
- `attribution/overlap.ts:51,113` — `tp`, `overlap`
- `briefing-bot.ts:27,30` — `i`, `r` em map
- `agency-multi-tenancy.test.ts:44` — `c` em find
- `curation-engine.ts:114` — `m` em map
- `middleware.ts:21` — `any` usado como valor

**AC:**
- [ ] 0 erros TS7006/TS7034

---

### S26-ST-10: Fix Imports de Lucide Icons Faltantes [P2, S]

**Objetivo:** Ícones usados no JSX mas não importados.

**Arquivos:**
- `AutopsyReportView.tsx` — `Button` (shadcn, não Lucide)
- `journey/[leadId]/page.tsx` — `Activity`
- `brand-kit-form.tsx` — `cn`, `Activity`
- `vault-explorer.tsx` — `Linkedin`, `Instagram`
- `counselor-multi-selector.tsx` — `X`
- `keyword-management.tsx` — `Timestamp`

**AC:**
- [ ] 0 erros TS2304 (cannot find name)

---

### S26-ST-11: Miscellaneous Fixes [P2, S]

**Objetivo:** Erros isolados que não se encaixam nas categorias acima.

**Erros:**
- `select.tsx:79` — Comparação com `"バランス"` (TS2367)
- `response-editor.tsx:105` — Prop `title` em Lucide CheckCircle2
- `personalization/middleware.ts:21` — `any` como valor (TS2693)
- `trend-agent.ts:15` — Função sem return (TS2355)
- `trend-agent.ts:39` — `brandId` em Omit (TS2353)
- `firebase/scoped-data.ts:19` — `db` não exportado de `./firestore` (TS2459)
- `offer-lab/page.tsx` — `brandId` faltante em `<OfferLabWizard />`
- `journey/page.tsx` — Prop `icon` não existe em `HeaderProps`

**AC:**
- [ ] 0 erros miscellaneous restantes
- [ ] `npx tsc --noEmit` = **Found 0 errors**

---

---

## Apêndice: Correções de Premissa do Architecture Review

> Referência completa: `_netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md`

O Athos (Architect) identificou **6 correções de premissa** que foram incorporadas neste documento:

| # | Correção | Story afetada | Seção atualizada |
|:--|:---------|:-------------|:----------------|
| 1 | Problema NÃO é "módulos inexistentes" — é paths relativos incorretos (maioria dos módulos EXISTE) | ST-02 | Seção A — tabela com coluna "Módulo existe?" |
| 2 | `use-attribution-data.ts` é CÓDIGO ATIVO (não dead code) — precisa stub real para `CampaignAttributionStats` | ST-02 | Seção C — Módulos CÓDIGO ATIVO |
| 3 | `maestro.ts` tem 4 consumers ativos — `LeadState` precisa de stub funcional (não vazio) | ST-02 | Seção C — Módulos CÓDIGO ATIVO |
| 4 | `PerformanceMetricDoc` e `PerformanceAlertDoc` são tipos renomeados — fix via type alias, não stub novo | ST-02 | Seção D — Type aliases |
| 5 | `../config` genuinamente não existe — criar stub mínimo `lib/intelligence/config.ts` | ST-02 | Seção B — Módulo config inexistente |
| 6 | `social/mocks.ts` e `normalizer.ts` — verificar qual type file redirecionar antes de assumir `social-inbox` | ST-02 | Seção E — Verificação obrigatória |

---

*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Atualizadas com correções do Architecture Review (Athos) — 06/02/2026*
*Sprint 26: Technical Debt Cleanup | 06/02/2026*
*Legenda: S = Small (< 2h), M = Medium (2-4h), L = Large (4-8h)*
