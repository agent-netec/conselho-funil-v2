# Tech Spec: Reranking & Dynamic Filters (Sprint 1.2)

**Status:** Draft 📐  
**Responsável:** Athos (Arch)  
**Data:** 11/01/2026

## 1. Arquitetura do Pipeline RAG V2

O fluxo atual é:
`Query -> Embedding -> Vector Search (Firestore) -> Sort by Similarity -> Context`

O novo fluxo será:
`Query -> Embedding -> Vector Search (Firestore - Top 50) -> Reranking (Cohere) -> Final Top 5 -> Context`

### 1.1. Integração Cohere Rerank
- **Modelo**: `rerank-multilingual-v3.0` (suporte a PT-BR e EN).
- **Provedor**: API externa da Cohere.
- **Helper**: `app/src/lib/ai/rerank.ts`.

## 2. Estratégia de Filtros Dinâmicos

### 2.1. Filtros de Metadados (Firestore)
Implementar suporte a filtros compostos no `retrieveChunks` e `retrieveBrandChunks`:
- `metadata.status == 'approved'`
- `metadata.isApprovedForAI == true`
- `metadata.category` (opcional, extraído da query via LLM ou heurística).

### 2.2. Separação de Contexto
- **Global Knowledge**: Consulta na coleção `knowledge`.
- **Brand Context**: Consulta na sub-coleção `chunks` dos assets aprovados da marca.
- **Merged Context**: Unificar ambos e passar pelo Reranker.

## 3. Contratos de Dados

### 3.1. Atualização do `RetrievedChunk`
```typescript
interface RetrievedChunk {
  id: string;
  content: string;
  metadata: any;
  similarity: number; // Score vetorial original
  rerankScore?: number; // Score retornado pelo Cohere
  rank: number;
}
```

## 4. Plano de Implementação Técnico
1.  **Instalação**: Adicionar `cohere-ai` (ou usar `fetch` direto para manter o projeto leve).
2.  **Rerank Helper**: Criar `lib/ai/rerank.ts` com tratamento de erro e timeout.
3.  **Refatoração Rag**: Alterar `lib/ai/rag.ts` para suportar o novo pipeline.
4.  **UI Integration**: Passar os metadados das fontes no payload da API de Chat.

## 5. Riscos e Mitigações
- **Dependência Externa**: Cohere fora do ar. *Mitigação*: Fallback automático para o ranking vetorial original (Score de Cosseno).
- **Limites de API**: Rate limit da Cohere. *Mitigação*: Cache de reranking para queries idênticas (Zustand ou Firestore Cache).
