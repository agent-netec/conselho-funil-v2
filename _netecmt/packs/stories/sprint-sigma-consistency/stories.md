# Stories Distilled: Sprint Sigma — Sub-Sprint de Consistencia do Codebase
**Preparado por:** Leticia (SM)
**Data:** 07/02/2026
**Lanes:** security + types + api_consistency + architecture + core

> **IMPORTANTE:** Este documento incorpora os **14 Decision Topics (DTs)** e **6 Correcoes de Premissa (CPs)** do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 4 blocking DTs (DT-01, DT-02, DT-05, DT-11) estao destacados com `BLOCKING`.

---

## Fase 1: Seguranca (P0-A) [~5-5.5h + Gate]

> **Sequencia:** PRE-SEC → PRE-CONV → SEC-01 → SEC-02 → SEC-03 → **GATE CHECK 1**
>
> **PRIORIDADE MAXIMA.** Rotas sem autenticacao representam vazamento cross-tenant ativo. Esta fase DEVE ser concluida e validada antes de qualquer outra acao.

---

### SIG-PRE-SEC: Pre-work — Mapear callers frontend + adicionar brandId no body [S, ~1h] — PRE-WORK

**Objetivo:** Antes de adicionar `requireBrandAccess()` nas rotas, mapear TODOS os callers frontend para verificar se enviam `brandId`. Rotas social/* NAO recebem brandId no body atualmente. Corrigir os callers.

> **[ARCH DT-02 — BLOCKING P0]:** Rotas social/* recebem `{ funnelId, userId, context }` sem brandId. Sem este mapeamento, a auth vai falhar em 400 ou vai precisar de derivacao via Firestore (inaceitavel).

**Acao:**
1. Executar `rg "api/social/generate" app/src/` e equivalentes para TODAS as 10 rotas brand-access
2. Documentar cada caller e se envia `brandId` ou nao
3. Para cada caller que NAO envia `brandId`:
   - Adicionar `brandId` ao body da request (usar `useBrandStore` no frontend)
   - `brandId` e campo ADICIONAL — nao substitui nenhum existente (P10 respeitado)
4. Rotas confirmadas que precisam de `brandId` adicionado:
   - `social/generate` — NAO recebe
   - `social/hooks` — VERIFICAR
   - `social/structure` — VERIFICAR
   - `social/scorecard` — VERIFICAR
   - `design/plan` — VERIFICAR
   - `design/generate` — VERIFICAR
   - `design/upscale` — VERIFICAR
   - `performance/metrics` — JA recebe (via searchParams)
   - `funnels/export` — VERIFICAR
   - `funnels/share` — VERIFICAR

**Arquivos afetados:** Todos os componentes/hooks que chamam as 10 rotas (mapear durante execucao)

**DTs referenciados:** DT-02 (BLOCKING)
**Dependencias:** Nenhuma (primeira story da sprint)
**Gate Check:** Nao (pre-work para SIG-SEC-01)

**AC:**
- [ ] Todas as 10 rotas brand-access tem callers mapeados
- [ ] Cada caller que nao enviava `brandId` agora envia
- [ ] `brandId` vem de `useBrandStore` ou contexto de auth — NUNCA hardcodado (P6)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-PRE-CONV: Pre-work — Criar requireConversationAccess guard [S, ~30min] — PRE-WORK

**Objetivo:** A rota `/api/chat` NAO pode usar `requireBrandAccess` — ela recebe `conversationId`, nao `brandId`. Criar guard especifico que valida Bearer token + ownership da conversa.

> **[ARCH DT-01 — BLOCKING P0]:** Auth tem 3 categorias: (A) Brand Access — 10 rotas, (B) Conversation Auth — chat, (C) Webhook Signature — ja implementada. Criar guard para categoria B.

**Acao:**
1. Criar `app/src/lib/auth/conversation-guard.ts`:
   ```typescript
   export async function requireConversationAccess(
     req: NextRequest,
     conversationId: string
   ): Promise<{ userId: string }> {
     // 1. Extrair Bearer token do header Authorization
     // 2. Verificar token (Firebase Auth)
     // 3. Buscar conversa no Firestore
     // 4. Comparar userId do token com userId da conversa
     // 5. Se match: retornar { userId }
     // 6. Se nao match: throw 403 Forbidden
   }
   ```
2. Seguir padrao de `requireBrandAccess` da Intelligence Wing
3. Exportar funcao para uso em SIG-SEC-01

**Arquivos:**
- `app/src/lib/auth/conversation-guard.ts` — **CRIAR**

**DTs referenciados:** DT-01 (BLOCKING)
**Dependencias:** Nenhuma
**Gate Check:** Nao (pre-work para SIG-SEC-01)

**AC:**
- [ ] `conversation-guard.ts` criado com `requireConversationAccess()`
- [ ] Valida Bearer token + ownership (userId match)
- [ ] Retorna 401 se token ausente/invalido
- [ ] Retorna 403 se userId nao e dono da conversa
- [ ] Segue padrao de `requireBrandAccess` existente
- [ ] NUNCA usa `any` (P5)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-SEC-01: Auth nas 10 rotas brand-access + 1 conversation-access + documentar webhook [L, ~3h]

**Objetivo:** Blindar todas as rotas vulneraveis com autenticacao adequada por CATEGORIA conforme DT-01.

> **[ARCH DT-01 — BLOCKING P0]:** 3 categorias de auth:
> - **Categoria A (10 rotas):** `requireBrandAccess(req, brandId)` — social/generate, social/hooks, social/structure, social/scorecard, design/plan, design/generate, design/upscale, performance/metrics, funnels/export, funnels/share
> - **Categoria B (1 rota):** `requireConversationAccess(req, conversationId)` — chat
> - **Categoria C (1 rota):** Webhook signature JA IMPLEMENTADA — webhooks/dispatcher (apenas documentar)
>
> **[ARCH PA-03]:** NUNCA aplicar requireBrandAccess em webhooks/dispatcher.

**Acao por categoria:**

#### Categoria A — 10 rotas com `requireBrandAccess`:
Para cada rota, adicionar no inicio do handler POST:
```typescript
const { brandId } = await req.json();
await requireBrandAccess(req, brandId);
```
Rotas:
1. `app/src/app/api/social/generate/route.ts`
2. `app/src/app/api/social/hooks/route.ts`
3. `app/src/app/api/social/structure/route.ts`
4. `app/src/app/api/social/scorecard/route.ts`
5. `app/src/app/api/design/plan/route.ts`
6. `app/src/app/api/design/generate/route.ts`
7. `app/src/app/api/design/upscale/route.ts`
8. `app/src/app/api/performance/metrics/route.ts`
9. `app/src/app/api/funnels/export/route.ts`
10. `app/src/app/api/funnels/share/route.ts`

#### Categoria B — 1 rota com `requireConversationAccess`:
```typescript
// app/src/app/api/chat/route.ts
const { conversationId } = await req.json();
await requireConversationAccess(req, conversationId);
```

#### Categoria C — 1 rota (documentar apenas):
- `app/src/app/api/webhooks/dispatcher/route.ts` — JA protegida por `validateWebhookSignature()`. Adicionar comentario:
```typescript
// AUTH: Webhook signature validation (não usa Bearer token)
// Categoria C — validação de assinatura HMAC para webhooks externos (Meta, Google, Instagram)
```

**DTs referenciados:** DT-01 (BLOCKING), DT-02 (BLOCKING)
**Dependencias:** SIG-PRE-SEC (callers mapeados), SIG-PRE-CONV (guard criado)
**Gate Check:** SIG-GATE-01 (Sim)

**AC:**
- [ ] 10/10 rotas Categoria A com `requireBrandAccess`
- [ ] 1/1 rota Categoria B com `requireConversationAccess`
- [ ] 1/1 rota Categoria C documentada como auth por assinatura
- [ ] Webhooks/dispatcher NAO tem requireBrandAccess (PA-03)
- [ ] Nenhuma URL de API alterada (P10)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-SEC-02: force-dynamic em rotas dinamicas [XS, ~15min]

**Objetivo:** Adicionar `export const dynamic = 'force-dynamic'` nas rotas que carecem da diretiva, evitando cache de dados dinamicos no Vercel.

> **[ARCH DT-04]:** Verificar ANTES de adicionar — algumas rotas podem ja ter a diretiva.

**Acao:**
1. Para cada rota da lista, verificar se ja tem `force-dynamic`
2. Se NAO tiver, adicionar `export const dynamic = 'force-dynamic'` no top-level do arquivo
3. Rotas candidatas:
   - `campaigns/[id]/generate-ads/route.ts`
   - `funnels/share/route.ts`
   - `funnels/export/route.ts`
   - `decisions/route.ts`
   - `copy/decisions/route.ts`
   - `webhooks/dispatcher/route.ts`
   - `performance/metrics/route.ts`

**DTs referenciados:** DT-04
**Dependencias:** Nenhuma (parallelizavel com SIG-SEC-01)
**Gate Check:** SIG-GATE-01 (Sim)

**AC:**
- [ ] 7/7 rotas dinamicas com `force-dynamic` (verificado antes de adicionar)
- [ ] Nenhuma rota que ja tinha a diretiva foi duplicada
- [ ] `npx tsc --noEmit` = 0

---

### SIG-SEC-03: Hydration guard skipHydration nos 2 stores persistidos [XS, ~30min]

**Objetivo:** Prevenir hydration mismatch no Next.js App Router nos 2 stores que usam `persist()` sem guard.

> **[ARCH DT-03]:** Usar `skipHydration: true` (padrao oficial Zustand para App Router), NAO `typeof window` guard.

**Acao:**
1. Em `app/src/lib/stores/brand-store.ts`:
   ```typescript
   persist(
     (set) => ({ ... }),
     {
       name: 'brand-storage',
       partialize: (state) => ({ selectedBrand: state.selectedBrand }),
       skipHydration: true, // ← ADICIONAR
     }
   )
   ```
2. Em `app/src/lib/stores/context-store.ts`:
   ```typescript
   persist(
     (set) => ({ ... }),
     {
       name: 'context-storage',
       // ...
       skipHydration: true, // ← ADICIONAR
     }
   )
   ```
3. Em um componente client root (ex: `providers.tsx` ou equivalente):
   ```typescript
   useEffect(() => {
     useBrandStore.persist.rehydrate();
     useContextStore.persist.rehydrate();
   }, []);
   ```

**DTs referenciados:** DT-03
**Dependencias:** Nenhuma (parallelizavel com SIG-SEC-01/02)
**Gate Check:** SIG-GATE-01 (Sim)

**AC:**
- [ ] `brand-store.ts` tem `skipHydration: true`
- [ ] `context-store.ts` tem `skipHydration: true`
- [ ] `rehydrate()` chamado em client root
- [ ] Zero hydration mismatch warnings no console
- [ ] `npx tsc --noEmit` = 0

---

### SIG-GATE-01: Gate Check 1 — Seguranca [S, ~30min] — GATE

**Objetivo:** Validar que TODAS as stories de seguranca estao concluidas e que o baseline de regressao foi mantido. **Fase 2 NAO pode iniciar sem este gate aprovado** (P7, Ressalva R1).

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | Auth em 10 rotas brand-access | `rg "requireBrandAccess" app/src/app/api/` | 10+ ocorrencias nas rotas listadas |
| G1-02 | Auth em chat (conversation) | `rg "requireConversationAccess" app/src/app/api/chat/` | 1 ocorrencia |
| G1-03 | Webhook documentado (NAO alterado) | Inspecao manual de `webhooks/dispatcher` | Comentario de auth presente, sem requireBrandAccess |
| G1-04 | `force-dynamic` em 7 rotas | `rg "force-dynamic" app/src/app/api/` | 7+ ocorrencias |
| G1-05 | Hydration guards | Inspecao manual de `brand-store.ts` e `context-store.ts` | `skipHydration: true` em ambos |
| G1-06 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0, zero erros |
| G1-07 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G1-08 | Testes passando | `npm test` | >= 218/218 pass, 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-08 estiverem todos aprovados.

**DTs referenciados:** Todos os DTs de Fase 1
**Dependencias:** SIG-SEC-01, SIG-SEC-02, SIG-SEC-03 concluidos
**Gate Check:** SIM (este E o gate)

**AC:**
- [ ] G1-01 a G1-08 todos aprovados
- [ ] Documentacao do resultado do gate (print de tsc, build, tests)

---

## Fase 2: Consistencia de Tipos (P0-B) [~7-8h + Gate]

> **PRE-REQUISITO ABSOLUTO:** SIG-GATE-01 aprovado. Fase 2 NAO pode iniciar sem seguranca blindada (P7, Ressalva R1).
>
> **Sequencia Athos:** PRE-TYP (adapters) → TYP-05/06/07 (small, parallelizaveis) → TYP-01/02 (Message/Conversation com aliases) → TYP-03/04 (Funnel/Autopsy) → GATE 2
>
> **REGRA ABSOLUTA:** `database.ts` e source of truth para entidades persistidas. Duplicatas devem virar re-exports ou aliases.

---

### SIG-PRE-TYP: Pre-work — Criar adapters de compatibilidade [S, ~45min] — PRE-WORK

**Objetivo:** Criar os adapters de runtime para SocialPlatform (PascalCase→lowercase) e Awareness (PT→Schwartz) ANTES de iniciar as consolidacoes. Estes adapters garantem retrocompatibilidade com dados existentes no Firestore.

> **[ARCH DT-07, DT-08]:** NAO alterar dados no Firestore (PA-01). Converter em runtime.

**Acao:**

#### 1. Criar `app/src/types/social-platform.ts`:
```typescript
export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'whatsapp';

const PLATFORM_MAP: Record<string, SocialPlatform> = {
  'X': 'x', 'LinkedIn': 'linkedin', 'Instagram': 'instagram',
  'x': 'x', 'linkedin': 'linkedin', 'instagram': 'instagram',
  'tiktok': 'tiktok', 'whatsapp': 'whatsapp',
};

export function normalizePlatform(raw: string): SocialPlatform {
  return PLATFORM_MAP[raw] || raw.toLowerCase() as SocialPlatform;
}
```

#### 2. Criar `app/src/lib/utils/awareness-adapter.ts`:
```typescript
export type LegacyAwareness = 'fria' | 'morna' | 'quente';
export type SchwartzAwareness = 'unaware' | 'problem' | 'solution' | 'product' | 'most_aware';

const LEGACY_TO_SCHWARTZ: Record<LegacyAwareness, SchwartzAwareness> = {
  'fria': 'unaware', 'morna': 'solution', 'quente': 'product',
};

export function normalizeAwareness(raw: string): SchwartzAwareness {
  if (raw in LEGACY_TO_SCHWARTZ) {
    return LEGACY_TO_SCHWARTZ[raw as LegacyAwareness];
  }
  return raw as SchwartzAwareness;
}
```

#### 3. Criar testes unitarios (RC-13):
- Testes para `normalizePlatform()`: PascalCase→lowercase, lowercase passthrough, unknown fallback
- Testes para `normalizeAwareness()`: PT→Schwartz mapping, Schwartz passthrough, unknown fallback

**Arquivos:**
- `app/src/types/social-platform.ts` — **CRIAR**
- `app/src/lib/utils/awareness-adapter.ts` — **CRIAR**
- Arquivo de teste correspondente — **CRIAR**

**DTs referenciados:** DT-07, DT-08
**Dependencias:** SIG-GATE-01 aprovado
**Gate Check:** Nao (pre-work para TYP-05/07)

**AC:**
- [ ] `social-platform.ts` criado com tipo canonico + `normalizePlatform()`
- [ ] `awareness-adapter.ts` criado com tipos + `normalizeAwareness()`
- [ ] Testes unitarios para `normalizePlatform()` passando (RC-13)
- [ ] Testes unitarios para `normalizeAwareness()` passando (RC-13)
- [ ] NAO altera dados no Firestore (PA-01)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-05: Consolidar SocialPlatform — migrar consumers [S, ~45min]

**Objetivo:** Eleger `types/social-platform.ts` (criado em SIG-PRE-TYP) como source of truth. Re-exportar de `social.ts`, `social-inbox.ts` e `vault.ts`. Migrar consumers de PascalCase para lowercase.

**Acao:**
1. Em `types/social.ts`: remover definicao local de `SocialPlatform`, substituir por re-export:
   ```typescript
   export type { SocialPlatform } from './social-platform';
   ```
2. Em `types/social-inbox.ts`: remover definicao local, substituir por re-export
3. Em `types/vault.ts`: remover definicao PascalCase, substituir por re-export
4. Migrar consumers de PascalCase para lowercase:
   - `adaptation-pipeline.ts` — usar `normalizePlatform()` nos pontos de leitura
   - `brand-validation.ts` — usar `normalizePlatform()`
   - `publisher.ts` — usar `normalizePlatform()`
5. Onde `VaultContent.variants[].platform` e lido do Firestore, aplicar `normalizePlatform()`

**Arquivos:**
- `app/src/types/social.ts` — **MODIFICAR** (re-export)
- `app/src/types/social-inbox.ts` — **MODIFICAR** (re-export)
- `app/src/types/vault.ts` — **MODIFICAR** (re-export)
- `app/src/lib/agents/publisher/adaptation-pipeline.ts` — **MODIFICAR**
- `app/src/lib/agents/qa/brand-validation.ts` — **MODIFICAR**

**DTs referenciados:** DT-07
**Dependencias:** SIG-PRE-TYP
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] 1 unica definicao de `SocialPlatform` em `social-platform.ts`
- [ ] `social.ts`, `social-inbox.ts`, `vault.ts` re-exportam de `social-platform.ts`
- [ ] Consumers PascalCase migrados para lowercase com `normalizePlatform()`
- [ ] NAO altera dados no Firestore (PA-01)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-06: Date → Timestamp em index.ts [S, ~30min]

**Objetivo:** Migrar campos de data em `types/index.ts` de `Date` para `Timestamp` (Firestore), alinhando com `database.ts`.

**Acao:**
1. Em `types/index.ts`, alterar:
   - `timestamp: Date` → `timestamp: Timestamp`
   - `createdAt: Date` → `createdAt: Timestamp`
   - `updatedAt: Date` → `updatedAt: Timestamp`
2. Adicionar import de `Timestamp` do Firestore
3. Verificar todos os consumers que usam `new Date()` com estes tipos e migrar para `Timestamp.now()` ou equivalente

**Arquivos:**
- `app/src/types/index.ts` — **MODIFICAR**
- Consumers que criam objetos com `Date` para estes campos — **MODIFICAR**

**DTs referenciados:** —
**Dependencias:** SIG-GATE-01 aprovado (parallelizavel com TYP-05, TYP-07)
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] `rg ": Date" app/src/types/index.ts` retorna 0 ocorrencias em campos de timestamp
- [ ] Todos os campos de data usam `Timestamp` (Firestore)
- [ ] Consumers adaptados para nao criar `new Date()` para estes campos
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-07: Awareness → Schwartz canonico [S, ~45min]

**Objetivo:** Eleger modelo Schwartz (ingles) como canonico para awareness stages. Remover modelo PT de `database.ts`. Usar `normalizeAwareness()` (criado em SIG-PRE-TYP) para dados legados.

**Acao:**
1. Em `types/database.ts`, alterar FunnelContext:
   ```typescript
   // ANTES: awareness: 'fria' | 'morna' | 'quente'
   // DEPOIS:
   awareness: 'unaware' | 'problem' | 'solution' | 'product' | 'most_aware'
   ```
2. Nos consumers que leem `awareness` do Firestore, envolver com `normalizeAwareness()`:
   ```typescript
   const awareness = normalizeAwareness(doc.data().context?.awareness || 'unaware');
   ```
3. NAO alterar dados existentes no Firestore (PA-01)

**Arquivos:**
- `app/src/types/database.ts` — **MODIFICAR** (awareness type)
- Consumers que leem awareness do Firestore — **MODIFICAR** (envolver com adapter)

**DTs referenciados:** DT-08
**Dependencias:** SIG-PRE-TYP (adapter criado)
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] `rg "fria|morna|quente" app/src/types/` retorna 0 ocorrencias
- [ ] Modelo Schwartz canonico em `database.ts`
- [ ] `normalizeAwareness()` usado nos pontos de leitura de dados legados
- [ ] NAO altera dados no Firestore (PA-01)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-01: Consolidar Message + alias em index.ts [M, ~1.5h]

**Objetivo:** Eleger `database.ts` como source of truth para Message. Migrar `index.ts` para re-export. Corrigir campos conflitantes.

> **[ARCH DT-05 — BLOCKING P0]:** OBRIGATORIO criar re-export em index.ts para nao quebrar imports existentes. chat-store importa de `@/types`.

**Acao:**
1. Em `types/database.ts`, confirmar que Message tem:
   - `conversationId: string` (obrigatorio)
   - `timestamp: Timestamp`
   - `metadata.sources: SourceReference[]` (nao `any[]`)
   - `metadata.scorecard?: Scorecard`
2. Em `types/index.ts`:
   - Remover definicao local de `Message`
   - Adicionar re-export: `export type { Message } from './database';`
   - (PA-05: NUNCA remover re-exports de index.ts)
3. Verificar todos os consumers que importam `Message` de `@/types` — devem funcionar sem alteracao gracas ao re-export

**Arquivos:**
- `app/src/types/database.ts` — **VERIFICAR/AJUSTAR** campos
- `app/src/types/index.ts` — **MODIFICAR** (re-export)
- Consumers de Message — **VERIFICAR** imports

**DTs referenciados:** DT-05 (BLOCKING)
**Dependencias:** SIG-TYP-06 (Date→Timestamp ja aplicado em index.ts)
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] 1 unica definicao de `Message` em `database.ts`
- [ ] `index.ts` re-exporta `Message` de `database.ts`
- [ ] `conversationId` obrigatorio, `sources` tipado como `SourceReference[]`
- [ ] Nenhum consumer que importa de `@/types` quebrou
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-02: Consolidar Conversation + LegacyConversation alias [M, ~1.5h]

**Objetivo:** Eleger `database.ts` como source of truth para Conversation (modelo subcollection). Criar `LegacyConversation` alias temporario para proteger chat-store.

> **[ARCH DT-05 — BLOCKING P0]:** chat-store.ts (L33-34) cria Conversation com `messages: Message[]` embarcado. database.ts NAO tem `messages[]` (usa subcollection). Sem o alias, chat-store QUEBRA.
>
> **[ARCH PA-06]:** NUNCA remover LegacyConversation alias antes da conclusao de SIG-ARC-02 (Fase 4).

**Acao:**
1. Em `types/database.ts`, confirmar que Conversation tem:
   - `tenantId: string` e `userId: string` (obrigatorios)
   - `context: { funnelId?: string, mode: string }`
   - Timestamps como `Timestamp`
   - Modelo subcollection (SEM `messages[]` embarcado)
2. Em `types/index.ts`:
   - Remover definicao local de `Conversation`
   - Adicionar re-export: `export type { Conversation } from './database';`
   - Criar alias temporario:
     ```typescript
     /** @deprecated Use Conversation from database.ts. Alias sera removido em S29 apos SIG-ARC-02. */
     export interface LegacyConversation {
       id: string;
       title: string;
       messages: Message[];
       createdAt: Date;
       updatedAt: Date;
     }
     ```
3. Em `chat-store.ts`: atualizar import para usar `LegacyConversation` em vez de `Conversation`
   - Isto e TEMPORARIO — SIG-ARC-02 (Fase 4) vai migrar para `useConversations`

**Arquivos:**
- `app/src/types/database.ts` — **VERIFICAR/AJUSTAR** campos
- `app/src/types/index.ts` — **MODIFICAR** (re-export + alias)
- `app/src/lib/stores/chat-store.ts` — **MODIFICAR** (usar LegacyConversation)

**DTs referenciados:** DT-05 (BLOCKING), DT-12
**Dependencias:** SIG-TYP-01 (Message consolidado — necessario para alias)
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] 1 unica definicao de `Conversation` em `database.ts` (modelo subcollection)
- [ ] `index.ts` re-exporta `Conversation` + define `LegacyConversation` alias
- [ ] `LegacyConversation` marcado como `@deprecated`
- [ ] `chat-store.ts` usa `LegacyConversation` (temporario)
- [ ] Nenhum consumer que importa de `@/types` quebrou
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-03: Consolidar Funnel [M, ~1.5h]

**Objetivo:** Eleger `database.ts` como source of truth para Funnel. Unificar status enum, migrar Date→Timestamp em `funnel.ts` e `index.ts`. Limpar `FunnelContext.channels` (legado).

**Acao:**
1. Em `types/database.ts`, confirmar Funnel com:
   - Status: `'draft' | 'generating' | 'review' | 'active' | 'archived' | 'error'`
   - `tenantId: string` obrigatorio
   - FunnelContext com `channel` (singular) — remover `channels` (legado, codigo morto)
   - Timestamps como `Timestamp`
2. Em `types/funnel.ts`: remover/redirect duplicata de Funnel para re-export de `database.ts`
3. Em `types/index.ts`: remover duplicata de Funnel, adicionar re-export de `database.ts`
4. Verificar consumers e adaptar imports

**Arquivos:**
- `app/src/types/database.ts` — **VERIFICAR/AJUSTAR**
- `app/src/types/funnel.ts` — **MODIFICAR** (re-export)
- `app/src/types/index.ts` — **MODIFICAR** (re-export)
- Consumers de Funnel — **VERIFICAR** imports

**DTs referenciados:** —
**Dependencias:** SIG-TYP-06 (Date→Timestamp), SIG-TYP-01/02 (para evitar conflitos em index.ts)
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] 1 unica definicao de `Funnel` em `database.ts`
- [ ] Status enum unificado com 6 valores
- [ ] `FunnelContext.channels` (legado plural) removido, mantendo `channel` (singular)
- [ ] `tenantId` obrigatorio
- [ ] `funnel.ts` e `index.ts` re-exportam de `database.ts`
- [ ] `npx tsc --noEmit` = 0

---

### SIG-TYP-04: Consolidar AutopsyReport + LegacyAutopsyReport adapter [M, ~1.5h]

**Objetivo:** Eleger `autopsy.ts` como source of truth para AutopsyReport. Criar adapter para formato legado de `funnel.ts`.

> **[ARCH DT-06]:** As duas estruturas sao COMPLETAMENTE incompativeis (score 0-10 vs overallHealth 0-100, heuristics vs criticalGaps). Adapter obrigatorio.

**Acao:**
1. Em `types/autopsy.ts`: confirmar como source of truth (ja tem heuristics, score 0-10)
2. Em `types/funnel.ts`:
   - Renomear `AutopsyReport` para `LegacyAutopsyReport` (com `@deprecated`)
   - Adicionar re-export: `export type { AutopsyReport } from './autopsy';`
   - Criar funcao adapter `adaptLegacyAutopsyReport()`:
     ```typescript
     export function adaptLegacyAutopsyReport(legacy: LegacyAutopsyReport): AutopsyReport {
       return {
         id: legacy.id,
         funnelId: legacy.funnelId,
         timestamp: legacy.timestamp,
         score: legacy.overallHealth / 10, // 0-100 → 0-10
         summary: `Health Score: ${legacy.overallHealth}/100`,
         heuristics: { /* defaults */ },
         recommendations: legacy.actionPlan.map(a => ({ /* mapping */ })),
         metadata: { loadTimeMs: 0, techStack: [] },
       };
     }
     ```
3. Consumers de `funnel.ts` AutopsyReport (FunnelMap.tsx, automation/engine.ts, tests) — adaptar para usar `LegacyAutopsyReport` ou migrar para `autopsy.ts` AutopsyReport

**Arquivos:**
- `app/src/types/autopsy.ts` — **VERIFICAR** (source of truth)
- `app/src/types/funnel.ts` — **MODIFICAR** (rename + adapter + re-export)
- Consumers de AutopsyReport de funnel.ts — **MODIFICAR**

**DTs referenciados:** DT-06
**Dependencias:** SIG-TYP-03 (Funnel consolidado)
**Gate Check:** SIG-GATE-02 (Sim)

**AC:**
- [ ] `autopsy.ts` e source of truth para AutopsyReport
- [ ] `funnel.ts` mantem `LegacyAutopsyReport` com `@deprecated`
- [ ] `funnel.ts` re-exporta `AutopsyReport` de `autopsy.ts`
- [ ] `adaptLegacyAutopsyReport()` funcional
- [ ] Consumers adaptados (FunnelMap, automation, tests)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-GATE-02: Gate Check 2 — Tipos [S, ~30min] — GATE

**Objetivo:** Validar que TODOS os tipos foram consolidados e que o baseline de regressao foi mantido. **Fase 3 NAO pode iniciar sem este gate aprovado** (P8, Ressalva R2).

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | Message source of truth | Verificar que `database.ts` e unica definicao | 1 definicao canonica + re-export em index.ts |
| G2-02 | Conversation source of truth | Verificar `database.ts` | 1 canonica + re-export + LegacyConversation alias |
| G2-03 | Funnel source of truth | Verificar `database.ts` | 1 canonica + re-exports |
| G2-04 | AutopsyReport source of truth | Verificar `autopsy.ts` | 1 canonica + LegacyAutopsyReport + adapter |
| G2-05 | SocialPlatform unificado | Verificar `social-platform.ts` | 1 definicao, lowercase, inclui tiktok |
| G2-06 | Date → Timestamp | `rg ": Date" app/src/types/index.ts` | 0 ocorrencias em campos de timestamp |
| G2-07 | Awareness canonico | `rg "fria\|morna\|quente" app/src/types/` | 0 ocorrencias do modelo PT |
| G2-08 | Re-exports intactos | Verificar que `from '@/types'` ainda funciona | Todos os re-exports presentes (PA-05) |
| G2-09 | chat-store funcional | Verificar que usa LegacyConversation | Sem erros de tipo |
| G2-10 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0, zero erros |
| G2-11 | Build sucesso | `npm run build` | Exit code 0, >= 103 rotas |
| G2-12 | Testes passando | `npm test` | >= 218/218 pass, 0 fail |
| G2-13 | Testes adapter passando | Executar testes de normalizePlatform/normalizeAwareness | Pass (RC-13) |

**Regra ABSOLUTA:** Fase 3 so inicia se G2-01 a G2-13 estiverem todos aprovados.

**DTs referenciados:** Todos os DTs de Fase 2
**Dependencias:** SIG-TYP-01 a TYP-07 concluidos
**Gate Check:** SIM (este E o gate)

**AC:**
- [ ] G2-01 a G2-13 todos aprovados
- [ ] Documentacao do resultado do gate

---

## Fase 3: API Consistency (P1) [~6h]

> **PRE-REQUISITO ABSOLUTO:** SIG-GATE-02 aprovado (P8, Ressalva R2).
>
> **Sequencia:** API-01 → API-02 → API-03 (+ BNS-02 opcionalmente em paralelo com API-03)

---

### SIG-API-01: Criar lib/utils/api-response.ts [S, ~30min]

**Objetivo:** Criar modulo utilitario com `createApiError()` e `createApiSuccess()` para padronizar respostas de todas as APIs.

> **[ARCH DT-09]:** Schema definido no Arch Review. Campo `error` SEMPRE presente em respostas de erro (PA-04) para retrocompatibilidade com frontend.

**Acao:**
1. Criar `app/src/lib/utils/api-response.ts` com o schema do DT-09:
   - `createApiError(status, message, options?)` → `{ error, code?, details?, requestId }`
   - `createApiSuccess<T>(data, options?)` → `{ success: true, data, meta? }`
   - Type exports: `ApiErrorResponse`, `ApiSuccessResponse<T>`, `ApiResponse<T>`
2. Incluir `requestId` (UUID) em todas as respostas de erro para rastreabilidade
3. Campo `error` (string) SEMPRE presente — frontend depende de `response.error` (PA-04)

**Arquivos:**
- `app/src/lib/utils/api-response.ts` — **CRIAR**

**DTs referenciados:** DT-09
**Dependencias:** SIG-GATE-02 aprovado
**Gate Check:** Nao

**AC:**
- [ ] `api-response.ts` criado com `createApiError` e `createApiSuccess`
- [ ] `requestId` (UUID) em respostas de erro
- [ ] Campo `error` sempre presente em respostas de erro (PA-04)
- [ ] Types `ApiErrorResponse`, `ApiSuccessResponse`, `ApiResponse` exportados
- [ ] `npx tsc --noEmit` = 0

---

### SIG-API-02: Migrar 30+ rotas para formato unificado [L, ~3.5h]

**Objetivo:** Substituir os 5 formatos de erro legados pelo padrao `createApiError`/`createApiSuccess` em todas as rotas API.

> **[ARCH DT-10]:** Chat route tem formato de sucesso especial: `{ response, sources, version }`. Encapsular em `createApiSuccess({ response, sources, version })`.
>
> **[ARCH PA-04]:** NUNCA remover campo `error` — frontend checa `errorData.error === 'insufficient_credits'` etc.

**Acao:**
1. Migrar rotas em lotes por wing:
   - **Social wing** (4 rotas): `social/generate`, `social/hooks`, `social/structure`, `social/scorecard`
   - **Design wing** (3 rotas): `design/plan`, `design/generate`, `design/upscale`
   - **Intelligence wing** (8+ rotas): `intelligence/audience/scan`, `intelligence/autopsy/run`, `intelligence/spy`, `intelligence/creative/copy`, `intelligence/creative/ranking`, `intelligence/keywords`, `intelligence/offer/calculate-score`, `intelligence/offer/save`
   - **Performance wing** (2 rotas): `performance/metrics`, `performance/integrations/validate`
   - **Funnels** (3 rotas): `funnels/generate`, `funnels/export`, `funnels/share`
   - **Chat** (1 rota): `chat` — formato especial (DT-10)
   - **Outros**: `copy/generate`, `campaigns/[id]/generate-ads`, `ingest/url`, `assets/metrics`
2. Formatos a eliminar:
   - Formato A: `{ error: 'string' }`
   - Formato B: `{ error, details }`
   - Formato C: `{ error, code }`
   - Formato D: `errorResponse(500, msg, code, reqId)`
   - Formato E: `{ success: false, message }`
3. Para chat (DT-10):
   - Sucesso: `createApiSuccess({ response: assistantResponse, sources, version })`
   - Erro: `createApiError(403, 'insufficient_credits', { code: 'INSUFFICIENT_CREDITS' })`

**Arquivos:** 30+ rotas API — **MODIFICAR** (todas as rotas em `app/src/app/api/`)

**DTs referenciados:** DT-09, DT-10
**Dependencias:** SIG-API-01 (api-response.ts criado)
**Gate Check:** Nao

**AC:**
- [ ] Zero rotas retornando formatos A-E legados
- [ ] Todas as rotas usam `createApiError`/`createApiSuccess`
- [ ] Campo `error` presente em TODAS as respostas de erro (PA-04)
- [ ] Chat route usa formato especial (DT-10)
- [ ] `errorData.error === 'insufficient_credits'` continua funcionando no chat
- [ ] Nenhuma URL de API alterada (P10)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-API-03: Credit tracking em 10 rotas Gemini [M, ~2h]

**Objetivo:** Adicionar deducao de credito AI nas 10 rotas que consomem Gemini sem rastreamento.

**Acao:**
1. Seguir padrao existente em `copy/generate` (deduz 1 credito) e `ai/analyze-visual` (deduz 2 creditos)
2. Para cada rota, adicionar deducao async (fire-and-forget, nao bloqueia response):
   ```typescript
   // Apos gerar resposta com Gemini:
   deductCredits(userId, brandId, creditAmount).catch(console.error);
   ```
3. Definir creditAmount por rota (baseado em complexidade):
   - design/plan: 2 creditos
   - design/upscale: 3 creditos
   - social/generate: 1 credito
   - social/hooks: 1 credito
   - social/structure: 1 credito
   - social/scorecard: 1 credito
   - intelligence/creative/copy: 2 creditos
   - intelligence/keywords: 1 credito
   - funnels/generate: 3 creditos
   - campaigns/[id]/generate-ads: 3 creditos

**Rotas:**
1. `app/src/app/api/design/plan/route.ts`
2. `app/src/app/api/design/upscale/route.ts`
3. `app/src/app/api/social/generate/route.ts`
4. `app/src/app/api/social/hooks/route.ts`
5. `app/src/app/api/social/structure/route.ts`
6. `app/src/app/api/social/scorecard/route.ts`
7. `app/src/app/api/intelligence/creative/copy/route.ts`
8. `app/src/app/api/intelligence/keywords/route.ts`
9. `app/src/app/api/funnels/generate/route.ts`
10. `app/src/app/api/campaigns/[id]/generate-ads/route.ts`

**DTs referenciados:** —
**Dependencias:** SIG-API-01 (formato unificado facilita insercao), SIG-SEC-01 (auth ja presente — userId/brandId disponiveis)
**Gate Check:** Nao

**AC:**
- [ ] 10/10 rotas com credit tracking implementado
- [ ] Deducao async (fire-and-forget) — nao bloqueia response
- [ ] Segue padrao de `copy/generate` e `ai/analyze-visual`
- [ ] brandId NUNCA hardcodado (P6)
- [ ] `npx tsc --noEmit` = 0

---

## Fase 4: Architecture (P1) [~7.5h]

> **Sequencia Athos:** ARC-01 (+ BNS-01) podem paralelizar com ARC-02 → ARC-03 e sequencial apos ARC-02

---

### SIG-ARC-01: Pinecone — manter .ts, absorver buildPineconeRecord, deletar -client.ts [S, ~1h]

**Objetivo:** Consolidar para 1 unico client Pinecone. INVERTER a decisao original do PRD.

> **[ARCH DT-11 — BLOCKING P0]:** pinecone.ts tem 6 consumers, pinecone-client.ts tem 0. Deletar o errado quebra 6 modulos. MANTER pinecone.ts.
>
> **[ARCH PA-02]:** NUNCA deletar pinecone.ts.

**Acao:**
1. Copiar `buildPineconeRecord()` de `pinecone-client.ts` para `pinecone.ts`
2. Deletar `pinecone-client.ts`
3. Verificar que NENHUM arquivo importa de `pinecone-client.ts` (0 consumers confirmado no Arch Review)
4. Zero alteracao em consumers de `pinecone.ts`

**Arquivos:**
- `app/src/lib/ai/pinecone.ts` — **MODIFICAR** (absorver buildPineconeRecord)
- `app/src/lib/ai/pinecone-client.ts` — **DELETAR**

**DTs referenciados:** DT-11 (BLOCKING)
**Dependencias:** Nenhuma (parallelizavel com SIG-ARC-02)
**Gate Check:** Nao

**AC:**
- [ ] `pinecone.ts` contem `buildPineconeRecord()` (absorvido)
- [ ] `pinecone-client.ts` DELETADO
- [ ] 6 consumers de `pinecone.ts` inalterados
- [ ] Zero imports de `pinecone-client.ts` no codebase
- [ ] `npx tsc --noEmit` = 0

---

### SIG-ARC-02: Chat state → useConversations como source of truth [L, ~3h]

**Objetivo:** Eleger `useConversations()` (hook com real-time Firestore) como source of truth. Reduzir `chat-store.ts` a metadata-only (UI state).

> **[ARCH DT-12, DT-14]:** Firestore JA e source of truth para mensagens (API grava la). chat-store e apenas cache in-memory. Migracao e SEGURA. Zero risco de perda de dados.

**Acao:**
1. Reduzir `chat-store.ts` a metadata-only:
   ```typescript
   interface ChatUIState {
     isSidebarOpen: boolean;
     inputMode: ChatMode;
     isStreaming: boolean;
     activeConversationId: string | null;
     // REMOVIDO: conversations, currentConversation, messages
   }
   ```
2. Migrar consumers de `chat-store.currentConversation` e `chat-store.messages` para `useConversations()`
3. Componentes de chat usam `conversationId` como state e passam para `useConversation(id)`
4. Remover `LegacyConversation` alias de `index.ts` (PA-06: so pode remover APOS esta story)

**Arquivos:**
- `app/src/lib/stores/chat-store.ts` — **MODIFICAR** (reduzir a metadata-only)
- Consumers de `chat-store.currentConversation` — **MIGRAR** para `useConversations`
- `app/src/types/index.ts` — **MODIFICAR** (remover LegacyConversation apos migracao)

**DTs referenciados:** DT-12, DT-14
**Dependencias:** SIG-TYP-02 (LegacyConversation alias existe para protecao durante Fase 2)
**Gate Check:** Nao

**AC:**
- [ ] `chat-store.ts` NAO contem `currentConversation` nem `messages[]`
- [ ] `chat-store.ts` mantem apenas UI state (sidebar, inputMode, isStreaming, activeConversationId)
- [ ] Todos os consumers de `currentConversation` migrados para `useConversations()`
- [ ] `LegacyConversation` alias removido de index.ts (PA-06 cumprido: so apos migracao)
- [ ] Zero perda de dados (DT-14: Firestore ja e source of truth)
- [ ] `npx tsc --noEmit` = 0

---

### SIG-ARC-03: chat-input-area.tsx → 4 hooks [L, ~3.5h]

**Objetivo:** Refatorar componente monolitico (428 linhas) em 4+ hooks reutilizaveis. Componente final <= 150 linhas.

> **[ARCH DT-13]:** Interfaces dos hooks definidas no Arch Review. Extrair um hook por vez, testando apos cada extracao.

**Acao — extrair hooks em ORDEM:**

#### 1. `hooks/chat/use-file-upload.ts`:
```typescript
interface UseFileUploadReturn {
  attachments: Attachment[];
  isUploading: boolean;
  handleFileSelect: (files: FileList | null) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}
export function useFileUpload(brandId: string | null, userId: string | null): UseFileUploadReturn;
```
- Extrair linhas L67-156 (validacao, upload, Firestore doc creation)

#### 2. `hooks/chat/use-multimodal-analysis.ts`:
```typescript
interface UseMultimodalAnalysisReturn {
  analyze: (file: File) => Promise<string>;
  isAnalyzing: boolean;
}
export function useMultimodalAnalysis(): UseMultimodalAnalysisReturn;
```
- Extrair logica Gemini de analise de imagens/docs (L128-136)

#### 3. `hooks/chat/use-party-mode.ts`:
```typescript
interface UsePartyModeReturn {
  selectedAgents: string[];
  setSelectedAgents: (agents: string[]) => void;
  intensity: 'debate' | 'consensus';
  setIntensity: (intensity: 'debate' | 'consensus') => void;
  hasMinimumAgents: boolean;
  counselorNames: string;
}
export function usePartyMode(mode: ChatMode): UsePartyModeReturn;
```
- Extrair logica de selecao de counselors (L160-170, L203-210)

#### 4. `hooks/chat/use-chat-message.ts`:
```typescript
interface UseChatMessageReturn {
  value: string;
  setValue: (value: string) => void;
  handleSubmit: () => void;
  isDisabled: boolean;
}
export function useChatMessage(
  onSend: ChatInputAreaProps['onSend'],
  attachments: Attachment[],
  partyState: UsePartyModeReturn,
  options: { isLoading: boolean; disabled: boolean; isUploading: boolean }
): UseChatMessageReturn;
```
- Extrair construcao e envio de mensagem (L188-217)

**Componente final:** Apenas UI (layout, drag-drop, textarea resize, event handlers delegando para hooks). Meta: <= 150 linhas.

**Arquivos:**
- `app/src/hooks/chat/use-file-upload.ts` — **CRIAR**
- `app/src/hooks/chat/use-multimodal-analysis.ts` — **CRIAR**
- `app/src/hooks/chat/use-party-mode.ts` — **CRIAR**
- `app/src/hooks/chat/use-chat-message.ts` — **CRIAR**
- `app/src/components/chat/chat-input-area.tsx` — **REFATORAR** (extrair hooks)

**DTs referenciados:** DT-13
**Dependencias:** SIG-ARC-02 (chat state consolidado — hooks usam useConversations)
**Gate Check:** Nao

**AC:**
- [ ] 4 hooks criados com interfaces do Arch Review
- [ ] `chat-input-area.tsx` <= 150 linhas
- [ ] Funcionalidade IDENTICA a original — zero mudanca visual (R5 do PRD)
- [ ] Drag-drop funcional
- [ ] Party mode funcional
- [ ] File upload funcional
- [ ] `npx tsc --noEmit` = 0

---

## Bonus STRETCH [~25min]

> **STRETCH:** Executar apenas se o budget de horas permitir. Adiaveis para S29 sem impacto.

---

### SIG-BNS-01: Deletar vertex.ts (codigo morto) [XS, ~10min] — STRETCH

**Objetivo:** Remover `lib/ai/vertex.ts` — 218 linhas de codigo morto, 0 consumers, wrapper redundante do Gemini.

**Acao:**
1. Confirmar 0 imports: `rg "vertex" app/src/` — deve retornar apenas este arquivo
2. Deletar `app/src/lib/ai/vertex.ts`

**Arquivos:**
- `app/src/lib/ai/vertex.ts` — **DELETAR**

**DTs referenciados:** —
**Dependencias:** Parallelizavel com SIG-ARC-01 (ambos limpam lib/ai/)
**Gate Check:** Nao

**AC:**
- [ ] `vertex.ts` DELETADO
- [ ] 0 imports de vertex.ts no codebase
- [ ] `npx tsc --noEmit` = 0

---

### SIG-BNS-02: Extrair estimateTokens() duplicado [XS, ~15min] — STRETCH

**Objetivo:** A funcao `estimateTokens()` (`Math.ceil(length/4)`) aparece em `cost-guard.ts`, `context-assembler.ts` + 6 outros. Extrair para utilitario centralizado.

**Acao:**
1. Criar funcao em `app/src/lib/utils/ai-helpers.ts`:
   ```typescript
   export function estimateTokens(text: string): number {
     return Math.ceil(text.length / 4);
   }
   ```
2. Substituir todas as implementacoes inline pelo import centralizado
3. Executar conjuntamente com SIG-API-03 (credit tracking toca os mesmos arquivos)

**Arquivos:**
- `app/src/lib/utils/ai-helpers.ts` — **CRIAR** (ou adicionar a arquivo existente)
- Todos os arquivos com `estimateTokens` inline — **MODIFICAR**

**DTs referenciados:** —
**Dependencias:** Parallelizavel com SIG-API-03
**Gate Check:** Nao

**AC:**
- [ ] `estimateTokens()` existe em 1 unico lugar
- [ ] Todos os consumers importam do utilitario
- [ ] `npx tsc --noEmit` = 0

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 4 Blocking DTs compreendidos (DT-01, DT-02, DT-05, DT-11)
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-Sprint 28)
- [ ] Confirmar `npm run build` compila (baseline 103 rotas)
- [ ] Executar `npm test` e confirmar baseline de 218/218 pass

### Validacoes incrementais — Fase 1:
- [ ] Apos PRE-SEC: Todos os callers mapeados, brandId adicionado onde necessario
- [ ] Apos PRE-CONV: `requireConversationAccess` criado e exportado
- [ ] Apos SEC-01: 10 rotas brand-access + 1 conversation-access + webhook documentado
- [ ] Apos SEC-02: `force-dynamic` em 7/7 rotas
- [ ] Apos SEC-03: `skipHydration: true` em 2/2 stores
- [ ] **GATE CHECK 1**: tsc + build + tests + review

### Validacoes incrementais — Fase 2:
- [ ] Apos PRE-TYP: Adapters criados, testes passando (RC-13)
- [ ] Apos TYP-05/06/07: Small types consolidados, zero PT awareness
- [ ] Apos TYP-01/02: Message/Conversation consolidados, aliases em index.ts
- [ ] Apos TYP-03/04: Funnel/Autopsy consolidados, adapters funcionais
- [ ] **GATE CHECK 2**: tsc + build + tests + review

### Validacoes incrementais — Fase 3:
- [ ] Apos API-01: `api-response.ts` criado
- [ ] Apos API-02: 30+ rotas migradas, zero formatos legados
- [ ] Apos API-03: 10/10 rotas com credit tracking

### Validacoes incrementais — Fase 4:
- [ ] Apos ARC-01: pinecone-client.ts deletado, pinecone.ts com buildPineconeRecord
- [ ] Apos ARC-02: chat-store metadata-only, LegacyConversation removido
- [ ] Apos ARC-03: chat-input-area <= 150 linhas, 4+ hooks

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] `npm run build` → Sucesso (>= 103 rotas)
- [ ] `npm test` → >= 218/218 pass, 0 fail
- [ ] SC-01 a SC-10 + RC-13 todos aprovados

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 14 Decision Topics + 6 Correcoes de Premissa do Architecture Review (Athos)*
*Sprint Sigma: Sub-Sprint de Consistencia do Codebase | 07/02/2026*
*22 stories (3 PRE-WORK + 13 core + 2 GATE + 2 STRETCH + 2 bonus) | Estimativa: 27-33h*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), M = Medium (2-4h), L = Large (4-8h), L+ = Large Extended*
