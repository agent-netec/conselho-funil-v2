# Auditoria de Consistencia do Codebase — 07/02/2026

**Versao:** 1.0
**Autor:** Claude Code (Opus 4.6) — auditoria automatizada
**Data:** 07/02/2026
**Tipo:** Auditoria Tecnica (somente leitura — nenhum codigo foi executado)
**Escopo:** 30+ API routes, 20+ type files, 18 lib modules, 15+ components, 5 stores, 15 hooks
**Para deliberacao do:** Alto Conselho (Iuran, Athos, Leticia, Darllyson, Dandara)

---

## 1. Contexto e Motivacao

### O que foi feito
Auditoria completa do codebase via leitura estatica de codigo. Nenhum comando foi executado. O objetivo foi identificar **inconsistencias, duplicacoes, gaps de seguranca e divida tecnica** que possam causar problemas agora ou escalar em sprints futuras.

### Por que agora
- Sprint 28 concluida com QA 98/100 — momento ideal para consolidar antes de avancar
- O codebase cresceu significativamente entre S13-S28 (25+ API routes, 20+ type files)
- Padroes divergiram organicamente conforme diferentes features foram implementadas
- Gaps de seguranca multi-tenant detectados em rotas fora da Intelligence Wing

### Metodologia
- Leitura de 30+ arquivos de rotas API
- Leitura de todos os arquivos em `app/src/types/`
- Leitura de 18+ modulos em `app/src/lib/`
- Leitura de 15+ componentes, 5 stores, 15 hooks
- Cross-reference entre tipos declarados e uso real nas rotas

---

## 2. Resumo Executivo

### Indicadores de Saude

| Dimensao | Score | Tendencia |
|:---------|:------|:----------|
| Seguranca (auth/multi-tenant) | 4/10 | Risco ativo |
| Consistencia de tipos | 3/10 | Divida crescente |
| Consistencia de API | 4/10 | Divida estavel |
| Arquitetura lib/ | 5/10 | Confusao pontual |
| Componentes/State | 5/10 | Divida moderada |
| Codigo morto | 6/10 | Gerenciavel |

### Veredicto
O core funcional esta solido (Gemini, Pinecone, Firebase, RAG). Os problemas estao nas **bordas**: rotas sem auth, tipos duplicados com estruturas conflitantes, logica copy-paste, e estado duplicado no frontend. Nenhum problema e catastrofico isoladamente, mas **o acumulo cria risco composto**.

---

## 3. Achados Criticos (P0) — Requerem acao imediata

### 3.1 SEGURANCA: 12 rotas API sem autenticacao

**Impacto:** Qualquer usuario pode acessar dados/gerar conteudo de qualquer brand. Viola isolamento multi-tenant.

**Rotas da Intelligence Wing (CORRETAS — tem `requireBrandAccess()`):**
- `/api/intelligence/keywords` — protegida
- `/api/intelligence/autopsy/run` — protegida
- `/api/intelligence/spy` — protegida
- `/api/intelligence/audience/scan` — protegida
- `/api/intelligence/creative/copy` — protegida

**Rotas SEM autenticacao (VULNERAVEIS):**

| # | Rota | Arquivo | Risco |
|:--|:-----|:--------|:------|
| 1 | `/api/social/generate` | `app/src/app/api/social/generate/route.ts` | Gera conteudo sem verificar brand ownership |
| 2 | `/api/social/hooks` | `app/src/app/api/social/hooks/route.ts` | Sem auth |
| 3 | `/api/social/structure` | `app/src/app/api/social/structure/route.ts` | Sem auth |
| 4 | `/api/social/scorecard` | `app/src/app/api/social/scorecard/route.ts` | Sem auth |
| 5 | `/api/design/plan` | `app/src/app/api/design/plan/route.ts` | Sem auth |
| 6 | `/api/design/generate` | `app/src/app/api/design/generate/route.ts` | Sem auth |
| 7 | `/api/design/upscale` | `app/src/app/api/design/upscale/route.ts` | Sem auth |
| 8 | `/api/performance/metrics` | `app/src/app/api/performance/metrics/route.ts` | Sem auth |
| 9 | `/api/funnels/export` | `app/src/app/api/funnels/export/route.ts` | Exporta funil sem verificar acesso |
| 10 | `/api/funnels/share` | `app/src/app/api/funnels/share/route.ts` | Compartilha funil sem auth |
| 11 | `/api/chat` | `app/src/app/api/chat/route.ts` | Sem auth explicita, depende de lookup |
| 12 | `/api/webhooks/dispatcher` | `app/src/app/api/webhooks/dispatcher/route.ts` | Apenas validacao de assinatura |

**Correcao proposta:** Adicionar `requireBrandAccess(req, brandId)` em todas as rotas acima, seguindo o padrao da Intelligence Wing.
**Esforco estimado:** 3h

---

### 3.2 TIPOS DUPLICADOS: mesma entidade, estruturas conflitantes

**Impacto:** Componentes importam de arquivos diferentes e recebem tipos incompativeis. Causa bugs silenciosos em runtime.

#### 3.2.1 Message — 2 definicoes conflitantes

| Campo | `index.ts` (L6-15) | `database.ts` (L439-450) |
|:------|:-------------------|:------------------------|
| timestamp | `Date` | `Timestamp` (Firestore) |
| conversationId | ausente | presente |
| metadata.sources | `string[]` | `any[]` |
| metadata.scorecard | ausente | `Scorecard` |

#### 3.2.2 Conversation — 2 definicoes conflitantes

| Campo | `index.ts` (L17-23) | `database.ts` (L422-434) |
|:------|:-------------------|:------------------------|
| messages | `Message[]` (embarcado) | subcollection (separado) |
| tenantId | ausente | presente |
| userId | ausente | presente |
| context | ausente | `{ funnelId?, mode }` |
| timestamps | `Date` | `Timestamp` |

#### 3.2.3 Funnel — 3 definicoes incompativeis

| Campo | `index.ts` (L115-126) | `funnel.ts` (L7-21) | `database.ts` (L224-287) |
|:------|:---------------------|:--------------------|:------------------------|
| status | `draft\|generating\|review\|...` | `active\|draft\|archived` | `draft\|generating\|review\|...` |
| timestamps | `Date` | `Timestamp` | `Timestamp` |
| tenantId | ausente | ausente | presente |
| context | `FunnelContext` | ausente | `FunnelContext` (diferente) |

**Nota:** `FunnelContext` em `database.ts` tem AMBOS `channel` (novo) E `channels` (legado) coexistindo (L277-286).

#### 3.2.4 AutopsyReport — 2 estruturas completamente diferentes

| Campo | `autopsy.ts` (L21-37) | `funnel.ts` (L47-69) |
|:------|:---------------------|:--------------------|
| score | `score: number` | `overallHealth: number` |
| gaps | ausente | `criticalGaps: CriticalGap[]` |
| heuristics | `{ hook, story, offer, friction, trust }` | ausente |
| recommendations | `Recommendation[]` | `actionPlan: [...]` |

#### 3.2.5 SocialPlatform — 3 definicoes com valores diferentes

| Arquivo | Valores | Casing |
|:--------|:--------|:-------|
| `social.ts` (L8) | `instagram\|tiktok\|linkedin\|x\|whatsapp` | lowercase |
| `social-inbox.ts` (L7) | `x\|linkedin\|instagram\|whatsapp` | lowercase (sem tiktok) |
| `vault.ts` (L5) | `X\|LinkedIn\|Instagram` | PascalCase (sem whatsapp, tiktok) |

**Correcao proposta:** Eleger `database.ts` como source of truth. Consolidar `SocialPlatform` em arquivo unico. Remover duplicatas em `index.ts` e `funnel.ts`.
**Esforco estimado:** 4h

---

### 3.3 STORES SEM PROTECAO DE HIDRATACAO SSR

**Impacto:** Hydration mismatch no Next.js App Router. Pode causar crash ou estado inconsistente no primeiro render.

| Store | Arquivo | Usa `persist()`? | Tem hydration guard? |
|:------|:--------|:-----------------|:--------------------|
| `brand-store` | `app/src/lib/stores/brand-store.ts` (L21-40) | Sim | **NAO** |
| `context-store` | `app/src/lib/stores/context-store.ts` (L27-61) | Sim | **NAO** |
| `auth-store` | `app/src/lib/stores/auth-store.ts` (L25-54) | Nao | Parcial |
| `chat-store` | `app/src/lib/stores/chat-store.ts` | Nao | N/A |
| `notification-store` | `app/src/lib/stores/notification-store.ts` | Nao | N/A |

**Correcao proposta:** Adicionar `typeof window !== 'undefined'` guard ou `skipHydration` nos stores persistidos.
**Esforco estimado:** 30min

---

### 3.4 `force-dynamic` AUSENTE EM 7 ROTAS

**Impacto:** Vercel pode cachear respostas de rotas dinamicas em producao, retornando dados stale.

| Rota | Tem `runtime`? | Tem `dynamic`? |
|:-----|:--------------|:--------------|
| `campaigns/[id]/generate-ads` | sim | **NAO** |
| `funnels/share` | sim | **NAO** |
| `funnels/export` | sim | **NAO** |
| `decisions` | sim | **NAO** |
| `copy/decisions` | sim | **NAO** |
| `webhooks/dispatcher` | nao | **NAO** |
| `performance/metrics` | nao | **NAO** |

**Correcao proposta:** Adicionar `export const dynamic = 'force-dynamic'` em cada rota.
**Esforco estimado:** 15min

---

## 4. Achados de Alta Prioridade (P1) — Proxima sprint

### 4.1 CREDITOS AI: 10 rotas consomem Gemini sem rastrear uso

**Impacto:** Impossivel calcular custo real por brand/usuario. Cost Guard perde eficacia.

**Rotas COM credit tracking (padrao correto):**
- `/api/copy/generate` — deduz 1 credito
- `/api/ai/analyze-visual` — deduz 2 creditos
- `/api/design/generate` — deduz 5 creditos
- `/api/chat` — deducao condicional

**Rotas SEM credit tracking:**

| # | Rota | Consome AI? |
|:--|:-----|:-----------|
| 1 | `/api/design/plan` | Sim (Gemini) |
| 2 | `/api/design/upscale` | Sim (Google AI) |
| 3 | `/api/social/generate` | Sim (Gemini) |
| 4 | `/api/social/hooks` | Sim (Gemini) |
| 5 | `/api/social/structure` | Sim (Gemini) |
| 6 | `/api/social/scorecard` | Sim (Gemini) |
| 7 | `/api/intelligence/creative/copy` | Sim (CopyGenerationLab) |
| 8 | `/api/intelligence/keywords` | Sim (KeywordMiner) |
| 9 | `/api/funnels/generate` | Sim (Gemini) |
| 10 | `/api/campaigns/[id]/generate-ads` | Sim (Gemini) |

**Esforco estimado:** 2h

---

### 4.2 DOIS CLIENTES PINECONE INCOMPATIVEIS

**Impacto:** Misturar async/sync no mesmo recurso causa comportamento imprevisivelvel.

| Arquivo | Tipo | Consumers |
|:--------|:-----|:----------|
| `app/src/lib/ai/pinecone.ts` (L22-42) | `async getPineconeIndex()` | context-assembler, dossier-generator |
| `app/src/lib/ai/pinecone-client.ts` (L29-55) | `sync getPineconeIndex()` | pinecone-migration |

**Correcao proposta:** Manter `pinecone-client.ts` como unica implementacao. Migrar consumers de `pinecone.ts`.
**Esforco estimado:** 2h

---

### 4.3 ESTADO DUPLICADO: chat-store vs useConversations

**Impacto:** Duas fontes de verdade para a mesma conversa. Componentes podem usar qualquer uma, criando divergencia.

| Fonte | Arquivo | O que mantem |
|:------|:--------|:-------------|
| `chat-store.ts` | `app/src/lib/stores/chat-store.ts` (L24-121) | `currentConversation` in-memory |
| `useConversations()` | `app/src/lib/hooks/use-conversations.ts` (L74-177) | `messages[]` com real-time Firestore |

**Correcao proposta:** Eleger `useConversations()` como source of truth (tem real-time). Reduzir chat-store a metadata apenas.
**Esforco estimado:** 3h

---

### 4.4 CINCO FORMATOS DE ERRO NAS APIS

**Impacto:** Frontend nao consegue tratar erros de forma uniforme. Cada rota retorna shape diferente.

```
Formato A: { error: 'string' }                     → social/*, design/plan
Formato B: { error: 'string', details: '...' }     → ai/analyze-visual, copy/generate
Formato C: { error: 'string', code: 'CODE' }       → intelligence/analyze
Formato D: errorResponse(500, msg, 'CODE', reqId)   → intelligence/keywords
Formato E: { success: false, message: '...' }       → performance/metrics
```

**Correcao proposta:** Criar `lib/utils/api-response.ts` com `createApiError()` e `createApiSuccess()`. Migrar todas as rotas.
**Esforco estimado:** 3h

---

### 4.5 COMPONENTE MONOLITICO: chat-input-area.tsx (391 linhas, 5+ responsabilidades)

**Impacto:** Impossivel testar, manter ou reusar partes individuais.

| Responsabilidade | Linhas | Deveria ser |
|:-----------------|:-------|:------------|
| Validacao/upload de arquivos | 66-156 | `useFileUpload()` hook |
| Analise multimodal Gemini | 133 | `useMultimodalAnalysis()` hook |
| Criacao de documentos Firestore | 102-121 | Dentro do hook de upload |
| Party mode counselors | 160-170 | `usePartyMode()` hook |
| Construcao de mensagem | 188-217 | `useChatMessage()` hook |
| UI com drag-drop | 387-397 | Componente puro |

**Esforco estimado:** 4h para refatorar

---

## 5. Achados de Media Prioridade (P2) — Backlog

### 5.1 LOGICA DUPLICADA COPY-PASTE

| Codigo duplicado | Onde aparece | Linhas identicas |
|:-----------------|:-------------|:-----------------|
| JSON parsing (strip markdown) | `social/hooks`, `social/scorecard`, `social/structure` | ~18 linhas cada |
| Brand context loading | Mesmos 3 arquivos acima | ~16 linhas cada |
| `estimateTokens()` | `cost-guard.ts`, `context-assembler.ts` + 6 outros | `Math.ceil(length/4)` |
| `cosineSimilarity()` | `vertex.ts` (L92-107), `embeddings.ts` (L49-61) | Identico |
| `AI_PRESETS` | `brand-kit-form.tsx` (L21-26), `OfferBuilder.tsx` | Mesmo objeto |
| `STATUS_COLORS` | `funnel-analytics.tsx` (L33-42) | Hardcoded |

**Correcao proposta:** Extrair para `lib/utils/ai-helpers.ts` (JSON, tokens, similarity) e `lib/constants/` (presets, colors).
**Esforco estimado:** 2h

---

### 5.2 CODIGO MORTO

| Arquivo | Linhas | Motivo |
|:--------|:-------|:-------|
| `app/src/lib/ai/vertex.ts` | 218 | 0 imports encontrados. Wrapper redundante do Gemini. Artefato de migracao. |
| `FunnelContext.channels` em `database.ts` (L282-286) | ~5 | Legado coexistindo com `channel` (L277-281) |
| `awareness: 'fria'\|'morna'\|'quente'` vs `'unaware'\|'problem'\|'solution'\|'product'` | - | Dois modelos de awareness conflitantes entre index.ts e database.ts |

**Esforco estimado:** 1h

---

### 5.3 FIREBASE SEM GATEWAY CENTRALIZADO

**Impacto:** 20+ arquivos importam `db` diretamente de `@/lib/firebase/config`. Sem camada intermediaria para logging, error handling, rate limiting ou audit trail.

**Arquivos que importam `db` diretamente (amostra):**
- `cost-guard.ts` (L7)
- `context-assembler.ts` (L9)
- `embeddings.ts` (L8)
- `rag.ts` (L5)
- + 16 outros

**Correcao proposta:** Criar `lib/firebase/gateway.ts` que abstrai queries com error handling e logging.
**Esforco estimado:** 1 sprint dedicado

---

### 5.4 INCONSISTENCIAS MENORES

| Item | Detalhe | Impacto |
|:-----|:--------|:--------|
| `req` vs `request` | Intelligence usa `req`, Social usa `request` | Baixo (convencao) |
| `loading` vs `isLoading` | Hooks de intelligence usam `loading`, outros `isLoading` | Medio (API inconsistente) |
| `snake_case` em types | `market_data`, `performance_metrics`, `meta_ads` | Baixo (convencao) |
| Gemini model redundante | Agentes passam `process.env.GEMINI_MODEL \|\| 'gemini-2.0-flash'` em vez de `DEFAULT_GEMINI_MODEL` | Baixo |
| Styling misto | Tailwind puro + shadcn/ui + `card-premium` custom | Medio |
| Error boundary subutilizado | `error-boundary.tsx` existe mas nenhum componente critico o usa | Medio |
| Loading states inconsistentes | Skeleton, animate-pulse, texto '—' — 3 padroes diferentes | Baixo |
| Hook return signatures | `useActiveBrand` retorna primitivo, `useBrandAssets` sem error, `loading` vs `isLoading` | Medio |

---

## 6. Date vs Timestamp — Problema transversal

**Impacto:** `index.ts` usa `Date` para timestamps, mas Firestore retorna `Timestamp`. Comparacoes e serializacao falham silenciosamente.

| Arquivo | Campos afetados | Tipo usado |
|:--------|:---------------|:-----------|
| `index.ts` (L10, 21-22, 124-125) | `timestamp`, `createdAt`, `updatedAt` | `Date` |
| `database.ts` (todas as interfaces) | Todos timestamps | `Timestamp` |
| `funnel.ts` (L19-20) | `createdAt`, `updatedAt` | `Timestamp` |

**Correcao:** Migrar `index.ts` para `Timestamp` em todos os campos de data.

---

## 7. Awareness Stage — Dois modelos conflitantes

| Arquivo | Modelo | Valores |
|:--------|:-------|:--------|
| `index.ts` (FunnelContext) | Ingles (padrao Schwartz) | `unaware\|problem\|solution\|product` |
| `database.ts` (FunnelContext) | Portugues (temperatura) | `fria\|morna\|quente` |

**Impacto:** Rotas que leem de `database.ts` e componentes que esperam `index.ts` vao divergir.

---

## 8. Plano de Acao Proposto

### Opcao A: Sprint dedicada de consistencia (tipo S26)
Congela features por 1 sprint. Resolve todos os P0 e P1. Historico mostra que S26 (tech debt) elevou QA de 93 para 97.

### Opcao B: Fase de consistencia dentro de sprint hibrida (tipo S27/S28)
Resolve P0 como Fase 1 (gate), depois avanca com features como Fase 2.

### Opcao C: Resolver P0 imediatamente + backlog P1/P2 nas sprints seguintes
Minimo esforco agora (auth + hydration + force-dynamic), resto distribuido.

---

### Tabela de Esforco por Prioridade

| Prioridade | Itens | Esforco Total | Impacto |
|:-----------|:------|:-------------|:--------|
| **P0** | Auth nas 12 rotas, tipos duplicados, hydration stores, force-dynamic | **~8h** | Seguranca + estabilidade |
| **P1** | Credit tracking, Pinecone dual, chat state, error format, chat-input refactor | **~14h** | Consistencia + manutencao |
| **P2** | Copy-paste cleanup, codigo morto, Firebase gateway, convencoes | **~8h + 1 sprint** | Arquitetura |
| **Total P0+P1** | | **~22h** | Cobre 80% dos problemas |

---

## 9. Matriz de Risco

| Risco | Se nao corrigir | Probabilidade | Severidade |
|:------|:----------------|:-------------|:-----------|
| Acesso cross-tenant via rotas sem auth | Vazamento de dados entre brands | Alta | Critica |
| Hydration mismatch nos stores | Crash no primeiro render (SSR) | Media | Alta |
| Tipos conflitantes escalam com features | Bugs silenciosos multiplicam | Alta | Alta |
| Credit tracking incompleto | Custo AI sem controle por brand | Alta | Media |
| Codigo duplicado copy-paste | Bugs em N lugares ao corrigir 1 | Media | Media |
| Estado duplicado chat | Dados inconsistentes na UI | Media | Media |

---

## 10. Arquivos-Chave para Referencia

### Rotas sem auth (para correcao)
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

### Tipos para consolidar
```
app/src/types/index.ts          → duplicatas de Message, Conversation, Funnel, Scorecard
app/src/types/database.ts       → source of truth candidato
app/src/types/funnel.ts         → FunnelDocument e AutopsyReport duplicados
app/src/types/autopsy.ts        → AutopsyReport alternativo
app/src/types/social.ts         → SocialPlatform v1
app/src/types/social-inbox.ts   → SocialPlatform v2
app/src/types/vault.ts          → SocialPlatform v3
```

### Lib para refatorar
```
app/src/lib/ai/pinecone.ts          → eliminar (manter pinecone-client.ts)
app/src/lib/ai/vertex.ts            → eliminar (codigo morto)
app/src/lib/ai/cost-guard.ts        → separar Firestore ops de cost logic
app/src/lib/ai/context-assembler.ts → extrair data access, simplificar
app/src/lib/stores/brand-store.ts   → adicionar hydration guard
app/src/lib/stores/context-store.ts → adicionar hydration guard
```

### Componentes para refatorar
```
app/src/components/chat/chat-input-area.tsx → extrair em hooks menores
```

---

## 11. Historico de Referencia

| Sprint | Tipo | Problema | Resultado |
|:-------|:-----|:---------|:----------|
| S22 | Stabilization | Build quebrado, erros 400/500 | QA baseline estabelecido |
| S26 | Tech Debt | 161 erros TypeScript em 73 arquivos | 161→0 erros, QA 93→97 |
| S27 | Hybrid | 14 test suites falhando, dead code | 14→1 suites, attribution ativado |
| S28 | Hybrid | Blocking gates, RAG stubs, middleware | QA 97→98 |
| **Agora** | **Auditoria** | **12 rotas sem auth, tipos x3, estado duplicado** | **Pendente deliberacao** |

---

*Documento gerado por auditoria automatizada via Claude Code (Opus 4.6)*
*Conselho de Funil — Agency Engine | 07/02/2026*
*Para deliberacao do Alto Conselho na proxima sessao de planejamento*
