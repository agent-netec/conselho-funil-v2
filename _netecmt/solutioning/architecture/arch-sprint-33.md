# Architecture Review: Sprint 33 — Content Autopilot Foundation

**Versao:** 1.0
**Responsavel:** Athos (Architect)
**Status:** APROVADO COM RESSALVAS (10 Decision Topics, 3 Blocking)
**Data:** 08/02/2026
**PRD Referencia:** `prd-sprint-33-content-autopilot-foundation.md` (Iuran)
**Baseline:** Sprint 32 concluida (QA 91/100, 257/257 testes, tsc=0, 105 rotas)

---

## 1. Escopo do Review

Validacao arquitetural de 5 dominios + 1 STRETCH da Sprint 33:
- **S33-GOV:** Governanca & Divida S32 (zod, timer leak, Instagram domain, social_interactions)
- **S33-CAL:** Calendario Editorial (data model + CRUD + UI + drag reorder)
- **S33-GEN:** Content Generation Pipeline (engine + 4 formatos + Brand Voice)
- **S33-APR:** Approval Workflow (state machine + history + UI review)
- **S33-BV:** (STRETCH) BrandVoice 2.0 — engagementScore

### 1.1 Documentos Analisados

| Documento | Status |
|:----------|:-------|
| PRD Sprint 33 (Iuran) | Lido integralmente — 401 linhas |
| contract-map.yaml | Lido — 191 linhas, 17 lanes existentes |
| arch-sprint-32.md | Lido — referencia de formato e DTs |
| firestore.ts (helpers) | Lido — patterns CRUD, subcollections, Timestamp |
| vault.ts (MonaraTokenVault) | Lido — subcollection `brands/{brandId}/secrets` |
| scoped-data.ts | Lido — pattern `brands/{brandId}/{collection}` |
| gemini.ts | Lido — `generateWithGemini()`, `responseMimeType`, `system_instruction` |
| api-response.ts | Lido — `createApiError()`, `createApiSuccess()` |
| brand-guard.ts | Lido — `requireBrandAccess(req, brandId)` |
| rate-limiter.ts | Lido — `runTransaction()` pattern, `writeBatch` nao usado |
| constants.ts (NAV_GROUPS) | Lido — 5 grupos, sidebar structure |
| social-generation.ts | Lido — prompt pattern com placeholders |
| jest.setup.js | Lido — mocks globais, polyfills |
| types/social.ts | Lido — SocialInteraction, VoiceGuidelines |
| types/social-inbox.ts | Lido — SocialInteraction (variante inbox), BrandVoiceSuggestion |

### 1.2 Patterns Sigma Confirmados no Codebase

| Pattern | Evidencia | Arquivo Referencia |
|:--------|:----------|:-------------------|
| `createApiError(status, msg)` | 54+ rotas | `lib/utils/api-response.ts` |
| `createApiSuccess(data)` | 54+ rotas | `lib/utils/api-response.ts` |
| `requireBrandAccess(req, brandId)` | 25+ rotas | `lib/auth/brand-guard.ts` |
| `Timestamp.now()` (nao Date) | Todos os CRUD helpers | `lib/firebase/firestore.ts` |
| `export const dynamic = 'force-dynamic'` | Todas as rotas dinamicas | `app/api/social-inbox/route.ts` (ex.) |
| Subcollection `brands/{brandId}/*` | secrets, rate_limits, vault/* | `lib/firebase/vault.ts` |
| `generateWithGemini()` + JSON mode | Response Engine S32 | `lib/ai/gemini.ts` |
| Prompts em `lib/ai/prompts/` | social-generation.ts, audience-scan.ts | `lib/ai/prompts/` |
| `writeBatch()` para atomic multi-doc | assets.ts, agency engine | `lib/firebase/assets.ts` |
| `runTransaction()` para atomic r/w | rate-limiter.ts | `lib/middleware/rate-limiter.ts` |

---

## 2. Decision Topics (DT-01 a DT-10)

### DT-01: Timer Leak — Estrategia de Cleanup (NON-BLOCKING)

**Problema:** Warning `worker has failed to exit gracefully` nos testes Jest (Nota N4 S32). O `jest.setup.js` importa `MessageChannel` de `node:worker_threads` e polyfills globais (ReadableStream, TransformStream, WritableStream). Algum modulo sob teste provavelmente usa `setTimeout`/`setInterval` sem cleanup, ou o polyfill de `MessageChannel` mantem handles abertos.

**Analise do Codebase:**
- `jest.setup.js` importa: `TextDecoder`, `TextEncoder`, `ReadableStream`, `TransformStream`, `WritableStream`, `MessageChannel`, `webcrypto.subtle`
- Nao ha `afterAll` global para cleanup de timers
- Mocks do Firebase (`onSnapshot`) retornam `jest.fn()` corretamente

**Opcoes:**
- A) Adicionar `afterAll` global no `jest.setup.js` com `jest.clearAllTimers()` e cleanup de MessageChannel
- B) Configurar `--forceExit` no Jest config (mascara o problema)
- C) Investigar per-test: adicionar `--detectOpenHandles` para identificar leak especifico

**Decisao: Opcao A + C combinadas**
1. Adicionar `afterAll` global no `jest.setup.js`:
```js
afterAll(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
```
2. Rodar `npx jest --detectOpenHandles` uma vez para identificar a fonte exata
3. Se `MessageChannel` for a causa, avaliar se o polyfill e realmente necessario (pode ser removido se nenhum teste depende dele diretamente)

**Impacto:** S33-GOV-02. Estimativa mantida em ~45min (inclui investigacao).

---

### DT-02: social_interactions — Subcollection vs Top-Level (NON-BLOCKING)

**Problema:** Onde armazenar `social_interactions`? Top-level com brandId field ou subcollection?

**Analise do Codebase:**
- Pattern estabelecido: `brands/{brandId}/secrets`, `brands/{brandId}/rate_limits`, `brands/{brandId}/vault/*`
- TODOS os dados brand-scoped usam subcollection
- Isolamento multi-tenant por path (P-08)

**Decisao: Subcollection `brands/{brandId}/social_interactions`**
Justificativa: Consistencia total com patterns existentes. Firestore security rules podem restringir por path. Zero risco cross-tenant.

**Schema validado:**
```typescript
interface SocialInteractionRecord {
  id: string;
  authorId: string;
  authorName: string;
  platform: 'instagram' | 'linkedin' | 'x' | 'tiktok';
  content: string;
  sentiment: number;         // 0.0 a 1.0
  responseId?: string;       // Link para resposta gerada
  engagementScore?: number;  // 0.0 a 1.0 (STRETCH S33-BV-01)
  brandId: string;
  createdAt: Timestamp;
}
```

**Observacao:** O type deve ser adicionado em `types/social.ts` (arquivo existente com tipos sociais). NAO criar arquivo novo — extender o existente.

**Impacto:** S33-GOV-04.

---

### DT-03: content_calendar — Subcollection Design (NON-BLOCKING)

**Problema:** Confirmar design de subcollection para `content_calendar` e validar campos.

**Decisao: Subcollection `brands/{brandId}/content_calendar`**
Alinhado com todos os patterns do projeto. Campo `order` (number) para reorder intra-dia.

**Schema validado com ajustes:**
```typescript
interface CalendarItem {
  id: string;
  title: string;
  format: 'post' | 'story' | 'carousel' | 'reel';
  platform: 'instagram' | 'linkedin' | 'x' | 'tiktok';
  scheduledDate: Timestamp;  // NAO Date (P-06)
  status: CalendarItemStatus;
  content: string;           // Corpo do conteudo gerado/editado
  metadata: {
    generatedBy?: 'ai' | 'manual';
    promptParams?: Record<string, string>;
    generationModel?: string;
    generatedAt?: Timestamp;
  };
  order: number;             // Posicao no dia (para reorder)
  brandId: string;           // Redundante com path mas necessario para queries
  createdBy?: string;        // userId — audit trail (AJUSTE Athos)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

type CalendarItemStatus = 
  | 'draft' 
  | 'pending_review' 
  | 'approved' 
  | 'scheduled' 
  | 'published' 
  | 'rejected';
```

**Ajuste Athos:** Adicionei `createdBy` (userId) para audit trail. O PRD nao menciona, mas e essencial para saber quem criou/editou o item no contexto de equipes. Campo opcional para nao quebrar fluxo de geracao automatica.

**Impacto:** S33-CAL-01, `types/content.ts` (novo).

---

### DT-04: Date Range Query — Composite Index vs In-Memory Sort (BLOCKING)

**Problema:** A query `getCalendarItems(brandId, startDate, endDate)` precisa filtrar por range de `scheduledDate`. Firestore pode exigir composite index se combinarmos range + orderBy em campos diferentes.

**Analise do Codebase:**
- Pattern existente: `getUserFunnels()` e `getUserConversations()` usam query simples + sort in-memory
- `getFunnelProposals()` usa `orderBy('version', 'desc')` (single field, no composite index)
- O projeto evita sistematicamente composite indexes

**Decisao: Range query simples + in-memory sort**
```typescript
// Query Firestore: range no mesmo campo (NAO precisa composite index)
const q = query(
  collection(db, 'brands', brandId, 'content_calendar'),
  where('scheduledDate', '>=', startTimestamp),
  where('scheduledDate', '<=', endTimestamp)
);
const snapshot = await getDocs(q);
// Sort in-memory por scheduledDate e order
const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
return items.sort((a, b) => {
  const dateDiff = a.scheduledDate.seconds - b.scheduledDate.seconds;
  return dateDiff !== 0 ? dateDiff : a.order - b.order;
});
```

**BLOCKING porque:** Se Darllyson usar `where() + orderBy('order')` (campos diferentes), o Firestore exigira composite index e falhara em runtime sem ele. O pattern DEVE ser range query + in-memory sort.

**Nota tecnica:** Range queries em um UNICO campo (`scheduledDate >= X AND scheduledDate <= Y`) NAO requerem composite index no Firestore. Isso e documentado na SDK.

**Impacto:** S33-CAL-01, S33-CAL-02.

---

### DT-05: Drag Reorder — Optimistic Update + writeBatch (BLOCKING)

**Problema:** Ao arrastar um item entre dias ou reordenar dentro do mesmo dia, multiplos documentos precisam ser atualizados (campo `order` e possivelmente `scheduledDate`). Como fazer isso atomicamente?

**Opcoes:**
- A) Update sequencial: `updateDoc()` para cada item alterado (N writes, nao atomico)
- B) `writeBatch()` para atualizar todos os items afetados em uma unica operacao atomica
- C) `runTransaction()` com read-then-write (overhead desnecessario — nao precisamos ler antes)

**Analise do Codebase:**
- `writeBatch()` ja e usado em `assets.ts`, `agency/engine.ts`, `assets-server.ts` — pattern estabelecido
- `runTransaction()` e usado para rate-limiter (precisa de read atomico) — nao e o caso aqui

**Decisao: Opcao B (writeBatch)**
```typescript
async function reorderCalendarItems(
  brandId: string, 
  updates: Array<{ itemId: string; order: number; scheduledDate?: Timestamp }>
): Promise<void> {
  const batch = writeBatch(db);
  for (const { itemId, order, scheduledDate } of updates) {
    const ref = doc(db, 'brands', brandId, 'content_calendar', itemId);
    const updateData: Record<string, unknown> = { order, updatedAt: Timestamp.now() };
    if (scheduledDate) updateData.scheduledDate = scheduledDate;
    batch.update(ref, updateData);
  }
  await batch.commit();
}
```

**BLOCKING porque:** Se Darllyson usar updates sequenciais, um erro parcial deixa o calendario em estado inconsistente (items com `order` duplicado). `writeBatch` garante atomicidade.

**UI pattern:** Optimistic update no state local (React) → chamada API → revert on error.

**Impacto:** S33-CAL-01, S33-CAL-02. Firestore mock no `jest.setup.js` precisara de `writeBatch: jest.fn(() => ({ update: jest.fn(), commit: jest.fn().mockResolvedValue(undefined) }))`.

---

### DT-06: Prompts de Geracao — Arquivo Separado (NON-BLOCKING)

**Problema:** Os 4 prompts de geracao de conteudo (post, story, carousel, reel) devem ficar inline no engine ou em arquivo separado?

**Analise do Codebase:**
- Pattern claro: `lib/ai/prompts/social-generation.ts` (4 prompts exportados: HOOKS, STRUCTURE, SCORECARD, RESPONSE)
- `lib/ai/prompts/audience-scan.ts`, `lib/ai/prompts/chat-system.ts`, `lib/ai/prompts/performance-advisor.ts`
- Todos os prompts complexos vivem em `lib/ai/prompts/`

**Decisao: Arquivo separado `lib/ai/prompts/content-generation.ts`**
Justificativa: Consistencia total com o pattern. O arquivo exportara 4 constantes + 1 system instruction:
- `CONTENT_POST_PROMPT` — Post feed
- `CONTENT_STORY_PROMPT` — Story
- `CONTENT_CAROUSEL_PROMPT` — Carousel outline
- `CONTENT_REEL_PROMPT` — Reel script
- `CONTENT_SYSTEM_INSTRUCTION` — Brand Voice injection base

**Nota de cross-lane:** O path `app/src/lib/ai/prompts/content-generation.ts` esta sob o glob `app/src/lib/ai/**` da lane `ai_retrieval`. DEVE ser explicitamente registrado na lane `content_autopilot` no contract-map. Conflito resolvido pelo principio de single-ownership: o arquivo pertence a `content_autopilot` (criado por S33), e a lane `ai_retrieval` deve ser anotada com exclusao.

**Impacto:** S33-GEN-02. Ver DT-10 para contract-map.

---

### DT-07: Zod Schemas — Um por Formato vs Discriminated Union (NON-BLOCKING)

**Problema:** O output do Gemini para geracao de conteudo tem 4 formatos distintos. Usar um Zod schema por formato ou discriminated union?

**Analise:**
- 4 formatos com outputs MUITO diferentes:
  - Post: `{ text, hashtags[], cta, visualSuggestion }`
  - Story: `{ text, backgroundSuggestion, stickerSuggestions[], ctaSwipeUp? }`
  - Carousel: `{ title, slides[]{title, body}, ctaFinal, coverSuggestion }`
  - Reel: `{ hook, scenes[]{timing, script, overlay}, musicReference, ctaFinal }`
- S32 usou Zod schema unico por tipo (SocialResponseSchema)

**Decisao: Um schema por formato (4 schemas nomeados)**
```typescript
export const PostOutputSchema = z.object({...});
export const StoryOutputSchema = z.object({...});
export const CarouselOutputSchema = z.object({...});
export const ReelOutputSchema = z.object({...});

// Mapa para selecao dinamica
export const CONTENT_SCHEMAS = {
  post: PostOutputSchema,
  story: StoryOutputSchema,
  carousel: CarouselOutputSchema,
  reel: ReelOutputSchema,
} as const;
```
Justificativa: Os outputs sao estruturalmente diferentes demais para discriminated union ser util. 4 schemas separados com mapa de selecao e mais legivel e permite validacao especifica por formato.

**Impacto:** S33-GEN-02. Schemas devem viver em `types/content.ts` (junto com os types) ou dentro do `content-generation.ts` (junto com os prompts). Recomendo `types/content.ts` para co-localizacao com os types.

---

### DT-08: State Machine — Adjacency Map Hardcoded (BLOCKING)

**Problema:** Como implementar a validacao de transicoes de status no approval workflow?

**Opcoes:**
- A) Adjacency map hardcoded (Record com transicoes validas)
- B) State machine library (ex: xstate)
- C) Switch/case no handler

**Decisao: Opcao A (Adjacency map)**
```typescript
const VALID_TRANSITIONS: Record<CalendarItemStatus, CalendarItemStatus[]> = {
  draft: ['pending_review', 'rejected'],
  pending_review: ['approved', 'rejected'],
  approved: ['scheduled', 'rejected'],
  scheduled: ['published', 'rejected'],
  published: [],  // Terminal — ZERO transicao permitida
  rejected: ['draft'],  // Re-edit: volta para draft
};

function isValidTransition(from: CalendarItemStatus, to: CalendarItemStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}
```

**BLOCKING porque:** Se a validacao nao for implementada como mapa de adjacencia com ZERO estado skipavel, o workflow pode permitir transicoes invalidas (ex: `draft` → `scheduled` pulando review). O mapa DEVE ser a source of truth.

**Ajuste Athos vs PRD:** O PRD diz "qualquer estado (exceto published) → rejected". Isso inclui `rejected → rejected` (no-op). Recomendo:
- `rejected → draft` (re-edit) ✅
- `rejected → rejected` = no-op (ignorar, nao erro)
- `published → *` = ALWAYS erro (terminal)

**Contagem de estados:** O PRD menciona "7 estados" mas a lista tem 6 (`draft`, `pending_review`, `approved`, `scheduled`, `published`, `rejected`). Nao e bloqueante — provavelmente conta `rejected → draft` como "7o estado". A implementacao deve ter 6 valores no enum.

**Impacto:** S33-APR-01.

---

### DT-09: Sidebar Integration — Grupo e Posicionamento (NON-BLOCKING)

**Problema:** Em qual `NavGroup` colocar os items "Content Calendar" e "Content Review"?

**Analise do NAV_GROUPS existente:**
- `intelligence` — Dados e insights (Discovery, Attribution, LTV, Journey)
- `strategy` — Planejamento (Funis, Offer Lab, Autopsy, Copy)
- `execution` — Operacao (Campanhas, Ads, Social, Social Inbox, Automacao)
- `management` — Governanca (Marcas, Brand Hub, Assets, Vault)
- `system` — Config (Settings, Integrations)

**Decisao: Grupo `execution`**
Justificativa: Content Calendar e Content Review sao atividades operacionais (criacao e aprovacao de conteudo). Ficam naturalmente ao lado de Social, Social Inbox e Automacao.

**Posicionamento no array:**
```typescript
// Grupo execution — items atuais + novos
items: [
  { id: 'campaigns', ... },
  { id: 'ads-chat', ... },
  { id: 'social', ... },
  { id: 'social-inbox', ... },
  // === S33 — Novos items ===
  { id: 'content-calendar', label: 'Calendario', href: '/content/calendar', icon: 'Calendar' },
  { id: 'content-review', label: 'Aprovacoes', href: '/content/review', icon: 'ClipboardCheck' },
  // ===
  { id: 'automation', ... },
]
```

**Nota UX:** O badge de contagem de items `pending_review` no sidebar item "Aprovacoes" deve seguir o pattern S31-KS-04 (notification badge no Automation). Implementar fetch count via API e exibir badge.

**Icons:** `Calendar` e `ClipboardCheck` do Lucide — ja disponiveis no bundle shadcn/ui. Devem ser registrados no `lib/icon-maps.ts` (SIDEBAR_ICONS).

**Impacto:** S33-CAL-03, S33-APR-03.

---

### DT-10: Contract-Map — Nova Lane content_autopilot (NON-BLOCKING)

**Problema:** Registrar nova lane e resolver conflito de glob com `ai_retrieval`.

**Analise:**
- Lane `ai_retrieval` tem glob `app/src/lib/ai/**` que inclui `app/src/lib/ai/prompts/content-generation.ts`
- Pattern precedente: `social-generation.ts` vive sob `lib/ai/prompts/` mas pertence logicamente a `social_intelligence`
- O contract-map ja tem sobreposicao tacita (nao ha mecanismo de exclusao)

**Decisao: Registrar lane com comentario de cross-reference**
```yaml
content_autopilot:
  paths:
    - "app/src/lib/content/**"                          # S33-GEN-01, S33-APR-01
    - "app/src/lib/firebase/content-calendar.ts"        # S33-CAL-01
    - "app/src/lib/ai/prompts/content-generation.ts"    # S33-GEN-02 (cross-ref ai_retrieval)
    - "app/src/app/api/content/**"                      # S33-CAL-02, S33-GEN-03, S33-APR-02
    - "app/src/app/content/**"                          # S33-CAL-03, S33-APR-03
    - "app/src/components/content/**"                   # S33-CAL-03, S33-APR-03
    - "app/src/types/content.ts"                        # S33-CAL-01
  contract: "_netecmt/contracts/content-autopilot-spec.md"
```

**Impacto:** S33-GOV-05 (Fase 4).

---

## 3. Validacao por Fase

### Fase 0: Governanca & Divida S32 (~1.5h)

| Item | Validacao Athos | Nota |
|:-----|:---------------|:-----|
| S33-GOV-01 (zod oficial) | ✅ Sem risco. Adicionar nota no README. | — |
| S33-GOV-02 (timer leak) | ✅ Ver DT-01. `afterAll` global + `--detectOpenHandles` | ~45min com investigacao |
| S33-GOV-03 (Instagram domain) | ✅ Sem risco. Doc em `_netecmt/docs/tools/` | — |
| S33-GOV-04 (social_interactions) | ✅ Ver DT-02. Subcollection. Type em `types/social.ts` | — |
| S33-GATE-00 | ✅ Obrigatorio antes de avancar | — |

**Estimativa revisada Fase 0:** 1.5h (mantida)

---

### Fase 1: Calendario Editorial (~5h)

| Item | Validacao Athos | Nota |
|:-----|:---------------|:-----|
| S33-CAL-01 (data model + CRUD) | ✅ Ver DT-03 (schema), DT-04 (query), DT-05 (reorder) | `writeBatch` para reorder |
| S33-CAL-02 (API CRUD) | ✅ Ver API Design abaixo | `requireBrandAccess` em todas |
| S33-CAL-03 (UI + sidebar) | ✅ Ver DT-09 (sidebar group) | HTML5 D&D nativo |
| S33-GATE-01 | ✅ Obrigatorio | — |

**API Design Validado:**

| Rota | Metodo | Auth | Notas |
|:-----|:-------|:-----|:------|
| `/api/content/calendar` | GET | `requireBrandAccess` via query `brandId` | Range query: `start`, `end` como Timestamp ms. `view` param opcional |
| `/api/content/calendar` | POST | `requireBrandAccess` via body `brandId` | Cria item. Retorna `createApiSuccess({ item })` |
| `/api/content/calendar` | PUT | `requireBrandAccess` via body `brandId` | Atualiza item. Body: `{ brandId, itemId, ...fields }` |
| `/api/content/calendar` | DELETE | `requireBrandAccess` via body `brandId` | Remove item. Body: `{ brandId, itemId }` |
| `/api/content/calendar/reorder` | POST | `requireBrandAccess` via body `brandId` | Batch reorder. Body: `{ brandId, updates: [{itemId, order, scheduledDate?}] }` |

**Nota:** PUT e DELETE usam body (nao URL params) — consistente com pattern existente onde `requireBrandAccess` extrai brandId do body/query. Alternativa de dynamic route `[itemId]` criaria mais arquivos sem beneficio.

**CRUD helpers em `lib/firebase/content-calendar.ts`:**
- `createCalendarItem(brandId, data)` — `addDoc()` + `Timestamp.now()`
- `getCalendarItems(brandId, startDate, endDate)` — range query + in-memory sort (DT-04)
- `updateCalendarItem(brandId, itemId, data)` — `updateDoc()` + `updatedAt: Timestamp.now()`
- `deleteCalendarItem(brandId, itemId)` — `deleteDoc()`
- `reorderCalendarItems(brandId, updates)` — `writeBatch()` (DT-05)

**Estimativa revisada Fase 1:** 5h (+0.5h vs minimo PRD por writeBatch + mock setup)

---

### Fase 2: Content Generation Pipeline (~4.5h)

| Item | Validacao Athos | Nota |
|:-----|:---------------|:-----|
| S33-GEN-01 (engine + Brand Voice) | ✅ Ver design abaixo | `getBrand()` + `generateWithGemini()` |
| S33-GEN-02 (4 prompts + Zod) | ✅ Ver DT-06 (arquivo separado), DT-07 (schemas) | 4 schemas nomeados |
| S33-GEN-03 (API generate) | ✅ Ver API Design abaixo | `insertToCalendar` optional |
| S33-GATE-02 | ✅ Obrigatorio | — |

**Generation Engine Design (`lib/content/generation-engine.ts`):**

```
generateContent(brandId, params)
  1. getBrand(brandId) → Brand data (name, brandKit.tone, brandKit.voice, etc.)
  2. Selecionar prompt por format (CONTENT_SCHEMAS[format])
  3. Montar system_instruction com Brand Voice
  4. generateWithGemini(prompt, {
       responseMimeType: 'application/json',
       systemPrompt: brandVoiceSystemInstruction,
       temperature: 0.7,
       brandId,
       feature: 'content_generation'
     })
  5. Parse response com Zod schema (CONTENT_SCHEMAS[format])
  6. Retornar { content, metadata, suggestions }
  
  FALLBACK: Se Gemini falha ou parse Zod falha:
    → retorna { content: null, generated: false, error: 'generation_failed', suggestions: [template manual] }
    → NAO throw (RNF-33.04 fallback)
```

**API Design:**

| Rota | Metodo | Auth | Notas |
|:-----|:-------|:-----|:------|
| `/api/content/generate` | POST | `requireBrandAccess` via body `brandId` | Body: `{ brandId, format, platform, topic, tone?, keywords?, targetAudience?, insertToCalendar? }` |

**Se `insertToCalendar: true`:** Fire-and-forget `createCalendarItem()` apos geracao bem-sucedida. Retorna content imediatamente, persistencia assincrona.

**Estimativa revisada Fase 2:** 4.5h (mantida no range PRD)

---

### Fase 3: Approval Workflow + BrandVoice 2.0 (~5h)

| Item | Validacao Athos | Nota |
|:-----|:---------------|:-----|
| S33-APR-01 (approval engine) | ✅ Ver DT-08 (adjacency map) | History log em subcollection |
| S33-APR-02 (API approve) | ✅ Ver API Design abaixo | Action-based (nao status direto) |
| S33-APR-03 (UI review + sidebar) | ✅ Ver DT-09 | Badge pending_review count |
| S33-BV-01 (STRETCH) | ✅ Ver design abaixo | Peso leve — nao bloqueia geracao |
| S33-GATE-03 | ✅ Obrigatorio | — |

**Approval Engine Design (`lib/content/approval-engine.ts`):**

```
transitionStatus(brandId, itemId, action, comment?)
  1. Mapear action → target status:
     - 'submit_review' → pending_review
     - 'approve' → approved  
     - 'reject' → rejected
     - 'schedule' → scheduled
     - 'publish' → published (FUTURO S34+, NAO implementar agora)
  2. Ler status atual do item
  3. Validar transicao via VALID_TRANSITIONS map (DT-08)
  4. Se invalida → return error
  5. Se valida:
     a. updateDoc com novo status + updatedAt
     b. addDoc em subcollection `brands/{brandId}/content_calendar/{itemId}/history`:
        { fromStatus, toStatus, comment?, timestamp: Timestamp.now(), userId? }
  6. Retornar item atualizado
```

**History Log:** Subcollection `brands/{brandId}/content_calendar/{itemId}/history` — append-only, imutavel. Cada transicao = 1 doc.

**API Design:**

| Rota | Metodo | Auth | Notas |
|:-----|:-------|:-----|:------|
| `/api/content/calendar/approve` | POST | `requireBrandAccess` via body `brandId` | Body: `{ brandId, itemId, action, comment? }` |

**Actions validas:** `submit_review`, `approve`, `reject`, `schedule`. NAO incluir `publish` (PA-01: zero publicacao real).

**BrandVoice 2.0 (STRETCH S33-BV-01):**
- `engagementScore` como campo opcional em `SocialInteractionRecord` (DT-02)
- No `generation-engine.ts`, se disponivel: buscar top-5 interacoes com maior `engagementScore` via query simples
- Injetar como context adicional no prompt ("Exemplos de conteudo de alta performance...")
- NAO obrigatorio — engine funciona sem engagement data

**Estimativa revisada Fase 3:** 5h (no range PRD)

---

### Fase 4: Governanca Final (~0.5h)

| Item | Validacao Athos | Nota |
|:-----|:---------------|:-----|
| S33-GOV-05 (contract-map) | ✅ Ver DT-10 | Nova lane `content_autopilot` |
| S33-GOV-06 (ACTIVE_SPRINT + ROADMAP) | ✅ Standard | — |

**Estimativa revisada Fase 4:** 0.5h (mantida)

---

## 4. Proibicoes Arquiteturais (Validacao)

### Herdadas (P-01 a P-08) — Todas confirmadas

| ID | Status | Nota Athos |
|:---|:-------|:-----------|
| P-01 (zero `any`) | ✅ | Zod schemas tipam outputs. CRUD helpers tipados. |
| P-02 (zero `firebase-admin`) | ✅ | Projeto usa Client SDK exclusivamente. |
| P-03 (zero SDK npm novo) | ✅ | `generateWithGemini()` via fetch. Zod ja existe. |
| P-04 (zero mudanca fora do allowed-context) | ✅ | Lane `content_autopilot` definida. |
| P-05 (zero `@ts-ignore`) | ✅ | — |
| P-06 (zero `Date`) | ✅ | Schema usa `Timestamp` em todos os campos de data. |
| P-07 (zero rota sem `force-dynamic`) | ✅ | Todas as 3 rotas novas terao `export const dynamic = 'force-dynamic'`. |
| P-08 (zero cross-tenant) | ✅ | Subcollection path garante isolamento. brandId em todas as queries. |

### Novas S33 (PA-01 a PA-03) — Todas confirmadas

| ID | Status | Nota Athos |
|:---|:-------|:-----------|
| PA-01 (zero publicacao real) | ✅ | Estado `published` existe mas NAO executa acao externa. Transicao para `published` sera scaffold para S34. API `approve` NAO inclui action `publish`. |
| PA-02 (zero OAuth novo) | ✅ | MonaraTokenVault existente para credentials. Zero novo flow. |
| PA-03 (zero D&D library) | ✅ | HTML5 nativo: `draggable`, `onDragStart`, `onDragOver`, `onDrop`. |

### Proibicoes Adicionais Athos (PA-04 a PA-06)

| ID | Proibicao |
|:---|:----------|
| PA-04 | NAO usar `orderBy` combinado com `where` em campo diferente sem composite index (usar in-memory sort — DT-04) |
| PA-05 | NAO usar updates sequenciais para reorder — DEVE usar `writeBatch()` (DT-05) |
| PA-06 | NAO permitir transicao de status sem validacao via adjacency map (DT-08) |

---

## 5. Arquivos — Mapa de Criacao/Modificacao

### Novos (~14 arquivos)

| Arquivo | Sprint Item | Tipo | Lane |
|:--------|:-----------|:-----|:-----|
| `app/src/types/content.ts` | S33-CAL-01 | Types + Zod Schemas | content_autopilot |
| `app/src/lib/firebase/content-calendar.ts` | S33-CAL-01 | CRUD Firestore | content_autopilot |
| `app/src/app/api/content/calendar/route.ts` | S33-CAL-02 | API Route (CRUD) | content_autopilot |
| `app/src/app/api/content/calendar/reorder/route.ts` | S33-CAL-02 | API Route (reorder) | content_autopilot |
| `app/src/app/content/calendar/page.tsx` | S33-CAL-03 | UI Page | content_autopilot |
| `app/src/components/content/calendar-view.tsx` | S33-CAL-03 | UI Component | content_autopilot |
| `app/src/lib/content/generation-engine.ts` | S33-GEN-01 | Engine | content_autopilot |
| `app/src/lib/ai/prompts/content-generation.ts` | S33-GEN-02 | Prompts (4 formatos) | content_autopilot |
| `app/src/app/api/content/generate/route.ts` | S33-GEN-03 | API Route | content_autopilot |
| `app/src/lib/content/approval-engine.ts` | S33-APR-01 | Engine | content_autopilot |
| `app/src/app/api/content/calendar/approve/route.ts` | S33-APR-02 | API Route | content_autopilot |
| `app/src/app/content/review/page.tsx` | S33-APR-03 | UI Page | content_autopilot |
| `app/src/components/content/status-badge.tsx` | S33-APR-03 | UI Component | content_autopilot |
| `app/src/components/content/review-card.tsx` | S33-APR-03 | UI Component | content_autopilot |

### Modificados (~7 arquivos)

| Arquivo | Sprint Item | Alteracao |
|:--------|:-----------|:----------|
| `app/src/components/layout/sidebar.tsx` | S33-CAL-03, S33-APR-03 | NAO modificar diretamente — alteracao via `constants.ts` |
| `app/src/lib/constants.ts` | S33-CAL-03, S33-APR-03 | Adicionar 2 items ao grupo `execution` no NAV_GROUPS |
| `app/src/lib/icon-maps.ts` | S33-CAL-03, S33-APR-03 | Registrar `Calendar`, `ClipboardCheck` no SIDEBAR_ICONS |
| `app/src/types/social.ts` | S33-GOV-04 | Adicionar `SocialInteractionRecord` interface |
| `app/jest.setup.js` | S33-GOV-02 | Adicionar `afterAll` global + possivel remocao `MessageChannel` |
| `_netecmt/core/contract-map.yaml` | S33-GOV-05 | Nova lane `content_autopilot` |
| `_netecmt/sprints/ACTIVE_SPRINT.md` | S33-GOV-06 | Update para S33 |

---

## 6. Estimativa Revisada (Athos)

| Fase | PRD Estimativa | Athos Revisada | Delta | Justificativa |
|:-----|:--------------|:---------------|:------|:-------------|
| Fase 0: Governanca | 1.5h | 1.5h | 0 | Straightforward. Timer leak pode ser rapido ou exigir investigacao. |
| Fase 1: Calendario | 4-5h | 5h | 0 a +1h | `writeBatch` pattern + mock no jest.setup + HTML5 D&D | 
| Fase 2: Generation | 4-5h | 4.5h | 0 | Alinhado com patterns existentes (Gemini+Zod) |
| Fase 3: Approval+BV | 4-5h | 5h | 0 a +1h | State machine + history subcollection + UI review |
| Fase 4: Governanca Final | 0.5h | 0.5h | 0 | Standard |
| **Total core** | **14-17h** | **16.5h** | **0** | **Dentro da banda aprovada** |
| STRETCH (BV 2.0) | ~1h | ~1h | 0 | Peso leve, nao bloqueante |
| **Total com STRETCH** | **15-18h** | **17.5h** | **0** | — |

---

## 7. Dependencias Criticas Verificadas

| Dependencia | Status | Verificacao |
|:-----------|:-------|:-----------|
| `getBrand(brandId)` | ✅ | `lib/firebase/firestore.ts` L607-613 |
| `generateWithGemini()` com JSON mode | ✅ | `lib/ai/gemini.ts` L148-239, suporta `responseMimeType: 'application/json'` |
| `createApiError` / `createApiSuccess` | ✅ | `lib/utils/api-response.ts` |
| `requireBrandAccess(req, brandId)` | ✅ | `lib/auth/brand-guard.ts` — import path correto |
| `writeBatch()` | ✅ | Ja usado em `assets.ts`, `agency/engine.ts` |
| `Timestamp` (Firestore) | ✅ | Importado globalmente em todos os CRUD helpers |
| Zod | ✅ | Formalizada em S32 (F-01), presente no package.json |
| NAV_GROUPS (constants.ts) | ✅ | Sidebar le de `constants.ts` via `NAV_GROUPS.map()` |
| SIDEBAR_ICONS (icon-maps.ts) | ✅ | Registrar `Calendar`, `ClipboardCheck` |
| Firestore mock no jest.setup.js | ⚠️ | Precisara de `writeBatch` mock adicional |

---

## 8. Pre-flight Checklist (para Darllyson)

### BLOCKING (DEVE resolver antes da implementacao)

- [ ] **DT-04**: Date range query usa `where()` + in-memory sort. ZERO composite index. ZERO `orderBy` em campo diferente do `where`.
- [ ] **DT-05**: Reorder usa `writeBatch()`. ZERO updates sequenciais. Mock de `writeBatch` adicionado no `jest.setup.js`.
- [ ] **DT-08**: State machine usa adjacency map (VALID_TRANSITIONS). ZERO transicao sem validacao. ZERO skip de estado.

### NON-BLOCKING (seguir durante implementacao)

- [ ] DT-01: Timer leak: `afterAll` global + `--detectOpenHandles`
- [ ] DT-02: `social_interactions` como subcollection. Type em `types/social.ts`
- [ ] DT-03: `content_calendar` com `createdBy` field adicional
- [ ] DT-06: Prompts em `lib/ai/prompts/content-generation.ts` (arquivo separado)
- [ ] DT-07: 4 Zod schemas separados com mapa de selecao
- [ ] DT-09: Sidebar items no grupo `execution`. Icons em `icon-maps.ts`
- [ ] DT-10: Contract-map com lane `content_autopilot` e cross-ref anotada

### Padroes Sigma (verificar em TODAS as rotas novas)

- [ ] `export const dynamic = 'force-dynamic'` no topo
- [ ] `requireBrandAccess(req, brandId)` com try/catch para ApiError
- [ ] `createApiError(status, message)` para todos os erros
- [ ] `createApiSuccess(data)` para todos os sucessos
- [ ] `Timestamp.now()` (NAO `new Date()` ou `Date.now()`)
- [ ] `brandId` obrigatorio em todas as queries Firestore
- [ ] Zero `any` — tipos explicitos em todos os parametros e retornos

---

## 9. Riscos Identificados

| Risco | Probabilidade | Impacto | Mitigacao |
|:------|:-------------|:--------|:---------|
| Timer leak nao resolvido com afterAll | Media | Baixo (warning, nao break) | `--forceExit` como fallback temporario |
| HTML5 D&D nao funciona em mobile | Alta | Medio (mobile UX) | HTML5 D&D nao suporta touch events nativamente. Para S33 MVP: desabilitar drag em mobile, permitir reorder via botoes up/down. Touch D&D e escopo S34. |
| Gemini rate limit durante geracao em massa | Baixa | Medio | Ja coberto pelo `AICostGuard.checkBudget()` no `generateWithGemini()` |
| Composite index necessario inesperadamente | Baixa | Alto (runtime error) | DT-04 BLOCKING previne. In-memory sort e o pattern. |

---

## 10. Veredito

**APROVADO COM RESSALVAS**

3 Blocking DTs (DT-04 query pattern, DT-05 writeBatch, DT-08 state machine) devem ser seguidos estritamente. Os 7 DTs restantes sao non-blocking mas fortemente recomendados.

Estimativa total de ~16.5h core (17.5h com STRETCH) esta dentro da banda aprovada pelo Conselho (14-17h). O delta de +0.5h e atribuido ao `writeBatch` pattern + mock setup, que e investimento de qualidade.

**Atencao especial:**
1. HTML5 Drag and Drop NAO funciona em touch/mobile — documentar limitacao, implementar fallback com botoes
2. `writeBatch` mock deve ser adicionado ao `jest.setup.js` antes de iniciar Fase 1
3. O estado `published` existe no enum mas a transicao para ele NAO deve ser exposta na API de S33 (PA-01)

Sprint pode avancar para Story Preparation (Leticia).

---

*Architecture Review por Athos (Architect) | Sprint 33 | 08/02/2026*
*PRD base: prd-sprint-33-content-autopilot-foundation.md (Iuran)*
*Veredito: APROVADO COM RESSALVAS — 10 DTs (3 Blocking, 7 Non-Blocking)*
