# Sprint 12 — Performance / Agency: Plano de Execução

> **Data:** 2026-03-21
> **Estado:** 6 etapas (0 pré-requisito + 5 tarefas)
> **Objetivo:** Tornar Performance (War Room) production-ready para tier Agency (R$997)

---

## Etapa 0 — Tier Guard (pré-requisito)

### 0.1 Proteger rotas de performance com tier Agency
- **Arquivos:** 3 route.ts (metrics, anomalies, integrations/validate)
- **Padrão:** `requireBrandAccess` já retorna `{ effectiveTier }` → `requireMinTier(effectiveTier, 'agency')`
- **Resultado:** 403 "Essa feature requer o plano Agency" para non-Agency users

### Arquivos modificados:
| Arquivo | Mudança |
|---------|---------|
| `api/performance/metrics/route.ts` | + `requireMinTier('agency')` |
| `api/performance/anomalies/route.ts` | + `requireBrandAccess` no GET + `requireMinTier('agency')` em GET e PATCH |
| `api/performance/integrations/validate/route.ts` | + `requireMinTier('agency')` |

---

## Etapa 2 — Revenue Real (12.2)

### 2.1 RawAdsData: campo revenue
- **Arquivo:** `adapters/base-adapter.ts`
- **Mudança:** Adicionado `revenue: number` na interface + ROAS = `revenue / spend` (não mais `conversions * 100`)

### 2.2 Meta adapter: extrair action_values
- **Arquivo:** `adapters/meta-adapter.ts`
- **Mudança:** Campo `action_values` adicionado na query Graph API + extração de revenue via `offsite_conversion.fb_pixel_purchase`

### 2.3 Google adapter: extrair conversions_value
- **Arquivo:** `adapters/google-adapter.ts`
- **Mudança:** `metrics.conversions_value` adicionado na query GAQL + parseFloat do valor

### 2.4 Agregação com revenue real
- **Arquivo:** `fetch-and-cache.ts`
- **Mudança:** `aggregated.revenue` acumula normalizado + ROAS = `revenue / spend`

### 2.5 Cross-channel hook: ROAS real
- **Arquivo:** `hooks/use-cross-channel-metrics.ts`
- **Mudança:** Substituído `conversions * 10000 / spend` por `m.revenue / m.spend`

### 2.6 UI: fallback quando pixel sem valor
- **Arquivo:** `performance/page.tsx`
- **Mudança:** KPI Revenue mostra "Pixel sem valor" + subtitle "Configure o pixel com valor de compra" quando revenue=0 mas conversions>0

---

## Etapa 3 — AI Advisor Fixes (12.3) — JÁ FEITO

Todos os 3 fixes já implementados em sprints anteriores:
- [x] Debounce + cache (Sprint 08.6c): 1.5s debounce + AbortController + insightCacheRef
- [x] `verifyAdminRole` removido (Sprint 08.6): endpoint usa `requireBrandAccess`
- [x] Data em pt-BR: `toLocaleDateString('pt-BR', ...)` na linha 183

---

## Etapa 4 — Anomalias Reais (12.4)

### 4.1 Mock removido da API de anomalias
- **Arquivo:** `api/performance/anomalies/route.ts`
- **Mudança:** `generateMockAnomalies()` deletada, parâmetro `mock` removido
- Apenas dados reais do Firestore via `SentryEngine.listAnomalies()`

### 4.2 Mock removido da API de métricas
- **Arquivo:** `api/performance/metrics/route.ts`
- **Mudança:** `generateMockMetrics()` deletada, parâmetro `mock` removido
- Apenas dados reais via `fetchMetricsWithCache()`

### 4.3 Anomalias ocultas quando vazio
- **Arquivo:** `performance/page.tsx`
- **Mudança:** `AlertCenter` wrapped com `{anomalies.length > 0 && ...}`

### 4.4 Acknowledge persiste no Firestore
- Já implementado no Sprint 08.6 (real `docRef.update()`)

---

## Etapa 5 — Dashboard Integration (12.5) — JÁ FEITO

Dashboard `/home` já implementa:
- [x] `HasAdsBody`: KPI strip inline (impressões, cliques, spend, conversões)
- [x] Link "Analisar performance" → `/performance`
- [x] State machine `has-ads` só ativa quando `campaign.ads` ou `campaign.metrics` existe

---

## Etapa 6 — Cross-channel Tab (12.6)

### 6.1 Tab navigation na War Room
- **Arquivo:** `performance/page.tsx`
- **Mudança:** Tab bar "WAR ROOM | CROSS-CHANNEL" com Link para `/performance/cross-channel`

### 6.2 Tab navigation na Cross-channel
- **Arquivo:** `performance/cross-channel/page.tsx`
- **Mudança:** Tab bar correspondente com "WAR ROOM | CROSS-CHANNEL" (ativa = cross-channel)

### 6.3 Nota quando só 1 provider
- **Arquivo:** `performance/cross-channel/page.tsx`
- **Mudança:** Banner informativo quando `Object.keys(metrics.channels).length === 1`

---

## Checklist de Execução

- [x] **Etapa 0** — Tier Guard (2026-03-21) ✅
- [x] **Etapa 2** — Revenue Real (2026-03-21) ✅
- [x] **Etapa 3** — AI Advisor — já feito ✅
- [x] **Etapa 4** — Anomalias Reais (2026-03-21) ✅
- [x] **Etapa 5** — Dashboard — já feito ✅
- [x] **Etapa 6** — Cross-channel Tab (2026-03-21) ✅
- [x] **Build final** — 4 builds passaram limpos ✅

---

## Arquivos Envolvidos (referência rápida)

| Etapa | Arquivo | Ação |
|-------|---------|------|
| 0 | `api/performance/metrics/route.ts` | + tier guard |
| 0 | `api/performance/anomalies/route.ts` | + brand access + tier guard |
| 0 | `api/performance/integrations/validate/route.ts` | + tier guard |
| 2 | `adapters/base-adapter.ts` | + revenue field, ROAS fix |
| 2 | `adapters/meta-adapter.ts` | + action_values extraction |
| 2 | `adapters/google-adapter.ts` | + conversions_value extraction |
| 2 | `lib/performance/fetch-and-cache.ts` | + revenue aggregation |
| 2 | `hooks/use-cross-channel-metrics.ts` | ROAS from real revenue |
| 2 | `performance/page.tsx` | Revenue fallback UX |
| 4 | `api/performance/anomalies/route.ts` | Mock removido |
| 4 | `api/performance/metrics/route.ts` | Mock removido |
| 4 | `performance/page.tsx` | Hide alerts when empty |
| 6 | `performance/page.tsx` | Tab navigation |
| 6 | `performance/cross-channel/page.tsx` | Tab navigation + 1-provider note |

---

## Nota: Tarefa 12.1 (Setup Plataforma)

Não é código — é configuração manual do owner:
- Criar app Meta + Google Ads
- Configurar OAuth + env vars no Vercel
- Ref: `brain/oauth-setup-checklist.md`
