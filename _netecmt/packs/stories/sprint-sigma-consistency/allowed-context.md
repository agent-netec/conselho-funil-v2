# Allowed Context: Sprint Sigma — Sub-Sprint de Consistencia do Codebase
**Lanes:** security + types + api_consistency + architecture + core
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026

> Incorpora proibicoes do PRD (P1-P12) e Proibicoes Arquiteturais do Arch Review (PA-01 a PA-06).

---

## Contexto Global

### Leitura Obrigatoria (antes de qualquer story)
- `_netecmt/packs/stories/sprint-sigma-consistency/stories.md` — Stories, ACs e checklist
- `_netecmt/packs/stories/sprint-sigma-consistency/story-pack-index.md` — Ordem de execucao, DTs, gates
- `_netecmt/solutioning/architecture/arch-sprint-sigma.md` — Architecture Review completo (14 DTs, 4 Blocking)

### Referencia de Tipos (LEITURA para contexto)
- `app/src/types/database.ts` — Source of truth para Message, Conversation, Funnel
- `app/src/types/index.ts` — Re-exports e aliases (sera modificado na Fase 2)
- `app/src/types/autopsy.ts` — Source of truth para AutopsyReport
- `app/src/types/funnel.ts` — LegacyAutopsyReport + adapter (sera modificado na Fase 2)
- `app/src/types/social.ts` — SocialPlatform (sera modificado na Fase 2)
- `app/src/types/social-inbox.ts` — SocialPlatform (sera modificado na Fase 2)
- `app/src/types/vault.ts` — SocialPlatform PascalCase (sera modificado na Fase 2)
- `app/src/types/context.ts` — LEITURA
- `app/src/types/intelligence.ts` — LEITURA
- `app/src/types/personalization.ts` — LEITURA
- `app/src/types/performance.ts` — LEITURA
- `app/src/types/reporting.ts` — LEITURA
- `app/src/types/journey.ts` — LEITURA
- `app/src/types/offer.ts` — LEITURA

### Tipos INTOCAVEIS (Sprint 25 — producao estavel)
- `app/src/types/prediction.ts` — **PROIBIDO** (P3)
- `app/src/types/creative-ads.ts` — **PROIBIDO** (P3)
- `app/src/types/text-analysis.ts` — **PROIBIDO** (P3)

---

## Fase 1: Seguranca (P0-A) — Arquivos Permitidos

### SIG-PRE-SEC: Mapear callers frontend + adicionar brandId

| Arquivo | Acao | Notas |
|:--------|:-----|:------|
| Todos os componentes/hooks que chamam as 10 rotas brand-access | **MODIFICAR** — adicionar brandId no body | Mapear via `rg "api/social/generate"` etc |
| `app/src/lib/stores/brand-store.ts` | **LEITURA** — verificar como obter brandId | Usado pelos callers |

**Leitura (para mapeamento):**
- `app/src/app/api/social/generate/route.ts` — verificar body schema
- `app/src/app/api/social/hooks/route.ts`
- `app/src/app/api/social/structure/route.ts`
- `app/src/app/api/social/scorecard/route.ts`
- `app/src/app/api/design/plan/route.ts`
- `app/src/app/api/design/generate/route.ts`
- `app/src/app/api/design/upscale/route.ts`
- `app/src/app/api/performance/metrics/route.ts`
- `app/src/app/api/funnels/export/route.ts`
- `app/src/app/api/funnels/share/route.ts`

### SIG-PRE-CONV: Criar requireConversationAccess

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/auth/conversation-guard.ts` | **CRIAR** |

**Leitura (padrao a seguir):**
- `app/src/lib/auth/brand-guard.ts` (ou equivalente com `requireBrandAccess`) — padrao de referencia
- `app/src/app/api/chat/route.ts` — entender auth condicional atual
- `app/src/lib/hooks/use-conversations.ts` — entender modelo de conversa

### SIG-SEC-01: Auth nas rotas

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/social/generate/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/social/hooks/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/social/structure/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/social/scorecard/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/design/plan/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/design/generate/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/design/upscale/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/performance/metrics/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/funnels/export/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/funnels/share/route.ts` | **MODIFICAR** — adicionar requireBrandAccess |
| `app/src/app/api/chat/route.ts` | **MODIFICAR** — adicionar requireConversationAccess |
| `app/src/app/api/webhooks/dispatcher/route.ts` | **MODIFICAR** — apenas adicionar comentario de documentacao |

### SIG-SEC-02: force-dynamic

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/campaigns/[id]/generate-ads/route.ts` | **MODIFICAR** — verificar e adicionar force-dynamic |
| `app/src/app/api/funnels/share/route.ts` | **MODIFICAR** |
| `app/src/app/api/funnels/export/route.ts` | **MODIFICAR** |
| `app/src/app/api/decisions/route.ts` | **MODIFICAR** |
| `app/src/app/api/copy/decisions/route.ts` | **MODIFICAR** |
| `app/src/app/api/webhooks/dispatcher/route.ts` | **MODIFICAR** |
| `app/src/app/api/performance/metrics/route.ts` | **MODIFICAR** |

### SIG-SEC-03: Hydration guards

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/stores/brand-store.ts` | **MODIFICAR** — adicionar skipHydration |
| `app/src/lib/stores/context-store.ts` | **MODIFICAR** — adicionar skipHydration |
| `app/src/app/providers.tsx` (ou componente client root equivalente) | **MODIFICAR** — adicionar rehydrate() |

---

## Fase 2: Consistencia de Tipos (P0-B) — Arquivos Permitidos

### SIG-PRE-TYP: Criar adapters

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/social-platform.ts` | **CRIAR** — tipo canonico + normalizePlatform() |
| `app/src/lib/utils/awareness-adapter.ts` | **CRIAR** — tipos + normalizeAwareness() |
| Arquivo de testes para adapters | **CRIAR** — testes unitarios (RC-13) |

### SIG-TYP-05: SocialPlatform consolidacao

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/social.ts` | **MODIFICAR** — remover definicao local, re-export de social-platform.ts |
| `app/src/types/social-inbox.ts` | **MODIFICAR** — remover definicao local, re-export |
| `app/src/types/vault.ts` | **MODIFICAR** — remover PascalCase, re-export |
| `app/src/lib/agents/publisher/adaptation-pipeline.ts` | **MODIFICAR** — usar normalizePlatform() |
| `app/src/lib/agents/qa/brand-validation.ts` | **MODIFICAR** — usar normalizePlatform() |
| `app/src/lib/agents/publisher/curation-engine.ts` | **VERIFICAR/MODIFICAR** |

**Leitura:**
- `app/src/lib/intelligence/social/normalizer.ts` — ja usa lowercase, verificar
- `app/src/lib/intelligence/social/mocks.ts` — verificar

### SIG-TYP-06: Date→Timestamp

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/index.ts` | **MODIFICAR** — Date → Timestamp em campos de data |
| Consumers que usam `new Date()` com tipos de index.ts | **MODIFICAR** — adaptar |

### SIG-TYP-07: Awareness → Schwartz

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/database.ts` | **MODIFICAR** — alterar awareness type para Schwartz |
| Consumers que leem awareness do Firestore | **MODIFICAR** — envolver com normalizeAwareness() |

**Leitura:**
- `app/src/lib/ai/prompts/audience-scan.ts` — verificar uso de awareness
- `app/src/lib/intelligence/personalization/engine.ts` — verificar uso

### SIG-TYP-01: Message consolidacao

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/database.ts` | **VERIFICAR/AJUSTAR** — confirmar campos canonicos |
| `app/src/types/index.ts` | **MODIFICAR** — remover definicao local, re-export |

**Leitura:**
- `app/src/lib/stores/chat-store.ts` — verificar uso de Message
- `app/src/components/chat/chat-message.tsx` — verificar import

### SIG-TYP-02: Conversation consolidacao

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/database.ts` | **VERIFICAR/AJUSTAR** — confirmar campos canonicos |
| `app/src/types/index.ts` | **MODIFICAR** — re-export + LegacyConversation alias |
| `app/src/lib/stores/chat-store.ts` | **MODIFICAR** — usar LegacyConversation |

### SIG-TYP-03: Funnel consolidacao

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/database.ts` | **VERIFICAR/AJUSTAR** — status enum, tenantId, limpar channels legado |
| `app/src/types/funnel.ts` | **MODIFICAR** — re-export de database.ts |
| `app/src/types/index.ts` | **MODIFICAR** — re-export de database.ts |

**Leitura:**
- `app/src/components/funnel-autopsy/AutopsyReportView.tsx` — verificar Funnel usage

### SIG-TYP-04: AutopsyReport consolidacao

| Arquivo | Acao |
|:--------|:-----|
| `app/src/types/autopsy.ts` | **VERIFICAR** — source of truth |
| `app/src/types/funnel.ts` | **MODIFICAR** — rename para LegacyAutopsyReport, adapter, re-export |
| Consumers de AutopsyReport de funnel.ts | **MODIFICAR** — adaptar imports |

**Leitura:**
- `app/src/components/funnel-autopsy/AutopsyReportView.tsx`
- `app/src/lib/intelligence/autopsy/engine.ts`
- `app/src/lib/automation/` — testes que usam AutopsyReport

---

## Fase 3: API Consistency (P1) — Arquivos Permitidos

### SIG-API-01: Criar api-response.ts

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/utils/api-response.ts` | **CRIAR** |

### SIG-API-02: Migrar rotas para formato unificado

| Wing | Rotas | Acao |
|:-----|:------|:-----|
| Social | `social/generate`, `social/hooks`, `social/structure`, `social/scorecard` | **MODIFICAR** |
| Design | `design/plan`, `design/generate`, `design/upscale` | **MODIFICAR** |
| Intelligence | `intelligence/audience/scan`, `intelligence/autopsy/run`, `intelligence/spy`, `intelligence/creative/copy`, `intelligence/creative/ranking`, `intelligence/keywords`, `intelligence/offer/calculate-score`, `intelligence/offer/save` | **MODIFICAR** |
| Performance | `performance/metrics`, `performance/integrations/validate` | **MODIFICAR** |
| Funnels | `funnels/generate`, `funnels/export`, `funnels/share` | **MODIFICAR** |
| Chat | `chat` | **MODIFICAR** (DT-10 formato especial) |
| Outros | `copy/generate`, `campaigns/[id]/generate-ads`, `ingest/url`, `assets/metrics`, `intelligence/events/ingest`, `intelligence/journey/[leadId]`, `intelligence/ltv/cohorts`, `intelligence/predict` | **MODIFICAR** |

**TODOS os arquivos acima estao em:** `app/src/app/api/[wing]/[rota]/route.ts`

**Leitura (verificar callers frontend):**
- `app/src/lib/hooks/use-conversations.ts` — checa `errorData.error === 'insufficient_credits'`
- Outros hooks que consomem APIs — verificar tratamento de erro

### SIG-API-03: Credit tracking

| Arquivo | Acao |
|:--------|:-----|
| `app/src/app/api/design/plan/route.ts` | **MODIFICAR** |
| `app/src/app/api/design/upscale/route.ts` | **MODIFICAR** |
| `app/src/app/api/social/generate/route.ts` | **MODIFICAR** |
| `app/src/app/api/social/hooks/route.ts` | **MODIFICAR** |
| `app/src/app/api/social/structure/route.ts` | **MODIFICAR** |
| `app/src/app/api/social/scorecard/route.ts` | **MODIFICAR** |
| `app/src/app/api/intelligence/creative/copy/route.ts` | **MODIFICAR** |
| `app/src/app/api/intelligence/keywords/route.ts` | **MODIFICAR** |
| `app/src/app/api/funnels/generate/route.ts` | **MODIFICAR** |
| `app/src/app/api/campaigns/[id]/generate-ads/route.ts` | **MODIFICAR** |

**Leitura (padrao a seguir):**
- `app/src/app/api/copy/generate/route.ts` — padrao de credit tracking (1 credito)
- `app/src/app/api/ai/analyze-visual/route.ts` — padrao de credit tracking (2 creditos)
- `app/src/lib/ai/cost-guard.ts` — funcao de deducao

---

## Fase 4: Architecture (P1) — Arquivos Permitidos

### SIG-ARC-01: Pinecone consolidacao

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/ai/pinecone.ts` | **MODIFICAR** — absorver buildPineconeRecord |
| `app/src/lib/ai/pinecone-client.ts` | **DELETAR** |

**Leitura (consumers — NAO MODIFICAR):**
- `app/src/app/api/assets/metrics/route.ts` — consumer de pinecone.ts
- `app/src/lib/ai/context-assembler.ts` — consumer de pinecone.ts
- `app/src/app/api/ai/analyze-visual/route.ts` — consumer de pinecone.ts
- Outros consumers de pinecone.ts — verificar via `rg "from.*pinecone"`

### SIG-BNS-01: Deletar vertex.ts (STRETCH)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/ai/vertex.ts` | **DELETAR** |

### SIG-ARC-02: Chat state

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/stores/chat-store.ts` | **MODIFICAR** — reduzir a metadata-only |
| `app/src/types/index.ts` | **MODIFICAR** — remover LegacyConversation (apos migracao, PA-06) |
| Consumers de `chat-store.currentConversation` | **MIGRAR** para `useConversations()` |

**Leitura:**
- `app/src/lib/hooks/use-conversations.ts` — source of truth target
- `app/src/components/chat/` — todos os componentes de chat que usam chat-store

### SIG-ARC-03: chat-input-area refactor

| Arquivo | Acao |
|:--------|:-----|
| `app/src/hooks/chat/use-file-upload.ts` | **CRIAR** |
| `app/src/hooks/chat/use-multimodal-analysis.ts` | **CRIAR** |
| `app/src/hooks/chat/use-party-mode.ts` | **CRIAR** |
| `app/src/hooks/chat/use-chat-message.ts` | **CRIAR** |
| `app/src/components/chat/chat-input-area.tsx` | **REFATORAR** — extrair logica para hooks |

**Leitura:**
- `app/src/components/chat/chat-input-area.tsx` — componente atual (428 linhas)
- `app/src/components/chat/party-mode/counselor-selector.tsx` — interacao com party mode

### SIG-BNS-02: Extrair estimateTokens (STRETCH)

| Arquivo | Acao |
|:--------|:-----|
| `app/src/lib/utils/ai-helpers.ts` | **CRIAR** (ou adicionar a arquivo existente) |
| `app/src/lib/ai/cost-guard.ts` | **MODIFICAR** — importar de ai-helpers |
| `app/src/lib/ai/context-assembler.ts` | **MODIFICAR** — importar de ai-helpers |
| Outros arquivos com `estimateTokens` inline | **MODIFICAR** — importar de ai-helpers |

---

## Proibicoes Consolidadas (PRD P1-P12 + Arch PA-01 a PA-06)

### PRD (Iuran) — P1 a P12

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **P1** | **NUNCA alterar logica de negocio** dos modulos ativados em S25-S28 | Attribution engine, Personalization engine, Propensity, Audience Scan |
| **P2** | **NUNCA remover exports existentes** de types/*.ts | Interfaces contratuais — estender, nunca reduzir. Re-exports sao permitidos |
| **P3** | **NUNCA alterar interfaces Sprint 25** | `prediction.ts`, `creative-ads.ts`, `text-analysis.ts` — INTOCAVEIS |
| **P4** | **NUNCA usar firebase-admin** ou google-cloud/* | Restricao de ambiente (Windows 11 24H2) — Client SDK only |
| **P5** | **NUNCA usar `any`** em novos tipos ou correcoes | `unknown` com type guards quando necessario |
| **P6** | **NUNCA hardcodar brandId** em novos modulos | Multi-tenant first — brandId vem do contexto |
| **P7** | **NUNCA iniciar Fase 2 sem Gate Check 1 aprovado** | Seguranca primeiro |
| **P8** | **NUNCA iniciar Fase 3 sem Gate Check 2 aprovado** | Tipos consolidados primeiro |
| **P9** | **NUNCA adicionar features novas** | Sprint Sigma e exclusivamente de consistencia |
| **P10** | **NUNCA alterar API publica** (URL, metodo HTTP, params obrigatorios) | Retrocompatibilidade total |
| **P11** | **NUNCA remover stubs/TODOs de S29+** | Assets, LeadState, Firebase gateway permanecem |
| **P12** | **NUNCA modificar testes existentes passando** | Exceto adaptar imports de tipos consolidados (Fase 2) |

### Arch Review (Athos) — PA-01 a PA-06

| # | Proibicao | Escopo |
|:--|:----------|:-------|
| **PA-01** | **NUNCA alterar dados no Firestore** durante consolidacao de tipos | Adapters em runtime — dados legados permanecem |
| **PA-02** | **NUNCA deletar pinecone.ts** | Manter e absorver funcoes de pinecone-client.ts |
| **PA-03** | **NUNCA aplicar requireBrandAccess em webhooks/dispatcher** | Webhook usa validacao de assinatura |
| **PA-04** | **NUNCA remover campo `error` das respostas de erro** | Frontend depende de `response.error` |
| **PA-05** | **NUNCA remover re-exports de index.ts** durante Fase 2 | Consumers importam de `@/types` |
| **PA-06** | **NUNCA remover LegacyConversation alias** antes de SIG-ARC-02 (Fase 4) | chat-store depende ate migracao |

---

## Modulos Protegidos (NAO TOCAR — producao estavel)

### Attribution Core (S27 — producao estavel)
- `app/src/lib/intelligence/attribution/engine.ts` — **NAO MODIFICAR logica** (P1)
- `app/src/lib/intelligence/attribution/bridge.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/intelligence/attribution/overlap.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/intelligence/attribution/aggregator.ts` — **NAO MODIFICAR logica** (P1)
- `app/src/lib/hooks/use-attribution-data.ts` — **NAO MODIFICAR** (P1)

### Personalization Core (S28 — producao estavel)
- `app/src/lib/intelligence/personalization/engine.ts` — **NAO MODIFICAR logica** (P1)
- `app/src/lib/intelligence/personalization/propensity.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/intelligence/personalization/middleware.ts` — **NAO MODIFICAR** (P1)
- `app/src/lib/intelligence/personalization/schemas/` — **NAO MODIFICAR** (P1)

### Sprint 25 Types
- `app/src/types/prediction.ts` — **PROIBIDO** (P3)
- `app/src/types/creative-ads.ts` — **PROIBIDO** (P3)
- `app/src/types/text-analysis.ts` — **PROIBIDO** (P3)

### Stubs Out-of-Scope (S29+)
- `app/src/lib/firebase/assets.ts` — Nao tocar (P11)
- `app/src/lib/hooks/use-intelligence-assets.ts` — Nao tocar (P11)
- `app/src/components/intelligence/discovery/assets-panel.tsx` — Nao tocar (P11)

---

## Resumo: Arquivos Novos a Criar (Sprint Sigma)

| Arquivo | Story | Tipo |
|:--------|:------|:-----|
| `app/src/lib/auth/conversation-guard.ts` | SIG-PRE-CONV | Auth guard |
| `app/src/types/social-platform.ts` | SIG-PRE-TYP | Tipo canonico + adapter |
| `app/src/lib/utils/awareness-adapter.ts` | SIG-PRE-TYP | Tipo + adapter |
| Testes para adapters | SIG-PRE-TYP | Testes unitarios (RC-13) |
| `app/src/lib/utils/api-response.ts` | SIG-API-01 | Utilitario de resposta |
| `app/src/hooks/chat/use-file-upload.ts` | SIG-ARC-03 | Hook |
| `app/src/hooks/chat/use-multimodal-analysis.ts` | SIG-ARC-03 | Hook |
| `app/src/hooks/chat/use-party-mode.ts` | SIG-ARC-03 | Hook |
| `app/src/hooks/chat/use-chat-message.ts` | SIG-ARC-03 | Hook |
| `app/src/lib/utils/ai-helpers.ts` | SIG-BNS-02 (STRETCH) | Utilitario |

## Resumo: Arquivos Deletados (Sprint Sigma)

| Arquivo | Story | Justificativa |
|:--------|:------|:-------------|
| `app/src/lib/ai/pinecone-client.ts` | SIG-ARC-01 | 0 consumers, funcoes absorvidas por pinecone.ts (DT-11) |
| `app/src/lib/ai/vertex.ts` | SIG-BNS-01 (STRETCH) | Codigo morto, 0 consumers |

## Resumo: Arquivos Modificados (Sprint Sigma — Top 25 por Impacto)

| Arquivo | Story(ies) | Tipo de Mudanca |
|:--------|:-----------|:---------------|
| 10 rotas API (social/*, design/*, funnels/*, performance/*) | SIG-SEC-01, SIG-API-02, SIG-API-03 | Auth + format unificado + credit tracking |
| `app/src/app/api/chat/route.ts` | SIG-SEC-01, SIG-API-02 | requireConversationAccess + createApiSuccess (DT-10) |
| `app/src/types/index.ts` | SIG-TYP-01/02/03/06, SIG-ARC-02 | Re-exports + aliases + Date→Timestamp + remover alias F4 |
| `app/src/types/database.ts` | SIG-TYP-07 | Awareness Schwartz |
| `app/src/types/funnel.ts` | SIG-TYP-03/04 | Re-export Funnel + LegacyAutopsyReport + adapter |
| `app/src/types/vault.ts` | SIG-TYP-05 | SocialPlatform re-export |
| `app/src/types/social.ts` | SIG-TYP-05 | SocialPlatform re-export |
| `app/src/types/social-inbox.ts` | SIG-TYP-05 | SocialPlatform re-export |
| `app/src/lib/stores/brand-store.ts` | SIG-SEC-03 | skipHydration |
| `app/src/lib/stores/context-store.ts` | SIG-SEC-03 | skipHydration |
| `app/src/lib/stores/chat-store.ts` | SIG-TYP-02, SIG-ARC-02 | LegacyConversation (F2) → metadata-only (F4) |
| `app/src/lib/ai/pinecone.ts` | SIG-ARC-01 | Absorver buildPineconeRecord |
| `app/src/components/chat/chat-input-area.tsx` | SIG-ARC-03 | Extrair 4 hooks, <= 150 linhas |
| `app/src/lib/agents/publisher/adaptation-pipeline.ts` | SIG-TYP-05 | SocialPlatform lowercase |
| `app/src/lib/agents/qa/brand-validation.ts` | SIG-TYP-05 | SocialPlatform lowercase |
| `app/src/app/api/webhooks/dispatcher/route.ts` | SIG-SEC-01, SIG-SEC-02 | Documentar auth + force-dynamic |
| 7 rotas dinamicas | SIG-SEC-02 | force-dynamic |
| 8+ rotas intelligence | SIG-API-02 | Format unificado |
| `app/src/lib/ai/cost-guard.ts` | SIG-BNS-02 (STRETCH) | Import estimateTokens |
| `app/src/lib/ai/context-assembler.ts` | SIG-BNS-02 (STRETCH) | Import estimateTokens |
| Frontend callers de 10 rotas | SIG-PRE-SEC | Adicionar brandId no body |
| Providers.tsx (ou client root) | SIG-SEC-03 | rehydrate() |

---

## Resumo de Impacto por Contrato

| Lane (contract-map.yaml) | Contrato | Impacto | Risco |
|:--------------------------|:---------|:--------|:------|
| `security` (cross-cutting) | N/A | 12 rotas blindadas, 2 stores protegidos | Medio — core da Fase 1 |
| `types` (cross-cutting) | N/A | 5 entidades consolidadas, 7 type files tocados | Alto — core da Fase 2 |
| `api_consistency` | N/A | 30+ rotas migradas, 10 com credit tracking | Medio — Fase 3 |
| `architecture` | N/A | Pinecone unificado, chat state consolidado, componente refatorado | Medio — Fase 4 |
| `intelligence_wing` | `intelligence-storage.md` | 8+ rotas tocadas (auth + format) | Baixo — apenas wrapping |
| `ai_retrieval` | `retrieval-contracts.md` | Pinecone consolidado | Baixo |
| `performance_war_room` | `performance-spec.md` | 2 rotas tocadas (auth + format) | Baixo |

**NENHUM contrato ativo sera quebrado.** Justificativas:
1. Auth e ADICIONAL — nao altera logica interna das rotas
2. Format unificado mantem campo `error` (PA-04) — frontend nao quebra
3. Type consolidacao usa re-exports e aliases — imports existentes funcionam
4. Pinecone: arquivo correto mantido, zero alteracao em consumers
5. Sprint 25 types intocados (P3)
6. Attribution/Personalization engines intocados (P1)

---
*Allowed Context preparado por Leticia (SM) — NETECMT v2.0*
*Incorpora proibicoes do PRD (Iuran) e Proibicoes Arquiteturais do Arch Review (Athos)*
*Sprint Sigma: Sub-Sprint de Consistencia do Codebase | 07/02/2026*
*22 stories | 10 arquivos novos | 2 arquivos deletados | 25+ arquivos modificados*
