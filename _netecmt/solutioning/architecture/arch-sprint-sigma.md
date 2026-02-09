# Architecture Review: Sprint Sigma — Sub-Sprint de Consistencia do Codebase

**Versao:** 1.0  
**Responsavel:** Athos (Architect)  
**Status:** APROVADO COM RESSALVAS (14 DTs, 4 Blocking)  
**Data:** 07/02/2026  
**PRD Ref:** `_netecmt/solutioning/prd/prd-sprint-sigma-consistency.md`  
**Auditoria Ref:** `_netecmt/solutioning/audit-codebase-consistency-2026-02-07.md`  
**Sprint Predecessora:** Sprint 28 (QA 98/100)  
**Baseline:** 218/218 testes, tsc=0, build=103 rotas

---

## 1. Sumario Executivo

Apos leitura completa de 30+ arquivos-fonte (7 type files, 4 rotas de referencia, 2 pinecone clients, 2 chat state sources, 1 componente monolitico, 2 stores persistidos, 1 brand-guard, 1 arch review anterior), esta Architecture Review **APROVA** a Sprint Sigma com **14 Decision Topics** (DT-01 a DT-14), sendo **4 blocking** que devem ser resolvidos antes ou durante a implementacao.

O PRD esta bem estruturado e segue o modelo comprovado de Stabilization (S22/S26). As 4 fases com 2 gates sao corretas. Porem, a analise de codigo revela **premissas incorretas do PRD** que, se nao corrigidas, causarao falhas durante a execucao.

### Descobertas Criticas (Divergencias vs PRD)

> **DC-01: webhooks/dispatcher NAO pode usar `requireBrandAccess()`**
>
> O PRD (SIG-SEC-01) lista `webhooks/dispatcher` nas 12 rotas que devem receber `requireBrandAccess`. Porem, esta rota recebe webhooks EXTERNOS (Meta, Google, Instagram) que NAO possuem Bearer token de usuario. A rota ja usa `validateWebhookSignature()` para autenticacao via HMAC — este e o padrao correto para webhooks. Forcar `requireBrandAccess` quebraria a recepcao de eventos externos.
>
> **Impacto:** A contagem correta e **11 rotas com requireBrandAccess + 1 rota com validacao de assinatura** (ja implementada).

> **DC-02: Pinecone — o arquivo a MANTER tem ZERO consumers, o arquivo a DELETAR tem 6 consumers**
>
> O PRD (SIG-ARC-01) diz: "Eliminar `pinecone.ts`, manter `pinecone-client.ts`". Porem:
> - `pinecone.ts` (async) → **6 consumers reais**: `assets/metrics/route.ts`, `dossier-generator.ts`, `ai/analyze-visual/route.ts`, `pinecone/health/route.ts`, `vault/pinecone-vault.ts`, `ai/worker.ts`
> - `pinecone-client.ts` (sync) → **0 consumers** (nenhum arquivo importa dele)
>
> Deletar pinecone.ts e manter pinecone-client.ts quebraria 6 modulos e exigiria migracao de API async → sync em todos eles. A recomendacao deve ser INVERTIDA.

> **DC-03: chat route ja possui `force-dynamic` e auth condicional**
>
> O PRD lista `/api/chat` como rota sem auth. Na realidade, a rota (L45) ja exporta `dynamic = 'force-dynamic'` e faz auth condicional via `getConversation(conversationId)` → `getUserCredits(userId)` → validacao de creditos. O problema real e que NAO valida se o CALLER e o dono da conversa — apenas busca a conversa e assume o userId dela.

> **DC-04: `social/generate` nao recebe brandId no body**
>
> Para adicionar `requireBrandAccess`, a rota precisa receber `brandId`. Atualmente `social/generate/route.ts` recebe `{ funnelId, userId, context }` — sem brandId. O mesmo pode ocorrer em outras rotas social/*. Isso exige alteracao do contrato de request (adicionar brandId ao body), nao apenas adicionar o guard.

> **DC-05: chat-input-area.tsx tem 428 linhas, nao 391**
>
> Leitura real mostra 428 linhas (incluindo blank lines e exports). O PRD diz 391. Discrepancia menor mas o escopo de refatoracao e ~10% maior que estimado.

---

## 2. Analise por Fase

### 2.1 FASE 1: Seguranca — DT-01, DT-02, DT-03, DT-04

#### DT-01 — Classificacao de Auth: 3 Categorias, Nao 1 (P0, BLOCKING)

**Problema:** O PRD trata todas as 12 rotas como iguais ("adicionar requireBrandAccess"). Na realidade, existem **3 categorias distintas** de autenticacao:

| Categoria | Rotas | Mecanismo Correto | Mecanismo no PRD |
|:----------|:------|:-------------------|:-----------------|
| **A: Brand Access** | social/generate, social/hooks, social/structure, social/scorecard, design/plan, design/generate, design/upscale, performance/metrics, funnels/export, funnels/share | `requireBrandAccess(req, brandId)` | OK |
| **B: Conversation Auth** | chat | Validar que caller e dono da conversa (userId match) | requireBrandAccess (INCORRETO) |
| **C: Webhook Signature** | webhooks/dispatcher | `validateWebhookSignature()` (JA IMPLEMENTADO) | requireBrandAccess (INCORRETO) |

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | Aplicar requireBrandAccess em 10 rotas (Cat. A). Para chat, criar `requireConversationAccess(req, conversationId)` que valida Bearer token + ownership. Para webhooks, manter assinatura atual e apenas adicionar rate limiting. | Correto por categoria |
| B | Forcar requireBrandAccess em todas as 12 como PRD diz | Quebra webhooks e exige refactor do chat |
| C | Ignorar chat e webhooks, fazer apenas as 10 rotas | Deixa gaps de seguranca no chat |

**Acao obrigatoria para SIG-SEC-01:**
- 10 rotas: `requireBrandAccess(req, brandId)` seguindo padrao da Intelligence Wing
- 1 rota (chat): criar `requireConversationAccess()` — valida Bearer token, busca conversa, compara userId do token com userId da conversa
- 1 rota (webhooks): NAO ALTERAR auth — ja protegida por assinatura. Apenas documentar como "auth via signature"

**Severidade:** P0 | **Blocking:** SIM

---

#### DT-02 — Rotas Social/* Nao Recebem brandId (P0, BLOCKING)

**Problema:** Para adicionar `requireBrandAccess`, o handler precisa extrair `brandId` do body ou query. Porem, varias rotas nao recebem esse campo:

| Rota | Recebe brandId? | Fonte de Dados Atual |
|:-----|:----------------|:--------------------|
| `social/generate` | NAO | `{ funnelId, userId, context }` |
| `social/hooks` | Verificar | Provavelmente similar |
| `social/structure` | Verificar | Provavelmente similar |
| `social/scorecard` | Verificar | Provavelmente similar |
| `design/plan` | Verificar | Body com context |
| `performance/metrics` | SIM | `searchParams.get('brandId')` |
| `funnels/export` | Verificar | Pode ter funnelId apenas |
| `funnels/share` | Verificar | Pode ter funnelId apenas |

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | Adicionar `brandId` como campo obrigatorio no body de cada rota que nao o possui. Manter retrocompatibilidade: se brandId ausente, retornar 400 com mensagem clara. O frontend ja possui contexto de brand ativo via `useBrandStore` — basta envia-lo | Correto, minimo impacto no frontend |
| B | Derivar brandId do funnelId (buscar funil no Firestore, ler brandId dele) | Adiciona latencia, mais complexo |
| C | Ignorar rotas sem brandId e documentar como "a ser resolvido em S29" | Deixa rotas vulneraveis — inaceitavel para P0 |

**Impacto no frontend:** QUALQUER componente que chama essas APIs precisa enviar `brandId` no body. Mapear todos os callers e adicionar o campo. Nao viola P10 (API publica inalterada) porque `brandId` e um campo ADICIONAL, nao substitui nenhum existente. O Verbo HTTP e URL permanecem iguais.

**Nota para Darllyson:** Antes de implementar SIG-SEC-01, fazer `rg "api/social/generate" app/src/` e equivalentes para localizar TODOS os callers frontend de cada rota. Garantir que todos enviam `brandId`.

**Severidade:** P0 | **Blocking:** SIM

---

#### DT-03 — Hydration Guard: Abordagem Recomendada (P1, Nao Blocking)

**Problema:** O PRD diz "adicionar `typeof window !== 'undefined'` guard ou `skipHydration`" mas nao especifica qual.

**Analise dos stores:**

| Store | Arquivo | Persist Key | Dados Persistidos |
|:------|:--------|:------------|:-----------------|
| `brand-store` | L21-40 | `brand-storage` | `selectedBrand` apenas |
| `context-store` | L27-61 | `context-storage` | Estado completo |

**Recomendacao: `skipHydration` + `onRehydrateStorage`** (padrao oficial Zustand para Next.js App Router)

```typescript
// Padrao a seguir em ambos os stores:
export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      // ... state e actions
    }),
    {
      name: 'brand-storage',
      partialize: (state) => ({ selectedBrand: state.selectedBrand }),
      skipHydration: true, // ← ADICIONAR
    }
  )
);

// Em um componente client root (ex: providers.tsx):
// useEffect(() => { useBrandStore.persist.rehydrate(); }, []);
```

**Justificativa:** `skipHydration: true` e o padrao recomendado por Zustand para SSR/App Router. O `typeof window` guard e um workaround que pode causar flash de estado durante hydration. `skipHydration` previne o mismatch completamente e rehydrata em client-only context.

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-04 — `force-dynamic`: 6 Rotas, Nao 7 (P2, Nao Blocking)

**Problema:** O PRD lista 7 rotas sem `force-dynamic`, incluindo `performance/metrics`. Porem, o PRD tambem lista `performance/metrics` como rota sem auth. A mesma correcao (SIG-SEC-01) vai tocar essa rota. Performance/metrics realmente nao tem `force-dynamic`, entao a contagem esta correta. Porem, `chat` ja tem `force-dynamic` (confirmado na L45) — o PRD NAO lista chat entre as 7, o que esta correto.

Adicionalmente, `social/generate` ja tem `force-dynamic` na L1 (confirmado na leitura). Se alguma outra rota da lista ja tiver, o esforco cai.

**Recomendacao:** Darllyson deve verificar cada uma das 7 rotas antes de adicionar. Se ja existir, apenas confirmar e seguir.

**Severidade:** P2 | **Blocking:** Nao

---

### 2.2 FASE 2: Consistencia de Tipos — DT-05, DT-06, DT-07, DT-08

#### DT-05 — `database.ts` Como Source of Truth: Correto, Mas Com Type Aliases Obrigatorios (P0, BLOCKING)

**Problema:** A eleicao de `database.ts` como source of truth esta correta para entidades persistidas. Porem, multiplos consumers importam de `@/types` (alias para `index.ts`):

**Mapa de Impacto — Message:**

| Consumer | Import Atual | Usa `Date`? | Acao Necessaria |
|:---------|:-------------|:-----------|:----------------|
| `chat-store.ts` | `@/types` (index.ts) | SIM (`new Date()`) | Migrar import + adaptar para Timestamp |
| `chat-message.tsx` | `@/types` (index.ts) | Possivelmente | Migrar import |

**Mapa de Impacto — Conversation:**

| Consumer | Import Atual | Usa `messages[]` embarcado? | Acao Necessaria |
|:---------|:-------------|:---------------------------|:----------------|
| `chat-store.ts` | `@/types` (index.ts) | SIM (L33-34: `messages: []`) | **CRITICO** — database.ts nao tem `messages[]` (subcollection) |

**Mapa de Impacto — Funnel:**

| Consumer | Import Atual | Acao |
|:---------|:-------------|:-----|
| 45+ arquivos | `@/types/database` | Ja usam source of truth — zero impacto |
| FunnelMap.tsx | `@/types/funnel` | Usa `FunnelDocument`, nao `Funnel` — zero impacto |

**Mapa de Impacto — AutopsyReport:**

| Consumer | Import Atual | Estrutura Esperada | Acao |
|:---------|:-------------|:-------------------|:-----|
| `AutopsyReportView.tsx` | `@/types/autopsy` | `score`, `heuristics`, `recommendations` | Source of truth — zero impacto |
| `autopsy/engine.ts` | `@/types/autopsy` | Idem | Zero impacto |
| `strategy/autopsy/page.tsx` | `@/types/autopsy` | Idem | Zero impacto |
| `FunnelMap.tsx` | `@/types/funnel` | `overallHealth`, `criticalGaps` | **REQUER ADAPTER** |
| `automation/engine.ts` | `@/types/funnel` | Idem | **REQUER ADAPTER** |
| `automation tests` (2 files) | `@/types/funnel` | Idem | **REQUER ADAPTER** |

**Mapa de Impacto — SocialPlatform:**

| Consumer | Import Atual | Casing | Acao |
|:---------|:-------------|:-------|:-----|
| `normalizer.ts` | `@/types/social` | lowercase | Source of truth — zero impacto |
| `adaptation-pipeline.ts` | `@/types/vault` | PascalCase | **MIGRAR** para lowercase |
| `brand-validation.ts` | `@/types/vault` | PascalCase | **MIGRAR** para lowercase |
| `publisher.ts` (type) | `@/types/vault` | PascalCase | **MIGRAR** para lowercase |
| VaultContent.variants | `@/types/vault` | PascalCase (`platform: SocialPlatform`) | **MIGRAR** dados + tipo |

**Estrategia de Migracao Recomendada: GRADUAL com Type Aliases**

```typescript
// Em types/index.ts — FASE TRANSITORIA (Sigma)
// Re-export do source of truth para nao quebrar imports existentes
export type { Message, Conversation } from './database';

// Type alias de compatibilidade para chat-store (sera removido em S29)
/** @deprecated Use Conversation from database.ts. Este alias sera removido em S29. */
export interface LegacyConversation {
  id: string;
  title: string;
  messages: Message[]; // Modelo embarcado legado
  createdAt: Date;
  updatedAt: Date;
}
```

**Regra ABSOLUTA:** Nenhum consumer que importa de `@/types` deve quebrar apos a consolidacao. Se quebrar, faltou um alias ou re-export.

**Severidade:** P0 | **Blocking:** SIM

---

#### DT-06 — AutopsyReport: Duas Estruturas Incompativeis Requerem Adapter (P1, Nao Blocking)

**Problema:** `autopsy.ts` e `funnel.ts` definem `AutopsyReport` com estruturas COMPLETAMENTE diferentes:

| Campo | `autopsy.ts` (canonico) | `funnel.ts` (legado) |
|:------|:----------------------|:---------------------|
| Score | `score: number` (0-10) | `overallHealth: number` (0-100) |
| Gaps | ausente | `criticalGaps: CriticalGap[]` |
| Heuristics | `heuristics: { hook, story, offer, friction, trust }` | ausente |
| Recomendacoes | `recommendations: Recommendation[]` | `actionPlan: { task, expectedImpact, difficulty }[]` |

**Consumers de `funnel.ts` AutopsyReport:**
- `FunnelMap.tsx` (importa FunnelDocument que referencia indiretamente)
- `automation/engine.ts` + 2 test files

**Recomendacao:** Seguir PRD (eleger autopsy.ts como canonico) + criar adapter:

```typescript
// types/funnel.ts — apos consolidacao
import { AutopsyReport } from './autopsy';

/** @deprecated Use AutopsyReport de autopsy.ts. Adapter para formato legado. */
export interface LegacyAutopsyReport {
  id: string;
  funnelId: string;
  timestamp: Timestamp;
  overallHealth: number;
  criticalGaps: CriticalGap[];
  stepAnalysis: Record<string, { ... }>;
  actionPlan: { ... }[];
}

// Adapter function
export function adaptLegacyAutopsyReport(legacy: LegacyAutopsyReport): AutopsyReport {
  return {
    id: legacy.id,
    funnelId: legacy.funnelId,
    timestamp: legacy.timestamp,
    score: legacy.overallHealth / 10, // 0-100 → 0-10
    summary: `Health Score: ${legacy.overallHealth}/100`,
    heuristics: {
      hook: { score: 0, status: 'warning', findings: [] },
      story: { score: 0, status: 'warning', findings: [] },
      offer: { score: 0, status: 'warning', findings: [] },
      friction: { score: 0, status: 'warning', findings: [] },
      trust: { score: 0, status: 'warning', findings: [] },
    },
    recommendations: legacy.actionPlan.map(a => ({
      priority: a.difficulty === 'easy' ? 'high' : a.difficulty === 'hard' ? 'low' : 'medium',
      type: 'technical' as const,
      action: a.task,
      impact: a.expectedImpact,
    })),
    metadata: { loadTimeMs: 0, techStack: [] },
  };
}
```

**Nota:** Manter `LegacyAutopsyReport` em `funnel.ts` com `@deprecated`. Consumers de `funnel.ts` continuam funcionando. Migrar consumers para autopsy.ts gradualmente em S29+.

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-07 — SocialPlatform PascalCase → Lowercase: Impacto em Vault (P1, Nao Blocking)

**Problema:** `vault.ts` usa `SocialPlatform = 'X' | 'LinkedIn' | 'Instagram'` (PascalCase). A consolidacao para lowercase (`'x' | 'linkedin' | 'instagram'`) quebra:

1. `VaultContent.variants[].platform` — tipo muda
2. `CopyDNA.platform_optimization` — tipo muda
3. Consumers: `adaptation-pipeline.ts`, `brand-validation.ts`, `publisher.ts`
4. **Dados existentes no Firestore** — documentos ja gravados com PascalCase

**Recomendacao:**

```typescript
// types/social-platform.ts (novo arquivo canonico)
export type SocialPlatform = 'instagram' | 'tiktok' | 'linkedin' | 'x' | 'whatsapp';

// Adapter para dados legados do Vault (PascalCase → lowercase)
const PLATFORM_MAP: Record<string, SocialPlatform> = {
  'X': 'x',
  'LinkedIn': 'linkedin',
  'Instagram': 'instagram',
  // lowercase ja correto — passthrough
  'x': 'x',
  'linkedin': 'linkedin',
  'instagram': 'instagram',
  'tiktok': 'tiktok',
  'whatsapp': 'whatsapp',
};

export function normalizePlatform(raw: string): SocialPlatform {
  return PLATFORM_MAP[raw] || raw.toLowerCase() as SocialPlatform;
}
```

**Regra:** NAO alterar dados existentes no Firestore. O adapter `normalizePlatform()` converte em runtime. Novas gravacoes usam lowercase.

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-08 — Awareness Stage: Migrar database.ts de PT para Schwartz (P1, Nao Blocking)

**Problema:** `database.ts` FunnelContext (L263) usa modelo PT (`'fria' | 'morna' | 'quente'`). `index.ts` FunnelContext (L79) usa Schwartz (`'unaware' | 'problem' | 'solution' | 'product'`). O PRD elege Schwartz como canonico.

**Riscos:**
- Dados existentes no Firestore contem `fria`, `morna`, `quente`
- Queries que filtram por awareness vao quebrar se o tipo mudar

**Recomendacao:** Seguir PRD + criar funcao de mapeamento runtime (ja prevista em R3 do PRD):

```typescript
// lib/utils/awareness-adapter.ts
export type LegacyAwareness = 'fria' | 'morna' | 'quente';
export type SchwartzAwareness = 'unaware' | 'problem' | 'solution' | 'product' | 'most_aware';

const LEGACY_TO_SCHWARTZ: Record<LegacyAwareness, SchwartzAwareness> = {
  'fria': 'unaware',
  'morna': 'solution',
  'quente': 'product',
};

export function normalizeAwareness(raw: string): SchwartzAwareness {
  if (raw in LEGACY_TO_SCHWARTZ) {
    return LEGACY_TO_SCHWARTZ[raw as LegacyAwareness];
  }
  return raw as SchwartzAwareness;
}
```

**Regra:** NAO alterar dados no Firestore (conforme R3 do PRD). Converter em runtime.

**Severidade:** P1 | **Blocking:** Nao

---

### 2.3 FASE 3: API Consistency — DT-09, DT-10

#### DT-09 — Schema Proposto para `createApiError()` / `createApiSuccess()` (P1, Nao Blocking)

**Analise dos 5 formatos existentes:**

```
Formato A: { error: 'string' }                     → social/*, design/plan
Formato B: { error: 'string', details: '...' }     → ai/analyze-visual, webhooks
Formato C: { error: 'string', code: 'CODE' }       → intelligence/analyze
Formato D: { error, code, details, requestId }      → intelligence/keywords
Formato E: { success: false, message: '...' }       → performance/metrics
```

**Schema Proposto:**

```typescript
// lib/utils/api-response.ts

import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// ============================================
// ERROR RESPONSE
// ============================================

interface ApiErrorOptions {
  code?: string;
  details?: unknown;
  requestId?: string;
}

/**
 * Cria resposta de erro padronizada.
 * Shape: { error: string, code?: string, details?: unknown, requestId: string }
 *
 * RETROCOMPATIBILIDADE:
 * - Campo `error` (string) SEMPRE presente → formatos A/B/C/D cobertos
 * - Campo `success: false` NAO incluido (formato E era minoria)
 *   Para performance/metrics que usava `success: false`, o frontend
 *   deve ser atualizado para checar `response.error` em vez de `!response.success`
 */
export function createApiError(
  status: number,
  message: string,
  options: ApiErrorOptions = {}
): NextResponse {
  const { code, details, requestId } = options;
  
  return NextResponse.json(
    {
      error: message,
      ...(code && { code }),
      ...(details !== undefined && { details }),
      requestId: requestId || randomUUID(),
    },
    { status }
  );
}

// ============================================
// SUCCESS RESPONSE
// ============================================

interface ApiSuccessOptions {
  meta?: Record<string, unknown>;
  status?: number;
}

/**
 * Cria resposta de sucesso padronizada.
 * Shape: { success: true, data: T, meta?: object }
 *
 * RETROCOMPATIBILIDADE:
 * - Campo `success: true` adicionado para uniformidade
 * - Campo `data` contem o payload — rotas que retornavam campos
 *   diretamente no root (ex: { hooks: [...] }) devem migrar
 *   para { data: { hooks: [...] } }
 * - Para migracao gradual: o frontend pode checar
 *   `response.data || response` como fallback
 */
export function createApiSuccess<T>(
  data: T,
  options: ApiSuccessOptions = {}
): NextResponse {
  const { meta, status = 200 } = options;
  
  return NextResponse.json(
    {
      success: true as const,
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

// ============================================
// TYPE EXPORTS (para consumers)
// ============================================

export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
  requestId: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
```

**Decisao de design critica — campo `error` como key de deteccao:**

O frontend em multiplos pontos (ex: `use-conversations.ts` L140) checa `errorData.error === 'insufficient_credits'`. O schema acima mantem `error` como campo top-level em respostas de erro, garantindo retrocompatibilidade.

Para respostas de sucesso, o campo `data` encapsula o payload. A migracao deve ser feita por lotes:
1. Primeiro: criar `api-response.ts` e usar em rotas NOVAS
2. Segundo: migrar rotas gradualmente, verificando callers frontend de cada uma
3. Terceiro: validar que nenhum caller quebrou

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-10 — Chat Route: Formato de Sucesso Especial (P1, Nao Blocking)

**Problema:** A rota `/api/chat` retorna um formato de sucesso unico:
```json
{ "response": "...", "sources": [...], "version": "11.24.5-perf" }
```

Isso NAO se encaixa no shape `{ success: true, data: T }` de `createApiSuccess`. O consumer `use-conversations.ts` (L136-151) checa `response.ok` do fetch, nao campos do body.

**Recomendacao:** Para a rota de chat, usar `createApiSuccess` com o shape atual DENTRO de data:

```typescript
// Antes:
return NextResponse.json({ response: assistantResponse, sources, version });

// Depois:
return createApiSuccess({
  response: assistantResponse,
  sources,
  version: '11.24.5-perf'
});
// Shape final: { success: true, data: { response, sources, version } }
```

**ATENCAO:** O consumer `use-conversations.ts` NAO le campos do body de sucesso (usa subscription real-time). Porem, outros consumers futuros podem. Migrar preventivamente.

Para o formato de ERRO do chat, a rota usa `{ error: 'insufficient_credits', message: '...' }` (L102). Migrar para:
```typescript
return createApiError(403, 'insufficient_credits', {
  code: 'INSUFFICIENT_CREDITS',
  details: 'Saldo de creditos insuficiente.'
});
```

O consumer checa `errorData.error === 'insufficient_credits'` — o campo `error` continua presente com o mesmo valor.

**Severidade:** P1 | **Blocking:** Nao

---

### 2.4 FASE 4: Architecture — DT-11, DT-12, DT-13, DT-14

#### DT-11 — Pinecone: INVERTER Decisao de Sobrevivencia (P0, BLOCKING)

**Problema (DC-02 detalhado):**

| Arquivo | API Style | Consumers | Features |
|:--------|:----------|:----------|:---------|
| `pinecone.ts` | **Async** (dynamic import) | **6 modulos** | `getPineconeClient`, `getPineconeIndex`, `upsertToPinecone`, `queryPinecone`, `checkPineconeHealth` |
| `pinecone-client.ts` | **Sync** (top-level import) | **0 modulos** | `getPineconeClient`, `getPineconeIndex`, `checkPineconeHealth`, `buildPineconeRecord` |

**Opcoes:**

| Opcao | Descricao | Recomendacao |
|:------|:----------|:-------------|
| **A (Recomendada)** | MANTER `pinecone.ts` como base. Absorver `buildPineconeRecord()` de pinecone-client.ts. DELETAR `pinecone-client.ts`. Zero migracao de consumers. | Minimo risco, zero breaking changes |
| B | Manter pinecone-client.ts (como PRD diz). Migrar 6 consumers de async → sync. | Alto risco, ~2h extra, muda contratos |
| C | Merge: criar `pinecone-unified.ts` com a melhor API de cada | Over-engineering para o escopo Sigma |

**Justificativa da Opcao A:**
- `pinecone.ts` usa dynamic import (`await import()`), o que e melhor para tree-shaking e bundle size
- `pinecone.ts` tem browser guards (`typeof window !== 'undefined'`) em todas as funcoes
- `pinecone.ts` tem funcoes utilitarias de alto nivel (`upsertToPinecone`, `queryPinecone`) que os consumers ja usam
- `pinecone-client.ts` tem uma feature unica (`buildPineconeRecord`) que e trivial de copiar

**Acao:**
1. Copiar `buildPineconeRecord()` de `pinecone-client.ts` para `pinecone.ts`
2. Deletar `pinecone-client.ts`
3. Zero alteracao em consumers
4. Deletar `vertex.ts` (bonus, codigo morto confirmado)

**Severidade:** P0 | **Blocking:** SIM (deletar o arquivo errado quebra 6 modulos)

---

#### DT-12 — Chat State: chat-store.ts Usa Tipos de index.ts (P1, Nao Blocking)

**Problema:** `chat-store.ts` (L2) importa `Message` e `Conversation` de `@/types` (index.ts). O store:
- Cria Conversations com `messages: Message[]` embarcado (L33-34)
- Usa `new Date()` para timestamps (L35-36)
- Nao tem `tenantId`, `userId`, `context` no Conversation

Apos consolidacao de tipos (Fase 2), se `Conversation` for redirecionado para `database.ts`, o chat-store quebrara porque:
1. `database.ts` Conversation NAO tem campo `messages` (usa subcollection)
2. `database.ts` usa `Timestamp`, nao `Date`

**Recomendacao:** A Fase 4 (SIG-ARC-02) RESOLVE isso ao migrar chat-store para metadata-only. Porem, a **sequencia de execucao importa**:

1. **Fase 2:** Consolidar tipos MAS criar alias `LegacyConversation` em index.ts para chat-store (DT-05)
2. **Fase 4:** Migrar chat-store para useConversations (remove dependencia do alias)
3. **S29:** Remover alias `LegacyConversation`

**Alternativa (se Fases 2 e 4 forem executadas como PRD manda, sequencialmente):**
- Na Fase 2, o chat-store continua usando o alias temporario — nao quebra
- Na Fase 4, o chat-store perde `currentConversation` e `messages[]` — alias se torna desnecessario
- Gate Check 2 valida que tsc=0 com o alias no lugar

**Severidade:** P1 | **Blocking:** Nao (resolvido pela sequencia correta)

---

#### DT-13 — Chat-input-area Refactor: Interfaces dos Hooks (P1, Nao Blocking)

**Analise detalhada do componente (428 linhas):**

| Responsabilidade | Linhas Reais | Hook Proposto | Interface |
|:-----------------|:-------------|:-------------|:----------|
| File upload + Firestore | L67-156 (90 linhas) | `useFileUpload` | `(activeBrand, user) => { handleFileSelect, removeAttachment, attachments, isUploading }` |
| Multimodal analysis | Dentro de handleFileSelect L128-136 | `useMultimodalAnalysis` | `() => { analyze: (file, prompt) => Promise<string> }` |
| Party mode agents | L160-170, L203-210 | `usePartyMode` | `(mode) => { selectedAgents, setSelectedAgents, intensity, setIntensity, hasMinimumAgents }` |
| Message construction | L188-217 (30 linhas) | `useChatMessage` | `(attachments, mode, partyState) => { handleSubmit, value, setValue }` |
| Textarea resize | L240-245 | (inline useEffect) | Manter no componente — 5 linhas |

**Interfaces propostas:**

```typescript
// hooks/chat/use-file-upload.ts
interface UseFileUploadReturn {
  attachments: Attachment[];
  isUploading: boolean;
  handleFileSelect: (files: FileList | null) => Promise<void>;
  removeAttachment: (id: string) => void;
  clearAttachments: () => void;
}
export function useFileUpload(brandId: string | null, userId: string | null): UseFileUploadReturn;

// hooks/chat/use-multimodal-analysis.ts
interface UseMultimodalAnalysisReturn {
  analyze: (file: File) => Promise<string>;
  isAnalyzing: boolean;
}
export function useMultimodalAnalysis(): UseMultimodalAnalysisReturn;

// hooks/chat/use-party-mode.ts
interface UsePartyModeReturn {
  selectedAgents: string[];
  setSelectedAgents: (agents: string[]) => void;
  intensity: 'debate' | 'consensus';
  setIntensity: (intensity: 'debate' | 'consensus') => void;
  hasMinimumAgents: boolean;
  counselorNames: string;
}
export function usePartyMode(mode: ChatMode): UsePartyModeReturn;

// hooks/chat/use-chat-message.ts
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

**Regra:** O componente final deve ser APENAS UI — layout, event handlers delegando para hooks, JSX. Meta: ≤ 150 linhas.

**Severidade:** P1 | **Blocking:** Nao

---

#### DT-14 — Chat State Migration: Garantia de Zero Perda (P1, Nao Blocking)

**Problema:** O PRD preve migrar de chat-store (in-memory) para useConversations (Firestore real-time). Como garantir que conversas ativas nao sao perdidas?

**Analise:**
- `chat-store.ts` mantem conversas IN-MEMORY (sem persist no store)
- `useConversations()` le do Firestore (real-time subscription)
- O chat route (`/api/chat`) ja SALVA no Firestore via `addMessage()` (L373-380)
- A subscription em `use-conversations.ts` (L90) usa `subscribeToMessages()` para real-time

**Conclusao:** NAO ha risco de perda de dados. O Firestore ja e a fonte de verdade para mensagens (a rota API grava la). O chat-store e apenas um cache in-memory que pode estar desatualizado. A migracao e SEGURA porque:

1. Todas as mensagens ja estao no Firestore
2. `useConversations` le do Firestore
3. chat-store nunca grava no Firestore — apenas cache local
4. Conversas "ativas" que existem APENAS no chat-store (nunca enviadas) sao conversas vazias — perda aceitavel

**Estrategia de migracao:**

1. Reduzir `chat-store.ts` a metadata-only:
   ```typescript
   interface ChatUIState {
     isSidebarOpen: boolean;
     inputMode: ChatMode;
     isStreaming: boolean;
     // Removido: conversations, currentConversation, messages
   }
   ```
2. Todos os consumers de `currentConversation` e `messages` migram para `useConversation(id)`
3. O componente de chat usa `conversationId` como state (URL ou local) e passa para `useConversation`

**Severidade:** P1 | **Blocking:** Nao

---

## 3. Tabela Consolidada de Decision Topics

| DT | Titulo | Severidade | Blocking? | Fase | Item PRD | Acao |
|:---|:-------|:-----------|:----------|:-----|:---------|:-----|
| **DT-01** | Auth em 3 categorias, nao 1 | **P0** | **SIM** | F1 | SIG-SEC-01 | 10 rotas brand-access + 1 conversation-access + 1 signature (ja ok) |
| **DT-02** | Rotas social/* sem brandId no body | **P0** | **SIM** | F1 | SIG-SEC-01 | Adicionar brandId obrigatorio no body + mapear callers frontend |
| **DT-03** | Hydration guard: skipHydration recomendado | P1 | Nao | F1 | SIG-SEC-03 | Usar `skipHydration: true` + `rehydrate()` em client root |
| **DT-04** | force-dynamic: verificar antes de adicionar | P2 | Nao | F1 | SIG-SEC-02 | Confirmar ausencia em cada rota antes de adicionar |
| **DT-05** | Type aliases obrigatorios para migracao gradual | **P0** | **SIM** | F2 | SIG-TYP-01/02/03 | Re-exports em index.ts + LegacyConversation alias para chat-store |
| **DT-06** | AutopsyReport: adapter para formato legado | P1 | Nao | F2 | SIG-TYP-04 | Manter LegacyAutopsyReport + funcao adapter |
| **DT-07** | SocialPlatform PascalCase → lowercase adapter | P1 | Nao | F2 | SIG-TYP-05 | `normalizePlatform()` + NAO alterar dados Firestore |
| **DT-08** | Awareness PT → Schwartz adapter runtime | P1 | Nao | F2 | SIG-TYP-07 | `normalizeAwareness()` + NAO alterar dados Firestore |
| **DT-09** | Schema createApiError/createApiSuccess | P1 | Nao | F3 | SIG-API-01 | Schema definido acima com retrocompatibilidade |
| **DT-10** | Chat route: formato especial de sucesso | P1 | Nao | F3 | SIG-API-02 | Encapsular em `createApiSuccess({ response, sources, version })` |
| **DT-11** | Pinecone: INVERTER arquivo a manter | **P0** | **SIM** | F4 | SIG-ARC-01 | Manter pinecone.ts (6 consumers), absorver buildPineconeRecord, deletar pinecone-client.ts |
| **DT-12** | Chat-store depende de tipos index.ts | P1 | Nao | F4 | SIG-ARC-02 | Resolvido pela sequencia correta (F2 alias → F4 migracao) |
| **DT-13** | chat-input-area: interfaces dos 4 hooks | P1 | Nao | F4 | SIG-ARC-03 | Interfaces definidas acima |
| **DT-14** | Chat state: zero risco de perda de dados | P1 | Nao | F4 | SIG-ARC-02 | Firestore ja e source of truth. chat-store e apenas cache. |

---

## 4. Correcoes nas Premissas do PRD

| # | Premissa do PRD | Realidade | Impacto na Estimativa |
|:--|:----------------|:----------|:---------------------|
| **CP-01** | "requireBrandAccess em 12 rotas" | 10 brand-access + 1 conversation-access + 1 ja protegida | +1h (criar requireConversationAccess) |
| **CP-02** | "Eliminar pinecone.ts, manter pinecone-client.ts" | pinecone.ts tem 6 consumers, pinecone-client.ts tem 0 | 0h (inverter a decisao e MAIS simples) |
| **CP-03** | "chat-input-area.tsx 391 linhas" | 428 linhas reais | +15min de escopo |
| **CP-04** | "Rotas social/* so precisam de requireBrandAccess" | Nao recebem brandId no body | +1h (alterar body de 4 rotas + frontend callers) |
| **CP-05** | "database.ts source of truth — re-export de index.ts" | chat-store.ts cria Conversation com messages[] embarcado (modelo index.ts) | +30min (alias LegacyConversation) |
| **CP-06** | "SocialPlatform consolidar em lowercase" | vault.ts e 3 consumers usam PascalCase + dados Firestore ja gravados | +30min (adapter normalizePlatform) |

---

## 5. Estimativa Revisada (Athos)

### Fase 1 — Seguranca

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| SIG-SEC-01 (auth) | L (~3h) | L+ (~4.5h) | +1.5h | DT-01 (3 categorias de auth) + DT-02 (brandId ausente em 4+ rotas) |
| SIG-SEC-02 (force-dynamic) | XS (~15min) | XS (~15min) | = | DT-04: verificar antes de adicionar |
| SIG-SEC-03 (hydration) | XS (~30min) | XS (~30min) | = | DT-03: skipHydration e direto |
| **Subtotal F1** | **~3-4h** | **~5-5.5h** | **+1.5h** | |

### Fase 2 — Tipos

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| SIG-TYP-01 (Message) | M (~1h) | M (~1.5h) | +30min | DT-05: alias para chat-store |
| SIG-TYP-02 (Conversation) | M (~1h) | M (~1.5h) | +30min | DT-05: LegacyConversation alias |
| SIG-TYP-03 (Funnel) | M (~1.5h) | M (~1.5h) | = | Maioria ja usa database.ts |
| SIG-TYP-04 (AutopsyReport) | M (~1h) | M (~1.5h) | +30min | DT-06: adapter + LegacyAutopsyReport |
| SIG-TYP-05 (SocialPlatform) | S (~30min) | S+ (~45min) | +15min | DT-07: normalizePlatform adapter |
| SIG-TYP-06 (Date→Timestamp) | S (~30min) | S (~30min) | = | Direto |
| SIG-TYP-07 (Awareness) | S (~30min) | S+ (~45min) | +15min | DT-08: normalizeAwareness adapter |
| **Subtotal F2** | **~5-6h** | **~7-8h** | **+2h** | |

### Fase 3 — API Consistency

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| SIG-API-01 (api-response.ts) | S (~30min) | S (~30min) | = | DT-09: schema definido neste review |
| SIG-API-02 (migrar 30+ rotas) | L (~3h) | L (~3.5h) | +30min | DT-10: chat route formato especial |
| SIG-API-03 (credit tracking) | M (~2h) | M (~2h) | = | Padrao existente |
| **Subtotal F3** | **~5-6h** | **~6h** | **+0.5h** | |

### Fase 4 — Architecture

| Story | PRD Estimativa | Athos Estimativa | Delta | Justificativa |
|:------|:--------------|:-----------------|:------|:-------------|
| SIG-ARC-01 (Pinecone) | M (~2h) | S (~1h) | **-1h** | DT-11: manter pinecone.ts, apenas copiar 1 funcao |
| SIG-ARC-02 (Chat state) | L (~3h) | L (~3h) | = | DT-14: seguro, sem risco de perda |
| SIG-ARC-03 (chat-input-area) | L (~3h) | L (~3.5h) | +30min | DT-13: 428 linhas, nao 391 |
| **Subtotal F4** | **~7-8h** | **~7.5h** | **-0.5h** | |

### Total Consolidado

| Fase | PRD | Athos | Delta |
|:-----|:----|:------|:------|
| Fase 1 (Seguranca) | 3-4h | 5-5.5h | +1.5h |
| Fase 2 (Tipos) | 5-6h | 7-8h | +2h |
| Fase 3 (API) | 5-6h | 6h | +0.5h |
| Fase 4 (Architecture) | 7-8h | 7.5h | -0.5h |
| Bonus | ~15min | ~15min | = |
| QA Final | 1-2h | 1-2h | = |
| **TOTAL** | **~22-28h** | **~27-33h** | **+3.5h** |

**Incremento de ~3.5h justificado por:**
- DT-01/DT-02: +1.5h (classificacao de auth + brandId ausente)
- DT-05/DT-06/DT-07/DT-08: +1.5h (adapters de compatibilidade)
- DT-10/DT-13: +0.5h (chat format + componente maior)
- DT-11: -1h (inverter Pinecone simplifica)

---

## 6. Checklist de Retrocompatibilidade

| # | Item | Verificacao | Responsavel |
|:--|:-----|:-----------|:-----------|
| RC-01 | Nenhuma URL de API muda | `rg "api/" app/src/app/api/` — todas as rotas mantem mesmo path | Dandara |
| RC-02 | Nenhum metodo HTTP muda | POST continua POST, GET continua GET | Dandara |
| RC-03 | Campo `error` presente em todas as respostas de erro | `createApiError` sempre retorna `{ error: string, ... }` | Dandara |
| RC-04 | Frontend checa `errorData.error === 'insufficient_credits'` | Chat route mantem esse valor exato no campo `error` | Dandara |
| RC-05 | `from '@/types'` continua funcionando | Re-exports em index.ts para Message, Conversation, Funnel | Dandara |
| RC-06 | `from '@/types/funnel'` continua exportando AutopsyReport | Manter como LegacyAutopsyReport + AutopsyReport (re-export do autopsy.ts) | Dandara |
| RC-07 | `from '@/types/vault'` continua exportando SocialPlatform | Re-export de `social-platform.ts` | Dandara |
| RC-08 | Nenhum dado Firestore e alterado | Adapters em runtime (normalizePlatform, normalizeAwareness) | Dandara |
| RC-09 | Webhooks continuam funcionando sem Bearer token | `webhooks/dispatcher` mantem auth por assinatura | Dandara |
| RC-10 | chat-store consumers nao quebram durante Fase 2 | LegacyConversation alias disponivel ate Fase 4 concluir | Dandara |
| RC-11 | Pinecone consumers nao quebram | pinecone.ts mantido, apenas pinecone-client.ts deletado | Dandara |
| RC-12 | 218+ testes passando em cada Gate | `npm test` em G1, G2, e final | Dandara |

---

## 7. Proibicoes Tecnicas Adicionais (Alem do PRD)

| # | Proibicao | Justificativa |
|:--|:----------|:-------------|
| **PA-01** | **NUNCA alterar dados no Firestore** durante consolidacao de tipos | Adapters em runtime — dados legados permanecem intocados |
| **PA-02** | **NUNCA deletar pinecone.ts** (manter e absorver funcoes de pinecone-client.ts) | 6 consumers dependem de pinecone.ts, 0 de pinecone-client.ts |
| **PA-03** | **NUNCA aplicar requireBrandAccess em webhooks/dispatcher** | Rota de webhook usa validacao de assinatura, nao auth de usuario |
| **PA-04** | **NUNCA remover o campo `error` das respostas de erro** | Frontend depende de `response.error` para deteccao de erro |
| **PA-05** | **NUNCA remover re-exports de index.ts** durante Fase 2 | Consumers existentes importam de `@/types` — manter aliases ativos |
| **PA-06** | **NUNCA remover LegacyConversation alias** antes da conclusao de SIG-ARC-02 (Fase 4) | chat-store.ts depende do modelo embarcado ate migracao |

---

## 8. Sequencia de Execucao Refinada (Athos)

```
[FASE 1 — Seguranca (P0-A)]
  ★ Primeiro: Mapear callers frontend das 10 rotas (DT-02)
  ★ Criar requireConversationAccess() (DT-01)
  SIG-SEC-01 (10 brand-access + 1 conversation-access + documentar webhook)
    → SIG-SEC-02 (force-dynamic, verificar antes)
      → SIG-SEC-03 (hydration — skipHydration)

  ── GATE CHECK 1 ── (tsc + build + tests + review) ──

[FASE 2 — Tipos (P0-B)]
  ★ Primeiro: Criar social-platform.ts + normalizePlatform() (DT-07)
  ★ Criar awareness-adapter.ts + normalizeAwareness() (DT-08)
  SIG-TYP-05 (SocialPlatform) → SIG-TYP-06 (Date→Timestamp) → SIG-TYP-07 (Awareness)
    → SIG-TYP-01 (Message) + SIG-TYP-02 (Conversation) [DT-05: aliases]
      → SIG-TYP-03 (Funnel) → SIG-TYP-04 (AutopsyReport) [DT-06: adapter]

  ── GATE CHECK 2 ── (tsc + build + tests + review) ──

[FASE 3 — API Consistency (P1)]
  SIG-API-01 (criar api-response.ts com schema DT-09)
    → SIG-API-02 (migrar 30+ rotas — batch por wing)
      → SIG-API-03 (credit tracking 10 rotas) + SIG-BNS-02 (estimateTokens)

[FASE 4 — Architecture (P1)]
  SIG-ARC-01 (Pinecone — Opcao A: manter .ts, deletar -client.ts) [DT-11]
    + SIG-BNS-01 (deletar vertex.ts)
  SIG-ARC-02 (Chat state → useConversations) [DT-12, DT-14]
    → SIG-ARC-03 (chat-input-area → 4 hooks) [DT-13]

[QA FINAL]
  Dandara valida SC-01 a SC-10 + RC-01 a RC-12
```

**Mudancas vs PRD:**
- F1: requireConversationAccess como primeiro item (pre-requisito)
- F1: Mapear callers frontend ANTES de tocar rotas (DT-02)
- F2: Adapters criados ANTES da consolidacao (DT-07, DT-08)
- F2: Aliases em index.ts para proteger chat-store (DT-05)
- F4: Pinecone invertido — manter .ts, deletar -client.ts (DT-11)

---

## 9. Checklist de Blocking DTs (Gate para SM)

Leticia (SM) NAO deve iniciar Story Packing sem confirmar que Darllyson compreendeu:

- [ ] **DT-01**: 3 categorias de auth (brand-access, conversation-access, webhook-signature)
- [ ] **DT-02**: Mapear callers frontend de social/*, design/*, funnels/* para verificar se enviam brandId
- [ ] **DT-05**: Criar aliases em index.ts para proteger chat-store durante Fase 2
- [ ] **DT-11**: Pinecone — manter pinecone.ts, deletar pinecone-client.ts (INVERSO do PRD)

---

## 10. Veredito Final

### APROVADO COM RESSALVAS

O PRD da Sprint Sigma esta **solido**, bem estruturado, com fases sequenciais corretas e gates obrigatorios. O modelo Stabilization (S22/S26) e adequado. O escopo de P0+P1 e completo e justificado.

**Ressalvas obrigatorias:**

1. **DT-01 e P0 BLOCKING**: Auth tem 3 categorias — nao aplicar requireBrandAccess uniformemente. Webhooks usam assinatura. Chat precisa de requireConversationAccess.
2. **DT-02 e P0 BLOCKING**: Rotas social/* nao recebem brandId no body. Mapear callers frontend ANTES de implementar. Adicionar brandId como campo obrigatorio.
3. **DT-05 e P0 BLOCKING**: Type aliases sao obrigatorios para migracao gradual. Sem eles, chat-store quebra na Fase 2.
4. **DT-11 e P0 BLOCKING**: Pinecone — INVERTER a decisao do PRD. Manter pinecone.ts (6 consumers), deletar pinecone-client.ts (0 consumers).
5. **Estimativa ajustada +3.5h**: Justificada por DTs blocking e adapters de compatibilidade.
6. **PA-01 a PA-06**: 6 proibicoes tecnicas adicionais (alem das 12 do PRD).

**O PRD pode prosseguir para Story Packing (Leticia) apos confirmacao dos 4 blocking DTs.**

---

## Apendice A: Mapa de Impacto Consolidado por Arquivo

### Arquivos Criados (Novos)

| Arquivo | Fase | Responsavel |
|:--------|:-----|:-----------|
| `lib/auth/conversation-guard.ts` | F1 | DT-01 |
| `types/social-platform.ts` | F2 | DT-07 |
| `lib/utils/awareness-adapter.ts` | F2 | DT-08 |
| `lib/utils/api-response.ts` | F3 | DT-09 |
| `hooks/chat/use-file-upload.ts` | F4 | DT-13 |
| `hooks/chat/use-multimodal-analysis.ts` | F4 | DT-13 |
| `hooks/chat/use-party-mode.ts` | F4 | DT-13 |
| `hooks/chat/use-chat-message.ts` | F4 | DT-13 |

### Arquivos Deletados

| Arquivo | Fase | Justificativa |
|:--------|:-----|:-------------|
| `lib/ai/pinecone-client.ts` | F4 | 0 consumers, funcoes absorvidas por pinecone.ts (DT-11) |
| `lib/ai/vertex.ts` | F4 | Codigo morto, 0 consumers (SIG-BNS-01) |

### Arquivos Modificados (Top 20 por Impacto)

| Arquivo | Fases | Motivo |
|:--------|:------|:-------|
| 10 rotas API (social/*, design/*, etc) | F1 + F3 | Auth + format unificado |
| `api/chat/route.ts` | F1 + F3 | requireConversationAccess + createApiSuccess |
| `types/index.ts` | F2 | Re-exports + aliases + Date→Timestamp |
| `types/database.ts` | F2 | Awareness Schwartz + remover modelo PT |
| `types/funnel.ts` | F2 | LegacyAutopsyReport + adapter |
| `types/vault.ts` | F2 | SocialPlatform → re-export de social-platform.ts |
| `types/social.ts` | F2 | SocialPlatform → re-export de social-platform.ts |
| `types/social-inbox.ts` | F2 | SocialPlatform → re-export de social-platform.ts |
| `stores/brand-store.ts` | F1 | skipHydration |
| `stores/context-store.ts` | F1 | skipHydration |
| `stores/chat-store.ts` | F4 | Reduzir a metadata-only |
| `lib/ai/pinecone.ts` | F4 | Absorver buildPineconeRecord |
| `components/chat/chat-input-area.tsx` | F4 | Extrair 4 hooks |
| 10 rotas Gemini | F3 | Credit tracking |
| `adaptation-pipeline.ts` | F2 | SocialPlatform lowercase |
| `brand-validation.ts` | F2 | SocialPlatform lowercase |

---

*Architecture Review realizada por Athos (Architect) — NETECMT v2.0*  
*Sprint Sigma: Sub-Sprint de Consistencia do Codebase | 07/02/2026*  
*14 Decision Topics | 4 Blocking | Estimativa revisada: ~27-33h*  
*Veredito: APROVADO COM RESSALVAS*
