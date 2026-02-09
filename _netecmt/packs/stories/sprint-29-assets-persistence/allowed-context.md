# Allowed Context: Sprint 29 — Assets & Persistence Hardening
**Lanes:** cleanup + intelligence + persistence + types
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

> Incorpora proibicoes do PRD (P1-P11) e Proibicoes Arquiteturais do Arch Review (PA-01 a PA-06).
> Principio No Global Context: Darllyson le APENAS os arquivos listados aqui por fase.

---

## Contexto Global

### Leitura Obrigatoria (antes de qualquer story)
- `_netecmt/packs/stories/sprint-29-assets-persistence/stories.md` — Stories, ACs e checklist
- `_netecmt/packs/stories/sprint-29-assets-persistence/story-pack-index.md` — Ordem de execucao, DTs, gates
- `_netecmt/solutioning/architecture/arch-sprint-29.md` — Architecture Review completo (12 DTs, 2 Blocking)

### Referencia de Padroes (LEITURA para contexto)
- `app/src/lib/utils/api-response.ts` — Padrao `createApiError`/`createApiSuccess` (Sigma)
- `app/src/lib/firebase/config.ts` — Referencia de `db` (Firestore Client SDK)

### Referencia de Tipos (LEITURA para contexto)
- `app/src/types/autopsy.ts` — `AutopsyDocument` (schema para FT-02)
- `app/src/types/offer.ts` — `OfferDocument` (schema para FT-02)
- `app/src/types/intelligence.ts` — Adicionar `IntelligenceAsset` (FT-01)
- `app/src/types/personalization.ts` — `LeadState` (expandir em FT-03)
- `app/src/types/reporting.ts` — `AIAnalysisResult`, `ReportMetrics` (ativar em CL-02)

---

## Fase 1: Cleanup (Gate) — Arquivos Permitidos

### S29-CL-01: contract-map — registrar budget-optimizer

| Arquivo | Acao |
|:--------|:-----|
| `_netecmt/core/contract-map.yaml` | **MODIFICAR** — adicionar budget-optimizer na lane automation |

### S29-CL-02: Reporting types — ativar AIAnalysisResult e ReportMetrics

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/reporting.ts` | **MODIFICAR** — remover catch-all, adicionar campos concretos |

**Leitura (consumer — verificar compilacao):**
- `app/src/lib/reporting/briefing-bot.ts` — consumer real dos tipos

### S29-CL-03: processAssetText — DELETAR stub

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/firebase/assets.ts` | **MODIFICAR** — remover funcao stub processAssetText() (~4-7 linhas) |

**NAO TOCAR:**
- `app/src/lib/firebase/assets-server.ts` — implementacao real, **INTOCADA**

**Leitura (verificar callers):**
- Executar `rg "processAssetText" app/src/` para confirmar 0 callers reais do stub

### S29-CL-04: Webhook routes — migrar para createApiError

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/webhooks/dispatcher/route.ts` | **MODIFICAR** — migrar 6 pontos para createApiError/createApiSuccess |
| `app/src/app/api/webhooks/ads-metrics/route.ts` | **MODIFICAR** — migrar 7 pontos para createApiError/createApiSuccess |

**Leitura (padrao a seguir):**
- `app/src/lib/utils/api-response.ts` — funcoes de resposta padrao

---

## Fase 2: Feature (Core) — Arquivos Permitidos

### S29-FT-02: Persistencia Autopsy + Offer

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/intelligence/autopsy/run/route.ts` | **MODIFICAR** — substituir TODO por setDoc fire-and-forget |
| `app/src/app/api/intelligence/offer/save/route.ts` | **MODIFICAR** — substituir TODO por await setDoc |

**Leitura (schemas — NAO MODIFICAR):**
- `app/src/types/autopsy.ts` — `AutopsyDocument` (schema a usar)
- `app/src/types/offer.ts` — `OfferDocument` (schema a usar)
- `app/src/lib/intelligence/personalization/propensity.ts` — padrao fire-and-forget (referencia)
- `app/src/lib/firebase/config.ts` — referencia de `db`

### S29-FT-01: Discovery Hub Assets

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/intelligence.ts` | **MODIFICAR** — adicionar interface `IntelligenceAsset` |
| `app/src/lib/hooks/use-intelligence-assets.ts` | **MODIFICAR** — implementar hook real com multi-query |
| `app/src/components/intelligence/discovery/assets-panel.tsx` | **MODIFICAR** — implementar panel real com cards |
| `app/src/app/intelligence/discovery/page.tsx` | **MODIFICAR** — atualizar consumer/props |
| `app/src/lib/firebase/scoped-data.ts` | **MODIFICAR** — adicionar funcoes de query (getAutopsies, getOffers) se necessario |

**Leitura (schemas e padroes — NAO MODIFICAR logica):**
- `app/src/types/autopsy.ts` — AutopsyDocument (para mapper)
- `app/src/types/offer.ts` — OfferDocument (para mapper)
- `app/src/types/personalization.ts` — AudienceScan (para mapper)
- `app/src/lib/firebase/scoped-data.ts` — padroes de query existentes
- `app/src/lib/firebase/assets.ts` — padroes de query com brandId
- `app/src/lib/firebase/config.ts` — referencia de `db`
- Componentes shadcn/ui existentes (`Card`, `Badge`, `Skeleton`) — referencia de estilo

### S29-FT-03: LeadState expansion

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/personalization.ts` | **MODIFICAR** — expandir interface LeadState |
| `app/src/lib/intelligence/personalization/propensity.ts` | **MODIFICAR** — renomear campo `score` → `propensityScore` em persistSegment() |

**Leitura (consumers — verificar impacto, NAO MODIFICAR logica):**
- `app/src/lib/intelligence/personalization/engine.ts` — consumer de LeadState
- `app/src/lib/intelligence/personalization/middleware.ts` — consumer de LeadState

---

## Fase 2: Feature (STRETCH) — Arquivos Permitidos

### S29-FT-04: Rate Limiting por brandId

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/guards/rate-limiter.ts` | **CRIAR** — guard function checkRateLimit() |
| `app/src/app/api/intelligence/audience/scan/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/intelligence/autopsy/run/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/intelligence/spy/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/funnels/generate/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/social/generate/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/design/generate/route.ts` | **MODIFICAR** — integrar rate limiting |
| `app/src/app/api/copy/generate/route.ts` | **MODIFICAR** — integrar rate limiting |

**Leitura (padroes — NAO MODIFICAR):**
- `app/src/lib/guards/` — padroes de guard existentes (requireBrandAccess)
- `app/src/lib/firebase/config.ts` — referencia de `db`

---

## Proibicoes Consolidadas (PRD P1-P11 + Arch PA-01 a PA-06)

### PRD (Iuran) — P1 a P11

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **P1** | **NUNCA alterar logica de negocio** dos modulos estabilizados | PropensityEngine (exceto campo rename score→propensityScore), Attribution, Audience Scan, Creative Engine |
| **P2** | **NUNCA remover exports existentes** de types/*.ts | Interfaces contratuais — estender, nunca reduzir |
| **P3** | **NUNCA usar firebase-admin** ou google-cloud/* | Restricao de ambiente (Windows 11 24H2) — Client SDK only |
| **P4** | **NUNCA usar `any`** em novos tipos ou funcoes | `unknown` com type guards quando necessario |
| **P5** | **NUNCA hardcodar brandId** | Multi-tenant first — brandId vem do contexto |
| **P6** | **NUNCA iniciar Fase 2 sem Gate Check aprovado** | Cleanup primeiro |
| **P7** | **NUNCA alterar API publica** (URL, metodo HTTP) de rotas existentes | Retrocompatibilidade total |
| **P8** | **NUNCA usar formato de erro legado** em codigo novo | Usar exclusivamente `createApiError`/`createApiSuccess` |
| **P9** | **NUNCA criar types sem campos concretos** — proibido `[key: string]: unknown` como catch-all | S29 e sobre eliminar stubs |
| **P10** | **NUNCA implementar Ads Integration** nesta sprint | Ads = S30 |
| **P11** | **NUNCA modificar testes existentes passando** | Exceto adaptar imports se necessario |

### Arch Review (Athos) — PA-01 a PA-06

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **PA-01** | **NUNCA criar collection `intelligence_assets`** no Firestore | Assets vivem nas collections canonicas (audience_scans, autopsies, offers) |
| **PA-02** | **NUNCA reimplementar `processAssetText`** em `assets.ts` | Versao real esta em `assets-server.ts` — deletar stub, nao reimplementar |
| **PA-03** | **NUNCA usar `await`** na persistencia de autopsy | Fire-and-forget (padrao PropensityEngine) |
| **PA-04** | **NUNCA usar fire-and-forget** na persistencia de offer | `await setDoc` obrigatorio (semantica de "save") |
| **PA-05** | **NUNCA misturar campo `score` generico** em leads | Usar `propensityScore` para PropensityEngine, evitar conflito de merge |
| **PA-06** | **NUNCA rate-limitar rotas `/api/admin/*`** | Admin sempre isento — previne self-lockout |

---

## Modulos Protegidos (NAO TOCAR — producao estavel)

### Attribution Core (S27 — producao estavel)
- `app/src/lib/intelligence/attribution/engine.ts` — **NAO MODIFICAR logica** (P1)
- `app/src/lib/intelligence/attribution/bridge.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/intelligence/attribution/overlap.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/intelligence/attribution/aggregator.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/hooks/use-attribution-data.ts` — **NAO MODIFICAR** (P1)

### Personalization Core (S28 — producao estavel)
- `app/src/lib/intelligence/personalization/engine.ts` — **NAO MODIFICAR logica** (P1) — LEITURA apenas
- `app/src/lib/intelligence/personalization/middleware.ts` — **NAO MODIFICAR logica** (P1) — LEITURA apenas
- `app/src/lib/intelligence/personalization/propensity.ts` — **MODIFICAR APENAS campo score→propensityScore** (DT-08)
- `app/src/lib/intelligence/personalization/schemas/` — **NAO MODIFICAR** (P1)

### AI Pipeline Core (Sigma — producao estavel)
- `app/src/lib/ai/embeddings.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/ai/rag.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/ai/pinecone.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/firebase/assets-server.ts` — **NAO MODIFICAR** (PA-02 — implementacao real de processAssetText)
- `app/src/lib/utils/api-response.ts` — **NAO MODIFICAR** (padrao Sigma)
- `app/src/lib/auth/conversation-guard.ts` — **NAO MODIFICAR** (padrao Sigma)

### Sprint 25 Types
- `app/src/types/prediction.ts` — **PROIBIDO**
- `app/src/types/creative-ads.ts` — **PROIBIDO**
- `app/src/types/text-analysis.ts` — **PROIBIDO**

### Testes existentes
- Todos os 224 testes existentes — **NAO MODIFICAR** (P11, exceto adaptar imports)

---

## Resumo: Arquivos Novos a Criar (Sprint 29)

| Arquivo | Story | Tipo |
|:--------|:------|:-----|
| `app/src/lib/guards/rate-limiter.ts` | S29-FT-04 (STRETCH) | Guard function |

### Nota: NENHUM arquivo novo obrigatorio
Diferente do Sprint Sigma (10 arquivos novos), a Sprint 29 trabalha primariamente sobre arquivos existentes — implementando funcionalidade onde havia stubs. O unico arquivo NOVO e o `rate-limiter.ts` (STRETCH).

---

## Resumo: Arquivos Modificados (Sprint 29 — por Story)

### Fase 1: Cleanup

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `_netecmt/core/contract-map.yaml` | S29-CL-01 | Adicionar budget-optimizer na lane automation |
| `app/src/types/reporting.ts` | S29-CL-02 | Remover catch-all, expandir AIAnalysisResult + ReportMetrics |
| `app/src/lib/firebase/assets.ts` | S29-CL-03 | Remover stub processAssetText() (~4-7 linhas) |
| `app/src/app/api/webhooks/dispatcher/route.ts` | S29-CL-04 | Migrar 6 pontos para createApiError/createApiSuccess |
| `app/src/app/api/webhooks/ads-metrics/route.ts` | S29-CL-04 | Migrar 7 pontos para createApiError/createApiSuccess |

### Fase 2: Feature (Core)

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/types/intelligence.ts` | S29-FT-01 | Adicionar interface IntelligenceAsset (DT-10) |
| `app/src/lib/hooks/use-intelligence-assets.ts` | S29-FT-01 | Implementar hook real (multi-query 3 collections) |
| `app/src/components/intelligence/discovery/assets-panel.tsx` | S29-FT-01 | Implementar panel real (cards, skeleton, badges) |
| `app/src/app/intelligence/discovery/page.tsx` | S29-FT-01 | Atualizar consumer/props |
| `app/src/lib/firebase/scoped-data.ts` | S29-FT-01 | Adicionar funcoes de query (getAutopsies, getOffers) |
| `app/src/app/api/intelligence/autopsy/run/route.ts` | S29-FT-02 | Substituir TODO por setDoc fire-and-forget |
| `app/src/app/api/intelligence/offer/save/route.ts` | S29-FT-02 | Substituir TODO por await setDoc |
| `app/src/types/personalization.ts` | S29-FT-03 | Expandir LeadState (remover catch-all, campos concretos) |
| `app/src/lib/intelligence/personalization/propensity.ts` | S29-FT-03 | Renomear score → propensityScore em persistSegment() |

### Fase 2: Feature (STRETCH)

| Arquivo | Story | Tipo de Mudanca |
|:--------|:------|:---------------|
| `app/src/lib/guards/rate-limiter.ts` | S29-FT-04 | **CRIAR** — guard function checkRateLimit() |
| 7 rotas API (intelligence/*, funnels/*, social/*, design/*, copy/*) | S29-FT-04 | Integrar rate limiting |

---

## Resumo de Impacto por Contrato

| Lane (contract-map.yaml) | Contrato | Impacto | Risco |
|:--------------------------|:---------|:--------|:------|
| `automation` | N/A | budget-optimizer registrado (CL-01) | Minimo |
| `intelligence_wing` | `intelligence-storage.md` | Discovery Hub Assets + Autopsy persist + Offer persist | Medio — core da Sprint |
| `personalization` | N/A | LeadState expandida + propensityScore rename | Baixo — campos opcionais |
| `types` (cross-cutting) | N/A | reporting.ts, personalization.ts, intelligence.ts | Baixo — expansao sem breaking change |
| `api_consistency` | N/A | 2 webhooks migrados para createApiError | Baixo — mesma semantica |
| `guards` | N/A | rate-limiter.ts (STRETCH) | Baixo — novo modulo isolado |

**NENHUM contrato ativo sera quebrado.** Justificativas:
1. Tipos sao EXPANDIDOS (novos campos opcionais) — nunca reduzidos
2. Persistencia e ADICIONADA (setDoc) — rotas mantem mesma API publica
3. Discovery Hub substitui stubs por implementacao real — mesma interface
4. Webhooks mantém mesmos status codes e mensagens de erro
5. Rate Limiting e modulo NOVO isolado — zero impacto em codigo existente
6. Attribution/Personalization engines logica intocada (P1) — apenas rename de campo em propensity.ts

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Incorpora proibicoes do PRD (Iuran) e Proibicoes Arquiteturais do Arch Review (Athos)*
*Sprint 29: Assets & Persistence Hardening | 07/02/2026*
*9 stories | 1 arquivo novo (STRETCH) | 14+ arquivos modificados*
*Principio No Global Context: Darllyson le APENAS os arquivos listados aqui por fase*
