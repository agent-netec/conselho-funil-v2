# Documento de Deliberação — Roadmap Sprint 28+
**Preparado por:** Leticia (SM)
**Data:** 06/02/2026
**Para:** Party Mode (Alto Conselho) — Decisão de próximo sprint
**Status:** Aguardando deliberação

---

## 1. Situação Atual do Produto

### Sprints Concluídas (Recentes)

| Sprint | Tema | QA Score | Resultado Principal |
|:-------|:-----|:---------|:-------------------|
| **S25** | Predictive & Creative Engine | 93/100 | CPS Scoring, Ad Generation, Multi-Input Intelligence |
| **S26** | Technical Debt Cleanup | 97/100 | 161→0 erros TS, build limpo, paths corrigidos |
| **S27** | Hybrid: Backlog Cleanup + Attribution Revival | 97/100 | 14→1 teste, Attribution ativada (4 módulos, 3 APIs, dashboard) |

### Health Metrics Atuais (pós-S27)

| Métrica | Valor | Status |
|:--------|:------|:-------|
| `tsc --noEmit` | 0 erros | Saudável |
| `npm run build` | 99 rotas, sucesso | Saudável |
| Test suites falhando | 1 (dead test) | Quase limpo |
| Tests passando | 164/170 | Bom |
| `@ts-ignore` / `@ts-expect-error` | 0 | Limpo |
| Stubs TODO restantes | 8 em 5 arquivos | Tech debt leve |

---

## 2. Roadmap Original (pré-S27) — Status

Este foi o roadmap apresentado pelo Iuran antes da Sprint 27. A Sprint 27 executou a **Opção E (Hybrid = A + C)**.

| Opção | Tema | Status Atual |
|:------|:-----|:-------------|
| **A** | Stabilization Part 2 — 14 testes, Jest config, contract-map, stubs, ts-ignore | **FEITA na S27** (Frente 1). 14→1 teste, Jest OK, contract-map fix, @ts-ignore 5→0 |
| **B** | Personalization Sprint — Deep-Scan, Propensity Engine, Dynamic Content Rules | **NÃO FEITA.** PRD draft existe em `_netecmt/prd-sprint-29-personalization.md` |
| **C** | Attribution Revival — Ativar aggregator, bridge, overlap, dashboard | **FEITA na S27** (Frente 2). 4 módulos ativados, 3 rotas API, dashboard funcional |
| **D** | Library Wing MVP — Creative Vault, Funnel Blueprints, Copy DNA | **NÃO FEITA.** Nenhum PRD existe. Ala mais atrasada do produto |
| **E** | Hybrid — Backlog S26 + feature pequena | **EXECUTADA como Sprint 27** (A + C combinados). QA 97/100 |

**Resumo:** Restam **B (Personalization)** e **D (Library Wing)** como features não executadas do roadmap original.

---

## 3. Backlog Pendente (Consolidado)

### 3.1 Findings da QA Sprint 27 (F1-F6)

| ID | Finding | Prioridade | Esforço | Tipo |
|:---|:--------|:-----------|:--------|:-----|
| F1 | `process.test.ts` — dead test, importa rota `/api/ingest/process` que não existe mais. 6 tests falhando nele | P2 | XS | Cleanup |
| F2 | `contract-map.yaml` API route — `app/src/app/api/operations/personalization/**` refere-se a rota inexistente | P3 | XS | Cleanup |
| F3 | Sem script de seed data para attribution — page pode renderizar vazia | P2 | M | Infra |
| F4 | Attribution files (`use-attribution-data.ts`, `types/attribution.ts`, `budget-optimizer.ts`) fora de lanes no contract-map | P3 | XS | Governance |
| F5 | Schema mismatch: aggregator espera `PerformanceMetricDoc` mas Firestore usa `PerformanceMetric` — adapter layer necessário | P2 | M | Tech debt |
| F6 | Feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION` pode ser removida após estabilização | P3 | S | Cleanup |

### 3.2 Stubs TODO Restantes (8 stubs em 5 arquivos)

| Arquivo | Stub(s) | Tipo |
|:--------|:--------|:-----|
| `lib/ai/rag.ts` | `keywordMatchScore`, `generateLocalEmbedding`, `hashString` (3 stubs) | RAG/Embeddings |
| `lib/firebase/assets.ts` | Processamento de texto de assets | Assets |
| `lib/hooks/use-intelligence-assets.ts` | Hook de busca de assets | Assets |
| `components/intelligence/discovery/assets-panel.tsx` | Painel visual de assets | UI |
| `types/personalization.ts` | `LeadState` com campos stub | Personalization |

### 3.3 PRD Sprint 29 — Personalization (Draft existente)

**Arquivo:** `_netecmt/prd-sprint-29-personalization.md`
**Status:** Draft (28/01/2026)

**Escopo:**
- **Audience Deep-Scan (IA):** Gemini deduz persona (dores, desejos, objeções, sofisticação 1-5) + propensity (hot/warm/cold)
- **Propensity Engine:** Score 0-1 baseado em eventos, com bônus de recência
- **Dynamic Content Rules:** Variações de headline/VSL/oferta por persona
- **Ads Lookalike Sync (stub):** Exportar sinais de leads quentes para Meta

**Código já existente (parcial):**
- Engine: `lib/intelligence/personalization/engine.ts` (Maestro com 4 consumers)
- Prompt: `lib/ai/prompts/audience-scan.ts`
- API: `app/api/intelligence/audience/scan/route.ts`
- Propensity: `lib/intelligence/personalization/propensity.ts`
- UI: `app/intelligence/personalization/page.tsx`

**Riscos:** API externa (Gemini JSON), PII, multi-tenant, latência do scan

### 3.4 Library Wing MVP (Sem PRD)

**Status:** Conceito — ala mais atrasada do produto. Nenhum PRD formalizado.

**Conceito:**
- Creative Vault organizado (assets categorizados, searchable)
- Funnel Blueprints (templates de funil reutilizáveis)
- Copy DNA (biblioteca de copies de alta performance com scoring)

**Código existente:** Vault explorer básico existe (`components/vault/vault-explorer.tsx`), mas sem categorização inteligente.

---

## 4. Opções para Sprint 28

### Opção A: Cleanup Sprint — Findings + Stubs
> Fechar 100% do tech debt pendente. Codebase completamente limpo.

| Item | Esforço |
|:-----|:--------|
| F1: Remover dead test `process.test.ts` | XS |
| F2: Fix contract-map API route | XS |
| F3: Seed data attribution | M |
| F4: Lane attribution no contract-map | XS |
| F5: Adapter layer aggregator (schema mismatch) | M |
| F6: Remover feature flag attribution | S |
| Stubs RAG: `keywordMatchScore`, `generateLocalEmbedding`, `hashString` | M |
| Stub assets: `firebase/assets.ts`, `use-intelligence-assets`, `assets-panel` | M |
| Stub personalization: expandir `LeadState` | S |

**Total:** ~6-10h | **Risco:** Baixo | **Valor:** Codebase 100% limpo, 0 stubs, 0 findings, 170/170 tests passing

**Prós:**
- Baseline perfeita para qualquer feature sprint seguinte
- 0 tech debt acumulado
- Aggregator totalmente funcional com adapter

**Contras:**
- Zero valor funcional novo para o usuário
- Sprint "invisível" para stakeholders

---

### Opção B: Feature Sprint — Personalization Advance
> Pular direto para a feature de maior valor estratégico. PRD draft existe.

| Item | Esforço |
|:-----|:--------|
| Audience Deep-Scan (IA via Gemini) | L |
| Propensity Engine (hot/warm/cold scoring) | M |
| UI Personalization (`/intelligence/personalization`) hardening | L |
| Dynamic Content Rules (criar/salvar regras por persona) | M |
| Ads Lookalike Sync (stub Meta adapter) | S |

**Total:** ~12-18h | **Risco:** Médio (API externa, PII, multi-tenant) | **Valor:** Personalização acionável

**Prós:**
- Feature de alto impacto — diferenciação de produto
- PRD draft já existe (economia de tempo)
- Código parcial já implementado (engine, prompt, propensity, UI)

**Contras:**
- Tech debt dos findings S27 continua acumulando
- Risco de construir sobre stubs não resolvidos
- Estimativa alta (2-3 dias)

---

### Opção C: Feature Sprint — Library Wing MVP
> A ala mais atrasada do produto. Organizar a base de assets.

| Item | Esforço |
|:-----|:--------|
| PRD necessário (Iuran) | Pré-requisito |
| Creative Vault com categorização inteligente | L |
| Funnel Blueprints (templates) | L |
| Copy DNA (biblioteca de copies) | M |

**Total:** ~15-20h | **Risco:** Médio-Alto (sem PRD, escopo nebuloso) | **Valor:** Biblioteca organizada

**Prós:**
- Ala mais atrasada — preenche gap do produto
- Complementa Intelligence Wing (assets como input)

**Contras:**
- NÃO tem PRD — precisa passar por Iuran + Athos primeiro
- Escopo nebuloso — risco de scope creep
- Estimativa alta sem PRD para validar

---

### Opção D: Hybrid — Findings Críticos + Personalization
> Resolver os P2 da S27 (30%) e já iniciar Personalization (70%).

| Fase | Items | Esforço |
|:-----|:------|:--------|
| Cleanup (30%) | F1 (dead test), F5 (adapter layer), F3 (seed data) | 3-4h |
| Feature (70%) | Deep-Scan, Propensity, UI, Rules (PRD S29) | 12-18h |

**Total:** ~15-22h | **Risco:** Médio | **Valor:** Fecha debt crítico + entrega feature

**Prós:**
- Melhor dos dois mundos — resolve urgentes E entrega valor
- Padrão que funcionou na S27 (Hybrid)

**Contras:**
- Sprint longa (2-3 dias)
- Stubs menores (RAG, assets) continuam pendentes

---

### Opção E: Hybrid Leve — Findings Críticos + RAG Activation
> Mesma lógica de "revival" da S27: resolver findings + ativar stubs RAG existentes.

| Item | Esforço |
|:-----|:--------|
| F1: Dead test — remover | XS |
| F5: Adapter layer aggregator | M |
| F3: Seed data attribution | M |
| F2+F4: Contract-map fixes | XS |
| F6: Feature flag removal | S |
| RAG stubs: `keywordMatchScore`, `generateLocalEmbedding`, `hashString` | M |

**Total:** ~5-8h | **Risco:** Baixo | **Valor:** Fecha S27 + ativa RAG (keyword matching e embeddings locais)

**Prós:**
- Sprint curta e focada
- Ativa RAG — melhora qualidade do chat e retrieval
- Padrão "revival" comprovado

**Contras:**
- Stubs de assets e personalization types ficam pendentes
- Sem feature nova visível

---

## 5. Matriz de Decisão

| Critério | A (Cleanup) | B (Personalization) | C (Library Wing) | D (Hybrid Full) | E (Hybrid Leve) |
|:---------|:----------:|:-------------------:|:-----------------:|:----------------:|:----------------:|
| Esforço | 6-10h | 12-18h | 15-20h | 15-22h | 5-8h |
| Risco | Baixo | Médio | Alto | Médio | Baixo |
| Valor funcional | Nenhum | Alto | Alto | Alto | Baixo-Médio |
| Tech debt resolvido | 100% | 0% | 0% | ~50% | ~70% |
| PRD existe | N/A | Draft | NÃO | Draft (parcial) | N/A |
| Código existente | N/A | ~60% | ~10% | ~60% | ~30% |
| Tempo | ~1 dia | ~2-3 dias | ~3 dias | ~2-3 dias | ~1 dia |

---

## 6. Contexto para Deliberação

### Perguntas para o Conselho:

1. **Prioridade: valor funcional vs. saúde técnica?** O codebase está 97% limpo. Vale fechar os 3% restantes ou é hora de entregar feature?

2. **Personalization (B) vs. Library Wing (D)?** Personalization tem PRD draft + código parcial. Library Wing não tem PRD mas é a ala mais atrasada.

3. **Hybrid funcionou na S27 — repetir?** Sprint 27 (Hybrid E) entregou backlog + feature com QA 97/100. O padrão híbrido provou-se eficaz.

4. **RAG stubs valem a ativação?** Os 3 stubs de RAG (`keywordMatchScore`, `generateLocalEmbedding`, `hashString`) melhorariam a qualidade do chat/retrieval se implementados. É um "revival" pequeno com ROI.

5. **Risk appetite?** Personalization envolve API externa (Gemini JSON), PII, multi-tenant. Library Wing tem escopo nebuloso. Cleanup tem risco zero.

### Recomendação da SM (Leticia):

> Baseada no padrão que funcionou na Sprint 27, minha recomendação pessoal é **Opção D (Hybrid Full)** ou **Opção E (Hybrid Leve)**, dependendo do apetite de esforço do time. O padrão híbrido permite manter a disciplina de "zero debt" enquanto avança features. Se o Conselho preferir velocidade, **Opção B (Personalization)** é a que mais entrega valor funcional com menor risco de escopo (PRD draft existe).

---

*Documento preparado por Leticia (SM) — NETECMT v2.0*
*Para deliberação em Party Mode — 06/02/2026*
