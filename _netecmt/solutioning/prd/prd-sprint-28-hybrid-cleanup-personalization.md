# 🔄 PRD: Hybrid Sprint — Cleanup & Foundations + Personalization Advance — Sprint 28

**Versao:** 1.0  
**Responsavel:** Iuran (PM)  
**Status:** 📋 Pronto para Arch Review (Athos)  
**Data:** 06/02/2026  
**Tipo:** Hybrid (Cleanup Gates + Feature Advance)  
**Predecessora:** Sprint 27 (Hybrid: Backlog Cleanup + Attribution Revival) — ✅ CONCLUIDA (QA 97/100)  
**Deliberacao:** Opcao D (Hybrid Full) aprovada pelo Alto Conselho em `/ps` — ver `roadmap-sprint-28-deliberation.md`

---

## 1. Contexto e Motivacao

### O que aconteceu

A Sprint 27 (Hybrid: Backlog Cleanup + Attribution Revival) foi concluida com sucesso: 14→1 teste falhando, Attribution ativada com 4 modulos, 3 rotas API e dashboard funcional. QA score 97/100. Porem, a QA identificou **6 findings** (F1-F6), dos quais 2 sao **blocking gates** para evolucao de features, e o modulo de **Personalization** permanece como a proxima feature estrategica do roadmap com PRD draft existente e ~60% do codigo ja implementado.

### Por que agora

**Frente 1 — Cleanup & Foundations (30%):**
- F1: `process.test.ts` e um dead test que importa rota `/api/ingest/process` inexistente — 6 testes falhando nele (P1)
- F2: `contract-map.yaml` referencia `app/api/operations/personalization/**` — rota que **nao existe**. Isso e um **blocking gate** para validacao de lanes da Fase 2 (P1 gate)
- F5: Schema mismatch no aggregator: espera `PerformanceMetricDoc` mas Firestore retorna `PerformanceMetric` — **blocking gate** para integridade da camada de dados (P1 gate)
- F4: Arquivos de attribution (`use-attribution-data.ts`, `types/attribution.ts`, `budget-optimizer.ts`) nao registrados em lanes no `contract-map.yaml` (P2)
- F6: Feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION` pode ser removida apos estabilizacao confirmada na S27 (P3)
- RAG stubs: `keywordMatchScore`, `generateLocalEmbedding`, `hashString` em `lib/ai/rag.ts` sao stubs retornando 0 — implementar melhora qualidade do chat/retrieval (P2)

**Frente 2 — Personalization Advance (70%):**
- Modulo de Personalization e a **proxima feature estrategica** do roadmap (Opcao B original)
- PRD draft ja existe (`_netecmt/prd-sprint-29-personalization.md`) com escopo validado
- ~60% do codigo ja implementado: engine (Maestro), prompt, propensity, API, UI
- Diferenciacao de produto: personalização dinamica baseada em inteligencia psicografica
- Connects Intelligence Wing com monetizacao real

### Decisao do Alto Conselho

O Conselho deliberou em Party Mode e aprovou a **Opcao D (Hybrid Full)**, seguindo o padrao que funcionou na Sprint 27:

> *"Resolver findings criticos que sao blocking gates para governanca e integridade de dados, e entao avancar com Personalization — a feature de maior valor estrategico com PRD draft e codigo parcial existentes."*

### Padrao Hibrido Comprovado (S27 → S28)

| Sprint | Modelo | Cleanup | Feature | QA Score |
|:-------|:-------|:--------|:--------|:---------|
| **S27** | Hybrid (A + C) | 14→1 teste, Jest, contract-map, @ts-ignore | Attribution Revival (4 modulos) | 97/100 |
| **S28** | Hybrid (Cleanup + B) | F1/F2/F4/F5/F6 + RAG stubs | Personalization Advance | Meta: >= 95/100 |

---

## 2. Objetivo da Sprint

> **"Fechar os blocking gates herdados da Sprint 27, implementar fundacoes de RAG, e entregar a primeira versao funcional do motor de Personalizacao com Audience Deep-Scan, Propensity Engine e Dynamic Content Rules."**

### North Star Metrics

| Metrica | Antes | Meta |
|:--------|:------|:-----|
| Testes falhando | 1 (dead test) | **0** |
| Blocking gates (F2, F5) | 2 abertos | **0 — resolvidos antes da Fase 2** |
| Personalization scan funcional | Nao | **Sim — scan executa e retorna persona + propensity** |

### Metricas Secundarias

| Metrica | Antes | Meta |
|:--------|:------|:-----|
| `contract-map.yaml` rotas invalidas | 1 (operations/personalization) | 0 |
| RAG stubs retornando 0 | 3 (`keywordMatchScore`, `generateLocalEmbedding`, `hashString`) | 0 (implementados) |
| Feature flags obsoletas | 1 (`NEXT_PUBLIC_ENABLE_ATTRIBUTION`) | 0 |
| Attribution files em lanes | Nao mapeados | Mapeados no contract-map |
| Personalization UI funcional | Parcial (page existe, sem dados) | Dashboard com scan results + rules |
| Propensity segmentacao | Nao ativa | hot/warm/cold funcional |

---

## 3. Escopo

### 3.1 FASE 1 — Cleanup & Foundations (~5-6h)

> **REGRA ABSOLUTA:** F2 e F5 sao **BLOCKING GATES**. A Fase 2 nao pode iniciar sem eles resolvidos e validados.

#### Epic 1: Blocking Gates Resolution [P1 — GATE]

| ID | Item | Descricao | Esforco | Gate? |
|:---|:-----|:----------|:--------|:------|
| S28-CL-01 | **Remover dead test `process.test.ts`** | Arquivo importa rota `/api/ingest/process` que foi removida. 6 testes falhando. Acao: deletar o arquivo de teste (rota nao retornara). Resultado: 0 testes falhando | XS | Nao |
| S28-CL-02 | **Fix contract-map route personalization** | Lane `personalization_engine` aponta para `app/src/app/api/operations/personalization/**` — rota INEXISTENTE. Corrigir para `app/src/app/api/intelligence/audience/**` (rota real do scan). Validar que path bate com API existente | XS | **SIM — GATE** |
| S28-CL-03 | **Adapter layer aggregator (schema mismatch)** | `CrossChannelAggregator` espera `PerformanceMetricDoc` mas Firestore retorna `PerformanceMetric`. Criar adapter/mapper entre os dois schemas para garantir integridade. Impacta: `lib/intelligence/attribution/aggregator.ts`, `lib/performance/engine/anomaly-engine.ts` | M | **SIM — GATE** |

#### Epic 2: Governance & Hygiene [P2-P3]

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| S28-CL-04 | **Lane attribution no contract-map** | Registrar `use-attribution-data.ts`, `types/attribution.ts` e `budget-optimizer.ts` nas lanes corretas do `contract-map.yaml`. Criar lane `attribution` ou expandir `intelligence_wing` | XS |
| S28-CL-05 | **Remover feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION`** | Flag ja nao e necessaria — attribution estabilizada na S27. Remover: (1) verificacoes na page, (2) verificacoes nas 3 rotas API, (3) variavel do `.env.example`, (4) referencia em `config.ts`. Manter attribution always-on | S |
| S28-CL-06 | **Implementar RAG stubs** | Implementar as 3 funcoes stub em `lib/ai/rag.ts`: (1) `keywordMatchScore` — calcular similaridade keyword real com TF-IDF ou Jaccard, (2) `generateLocalEmbedding` — gerar embedding local via text-embedding-004 ou fallback hash-based, (3) `hashString` — hash deterministico para deduplicacao. Melhora qualidade do chat/retrieval | M |

**Criterio de Gate Check (antes de iniciar Fase 2):**
- [ ] S28-CL-02 concluido — `contract-map.yaml` personalization aponta para rotas reais
- [ ] S28-CL-03 concluido — adapter layer criado, schema mismatch resolvido
- [ ] `npx tsc --noEmit` = 0 erros
- [ ] `npm run build` sucesso

---

### 3.2 FASE 2 — Personalization Advance (~10-14h)

> **Pre-requisito:** Gate Check da Fase 1 aprovado. F2 e F5 resolvidos.

#### Epic 3: Audience Deep-Scan via Gemini [P0]

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| S28-PS-01 | **Hardening da API Audience Scan** | Fortalecer `POST /api/intelligence/audience/scan`: (1) Validacao robusta de input (brandId obrigatorio, leadLimit com defaults), (2) Gemini JSON mode (`responseMimeType: application/json`), (3) Schema validation do response via Zod, (4) Retry logic com backoff para falhas Gemini, (5) Error handling com mensagens seguras (sem PII leak) | L |
| S28-PS-02 | **Testes de contrato Gemini response** | Criar testes que validam: (1) Schema do JSON retornado pelo Gemini (persona, propensity, confidence), (2) Tipos corretos nos campos (sophisticationLevel 1-5, score 0-1), (3) Fallback quando Gemini retorna JSON invalido, (4) PII sanitization no prompt (nenhum email/nome/IP) — **OBRIGATORIO per Ressalva R2 do Conselho** | M |

#### Epic 4: Propensity Engine Hardening [P1]

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| S28-PS-03 | **Propensity Engine hot/warm/cold** | Fortalecer `lib/intelligence/personalization/propensity.ts`: (1) Score normalizado 0-1 com pesos por tipo de evento, (2) Bonus de recencia (eventos < 24h), (3) Penalidade de inatividade (> 7 dias), (4) Segmentacao: hot >= 0.7, warm >= 0.3, cold < 0.3, (5) Persistencia do segment no lead state, (6) Testes unitarios cobrindo edge cases (0 eventos, eventos antigos, mix) | M |

#### Epic 5: UI Personalization Hardening [P1]

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| S28-PS-04 | **Dashboard de Personalization** | Fortalecer `/intelligence/personalization` (page.tsx): (1) Listar scans recentes (ate 10) com card resumo, (2) Detalhe do scan: persona (demographics, painPoints, desires, objections, sophisticationLevel), (3) Propensity visual: badge hot/warm/cold com score, (4) Empty state + loading state + error state com feedback, (5) Acao de trigger novo scan | L |
| S28-PS-05 | **Componentes de Scan** | Criar/fortalecer componentes: (1) `AudienceScanCard` — card de resumo do scan, (2) `PersonaDetailView` — detalhe completo da persona, (3) `PropensityBadge` — visual hot/warm/cold, (4) Integracao com hook `useIntelligence` ou hook dedicado | M |

#### Epic 6: Dynamic Content Rules [P2 — Stretch]

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| S28-PS-06 | **CRUD de Content Rules** | Implementar: (1) Criar regra por persona/scan: headline (obrigatorio), vslId (opcional), offerId (opcional), (2) Ativar/desativar regra, (3) Persistencia em `brands/{brandId}/personalization_rules` no Firestore, (4) UI de edicao inline na page de Personalization — **STRETCH: so se Epics 3-5 concluidos dentro do budget de horas** | M |

---

### 3.3 Out-of-Scope (DELIBERADAMENTE ADIADO — Sprint 29+)

| Item | Justificativa | Sprint Sugerida |
|:-----|:-------------|:---------------|
| F3: Seed data attribution | Conselho decidiu adiar — attribution ja funcional sem seed | S29 |
| Stubs assets: `firebase/assets.ts`, `use-intelligence-assets.ts`, `assets-panel.tsx` | Stubs nao bloqueiam nenhuma feature ativa | S29 |
| Ads Lookalike Sync (stub Meta adapter) | Requer integracao real com Meta Ads API — escopo de sprint dedicada | S29/30 |
| Library Wing MVP (Creative Vault, Funnel Blueprints, Copy DNA) | Sem PRD formalizado. Ala mais atrasada aguarda PRD futuro (Iuran) | S30+ |
| Aplicar rules em runtime (renderizacao condicional em LP/funnel) | Escopo futuro — S28 foca em criar/salvar regras, nao em aplica-las | S30+ |
| Integracao completa Meta/Google/TikTok audiences | Requer keys de producao e adapter completo | S30+ |
| Media Mix Modeling (MMM) avancado | Feature avancada de attribution — nao MVP | S31+ |
| `LeadState` expansao completa (types/personalization.ts) | Sera naturalmente expandido conforme Personalization evolui | S29 |

---

## 4. Abordagem Tecnica

### 4.1 Fase 1: Cleanup & Foundations — Estrategia

**Sequencia:** S28-CL-01 (dead test) → S28-CL-02 (contract-map GATE) → S28-CL-03 (adapter GATE) → **GATE CHECK** → S28-CL-04 (lanes) → S28-CL-05 (feature flag) → S28-CL-06 (RAG stubs)

**Racional:**
1. Remover dead test primeiro — elimina o unico teste falhando (0 testes falhando)
2. Fix contract-map antes do adapter — garante que lanes apontem para caminhos reais antes de qualquer nova feature
3. Adapter layer resolve o schema mismatch — fundacao de dados integra
4. **GATE CHECK**: validar tsc + build antes de prosseguir
5. Lanes, feature flag e RAG sao independentes — podem ser feitos em qualquer ordem pos-gate

### 4.2 Fase 2: Personalization Advance — Estrategia

**Sequencia:** S28-PS-01 (API scan) → S28-PS-02 (testes contrato) → S28-PS-03 (propensity) → S28-PS-04 (UI) → S28-PS-05 (componentes) → S28-PS-06 (rules — stretch)

**Racional:**
1. API scan primeiro — e o nucleo do motor de personalizacao (P0)
2. Testes de contrato imediatamente apos — valida que a resposta do Gemini esta correta (Ressalva R2 do Conselho)
3. Propensity hardening — complementa o scan com scoring comportamental
4. UI hardening — torna visivel tudo que foi construido nos steps anteriores
5. Componentes — refinam a UI com cards e badges reutilizaveis
6. Dynamic Content Rules (stretch) — so se o budget permitir

### 4.3 Codigo Existente — Mapa de Ativacao

```
┌──────────────────────────────────────────────────────────────────────────┐
│              PERSONALIZATION MODULE — ESTADO ATUAL                        │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌── ENGINE (Maestro) ──────────────────────────────────────────────┐   │
│  │  engine.ts ── Orchestrador com 4 consumers (Maestro)              │   │
│  │    Status: ✅ Ativo, precisa hardening multi-tenant                │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌── AI LAYER ──────────────────────────────────────────────────────┐   │
│  │  prompts/audience-scan.ts ── Prompt de Deep-Scan                  │   │
│  │    Status: ✅ Existe, precisa hardening JSON mode + PII            │   │
│  │  gemini.ts ── Client Gemini                                        │   │
│  │    Status: ✅ Funcional                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌── API LAYER ─────────────────────────────────────────────────────┐   │
│  │  /api/intelligence/audience/scan ── POST endpoint                  │   │
│  │    Status: ✅ Existe, precisa validacao + retry + Zod              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌── PROPENSITY ────────────────────────────────────────────────────┐   │
│  │  personalization/propensity.ts ── Score engine                     │   │
│  │    Status: 🟡 Existe, precisa hardening (pesos, recencia, testes) │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌── UI LAYER ──────────────────────────────────────────────────────┐   │
│  │  /intelligence/personalization/page.tsx ── Dashboard               │   │
│  │    Status: 🟡 Existe, precisa data binding + states + componentes │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌── PERSISTENCIA ──────────────────────────────────────────────────┐   │
│  │  brands/{brandId}/audience_scans ── Firestore                     │   │
│  │  brands/{brandId}/personalization_rules ── Firestore              │   │
│  │    Status: 🟡 Schema definido no PRD draft, implementar CRUD      │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ⚡ ATIVACAO = Hardening API + Testes contrato + Propensity +           │
│                UI binding + Dynamic Rules (stretch)                      │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 4.4 Padroes de Correcao/Implementacao

| Tipo | Exemplo | Permitido |
|:-----|:--------|:----------|
| Deletar dead test | `process.test.ts` (rota inexistente) | ✅ |
| Corrigir contract-map path | `operations/` → `intelligence/audience/` | ✅ |
| Criar adapter/mapper de schema | `PerformanceMetricDoc` ↔ `PerformanceMetric` | ✅ |
| Adicionar lanes no contract-map | Attribution files nas lanes corretas | ✅ |
| Remover feature flag obsoleta | `NEXT_PUBLIC_ENABLE_ATTRIBUTION` | ✅ |
| Implementar stubs RAG | `keywordMatchScore`, `generateLocalEmbedding`, `hashString` | ✅ |
| Fortalecer API existente | Validacao, retry, Zod schema | ✅ |
| Criar testes de contrato | Gemini response schema validation | ✅ |
| Hardening de propensity | Pesos, recencia, segmentacao | ✅ |
| Fortalecer UI existente | Data binding, states, componentes | ✅ |
| Criar CRUD de rules | Firestore persistence | ✅ |
| Alterar logica de Attribution | engine.ts, bridge.ts, aggregator.ts, overlap.ts | ❌ PROIBIDO |
| Alterar interfaces Sprint 25 | prediction.ts, creative-ads.ts, text-analysis.ts | ❌ PROIBIDO |
| Integrar Meta Ads API real | Lookalike Sync | ❌ FORA DO ESCOPO |
| Usar `any` em novos tipos | — | ❌ PROIBIDO (usar `unknown`) |
| Usar `firebase-admin` | — | ❌ PROIBIDO (Client SDK only) |

---

## 5. Ressalvas do Alto Conselho

O Conselho aprovou a Opcao D com **3 ressalvas obrigatorias**:

| # | Ressalva | Impacto | Validacao |
|:--|:---------|:--------|:----------|
| **R1** | **F2 e F5 sao BLOCKING GATES** — Fase 2 (Personalization) NAO pode iniciar sem F2 (contract-map fix) e F5 (adapter layer) resolvidos e validados | Sequenciamento obrigatorio | Gate Check: `tsc` + `build` limpos + diff review de CL-02 e CL-03 |
| **R2** | **Testes de contrato Gemini response obrigatorios** — Toda chamada ao Gemini JSON mode deve ter teste que valida schema do response (persona, propensity, confidence) e fallback para JSON invalido | Qualidade e confiabilidade | S28-PS-02 obrigatoriamente concluido antes de S28-PS-04 (UI) |
| **R3** | **PRD precisa de Arch Review (Athos) antes de virar stories** — Este PRD deve ser revisado e aprovado pelo Arquiteto antes que a SM (Leticia) transforme em Story Pack | Governanca | Status deste PRD muda para "Aprovado" somente apos review do Athos |

---

## 6. Proibicoes (Allowed Context Constraints)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| P1 | **NUNCA alterar logica de negocio** dos modulos Attribution ativados na S27 (`engine.ts`, `bridge.ts`, `aggregator.ts`, `overlap.ts`) | Codigo testado e produtivo — respeitar estabilidade da S27 |
| P2 | **NUNCA remover exports existentes** de `types/attribution.ts`, `types/intelligence.ts`, `types/performance.ts` | Interfaces contratuais — podem ser estendidas, nunca reduzidas |
| P3 | **NUNCA alterar interfaces Sprint 25** (`prediction.ts`, `creative-ads.ts`, `text-analysis.ts`) | Intocaveis — producao estavel |
| P4 | **NUNCA usar `firebase-admin`** ou `google-cloud/*` | Restricao de ambiente (Windows 11 24H2) — Client SDK only |
| P5 | **NUNCA incluir PII em prompts** do Gemini (Deep-Scan) | Email, nome, IP, telefone NUNCA devem ir para o prompt de IA |
| P6 | **NUNCA usar `any`** em novos tipos ou correcoes | `unknown` com type guards quando necessario |
| P7 | **NUNCA hardcodar `brandId`** em novos modulos | Multi-tenant first — brandId vem do contexto de auth/request |
| P8 | **NUNCA iniciar Fase 2 sem Gate Check aprovado** | Ressalva R1 do Conselho |
| P9 | **NUNCA alterar formato do `contract-map.yaml`** — apenas corrigir paths e adicionar lanes | Mudanca cirurgica, sem refatoracao do YAML |
| P10 | **NUNCA remover stubs que nao sao do escopo** | Stubs de assets, personalization types expandidos — permanecem para S29 |

---

## 7. Riscos e Mitigacoes

| # | Risco | Prob. | Impacto | Mitigacao |
|:--|:------|:------|:--------|:----------|
| R1 | Gemini retorna JSON invalido no Deep-Scan | Media | Alto | Parser robusto com Zod + retry com backoff + fallback response com campos default |
| R2 | PII vaza para o prompt de IA | Baixa | Critico | Sanitizacao forte no prompt builder (`audience-scan.ts`) + teste de contrato validando ausencia de PII (S28-PS-02) |
| R3 | Schema adapter (F5) introduz regressao no aggregator | Baixa | Alto | Adapter como camada intermediaria (nao altera interface existente) + testes de tipo |
| R4 | Latencia do scan Gemini > 30s | Media | Medio | Limitar `leadLimit` default para 50 + amostragem de eventos (max 10 por lead) + timeout configuravel |
| R5 | Multi-tenant inconsistencia (brandId fallback) | Media | Alto | Remover fallbacks de brandId hardcoded + validar brandId na entrada de toda API |
| R6 | Dynamic Content Rules (stretch) nao cabe no budget | Media | Baixo | Marcado como P2 stretch — Sprint funcional sem ele. Adiavel para S29 sem impacto |
| R7 | RAG stubs implementacao diverge da expectativa dos testes existentes | Baixa | Medio | Ajustar testes de RAG (`rag.test.ts`) para validar implementacao real (nao mais stubs) |
| R8 | Custo de Gemini API com scans frequentes | Media | Medio | Rate limiting por marca + cache de scans recentes (TTL 1h) + quotas |

---

## 8. Criterios de Sucesso

### Definition of Done (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| CS-01 | `npm test` — **0 testes falhando** | Dandara executa test suite completa | QA |
| CS-02 | `npx tsc --noEmit` = **0 erros** | Build limpo mantido | QA |
| CS-03 | `npm run build` (Next.js) sucesso | 99+ rotas compiladas sem erro | QA |
| CS-04 | `contract-map.yaml` `personalization_engine` aponta para rotas reais | Diff visual — `operations/personalization` substituido | QA |
| CS-05 | Adapter layer aggregator funcional | Schema `PerformanceMetricDoc` ↔ `PerformanceMetric` mapeado | QA |
| CS-06 | Attribution files registrados em lanes | `contract-map.yaml` inclui attribution paths | QA |
| CS-07 | Feature flag `NEXT_PUBLIC_ENABLE_ATTRIBUTION` removida | `grep` retorna 0 ocorrencias no codebase | QA |
| CS-08 | RAG stubs implementados | `keywordMatchScore`, `generateLocalEmbedding`, `hashString` retornam valores reais (nao 0) | QA |
| CS-09 | Deep-Scan executa e retorna persona + propensity | `POST /api/intelligence/audience/scan` retorna JSON valido com persona e score | QA |
| CS-10 | Testes de contrato Gemini existem e passam | Test suite valida schema, fallback e PII sanitization | QA |
| CS-11 | Propensity segmenta hot/warm/cold corretamente | Testes unitarios com edge cases passando | QA |
| CS-12 | UI Personalization renderiza com dados | `/intelligence/personalization` mostra scan results, persona detail, propensity badge | QA |
| CS-13 | Zero regressao funcional | Rotas P0 acessiveis, attribution dashboard intacto | QA |

### Acceptance Criteria (por Epic)

**Epic 1 (Blocking Gates):**
- 0 testes falhando (dead test removido)
- contract-map aponta para rotas reais (GATE)
- Adapter layer resolve schema mismatch (GATE)

**Epic 2 (Governance & Hygiene):**
- Attribution files em lanes no contract-map
- Feature flag removida
- RAG stubs implementados com valores reais

**Epic 3 (Audience Deep-Scan):**
- API scan funcional com Gemini JSON mode
- Testes de contrato passando (schema + PII + fallback)

**Epic 4 (Propensity Engine):**
- Segmentacao hot/warm/cold funcional
- Testes unitarios com edge cases

**Epic 5 (UI Personalization):**
- Dashboard renderiza scan results
- Empty state, loading state, error state implementados

**Epic 6 (Dynamic Content Rules — Stretch):**
- CRUD de rules funcional (se budget permitir)
- Persistencia em Firestore

---

## 9. Cronograma e Dependencias

### Estimativa

| Fase | Stories | Estimativa | Responsavel |
|:-----|:--------|:----------|:-----------|
| **FASE 1** | | | |
| Epic 1: Blocking Gates | S28-CL-01 a CL-03 | 2-3h | Darllyson (Dev) |
| Epic 2: Governance & Hygiene | S28-CL-04 a CL-06 | 2-3h | Darllyson (Dev) |
| **— GATE CHECK —** | | 15min | Dandara (QA) |
| **FASE 2** | | | |
| Epic 3: Audience Deep-Scan | S28-PS-01 a PS-02 | 4-5h | Darllyson (Dev) |
| Epic 4: Propensity Engine | S28-PS-03 | 2-3h | Darllyson (Dev) |
| Epic 5: UI Personalization | S28-PS-04 a PS-05 | 3-4h | Darllyson (Dev) |
| Epic 6: Dynamic Content Rules | S28-PS-06 | 2-3h (stretch) | Darllyson (Dev) |
| **QA Final** | — | 1-2h | Dandara (QA) |
| **Total** | **12 stories** | **~15-21h** | — |
| **Total sem stretch** | **11 stories** | **~13-18h** | — |

### Ordem de Execucao Recomendada

```
[FASE 1 — Cleanup & Foundations]
  S28-CL-01 (dead test, XS) → S28-CL-02 (contract-map GATE, XS)
    → S28-CL-03 (adapter GATE, M)
  
  ── GATE CHECK ── (tsc + build + review de CL-02/CL-03) ──

  S28-CL-04 (lanes, XS) → S28-CL-05 (feature flag, S) → S28-CL-06 (RAG stubs, M)

[FASE 2 — Personalization Advance]
  S28-PS-01 (API scan, L) → S28-PS-02 (testes contrato, M)
    → S28-PS-03 (propensity, M) → S28-PS-04 (UI dashboard, L)
      → S28-PS-05 (componentes, M)
        → S28-PS-06 (dynamic rules, M — STRETCH)

[QA FINAL]
  Dandara valida CS-01 a CS-13
```

**Nota:** CL-04, CL-05 e CL-06 podem ser executados em paralelo apos o Gate Check, pois sao independentes entre si.

### Dependencias

| Dependencia | Status | Impacto |
|:-----------|:-------|:--------|
| Sprint 27 concluida | ✅ Confirmada (QA 97/100) | Pre-requisito cumprido |
| Build limpo (`tsc --noEmit` = 0) | ✅ Confirmado | Baseline mantida |
| PRD Draft Personalization | ✅ Existe (`prd-sprint-29-personalization.md`) | Escopo validado |
| Personalization Engine Spec | ✅ Existe (`contracts/personalization-engine-spec.md`) | Contrato tecnico validado |
| Gemini API Key configurada | ⚠️ Verificar em env | PS-01 depende de `GOOGLE_AI_API_KEY` |
| Firestore collections (`leads`, `audience_scans`, `personalization_rules`) | ⚠️ Verificar se existem | PS-01 e PS-06 dependem dessas colecoes |
| **Arch Review (Athos)** | ⏳ PENDENTE — Ressalva R3 | PRD nao vira stories sem aprovacao |
| Nenhum MCP/CLI novo | ✅ | Ferramentas existentes suficientes |

---

## 10. Artefatos de Referencia

| Artefato | Caminho |
|:---------|:--------|
| **Deliberacao do Conselho** | `_netecmt/solutioning/prd/roadmap-sprint-28-deliberation.md` |
| PRD Sprint 27 (predecessor) | `_netecmt/solutioning/prd/prd-sprint-27-hybrid-cleanup-attribution.md` |
| PRD Draft Personalization | `_netecmt/prd-sprint-29-personalization.md` |
| QA Report Sprint 27 (findings) | `_netecmt/packs/stories/sprint-27-hybrid-cleanup/qa-report.md` |
| Active Sprint (S27 resultado) | `_netecmt/sprints/ACTIVE_SPRINT.md` |
| Contract Map | `_netecmt/core/contract-map.yaml` |
| Personalization Engine Spec | `_netecmt/contracts/personalization-engine-spec.md` |
| Project Context | `_netecmt/project-context.md` |
| **Codigo — Engine (Maestro)** | `app/src/lib/intelligence/personalization/engine.ts` |
| **Codigo — Prompt** | `app/src/lib/ai/prompts/audience-scan.ts` |
| **Codigo — API Scan** | `app/src/app/api/intelligence/audience/scan/route.ts` |
| **Codigo — Propensity** | `app/src/lib/intelligence/personalization/propensity.ts` |
| **Codigo — UI Page** | `app/src/app/intelligence/personalization/page.tsx` |
| **Codigo — RAG (stubs)** | `app/src/lib/ai/rag.ts` |
| **Codigo — Aggregator (schema)** | `app/src/lib/intelligence/attribution/aggregator.ts` |
| **Codigo — Contract Map** | `_netecmt/core/contract-map.yaml` |

---

## 11. Glossario

| Termo | Definicao |
|:------|:----------|
| **Deep-Scan** | Analise via IA (Gemini) que deduz persona psicografica a partir de leads + eventos |
| **Propensity Engine** | Motor de scoring comportamental que segmenta leads em hot/warm/cold |
| **Dynamic Content Rules** | Regras que mapeiam persona → variacao de conteudo (headline, VSL, oferta) |
| **Blocking Gate** | Finding que DEVE ser resolvido antes de avancar para a proxima fase |
| **Gate Check** | Ponto de validacao formal entre Fase 1 e Fase 2 (`tsc` + `build` + review) |
| **Maestro** | Nome do Personalization Engine — orquestrador central de personalizacao |
| **Stretch** | Item incluido no escopo mas adiavel sem impacto se o budget nao permitir |

---

*PRD formalizado por Iuran (PM) — NETECMT v2.0*  
*Sprint 28: Hybrid — Cleanup & Foundations + Personalization Advance | 06/02/2026*  
*Tipo: Hybrid Sprint | North Star: 0 testes falhando + Blocking gates resolvidos + Personalization scan funcional*  
*Aprovacao pendente: Arch Review (Athos) — Ressalva R3 do Conselho*
