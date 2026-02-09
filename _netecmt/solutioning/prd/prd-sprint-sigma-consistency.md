# 🛡️ PRD: Sprint Sigma — Sub-Sprint de Consistência do Codebase

**Versao:** 1.0  
**Responsavel:** Iuran (PM)  
**Status:** 📋 Pronto para Arch Review (Athos)  
**Data:** 07/02/2026  
**Tipo:** Stabilization (nao-funcional, similar a S22/S26)  
**Predecessora:** Sprint 28 (Hybrid: Cleanup & Foundations + Personalization Advance) — ✅ CONCLUÍDA (QA 98/100)  
**Posicao:** Entre Sprint 28 e Sprint 29 — **nao altera numeracao do roadmap**  
**Deliberacao:** Aprovada por UNANIMIDADE pelo Alto Conselho em Party Mode — baseada na auditoria `audit-codebase-consistency-2026-02-07.md`

---

## 1. Contexto e Motivacao

### O que aconteceu

A Sprint 28 foi concluida com QA **98/100** (Dandara), consolidando a trajetoria ascendente: S25(93) → S26(97) → S27(97) → S28(98). O baseline esta solido: **218/218 testes passando**, `tsc=0`, `build` com 103 rotas compiladas.

Imediatamente apos a conclusao da S28, uma **auditoria completa de consistencia** foi realizada por leitura estatica do codebase inteiro (30+ API routes, 20+ type files, 18 lib modules, 15+ components, 5 stores, 15 hooks). A auditoria revelou **problemas estruturais que NAO estavam no radar do roadmap original** — divida tecnica acumulada organicamente entre S13-S28 conforme diferentes features foram implementadas.

### Indicadores de Saude (Pre-Sigma)

| Dimensao | Score | Tendencia |
|:---------|:------|:----------|
| Seguranca (auth/multi-tenant) | 4/10 | **Risco ativo** |
| Consistencia de tipos | 3/10 | **Divida crescente** |
| Consistencia de API | 4/10 | Divida estavel |
| Arquitetura lib/ | 5/10 | Confusao pontual |
| Componentes/State | 5/10 | Divida moderada |
| Codigo morto | 6/10 | Gerenciavel |

### Veredicto da Auditoria

> *"O core funcional esta solido (Gemini, Pinecone, Firebase, RAG). Os problemas estao nas **bordas**: rotas sem auth, tipos duplicados com estruturas conflitantes, logica copy-paste, e estado duplicado no frontend. Nenhum problema e catastrofico isoladamente, mas **o acumulo cria risco composto**."*

### Achados Criticos que motivam esta Sprint

| # | Achado | Prioridade | Impacto |
|:--|:-------|:-----------|:--------|
| 1 | 12 rotas API sem autenticacao (vazamento cross-tenant) | **P0** | Critico — qualquer usuario acessa dados de qualquer brand |
| 2 | Tipos duplicados com estruturas conflitantes (Message x2, Funnel x3, AutopsyReport x2, SocialPlatform x3) | **P0** | Alto — bugs silenciosos em runtime |
| 3 | Stores sem hydration guard (crash SSR) | **P0** | Alto — hydration mismatch no App Router |
| 4 | 7 rotas sem `force-dynamic` (dados stale em producao) | **P0** | Alto — Vercel cacheia respostas dinamicas |
| 5 | 10 rotas consomem Gemini sem credit tracking | **P1** | Medio — custo AI sem controle por brand |
| 6 | 2 clientes Pinecone incompativeis | **P1** | Medio — async/sync no mesmo recurso |
| 7 | Estado duplicado no chat (chat-store vs useConversations) | **P1** | Medio — duas fontes de verdade |
| 8 | 5 formatos de erro diferentes nas APIs | **P1** | Medio — frontend nao trata erros uniformemente |
| 9 | Componente monolitico chat-input-area.tsx (391 linhas) | **P1** | Medio — impossivel testar/reusar |

### Por que uma Sub-Sprint dedicada (e nao backlog distribuido)

1. **Precedente comprovado:** S22 (Stabilization) e S26 (Tech Debt) mostraram que sprints dedicadas de limpeza produzem saltos de qualidade (S26: 161→0 erros TS, QA 93→97)
2. **Risco de seguranca ativo:** 12 rotas sem auth e P0 — nao pode esperar S29 que tem escopo de feature
3. **Efeito composto:** Tipos conflitantes escalam com cada nova feature — corrigir agora evita N correcoes futuras
4. **Momentum:** QA 98/100 — consolidar antes de avancar para features de alto impacto (S29: Assets, S30: Ads)
5. **Escopo contido:** ~22-26h (2-3 dias) — nao atrasa o roadmap significativamente

### Decisao do Alto Conselho

O Conselho deliberou por **UNANIMIDADE** a criacao da Sprint Sigma:

> *"Criar uma sub-sprint de consistencia entre S28 e S29, dedicada a resolver todos os achados P0 e P1 da auditoria. P2 fica no backlog distribuido em S29-S34. A sprint segue o modelo de Stabilization (S22/S26), com 4 fases e 2 gates obrigatorios."*

**Decisoes especificas:**
- **Escopo:** P0 completo + P1 completo
- **P2:** Backlog distribuido em S29-S34
- **Nome:** Sprint Sigma (sub-sprint, nao altera numeracao)
- **Estrutura:** 4 fases com 2 gates

---

## 2. Objetivo da Sprint

> **"Eliminar todos os achados P0 e P1 da auditoria de consistencia: blindar 12 rotas com autenticacao, consolidar tipos duplicados em source of truth unica, unificar formato de erro das APIs, consolidar Pinecone e chat state, e refatorar o componente monolitico — mantendo zero regressao no baseline de 218 testes, tsc=0 e build sucesso."**

### North Star Metrics

| Metrica | Antes (S28) | Meta (Sigma) |
|:--------|:------------|:-------------|
| Rotas API sem autenticacao | **12** | **0** |
| Tipos duplicados conflitantes | **5 entidades** (Message, Funnel, AutopsyReport, SocialPlatform, Conversation) | **0** (1 source of truth por entidade) |
| Formatos de erro na API | **5 diferentes** | **1 unificado** (`createApiError`/`createApiSuccess`) |

### Metricas Secundarias

| Metrica | Antes (S28) | Meta (Sigma) |
|:--------|:------------|:-------------|
| Stores com hydration guard | 0/2 persistidos | 2/2 |
| Rotas com `force-dynamic` | 0/7 dinamicas | 7/7 |
| Rotas Gemini com credit tracking | 0/10 | 10/10 |
| Clientes Pinecone | 2 incompativeis | 1 unico |
| Chat state sources of truth | 2 (divergentes) | 1 (`useConversations`) |
| `chat-input-area.tsx` linhas | 391 | ≤ 150 (4+ hooks extraidos) |
| Testes passando | 218/218 | ≥ 218/218 (zero regressao) |
| TypeScript errors | 0 | 0 |
| Build | 103 rotas | ≥ 103 rotas |

---

## 3. Escopo

### 3.1 FASE 1: Seguranca (P0-A) — ~3-4h — GATE

> **PRIORIDADE MAXIMA.** Rotas sem autenticacao representam vazamento cross-tenant ativo. Esta fase DEVE ser concluida e validada antes de qualquer outra acao.

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| SIG-SEC-01 | **Auth nas 12 rotas vulneraveis** | Adicionar `requireBrandAccess(req, brandId)` em todas as 12 rotas identificadas na auditoria, seguindo o padrao da Intelligence Wing (`/api/intelligence/*`). Rotas: (1) `social/generate`, (2) `social/hooks`, (3) `social/structure`, (4) `social/scorecard`, (5) `design/plan`, (6) `design/generate`, (7) `design/upscale`, (8) `performance/metrics`, (9) `funnels/export`, (10) `funnels/share`, (11) `chat`, (12) `webhooks/dispatcher` | L (~3h) |
| SIG-SEC-02 | **`force-dynamic` em 7 rotas** | Adicionar `export const dynamic = 'force-dynamic'` nas 7 rotas que carecem da diretiva: (1) `campaigns/[id]/generate-ads`, (2) `funnels/share`, (3) `funnels/export`, (4) `decisions`, (5) `copy/decisions`, (6) `webhooks/dispatcher`, (7) `performance/metrics` | XS (~15min) |
| SIG-SEC-03 | **Hydration guard nos 2 stores persistidos** | Adicionar `typeof window !== 'undefined'` guard ou `skipHydration` em: (1) `brand-store.ts` (persist + sem guard), (2) `context-store.ts` (persist + sem guard). Previne crash de hydration mismatch no Next.js App Router | XS (~30min) |

**GATE CHECK 1 (antes de iniciar Fase 2):**
- [ ] SIG-SEC-01: Zero rotas sem `requireBrandAccess` (0/12 vulneraveis)
- [ ] SIG-SEC-02: `force-dynamic` em 7/7 rotas
- [ ] SIG-SEC-03: Hydration guards em 2/2 stores persistidos
- [ ] `npx tsc --noEmit` = 0 erros
- [ ] `npm run build` sucesso
- [ ] `npm test` — zero regressao (≥ 218 pass)

---

### 3.2 FASE 2: Consistencia de Tipos (P0-B) — ~5-6h — GATE

> **REGRA ABSOLUTA:** `database.ts` e eleito como **source of truth** para entidades persistidas. Duplicatas em `index.ts`, `funnel.ts`, `social-inbox.ts` e `vault.ts` devem ser removidas ou transformadas em re-exports.

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| SIG-TYP-01 | **Consolidar Message** | Eleger definicao de `database.ts` como canonica. Correcoes: (1) Migrar `Date` → `Timestamp` em `index.ts`, (2) Adicionar `conversationId` obrigatorio, (3) Tipar `metadata.sources` como `SourceReference[]` (nao `any[]`), (4) Adicionar `metadata.scorecard` opcional. Remover definicao duplicada de `index.ts` ou transformar em re-export | M (~1h) |
| SIG-TYP-02 | **Consolidar Conversation** | Eleger `database.ts` como canonica. Correcoes: (1) Modelo de subcollection para messages (nao embarcado), (2) Adicionar `tenantId` e `userId` obrigatorios, (3) Adicionar `context: { funnelId?, mode }`, (4) Migrar `Date` → `Timestamp`. Atualizar consumers de `index.ts` | M (~1h) |
| SIG-TYP-03 | **Consolidar Funnel** | Eleger `database.ts` como canonica. Correcoes: (1) Unificar status enum: `draft\|generating\|review\|active\|archived\|error`, (2) Migrar `Date` → `Timestamp` em `index.ts` e `funnel.ts`, (3) Adicionar `tenantId` obrigatorio, (4) Limpar `FunnelContext` — remover legado `channels` (plural), manter `channel` (singular). Remover/redirect duplicatas de `funnel.ts` e `index.ts` | M (~1.5h) |
| SIG-TYP-04 | **Consolidar AutopsyReport** | Eleger `autopsy.ts` como canonica (estrutura mais completa com heuristics). Migrar consumers de `funnel.ts` para importar de `autopsy.ts`. Criar adapter se necessario para manter retrocompatibilidade com campos legados (`overallHealth` → `score`, `criticalGaps` → derivado de recommendations) | M (~1h) |
| SIG-TYP-05 | **Consolidar SocialPlatform** | Criar arquivo unico `types/social-platform.ts` com: `type SocialPlatform = 'instagram' \| 'tiktok' \| 'linkedin' \| 'x' \| 'whatsapp'` (lowercase, inclui tiktok). Re-export de `social.ts`, `social-inbox.ts` e `vault.ts`. Migrar consumers de PascalCase (`vault.ts`) para lowercase | S (~30min) |
| SIG-TYP-06 | **Date → Timestamp em index.ts** | Migrar todos os campos de data em `index.ts` de `Date` para `Timestamp` (Firestore). Campos afetados: `timestamp` (L10), `createdAt`/`updatedAt` (L21-22, L124-125). Garante alinhamento com `database.ts` | S (~30min) |
| SIG-TYP-07 | **Awareness stage canonica** | Eleger modelo Schwartz (ingles) como canonico: `'unaware' \| 'problem' \| 'solution' \| 'product' \| 'most_aware'`. Remover modelo PT (`fria\|morna\|quente`) de `database.ts`. Criar mapeamento legado → Schwartz se necessario para dados existentes | S (~30min) |

**GATE CHECK 2 (antes de iniciar Fase 3):**
- [ ] SIG-TYP-01 a 07: Zero tipos duplicados conflitantes
- [ ] Cada entidade tem exatamente 1 source of truth
- [ ] `npx tsc --noEmit` = 0 erros
- [ ] `npm run build` sucesso
- [ ] `npm test` — zero regressao (≥ 218 pass)
- [ ] Nenhum `import { Message }` de `index.ts` (exceto re-export)

---

### 3.3 FASE 3: API Consistency (P1) — ~5-6h

> Padronizar respostas de erro e rastrear consumo de AI em todas as rotas.

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| SIG-API-01 | **Criar `lib/utils/api-response.ts`** | Criar modulo utilitario com: (1) `createApiError(status, message, code?, details?)` — retorna `NextResponse` com shape padrao `{ error: string, code?: string, details?: string, requestId: string }`, (2) `createApiSuccess<T>(data: T, meta?)` — retorna `NextResponse` com shape padrao `{ success: true, data: T, meta?: object }`. Incluir `requestId` (UUID) para rastreabilidade | S (~30min) |
| SIG-API-02 | **Migrar 30+ rotas para formato unificado** | Substituir os 5 formatos de erro existentes pelo padrao `createApiError`/`createApiSuccess`. Formatos a eliminar: (A) `{ error: 'string' }`, (B) `{ error, details }`, (C) `{ error, code }`, (D) `errorResponse(500, msg, code, reqId)`, (E) `{ success: false, message }`. Migrar rotas em lotes: social/* (4), design/* (3), intelligence/* (8), performance/* (2), funnels/* (3), chat (1), outros | L (~3h) |
| SIG-API-03 | **Credit tracking em 10 rotas Gemini** | Adicionar deducao de credito AI em 10 rotas que consomem Gemini sem rastreamento: (1) `design/plan`, (2) `design/upscale`, (3) `social/generate`, (4) `social/hooks`, (5) `social/structure`, (6) `social/scorecard`, (7) `intelligence/creative/copy`, (8) `intelligence/keywords`, (9) `funnels/generate`, (10) `campaigns/[id]/generate-ads`. Seguir padrao existente em `copy/generate` (deduz 1 credito) e `ai/analyze-visual` (deduz 2 creditos) | M (~2h) |

---

### 3.4 FASE 4: Architecture (P1) — ~7-8h

> Eliminar duplicacoes arquiteturais e refatorar componente monolitico.

| ID | Item | Descricao | Esforco |
|:---|:-----|:----------|:--------|
| SIG-ARC-01 | **Pinecone client unico** | Eliminar `lib/ai/pinecone.ts` (async `getPineconeIndex()`). Manter `lib/ai/pinecone-client.ts` como unica implementacao (sync). Migrar consumers: `context-assembler.ts`, `dossier-generator.ts` e quaisquer outros que importem de `pinecone.ts` | M (~2h) |
| SIG-ARC-02 | **Chat state: source of truth unica** | Eleger `useConversations()` (hook com real-time Firestore) como source of truth. Reduzir `chat-store.ts` a metadata apenas (UI state como sidebar aberta, modo de input, etc). Migrar consumers que usam `chat-store.currentConversation` para `useConversations()`. Garantir que `ChatProvider` propaga dados via contexto | L (~3h) |
| SIG-ARC-03 | **Refatorar `chat-input-area.tsx`** | Extrair componente monolitico (391 linhas, 5+ responsabilidades) em 4-5 hooks: (1) `useFileUpload()` — validacao e upload de arquivos (L66-156), (2) `useMultimodalAnalysis()` — analise Gemini de imagens/docs (L133), (3) `usePartyMode()` — selecao de counselors (L160-170), (4) `useChatMessage()` — construcao e envio de mensagem (L188-217). O componente principal deve ficar ≤ 150 linhas, focado em UI (drag-drop, layout) | L (~3h) |

---

### 3.5 Bonus "Custo Zero" (P2 durante execucao)

> Items P2 que serao resolvidos naturalmente durante a execucao das fases acima, sem esforco adicional.

| ID | Item | Quando resolver | Esforco adicional |
|:---|:-----|:---------------|:-----------------|
| SIG-BNS-01 | **Deletar `vertex.ts`** | Durante SIG-ARC-01 (limpeza lib/ai/) — codigo morto, 0 consumers, 218 linhas | Zero |
| SIG-BNS-02 | **Extrair `estimateTokens()` duplicado** | Durante SIG-API-03 (credit tracking) — funcao aparece em `cost-guard.ts`, `context-assembler.ts` + 6 outros. Extrair para `lib/utils/ai-helpers.ts` | ~15min |

---

## 4. Fora de Escopo (P2 — Backlog S29-S34)

> **EXPLICITAMENTE ADIADO.** Os itens abaixo foram classificados como P2 na auditoria e NAO fazem parte da Sprint Sigma. Serao distribuidos no backlog de S29-S34 conforme prioridade.

| Item | Prioridade | Sprint Sugerida | Justificativa do adiamento |
|:-----|:-----------|:---------------|:--------------------------|
| Logica duplicada copy-paste (JSON parsing, brand context loading) | P2 | S29 | Nao causa bugs — apenas ineficiencia de manutencao |
| `cosineSimilarity()` duplicado em `vertex.ts` e `embeddings.ts` | P2 | S29 | Resolvido parcialmente com delecao de `vertex.ts` (SIG-BNS-01) |
| `AI_PRESETS` duplicado em `brand-kit-form.tsx` e `OfferBuilder.tsx` | P2 | S29 | Baixo impacto — constantes identicas |
| `STATUS_COLORS` hardcoded em `funnel-analytics.tsx` | P2 | S29 | Cosmético |
| Firebase sem gateway centralizado (20+ imports diretos de `db`) | P2 | S31+ | **Esforco de 1 sprint dedicado** — muito grande para Sigma |
| Inconsistencias de convencao (`req` vs `request`, `loading` vs `isLoading`) | P2 | S29-S34 | Convencao, nao funcionalidade |
| `snake_case` em types vs `camelCase` | P2 | S30 | Convencao |
| Gemini model hardcoded vs `DEFAULT_GEMINI_MODEL` | P2 | S29 | Baixo impacto |
| Styling misto (Tailwind puro + shadcn + custom) | P2 | S30+ | UI/UX, nao funcionalidade |
| Error boundary subutilizado | P2 | S30 | Enhancement |
| Loading states inconsistentes (3 padroes) | P2 | S30 | UI/UX |
| Hook return signatures inconsistentes | P2 | S29 | API de hooks |

---

## 5. Success Criteria

### Definition of Done (Sprint Level)

| # | Criterio | Validacao | Responsavel |
|:--|:---------|:----------|:-----------|
| **SC-01** | **Zero rotas API sem autenticacao** — 0/12 vulneraveis, todas com `requireBrandAccess` | `grep -r "requireBrandAccess"` nas 12 rotas — 12/12 presentes | Dandara (QA) |
| **SC-02** | **Zero tipos duplicados conflitantes** — 1 source of truth por entidade (Message, Conversation, Funnel, AutopsyReport, SocialPlatform) | Verificar que cada entidade tem exatamente 1 definicao canonica. Imports apontam para source of truth | Dandara (QA) |
| **SC-03** | **Hydration guards em stores persistidos** — 2/2 (`brand-store`, `context-store`) | Verificar presenca de guard `typeof window` ou `skipHydration` | Dandara (QA) |
| **SC-04** | **`force-dynamic` em rotas dinamicas** — 7/7 | `grep -r "force-dynamic"` nas 7 rotas | Dandara (QA) |
| **SC-05** | **Credit tracking em rotas Gemini** — 10/10 | Verificar deducao de credito em cada rota listada | Dandara (QA) |
| **SC-06** | **Pinecone client unico** — 1 implementacao (`pinecone-client.ts`), `pinecone.ts` deletado | `ls app/src/lib/ai/pinecone.ts` retorna "nao encontrado" | Dandara (QA) |
| **SC-07** | **Formato de erro API unificado** — `createApiError`/`createApiSuccess` em todas as rotas | Nenhuma rota retorna formatos A-E legados | Dandara (QA) |
| **SC-08** | **Chat state — source of truth unica** — `useConversations` como source of truth, `chat-store` reduzido a metadata | `chat-store.ts` nao contem `currentConversation` nem `messages[]` | Dandara (QA) |
| **SC-09** | **`chat-input-area.tsx` ≤ 150 linhas**, 4+ hooks extraidos | `wc -l chat-input-area.tsx` ≤ 150. Hooks: `useFileUpload`, `useMultimodalAnalysis`, `usePartyMode`, `useChatMessage` existem | Dandara (QA) |
| **SC-10** | **tsc=0, build sucesso, ≥ 218 testes pass, zero regressao** | `npx tsc --noEmit` = 0, `npm run build` sucesso, `npm test` ≥ 218 pass | Dandara (QA) |

### Acceptance Criteria por Fase

**Fase 1 (Seguranca — GATE):**
- 12/12 rotas com `requireBrandAccess`
- 7/7 rotas com `force-dynamic`
- 2/2 stores com hydration guard
- Zero regressao (tsc + build + tests)

**Fase 2 (Tipos — GATE):**
- 5/5 entidades consolidadas (1 source of truth cada)
- `Date` → `Timestamp` em `index.ts`
- Awareness stage: modelo Schwartz canonico
- Zero regressao (tsc + build + tests)

**Fase 3 (API Consistency):**
- `api-response.ts` criado e funcional
- 30+ rotas migradas para formato unificado
- 10/10 rotas com credit tracking
- Zero regressao (tsc + build + tests)

**Fase 4 (Architecture):**
- Pinecone client unico
- Chat state com source of truth unica
- `chat-input-area.tsx` ≤ 150 linhas, 4+ hooks
- Zero regressao (tsc + build + tests)

---

## 6. Proibicoes (Allowed Context Constraints)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| **P1** | **NUNCA alterar logica de negocio** dos modulos ativados nas sprints anteriores (Attribution engine, Personalization engine, Propensity engine, Audience Scan) | Codigo testado e produtivo — respeitar estabilidade S25-S28 |
| **P2** | **NUNCA remover exports existentes** de arquivos de tipos (`types/*.ts`) | Interfaces contratuais — podem ser estendidas com campos opcionais, nunca reduzidas. Re-exports sao permitidos |
| **P3** | **NUNCA alterar interfaces Sprint 25** (`prediction.ts`, `creative-ads.ts`, `text-analysis.ts`) | Intocaveis — producao estavel |
| **P4** | **NUNCA usar `firebase-admin`** ou `google-cloud/*` | Restricao de ambiente (Windows 11 24H2) — Client SDK only |
| **P5** | **NUNCA usar `any`** em novos tipos ou correcoes | `unknown` com type guards quando necessario |
| **P6** | **NUNCA hardcodar `brandId`** em novos modulos ou correcoes | Multi-tenant first — brandId vem do contexto de auth/request |
| **P7** | **NUNCA iniciar Fase 2 sem Gate Check 1 aprovado** | Seguranca primeiro — nao consolidar tipos enquanto houver rotas vulneraveis |
| **P8** | **NUNCA iniciar Fase 3 sem Gate Check 2 aprovado** | Tipos devem estar consolidados antes de migrar formato de erro (que depende dos tipos) |
| **P9** | **NUNCA adicionar features novas** nesta sprint | Sprint Sigma e exclusivamente de consistencia/estabilizacao. Zero funcionalidade nova |
| **P10** | **NUNCA alterar a API publica** (URL, metodo HTTP, parametros obrigatorios) de nenhuma rota existente | Retrocompatibilidade total — apenas adicionar auth, padronizar response shape interno |
| **P11** | **NUNCA remover stubs/TODOs de S29+** | Stubs de assets, LeadState, Firebase gateway — permanecem intocados para sprints futuras |
| **P12** | **NUNCA modificar testes existentes** que estao passando, exceto para adaptar imports de tipos consolidados | Os 218 testes existentes sao o baseline de regressao |

---

## 7. Riscos e Mitigacoes

| # | Risco | Prob. | Impacto | Mitigacao |
|:--|:------|:------|:--------|:----------|
| R1 | **Auth quebra rotas que dependiam de acesso sem brand** (ex: webhooks) | Media | Alto | Manter fallback para rotas de webhook: validar assinatura em vez de brandId. `webhooks/dispatcher` usa validacao de assinatura, nao brand access | 
| R2 | **Consolidacao de tipos quebra consumers em cascade** | Media | Alto | Criar type aliases de compatibilidade temporarios (`@deprecated`). Usar `tsc --noEmit` apos cada consolidacao individual. Migrar consumers em lotes pequenos |
| R3 | **Awareness stage migration quebra dados existentes no Firestore** | Media | Alto | NAO alterar dados no Firestore. Criar funcao de mapeamento `legacyToSchwartz()` que converte em runtime: `fria→unaware`, `morna→solution`, `quente→product` |
| R4 | **Credit tracking introduz latencia nas rotas** | Baixa | Medio | Deducao de credito async (fire-and-forget) — nao bloqueia response. Usar padrao existente em `copy/generate` |
| R5 | **Refatoracao de `chat-input-area.tsx` quebra funcionalidade de chat** | Media | Alto | Extrair hooks um por um, testando manualmente apos cada extracao. Manter funcionalidade identica — zero mudanca visual |
| R6 | **Migracao Pinecone client quebra RAG/embeddings** | Baixa | Alto | `pinecone-client.ts` ja e o client principal. Apenas redirecionar imports de `pinecone.ts`. Testar retrieval apos migracao |
| R7 | **Migracao de formato de erro quebra frontend** | Media | Medio | Manter campo `error: string` em todos os formatos — frontend ja usa `response.error`. Novos campos (`code`, `requestId`) sao adicionais |
| R8 | **Chat state migration causa perda de conversa ativa** | Baixa | Alto | Manter `chat-store` funcional como fallback durante migracao. Remover apenas apos confirmar que `useConversations` cobre todos os use cases |

---

## 8. Estimativas por Fase

| Fase | ID | Stories | Esforco | Gate? |
|:-----|:---|:--------|:--------|:------|
| **FASE 1: Seguranca (P0-A)** | SIG-SEC-01 a 03 | 3 stories | **~3-4h** | **SIM — GATE 1** |
| **FASE 2: Tipos (P0-B)** | SIG-TYP-01 a 07 | 7 stories | **~5-6h** | **SIM — GATE 2** |
| **FASE 3: API Consistency (P1)** | SIG-API-01 a 03 | 3 stories | **~5-6h** | Nao |
| **FASE 4: Architecture (P1)** | SIG-ARC-01 a 03 | 3 stories | **~7-8h** | Nao |
| Bonus P2 | SIG-BNS-01 a 02 | 2 items | **~15min** | Nao |
| **QA Final** | — | — | **~1-2h** | — |
| **TOTAL** | | **16 stories + 2 bonus** | **~22-28h** | 2 gates |

### Ordem de Execucao

```
[FASE 1 — Seguranca (P0-A)]
  SIG-SEC-01 (auth 12 rotas, L)
    → SIG-SEC-02 (force-dynamic 7 rotas, XS)
      → SIG-SEC-03 (hydration guards, XS)

  ── GATE CHECK 1 ── (tsc + build + tests + review SEC-01) ──

[FASE 2 — Tipos (P0-B)]
  SIG-TYP-05 (SocialPlatform, S) → SIG-TYP-06 (Date→Timestamp, S) → SIG-TYP-07 (Awareness, S)
    → SIG-TYP-01 (Message, M) → SIG-TYP-02 (Conversation, M)
      → SIG-TYP-03 (Funnel, M) → SIG-TYP-04 (AutopsyReport, M)

  ── GATE CHECK 2 ── (tsc + build + tests + review TYP-01 a 07) ──

[FASE 3 — API Consistency (P1)]
  SIG-API-01 (criar api-response.ts, S) → SIG-API-02 (migrar 30+ rotas, L)
    → SIG-API-03 (credit tracking 10 rotas, M) + SIG-BNS-02 (estimateTokens)

[FASE 4 — Architecture (P1)]
  SIG-ARC-01 (Pinecone, M) + SIG-BNS-01 (deletar vertex.ts)
    → SIG-ARC-02 (Chat state, L)
      → SIG-ARC-03 (chat-input-area refactor, L)

[QA FINAL]
  Dandara valida SC-01 a SC-10
```

**Notas sobre paralelismo:**
- SIG-TYP-05, 06, 07 sao independentes entre si (podem paralelizar)
- SIG-ARC-01 e SIG-ARC-02 sao independentes (podem paralelizar)
- SIG-API-03 e SIG-BNS-02 se beneficiam de execucao conjunta (estimateTokens extrai durante credit tracking)

---

## 9. Gate Checks

### Gate Check 1: Seguranca (apos Fase 1)

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | Auth em 12 rotas | `rg "requireBrandAccess" app/src/app/api/` | 12+ ocorrencias (1 por rota vulneravel) |
| G1-02 | `force-dynamic` em 7 rotas | `rg "force-dynamic" app/src/app/api/` | 7+ novas ocorrencias |
| G1-03 | Hydration guards | Inspecao manual de `brand-store.ts` e `context-store.ts` | Guard presente em ambos |
| G1-04 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0, zero erros |
| G1-05 | Build sucesso | `npm run build` | Exit code 0, ≥ 103 rotas |
| G1-06 | Testes passando | `npm test` | ≥ 218/218 pass, 0 fail |

**Regra:** Fase 2 so inicia se G1-01 a G1-06 estiverem todos ✅.

### Gate Check 2: Tipos (apos Fase 2)

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | Message source of truth | Verificar que `database.ts` e a unica definicao | 1 definicao canonica |
| G2-02 | Conversation source of truth | Verificar `database.ts` | 1 definicao canonica |
| G2-03 | Funnel source of truth | Verificar `database.ts` | 1 definicao canonica |
| G2-04 | AutopsyReport source of truth | Verificar `autopsy.ts` | 1 definicao canonica |
| G2-05 | SocialPlatform unificado | Verificar arquivo unico `social-platform.ts` | 1 definicao, lowercase, inclui tiktok |
| G2-06 | Date → Timestamp | `rg ": Date" app/src/types/index.ts` | 0 ocorrencias de `Date` em campos de timestamp |
| G2-07 | Awareness canonico | `rg "fria\|morna\|quente" app/src/types/` | 0 ocorrencias do modelo PT |
| G2-08 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0, zero erros |
| G2-09 | Build sucesso | `npm run build` | Exit code 0, ≥ 103 rotas |
| G2-10 | Testes passando | `npm test` | ≥ 218/218 pass, 0 fail |

**Regra:** Fase 3 so inicia se G2-01 a G2-10 estiverem todos ✅.

---

## 10. Dependencias

| Dependencia | Status | Impacto |
|:-----------|:-------|:--------|
| Sprint 28 concluida (QA 98/100) | ✅ Confirmada | Pre-requisito cumprido |
| Build limpo (`tsc --noEmit` = 0) | ✅ Confirmado | Baseline mantida |
| 218/218 testes passando | ✅ Confirmado | Baseline de regressao |
| Auditoria de consistencia concluida | ✅ `audit-codebase-consistency-2026-02-07.md` | Findings documentados |
| `requireBrandAccess()` funcao existente | ✅ Usada na Intelligence Wing | Padrao a seguir |
| Padrao credit tracking existente | ✅ `copy/generate`, `ai/analyze-visual` | Padrao a seguir |
| **Arch Review (Athos)** | ⏳ PENDENTE | PRD nao vira stories sem aprovacao |
| Nenhum MCP/CLI novo | ✅ | Ferramentas existentes suficientes |

---

## 11. Impacto no Roadmap

### Posicao

```
... → S27 (97) → S28 (98) → [Sprint Sigma] → S29 → S30 → ...
```

Sprint Sigma e uma **sub-sprint** entre S28 e S29. **NAO altera a numeracao** do roadmap forward (S29 continua sendo S29).

### Beneficios para Sprints Futuras

| Sprint | Beneficio Direto da Sigma |
|:-------|:-------------------------|
| **S29** (Assets & Persistence) | Tipos consolidados facilitam persistencia. Auth ja blindada. Format unificado reduz boilerplate |
| **S30** (Ads Integration) | Credit tracking ja implementado. Pinecone client unico simplifica retrieval. API format padrao |
| **S31** (Automation & Rules Runtime) | Chat state consolidado. Componentes refatorados sao reusaveis. Zero divida de tipos |
| **S32+** | Base limpa e consistente — cada feature nova e implementada sobre fundacoes solidas |

### Trajetoria de Qualidade Projetada

```
S25 (93) → S26 (97) → S27 (97) → S28 (98) → [Sigma (?)] → S29 (meta ≥ 98)
```

**Projecao:** Sprint Sigma deve manter ou elevar o QA score. O baseline nao pode regredir.

---

## 12. Artefatos de Referencia

| Artefato | Caminho |
|:---------|:--------|
| **Auditoria de Consistencia** | `_netecmt/solutioning/audit-codebase-consistency-2026-02-07.md` |
| Sprint 28 (predecessora) | `_netecmt/sprints/ACTIVE_SPRINT.md` |
| PRD Sprint 28 (template) | `_netecmt/solutioning/prd/prd-sprint-28-hybrid-cleanup-personalization.md` |
| Roadmap Forward | `_netecmt/ROADMAP.md` |
| Contract Map | `_netecmt/core/contract-map.yaml` |
| Project Context | `_netecmt/project-context.md` |

### Arquivos-Chave para Correcao

**Rotas sem auth (Fase 1 — SIG-SEC-01):**
```
app/src/app/api/social/generate/route.ts
app/src/app/api/social/hooks/route.ts
app/src/app/api/social/structure/route.ts
app/src/app/api/social/scorecard/route.ts
app/src/app/api/design/plan/route.ts
app/src/app/api/design/generate/route.ts
app/src/app/api/design/upscale/route.ts
app/src/app/api/performance/metrics/route.ts
app/src/app/api/funnels/export/route.ts
app/src/app/api/funnels/share/route.ts
app/src/app/api/chat/route.ts
app/src/app/api/webhooks/dispatcher/route.ts
```

**Tipos para consolidar (Fase 2 — SIG-TYP-*):**
```
app/src/types/index.ts          → duplicatas Message, Conversation, Funnel
app/src/types/database.ts       → source of truth (Message, Conversation, Funnel)
app/src/types/funnel.ts         → duplicata Funnel, AutopsyReport
app/src/types/autopsy.ts        → source of truth AutopsyReport
app/src/types/social.ts         → SocialPlatform v1
app/src/types/social-inbox.ts   → SocialPlatform v2
app/src/types/vault.ts          → SocialPlatform v3
```

**Lib para refatorar (Fase 4 — SIG-ARC-*):**
```
app/src/lib/ai/pinecone.ts          → ELIMINAR (manter pinecone-client.ts)
app/src/lib/ai/vertex.ts            → ELIMINAR (codigo morto — bonus)
app/src/lib/stores/brand-store.ts   → hydration guard (Fase 1)
app/src/lib/stores/context-store.ts → hydration guard (Fase 1)
app/src/lib/stores/chat-store.ts    → reduzir a metadata (Fase 4)
```

**Componente para refatorar (Fase 4 — SIG-ARC-03):**
```
app/src/components/chat/chat-input-area.tsx → extrair 4+ hooks
```

---

## 13. Glossario

| Termo | Definicao |
|:------|:----------|
| **Sprint Sigma** | Sub-sprint de consistencia entre S28 e S29, dedicada a resolver divida tecnica P0+P1 |
| **P0** | Prioridade critica — risco ativo de seguranca ou estabilidade |
| **P1** | Prioridade alta — impacta manutencao, consistencia e escalabilidade |
| **P2** | Prioridade media — backlog para sprints futuras |
| **Gate Check** | Ponto de validacao formal entre fases (tsc + build + tests + review) |
| **Source of Truth** | Arquivo canonico unico para uma entidade de tipo — todos os outros re-exportam |
| **Hydration Guard** | Protecao contra hydration mismatch no SSR (Next.js App Router) |
| **Credit Tracking** | Rastreamento de consumo de creditos AI por brand/usuario |
| **Schwartz Model** | Modelo de awareness stages em ingles: unaware → problem → solution → product → most_aware |
| **Cross-Tenant Leak** | Vazamento de dados entre brands por falta de autenticacao/isolamento |

---

## 14. Ressalvas do Alto Conselho

O Conselho aprovou a Sprint Sigma com as seguintes ressalvas obrigatorias:

| # | Ressalva | Impacto | Validacao |
|:--|:---------|:--------|:----------|
| **R1** | **Gate Check 1 (Seguranca) e BLOQUEANTE** — Fases 2-4 NAO podem iniciar sem auth blindada e validada | Sequenciamento obrigatorio | tsc + build + tests + review de SEC-01 |
| **R2** | **Gate Check 2 (Tipos) e BLOQUEANTE** — Fases 3-4 NAO podem iniciar sem tipos consolidados | Sequenciamento obrigatorio | tsc + build + tests + review de TYP-01 a 07 |
| **R3** | **Zero funcionalidade nova** — Sprint Sigma e exclusivamente de consistencia. Nenhuma feature, nenhuma UI nova, nenhum endpoint novo | Escopo travado | Review final confirma 0 features |
| **R4** | **Retrocompatibilidade total** — Nenhuma API publica muda (URL, metodo, params). Apenas internal response shape e auth | Compatibilidade | Smoke tests das 12 rotas pos-auth |
| **R5** | **PRD precisa de Arch Review (Athos) antes de virar stories** — Governanca NETECMT v2.0 | Governanca | Status muda para "Aprovado" somente apos review |

---

*PRD formalizado por Iuran (PM) — NETECMT v2.0*  
*Sprint Sigma: Sub-Sprint de Consistencia do Codebase | 07/02/2026*  
*Tipo: Stabilization | North Star: 0 rotas sem auth + 0 tipos duplicados + 1 formato de erro unificado*  
*Baseline: 218/218 testes, tsc=0, build=103 rotas, QA=98/100*  
*Aprovacao pendente: Arch Review (Athos) — Ressalva R5 do Conselho*
