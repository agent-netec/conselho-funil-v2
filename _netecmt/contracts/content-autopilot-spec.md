# Especificacao do Content Autopilot

**Lane:** Content Autopilot
**Status:** Ready for Implementation
**Versao:** 1.0.0
**Sprint:** S33 — Content Autopilot Foundation
**Criado por:** Athos (Architect)
**Data:** 09/02/2026

---

## 1. Escopo

Este contrato define as interfaces, regras de negocio e invariantes da lane `content_autopilot`, que abrange:
- Calendario Editorial (CRUD + reorder atomico)
- Content Generation Pipeline (4 formatos + Brand Voice)
- Approval Workflow (state machine 6 estados)

## 2. Paths Governados

```yaml
content_autopilot:
  paths:
    - "app/src/lib/content/**"
    - "app/src/lib/firebase/content-calendar.ts"
    - "app/src/lib/ai/prompts/content-generation.ts"    # cross-ref ai_retrieval
    - "app/src/app/api/content/**"
    - "app/src/app/content/**"
    - "app/src/components/content/**"
    - "app/src/types/content.ts"
```

## 3. Interfaces de Dados

### 3.1 CalendarItem (Firestore)

Collection: `brands/{brandId}/content_calendar`

```typescript
export interface CalendarItem {
  id: string;
  title: string;
  format: ContentFormat;           // 'post' | 'story' | 'carousel' | 'reel'
  platform: ContentPlatform;       // 'instagram' | 'linkedin' | 'x' | 'tiktok'
  scheduledDate: Timestamp;        // NAO Date (P-06)
  status: CalendarItemStatus;      // 6 estados
  content: string;
  metadata: CalendarItemMetadata;
  order: number;                   // Posicao intra-dia (reorder)
  brandId: string;
  createdBy?: string;              // userId — audit trail (DT-03)
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

type ContentFormat = 'post' | 'story' | 'carousel' | 'reel';
type ContentPlatform = 'instagram' | 'linkedin' | 'x' | 'tiktok';
```

### 3.2 ContentGenerationResult

```typescript
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
```

### 3.3 ApprovalHistoryEntry

Collection: `brands/{brandId}/content_calendar/{itemId}/history`

```typescript
export interface ApprovalHistoryEntry {
  fromStatus: CalendarItemStatus;
  toStatus: CalendarItemStatus;
  comment?: string;
  timestamp: Timestamp;
  userId?: string;
}
```

## 4. API Routes

| Rota | Metodo | Auth | Descricao |
|:-----|:-------|:-----|:----------|
| `/api/content/calendar` | GET | `requireBrandAccess` | Listar items por range de datas (`start`, `end` como Timestamp ms) |
| `/api/content/calendar` | POST | `requireBrandAccess` | Criar item no calendario |
| `/api/content/calendar` | PUT | `requireBrandAccess` | Atualizar item existente |
| `/api/content/calendar` | DELETE | `requireBrandAccess` | Remover item |
| `/api/content/calendar/reorder` | POST | `requireBrandAccess` | Reorder atomico via `writeBatch()` (DT-05) |
| `/api/content/generate` | POST | `requireBrandAccess` | Gerar conteudo via Gemini + Brand Voice |
| `/api/content/calendar/approve` | POST | `requireBrandAccess` | Transicionar status (state machine DT-08) |

## 5. Regras de Negocio (Invariantes)

### 5.1 State Machine — Adjacency Map (DT-08 BLOCKING)

```typescript
const VALID_TRANSITIONS: Record<CalendarItemStatus, CalendarItemStatus[]> = {
  draft: ['pending_review', 'rejected'],
  pending_review: ['approved', 'rejected'],
  approved: ['scheduled', 'rejected'],
  scheduled: ['published', 'rejected'],
  published: [],              // Terminal — ZERO transicao
  rejected: ['draft'],        // Re-edit unico caminho
};
```

**Invariantes:**
- ZERO transicao sem validacao via `VALID_TRANSITIONS`
- `published` = estado terminal (zero saida)
- `rejected` so pode voltar para `draft`
- `reject` exige comentario obrigatorio

### 5.2 Query Pattern (DT-04 BLOCKING)

- Range query em campo UNICO (`scheduledDate`)
- ZERO composite index
- ZERO `orderBy` combinado com `where` em campo diferente
- Sort in-memory por `scheduledDate` ASC, `order` ASC

### 5.3 Reorder Atomico (DT-05 BLOCKING)

- DEVE usar `writeBatch()` para reorder
- ZERO updates sequenciais (`updateDoc` em loop)
- Garante atomicidade: ou todos atualizam, ou nenhum

### 5.4 Content Generation

- Usa `generateWithGemini()` com `responseMimeType: 'application/json'`
- Brand Voice injetada via `system_instruction`
- Output validado com Zod schema por formato (`CONTENT_SCHEMAS[format]`)
- Fallback: se geracao falha, retorna `{ generated: false }` — NAO throw
- 4 Zod schemas: `PostOutputSchema`, `StoryOutputSchema`, `CarouselOutputSchema`, `ReelOutputSchema`

## 6. Proibicoes Especificas

| ID | Proibicao |
|:---|:----------|
| PA-01 | ZERO publicacao real em plataformas externas |
| PA-03 | ZERO biblioteca de drag-and-drop (HTML5 nativo) |
| PA-04 | ZERO `orderBy` + `where` em campos diferentes (DT-04) |
| PA-05 | ZERO updates sequenciais para reorder (DT-05) |
| PA-06 | ZERO transicao sem adjacency map (DT-08) |

## 7. Dependencias

| Modulo | Path | Tipo |
|:-------|:-----|:-----|
| `generateWithGemini()` | `lib/ai/gemini.ts` | Leitura |
| `getBrand()` | `lib/firebase/firestore.ts` | Leitura |
| `requireBrandAccess()` | `lib/auth/brand-guard.ts` | Leitura |
| `createApiError/Success` | `lib/utils/api-response.ts` | Leitura |
| `NAV_GROUPS` | `lib/constants.ts` | Modificacao (2 items grupo execution) |
| `SIDEBAR_ICONS` | `lib/icon-maps.ts` | Modificacao (Calendar, ClipboardCheck) |

## 8. Sidebar Integration

- Grupo: `execution`
- Items: `content-calendar` (Calendario, icon Calendar) + `content-review` (Aprovacoes, icon ClipboardCheck)
- Badge: contagem de items `pending_review` no item Aprovacoes

## 9. Cross-Lane References

| Path | Lane Principal | Lane Secundaria | Justificativa |
|:-----|:--------------|:----------------|:-------------|
| `lib/ai/prompts/content-generation.ts` | `content_autopilot` | `ai_retrieval` (glob `lib/ai/**`) | Ownership: content_autopilot (criado em S33) |

---

*Contrato criado por Athos (Architect) — NETECMT v2.0*
*Sprint 33: Content Autopilot Foundation | 09/02/2026*
*Referencia: arch-sprint-33.md, stories.md, contract-map.yaml*
