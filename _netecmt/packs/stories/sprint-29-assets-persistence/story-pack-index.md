# Story Pack: Sprint 29 — Assets & Persistence Hardening
**ID:** S29-00
**Lane:** intelligence + persistence + cleanup (cross-cutting)
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

## Contents
- [Stories Distilled](stories.md)
- [Allowed Context](allowed-context.md)

## PRD & Architecture Review
- **PRD:** `_netecmt/solutioning/prd/prd-sprint-29-assets-persistence-hardening.md` — Iuran (PM)
- **Arch Review:** `_netecmt/solutioning/architecture/arch-sprint-29.md` — Athos (Architect)
- **Arch Status:** APROVADO COM RESSALVAS (12 DTs, 2 Blocking)
- **Deliberacao:** Aprovada pelo Alto Conselho — escopo refinado apos Sprint Sigma

## Predecessora
- Sprint Sigma (Sub-Sprint de Consistencia do Codebase) — CONCLUIDA (QA 99/100)
- Baseline: `tsc --noEmit` = 0, `npm run build` = sucesso (103+ rotas), 224/224 testes passando

## Squad
| Papel | Agente | Responsabilidade |
|:------|:-------|:-----------------|
| PM | Iuran | PRD, escopo, proibicoes |
| Architect | Athos | 12 DTs, schemas, sequencia refinada |
| SM | Leticia | Story Pack, gates, allowed context |
| Dev | Darllyson | Implementacao guiada por stories |
| QA | Dandara | SC-01 a SC-10, RC-01 a RC-13 |

---

## Success Criteria (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| **SC-01** | **Zero stubs/TODOs funcionais residuais** — todos os 8 stubs listados no PRD estao implementados ou removidos | Verificar cada arquivo: nenhum corpo vazio, nenhum `// TODO: Sprint XX`, nenhum `[key: string]: unknown` como catch-all | Dandara |
| **SC-02** | **Discovery Hub Assets funcional** — hook retorna dados reais via multi-query (audience_scans + autopsies + offers), panel exibe cards com tipo, nome, data e status | Navegar para `/intelligence/discovery`, verificar que o painel de Assets mostra dados (nao "Em desenvolvimento") | Dandara |
| **SC-03** | **Autopsy persiste no Firestore** — apos executar um scan, o resultado aparece em `brands/{brandId}/autopsies/{id}` | Executar POST `/api/intelligence/autopsy/run`, verificar documento criado no Firestore | Dandara |
| **SC-04** | **Offer persiste no Firestore** — apos salvar uma oferta, o documento aparece em `brands/{brandId}/offers/{id}` | Executar POST `/api/intelligence/offer/save`, verificar documento criado no Firestore | Dandara |
| **SC-05** | **LeadState com campos concretos** — interface sem catch-all `[key: string]: unknown`, com campos tipados alinhados com PropensityEngine + Maestro | `rg "\[key: string\]: unknown" app/src/types/personalization.ts` retorna 0 para `LeadState` | Dandara |
| **SC-06** | **Reporting types ativos** — `AIAnalysisResult` e `ReportMetrics` sem catch-all, com campos concretos. `briefing-bot.ts` compila sem cast | `rg "\[key: string\]: unknown" app/src/types/reporting.ts` retorna 0 | Dandara |
| **SC-07** | **Zero formato de erro legado em webhooks** — `dispatcher` e `ads-metrics` usam exclusivamente `createApiError` | `rg "NextResponse.json.*error" app/src/app/api/webhooks/` retorna 0 | Dandara |
| **SC-08** | **contract-map atualizado** — `budget-optimizer.ts` registrado na lane automation | `rg "budget-optimizer" _netecmt/core/contract-map.yaml` retorna 1+ match | Dandara |
| **SC-09** | **tsc=0, build sucesso, >= 224 testes pass, zero regressao** | `npx tsc --noEmit` = 0, `npm run build` sucesso, `npm test` >= 224 pass | Dandara |
| **SC-10** | **(STRETCH) Rate Limiting funcional** — rotas de alto consumo retornam 429 quando quota excedida | Enviar 101+ requests para rota limitada, verificar 429 | Dandara |

---

## Estrutura: 2 Fases + 1 Gate + 1 STRETCH

### Fase 1: Cleanup (Gate) — ~1.5h
- **4 Stories** (todas paralelizaveis): S29-CL-01, S29-CL-02, S29-CL-03, S29-CL-04
- **1 Gate**: S29-GATE-01

### -- GATE CHECK 1 -- (tsc + build + tests + review CL-01 a CL-04) --

### Fase 2: Feature (Core) — ~8.5-10h
- **Pre-step**: Criar tipo IntelligenceAsset (DT-10)
- **4 Stories**: S29-FT-02 (Persistence) → S29-FT-01 (Discovery Hub) + S29-FT-03 (LeadState)

### Fase 2: Feature (STRETCH) — ~3-4h
- **1 Story**: S29-FT-04 (Rate Limiting) — somente apos FT-01 a FT-03 concluidos

### QA Final — ~1-2h
- Dandara valida SC-01 a SC-10 + RC-01 a RC-13

---

## Blocking DTs Checklist — Pre-flight (Secoes 7 e 2.2 do Arch Review)

> A SM NAO autoriza inicio da implementacao sem confirmacao dos 2 DTs blocking:

- [ ] **DT-03 (P0 BLOCKING)**: Darllyson entende que `processAssetText()` em `assets.ts` e um STUB MORTO — a implementacao REAL esta em `assets-server.ts`. A acao e DELETAR o stub (4 linhas), NAO reimplementar. Nenhum caller real depende do stub.
- [ ] **DT-05 (P0 BLOCKING)**: Darllyson entende que Discovery Hub Assets NAO deve criar collection `intelligence_assets` no Firestore. A acao e fazer multi-query paralela em 3 collections existentes (`audience_scans`, `autopsies`, `offers`) com tipo unificado `IntelligenceAsset`. Zero duplicacao de dados.

---

## Ordem de Execucao (Darllyson)

```
[FASE 1 — Cleanup (GATE)]
  S29-CL-01 (contract-map, XS, ~15min) — paralelo
  S29-CL-02 (reporting types, XS, ~20min) — paralelo
  S29-CL-03 (processAssetText — DELETAR stub, XS, ~15min) — paralelo
  S29-CL-04 (webhook routes, S, ~40min) — paralelo

  ── S29-GATE-01 ── (tsc + build + tests + review CL-01 a CL-04) ──

[FASE 2 — Feature (Core)]
  ★ Primeiro: Criar tipo IntelligenceAsset em types/intelligence.ts (DT-10)
  ★ Primeiro: Implementar persistencia Autopsy + Offer (S29-FT-02)
    S29-FT-02a (Autopsy persist, S) — fire-and-forget
    S29-FT-02b (Offer persist, S) — await
  DEPOIS:
  S29-FT-01 (Discovery Hub Assets, L, ~5-6h) — depende de FT-02 (collections precisam existir)
    + S29-FT-03 (LeadState expansion, S+, ~1.5-2h) — independente de FT-01

[FASE 2 — Feature (STRETCH)]
  S29-FT-04 (Rate Limiting, M, ~3-4h) — somente apos FT-01 a FT-03 concluidos

[QA FINAL]
  Dandara valida SC-01 a SC-10 + RC-01 a RC-13
```

**Notas sobre paralelismo (Arch Review Secao 12):**
- F1: CL-01 a CL-04 sao TODOS independentes (podem paralelizar)
- F2: FT-02 (persistencia) ANTES de FT-01 (Discovery Hub) — o hook precisa que as collections existam
- F2: FT-01 e FT-03 sao independentes (podem paralelizar)
- STRETCH: FT-04 so apos FT-01 a FT-03 estaveis

---

## Estimativa Revisada (Arch Review — Athos, aceita pelo Conselho)

| Fase | Stories | Estimativa | Gate? | Delta vs PRD |
|:-----|:--------|:----------|:------|:-------------|
| **FASE 1** | | | | |
| Stories Cleanup | S29-CL-01 a CL-04 | ~1.5h | — | -0.5h (DT-03: deletar, nao reimplementar) |
| **— S29-GATE-01 —** | — | ~30min | **SIM** | — |
| **Subtotal F1** | **4 + 1 gate** | **~2h** | | **-0.5h** |
| **FASE 2 (Core)** | | | | |
| Stories Feature | S29-FT-01 a FT-03 | ~8.5-10h | — | ~0 |
| **Subtotal F2 Core** | **3** | **~8.5-10h** | | **~0** |
| **FASE 2 (STRETCH)** | | | | |
| Rate Limiting | S29-FT-04 | ~3-4h | Nao | = |
| **QA Final** | — | ~1-2h | — | — |
| **TOTAL (sem STRETCH)** | **8 stories** | **~11-13.5h** | **1 gate** | **-0.5h vs PRD** |
| **TOTAL (com STRETCH)** | **9 stories** | **~14-17.5h** | **1 gate** | **-0.5h vs PRD** |

**Razao do delta -0.5h:** DT-03 (-30min: processAssetText e so deletar), DT-06/07 (-30min: tipos ja existem), DT-08 (+30min: 2 motores a unificar em LeadState).

---

## Decision Topics Incorporados (12 DTs do Arch Review)

| DT | Titulo | Severidade | Blocking? | Story Incorporada | Acao |
|:---|:-------|:-----------|:----------|:-------------------|:-----|
| **DT-01** | contract-map: budget-optimizer | P2 | Nao | S29-CL-01 | Registrar na lane `automation` |
| **DT-02** | Reporting types: schemas concretos | P1 | Nao | S29-CL-02 | AIAnalysisResult + ReportMetrics com campos concretos |
| **DT-03** | **processAssetText: REMOVER stub client** | **P0** | **SIM** | S29-CL-03 | Deletar stub em `assets.ts`, manter `assets-server.ts` intocado |
| **DT-04** | Webhook routes: createApiError | P1 | Nao | S29-CL-04 | Migrar 13 pontos (6+7) para createApiError/createApiSuccess |
| **DT-05** | **Discovery Hub: multi-query, nao collection nova** | **P0** | **SIM** | S29-FT-01 | Multi-query em `audience_scans` + `autopsies` + `offers`, tipo IntelligenceAsset |
| **DT-06** | Autopsy persistence: AutopsyDocument | P1 | Nao | S29-FT-02 | Usar tipo existente, fire-and-forget, TTL 30d |
| **DT-07** | Offer persistence: OfferDocument | P1 | Nao | S29-FT-02 | Usar tipo existente, await (nao fire-and-forget) |
| **DT-08** | LeadState: uniao de 2 motores | P1 | Nao | S29-FT-03 | Interface com campos PropensityEngine + Maestro. `score` → `propensityScore` |
| **DT-09** | Rate Limiting: guard + Firestore | P1 | Nao | S29-FT-04 | Guard function `checkRateLimit()`, Firestore counters, reset diario |
| **DT-10** | IntelligenceAsset: tipo unificado | P1 | Nao | S29-FT-01 | Novo tipo para normalizar assets de 3 collections |
| **DT-11** | Autopsy fire-and-forget: logging | P2 | Nao | S29-FT-02 | `.catch(err => console.error())` obrigatorio |
| **DT-12** | Offer `await` vs fire-and-forget | P1 | Nao | S29-FT-02 | `await` (semantica de "save") |

---

## Correcoes de Premissa do PRD (Arch Review)

| # | Premissa do PRD | Realidade | Impacto |
|:--|:----------------|:----------|:--------|
| CP-01 | "`processAssetText()` tem corpo vazio — implementar ou remover" | Existem DUAS versoes: stub vazio em `assets.ts` + implementacao REAL em `assets-server.ts`. Nenhum caller real usa o stub | -30min (so deletar) |
| CP-02 | "Hook busca de `brands/{brandId}/intelligence_assets`" | Nao existe tal collection. Dados vivem em `audience_scans`, `autopsies`, `offers` | +30min (multi-query) |
| CP-03 | "LeadState precisa de `segment`, `propensityScore`" | Correto, mas TAMBEM precisa de campos do Maestro (`currentAwareness`, `lastInteraction`, `tags`) | +15min (unificar) |

---

## Proibicoes (PRD P1-P11 + Arch Review PA-01 a PA-06)

### PRD (Iuran) — P1 a P11

| # | Proibicao |
|:--|:----------|
| P1 | NUNCA alterar logica de negocio dos modulos estabilizados (PropensityEngine, Attribution, Audience Scan, Creative Engine) |
| P2 | NUNCA remover exports existentes de types/*.ts |
| P3 | NUNCA usar firebase-admin ou google-cloud/* |
| P4 | NUNCA usar `any` em novos tipos ou funcoes |
| P5 | NUNCA hardcodar brandId |
| P6 | NUNCA iniciar Fase 2 sem Gate Check aprovado |
| P7 | NUNCA alterar API publica (URL, metodo HTTP) de rotas existentes |
| P8 | NUNCA usar formato de erro legado em codigo novo |
| P9 | NUNCA criar types sem tipar campos concretos — proibido `[key: string]: unknown` como catch-all |
| P10 | NUNCA implementar Ads Integration nesta sprint |
| P11 | NUNCA modificar testes existentes passando (exceto adaptar imports) |

### Arch Review (Athos) — PA-01 a PA-06

| # | Proibicao |
|:--|:----------|
| PA-01 | NUNCA criar collection `intelligence_assets` no Firestore — assets vivem nas collections canonicas |
| PA-02 | NUNCA reimplementar `processAssetText` em `assets.ts` — a versao real esta em `assets-server.ts` |
| PA-03 | NUNCA usar `await` na persistencia de autopsy — fire-and-forget |
| PA-04 | NUNCA usar fire-and-forget na persistencia de offer — `await setDoc` obrigatorio |
| PA-05 | NUNCA misturar campo `score` generico em leads — usar `propensityScore` para PropensityEngine |
| PA-06 | NUNCA rate-limitar rotas `/api/admin/*` — admin sempre isento |

---

## Ressalvas do Conselho (R1-R6)

| # | Ressalva | Incorporacao no Story Pack |
|:--|:---------|:--------------------------|
| R1 | Gate Check (Cleanup) e BLOQUEANTE | S29-GATE-01 entre Fase 1 e Fase 2 |
| R2 | Rate Limiting e STRETCH | S29-FT-04 so apos FT-01 a FT-03 concluidos |
| R3 | Padroes Sigma sao lei | `createApiError`, `requireBrandAccess`, `Timestamp`, `force-dynamic` obrigatorios |
| R4 | Ads Integration e S30, nao S29 | Zero imports de Meta/Google SDKs |
| R5 | PRD precisa de Arch Review antes de stories | Arch Review APROVADO COM RESSALVAS — 07/02/2026 |
| R6 | Meta QA 99 ou 100 | QA final confirma score |

---

## Milestones

| Milestone | Validacao | Stories Concluidas |
|:----------|:----------|:-------------------|
| **M1: Cleanup Done** | Gate Check 1 aprovado | S29-CL-01/02/03/04, S29-GATE-01 |
| **M2: Persistence Functional** | Autopsy + Offer salvam no Firestore | S29-FT-02 |
| **M3: Discovery Hub Live** | Assets panel mostra dados reais via multi-query | S29-FT-01 |
| **M4: Types Hardened** | LeadState expandida, zero catch-all residual | S29-FT-03 |
| **M5: Sprint Complete** | SC-01 a SC-09 aprovados | QA Final (Dandara) |
| **M6: (STRETCH) Rate Limited** | SC-10 aprovado | S29-FT-04 |

---

## Schemas Firestore Propostos (Referencia Arch Review Secao 4)

| Collection | Path | Story | Status |
|:-----------|:-----|:------|:-------|
| Autopsies | `brands/{brandId}/autopsies/{id}` | S29-FT-02 | Novo — schema `AutopsyDocument` (types/autopsy.ts) |
| Offers | `brands/{brandId}/offers/{id}` | S29-FT-02 | Novo — schema `OfferDocument` (types/offer.ts) |
| Quotas | `brands/{brandId}/quotas/{period}` | S29-FT-04 (STRETCH) | Novo — schema `QuotaDocument` |
| Audience Scans | `brands/{brandId}/audience_scans` | S29-FT-01 (leitura) | Existente — sem alteracao |
| Leads | `brands/{brandId}/leads/{leadId}` | S29-FT-03 | Existente — expandir schema |

**Nota:** Schemas detalhados na Secao 4 do Arch Review (`arch-sprint-29.md`). Stories referenciam esses schemas — NAO reinventar.

---
*Story Pack preparado por Leticia (SM) — NETECMT v2.0*
*Sprint 29: Assets & Persistence Hardening | 07/02/2026*
*9 stories (4 cleanup + 1 gate + 3 feature core + 1 STRETCH) | 12 DTs incorporados | 2 Blocking | 1 Gate*
*Estimativa: 11-13.5h (sem STRETCH) / 14-17.5h (com STRETCH)*
*Baseline: 224/224 testes, tsc=0, build=103+ rotas, QA=99/100*
