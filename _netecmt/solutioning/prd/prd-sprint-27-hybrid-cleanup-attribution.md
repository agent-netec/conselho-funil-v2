# 🔄 PRD: Hybrid Sprint — Backlog Cleanup + Attribution Revival — Sprint 27

**Versão:** 1.0  
**Responsável:** Iuran (PM)  
**Status:** 📋 Pronto para Review (Athos/Leticia)  
**Data:** 06/02/2026  
**Tipo:** Hybrid (Stabilization + Feature Revival)  
**Predecessora:** Sprint 26 (Technical Debt Cleanup) — ✅ CONCLUÍDA (QA 97/100)

---

## 1. Contexto e Motivação

### O que aconteceu
A Sprint 26 (Technical Debt Cleanup) foi concluída com sucesso: 161 erros TypeScript eliminados, build limpo, QA score 97/100. Porém, a QA identificou **5 items de backlog** (BKL-01 a BKL-05) que precisam de resolução, e a Architecture Review revelou que **4 módulos de Attribution existem como dead code** com ~1.058 linhas de código produtivo pronto para ativação.

### Por que agora

**Frente 1 — Backlog Cleanup (Estabilização):**
- 14 testes falhando mascaram regressões futuras (P1)
- Jest/Playwright colidem no mesmo runner, gerando ruído no CI (P2)
- `contract-map.yaml` com discrepância de path desde Sprint 20 (P2)
- 9 stubs TODO e 5 `@ts-ignore` pendentes de resolução (P3)

**Frente 2 — Attribution Revival (Feature):**
- 4 módulos core (`engine.ts`, `bridge.ts`, `aggregator.ts`, `overlap.ts`) com **632 linhas de lógica real** sentados como dead code (0 consumers)
- UI page completa em `/intelligence/attribution` (230 linhas) — renderiza mas sem dados reais
- Hook `use-attribution-data.ts` (125 linhas) — lógica completa, usa tipo stub
- **ROI excepcional**: ativar ~1.058 linhas existentes com esforço mínimo de wiring

### Decisão da SM (Leticia)
Opção E (Hybrid) aprovada: resolver backlog P1/P2 da Sprint 26 + ativar módulo de valor.

### Decisão do PM (Iuran): Attribution Revival > Personalization Advance

| Critério | Attribution Revival | Personalization Advance |
|:---------|:-------------------|:----------------------|
| Código existente pronto | ~1.058 linhas (98% implementado) | ~80% fundação (maestro ativo) |
| Consumidores atuais | 0 (dead code) → precisa ativação | 5 (já parcialmente ativo) |
| UI pronta | ✅ Page + Hook completos | ✅ Page existe |
| Esforço de ativação | Baixo (wiring + type completion) | Alto (API externa, middleware, auth) |
| Risco | Baixo (código existente, testável) | Médio (Meta Ads API, PII, runtime) |
| Valor entregue | Dashboard de Attribution funcional | Deep-Scan incremental |
| Dependência externa | Nenhuma | Meta Ads API (Lookalike Sync) |
| Sprint dedicada futura | Não necessita | Sim — PRD Sprint 29 já existe |

**Racional:** Attribution Revival oferece o maior ROI possível — ativar ~1.058 linhas de código produtivo existente com esforço mínimo. Personalization já está parcialmente ativa (maestro com 5 consumers) e tem PRD draft para Sprint 29; não perde nada esperando.

---

## 2. Objetivo da Sprint

> **"Resolver 100% do backlog herdado da Sprint 26, ativar o módulo de Attribution dormante, e entregar um dashboard funcional de atribuição multi-touch com dados reais."**

### North Star Metrics

| Métrica | Antes | Meta |
|:--------|:------|:-----|
| Testes falhando | 14 | **≤ 2** (env-dependent aceitos) |
| Attribution modules dead code | 4 módulos / 0 consumers | **0 dead code / ≥ 1 consumer cada** |

### Métricas Secundárias

| Métrica | Antes | Meta |
|:--------|:------|:-----|
| Jest/Playwright collision | ⚠️ Colidem | ✅ Separados |
| `contract-map.yaml` discrepância | 1 (personalization path) | 0 |
| Stubs TODO (BKL-04) | 9 | ≤ 5 (4 resolvidos pela attribution) |
| `@ts-ignore` count | 5 | ≤ 3 |
| Attribution page com dados reais | ❌ | ✅ |
| CampaignAttributionStats preenchido | Stub | Real |

---

## 3. Escopo

### 3.1 In-Scope — Frente 1: Backlog Cleanup (Stabilization)

#### Epic 1: Test Infrastructure Fix [P1]

| ID | Item | Descrição | Esforço |
|:---|:-----|:----------|:--------|
| S27-ST-01 | **Fix 6 testes com env vars ausentes** | Criar `.env.test` com mocks de `NEXT_PUBLIC_FIREBASE_API_KEY`, `GOOGLE_AI_API_KEY` e demais. Alternativa: skip condicional com `describe.skipIf(!process.env.X)` | M |
| S27-ST-02 | **Fix 5 testes com mocks desatualizados** | Atualizar mocks em `use-brand-assets.test.ts`, `guardrails.test.ts`, `ethical-guardrails.test.ts`, `metrics/route.test.ts`, `validate/route.test.ts` para alinhar com interfaces atuais | M |
| S27-ST-03 | **Fix 2 testes com stubs TODO** | `rag.test.ts` espera implementação de `keywordMatchScore` e `generateLocalEmbedding` que são stubs (retornam 0). Opção A: implementar funções reais. Opção B: ajustar expectativas do teste para refletir stubs | S |
| S27-ST-04 | **Configurar Jest para excluir Playwright** | Adicionar `testPathIgnorePatterns: ['tests/smoke']` no `jest.config` ou mover specs para diretório separado. Resolve colisão Jest/Playwright (BKL-02) | S |

#### Epic 2: Contract & Type Hygiene [P2]

| ID | Item | Descrição | Esforço |
|:---|:-----|:----------|:--------|
| S27-ST-05 | **Corrigir `contract-map.yaml` path** | Atualizar `personalization_engine` de `operations/personalization/**` para `intelligence/personalization/**` (BKL-03, Ressalva 3 do Arch Review S26) | S |
| S27-ST-06 | **Resolver `@ts-ignore` em MCP adapters** | Tipar corretamente os 5 adapters: `bright-data.ts`, `glimpse.ts`, `firecrawl.ts`, `exa.ts`, `browser.ts`. Substituir `@ts-ignore` por tipos reais ou `@ts-expect-error` com justificativa (BKL-05) | M |

### 3.2 In-Scope — Frente 2: Attribution Revival (Feature)

#### Epic 3: Attribution Module Activation [P1]

| ID | Item | Descrição | Esforço |
|:---|:-----|:----------|:--------|
| S27-ST-07 | **Completar tipo `CampaignAttributionStats`** | Remover `@stub`, adicionar campos reais baseados no consumer `use-attribution-data.ts`. Verificar todos os campos acessados no hook e na page. Inclui campos: `campaignName`, `spend`, `conversions`, `roi`, `variation`, e novos campos necessários | S |
| S27-ST-08 | **Ativar `config.ts` para attribution** | Expandir `lib/intelligence/config.ts` de re-export stub para config real: exportar `db`, coleções de attribution (`attribution_bridges`, `events`, `transactions`, `cross_channel_metrics`), e constantes de configuração | S |
| S27-ST-09 | **Conectar spend data no hook** | `use-attribution-data.ts` atualmente seta `spend: 0`. Conectar ao Firestore `performance_metrics` ou `cross_channel_metrics` via `CrossChannelAggregator`. Validar que dados fluem da coleção para o hook | L |
| S27-ST-10 | **Wiring: registrar consumers para módulos attribution** | Conectar `aggregator.ts`, `bridge.ts`, `overlap.ts` a pelo menos 1 consumer cada. Opções: (A) criar rota API `/api/intelligence/attribution/stats` server-side, (B) conectar via hook existente, (C) integrar no pipeline de ingestão de eventos | L |
| S27-ST-11 | **Verificar e testar page de Attribution** | Validar que `/intelligence/attribution` renderiza com dados reais. Testar model comparison (Last Click vs U-Shape vs Linear), bar chart, tabela de performance, cards de Hidden Value. Corrigir qualquer UI issue encontrado | M |

#### Epic 4: Attribution Stubs Resolution [P2]

| ID | Item | Descrição | Esforço |
|:---|:-----|:----------|:--------|
| S27-ST-12 | **Implementar stubs TODO em módulos attribution** | Resolver os stubs TODO que eram dependência da attribution: `lib/intelligence/config.ts` (já resolvido em ST-08), stubs de tipos em `attribution.ts`. Remove itens do BKL-04 | S |

### 3.3 Out-of-Scope (O que NÃO será feito)

| Item | Justificativa |
|:-----|:-------------|
| Personalization Advance | PRD Sprint 29 draft existe. Maestro já ativo com 5 consumers. Não é urgente |
| Media Mix Modeling (MMM) | Componente avançado de attribution — futuro, não MVP de ativação |
| Ads Lookalike Sync | Requer Meta Ads API — escopo de Sprint dedicada |
| Real-time attribution tracking | Escopo é ativar batch/on-demand, não streaming |
| Novos modelos de atribuição | Engine já suporta 4 (Linear, Time Decay, U-Shape, Last Touch) — suficiente |
| Implementação de stubs não-attribution | Stubs de RAG (`keywordMatchScore`, `generateLocalEmbedding`, `hashString`) e assets panel permanecem TODO para sprint futura |
| Reescrita de testes | Apenas corrigir; não reescrever lógica de teste |
| Remoção de módulos | Código morto não-attribution permanece como está |

---

## 4. Abordagem Técnica

### 4.1 Frente 1: Backlog Cleanup — Estratégia

**Sequência:** ST-04 (Jest config) → ST-01 (env vars) → ST-02 (mocks) → ST-03 (stubs) → ST-05 (contract-map) → ST-06 (ts-ignore)

**Racional:** Corrigir Jest config primeiro elimina o falso positivo do Playwright, reduzindo o count de 14 para 13. Depois, env vars reduzem 6 falhas de uma vez. Mocks e stubs são isolados.

### 4.2 Frente 2: Attribution Revival — Estratégia

**Sequência:** ST-07 (tipos) → ST-08 (config) → ST-12 (stubs) → ST-09 (spend data) → ST-10 (wiring) → ST-11 (validação UI)

**Racional:** Bottom-up — tipos e config primeiro (fundação), depois conectar dados (spend), depois wiring dos consumers (ativação), por último validar na UI (confirmação).

### 4.3 Módulos de Attribution — Estado Atual

```
┌──────────────────────────────────────────────────────────────────┐
│             ATTRIBUTION MODULE — REVIVAL MAP                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌── CORE (632 linhas — 100% implementado, 0 consumers) ───┐    │
│  │                                                            │    │
│  │  engine.ts (179L) ─── Multi-touch: Linear, TimeDecay,     │    │
│  │                        U-Shape, Last Touch                 │    │
│  │  bridge.ts (187L) ─── Sync events, map external IDs       │    │
│  │                        (fbclid, gclid, ttclid)             │    │
│  │  aggregator.ts (139L) ─ Cross-channel metrics, blended    │    │
│  │                          ROAS/CPA por plataforma           │    │
│  │  overlap.ts (127L) ── Channel overlap, assisted sales,    │    │
│  │                        conversion paths                    │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌── CONSUMER LAYER (355 linhas — implementado) ─────────────┐   │
│  │                                                            │    │
│  │  use-attribution-data.ts (125L) ─── Hook: fetch + apply   │    │
│  │           └── spend: 0 ← PRECISA CONECTAR                 │    │
│  │  page.tsx (230L) ─── Dashboard: charts, tables, cards     │    │
│  │           └── Renderiza mas sem dados reais                │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ┌── TYPES & CONFIG (stubs) ─────────────────────────────────┐   │
│  │                                                            │    │
│  │  types/attribution.ts ─── CampaignAttributionStats (STUB) │    │
│  │  lib/intelligence/config.ts ─── db re-export (STUB)       │    │
│  │                                                            │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                    │
│  ⚡ ATIVAÇÃO = Completar tipos + Conectar spend + Wire consumers │
│                                                                    │
└──────────────────────────────────────────────────────────────────┘
```

### 4.4 Padrões de Correção

| Tipo de Fix | Exemplo | Permitido |
|:-----------|:--------|:----------|
| Completar tipo stub | `CampaignAttributionStats` → campos reais | ✅ |
| Expandir config stub | Re-export → config com coleções | ✅ |
| Conectar dados existentes | Hook ← Firestore collections | ✅ |
| Criar rota API nova | `/api/intelligence/attribution/stats` | ✅ |
| Registrar consumer em módulo existente | Import attribution em pipeline | ✅ |
| Corrigir mocks de teste | Alinhar com interfaces atuais | ✅ |
| Configurar Jest runner | `testPathIgnorePatterns` | ✅ |
| Corrigir contract-map path | `operations/` → `intelligence/` | ✅ |
| Substituir `@ts-ignore` | Tipar corretamente adapters MCP | ✅ |
| Alterar lógica de negócio existente | — | ❌ PROIBIDO |
| Remover funcionalidade | — | ❌ PROIBIDO |
| Alterar interfaces contratuais existentes | — | ❌ PROIBIDO |
| Modificar módulos fora do escopo | — | ❌ PROIBIDO |

---

## 5. Proibições (Allowed Context Constraints)

| # | Proibição | Justificativa |
|:--|:----------|:-------------|
| P1 | **NUNCA alterar lógica de negócio** dos módulos attribution existentes (`engine.ts`, `bridge.ts`, `aggregator.ts`, `overlap.ts`) | Código testado e produtivo — apenas conectar, não reescrever |
| P2 | **NUNCA remover exports existentes** de `types/attribution.ts` | `AttributionModel`, `AttributionPoint`, etc. são contratuais |
| P3 | **NUNCA alterar interfaces de Sprint 25** (`prediction.ts`, `creative-ads.ts`, `text-analysis.ts`) | Intocáveis — produção estável |
| P4 | **NUNCA alterar `types/social-inbox.ts`** | Usado ativamente por Social Command Center |
| P5 | **NUNCA remover stubs que não são do escopo attribution** | Stubs de RAG, assets panel, etc. permanecem TODO |
| P6 | **NUNCA usar `any`** em novos tipos ou correções | `unknown` com index signature quando necessário |
| P7 | **NUNCA alterar o formato do `contract-map.yaml`** — apenas corrigir o path de `personalization_engine` | Mudança cirúrgica, sem refatoração do YAML |
| P8 | **Ao resolver `@ts-ignore` nos MCP adapters**, NUNCA alterar a lógica de chamada do adapter | Apenas adicionar tipos; não mudar comportamento |

---

## 6. Riscos e Mitigações

| # | Risco | Prob. | Impacto | Mitigação |
|:--|:------|:------|:--------|:----------|
| R1 | Testes com env vars falham em CI (não apenas local) | Média | Médio | `.env.test` com valores mock OU `describe.skipIf` condicional |
| R2 | Mocks atualizados expõem bugs reais nos módulos | Baixa | Alto | Se mock expõe bug real, documentar como finding — NÃO corrigir lógica nesta sprint |
| R3 | Spend data não disponível em Firestore (coleções vazias) | Média | Médio | Seed de dados de teste para attribution; fallback `spend: 0` com indicador visual "sem dados" |
| R4 | Wiring de attribution introduz side-effects em pipeline existente | Baixa | Alto | Ativar via feature flag ou consumer isolado (nova rota API), não injetar em pipeline existente |
| R5 | MCP adapter typing quebra integração com MCP Server | Baixa | Médio | Testar cada adapter individualmente pós-fix; manter `@ts-expect-error` com comentário se tipo impossível |
| R6 | `contract-map.yaml` update cascata em validações | Muito Baixa | Baixo | Mudança é apenas corrigir um path errado para path correto |

---

## 7. Critérios de Sucesso

### Definition of Done (Sprint Level)

| # | Critério | Validação | Responsável |
|:--|:---------|:----------|:-----------|
| CS-01 | `npm test` — **≤ 2 testes falhando** (env-dependent aceitos) | Dandara executa e conta | QA |
| CS-02 | Jest NÃO executa specs Playwright | `npm test` não mostra `smoke/*.spec.ts` na suite | QA |
| CS-03 | `contract-map.yaml` `personalization_engine` aponta para `intelligence/personalization/**` | Diff visual | QA |
| CS-04 | `@ts-ignore` count ≤ 3 (redução de 5 para ≤ 3) | `grep -r "@ts-ignore" --include="*.ts"` | QA |
| CS-05 | Attribution page renderiza com dados | Screenshot de `/intelligence/attribution` com chart populado | QA |
| CS-06 | `CampaignAttributionStats` não é mais stub | Arquivo `types/attribution.ts` sem `@stub` no tipo | QA |
| CS-07 | ≥ 1 consumer registrado para cada módulo attribution | `grep -r "import.*from.*attribution"` retorna consumers reais | QA |
| CS-08 | `npx tsc --noEmit` continua = 0 erros | Build limpo mantido | QA |
| CS-09 | `npm run build` (Next.js) sucesso | 96+ rotas compiladas sem erro | QA |
| CS-10 | Zero regressão funcional | Smoke tests passam, rotas P0 acessíveis | QA |

### Acceptance Criteria (por Epic)

**Epic 1 (Test Infrastructure):**
- 14 → ≤ 2 testes falhando
- Playwright separado do Jest

**Epic 2 (Contract & Type Hygiene):**
- `contract-map.yaml` corrigido
- ≥ 2 `@ts-ignore` removidos

**Epic 3 (Attribution Activation):**
- Attribution page funcional com dados
- Spend data conectado (não hardcoded 0)
- 4 módulos core com ≥ 1 consumer cada

**Epic 4 (Attribution Stubs):**
- Stubs attribution resolvidos
- BKL-04 count reduzido de 9 para ≤ 5

---

## 8. Cronograma e Dependências

### Estimativa

| Fase | Stories | Estimativa | Responsável |
|:-----|:--------|:----------|:-----------|
| Epic 1: Test Infrastructure | ST-01 a ST-04 | 2-3h | Darllyson (Dev) |
| Epic 2: Contract & Hygiene | ST-05, ST-06 | 1-2h | Darllyson (Dev) |
| Epic 3: Attribution Activation | ST-07 a ST-11 | 4-6h | Darllyson (Dev) |
| Epic 4: Attribution Stubs | ST-12 | 30min | Darllyson (Dev) |
| QA Final | — | 1h | Dandara (QA) |
| **Total** | **12 stories** | **8.5-12.5h** | — |

### Ordem de Execução Recomendada

```
[Frente 1]
  ST-04 (Jest config) → ST-01 (env vars) → ST-02 (mocks) → ST-03 (stubs test)
  → ST-05 (contract-map) → ST-06 (ts-ignore)

[Frente 2]
  ST-07 (tipos) → ST-08 (config) → ST-12 (stubs attr) → ST-09 (spend) → ST-10 (wiring) → ST-11 (UI validation)

[QA]
  Dandara valida CS-01 a CS-10
```

**Nota:** Frente 1 e Frente 2 podem ser executadas em paralelo se houver capacidade, pois não há dependência entre elas (exceto que ambas requerem `tsc --noEmit` = 0 ao final).

### Dependências

| Dependência | Status | Impacto |
|:-----------|:-------|:--------|
| Sprint 26 concluída | ✅ Confirmada (QA 97/100) | Pré-requisito cumprido |
| Build limpo (`tsc --noEmit` = 0) | ✅ Confirmado | Baseline mantida |
| Firestore collections (`attribution_bridges`, `events`, `transactions`) | ⚠️ Verificar se populadas | ST-09 depende de dados existentes |
| Nenhum MCP/CLI novo | ✅ | Ferramentas existentes suficientes |

---

## 9. Backlog Residual (Sprint 28+)

Items que NÃO serão resolvidos nesta sprint:

| Item | Prioridade | Sprint Sugerida |
|:-----|:-----------|:---------------|
| Stubs TODO restantes (RAG, embeddings, assets panel) | P3 | Sprint 28 |
| Personalization Advance (Audience Deep-Scan, Propensity) | P2 | Sprint 29 (PRD draft existe) |
| Media Mix Modeling (MMM) | P3 | Sprint 30+ |
| Ads Lookalike Sync (Meta Ads API) | P3 | Sprint 29/30 |
| Real-time attribution streaming | P3 | Sprint 31+ |
| Testes env-dependent (≤ 2 restantes) | P3 | Sprint 28 (com CI secrets) |

---

## 10. Artefatos de Referência

| Artefato | Caminho |
|:---------|:--------|
| QA Report Sprint 26 | `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/qa-report.md` |
| Arch Review Sprint 26 | `_netecmt/solutioning/architecture/arch-sprint-26-tech-debt-cleanup.md` |
| Story Pack Sprint 26 (backlog) | `_netecmt/packs/stories/sprint-26-tech-debt-cleanup/story-pack-index.md` |
| Sprint History | `_netecmt/sprints/SPRINT_HISTORY.md` |
| PRD Sprint 26 (predecessor) | `_netecmt/solutioning/prd/prd-sprint-26-tech-debt-cleanup.md` |
| PRD Sprint 29 (Personalization draft) | `_netecmt/prd-sprint-29-personalization.md` |
| Attribution Engine | `app/src/lib/intelligence/attribution/engine.ts` |
| Attribution Bridge | `app/src/lib/intelligence/attribution/bridge.ts` |
| Attribution Aggregator | `app/src/lib/intelligence/attribution/aggregator.ts` |
| Attribution Overlap | `app/src/lib/intelligence/attribution/overlap.ts` |
| Attribution Hook | `app/src/lib/hooks/use-attribution-data.ts` |
| Attribution Types | `app/src/types/attribution.ts` |
| Attribution UI Page | `app/src/app/intelligence/attribution/page.tsx` |
| Intelligence Config (stub) | `app/src/lib/intelligence/config.ts` |

---

*PRD formalizado por Iuran (PM) — NETECMT v2.0*  
*Sprint 27: Hybrid — Backlog Cleanup + Attribution Revival | 06/02/2026*  
*Tipo: Hybrid Sprint | North Star: ≤ 2 testes falhando + Attribution page funcional*
