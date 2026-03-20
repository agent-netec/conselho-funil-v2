# Plano: counselor_knowledge RAG — Implementação Completa

**Status:** Aguardando aprovação
**Data:** 2026-03-14
**Estimativa:** ~300 linhas de código novo, 2 PRs, zero regressões

---

## Contexto

Os 24 identity cards dos conselheiros vivem em `app/src/data/identity-cards/*.md` e são injetados **estaticamente** no system prompt a cada mensagem via `buildChatBrainContext()`. O objetivo deste plano é indexar esses mesmos cards no Pinecone para que, **em paralelo**, o sistema busque semanticamente os trechos mais relevantes para cada pergunta específica do usuário.

Esta é uma camada **aditiva** — não substitui a injeção estática, complementa com precisão semântica.

---

## Diagnóstico (Auditoria Realizada)

| Componente | Status Atual |
|-----------|-------------|
| Identity Cards (`.md`) | ✅ Funcionando — injetados no system prompt |
| `counselor_knowledge` no Pinecone | ❌ Não existe — nunca foi populado |
| `ContextAssembler` | ❌ Código morto — nunca chamado, tem bug de template literals |
| Pipeline de ingestão counselor → Pinecone | ❌ Inexistente |
| Namespace `universal` no Pinecone | ❌ Não existe |

---

## Sequência de Deploy

```
[ FASE 1 + FASE 4 ] → PR 1 → Deploy
         ↓
POST /api/admin/ingest-counselors  (rodar em produção)
         ↓
GET  /api/admin/check-counselors   (verificar healthy: true)
         ↓
[ FASE 2 + FASE 3 ] → PR 2 → Deploy
         ↓
Teste no chat (modo funil, pergunta específica)
```

---

## FASE 1 — Pipeline de Ingestão

**Complexidade:** Média | **Arquivos novos:** 3 | **Modificações:** 0

### [ ] Tarefa 1.1 — Função de chunking dos identity cards

**Arquivo:** `app/src/lib/ai/counselor-ingestion.ts` (novo)

O que faz:
- Lê todos os 24 cards via `getAllBrains()` (já existe em `loader.ts`)
- Extrai apenas `rawNarrative` (texto limpo — sem os JSONs de frameworks de avaliação)
- Divide em chunks: `size = 3.000 chars`, `overlap = 400` → ~2–4 chunks por card (~72 vetores total)
- Gera embeddings em batch via `generateEmbeddingsBatch()` (já existe)
- Faz upsert no Pinecone namespace `universal`

Metadata de cada vetor:
```json
{
  "dataType": "counselor_knowledge",
  "counselorId": "gary_halbert",
  "counselorName": "Gary Halbert",
  "domain": "copy",
  "scopeLevel": "universal",
  "chunkIndex": 0,
  "totalChunks": 3,
  "isApprovedForAI": true,
  "version": "2026.v1",
  "sourceFile": "gary_halbert.md"
}
```

ID determinístico: `counselor__gary_halbert__chunk_0` → re-ingestão idempotente (upsert sobrescreve).

**Retorno:** `{ processed: number, upserted: number, errors: string[] }`

**Critério de aceitação:**
- Rodar duas vezes não duplica vetores
- Sem dependência de Client SDK — apenas Admin SDK ou chamadas stateless

---

### [ ] Tarefa 1.2 — Rota admin de ingestão

**Arquivo:** `app/src/app/api/admin/ingest-counselors/route.ts` (novo)

```
POST /api/admin/ingest-counselors
Headers: Authorization: Bearer <admin-token>
Body: { dryRun?: boolean, counselorIds?: string[] }
```

- `dryRun: true` → chunking + embedding mas **sem** upsert no Pinecone (teste seguro)
- `counselorIds: ['gary_halbert']` → re-ingere apenas 1 conselheiro
- Auth via `verifyAdminRole()` — mesmo padrão das outras rotas admin
- `export const runtime = 'nodejs'` — obrigatório pois `loader.ts` usa `fs`

**Resposta:** `{ upserted, skipped, errors, dryRun }`

**Critério de aceitação:**
- 401/403 sem token admin
- `dryRun: true` retorna stats sem tocar Pinecone
- Filter por `counselorIds` funciona

**Dependência:** Tarefa 1.1

---

### [ ] Tarefa 1.3 — Rota de verificação

**Arquivo:** `app/src/app/api/admin/check-counselors/route.ts` (novo)

```
GET /api/admin/check-counselors
```

Verifica o namespace `universal` no Pinecone:
- Total de vetores
- Contagem por conselheiro (spot-query por `counselorId`)
- Retorna `healthy: false` com `missingCounselors[]` se algum dos 24 tiver 0 vetores

**Resposta:**
```json
{
  "namespace": "universal",
  "totalVectors": 72,
  "byCounselor": { "gary_halbert": 3, "russell_brunson": 3, "..." : "..." },
  "healthy": true,
  "missingCounselors": []
}
```

**Critério de aceitação:**
- `healthy: false` se ingestão incompleta
- Funciona mesmo com namespace vazio (retorna `totalVectors: 0`, `healthy: false`)

**Dependência:** Tarefa 1.2 executada pelo menos uma vez

---

## FASE 2 — Função de Recuperação RAG

**Complexidade:** Simples | **Arquivos novos:** 0 | **Modificações:** `rag.ts` (+2 funções)

### [ ] Tarefa 2.1 — `retrieveCounselorChunks()` em `rag.ts`

Função nova appended ao final de `rag.ts`. Não altera nenhuma função existente.

```typescript
export async function retrieveCounselorChunks(
  counselorIds: string[],
  queryText: string,
  topK: number = 5
): Promise<RetrievedChunk[]>
```

Lógica interna:
1. Short-circuit: `if (counselorIds.length === 0) return []`
2. `generateEmbedding(queryText)` (com cache Firestore)
3. Pinecone query no namespace `universal` com filtro: `{ dataType: { $eq: 'counselor_knowledge' }, counselorId: { $in: counselorIds } }`
4. Over-fetch `topK × 3` → re-rank via Cohere (`rerankDocuments` — já existe)
5. Retorna array vazio (não erro) se namespace não tem vetores

**Critério de aceitação:**
- `counselorIds = []` → retorna `[]` sem chamar Pinecone
- Namespace vazio → retorna `[]` sem throw
- Server-side only (guard `typeof window === 'undefined'`)

---

### [ ] Tarefa 2.2 — `formatCounselorContextForLLM()` em `rag.ts`

Formata os chunks recuperados para injeção no prompt:

```
## CONHECIMENTO SEMÂNTICO DOS ESPECIALISTAS (Trechos Relevantes para Esta Pergunta)

### Gary Halbert
> [trecho relevante — max 400 chars]

### Eugene Schwartz
> [trecho relevante]
```

- Agrupa por `counselorId` (sem headers repetidos)
- Retorna `''` se `chunks.length === 0` → zero impacto no prompt
- Trunca cada chunk em 400 chars (mesmo padrão de `formatContextForLLM`)

---

## FASE 3 — Integração no Chat Route

**Complexidade:** Simples | **Arquivos novos:** 0 | **Modificações:** `chat/route.ts` (+~20 linhas)

### [ ] Tarefa 3.1 — Adicionar como 7ª promise paralela

Em `handlePOST`, determina quais conselheiros estão ativos baseado no `effectiveMode`:

| Modo | Conselheiros |
|------|-------------|
| `copy` | 9 IDs do copy council |
| `social` | 4 IDs do social council |
| `ads` | 4 IDs do ads council |
| `design` | 1 ID do design director |
| `funnel`, `general`, `funnel_*` | 6 IDs do funnel council |
| `party` | `selectedAgents` (dinâmico do request) |

Adiciona ao `Promise.all` existente como 7ª entrada — sem alterar posição das 6 existentes.

**Critério de aceitação:**
- Modo `party` com `selectedAgents = []` → `counselorChunks = []` sem erro
- Namespace não populado → `counselorChunks = []` sem erro, chat continua normalmente

---

### [ ] Tarefa 3.2 — Injetar no contexto

Após o `formatContextForLLM(chunks)` existente, prepend o contexto dos conselheiros:

```typescript
const counselorContext = formatCounselorContextForLLM(counselorChunks);
if (counselorContext) {
  context = `${counselorContext}\n\n---\n\n${context}`;
}
```

O truncamento existente (120k chars) já protege o budget automaticamente.
Log de warning se `counselorContext.length > 8.000` para tuning de `topK`.

---

### [ ] Tarefa 3.3 — Adicionar no array `sources`

```typescript
...counselorChunks.map(c => ({
  file: c.source.file,
  section: 'Identity Card',
  content: c.content.slice(0, 400) + '...',
  counselor: (c.metadata as any).counselorId,
  similarity: c.similarity,
  rerankScore: c.rerankScore,
  type: 'counselor_knowledge',
}))
```

Sem mudança de UI necessária neste plano — entries adicionados ao final do `sources[]`.

---

## FASE 4 — Correção de Bug (Independente das demais)

**Complexidade:** Simples | **Arquivos novos:** 0 | **Modificações:** `context-assembler.ts`

### [ ] Tarefa 4.1 — Corrigir template literals escapados

**Arquivo:** `app/src/lib/ai/context-assembler.ts`

**Bug:** Template literals com `\$` nunca interpolam — viram strings literais:
```typescript
// Errado (atual):
namespace: `brand_\${brandId}`   // → "brand_${brandId}" (literal)

// Correto:
namespace: `brand_${brandId}`    // → "brand_abc123" (interpolado)
```

Linhas afetadas: 133, 138, 144, 148, 209, 309 (e demais ocorrências no arquivo).

**Fix:** remover `\` antes de `$` em todos os template literals do arquivo. Zero alteração de lógica.

`ContextAssembler` é código morto hoje — não entra em produção com este fix, mas fica correto para uso futuro.

**Critério de aceitação:**
- `grep '\\\${' app/src/lib/ai/context-assembler.ts` → zero resultados
- TypeScript sem erros no arquivo

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|--------------|-----------|
| Namespace `universal` não existe | Certo | Upsert cria automaticamente na primeira escrita |
| Counselor RAG duplicar o system prompt | Médio | Header distinto: "Trechos Relevantes" vs "Identity Cards completos" |
| Budget de tokens estourar | Baixo | Truncamento 120k chars já existente cobre |
| Rerank Cohere falhar | Baixo | Fallback já existe: retorna por ordem de similaridade |
| `embeddings.ts` usa Client SDK server-side | Baixo | Já funciona assim em `retrieveChunks()` — mesmo padrão |

---

## Resumo de Arquivos

| Fase | Novos | Modificados |
|------|-------|-------------|
| 1 — Ingestão | `counselor-ingestion.ts`, `ingest-counselors/route.ts`, `check-counselors/route.ts` | — |
| 2 — Retrieval | — | `rag.ts` (+2 funções no final) |
| 3 — Chat | — | `chat/route.ts` (+~20 linhas) |
| 4 — Bug fix | — | `context-assembler.ts` (remoção de `\`) |

**Total:** ~300 linhas | 3 arquivos novos | 2 arquivos modificados | 0 regressões

---

## Checklist de Aprovação

- [ ] Fase 1 aprovada
- [ ] Fase 2 aprovada
- [ ] Fase 3 aprovada
- [ ] Fase 4 aprovada
- [ ] Plano aprovado para execução
