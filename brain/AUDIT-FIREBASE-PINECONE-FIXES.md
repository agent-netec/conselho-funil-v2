# AUDITORIA FIREBASE + PINECONE — PLANO DE CORREÇÃO
**Data:** 2026-03-12
**Status:** Em andamento
**Contexto:** Bugs descobertos após go-live. Falhas silenciosas em Storage, Firestore, RAG e Pinecone causadas por código escrito sem teste end-to-end contra infraestrutura real.

---

## LEGENDA DE STATUS

| Símbolo | Significado |
|---------|------------|
| ✅ FEITO | Corrigido e deployado |
| 🔴 PENDENTE | Ainda não resolvido |
| 🟡 EM ANÁLISE | Precisa de mais investigação |
| ⚪ BLOQUEADO | Depende de outra task |

---

## RESUMO EXECUTIVO — O QUE ESTÁ QUEBRADO

### Causa Raiz (3 padrões recorrentes)
1. **Código escrito sem testar contra Firebase Rules reais** — features desenvolvidas localmente (emulator permissivo), rules nunca atualizadas
2. **Client SDK usado no servidor sem autenticação** — 66 API routes passam token pelo brand-guard mas o objeto `db` é anônimo para o Firestore, causando falhas silenciosas ou 403
3. **Contratos de metadata Pinecone desconectados** — `rag.ts` filtra por campos que `worker.ts` nunca armazenou; silent failure sempre retorna `[]`

---

## FASE 1 — FIRESTORE RULES (BLOQUEIOS IMEDIATOS)

> **Objetivo:** Garantir que todas as coleções usadas no código tenham rules correspondentes.
> **Risco:** Baixo (alterações aditivas, não quebram nada existente).
> **Arquivo:** `app/firestore.rules`

---

### TASK 1.1 — Rules para `campaigns` ✅ FEITO

**Problema:** Coleção `campaigns` usada por 3 routes sem nenhuma rule → bloqueada pelo fallback global `allow read, write: if false`.

**Routes afetados:**
- `app/src/app/api/campaigns/[id]/generate-ads/route.ts` — lê e atualiza campaigns
- `app/src/app/api/copy/decisions/route.ts` — lê campaigns
- `app/src/app/api/webhooks/ads-metrics/route.ts` — atualiza metrics de campaigns

**Correção aplicada** (2026-03-12):
```firestore-rules
match /campaigns/{campaignId} {
  allow list: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow get: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

**Verificação:**
- [ ] Criar campanha no frontend e confirmar sem erros 403
- [ ] Geração de ads funciona sem erros de permissão no console

---

### TASK 1.2 — Rules para `copyDecisions` ✅ FEITO

**Problema:** Coleção root `copyDecisions` usada por `/api/copy/decisions` sem rule.

**Routes afetados:**
- `app/src/app/api/copy/decisions/route.ts` — linha 97: `addDoc(collection(db, 'copyDecisions'), ...)`

**⚠️ Vulnerabilidade extra identificada:** Esta route extrai `userId` do body da request (`body?.userId`) em vez do token — qualquer um pode injetar um userId falso. Registrado em TASK 3.3.

**Correção aplicada** (2026-03-12):
```firestore-rules
match /copyDecisions/{copyDecisionId} {
  allow list: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow get: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update, delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}
```

**Verificação:**
- [ ] Feedback de copy (thumbs up/down) funciona sem erro

---

### TASK 1.3 — Rules para `funnels/{funnelId}/copyProposals` ✅ FEITO

**Problema:** Subcoleção `copyProposals` diferente de `proposals` (que tem rule) — sem cobertura.

**Routes afetados:**
- `app/src/app/api/copy/generate/route.ts` — linha 368: `addDoc(collection(db, 'funnels', funnelId, 'copyProposals'), ...)`
- `app/src/app/api/copy/decisions/route.ts` — linha 61: `getDoc(doc(db, 'funnels', funnelId, 'copyProposals', copyProposalId))`

**Correção aplicada** (2026-03-12):
```firestore-rules
match /copyProposals/{copyProposalId} {
  allow read, write: if isAuthenticated() &&
    get(/databases/$(database)/documents/funnels/$(funnelId)).data.userId == request.auth.uid;
}
```

**Verificação:**
- [ ] Geração de copy no Funnel Editor funciona e salva proposta
- [ ] Seleção de copy (decisão) lê corretamente a proposta gerada

---

### TASK 1.4 — Rules para `brands/{brandId}/generated_ads` ✅ FEITO

**Problema:** Subcoleção `generated_ads` usada pelo route de geração de ads sem rule.

**Routes afetados:**
- `app/src/app/api/campaigns/[id]/generate-ads/route.ts` — salva ads gerados

**Correção aplicada** (2026-03-12):
```firestore-rules
match /generated_ads/{adId} {
  allow read, write: if isAuthenticated() &&
    get(/databases/$(database)/documents/brands/$(brandId)).data.userId == request.auth.uid;
}
```

**Verificação:**
- [ ] Ads gerados aparecem na interface após geração

---

### TASK 1.5 — Rules para `brands/{brandId}/content_calendar` 🔴 PENDENTE

**Problema:** Subcoleção `content_calendar` acessada por routes/hooks sem rule identificada.

**Para verificar antes de corrigir:**
- [ ] Confirmar quais routes/components acessam esta coleção
- [ ] Adicionar rule seguindo o padrão das outras subcoleções de `brands`

**Template de correção:**
```firestore-rules
match /content_calendar/{entryId} {
  allow read, write: if isAuthenticated() &&
    get(/databases/$(database)/documents/brands/$(brandId)).data.userId == request.auth.uid;
}
```

---

### TASK 1.6 — Rules para `brands/{brandId}/copy_dna` 🔴 PENDENTE

**Problema:** Subcoleção `copy_dna` identificada no mapeamento mas sem rule.

**Para verificar antes de corrigir:**
- [ ] Confirmar quais routes acessam esta coleção
- [ ] Adicionar rule

---

### TASK 1.7 — Rules para `brands/{brandId}/performance_metrics` 🔴 PENDENTE

**Problema:** Subcoleção `performance_metrics` acessada pelo cron `ads-sync` via Admin SDK (OK) mas possivelmente também por client-side.

**Para verificar:**
- [ ] Verificar se é lida diretamente pelo frontend (hooks, components)
- [ ] Se sim, adicionar rule com padrão das outras subcoleções

---

### TASK 1.8 — Rules para `brands/{brandId}/social_interactions` 🔴 PENDENTE

**Problema:** Subcoleção usada pelo cron `social-sync` — escrita server-side. Sem rule.

**Nota:** Será coberta pelo Admin SDK após TASK 2.3. Por ora, adicionar rule preventiva.

**Template:**
```firestore-rules
match /social_interactions/{interactionId} {
  // Write: apenas server-side (Admin SDK bypassa rules)
  // Read: owner da brand pode ler
  allow read: if isAuthenticated() &&
    get(/databases/$(database)/documents/brands/$(brandId)).data.userId == request.auth.uid;
  allow write: if false; // Apenas Admin SDK (cron)
}
```

---

### TASK 1.9 — Rules para `leads` 🔴 PENDENTE

**Problema:** Coleção `leads` encontrada no mapeamento — sem rule e sem contexto claro.

**Para verificar:**
- [ ] Onde é criada/lida no código?
- [ ] É scoped por userId ou por brandId?
- [ ] Adicionar rule adequada

---

### TASK 1.10 — Rules para `transactions` 🔴 PENDENTE

**Problema:** Coleção `transactions` encontrada — sem rule.

**Para verificar:**
- [ ] Confirmar uso (billing? histórico de créditos?)
- [ ] Adicionar rule com isolamento por userId

---

### CHECKLIST DA FASE 1

```
RULES DEPLOYADAS (2026-03-12):
[x] 1.1 campaigns
[x] 1.2 copyDecisions
[x] 1.3 funnels/copyProposals
[x] 1.4 brands/generated_ads
[x] Spy (competitors, intelligence, keywords) — corrigido em sessão anterior
[x] query_cache — corrigido em sessão anterior

RULES DEPLOYADAS (2026-03-12 — Sessão 2):
[x] 1.5 brands/content_calendar (+ history subcollection)
[x] 1.6 brands/copy_dna
[x] 1.7 brands/performance_metrics (read only — write: Admin SDK)
[x] 1.8 brands/social_interactions
[x] 1.9 leads (root + brands/{brandId}/leads + events subcollection)
[x] 1.10 transactions (root + brands/{brandId}/transactions)

✅ FASE 1 COMPLETA — Deploy confirmado em 2026-03-12
```

---

## FASE 2 — CLIENT SDK → ADMIN SDK NAS API ROUTES

> **Objetivo:** Migrar API routes que operam dados sensíveis de Client SDK (anônimo no servidor) para Admin SDK (autenticado via service account).
> **Risco:** Médio — mudar o SDK muda como erros são tratados; precisa testar após cada migração.
> **Nota:** O brand-guard continua fazendo validação de propriedade da brand — Admin SDK só bypassa Firestore Rules, não a lógica de autorização.

---

### Por que o Client SDK não funciona no servidor

O Firebase Client SDK em Node.js não carrega contexto de autenticação automaticamente. O `brand-guard.ts` valida o token via Firebase Auth REST API e extrai o `userId`, mas o objeto `db` (Client SDK) continua anônimo do ponto de vista do Firestore — `request.auth` é `null` nas Rules. Isso significa que qualquer operação que depende de `isAuthenticated()` nas rules **falha silenciosamente** ou retorna erro 403.

**O Admin SDK já existe** (`app/src/lib/firebase/admin.ts`) e é usado corretamente em 6 routes (admin, cron, delete-account, export-data). A migração é usar `getAdminFirestore()` em vez de `db` nas routes que passam por `requireBrandAccess`.

---

### TASK 2.1 — Migrar `/api/campaigns/[id]/generate-ads` 🔴 PENDENTE

**Arquivo:** `app/src/app/api/campaigns/[id]/generate-ads/route.ts`
**Coleções:** `campaigns`, `brands/{brandId}/generated_ads`
**Mudança:** Substituir `import { db } from '@/lib/firebase/config'` por `getAdminFirestore()`

**Passos:**
- [ ] Remover import de `db` do config
- [ ] Importar `getAdminFirestore` de `@/lib/firebase/admin`
- [ ] Criar `const db = getAdminFirestore()` dentro do handler
- [ ] Testar geração de ads no ambiente de staging

---

### TASK 2.2 — Migrar `/api/copy/generate` 🔴 PENDENTE

**Arquivo:** `app/src/app/api/copy/generate/route.ts`
**Coleções:** `funnels`, `funnels/{funnelId}/proposals`, `funnels/{funnelId}/copyProposals`, `brands/{brandId}/offers`
**Mudança:** Client SDK → Admin SDK

---

### TASK 2.3 — Migrar `/api/copy/decisions` 🔴 PENDENTE

**Arquivo:** `app/src/app/api/copy/decisions/route.ts`
**Coleções:** `funnels/{funnelId}/copyProposals`, `copyDecisions`, `campaigns`
**Mudança:** Client SDK → Admin SDK
**⚠️ Ver também TASK 3.3:** Fix de userId extraído do body

---

### TASK 2.4 — Migrar `/api/decisions` 🔴 PENDENTE

**Arquivo:** `app/src/app/api/decisions/route.ts`
**Coleções:** `decisions`, `funnels`, `funnels/{funnelId}/proposals`
**Mudança:** Client SDK → Admin SDK

---

### TASK 2.5 — Migrar `/api/cron/social-sync` + Fix de path 🔴 PENDENTE

**Arquivo:** `app/src/app/api/cron/social-sync/route.ts`
**Problemas:**
1. Usa coleção global `integrations` (linha 151) — deveria ser `tenants/{tenantId}/integrations`
2. Usa Client SDK em cron (sem auth de usuário de qualquer forma)

**Passos:**
- [ ] Substituir `collection(db, 'integrations')` por `collection(db, 'tenants', tenantId, 'integrations')`
- [ ] Confirmar como `tenantId` é obtido neste context
- [ ] Migrar para Admin SDK (cron não tem token de usuário)

---

### TASK 2.6 — Migrar `/api/webhooks/ads-metrics` 🔴 PENDENTE

**Arquivo:** `app/src/app/api/webhooks/ads-metrics/route.ts`
**Coleções:** `campaigns`
**Nota:** Route de webhook — sem token de usuário. Precisa Admin SDK obrigatoriamente.
**Mudança:** Client SDK → Admin SDK

---

### TASK 2.7 — Migrar `/api/intelligence/*` routes 🔴 PENDENTE

**Routes:** Todos sob `app/src/app/api/intelligence/`
**Coleções:** `brands/{brandId}/intelligence`, `brands/{brandId}/offers`
**Mapear todos antes de migrar**

---

### TASK 2.8 — Migrar `/api/library` 🔴 PENDENTE

**Arquivo:** `app/src/app/api/library/route.ts`
**Coleções:** `library`, `funnels`

---

### CHECKLIST DA FASE 2

```
CONCLUÍDO (2026-03-12 — Sessão 2):
[x] brand-guard.ts — Admin SDK (PREREQUISITO: afeta todas as routes com requireBrandAccess)
[x] 2.1 campaigns/[id]/generate-ads (+ userId do token em vez do body)
[x] 2.3 copy/decisions (+ TASK 3.3: userId do token)
[x] 2.6 webhooks/ads-metrics

CONCLUÍDO (2026-03-13 — Sessão 3):
[x] 2.2 copy/generate (POST + GET handlers)
[x] 2.4 decisions (GET + POST handlers)
[x] 2.5 cron/social-sync (+ fix path: collectionGroup('integrations'))
[x] 2.7 intelligence/* — 14 routes migradas:
    analyze/text, attribution/sync, autopsy/run, creative/generate-ads,
    journey/heatmap, journey/recent, keywords, ltv/cohorts,
    offer/list, offer/save, predict/score, research/add-to-rag,
    research/chat, spy
[x] 2.8 library (GET + POST handlers)

✅ FASE 2 COMPLETA — TypeScript: 0 erros confirmado

ROTAS RESTANTES COM CLIENT SDK (45 routes — escopo futuro Fase 2.x):
Categorias identificadas: admin/*, assets/*, auth/*, automation/*,
brands/[brandId]/*, content/*, cron/content-*, social-inbox/*, vault/*, etc.
Estas usam Client SDK mas muitas têm acesso público ou sem proteção de brand.
Mapear por prioridade antes de migrar.

PADRÃO DE MIGRAÇÃO (template):
// ANTES:
import { db } from '@/lib/firebase/config';

// DEPOIS:
import { getAdminFirestore } from '@/lib/firebase/admin';
// ... dentro do handler:
const db = getAdminFirestore();
```

---

## FASE 3 — PINECONE E RAG

> **Objetivo:** Corrigir filtros Pinecone desconectados do metadata real nos vetores.
> **Risco:** Médio — RAG está silencioso, não está quebrando; mudanças afetam qualidade de respostas.

---

### TASK 3.1 — Fix de `funnelStage` filter em `rag-helpers-fixed.ts` ✅ FEITO

**Arquivo:** `app/src/lib/ai/rag-helpers-fixed.ts`
**Problema:** Linha 14 aplica `pineconeFilters.funnelStage = { '$eq': filters.funnelStage }` mas nenhum upsert armazena este campo.
**Resultado:** Qualquer query com `funnelStage` retorna `[]` silenciosamente.

**Investigar antes de corrigir:**
- [ ] Quais callers passam `funnelStage` no filters?
- [ ] O campo faz sentido ser armazenado no upsert? Se sim, adicionar em `worker.ts`
- [ ] Se não, remover o filter

**Opção A — Remover filter (mais seguro):**
```typescript
// Remover ou comentar:
// if (filters?.funnelStage) pineconeFilters.funnelStage = { '$eq': filters.funnelStage };
```

**Opção B — Adicionar ao upsert em worker.ts:**
```typescript
metadata: {
  ...existingFields,
  funnelStage: chunk.metadata?.funnelStage || asset.metadata?.funnelStage || '',
}
```

---

### TASK 3.2 — Re-indexar vetores do namespace `knowledge` com metadata completo 🟡 EM ANÁLISE

**Contexto:** Os 2052 vetores existentes no namespace `knowledge` do Pinecone foram indexados antes do fix do `worker.ts`. Eles não têm os campos `counselor`, `docType`, `isApprovedForAI`, `status`.

**Impacto atual:** RAG funciona (filtros foram removidos em sessão anterior), mas filtering por `counselor` ou `docType` ainda retorna vazio.

**Decisão necessária:**
- [ ] Definir se re-indexação é prioridade agora
- [ ] Se sim, rodar o script `app/src/scripts/bulk-ingest.ts` com os arquivos do brain
- [ ] Confirmar que `PINECONE_INDEX_NAME` e `GOOGLE_AI_API_KEY` estão corretos no `.env.local`

**Comando para re-indexar (quando aprovado):**
```bash
cd app && npx ts-node --project tsconfig.scripts.json src/scripts/bulk-ingest.ts
```

---

### TASK 3.3 — Fix de segurança: `userId` extraído do body em `/api/copy/decisions` ✅ FEITO (Sessão 2)

**Arquivo:** `app/src/app/api/copy/decisions/route.ts`
**Problema:** `userId` vem de `body?.userId` (cliente pode forjar), não do token verificado.
**Fix:** Usar o `userId` retornado por `requireBrandAccess()` em vez do body.

```typescript
// ANTES (inseguro):
const { userId } = body;

// DEPOIS (seguro):
const { userId } = await requireBrandAccess(req, brandId); // userId vem do token
```

---

### TASK 3.4 — Adicionar logging quando RAG retorna vazio ✅ FEITO

**Arquivo:** `app/src/lib/ai/rag.ts`
**Objetivo:** Tornar falhas silenciosas visíveis em produção.

```typescript
// Em retrieveChunks(), após a query Pinecone:
if (pineconeResponse.matches?.length === 0) {
  console.warn('[RAG] Zero matches from Pinecone', {
    queryText: queryText.slice(0, 100),
    filters: pineconeFilters,
    namespace: 'knowledge'
  });
}

// No catch final:
} catch (embedError) {
  console.error('[RAG] Embedding generation failed:', embedError);
  // ao invés de apenas console.warn
}
```

---

### CHECKLIST DA FASE 3

```
[x] 3.1 Fix funnelStage filter — removido (Opção A) em rag-helpers-fixed.ts
[~] 3.2 Re-indexação do namespace knowledge — AGUARDA DECISÃO DO USUÁRIO
[x] 3.3 Fix userId de body → token em /api/copy/decisions (Sessão 2)
[x] 3.4 Logging quando RAG retorna vazio — adicionado em rag.ts

✅ FASE 3 COMPLETA (exceto 3.2 que requer decisão estratégica do usuário)
```

---

## FASE 4 — STORAGE (VERIFICAÇÃO PÓS-FIX)

> **Status:** Storage rules foram reescritas em sessão anterior (2026-03-12). Esta fase é de verificação.

---

### TASK 4.1 — Verificar upload de logo em produção ✅ FEITO (rules)

**Correção aplicada:** `app/storage.rules` reescrito com path correto `brands/{userId}/{brandId}/logos/{fileName}`.

**Verificação:**
- [ ] Criar marca nova com logo — confirmar sem erros 403
- [ ] Criar marca sem logo — confirmar fluxo normal

---

### TASK 4.2 — Verificar upload de brand assets (Vault) 🔴 PENDENTE VERIFICAÇÃO

**Rules:** Cobertas por `brands/{brandId}/vault/{allPaths=**}` e `brand-assets/{userId}/{brandId}/{allPaths=**}`.

**Verificação:**
- [ ] Fazer upload de PDF no Vault
- [ ] Fazer upload de imagem no Vault
- [ ] Confirmar processamento (status muda para `ready`)

---

### CHECKLIST DA FASE 4

```
[x] Storage rules reescritas e deployadas
[ ] 4.1 Verificar upload de logo (teste manual)
[ ] 4.2 Verificar upload de Vault assets (teste manual)
```

---

## FASE 5 — TESTES DE REGRESSÃO MANUAL

> **Objetivo:** Confirmar que tudo que foi corrigido funciona em produção antes de declarar encerrado.
> **Quando executar:** Após completar Fases 1, 2 e 3.

---

### Roteiro de Teste

**Bloco A — Onboarding / Brand**
- [ ] Criar brand nova com logo → sem 403
- [ ] Criar brand nova sem logo → sem erros
- [ ] Editar brand existente → sem erros

**Bloco B — Chat e RAG**
- [ ] Abrir chat com um conselheiro → resposta gerada
- [ ] Perguntar algo específico do knowledge base → resposta usa contexto
- [ ] Verificar no console do servidor se logs `[RAG] Zero matches` aparecem

**Bloco C — Spy / Intelligence**
- [ ] Adicionar competidor em Spy → sem 403
- [ ] Visualizar intelligence de uma brand → sem erros
- [ ] Buscar keywords → sem erros

**Bloco D — Funil e Copy**
- [ ] Criar funil → sem erros
- [ ] Gerar copy para um funil → sem erros, proposta salva
- [ ] Aprovar/rejeitar copy (decisão) → sem erros

**Bloco E — Campanhas e Ads**
- [ ] Criar campanha → sem erros
- [ ] Gerar ads para campanha → sem erros, ads aparecem

**Bloco F — Assets / Vault**
- [ ] Upload de PDF → processamento completa (status `ready`)
- [ ] Chat com brand chunks → resposta referencia o conteúdo do asset

---

## ORDEM DE EXECUÇÃO RECOMENDADA

```
SEMANA 1:
  [x] Fase 1 (parcial) — Rules deployadas
  [ ] Fase 1 (completo) — Tasks 1.5 a 1.10
  [ ] Fase 4 — Verificação de Storage (testes manuais)

SEMANA 2:
  [ ] Fase 2 — Admin SDK migration (começar pelos mais críticos: 2.1, 2.2, 2.6)
  [ ] Fase 3.1 e 3.3 — Fixes pontuais de Pinecone e segurança

SEMANA 3:
  [ ] Fase 2 (continuar) — Routes restantes
  [ ] Fase 3.2 — Decisão sobre re-indexação
  [ ] Fase 3.4 — Logging
  [ ] Fase 5 — Testes de regressão completos
```

---

## REFERÊNCIA RÁPIDA — ARQUIVOS CHAVE

| Arquivo | Papel |
|---------|-------|
| `app/firestore.rules` | Security rules do Firestore — editar aqui, deployer com `firebase deploy --only firestore:rules` |
| `app/storage.rules` | Security rules do Storage |
| `app/src/lib/firebase/admin.ts` | Admin SDK — `getAdminFirestore()` para server-side |
| `app/src/lib/firebase/config.ts` | Client SDK — usar apenas no browser |
| `app/src/lib/auth/brand-guard.ts` | Validação de token + autorização de brand |
| `app/src/lib/ai/rag.ts` | Pipeline RAG — `retrieveChunks`, `retrieveBrandChunks` |
| `app/src/lib/ai/rag-helpers-fixed.ts` | Helper Pinecone para brand chunks |
| `app/src/lib/ai/worker.ts` | Processamento de assets → chunks → Pinecone |
| `app/src/scripts/bulk-ingest.ts` | Script de re-indexação do brain no Pinecone |

---

## LOG DE ALTERAÇÕES

| Data | Task | Descrição | Deployado |
|------|------|-----------|-----------|
| 2026-03-12 | 1.1 | Rule `campaigns` adicionada | ✅ |
| 2026-03-12 | 1.2 | Rule `copyDecisions` adicionada | ✅ |
| 2026-03-12 | 1.3 | Rule `funnels/copyProposals` adicionada | ✅ |
| 2026-03-12 | 1.4 | Rule `brands/generated_ads` adicionada | ✅ |
| 2026-03-12 | — | Rule `brands/competitors` adicionada | ✅ |
| 2026-03-12 | — | Rule `brands/intelligence` adicionada | ✅ |
| 2026-03-12 | — | Rule `brands/keywords` adicionada | ✅ |
| 2026-03-12 | — | Rule `query_cache` adicionada | ✅ |
| 2026-03-12 | — | `storage.rules` reescrito (logo path fix) | ✅ |
| 2026-03-12 | — | `rag.ts` — filtros Pinecone removidos (knowledge namespace) | ✅ |
| 2026-03-12 | — | `worker.ts` — metadata `isApprovedForAI`, `status`, `counselor`, `docType` adicionados | ✅ |
