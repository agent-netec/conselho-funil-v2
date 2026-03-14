# Plano de Migração: Client SDK → Admin SDK nas API Routes

**Status:** AGUARDANDO APROVAÇÃO — não executar até revisão do usuário
**Data de criação:** 2026-03-14
**Motivação:** Todas as API routes (Vercel Functions) que chamam o Client SDK do Firebase falham com `Missing or insufficient permissions` porque não há usuário autenticado no contexto do servidor. O Admin SDK ignora as Security Rules e é o padrão correto para uso server-side.

---

## Contexto e Regra de Ouro

```
CLIENT SDK  →  sujeito às Firestore Security Rules  →  só em componentes React (browser)
ADMIN SDK   →  bypassa Security Rules               →  obrigatório em API routes (servidor)
```

A raiz de todos os erros vistos até agora foi violar essa distinção.

---

## Estado Atual

### Já existe (Admin SDK pronto, não precisa criar)

**`lib/firebase/firestore-server.ts`**
- `getConversationAdmin`
- `addMessageAdmin`
- `updateConversationAdmin`
- `getBrandAdmin`
- `getUserCreditsAdmin`
- `getUserAdmin`
- `getUserStripeCustomerIdAdmin`
- `setUserStripeCustomerIdAdmin`

**`lib/firebase/assets-server.ts`**
- `getBrandAssetsAdmin`
- `fetchBrandAssetAdmin`
- `updateBrandAssetAdmin`
- `saveAssetChunks`
- `processAssetText`

### O problema: funções Client SDK chamadas por API routes

| Função (Client SDK) | Arquivo fonte | Chamada por |
|---|---|---|
| `updateUserUsage` | `firestore.ts` | chat, copy/generate, design/generate, campaigns/generate-ads, intelligence/creative/generate-ads |
| `getBrand` | `firestore.ts` / `brands.ts` | funnels/generate, ai/analyze-visual |
| `getFunnel` | `firestore.ts` | funnels/generate, chat |
| `getUserFunnels` | `firestore.ts` | chat |
| `updateFunnel` | `firestore.ts` | funnels/generate |
| `createProposal` | `firestore.ts` | funnels/generate |
| `getFunnelProposals` | `firestore.ts` | chat |
| `getCampaign` | `firestore.ts` | chat |
| `updateUserTier` | `firestore.ts` | payments/webhook |
| `getExpiredTrialUsers` | `firestore.ts` | cron/trial-check |
| `downgradeUsersToFree` | `firestore.ts` | cron/trial-check |
| `getAllBrandIds` | `firestore.ts` | cron/automation-evaluate |
| `getAllBrandKeywordsForPrompt` | `intelligence.ts` | chat, copy/generate, campaigns/generate-ads, intelligence/creative/generate-ads |
| `createCaseStudy` | `case-studies.ts` | intelligence/case-studies |
| `getBrandCaseStudies` | `case-studies.ts` | intelligence/case-studies |
| `deleteCaseStudy` | `case-studies.ts` | intelligence/case-studies |

---

## Plano por Fases

As fases foram ordenadas por **impacto × risco**:
- Fases 1-2: ampliar arquivos `-server.ts` existentes (zero risco de quebra)
- Fase 3: criar novo `intelligence-server.ts`
- Fase 4: criar novo `case-studies-server.ts`
- Fase 5: atualizar as API routes (o único ponto que pode quebrar — cada rota isolada)
- Fase 6: limpeza de queries client-side

---

## Fase 1 — Ampliar `firestore-server.ts`

**Objetivo:** Adicionar ao `firestore-server.ts` as funções Admin SDK que hoje só existem na versão Client SDK do `firestore.ts`.

**Novas funções a criar:**

### 1.1 `updateUserUsageAdmin(userId, delta)`
- Substitui: `updateUserUsage` (usa `updateDoc` + `increment` do Client SDK)
- Chamada por: 5 rotas de geração de IA
- Implementação Admin: `db.collection('users').doc(userId).update({ credits: FieldValue.increment(delta) })`

### 1.2 `getFunnelAdmin(funnelId)`
- Substitui: `getFunnel` (usa `getDoc` do Client SDK)
- Chamada por: funnels/generate, chat
- Implementação Admin: `db.collection('funnels').doc(funnelId).get()`

### 1.3 `getUserFunnelsAdmin(userId)`
- Substitui: `getUserFunnels` (usa `getDocs + query + where` do Client SDK)
- Chamada por: chat
- Implementação Admin: `db.collection('funnels').where('userId', '==', userId).orderBy('createdAt', 'desc').get()`

### 1.4 `updateFunnelAdmin(funnelId, data)`
- Substitui: `updateFunnel` (usa `updateDoc` com retry do Client SDK)
- Chamada por: funnels/generate
- Implementação Admin: `db.collection('funnels').doc(funnelId).update(data)`

### 1.5 `createProposalAdmin(funnelId, data)`
- Substitui: `createProposal` (usa `addDoc` em subcoleção do Client SDK)
- Chamada por: funnels/generate
- Implementação Admin: `db.collection('funnels').doc(funnelId).collection('proposals').add(data)`

### 1.6 `getFunnelProposalsAdmin(funnelId)`
- Substitui: `getFunnelProposals` (usa `getDocs + orderBy` do Client SDK)
- Chamada por: chat
- Implementação Admin: `db.collection('funnels').doc(funnelId).collection('proposals').orderBy('version', 'desc').get()`

### 1.7 `getCampaignAdmin(campaignId)`
- Substitui: `getCampaign` (usa `getDoc` do Client SDK)
- Chamada por: chat
- Implementação Admin: `db.collection('campaigns').doc(campaignId).get()`

### 1.8 `updateUserTierAdmin(userId, tier, data)`
- Substitui: `updateUserTier` (usa `updateDoc` do Client SDK)
- Chamada por: payments/webhook
- Implementação Admin: `db.collection('users').doc(userId).update({ tier, ...data })`

### 1.9 `getExpiredTrialUsersAdmin()`
- Substitui: `getExpiredTrialUsers` (usa `getDocs + query` do Client SDK)
- Chamada por: cron/trial-check
- Implementação Admin: `db.collection('users').where('tier', '==', 'trial').where('trialEndsAt', '<=', now).get()`

### 1.10 `downgradeUsersToFreeAdmin(userIds)`
- Substitui: `downgradeUsersToFree` (usa `updateDoc` em loop do Client SDK)
- Chamada por: cron/trial-check
- Implementação Admin: batch update em `users` collection

### 1.11 `getAllBrandIdsAdmin()`
- Substitui: `getAllBrandIds` (usa `getDocs(collection(db, 'brands'))` — sem filtro)
- Chamada por: cron/automation-evaluate
- Implementação Admin: `db.collection('brands').select('id').get()` (projeção mínima)

**Arquivos modificados nesta fase:**
- `app/src/lib/firebase/firestore-server.ts` — apenas adições, nenhuma remoção

**Risco:** ZERO — só adiciona funções, nenhuma rota é tocada ainda.

---

## Fase 2 — Atualizar `firestore.ts`: marcar como Client-Only

**Objetivo:** Adicionar comentário JSDoc e aviso em `firestore.ts` indicando que o arquivo é client-only, para evitar importações acidentais por novas API routes.

**O que fazer:**
- Adicionar no topo do arquivo: `// @client-only — NÃO importar em API routes. Use firestore-server.ts`
- NÃO remover nenhuma função (componentes React ainda as usam)

**Arquivos modificados nesta fase:**
- `app/src/lib/firebase/firestore.ts` — comentário no topo, sem mudanças funcionais

**Risco:** ZERO — sem mudanças funcionais.

---

## Fase 3 — Criar `intelligence-server.ts`

**Objetivo:** Versão Admin SDK das funções de `intelligence.ts` usadas por API routes.

**Novas funções a criar:**

### 3.1 `getAllBrandKeywordsForPromptAdmin(brandId, limit?)`
- Substitui: `getAllBrandKeywordsForPrompt` (usa Client SDK com múltiplas queries)
- Chamada por: chat, copy/generate, campaigns/generate-ads, intelligence/creative/generate-ads
- Implementação Admin: mesmo algoritmo, mas usando `getAdminFirestore()` em vez de `db` (Client SDK)
- Coleta de: `brands/{brandId}/keywords` e `brands/{brandId}/intelligence` (tipo keywords)
- Formata para string de prompt (mesma função `formatKeywordsForPrompt` pode ser reutilizada, pois é pura)

**Arquivo novo:**
- `app/src/lib/firebase/intelligence-server.ts`

**Risco:** BAIXO — arquivo novo, nenhuma rota tocada ainda.

---

## Fase 4 — Criar `case-studies-server.ts`

**Objetivo:** Versão Admin SDK das funções de `case-studies.ts` usadas pela route de case studies.

**Novas funções a criar:**

### 4.1 `createCaseStudyAdmin(data)`
- Substitui: `createCaseStudy` (usa `addDoc` do Client SDK)
- Implementação Admin: `db.collection('case_studies').add({ ...data, createdAt: FieldValue.serverTimestamp() })`

### 4.2 `getBrandCaseStudiesAdmin(brandId, limit?)`
- Substitui: `getBrandCaseStudies` (usa `getDocs + query + orderBy` do Client SDK)
- Implementação Admin: `db.collection('case_studies').where('brandId', '==', brandId).orderBy('createdAt', 'desc').limit(limit || 20).get()`

### 4.3 `deleteCaseStudyAdmin(caseStudyId)`
- Substitui: `deleteCaseStudy` (usa `deleteDoc` do Client SDK)
- Implementação Admin: `db.collection('case_studies').doc(caseStudyId).delete()`

**Arquivo novo:**
- `app/src/lib/firebase/case-studies-server.ts`

**Risco:** BAIXO — arquivo novo, nenhuma rota tocada ainda.

---

## Fase 5 — Atualizar as API Routes

**Esta é a fase que muda comportamento real. Cada rota é uma mudança isolada.**

### 5.1 `app/api/funnels/generate/route.ts`

**Trocar:**
```typescript
// ANTES
import { updateFunnel, createProposal, getFunnel } from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';

// DEPOIS
import { updateFunnelAdmin, createProposalAdmin, getFunnelAdmin, getBrandAdmin } from '@/lib/firebase/firestore-server';
```

**Auth guard atual:** `requireUser` — considerar trocar por `requireBrandAccess` para obter `userId` e `brandId` validados.

---

### 5.2 `app/api/chat/route.ts`

**Trocar:**
```typescript
// ANTES
import { getFunnel, getFunnelProposals, updateUserUsage, getUserFunnels, getCampaign } from '@/lib/firebase/firestore';
import { getBrandKeywords } from '@/lib/firebase/intelligence';

// DEPOIS
import { getFunnelAdmin, getFunnelProposalsAdmin, updateUserUsageAdmin, getUserFunnelsAdmin, getCampaignAdmin } from '@/lib/firebase/firestore-server';
import { getAllBrandKeywordsForPromptAdmin } from '@/lib/firebase/intelligence-server';
```

**Obs:** O chat já usa `getConversationAdmin`, `addMessageAdmin`, `getBrandAdmin` corretamente — esta fase só completa o que falta.

---

### 5.3 `app/api/copy/generate/route.ts`

**Trocar:**
```typescript
// ANTES
import { updateUserUsage } from '@/lib/firebase/firestore';
import { getBrand } from '@/lib/firebase/brands';
import { getAllBrandKeywordsForPrompt } from '@/lib/firebase/intelligence';

// DEPOIS
import { updateUserUsageAdmin, getBrandAdmin } from '@/lib/firebase/firestore-server';
import { getAllBrandKeywordsForPromptAdmin } from '@/lib/firebase/intelligence-server';
```

---

### 5.4 `app/api/design/generate/route.ts`

**Trocar:**
```typescript
// ANTES
import { getBrand, updateUserUsage } from '@/lib/firebase/firestore';

// DEPOIS
import { getBrandAdmin, updateUserUsageAdmin } from '@/lib/firebase/firestore-server';
```

---

### 5.5 `app/api/campaigns/[id]/generate-ads/route.ts`

**Trocar:**
```typescript
// ANTES
import { updateUserUsage } from '@/lib/firebase/firestore';
import { getAllBrandKeywordsForPrompt } from '@/lib/firebase/intelligence';

// DEPOIS
import { updateUserUsageAdmin } from '@/lib/firebase/firestore-server';
import { getAllBrandKeywordsForPromptAdmin } from '@/lib/firebase/intelligence-server';
```

---

### 5.6 `app/api/intelligence/creative/generate-ads/route.ts`

**Trocar:**
```typescript
// ANTES
import { updateUserUsage } from '@/lib/firebase/firestore';
import { getAllBrandKeywordsForPrompt } from '@/lib/firebase/intelligence';

// DEPOIS
import { updateUserUsageAdmin } from '@/lib/firebase/firestore-server';
import { getAllBrandKeywordsForPromptAdmin } from '@/lib/firebase/intelligence-server';
```

---

### 5.7 `app/api/ai/analyze-visual/route.ts`

**Trocar:**
```typescript
// ANTES
import { getBrand, updateUserUsage } from '@/lib/firebase/firestore';

// DEPOIS
import { getBrandAdmin, updateUserUsageAdmin } from '@/lib/firebase/firestore-server';
```

---

### 5.8 `app/api/intelligence/case-studies/route.ts`

**Trocar:**
```typescript
// ANTES
import { createCaseStudy, getBrandCaseStudies, deleteCaseStudy } from '@/lib/firebase/case-studies';

// DEPOIS
import { createCaseStudyAdmin, getBrandCaseStudiesAdmin, deleteCaseStudyAdmin } from '@/lib/firebase/case-studies-server';
```

---

### 5.9 `app/api/payments/webhook/route.ts`

**Trocar:**
```typescript
// ANTES
import { updateUserTier, getUser } from '@/lib/firebase/firestore';

// DEPOIS
import { updateUserTierAdmin, getUserAdmin } from '@/lib/firebase/firestore-server';
```

**Obs:** Webhook já usa `getAdminFirestore()` diretamente para checagem de idempotência — esta fase só substitui as 2 funções restantes.

---

### 5.10 `app/api/cron/trial-check/route.ts`

**Trocar:**
```typescript
// ANTES
import { getExpiredTrialUsers, downgradeUsersToFree, getUser } from '@/lib/firebase/firestore';

// DEPOIS
import { getExpiredTrialUsersAdmin, downgradeUsersToFreeAdmin, getUserAdmin } from '@/lib/firebase/firestore-server';
```

---

### 5.11 `app/api/cron/automation-evaluate/route.ts`

**Trocar:**
```typescript
// ANTES
import { getAllBrandIds } from '@/lib/firebase/firestore';

// DEPOIS
import { getAllBrandIdsAdmin } from '@/lib/firebase/firestore-server';
```

---

## Fase 0 (URGENTE) — Índices Compostos do Firestore

**Problema identificado em 2026-03-14:**
Quando adicionamos `where('userId', '==', userId)` à query de `brand_assets` (necessário para satisfazer a Security Rule), o Firestore passou a exigir um índice composto que não existia. Isso causou o erro:
```
FirebaseError: The query requires an index. You can create it here: https://console.firebase.google.com/...
```

Como consequência:
- Assets da marca não carregam na tela `/brands/[id]/assets`
- O documento uploadado "some" (na verdade está no Firestore, mas a query falha antes de retorná-lo)

**Índices adicionados em `firestore.indexes.json`:**

| Collection | Campos | Uso |
|---|---|---|
| `brand_assets` | `brandId ASC, userId ASC, createdAt DESC` | Query do client SDK em `getBrandAssets(brandId, userId)` |
| `brand_assets` | `brandId ASC, createdAt DESC` | Query do Admin SDK em `getBrandAssetsAdmin(brandId)` |

**Para ativar os índices no Firebase (escolha uma opção):**

**Opção A — Link direto (mais rápido, sem CLI):**
Acesse este link no navegador (já cria o índice `brandId + userId + createdAt`):
```
https://console.firebase.google.com/v1/r/project/conselho-de-funil/firestore/indexes?create_composite=ClZwcm9qZWN0cy9jb25zZWxoby1kZS1mdW5pbC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYnJhbmRfYXNzZXRzL2luZGV4ZXMvXxABGgsKB2JyYW5kSWQQARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC
```
Depois crie o segundo índice (`brandId + createdAt`) manualmente no Firebase Console → Firestore → Indexes → Add Index.

**Opção B — Firebase CLI (deploya todos os índices do arquivo):**
```bash
cd app
npx firebase deploy --only firestore:indexes
```
Isso cria todos os índices declarados em `firestore.indexes.json` de uma vez.

**Tempo de criação:** 2-5 minutos após criação. O Firestore precisa indexar os dados existentes.

**Status:** Índice adicionado ao `firestore.indexes.json` — aguardando deploy no Firebase.

---

## Lição aprendida — Índices e queries compostas

Sempre que adicionar um `where()` extra a uma query existente (ex: para satisfazer Security Rules), verificar se o novo conjunto de filtros + orderBy já tem índice declarado em `firestore.indexes.json`. Se não tiver, o Firestore retorna erro em produção mas funciona no emulador (que cria índices automaticamente).

**Regra:** `where(A) + where(B) + orderBy(C)` sempre exige índice composto `(A, B, C)`.

---

## Fase 6 — Corrigir Queries Client-Side com Filtro userId

**Objetivo:** Queries no browser que listam coleções sem `where('userId', '==', uid)` falham pela regra `allow list: if isAuthenticated() && resource.data.userId == request.auth.uid`.

**Investigar e corrigir:**

- `getUserBrands()` em `brands.ts` — verifica se inclui `where('userId', '==', userId)` ✓ (parece OK pelo `use-brands.ts`)
- `getUserFunnels()` em `firestore.ts` — verifica se o hook client-side passa userId ✓
- Qualquer outro hook que faça `getDocs(query(collection(...), where('brandId', '==', brandId)))` sem `where('userId')` — o `getBrandAssets` já foi corrigido

**Ação:** Fazer varredura de todos os hooks em `lib/hooks/` que usam `getDocs` com `where('brandId')` sem `where('userId')`.

---

## Ordem de Execução Recomendada

```
Fase 1  →  Fase 2  →  Fase 3  →  Fase 4  →  Fase 5 (rota por rota)  →  Fase 6
  ↓           ↓           ↓           ↓              ↓                       ↓
build ok   cosmético   build ok   build ok    build ok após cada rota    fix queries
```

Entre cada fase: `npm run build` para confirmar zero erros antes de prosseguir.

---

## O que NÃO muda neste plano

- Nenhuma Security Rule do Firestore é alterada
- Nenhuma função Client SDK é removida de `firestore.ts` (componentes React ainda as usam)
- Nenhuma API de resposta é alterada (os consumers não percebem a diferença)
- Nenhuma lógica de negócio é alterada — apenas a camada de acesso ao banco

---

## Critério de Conclusão

O plano está completo quando:
1. Nenhuma API route importa funções de `firestore.ts`, `brands.ts`, `intelligence.ts`, `case-studies.ts` diretamente
2. `firestore-server.ts`, `intelligence-server.ts`, `case-studies-server.ts` são as únicas fontes de dados para API routes
3. `npm run build` passa sem erros
4. Deploy no Vercel sem erros de `Missing or insufficient permissions` nos logs

---

## Estimativa de Escopo

| Fase | Arquivos modificados | Linhas novas | Risco |
|------|---------------------|--------------|-------|
| 1 | 1 (firestore-server.ts) | ~120 | Zero |
| 2 | 1 (firestore.ts) | ~3 (comentário) | Zero |
| 3 | 1 (intelligence-server.ts — novo) | ~60 | Baixo |
| 4 | 1 (case-studies-server.ts — novo) | ~40 | Baixo |
| 5 | 11 (API routes) | ~22 (trocas de import) | Médio (isolado por rota) |
| 6 | 2-4 (hooks) | ~10 | Baixo |

**Total:** ~16 arquivos, ~255 linhas, zero mudança de comportamento para o usuário final.
