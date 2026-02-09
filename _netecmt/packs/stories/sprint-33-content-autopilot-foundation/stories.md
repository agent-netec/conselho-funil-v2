# Stories Distilled: Sprint 33 — Content Autopilot Foundation
**Preparado por:** Leticia (SM)
**Data:** 08/02/2026
**Lanes:** content_autopilot + governance (cross-cutting)
**Tipo:** Feature Sprint (Content Autopilot)

> **IMPORTANTE:** Este documento incorpora os **10 Decision Topics (DTs)** e as resolucoes do Architecture Review (Athos). Cada DT incorporado esta marcado com `[ARCH DT-XX]`. Os 3 blocking DTs (DT-04, DT-05, DT-08) foram RESOLVIDOS e as correcoes estao embutidas nas stories.
>
> **Padroes Sigma OBRIGATORIOS** em todo codigo novo: `createApiError`/`createApiSuccess`, `requireBrandAccess` (de `@/lib/auth/brand-guard`), `Timestamp` (nao Date), `force-dynamic`, isolamento multi-tenant por `brandId`, REST puro via `fetch()` (zero SDK npm novo).

---

## Fase 0: Governanca & Divida S32 [~1.5h + Gate]

> **Sequencia:** GOV-01 a GOV-04 (paralelos — sem dependencia mutua) → **GATE CHECK 0**
>
> Esta fase resolve 4 dividas herdadas da S32 e prepara o codebase para as features da S33.

---

### S33-GOV-01: Oficializar zod como Dependencia Padrao [XS, ~15min]

**Objetivo:** Adicionar nota no README.md documentando `zod` como dependencia padrao do projeto. Resolver Finding F-01 da S32.

**Acao:**
1. Em `README.md` (raiz do projeto ou `app/README.md`):
   - LOCALIZAR secao de dependencias (ou criar se nao existir)
   - ADICIONAR nota sobre zod:
     ```markdown
     ### Dependencias do Projeto
     
     | Dependencia | Uso | Desde |
     |:-----------|:----|:------|
     | zod | Validacao de schemas (API responses, Gemini output, forms) | Sprint 32 (formalizada) |
     ```

2. Em `app/package.json`:
   - CONFIRMAR que `zod` esta listada em `dependencies` (nao `devDependencies`)
   - NAO alterar versao — apenas confirmar presenca

**Arquivos:**
- `README.md` ou `app/README.md` — **MODIFICAR** (adicionar nota zod)

**DTs referenciados:** Nenhum
**Dependencias:** Nenhuma
**Gate Check:** S33-GATE-00 (Sim)

**AC:**
- [ ] README menciona zod como dependencia oficial com descricao de uso
- [ ] zod presente em `dependencies` do `package.json` (confirmado)
- [ ] `npx tsc --noEmit` = 0

---

### S33-GOV-02: Timer Leak Fix [S, ~45min]

**Objetivo:** Investigar e resolver warning `worker has failed to exit gracefully` nos testes Jest. Adicionar cleanup global no `jest.setup.js`.

> **[ARCH DT-01 — NON-BLOCKING, RESOLVIDO]:** Estrategia: `afterAll` global com `jest.clearAllTimers()` + `jest.restoreAllMocks()`. Investigar com `--detectOpenHandles` para identificar leak exato. Se `MessageChannel` polyfill for a causa, avaliar remocao.

**Acao:**
1. Em `app/jest.setup.js`:
   - ADICIONAR `afterAll` global no final do arquivo:

```javascript
// === S33-GOV-02: Timer leak cleanup (DT-01) ===
afterAll(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});
```

2. ADICIONAR mock de `writeBatch` no bloco de mocks do Firebase (sera necessario para Fase 1):

```javascript
// No bloco jest.mock('firebase/firestore', ...) existente, adicionar:
writeBatch: jest.fn(() => ({
  update: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  commit: jest.fn().mockResolvedValue(undefined),
})),
```

3. RODAR `npx jest --detectOpenHandles` para identificar a fonte exata do leak
4. Se `MessageChannel` for a causa e nenhum teste depende dele: avaliar remocao do polyfill

**Arquivos:**
- `app/jest.setup.js` — **MODIFICAR** (adicionar afterAll + writeBatch mock)

**DTs referenciados:** DT-01 (timer cleanup)
**Dependencias:** Nenhuma
**Gate Check:** S33-GATE-00 (Sim)

**AC:**
- [ ] `afterAll` global adicionado com `jest.clearAllTimers()` + `jest.restoreAllMocks()`
- [ ] `writeBatch` mock adicionado no bloco de mocks do Firebase
- [ ] `npm test` roda sem warning `worker has failed to exit gracefully`
- [ ] Se warning persiste: documentar causa e criar issue para S34
- [ ] `npx tsc --noEmit` = 0

---

### S33-GOV-03: Documentar Decisao Instagram Domain [XS, ~15min]

**Objetivo:** Criar documentacao explicando que `graph.instagram.com` e o dominio correto para o Instagram adapter (vs `graph.facebook.com` mencionado em PRDs anteriores).

**Acao:**
1. CRIAR `_netecmt/docs/tools/instagram-domain-decision.md`:

```markdown
# ADR: Instagram API Domain — graph.instagram.com

**Data:** 08/02/2026
**Status:** Aceito
**Contexto:** Sprint 32 (S32-IG-01)

## Decisao

O adapter Instagram usa `https://graph.instagram.com/v21.0` como base URL.

## Justificativa

- `graph.instagram.com` e o dominio oficial da Instagram Graph API para contas Business/Creator
- `graph.facebook.com` tambem e valido (Instagram e subsidiaria do Meta) mas `graph.instagram.com` e o dominio preferencial na documentacao oficial
- O adapter S32-IG-01 foi implementado com `graph.instagram.com` e esta funcional

## Ambos Dominios Sao Validos

- `https://graph.instagram.com/v21.0/{endpoint}` — preferencial
- `https://graph.facebook.com/v21.0/{endpoint}` — alternativa valida

## Impacto

Nenhuma mudanca necessaria. Apenas documentacao para referencia futura.
```

**Arquivos:**
- `_netecmt/docs/tools/instagram-domain-decision.md` — **CRIAR**

**DTs referenciados:** Nenhum
**Dependencias:** Nenhuma
**Gate Check:** S33-GATE-00 (Sim)

**AC:**
- [ ] Documento ADR criado em `_netecmt/docs/tools/instagram-domain-decision.md`
- [ ] Explica decisao de usar `graph.instagram.com`
- [ ] Nota N5 S32 resolvida

---

### S33-GOV-04: Collection social_interactions + Type [XS, ~15min]

**Objetivo:** Criar type `SocialInteractionRecord` em `types/social.ts` e adicionar helper basico para persistir interacoes sociais. Resolve Nota N3 S32 (Response Engine sem historico de autor).

> **[ARCH DT-02 — NON-BLOCKING, RESOLVIDO]:** Subcollection `brands/{brandId}/social_interactions` — consistente com patterns existentes (`brands/{brandId}/secrets`, `brands/{brandId}/rate_limits`). Type adicionado em `types/social.ts` (arquivo existente — NAO criar novo).

**Acao:**
1. Em `app/src/types/social.ts`, ADICIONAR interface:

```typescript
/**
 * SocialInteractionRecord — persistencia de interacoes sociais
 * Collection: brands/{brandId}/social_interactions
 * @story S33-GOV-04
 */
export interface SocialInteractionRecord {
  id: string;
  authorId: string;
  authorName: string;
  platform: 'instagram' | 'linkedin' | 'x' | 'tiktok';
  content: string;
  sentiment: number;           // 0.0 a 1.0
  responseId?: string;         // Link para resposta gerada
  engagementScore?: number;    // 0.0 a 1.0 (STRETCH S33-BV-01)
  brandId: string;
  createdAt: Timestamp;
}
```

2. Em `app/src/lib/firebase/firestore.ts` OU como modulo separado, ADICIONAR helper basico:

```typescript
/**
 * Salva registro de interacao social.
 * Path: brands/{brandId}/social_interactions/{auto-id}
 */
export async function saveSocialInteraction(
  brandId: string,
  data: Omit<SocialInteractionRecord, 'id' | 'createdAt'>
): Promise<string> {
  const colRef = collection(db, 'brands', brandId, 'social_interactions');
  const docRef = await addDoc(colRef, {
    ...data,
    brandId,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
}
```

**Arquivos:**
- `app/src/types/social.ts` — **MODIFICAR** (adicionar `SocialInteractionRecord`)

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/firestore.ts` — referencia de patterns CRUD

**DTs referenciados:** DT-02 (subcollection pattern)
**Dependencias:** Nenhuma
**Gate Check:** S33-GATE-00 (Sim)

**AC:**
- [ ] `SocialInteractionRecord` interface exportada de `types/social.ts`
- [ ] Campos obrigatorios: `id`, `authorId`, `authorName`, `platform`, `content`, `sentiment`, `brandId`, `createdAt`
- [ ] Campos opcionais: `responseId`, `engagementScore`
- [ ] `Timestamp` (nao `Date`) — P-06
- [ ] `npx tsc --noEmit` = 0

---

### S33-GATE-00: Gate Check 0 — Governanca [XS, ~15min] — GATE

**Objetivo:** Validar que toda a governanca S32 esta resolvida. **Fase 1 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G0-01 | zod documentada | `rg "zod" README.md` ou `rg "zod" app/README.md` | 1+ match com descricao |
| G0-02 | afterAll global no jest.setup | `rg "afterAll" app/jest.setup.js` | 1+ match com clearAllTimers |
| G0-03 | writeBatch mock | `rg "writeBatch" app/jest.setup.js` | 1+ match |
| G0-04 | Instagram domain doc | Verificar existencia de `_netecmt/docs/tools/instagram-domain-decision.md` | Arquivo existe |
| G0-05 | SocialInteractionRecord type | `rg "SocialInteractionRecord" app/src/types/social.ts` | 1+ match |
| G0-06 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G0-07 | Testes passando | `npm test` | 0 fail, >= 257 passando |
| G0-08 | Timer warning | Verificar output do npm test | Zero `worker has failed to exit gracefully` |

**Regra ABSOLUTA:** Fase 1 so inicia se G0-01 a G0-08 todos aprovados.

**AC:**
- [ ] G0-01 a G0-08 todos aprovados
- [ ] Baseline intacto: tsc=0, testes >= 257 passando

---

## Fase 1: Calendario Editorial [~5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S33-GATE-00 aprovado.
>
> **Sequencia:** CAL-01 → CAL-02 → CAL-03 → **GATE CHECK 1**
>
> Esta fase cria o calendario editorial completo: data model Firestore, CRUD helpers, API REST, UI semanal/mensal com drag-and-drop HTML5 nativo.

---

### S33-CAL-01: Data Model Firestore + CRUD Helpers + Types [M, ~1.5h]

**Objetivo:** Criar o type `CalendarItem`, Zod schemas de validacao, e CRUD helpers com suporte a `writeBatch` para reorder atomico.

> **[ARCH DT-03 — NON-BLOCKING, RESOLVIDO]:** Subcollection `brands/{brandId}/content_calendar`. Campo `createdBy` adicionado por Athos (audit trail).
> **[ARCH DT-04 — P0, BLOCKING, RESOLVIDO]:** Range query em campo unico (`scheduledDate`) + in-memory sort. ZERO composite index. ZERO `orderBy` em campo diferente do `where`.
> **[ARCH DT-05 — P0, BLOCKING, RESOLVIDO]:** Reorder via `writeBatch()` para atomicidade. ZERO updates sequenciais.

**Acao:**
1. CRIAR `app/src/types/content.ts`:

```typescript
/**
 * Content Autopilot Types & Zod Schemas
 * @sprint S33
 * @story S33-CAL-01, S33-GEN-02
 */

import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

// === Enums & Literals ===

export type ContentFormat = 'post' | 'story' | 'carousel' | 'reel';
export type ContentPlatform = 'instagram' | 'linkedin' | 'x' | 'tiktok';
export type CalendarItemStatus =
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected';

// === Calendar Item ===

export interface CalendarItemMetadata {
  generatedBy?: 'ai' | 'manual';
  promptParams?: Record<string, string>;
  generationModel?: string;
  generatedAt?: Timestamp;
}

export interface CalendarItem {
  id: string;
  title: string;
  format: ContentFormat;
  platform: ContentPlatform;
  scheduledDate: Timestamp;      // NAO Date (P-06)
  status: CalendarItemStatus;
  content: string;               // Corpo do conteudo gerado/editado
  metadata: CalendarItemMetadata;
  order: number;                 // Posicao no dia (para reorder)
  brandId: string;               // Redundante com path mas necessario para queries
  createdBy?: string;            // userId — audit trail (Ajuste Athos DT-03)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Content Generation Params & Results ===

export interface ContentGenerationParams {
  format: ContentFormat;
  platform: ContentPlatform;
  topic: string;
  tone?: string;
  keywords?: string[];
  targetAudience?: string;
  insertToCalendar?: boolean;
  scheduledDate?: string;        // ISO string — convertido para Timestamp internamente
}

export interface ContentGenerationResult {
  content: Record<string, unknown>;
  metadata: {
    format: ContentFormat;
    platform: ContentPlatform;
    model: string;
    generatedAt: string;
    brandId: string;
  };
  suggestions: string[];
  generated: boolean;
  error?: string;
}

// === Zod Output Schemas (Gemini JSON validation — DT-07) ===

export const PostOutputSchema = z.object({
  text: z.string().min(1).max(2200),
  hashtags: z.array(z.string()).min(3).max(15),
  cta: z.string(),
  visualSuggestion: z.string(),
});

export const StoryOutputSchema = z.object({
  text: z.string().min(1).max(150),
  backgroundSuggestion: z.string(),
  stickerSuggestions: z.array(z.string()).max(5),
  ctaSwipeUp: z.string().optional(),
});

export const CarouselOutputSchema = z.object({
  title: z.string().min(1),
  slides: z.array(z.object({
    title: z.string(),
    body: z.string(),
  })).min(3).max(10),
  ctaFinal: z.string(),
  coverSuggestion: z.string(),
});

export const ReelOutputSchema = z.object({
  hook: z.string(),
  scenes: z.array(z.object({
    timing: z.string(),
    script: z.string(),
    overlay: z.string().optional(),
  })).min(1),
  musicReference: z.string().optional(),
  ctaFinal: z.string(),
});

/** Mapa de schemas por formato — selecao dinamica */
export const CONTENT_SCHEMAS = {
  post: PostOutputSchema,
  story: StoryOutputSchema,
  carousel: CarouselOutputSchema,
  reel: ReelOutputSchema,
} as const;

// === Approval Types ===

export interface ApprovalHistoryEntry {
  fromStatus: CalendarItemStatus;
  toStatus: CalendarItemStatus;
  comment?: string;
  timestamp: Timestamp;
  userId?: string;
}

export type ApprovalAction = 'submit_review' | 'approve' | 'reject' | 'schedule';

// === Reorder Types ===

export interface ReorderUpdate {
  itemId: string;
  order: number;
  scheduledDate?: Timestamp;
}
```

2. CRIAR `app/src/lib/firebase/content-calendar.ts`:

```typescript
/**
 * Content Calendar — CRUD Helpers Firestore
 * Collection: brands/{brandId}/content_calendar
 *
 * @module lib/firebase/content-calendar
 * @story S33-CAL-01
 *
 * DT-04 (BLOCKING): Range query em campo unico + in-memory sort. ZERO composite index.
 * DT-05 (BLOCKING): Reorder via writeBatch() para atomicidade. ZERO updates sequenciais.
 */

import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { CalendarItem, CalendarItemMetadata, ReorderUpdate } from '@/types/content';

/**
 * Cria um item no calendario editorial.
 * Path: brands/{brandId}/content_calendar/{auto-id}
 */
export async function createCalendarItem(
  brandId: string,
  data: {
    title: string;
    format: CalendarItem['format'];
    platform: CalendarItem['platform'];
    scheduledDate: Timestamp;
    content: string;
    metadata?: CalendarItemMetadata;
    order?: number;
    createdBy?: string;
  }
): Promise<CalendarItem> {
  const colRef = collection(db, 'brands', brandId, 'content_calendar');
  const now = Timestamp.now();

  const itemData = {
    title: data.title,
    format: data.format,
    platform: data.platform,
    scheduledDate: data.scheduledDate,
    status: 'draft' as const,
    content: data.content,
    metadata: data.metadata || { generatedBy: 'manual' },
    order: data.order ?? 0,
    brandId,
    createdBy: data.createdBy,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(colRef, itemData);

  return { id: docRef.id, ...itemData };
}

/**
 * Busca items do calendario por range de datas.
 *
 * DT-04 (BLOCKING): Range query em campo UNICO (scheduledDate).
 * NAO usa orderBy() combinado com where() em campo diferente.
 * Sort in-memory por scheduledDate e order.
 *
 * Firestore: where('scheduledDate', '>=', start).where('scheduledDate', '<=', end)
 * NAO requer composite index (range em campo unico).
 */
export async function getCalendarItems(
  brandId: string,
  startDate: Timestamp,
  endDate: Timestamp
): Promise<CalendarItem[]> {
  const colRef = collection(db, 'brands', brandId, 'content_calendar');

  const q = query(
    colRef,
    where('scheduledDate', '>=', startDate),
    where('scheduledDate', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  const items = snapshot.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  })) as CalendarItem[];

  // In-memory sort: scheduledDate ASC, order ASC (DT-04)
  return items.sort((a, b) => {
    const dateDiff = a.scheduledDate.seconds - b.scheduledDate.seconds;
    return dateDiff !== 0 ? dateDiff : a.order - b.order;
  });
}

/**
 * Atualiza um item do calendario.
 */
export async function updateCalendarItem(
  brandId: string,
  itemId: string,
  data: Partial<Omit<CalendarItem, 'id' | 'brandId' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'content_calendar', itemId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: Timestamp.now(),
  });
}

/**
 * Remove um item do calendario.
 */
export async function deleteCalendarItem(
  brandId: string,
  itemId: string
): Promise<void> {
  const docRef = doc(db, 'brands', brandId, 'content_calendar', itemId);
  await deleteDoc(docRef);
}

/**
 * Reordena items do calendario via writeBatch (atomico).
 *
 * DT-05 (BLOCKING): DEVE usar writeBatch() para garantir atomicidade.
 * ZERO updates sequenciais (updateDoc em loop).
 * Se um erro parcial ocorrer com updates sequenciais, items ficam com
 * order duplicado — estado inconsistente.
 *
 * @param brandId - ID da marca
 * @param updates - Array de updates: { itemId, order, scheduledDate? }
 */
export async function reorderCalendarItems(
  brandId: string,
  updates: ReorderUpdate[]
): Promise<void> {
  const batch = writeBatch(db);

  for (const { itemId, order, scheduledDate } of updates) {
    const ref = doc(db, 'brands', brandId, 'content_calendar', itemId);
    const updateData: Record<string, unknown> = {
      order,
      updatedAt: Timestamp.now(),
    };
    if (scheduledDate) {
      updateData.scheduledDate = scheduledDate;
    }
    batch.update(ref, updateData);
  }

  await batch.commit();
}
```

**Arquivos:**
- `app/src/types/content.ts` — **CRIAR**
- `app/src/lib/firebase/content-calendar.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/firestore.ts` — referencia de patterns CRUD
- `app/src/lib/firebase/config.ts` — `db`, `Timestamp`
- `app/src/lib/firebase/assets.ts` — referencia de `writeBatch()` pattern
- `app/src/lib/firebase/vault.ts` — referencia de subcollection pattern

**DTs referenciados:** DT-03 (schema), DT-04 (BLOCKING — range query), DT-05 (BLOCKING — writeBatch)
**Dependencias:** Nenhuma (modulos novos)
**Gate Check:** S33-GATE-01 (Sim)

**AC:**
- [ ] `CalendarItem` interface exportada de `types/content.ts` com todos os campos
- [ ] `CalendarItemStatus` type com 6 valores: draft, pending_review, approved, scheduled, published, rejected
- [ ] `ContentFormat` type: post, story, carousel, reel
- [ ] `ContentPlatform` type: instagram, linkedin, x, tiktok
- [ ] 4 Zod schemas exportados: `PostOutputSchema`, `StoryOutputSchema`, `CarouselOutputSchema`, `ReelOutputSchema`
- [ ] `CONTENT_SCHEMAS` mapa exportado para selecao dinamica
- [ ] `createCalendarItem` retorna `CalendarItem` com `Timestamp.now()` em `createdAt`/`updatedAt`
- [ ] `getCalendarItems` usa range query em campo unico + in-memory sort (DT-04 BLOCKING)
- [ ] `reorderCalendarItems` usa `writeBatch()` (DT-05 BLOCKING)
- [ ] ZERO `Date` — todos os campos de data usam `Timestamp` (P-06)
- [ ] ZERO `any` (P-01)
- [ ] `npx tsc --noEmit` = 0

---

### S33-CAL-02: API CRUD `/api/content/calendar` + `/reorder` [M, ~1.5h]

**Objetivo:** Criar rotas REST para CRUD do calendario editorial e reorder atomico. Todas as rotas seguem padroes Sigma.

**Acao:**
1. CRIAR `app/src/app/api/content/calendar/route.ts`:

```typescript
/**
 * Content Calendar API — CRUD
 * GET: Listar items por range de datas
 * POST: Criar item
 * PUT: Atualizar item
 * DELETE: Remover item
 *
 * @route /api/content/calendar
 * @story S33-CAL-02
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import {
  createCalendarItem,
  getCalendarItems,
  updateCalendarItem,
  deleteCalendarItem,
} from '@/lib/firebase/content-calendar';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const brandId = req.nextUrl.searchParams.get('brandId');
    const start = req.nextUrl.searchParams.get('start');
    const end = req.nextUrl.searchParams.get('end');

    if (!brandId || !start || !end) {
      return createApiError(400, 'Missing required params: brandId, start, end');
    }

    await requireBrandAccess(req, brandId);

    const startDate = Timestamp.fromMillis(Number(start));
    const endDate = Timestamp.fromMillis(Number(end));
    const items = await getCalendarItems(brandId, startDate, endDate);

    return createApiSuccess({ items });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentCalendar] GET error:', error);
    return createApiError(500, 'Failed to fetch calendar items');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, title, format, platform, scheduledDate, content, metadata } = body;

    if (!brandId || !title || !format || !platform || !scheduledDate) {
      return createApiError(400, 'Missing required fields: brandId, title, format, platform, scheduledDate');
    }

    await requireBrandAccess(req, brandId);

    const item = await createCalendarItem(brandId, {
      title,
      format,
      platform,
      scheduledDate: Timestamp.fromMillis(Number(scheduledDate)),
      content: content || '',
      metadata: metadata || { generatedBy: 'manual' },
    });

    return createApiSuccess({ item });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentCalendar] POST error:', error);
    return createApiError(500, 'Failed to create calendar item');
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, itemId, ...fields } = body;

    if (!brandId || !itemId) {
      return createApiError(400, 'Missing required fields: brandId, itemId');
    }

    await requireBrandAccess(req, brandId);

    // Converter scheduledDate se presente
    if (fields.scheduledDate && typeof fields.scheduledDate === 'number') {
      fields.scheduledDate = Timestamp.fromMillis(fields.scheduledDate);
    }

    await updateCalendarItem(brandId, itemId, fields);

    return createApiSuccess({ updated: true, itemId });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentCalendar] PUT error:', error);
    return createApiError(500, 'Failed to update calendar item');
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, itemId } = body;

    if (!brandId || !itemId) {
      return createApiError(400, 'Missing required fields: brandId, itemId');
    }

    await requireBrandAccess(req, brandId);
    await deleteCalendarItem(brandId, itemId);

    return createApiSuccess({ deleted: true, itemId });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentCalendar] DELETE error:', error);
    return createApiError(500, 'Failed to delete calendar item');
  }
}
```

2. CRIAR `app/src/app/api/content/calendar/reorder/route.ts`:

```typescript
/**
 * Content Calendar Reorder API
 * POST: Reorder items via writeBatch (atomico — DT-05 BLOCKING)
 *
 * @route /api/content/calendar/reorder
 * @story S33-CAL-02
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { reorderCalendarItems } from '@/lib/firebase/content-calendar';
import type { ReorderUpdate } from '@/types/content';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, updates } = body as {
      brandId: string;
      updates: Array<{ itemId: string; order: number; scheduledDate?: number }>;
    };

    if (!brandId || !updates || !Array.isArray(updates) || updates.length === 0) {
      return createApiError(400, 'Missing required fields: brandId, updates[]');
    }

    await requireBrandAccess(req, brandId);

    // Converter scheduledDate de ms para Timestamp se presente
    const typedUpdates: ReorderUpdate[] = updates.map((u) => ({
      itemId: u.itemId,
      order: u.order,
      scheduledDate: u.scheduledDate
        ? Timestamp.fromMillis(u.scheduledDate)
        : undefined,
    }));

    await reorderCalendarItems(brandId, typedUpdates);

    return createApiSuccess({ reordered: true, count: updates.length });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentCalendar] Reorder error:', error);
    return createApiError(500, 'Failed to reorder calendar items');
  }
}
```

3. CRIAR testes em `app/src/__tests__/lib/firebase/content-calendar.test.ts`:
   - Teste (1): `createCalendarItem` cria item com `Timestamp.now()`
   - Teste (2): `getCalendarItems` retorna items ordenados por data e order (in-memory sort — DT-04)
   - Teste (3): `reorderCalendarItems` usa `writeBatch()` (DT-05)
   - Teste (4): `deleteCalendarItem` remove item
   - Mock de `firebase/firestore` (addDoc, getDocs, updateDoc, deleteDoc, writeBatch, query, where)

**Arquivos:**
- `app/src/app/api/content/calendar/route.ts` — **CRIAR**
- `app/src/app/api/content/calendar/reorder/route.ts` — **CRIAR**
- `app/src/__tests__/lib/firebase/content-calendar.test.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/content-calendar.ts` — CRUD helpers (criado em CAL-01)
- `app/src/lib/utils/api-response.ts` — `createApiError`, `createApiSuccess`
- `app/src/lib/auth/brand-guard.ts` — `requireBrandAccess`

**DTs referenciados:** DT-04 (BLOCKING — range query), DT-05 (BLOCKING — writeBatch)
**Dependencias:** S33-CAL-01 concluido (CRUD helpers existem)
**Gate Check:** S33-GATE-01 (Sim)

**AC:**
- [ ] GET `/api/content/calendar` aceita `brandId`, `start`, `end` como query params
- [ ] GET retorna items filtrados por range e ordenados (in-memory)
- [ ] POST cria item com `createCalendarItem` e retorna via `createApiSuccess`
- [ ] PUT atualiza item via `updateCalendarItem`
- [ ] DELETE remove item via `deleteCalendarItem`
- [ ] POST `/api/content/calendar/reorder` aceita `brandId` e `updates[]`
- [ ] Reorder usa `reorderCalendarItems` (writeBatch — DT-05)
- [ ] `export const dynamic = 'force-dynamic'` em AMBAS as rotas (P-07)
- [ ] `requireBrandAccess` em TODAS as operacoes (P-08)
- [ ] `createApiError`/`createApiSuccess` em todos os responses
- [ ] 4+ testes passando para CRUD + reorder
- [ ] `npx tsc --noEmit` = 0

---

### S33-CAL-03: UI Calendario + Sidebar [M+, ~2h]

**Objetivo:** Criar pagina de calendario editorial com views semanal (default) e mensal, drag-and-drop HTML5 nativo para reorder, e integrar ao sidebar.

> **[ARCH DT-09 — NON-BLOCKING, RESOLVIDO]:** Items "Calendario" e "Aprovacoes" no grupo `execution` do NAV_GROUPS. Icons `Calendar` e `ClipboardCheck` do Lucide registrados no icon-maps.

**Acao:**
1. CRIAR `app/src/app/content/calendar/page.tsx`:
   - View semanal (default): grid 7 colunas (Seg-Dom)
   - View mensal: grid de calendario com mini-cards
   - Toggle entre views (botao semanal/mensal)
   - Navegacao por seta (semana/mes anterior/proximo)
   - Cards de conteudo: titulo + icone de formato + badge de status
   - HTML5 Drag and Drop nativo: `draggable`, `onDragStart`, `onDragOver`, `onDrop`
   - Optimistic update no state local → chamada API `/api/content/calendar/reorder` → revert on error
   - Botao "Novo Conteudo" que abre modal/dialog para criar item

2. CRIAR `app/src/components/content/calendar-view.tsx`:
   - Componente reutilizavel para renderizar o grid do calendario
   - Props: `items: CalendarItem[]`, `view: 'week' | 'month'`, `onReorder`, `onItemClick`
   - Cards com `draggable={true}`
   - Drop zones por dia
   - `onDragStart`: salva item arrastado no dataTransfer
   - `onDragOver`: `e.preventDefault()` para permitir drop
   - `onDrop`: extrai item, calcula nova posicao, chama `onReorder`

3. Em `app/src/lib/constants.ts`, ADICIONAR items ao grupo `execution`:
   ```typescript
   // Dentro do grupo 'execution' no NAV_GROUPS, apos os items existentes:
   { id: 'content-calendar', label: 'Calendario', href: '/content/calendar', icon: 'Calendar' },
   { id: 'content-review', label: 'Aprovacoes', href: '/content/review', icon: 'ClipboardCheck' },
   ```

4. Em `app/src/lib/guards/resolve-icon.ts` (ou `app/src/lib/icon-maps.ts`):
   - Registrar `Calendar` e `ClipboardCheck` do Lucide no mapa de icones do sidebar

**Arquivos:**
- `app/src/app/content/calendar/page.tsx` — **CRIAR**
- `app/src/components/content/calendar-view.tsx` — **CRIAR**
- `app/src/lib/constants.ts` — **MODIFICAR** (adicionar 2 items ao NAV_GROUPS)
- `app/src/lib/guards/resolve-icon.ts` — **MODIFICAR** (registrar icons)

**Leitura (NAO MODIFICAR):**
- `app/src/components/layout/sidebar.tsx` — referencia de como sidebar consome NAV_GROUPS (NAO modificar diretamente)
- `app/src/types/content.ts` — CalendarItem, CalendarItemStatus

**DTs referenciados:** DT-09 (sidebar group)
**Dependencias:** S33-CAL-02 concluido (API routes existem)
**Gate Check:** S33-GATE-01 (Sim)

**Nota UX (Athos — Risco):** HTML5 Drag and Drop NAO funciona em touch/mobile. Para S33 MVP: desabilitar drag em dispositivos touch, oferecer botoes up/down como fallback para reorder. Touch D&D e escopo S34.

**AC:**
- [ ] Pagina `/content/calendar` renderiza items por semana (default)
- [ ] Toggle para view mensal funcional
- [ ] Navegacao por seta (semana/mes anterior/proximo)
- [ ] Cards mostram titulo + icone de formato + badge de status
- [ ] Drag HTML5 nativo: `draggable={true}`, `onDragStart`, `onDragOver`, `onDrop` (PA-03)
- [ ] Reorder intra-dia e entre dias funcional
- [ ] Optimistic update no state → API call → revert on error
- [ ] Sidebar items "Calendario" e "Aprovacoes" no grupo `execution` (DT-09)
- [ ] Icons `Calendar` e `ClipboardCheck` registrados
- [ ] ZERO biblioteca de D&D (PA-03)
- [ ] `npx tsc --noEmit` = 0

---

### S33-GATE-01: Gate Check 1 — Calendario Editorial [XS, ~15min] — GATE

**Objetivo:** Validar que o calendario editorial esta funcional. **Fase 2 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G1-01 | CRUD helpers criados | `rg "createCalendarItem" app/src/lib/firebase/content-calendar.ts` | 1+ match |
| G1-02 | Range query sem composite index | `rg "orderBy" app/src/lib/firebase/content-calendar.ts` | 0 matches (DT-04) |
| G1-03 | writeBatch usado no reorder | `rg "writeBatch" app/src/lib/firebase/content-calendar.ts` | 1+ match (DT-05) |
| G1-04 | API calendar route criada | `rg "force-dynamic" app/src/app/api/content/calendar/route.ts` | 1+ match |
| G1-05 | API reorder route criada | `rg "reorderCalendarItems" app/src/app/api/content/calendar/reorder/route.ts` | 1+ match |
| G1-06 | requireBrandAccess em todas | `rg "requireBrandAccess" app/src/app/api/content/calendar/route.ts` | 4+ matches (GET,POST,PUT,DELETE) |
| G1-07 | UI page criada | Verificar existencia de `app/src/app/content/calendar/page.tsx` | Arquivo existe |
| G1-08 | Sidebar items adicionados | `rg "content-calendar" app/src/lib/constants.ts` | 1+ match |
| G1-09 | Types content.ts | `rg "CalendarItem" app/src/types/content.ts` | 1+ match |
| G1-10 | Testes CRUD | Verificar existencia de `app/src/__tests__/lib/firebase/content-calendar.test.ts` | Arquivo existe com 4+ testes |
| G1-11 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G1-12 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 2 so inicia se G1-01 a G1-12 todos aprovados.

**AC:**
- [ ] G1-01 a G1-12 todos aprovados

---

## Fase 2: Content Generation Pipeline [~5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S33-GATE-01 aprovado.
>
> **Sequencia:** GEN-01 → GEN-02 → GEN-03 → **GATE CHECK 2**
>
> Esta fase cria o engine de geracao de conteudo com 4 formatos especializados (post, story, carousel, reel) usando Gemini com Brand Voice.

---

### S33-GEN-01: Generation Engine + Brand Voice Injection [L, ~2.5h]

**Objetivo:** Criar `lib/content/generation-engine.ts` com funcao principal `generateContent()`. Busca dados da marca, injeta Brand Voice no prompt, chama Gemini com JSON mode, valida output com Zod.

> **[ARCH DT-06 — NON-BLOCKING, RESOLVIDO]:** Prompts em arquivo separado `lib/ai/prompts/content-generation.ts`. Consistente com pattern existente (social-generation.ts, audience-scan.ts).

**Acao:**
1. CRIAR `app/src/lib/content/generation-engine.ts`:

```typescript
/**
 * Content Generation Engine
 * Gera conteudo editorial em 4 formatos usando Gemini + Brand Voice.
 *
 * Flow:
 *   1. getBrand(brandId) → dados da marca
 *   2. Selecionar prompt por format
 *   3. Montar system_instruction com Brand Voice
 *   4. generateWithGemini() com responseMimeType: 'application/json'
 *   5. Parse response com Zod schema
 *   6. Retornar { content, metadata, suggestions }
 *
 * @module lib/content/generation-engine
 * @story S33-GEN-01
 */

import { generateWithGemini } from '@/lib/ai/gemini';
import { getBrand } from '@/lib/firebase/firestore';
import {
  CONTENT_SYSTEM_INSTRUCTION,
  CONTENT_POST_PROMPT,
  CONTENT_STORY_PROMPT,
  CONTENT_CAROUSEL_PROMPT,
  CONTENT_REEL_PROMPT,
} from '@/lib/ai/prompts/content-generation';
import {
  CONTENT_SCHEMAS,
  type ContentFormat,
  type ContentPlatform,
  type ContentGenerationParams,
  type ContentGenerationResult,
} from '@/types/content';

/** Mapa de prompts por formato */
const FORMAT_PROMPTS: Record<ContentFormat, string> = {
  post: CONTENT_POST_PROMPT,
  story: CONTENT_STORY_PROMPT,
  carousel: CONTENT_CAROUSEL_PROMPT,
  reel: CONTENT_REEL_PROMPT,
};

/**
 * Monta o system instruction com Brand Voice injetada.
 */
function buildSystemInstruction(brand: {
  name?: string;
  brandKit?: {
    tone?: string;
    voice?: string;
    personality?: string;
    guidelines?: string;
    targetAudience?: string;
    colors?: string[];
  };
}): string {
  const parts: string[] = [CONTENT_SYSTEM_INSTRUCTION];

  if (brand.name) parts.push(`Brand Name: ${brand.name}`);
  if (brand.brandKit?.tone) parts.push(`Tone of Voice: ${brand.brandKit.tone}`);
  if (brand.brandKit?.voice) parts.push(`Voice Style: ${brand.brandKit.voice}`);
  if (brand.brandKit?.personality) parts.push(`Brand Personality: ${brand.brandKit.personality}`);
  if (brand.brandKit?.guidelines) parts.push(`Guidelines: ${brand.brandKit.guidelines}`);
  if (brand.brandKit?.targetAudience) parts.push(`Target Audience: ${brand.brandKit.targetAudience}`);

  return parts.join('\n\n');
}

/**
 * Preenche o prompt template com os parametros fornecidos.
 */
function fillPrompt(
  template: string,
  params: ContentGenerationParams,
  brandName: string
): string {
  return template
    .replace('{topic}', params.topic)
    .replace('{platform}', params.platform)
    .replace('{brandName}', brandName)
    .replace('{tone}', params.tone || 'default brand voice')
    .replace('{keywords}', params.keywords?.join(', ') || 'none specified')
    .replace('{targetAudience}', params.targetAudience || 'general audience');
}

/**
 * Gera conteudo editorial para um formato especifico.
 *
 * @param brandId - ID da marca
 * @param params - Parametros de geracao (format, platform, topic, etc.)
 * @returns ContentGenerationResult com content, metadata, suggestions
 */
export async function generateContent(
  brandId: string,
  params: ContentGenerationParams
): Promise<ContentGenerationResult> {
  try {
    // 1. Buscar dados da marca
    const brand = await getBrand(brandId);
    if (!brand) {
      return {
        content: {},
        metadata: {
          format: params.format,
          platform: params.platform,
          model: 'none',
          generatedAt: new Date().toISOString(),
          brandId,
        },
        suggestions: ['Brand not found. Please check the brand ID.'],
        generated: false,
        error: 'brand_not_found',
      };
    }

    // 2. Selecionar prompt por formato
    const promptTemplate = FORMAT_PROMPTS[params.format];
    if (!promptTemplate) {
      return {
        content: {},
        metadata: {
          format: params.format,
          platform: params.platform,
          model: 'none',
          generatedAt: new Date().toISOString(),
          brandId,
        },
        suggestions: [`Unsupported format: ${params.format}`],
        generated: false,
        error: 'unsupported_format',
      };
    }

    // 3. Montar system instruction com Brand Voice
    const systemInstruction = buildSystemInstruction(brand);

    // 4. Preencher prompt com parametros
    const filledPrompt = fillPrompt(promptTemplate, params, brand.name || 'Brand');

    // 5. Chamar Gemini com JSON mode
    const result = await generateWithGemini(filledPrompt, {
      responseMimeType: 'application/json',
      systemPrompt: systemInstruction,
      temperature: 0.7,
      brandId,
      feature: 'content_generation',
    });

    // 6. Parse response
    const rawText = typeof result === 'string' ? result : result?.text || '';
    const parsed = JSON.parse(rawText);

    // 7. Validar com Zod schema
    const schema = CONTENT_SCHEMAS[params.format];
    const validated = schema.parse(parsed);

    return {
      content: validated as Record<string, unknown>,
      metadata: {
        format: params.format,
        platform: params.platform,
        model: 'gemini-2.0-flash',
        generatedAt: new Date().toISOString(),
        brandId,
      },
      suggestions: generateSuggestions(params),
      generated: true,
    };
  } catch (error) {
    console.error('[GenerationEngine] Content generation failed:', error);

    // FALLBACK: NAO throw. Retorna resultado com flag generated: false (RNF-33.04)
    return {
      content: {},
      metadata: {
        format: params.format,
        platform: params.platform,
        model: 'gemini-2.0-flash',
        generatedAt: new Date().toISOString(),
        brandId,
      },
      suggestions: [
        'AI generation failed. Try again or create content manually.',
        `Consider adjusting your topic or tone for better results.`,
      ],
      generated: false,
      error: 'generation_failed',
    };
  }
}

/**
 * Gera sugestoes contextuais baseadas nos parametros.
 */
function generateSuggestions(params: ContentGenerationParams): string[] {
  const suggestions: string[] = [];

  if (params.format === 'carousel' && !params.keywords?.length) {
    suggestions.push('Add keywords to improve slide topic relevance.');
  }
  if (params.format === 'reel' && params.platform !== 'instagram' && params.platform !== 'tiktok') {
    suggestions.push(`Reels perform best on Instagram and TikTok.`);
  }
  if (!params.tone) {
    suggestions.push('Specify a tone for more targeted content.');
  }

  return suggestions;
}
```

**Arquivos:**
- `app/src/lib/content/generation-engine.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/gemini.ts` — `generateWithGemini()` com `responseMimeType` e `systemPrompt`
- `app/src/lib/firebase/firestore.ts` — `getBrand(brandId)` para dados da marca
- `app/src/types/content.ts` — types e Zod schemas (criado em CAL-01)

**DTs referenciados:** DT-06 (prompts em arquivo separado)
**Dependencias:** S33-CAL-01 concluido (types existem)
**Gate Check:** S33-GATE-02 (Sim)

**AC:**
- [ ] `generateContent(brandId, params)` exportado
- [ ] Busca dados da marca via `getBrand(brandId)`
- [ ] Brand Voice injetada no system instruction
- [ ] 4 prompts selecionados por formato (post, story, carousel, reel)
- [ ] Usa `generateWithGemini()` com `responseMimeType: 'application/json'` (DT-06)
- [ ] Valida output com Zod schema por formato (DT-07)
- [ ] Fallback: se geracao falha, retorna `{ generated: false, error: 'generation_failed' }` — NAO throw
- [ ] Retorna `ContentGenerationResult` com content, metadata, suggestions
- [ ] ZERO `any` (P-01)
- [ ] `npx tsc --noEmit` = 0

---

### S33-GEN-02: 4 Prompts Especializados + Zod Schemas [M, ~1.5h]

**Objetivo:** Criar prompts especializados para cada formato de conteudo (post, story, carousel, reel) e o system instruction base com Brand Voice.

> **[ARCH DT-06 — NON-BLOCKING, RESOLVIDO]:** Arquivo separado `lib/ai/prompts/content-generation.ts`. 5 exports: `CONTENT_SYSTEM_INSTRUCTION`, `CONTENT_POST_PROMPT`, `CONTENT_STORY_PROMPT`, `CONTENT_CAROUSEL_PROMPT`, `CONTENT_REEL_PROMPT`.
> **[ARCH DT-07 — NON-BLOCKING, RESOLVIDO]:** 4 Zod schemas separados com mapa de selecao (ja criados em `types/content.ts` por CAL-01).

**Acao:**
1. CRIAR `app/src/lib/ai/prompts/content-generation.ts`:

```typescript
/**
 * Content Generation Prompts — 4 formatos especializados
 * Cada prompt produz output JSON validado por Zod schema correspondente em types/content.ts.
 *
 * @module lib/ai/prompts/content-generation
 * @story S33-GEN-02
 */

/** System instruction base — injetada em toda geracao com Brand Voice context */
export const CONTENT_SYSTEM_INSTRUCTION = `You are an expert content strategist and copywriter for social media.
You generate editorial content that is engaging, on-brand, and optimized for the target platform.

RULES:
- Always stay within the brand voice guidelines provided
- Generate content in the language most appropriate for the brand's audience
- Be creative but professional
- Output MUST be valid JSON matching the expected schema exactly
- Do NOT include markdown formatting in your JSON output values`;

/** Prompt: Post Feed (max 2200 chars) */
export const CONTENT_POST_PROMPT = `Generate a social media feed post for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Hook: Start with an attention-grabbing first line
- Body: Develop the topic with value for the audience (informative, entertaining, or inspiring)
- CTA: End with a clear call-to-action
- Maximum 2200 characters for the main text
- Suggest 5-15 relevant hashtags
- Suggest a visual concept for the post image/graphic

## Output Format (JSON)
{
  "text": "The complete post text (hook + body + CTA)",
  "hashtags": ["hashtag1", "hashtag2", "..."],
  "cta": "The specific call-to-action text",
  "visualSuggestion": "Description of the ideal visual to accompany this post"
}`;

/** Prompt: Story (max 150 chars, casual/urgent tone) */
export const CONTENT_STORY_PROMPT = `Generate an Instagram/social media Story for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Text must be SHORT (max 150 characters) — stories are visual-first
- Tone should be casual, urgent, or conversational
- Suggest a background style/color
- Suggest interactive elements (polls, questions, stickers)
- Include swipe-up CTA if applicable

## Output Format (JSON)
{
  "text": "Short story text (max 150 chars)",
  "backgroundSuggestion": "Background style description",
  "stickerSuggestions": ["poll: ...", "question: ...", "..."],
  "ctaSwipeUp": "Optional swipe-up CTA text"
}`;

/** Prompt: Carousel Outline (3-10 slides, progressive narrative) */
export const CONTENT_CAROUSEL_PROMPT = `Generate a carousel/slide deck outline for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Title: Compelling carousel title for the cover slide
- Slides: 3-10 slides with progressive narrative (each slide builds on the previous)
- Each slide has a title and body text
- First slide = hook/promise, middle slides = content/value, last slide = CTA
- Suggest a cover design concept
- Final CTA should drive engagement (save, share, follow)

## Output Format (JSON)
{
  "title": "Carousel title for cover slide",
  "slides": [
    { "title": "Slide 1 title", "body": "Slide 1 body text" },
    { "title": "Slide 2 title", "body": "Slide 2 body text" }
  ],
  "ctaFinal": "Final call-to-action text",
  "coverSuggestion": "Description of ideal cover slide design"
}`;

/** Prompt: Reel Script (15-60s, scene-by-scene) */
export const CONTENT_REEL_PROMPT = `Generate a Reel/short video script for {platform}.

## Context
- Brand: {brandName}
- Topic: {topic}
- Tone: {tone}
- Keywords: {keywords}
- Target Audience: {targetAudience}

## Requirements
- Hook: First 3 seconds must grab attention (this is critical for retention)
- Script: Scene-by-scene with timing for each scene
- Each scene includes: timing, spoken/visual script, text overlay suggestion
- Target duration: 15-60 seconds total
- Suggest trending audio/music style if applicable
- End with clear CTA

## Output Format (JSON)
{
  "hook": "Opening 3-second hook text/action",
  "scenes": [
    {
      "timing": "0-3s",
      "script": "What happens in this scene",
      "overlay": "Text overlay suggestion"
    }
  ],
  "musicReference": "Suggested music style or trend",
  "ctaFinal": "Final call-to-action"
}`;
```

**Arquivos:**
- `app/src/lib/ai/prompts/content-generation.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/ai/prompts/social-generation.ts` — referencia de pattern (prompts exportados como constantes)

**DTs referenciados:** DT-06 (arquivo separado), DT-07 (schemas em types/content.ts — ja criados em CAL-01)
**Dependencias:** S33-GEN-01 concluido (engine consome estes prompts)
**Gate Check:** S33-GATE-02 (Sim)

**AC:**
- [ ] 5 constantes exportadas: `CONTENT_SYSTEM_INSTRUCTION`, `CONTENT_POST_PROMPT`, `CONTENT_STORY_PROMPT`, `CONTENT_CAROUSEL_PROMPT`, `CONTENT_REEL_PROMPT`
- [ ] Cada prompt define output format JSON compativel com Zod schema correspondente
- [ ] Placeholders: `{topic}`, `{platform}`, `{brandName}`, `{tone}`, `{keywords}`, `{targetAudience}`
- [ ] Post: max 2200 chars, hashtags 5-15, CTA, visual suggestion
- [ ] Story: max 150 chars, background, stickers, swipe-up CTA
- [ ] Carousel: 3-10 slides com titulo+body, cover, CTA final
- [ ] Reel: hook 3s, scenes com timing, music reference, CTA
- [ ] `npx tsc --noEmit` = 0

---

### S33-GEN-03: API `/api/content/generate` + Integracao Calendario + Testes [S+, ~1h]

**Objetivo:** Criar rota de geracao de conteudo que chama o Generation Engine. Opcao `insertToCalendar: true` insere automaticamente no calendario.

**Acao:**
1. CRIAR `app/src/app/api/content/generate/route.ts`:

```typescript
/**
 * Content Generation API
 * POST: Gera conteudo editorial via Generation Engine + Brand Voice
 *
 * @route /api/content/generate
 * @story S33-GEN-03
 */

import { NextRequest } from 'next/server';
import { Timestamp } from 'firebase/firestore';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { generateContent } from '@/lib/content/generation-engine';
import { createCalendarItem } from '@/lib/firebase/content-calendar';
import type { ContentGenerationParams } from '@/types/content';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      brandId,
      format,
      platform,
      topic,
      tone,
      keywords,
      targetAudience,
      insertToCalendar,
      scheduledDate,
    } = body as ContentGenerationParams & { brandId: string };

    if (!brandId || !format || !platform || !topic) {
      return createApiError(400, 'Missing required fields: brandId, format, platform, topic');
    }

    await requireBrandAccess(req, brandId);

    // Gerar conteudo
    const result = await generateContent(brandId, {
      format,
      platform,
      topic,
      tone,
      keywords,
      targetAudience,
    });

    // Se insertToCalendar e conteudo gerado com sucesso: criar item no calendario
    if (insertToCalendar && result.generated) {
      try {
        const calendarItem = await createCalendarItem(brandId, {
          title: topic,
          format,
          platform,
          scheduledDate: scheduledDate
            ? Timestamp.fromMillis(Number(scheduledDate))
            : Timestamp.now(),
          content: JSON.stringify(result.content),
          metadata: {
            generatedBy: 'ai',
            promptParams: { topic, tone: tone || '', platform },
            generationModel: 'gemini-2.0-flash',
            generatedAt: Timestamp.now(),
          },
        });
        return createApiSuccess({ ...result, calendarItem });
      } catch (calendarError) {
        console.error('[ContentGenerate] Calendar insert failed:', calendarError);
        // Retorna conteudo mesmo se insert falha
        return createApiSuccess({ ...result, calendarInsertError: true });
      }
    }

    return createApiSuccess(result);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentGenerate] POST error:', error);
    return createApiError(500, 'Failed to generate content');
  }
}
```

2. CRIAR testes em `app/src/__tests__/lib/content/generation-engine.test.ts`:
   - Teste (1): `generateContent` retorna resultado valido para format 'post' (mock Gemini)
   - Teste (2): `generateContent` retorna resultado valido para format 'carousel' (mock Gemini)
   - Teste (3): fallback funciona quando Gemini retorna JSON invalido
   - Teste (4): brand not found retorna `generated: false`
   - Mock de `@/lib/ai/gemini` (generateWithGemini)
   - Mock de `@/lib/firebase/firestore` (getBrand)

**Arquivos:**
- `app/src/app/api/content/generate/route.ts` — **CRIAR**
- `app/src/__tests__/lib/content/generation-engine.test.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/content/generation-engine.ts` — generateContent (criado em GEN-01)
- `app/src/lib/firebase/content-calendar.ts` — createCalendarItem (criado em CAL-01)
- `app/src/lib/utils/api-response.ts` — createApiError, createApiSuccess
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess

**DTs referenciados:** Nenhum
**Dependencias:** S33-GEN-02 concluido (prompts existem)
**Gate Check:** S33-GATE-02 (Sim)

**AC:**
- [ ] POST `/api/content/generate` aceita `brandId`, `format`, `platform`, `topic` + opcionais
- [ ] Chama `generateContent()` e retorna resultado via `createApiSuccess`
- [ ] Se `insertToCalendar: true`: insere no calendario via `createCalendarItem`
- [ ] Se insert no calendario falha: retorna conteudo mesmo assim (nao break)
- [ ] `export const dynamic = 'force-dynamic'` (P-07)
- [ ] `requireBrandAccess` presente (P-08)
- [ ] 4+ testes passando (post, carousel, fallback, brand not found)
- [ ] `npx tsc --noEmit` = 0

---

### S33-GATE-02: Gate Check 2 — Content Generation [XS, ~15min] — GATE

**Objetivo:** Validar que o pipeline de geracao de conteudo esta funcional. **Fase 3 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G2-01 | Generation engine criado | `rg "generateContent" app/src/lib/content/generation-engine.ts` | 1+ match |
| G2-02 | Brand Voice injection | `rg "getBrand" app/src/lib/content/generation-engine.ts` | 1+ match |
| G2-03 | Gemini JSON mode | `rg "responseMimeType" app/src/lib/content/generation-engine.ts` | 1+ match |
| G2-04 | Zod validation | `rg "schema.parse" app/src/lib/content/generation-engine.ts` | 1+ match |
| G2-05 | Fallback sem throw | `rg "generated: false" app/src/lib/content/generation-engine.ts` | 1+ match |
| G2-06 | 4 prompts criados | `rg "CONTENT_.*_PROMPT" app/src/lib/ai/prompts/content-generation.ts` | 4+ matches |
| G2-07 | API generate criada | `rg "force-dynamic" app/src/app/api/content/generate/route.ts` | 1+ match |
| G2-08 | insertToCalendar | `rg "insertToCalendar" app/src/app/api/content/generate/route.ts` | 1+ match |
| G2-09 | Testes engine | Verificar existencia de `app/src/__tests__/lib/content/generation-engine.test.ts` | 4+ testes |
| G2-10 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G2-11 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 3 so inicia se G2-01 a G2-11 todos aprovados.

**AC:**
- [ ] G2-01 a G2-11 todos aprovados

---

## Fase 3: Approval Workflow + BrandVoice 2.0 [~5h + Gate]

> **PRE-REQUISITO ABSOLUTO:** S33-GATE-02 aprovado.
>
> **Sequencia:** APR-01 → APR-02 → APR-03 → (BV-01 STRETCH) → **GATE CHECK 3**
>
> Esta fase implementa o workflow de aprovacao com state machine de 6 estados, history log imutavel, UI de review, e (STRETCH) engagementScore no Content Generation.

---

### S33-APR-01: Approval Engine — State Machine + History Log [M, ~1.5h]

**Objetivo:** Criar `lib/content/approval-engine.ts` com funcao `transitionStatus()` que valida transicoes via adjacency map e registra history log em subcollection.

> **[ARCH DT-08 — P0, BLOCKING, RESOLVIDO]:** State machine implementada como adjacency map hardcoded (`VALID_TRANSITIONS`). ZERO transicao sem validacao. ZERO skip de estado. `published` e terminal (zero transicao de saida). `rejected → rejected` = no-op (ignorar).

**Acao:**
1. CRIAR `app/src/lib/content/approval-engine.ts`:

```typescript
/**
 * Content Approval Engine — State Machine + History Log
 *
 * Estados: draft → pending_review → approved → scheduled → published
 * Transicoes alternativas: qualquer (exceto published) → rejected
 * Re-edit: rejected → draft
 *
 * DT-08 (BLOCKING): Adjacency map hardcoded. ZERO transicao sem validacao.
 *
 * @module lib/content/approval-engine
 * @story S33-APR-01
 */

import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type {
  CalendarItemStatus,
  CalendarItem,
  ApprovalAction,
  ApprovalHistoryEntry,
} from '@/types/content';

/**
 * Adjacency map de transicoes validas.
 * DT-08 (BLOCKING): Source of truth para validacao de transicoes.
 * published = terminal (zero transicao de saida).
 */
const VALID_TRANSITIONS: Record<CalendarItemStatus, CalendarItemStatus[]> = {
  draft: ['pending_review', 'rejected'],
  pending_review: ['approved', 'rejected'],
  approved: ['scheduled', 'rejected'],
  scheduled: ['published', 'rejected'],
  published: [],                // Terminal — ZERO transicao permitida
  rejected: ['draft'],          // Re-edit: volta para draft
};

/**
 * Mapeia action da API para status alvo.
 * NAO incluir 'publish' em S33 (PA-01: zero publicacao real).
 */
const ACTION_TO_STATUS: Record<ApprovalAction, CalendarItemStatus> = {
  submit_review: 'pending_review',
  approve: 'approved',
  reject: 'rejected',
  schedule: 'scheduled',
};

/**
 * Valida se a transicao de status e permitida.
 */
export function isValidTransition(
  from: CalendarItemStatus,
  to: CalendarItemStatus
): boolean {
  // rejected → rejected = no-op (nao erro, apenas ignorar)
  if (from === to) return false;
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Executa transicao de status com validacao e history log.
 *
 * 1. Ler status atual do item
 * 2. Mapear action → target status
 * 3. Validar transicao via VALID_TRANSITIONS (DT-08)
 * 4. Se invalida → return error
 * 5. Se valida:
 *    a. updateDoc com novo status + updatedAt
 *    b. addDoc em subcollection history (append-only, imutavel)
 * 6. Retornar item atualizado
 *
 * @param brandId - ID da marca
 * @param itemId - ID do item no calendario
 * @param action - Acao de aprovacao (submit_review, approve, reject, schedule)
 * @param comment - Comentario opcional (obrigatorio em reject)
 * @param userId - ID do usuario que executa a acao
 */
export async function transitionStatus(
  brandId: string,
  itemId: string,
  action: ApprovalAction,
  comment?: string,
  userId?: string
): Promise<{ success: boolean; item?: CalendarItem; error?: string }> {
  // 1. Ler status atual
  const itemRef = doc(db, 'brands', brandId, 'content_calendar', itemId);
  const snap = await getDoc(itemRef);

  if (!snap.exists()) {
    return { success: false, error: 'Item not found' };
  }

  const currentItem = { id: snap.id, ...snap.data() } as CalendarItem;
  const currentStatus = currentItem.status;

  // 2. Mapear action → target status
  const targetStatus = ACTION_TO_STATUS[action];
  if (!targetStatus) {
    return { success: false, error: `Invalid action: ${action}` };
  }

  // 3. Validar transicao (DT-08 BLOCKING)
  if (!isValidTransition(currentStatus, targetStatus)) {
    return {
      success: false,
      error: `Invalid transition: ${currentStatus} → ${targetStatus}`,
    };
  }

  // 4. Reject sem comentario: erro
  if (action === 'reject' && !comment) {
    return { success: false, error: 'Comment is required when rejecting' };
  }

  const now = Timestamp.now();

  // 5a. Atualizar status do item
  await updateDoc(itemRef, {
    status: targetStatus,
    updatedAt: now,
  });

  // 5b. Registrar history log (append-only, imutavel)
  const historyRef = collection(
    db, 'brands', brandId, 'content_calendar', itemId, 'history'
  );
  await addDoc(historyRef, {
    fromStatus: currentStatus,
    toStatus: targetStatus,
    comment: comment || null,
    timestamp: now,
    userId: userId || null,
  });

  // 6. Retornar item atualizado
  return {
    success: true,
    item: {
      ...currentItem,
      status: targetStatus,
      updatedAt: now,
    },
  };
}

/**
 * Busca historico de aprovacao de um item.
 * History log: brands/{brandId}/content_calendar/{itemId}/history
 * Ordenado por timestamp DESC (mais recente primeiro).
 */
export async function getApprovalHistory(
  brandId: string,
  itemId: string
): Promise<ApprovalHistoryEntry[]> {
  const historyRef = collection(
    db, 'brands', brandId, 'content_calendar', itemId, 'history'
  );

  const snapshot = await getDocs(query(historyRef));
  const entries = snapshot.docs.map((d) => d.data() as ApprovalHistoryEntry);

  // Sort in-memory por timestamp DESC
  return entries.sort((a, b) => b.timestamp.seconds - a.timestamp.seconds);
}

/**
 * Conta items em pending_review para um brand.
 * Usado pelo sidebar badge.
 */
export async function countPendingReview(brandId: string): Promise<number> {
  const { getCalendarItems } = await import('@/lib/firebase/content-calendar');
  // Buscar items dos proximos 90 dias
  const now = Timestamp.now();
  const futureMs = now.toMillis() + 90 * 24 * 60 * 60 * 1000;
  const pastMs = now.toMillis() - 30 * 24 * 60 * 60 * 1000;
  const items = await getCalendarItems(
    brandId,
    Timestamp.fromMillis(pastMs),
    Timestamp.fromMillis(futureMs)
  );
  return items.filter((item) => item.status === 'pending_review').length;
}

/** Export do mapa para testes */
export { VALID_TRANSITIONS };
```

**Arquivos:**
- `app/src/lib/content/approval-engine.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/firebase/content-calendar.ts` — getCalendarItems (criado em CAL-01)
- `app/src/types/content.ts` — types (criado em CAL-01)

**DTs referenciados:** DT-08 (BLOCKING — adjacency map)
**Dependencias:** S33-CAL-01 concluido (types e CRUD existem)
**Gate Check:** S33-GATE-03 (Sim)

**AC:**
- [ ] `VALID_TRANSITIONS` adjacency map exportado com 6 estados (DT-08 BLOCKING)
- [ ] `published` = terminal (zero transicao de saida)
- [ ] `rejected → draft` = re-edit
- [ ] `isValidTransition(from, to)` valida transicoes
- [ ] `transitionStatus(brandId, itemId, action, comment?, userId?)` exportado
- [ ] Action mapping: submit_review→pending_review, approve→approved, reject→rejected, schedule→scheduled
- [ ] NAO inclui action 'publish' (PA-01)
- [ ] Reject sem comentario retorna erro
- [ ] History log em subcollection `brands/{brandId}/content_calendar/{itemId}/history`
- [ ] History log e append-only (addDoc, nunca update)
- [ ] `getApprovalHistory` retorna entries ordenadas por timestamp DESC
- [ ] `countPendingReview` conta items pending_review (para sidebar badge)
- [ ] ZERO `any` (P-01), ZERO `Date` (P-06)
- [ ] `npx tsc --noEmit` = 0

---

### S33-APR-02: API `/api/content/calendar/approve` + Testes [S, ~1h]

**Objetivo:** Criar rota de aprovacao que chama o Approval Engine para transicionar status.

**Acao:**
1. CRIAR `app/src/app/api/content/calendar/approve/route.ts`:

```typescript
/**
 * Content Approval API
 * POST: Transicionar status de um item do calendario
 *
 * Actions: submit_review, approve, reject, schedule
 *
 * @route /api/content/calendar/approve
 * @story S33-APR-02
 */

import { NextRequest } from 'next/server';
import { createApiError, createApiSuccess } from '@/lib/utils/api-response';
import { requireBrandAccess } from '@/lib/auth/brand-guard';
import { transitionStatus } from '@/lib/content/approval-engine';
import type { ApprovalAction } from '@/types/content';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS: ApprovalAction[] = ['submit_review', 'approve', 'reject', 'schedule'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, itemId, action, comment } = body as {
      brandId: string;
      itemId: string;
      action: ApprovalAction;
      comment?: string;
    };

    if (!brandId || !itemId || !action) {
      return createApiError(400, 'Missing required fields: brandId, itemId, action');
    }

    if (!VALID_ACTIONS.includes(action)) {
      return createApiError(400, `Invalid action: ${action}. Valid: ${VALID_ACTIONS.join(', ')}`);
    }

    await requireBrandAccess(req, brandId);

    const result = await transitionStatus(brandId, itemId, action, comment);

    if (!result.success) {
      return createApiError(422, result.error || 'Transition failed');
    }

    return createApiSuccess({ item: result.item });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error('[ContentApprove] POST error:', error);
    return createApiError(500, 'Failed to process approval action');
  }
}
```

2. CRIAR testes em `app/src/__tests__/lib/content/approval-engine.test.ts`:
   - Teste (1): transicao valida `draft → pending_review` funciona
   - Teste (2): transicao invalida `draft → scheduled` retorna erro
   - Teste (3): `published → *` sempre retorna erro (terminal)
   - Teste (4): `reject` sem comentario retorna erro
   - Teste (5): history log registrado apos transicao
   - Teste (6): `rejected → draft` (re-edit) funciona
   - Mock de `firebase/firestore` (getDoc, updateDoc, addDoc, getDocs)

**Arquivos:**
- `app/src/app/api/content/calendar/approve/route.ts` — **CRIAR**
- `app/src/__tests__/lib/content/approval-engine.test.ts` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/lib/content/approval-engine.ts` — transitionStatus (criado em APR-01)
- `app/src/lib/utils/api-response.ts` — createApiError, createApiSuccess
- `app/src/lib/auth/brand-guard.ts` — requireBrandAccess

**DTs referenciados:** DT-08 (BLOCKING — state machine validada nos testes)
**Dependencias:** S33-APR-01 concluido (approval engine existe)
**Gate Check:** S33-GATE-03 (Sim)

**AC:**
- [ ] POST `/api/content/calendar/approve` aceita `brandId`, `itemId`, `action`, `comment?`
- [ ] Actions validas: `submit_review`, `approve`, `reject`, `schedule`
- [ ] Action invalida retorna 400
- [ ] Transicao invalida retorna 422
- [ ] `export const dynamic = 'force-dynamic'` (P-07)
- [ ] `requireBrandAccess` presente (P-08)
- [ ] 6+ testes passando cobrindo transicoes validas, invalidas, terminal, reject sem comentario, re-edit, history
- [ ] `npx tsc --noEmit` = 0

---

### S33-APR-03: UI Review Dashboard + StatusBadge + Sidebar [M, ~1.5h]

**Objetivo:** Criar pagina de review para itens em `pending_review`, componente StatusBadge reutilizavel, e componente ReviewCard para exibir items.

**Acao:**
1. CRIAR `app/src/components/content/status-badge.tsx`:
   - Componente reutilizavel para exibir status com cores
   - Props: `status: CalendarItemStatus`
   - Cores:
     - draft: cinza (gray)
     - pending_review: amarelo (yellow/amber)
     - approved: azul (blue)
     - scheduled: roxo (purple)
     - published: verde (green)
     - rejected: vermelho (red)
   - Usar classes Tailwind com `Badge` do shadcn/ui se disponivel

2. CRIAR `app/src/components/content/review-card.tsx`:
   - Card para exibir item em review
   - Props: `item: CalendarItem`, `onApprove`, `onReject`
   - Mostra: titulo, formato (icone), plataforma, preview do conteudo (truncado 150 chars), data agendada, status badge
   - Botoes: Approve (verde) e Reject (vermelho)
   - Modal/dialog de comentario ao clicar Reject (comentario obrigatorio)

3. CRIAR `app/src/app/content/review/page.tsx`:
   - Busca items com status `pending_review` via API GET `/api/content/calendar`
   - Lista de ReviewCards
   - Empty state quando nao ha items para revisar
   - Ao approve/reject: chama `/api/content/calendar/approve` e atualiza lista
   - Feedback visual (toast/notification) apos acao

4. SIDEBAR (ja configurado em CAL-03): Verificar que item "Aprovacoes" com icone `ClipboardCheck` esta no sidebar. Implementar badge de contagem de items pending_review (fetch via API ou `countPendingReview`).

**Arquivos:**
- `app/src/components/content/status-badge.tsx` — **CRIAR**
- `app/src/components/content/review-card.tsx` — **CRIAR**
- `app/src/app/content/review/page.tsx` — **CRIAR**

**Leitura (NAO MODIFICAR):**
- `app/src/types/content.ts` — CalendarItem, CalendarItemStatus
- `app/src/components/layout/sidebar.tsx` — referencia de sidebar structure

**DTs referenciados:** DT-09 (sidebar items no grupo execution)
**Dependencias:** S33-APR-02 concluido (API approve existe)
**Gate Check:** S33-GATE-03 (Sim)

**AC:**
- [ ] `StatusBadge` componente com 6 cores por status (draft=cinza, pending=amarelo, approved=azul, scheduled=roxo, published=verde, rejected=vermelho)
- [ ] `ReviewCard` mostra titulo, formato, plataforma, preview conteudo, data, status badge
- [ ] ReviewCard tem botoes Approve (verde) e Reject (vermelho)
- [ ] Modal de comentario ao rejeitar (comentario obrigatorio)
- [ ] Pagina `/content/review` lista items pending_review
- [ ] Empty state quando nao ha items
- [ ] Approve/reject chama API e atualiza lista
- [ ] Sidebar badge com contagem de pending_review (se tempo permitir)
- [ ] `npx tsc --noEmit` = 0

---

### S33-BV-01: (STRETCH) engagementScore + Peso no Generation [S, ~1h]

**Objetivo:** Implementar `engagementScore` no `social_interactions` e adicionar peso no content generation engine — buscar top interacoes com maior score e injetar como context no prompt.

> **STRETCH:** S33-BV-01 so e executado se Gate 3 estiver aprovado com sobra de tempo. Pode ser movido para S34 sem impacto.

**Acao:**
1. Em `app/src/lib/content/generation-engine.ts`:
   - ADICIONAR funcao `getTopEngagementExamples(brandId)`:
     ```typescript
     async function getTopEngagementExamples(brandId: string): Promise<string> {
       try {
         const colRef = collection(db, 'brands', brandId, 'social_interactions');
         const snapshot = await getDocs(colRef);
         const interactions = snapshot.docs
           .map(d => d.data())
           .filter(d => d.engagementScore && d.engagementScore > 0.7)
           .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
           .slice(0, 5);
         
         if (interactions.length === 0) return '';
         
         return '\n\n## High-Performance Content Examples\n' +
           interactions.map(i => `- "${i.content}" (engagement: ${i.engagementScore})`).join('\n');
       } catch {
         return '';
       }
     }
     ```
   - No `generateContent()`, ADICIONAR chamada apos montar system instruction:
     ```typescript
     const engagementContext = await getTopEngagementExamples(brandId);
     const enrichedPrompt = filledPrompt + engagementContext;
     ```

2. Confirmar que `engagementScore` (number, 0.0-1.0) existe no type `SocialInteractionRecord` (ja adicionado em GOV-04).

**Arquivos:**
- `app/src/lib/content/generation-engine.ts` — **MODIFICAR** (adicionar engagement context)

**DTs referenciados:** Nenhum (STRETCH)
**Dependencias:** S33-APR-03 concluido + S33-GOV-04 (SocialInteractionRecord com engagementScore)
**Gate Check:** S33-GATE-03 (Sim, se executado)

**AC:**
- [ ] `getTopEngagementExamples(brandId)` busca top-5 interacoes com `engagementScore > 0.7`
- [ ] Context injetado no prompt como exemplos de alta performance
- [ ] Se nao ha interacoes: retorna string vazia (NAO bloqueia geracao)
- [ ] NAO obrigatorio para engine funcionar — peso leve
- [ ] `npx tsc --noEmit` = 0

---

### S33-GATE-03: Gate Check 3 — Approval Workflow [XS, ~15min] — GATE

**Objetivo:** Validar que o approval workflow esta funcional. **Fase 4 NAO pode iniciar sem este gate aprovado.**

**Checklist de Validacao:**

| # | Verificacao | Comando/Metodo | Resultado Esperado |
|:--|:-----------|:--------------|:------------------|
| G3-01 | Approval engine criado | `rg "transitionStatus" app/src/lib/content/approval-engine.ts` | 1+ match |
| G3-02 | VALID_TRANSITIONS map | `rg "VALID_TRANSITIONS" app/src/lib/content/approval-engine.ts` | 1+ match (DT-08) |
| G3-03 | published terminal | `rg "published.*\[\]" app/src/lib/content/approval-engine.ts` | 1+ match |
| G3-04 | History log subcollection | `rg "history" app/src/lib/content/approval-engine.ts` | 2+ matches |
| G3-05 | API approve criada | `rg "force-dynamic" app/src/app/api/content/calendar/approve/route.ts` | 1+ match |
| G3-06 | requireBrandAccess | `rg "requireBrandAccess" app/src/app/api/content/calendar/approve/route.ts` | 1+ match |
| G3-07 | StatusBadge componente | Verificar existencia de `app/src/components/content/status-badge.tsx` | Arquivo existe |
| G3-08 | Review page | Verificar existencia de `app/src/app/content/review/page.tsx` | Arquivo existe |
| G3-09 | Testes approval | Verificar existencia de `app/src/__tests__/lib/content/approval-engine.test.ts` | 6+ testes |
| G3-10 | TypeScript limpo | `npx tsc --noEmit` | Exit code 0 |
| G3-11 | Testes passando | `npm test` | 0 fail |

**Regra ABSOLUTA:** Fase 4 so inicia se G3-01 a G3-11 todos aprovados.

**AC:**
- [ ] G3-01 a G3-11 todos aprovados

---

## Fase 4: Governanca Final [~0.5h]

> **PRE-REQUISITO ABSOLUTO:** S33-GATE-03 aprovado.

---

### S33-GOV-05: Atualizar contract-map.yaml [XS, ~15min]

**Objetivo:** Registrar nova lane `content_autopilot` no `contract-map.yaml`.

> **[ARCH DT-10 — NON-BLOCKING, RESOLVIDO]:** Nova lane com cross-reference anotada para `ai_retrieval`.

**Acao:**
1. Em `_netecmt/core/contract-map.yaml`, ADICIONAR nova lane:

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

**Arquivos:**
- `_netecmt/core/contract-map.yaml` — **MODIFICAR**

**DTs referenciados:** DT-10 (nova lane)
**Dependencias:** S33-GATE-03 aprovado
**Gate Check:** Nao

**AC:**
- [ ] Lane `content_autopilot` criada com 7 paths
- [ ] Cross-reference anotada para `ai_retrieval` no path do prompts
- [ ] Zero erro de parse YAML
- [ ] Zero conflito com lanes existentes

---

### S33-GOV-06: ACTIVE_SPRINT.md + ROADMAP.md [XS, ~15min]

**Objetivo:** Atualizar `ACTIVE_SPRINT.md` para S33 e registrar S33 no `ROADMAP.md`.

**Acao:**
1. Em `_netecmt/sprints/ACTIVE_SPRINT.md`:
   - Atualizar sprint ativa para S33
   - Listar fases, stories, e metricas alvo

2. Em `_netecmt/ROADMAP.md`:
   - Adicionar entrada S33 com status e features entregues

**Arquivos:**
- `_netecmt/sprints/ACTIVE_SPRINT.md` — **MODIFICAR**
- `_netecmt/ROADMAP.md` — **MODIFICAR**

**DTs referenciados:** Nenhum
**Dependencias:** S33-GOV-05 concluido
**Gate Check:** Nao

**AC:**
- [ ] ACTIVE_SPRINT.md reflete S33 com fases e metricas
- [ ] ROADMAP.md tem entrada S33

---

## Testes Recomendados (Novos — Dandara)

> **Todos os testes de Firestore devem usar mocks de `firebase/firestore` (via `jest.mock()`). NUNCA chamar Firestore real em testes automatizados.**

| # | Teste | Tipo | Arquivo Sugerido | Story |
|:--|:------|:-----|:----------------|:------|
| T-01 | `createCalendarItem` cria item com `Timestamp.now()` | Unit | `__tests__/lib/firebase/content-calendar.test.ts` | CAL-01 |
| T-02 | `getCalendarItems` retorna items ordenados (in-memory sort) | Unit | `__tests__/lib/firebase/content-calendar.test.ts` | CAL-01 |
| T-03 | `reorderCalendarItems` usa `writeBatch()` | Unit | `__tests__/lib/firebase/content-calendar.test.ts` | CAL-01 |
| T-04 | `deleteCalendarItem` remove item | Unit | `__tests__/lib/firebase/content-calendar.test.ts` | CAL-01 |
| T-05 | `generateContent` retorna resultado valido para 'post' | Unit (mock Gemini) | `__tests__/lib/content/generation-engine.test.ts` | GEN-01 |
| T-06 | `generateContent` retorna resultado valido para 'carousel' | Unit (mock Gemini) | `__tests__/lib/content/generation-engine.test.ts` | GEN-01 |
| T-07 | `generateContent` fallback quando Gemini falha | Unit | `__tests__/lib/content/generation-engine.test.ts` | GEN-01 |
| T-08 | `generateContent` com brand not found | Unit | `__tests__/lib/content/generation-engine.test.ts` | GEN-01 |
| T-09 | `transitionStatus` valida draft→pending_review | Unit | `__tests__/lib/content/approval-engine.test.ts` | APR-01 |
| T-10 | `transitionStatus` rejeita draft→scheduled | Unit | `__tests__/lib/content/approval-engine.test.ts` | APR-01 |
| T-11 | `transitionStatus` published e terminal | Unit | `__tests__/lib/content/approval-engine.test.ts` | APR-01 |
| T-12 | `transitionStatus` reject sem comentario = erro | Unit | `__tests__/lib/content/approval-engine.test.ts` | APR-01 |
| T-13 | `transitionStatus` registra history log | Unit | `__tests__/lib/content/approval-engine.test.ts` | APR-01 |
| T-14 | `transitionStatus` rejected→draft (re-edit) | Unit | `__tests__/lib/content/approval-engine.test.ts` | APR-01 |

---

## Checklist de Pre-Execucao (Darllyson)

### Antes de comecar qualquer story:
- [ ] Ler este arquivo (`stories.md`) por completo
- [ ] Ler `allowed-context.md` para proibicoes e arquivos permitidos
- [ ] Confirmar 3 Blocking DTs RESOLVIDOS compreendidos:
  - [ ] **DT-04**: Range query em campo unico + in-memory sort. ZERO composite index.
  - [ ] **DT-05**: Reorder via `writeBatch()`. ZERO updates sequenciais.
  - [ ] **DT-08**: State machine via adjacency map. ZERO transicao sem validacao.
- [ ] Confirmar `npx tsc --noEmit` = 0 erros (baseline pos-S32)
- [ ] Confirmar testes passando (baseline 257/257)

### Validacoes incrementais — Fase 0:
- [ ] Apos GOV-01: README menciona zod
- [ ] Apos GOV-02: afterAll + writeBatch mock no jest.setup.js
- [ ] Apos GOV-03: ADR Instagram domain criado
- [ ] Apos GOV-04: SocialInteractionRecord type criado
- [ ] **GATE CHECK 0**: G0-01 a G0-08

### Validacoes incrementais — Fase 1:
- [ ] Apos CAL-01: Types + CRUD helpers criados (writeBatch no reorder)
- [ ] Apos CAL-02: API routes com requireBrandAccess + testes
- [ ] Apos CAL-03: UI calendario + sidebar items
- [ ] **GATE CHECK 1**: G1-01 a G1-12

### Validacoes incrementais — Fase 2:
- [ ] Apos GEN-01: Generation engine com Brand Voice injection
- [ ] Apos GEN-02: 4 prompts + system instruction
- [ ] Apos GEN-03: API generate + insertToCalendar + testes
- [ ] **GATE CHECK 2**: G2-01 a G2-11

### Validacoes incrementais — Fase 3:
- [ ] Apos APR-01: Approval engine com adjacency map + history log
- [ ] Apos APR-02: API approve + testes (6+)
- [ ] Apos APR-03: UI review + StatusBadge + ReviewCard
- [ ] (STRETCH) Apos BV-01: engagementScore no generation
- [ ] **GATE CHECK 3**: G3-01 a G3-11

### Validacoes incrementais — Fase 4:
- [ ] Apos GOV-05: contract-map.yaml com lane content_autopilot
- [ ] Apos GOV-06: ACTIVE_SPRINT.md + ROADMAP.md atualizados

### Validacao final (TODAS as fases):
- [ ] `npx tsc --noEmit` → `Found 0 errors`
- [ ] Testes → 0 fail, >= 257 + novos testes (estimado ~271-275)
- [ ] Build → >= 105 + novas rotas content (estimado ~108-109)
- [ ] Zero `any`, zero `Date`, zero `@ts-ignore`
- [ ] Todas rotas novas com `force-dynamic` + `requireBrandAccess`
- [ ] Contract-map atualizado

---
*Stories preparadas por Leticia (SM) — NETECMT v2.0*
*Incorpora 10 Decision Topics do Architecture Review (Athos)*
*Sprint 33: Content Autopilot Foundation | 08/02/2026*
*19 stories (15 core + 4 gates) + 1 STRETCH | 4 Gates | 3 Blocking DTs*
*Estimativa: 16.5h (sem STRETCH) / 17.5h (com STRETCH)*
*Legenda: XS = Extra Small (< 30min), S = Small (< 2h), S+ = Small Extended, M = Medium (2-4h), M+ = Medium Extended, L = Large (> 4h)*
