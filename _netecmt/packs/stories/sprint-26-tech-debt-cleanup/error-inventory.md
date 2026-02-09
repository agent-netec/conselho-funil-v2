# Error Inventory: Sprint 26 — Technical Debt Cleanup
**Gerado em:** 06/02/2026
**Total:** 161 erros em 73 arquivos
**Comando:** `npx tsc --noEmit`

---

## Tier 1 — Runtime Blockers (~15 erros)

### ST-01: useActiveBrand Destructuring (5 erros)
| # | Arquivo | Linha | Erro | Fix |
|---|---------|-------|------|-----|
| 1 | `intelligence/creative/page.tsx` | 22 | TS2339: `activeBrand` not on `Brand\|null` | `const activeBrand = useActiveBrand()` |
| 2 | `hooks/use-attribution-data.ts` | 16 | TS2339: idem | idem |
| 3 | `hooks/use-intelligence.ts` | 19 | TS2339: idem | idem |
| 4 | `hooks/use-intelligence.ts` | 52 | TS2339: idem | idem |
| 5 | `hooks/use-intelligence.ts` | 91 | TS2339: idem | idem |

### ST-02: Módulos Inexistentes em Rotas Ativas (~9 erros)
| # | Arquivo | Import faltante | Erro |
|---|---------|----------------|------|
| 1 | `discovery/page.tsx:10` | `assets-panel` | TS2307 |
| 2 | `discovery/page.tsx:14` | `use-intelligence-assets` | TS2307 |
| 3 | `performance-advisor.ts:1` | `../ai/gemini` | TS2307 |
| 4 | `performance-advisor.ts:2` | `../ai/prompts/performance-advisor` | TS2307 |
| 5 | `performance-advisor.ts:3` | `../../types/performance` | TS2307 |
| 6 | `anomaly-engine.ts:1` | `../../types/performance` | TS2307 |
| 7 | `sources-tab.tsx:29` | `MonitoringSource` | TS2305 |
| 8 | `use-attribution-data.ts:9` | `CampaignAttributionStats` | TS2305 |
| 9 | `trend-agent.ts:2` | `SemanticSearchResult` | TS2305 |

### ST-03: Next.js 15 Route Params (1 erro)
| # | Arquivo | Linha | Erro |
|---|---------|-------|------|
| 1 | `journey/[leadId]/route.ts` | 14 | TS2344: params não é Promise |

---

## Tier 2 — Dead Code & Broken Tests (~100 erros)

### ST-04: Imports Inexistentes em Código Morto (~18 erros)
| # | Arquivo | Import faltante |
|---|---------|----------------|
| 1 | `embeddings.test.ts:1` | `cosineSimilarity` |
| 2-4 | `rag.test.ts:4-6` | 3 exports faltantes |
| 5 | `kill-switch security.test.ts` | `KillSwitchRequest` |
| 6-7 | `ingest process.test.ts` | `./route`, `processAssetText` |
| 8 | `ingest url.test.ts` | `./route` |
| 9-11 | `agency-multi-tenancy.test.ts` | `../agency/engine`, `./config` |
| 12 | `brand-voice-translator.ts` | `SOCIAL_RESPONSE_PROMPT` |
| 13-16 | `curation-engine.ts` | 4 módulos faltantes |
| 17 | `social/mocks.ts` | `../../types/social` |
| 18 | `social/normalizer.ts` | `../../types/social` |

### ST-05: Mocks Desatualizados (~12 erros)
| # | Arquivo | Problema |
|---|---------|---------|
| 1 | `use-brands.test.ts:58` | Mock Brand incompleto |
| 2 | `ethical-guardrails.test.ts:5` | `socialMedia` faltante |
| 3 | `maestro-flow.test.ts:92` | `metadata` não existe |
| 4-11 | `hierarchical-isolation.test.ts` | Tuple type errors (8x) |
| 12 | `agency-multi-tenancy.test.ts:44` | implicit any |

### ST-06: Extensões .ts em Imports (9 erros)
| # | Arquivo | Linhas |
|---|---------|--------|
| 1-2 | `journey/bridge.ts` | 7, 8 |
| 3-7 | `predictive/engine.ts` | 7, 8, 9, 10, 11 |
| 8-9 | `reporting/engine.ts` | 1, 2 |

### ST-07: Tipos Incompatíveis em Legados (~61 erros)
*(Ver lista detalhada na stories.md — ST-07)*

Distribuição por arquivo:
- `attribution/bridge.ts`: 9 erros
- `attribution/overlap.ts`: 7 erros
- `OfferBuilder.tsx`: 7 erros
- `scoped-data.ts`: 4 erros
- `funnels/[id]/page.tsx`: 3 erros
- `mcp.config.ts`: 3 erros
- `glimpse-mock.ts`: 3 erros
- Demais: 1-2 erros cada (25 arquivos)

---

## Tier 3 — Cosmetic & Typing (~46 erros)

### ST-08: Framer-Motion (7 erros)
- `shared/reports/[token]/page.tsx`: 3x ease incompatível
- `counselor-multi-selector.tsx`: 2x mode="popover"
- `party-mode/counselor-selector.tsx`: 1x mode="popover"
- `sidebar.tsx`: 1x exit={false}

### ST-09: Implicit Any (13 erros)
- `rag.test.ts:73`: 2x (sum, v)
- `attribution/bridge.ts`: 5x (p, a, b, idx)
- `attribution/overlap.ts`: 3x (tp, overlap, channel)
- `briefing-bot.ts`: 2x (i, r)
- `curation-engine.ts:114`: 1x (m)

### ST-10: Lucide Icons / Imports Faltantes (8 erros)
- `AutopsyReportView.tsx`: Button (2x)
- `journey/[leadId]/page.tsx`: Activity
- `brand-kit-form.tsx`: cn, Activity
- `vault-explorer.tsx`: Linkedin, Instagram
- `counselor-multi-selector.tsx`: X

### ST-11: Miscellaneous (18 erros)
- `select.tsx`: comparação バランス
- `response-editor.tsx`: prop title
- `middleware.ts`: any como valor
- `trend-agent.ts`: sem return + brandId em Omit
- `scoped-data.ts`: db não exportado
- `offer-lab/page.tsx`: brandId faltante
- `journey/page.tsx`: prop icon
- `ScaleSimulator.tsx`: toLocaleString(0) (2x)
- `alert-center.tsx`: PerformanceAlertDoc + 'high' + implicit any (3x)
- `campaign generate-ads`: 3 args vs 2
- `chat/route.ts`: brandId undefined (2x)
- `personalization/engine.ts`: DocumentReference vs string
- `bulk-ingest.ts`: .namespace em Promise
- `assets/metrics/route.ts`: describeIndexStats em Promise

---
*Inventário gerado por Dandara (QA) via `tsc --noEmit` — NETECMT v2.0*
