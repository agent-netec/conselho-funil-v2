# Prompt de Continuação — Backlog de Pendências (Vault v2 F1 + Calendar v2 F1 + Social v2 J4)

## Contexto do Projeto

- **Repo:** agent-netec/conselho-funil-v2
- **Stack:** Next.js 16.1.1, React 19, TypeScript, Firebase, Gemini AI, Pinecone
- **Build:** `cd app && npm run build` (deve passar sem erros)
- **Root dir Vercel:** `app/`
- **Site em produção** — todas as mudanças devem ser backward-compatible
- **Idioma do código:** inglês. **Comunicação:** português BR

## Regras importantes

- NÃO alterar lógica de RAG, credits ou persistência sem pedir confirmação
- PRESERVAR formatos de output de todas as APIs
- Correções devem ser mínimas e cirúrgicas
- Build deve passar: `cd app && npm run build`
- Firestore é schemaless — campos novos são opcionais (?), sem migration
- `ignoreBuildErrors: true` no next.config.ts, mas preferimos zero erros de TS

---

## O que já está 100% completo (NÃO MEXER)

- Offer Lab v2 (F0→F4) — scoring, wizard, AI eval, copy integration, social integration, golden thread, calendar integration, lista de ofertas, comparação A/B, copy scoring real, offerId em A/B Testing
- Brand Hub v2 (F1+F2) — wizard 7 steps, completeness score, AI config em 5 engines
- Assets v2 F1 — 4 bugs corrigidos (asset invisível, logoLock undefined, delete button, aria-describedby)
- Settings v2 F1 — todas as 6 tabs com save real no Firestore

---

## TAREFAS A IMPLEMENTAR

### BLOCO 1: Vault v2 F1 — Completar (5 tarefas)

#### V1: CRON route para Content Autopilot

**Criar:** `app/src/app/api/cron/content-autopilot/route.ts`

**O que fazer:**
- Criar rota GET protegida por `CRON_SECRET` (mesmo padrão dos crons existentes)
- Importar e chamar `ContentCurationEngine.runCurationCycle(brandId)` de `@/lib/agents/publisher/curation-engine`
- Para cada insight retornado, chamar `AdaptationPipeline.adaptInsight()` de `@/lib/agents/publisher/adaptation-pipeline`
- Iterar sobre todas as brands ativas (query `brands` collection onde `status != 'archived'`)
- Dedutor de créditos: 2 por conteúdo adaptado (já implementado dentro do AdaptationPipeline)

**Padrão de referência** (copiar estrutura de):
- `app/src/app/api/cron/content-metrics/route.ts` — mesmo padrão de auth com CRON_SECRET
- `app/src/app/api/cron/social-sync/route.ts` — mesmo padrão de iteração por brands

**Adicionar ao vercel.json** (se existir) ou criar:
```json
{
  "crons": [
    { "path": "/api/cron/content-autopilot", "schedule": "0 */6 * * *" }
  ]
}
```

#### V2: Conectar botão "+ Novo Ativo"

**Arquivo:** `app/src/app/vault/page.tsx`

**O que fazer:**
- Localizar `handleNewAsset` (atualmente faz `toast("Em breve: Upload de novos ativos...")`)
- Substituir por state que abre um modal/dropdown com 3 opções:
  1. **"DNA Template"** → abrir o `DnaWizard` que já existe em `app/src/components/vault/dna-wizard.tsx` (setar `showDnaWizard(true)` ou similar)
  2. **"Upload de Mídia"** → redirecionar para `/assets` com `router.push('/assets')`
  3. **"Post Manual"** → criar item na review queue com status 'draft' via POST para `/api/content/autopilot` ou criação direta no Firestore `brands/{brandId}/review_queue`
- UI: usar Popover ou DropdownMenu do shadcn (já existe no projeto)

#### V3: Conectar botão "Histórico"

**Arquivo:** `app/src/app/vault/page.tsx`

**O que fazer:**
- Localizar `handleHistory` (atualmente faz `toast("Em breve: Histórico de aprovações...")`)
- Substituir por state que abre um Sheet/Drawer lateral
- Query: `brands/{brandId}/review_queue` filtrado por `status in ['approved', 'rejected']`, ordenado por `updatedAt desc`, limit 50
- Mostrar: título, status (badge verde/vermelho), data, plataforma
- Componente simples, estilo lista com badges

#### V4: Implementar "Ver Detalhes" no Vault Explorer

**Arquivo:** `app/src/components/vault/vault-explorer.tsx`

**O que fazer:**
- Localizar o botão/link "Ver Detalhes" (stub sem handler)
- Implementar: abrir modal/dialog com dados completos do DNA selecionado
- Mostrar: name, type, content (preview), tags, structure, tone, CTA style, createdAt
- Dados já existem no objeto — só precisa de UI para exibir

#### V5: Conectar Settings tab toggles do Vault

**Arquivo:** `app/src/app/vault/page.tsx` (seção de settings/configurações)

**O que fazer:**
- Localizar a seção de Settings do Vault (toggles de auto-approve, notificações, etc)
- Salvar em Firestore: `brands/{brandId}` campo `vaultSettings` (objeto novo)
  ```typescript
  vaultSettings?: {
    autoApproveThreshold?: number; // 0-100, se score AI >= threshold, auto-approve
    notifyOnNewContent?: boolean;
    autopilotEnabled?: boolean; // liga/desliga o cron
  }
  ```
- Carregar no mount via getDoc do brand
- Salvar via updateDoc com merge
- Toggle "Direct Publish" deve ficar disabled com tooltip "Requer OAuth (Sprint L)"

---

### BLOCO 2: Calendar v2 F1 — Completar (2 tarefas)

#### C1: Preview de post no modal de criação

**Arquivo:** `app/src/app/content/calendar/page.tsx`

**O que fazer:**
- Localizar o modal/form de criação de post no calendário
- Abaixo dos inputs (título, conteúdo, plataforma, data, hora), adicionar uma seção de preview
- Preview: card simples simulando aparência de um post social
  - Avatar da brand (se disponível) + nome da brand
  - Texto do conteúdo (com formatação básica)
  - Plataforma badge (Instagram/X/LinkedIn)
  - Data/hora formatada
- Mostrar apenas quando título OU conteúdo tiverem texto (condicional)
- UI: Card com `bg-zinc-900/50 border-zinc-800`, estilo consistente com o resto

#### C2: Estilização visual por status nos items do calendário

**Arquivo:** `app/src/app/content/calendar/page.tsx`

**O que fazer:**
- Localizar onde os items do calendário são renderizados (cards/blocos por dia)
- Adicionar borda lateral colorida baseada no status:
  - `draft` → `border-l-4 border-l-zinc-600`
  - `pending_review` → `border-l-4 border-l-amber-500`
  - `approved` → `border-l-4 border-l-green-500`
  - `published` → `border-l-4 border-l-blue-500`
  - `rejected` → `border-l-4 border-l-red-500`
- Opcional: pequeno dot ou badge com o status textual

---

### BLOCO 3: Social v2 J4 — Completar (2 tarefas)

#### S1: UI para upload de docs na Knowledge Base social

**Onde criar:** Componente novo `app/src/components/social/knowledge-uploader.tsx`
**Integrar em:** Painel social (provavelmente `app/src/app/social/page.tsx` ou tab dedicada)

**O que fazer:**
- Botão "Adicionar Conhecimento" que abre modal
- 3 modos de input:
  1. **URL** — campo de texto, ao submeter chama pipeline existente de RAG
  2. **Texto colado** — textarea, ao submeter faz chunking + embed
  3. **Upload PDF** — file input, processar via pipeline de assets existente
- Ao salvar, chamar `/api/social/knowledge` com POST (verificar se aceita criação ou só query)
- Se não aceitar criação, usar o pipeline de assets existente (`/api/assets/upload`) com namespace `social`
- Metadata obrigatória: `{ category: 'social', channel: 'general' }` para filtro no RAG

#### S2: Categorização automática de best practices

**Arquivo:** `/api/social/knowledge` route (verificar se já existe POST handler)

**O que fazer:**
- Ao receber novo doc social, usar Gemini para classificar automaticamente:
  - Tipo: `best_practice` | `case_study` | `policy` | `trend`
  - Canal: `instagram` | `tiktok` | `linkedin` | `x` | `youtube` | `general`
  - Tags: array de strings gerado pela AI
- Salvar metadata junto com o embedding no Pinecone
- Isso permite filtros mais precisos quando o debate/scorecard consulta a KB

---

## Arquivos de referência (padrões a seguir)

| Padrão | Arquivo de referência |
|--------|----------------------|
| CRON com CRON_SECRET | `app/src/app/api/cron/content-metrics/route.ts` |
| Modal com shadcn Dialog | `app/src/components/vault/dna-wizard.tsx` |
| Sheet/Drawer lateral | `app/src/components/ui/sheet.tsx` (se existir) |
| Firestore query + list | `app/src/app/api/intelligence/offer/list/route.ts` |
| Auth headers pattern | `import { getAuthHeaders } from '@/lib/utils/auth-headers'` |
| API response pattern | `import { createApiError, createApiSuccess } from '@/lib/utils/api-response'` |
| Brand access guard | `import { requireBrandAccess } from '@/lib/auth/brand-guard'` |
| Content Autopilot engine | `app/src/lib/agents/publisher/curation-engine.ts` |
| Adaptation pipeline | `app/src/lib/agents/publisher/adaptation-pipeline.ts` |
| Vault page (onde editar) | `app/src/app/vault/page.tsx` |
| Calendar page (onde editar) | `app/src/app/content/calendar/page.tsx` |
| Social page | `app/src/app/social/page.tsx` |
| RAG pipeline | `app/src/lib/ai/rag.ts` |

## Ordem de execução recomendada

1. **V1** (CRON) — infraestrutura, independente
2. **V2** (+ Novo Ativo) — depende só de V1 conceitualmente
3. **V3** (Histórico) — independente
4. **V4** (Ver Detalhes) — independente
5. **V5** (Settings toggles) — independente
6. **C1** (Preview) — independente
7. **C2** (Status visual) — independente
8. **S1** (KB Upload UI) — independente
9. **S2** (Categorização) — depende de S1

**Total: 9 tarefas, todas independentes entre si (exceto S2→S1).**

Ao finalizar, rodar `cd app && npm run build` e garantir zero erros.
