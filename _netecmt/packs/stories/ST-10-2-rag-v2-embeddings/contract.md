# 📜 Contrato Técnico: RAG v2 (ST-10.2)

## 🔄 Mudanças em `lib/ai/rag.ts`

### 1. Desativação do Hash Local
A função `generateLocalEmbedding` deve ser marcada como `@deprecated` ou removida.

### 2. Integração Semântica
O método `retrieveChunks` deve agora:
1. Chamar `generateEmbedding(queryText)` em `lib/ai/embeddings.ts`.
2. Realizar a busca vetorial no Firestore (coleção `knowledge`) comparando o embedding gerado com o campo `embedding` do documento.
3. Utilizar `cosineSimilarity` para o ranking inicial.

### 3. Reranking Obrigatório
Todo resultado da busca inicial (Top 50) deve passar pela função `rerankDocuments` (Cohere) para garantir a precisão de agência sênior.

## 🔄 Mudanças em `lib/ai/embeddings.ts`
- Garantir que `text-embedding-004` seja o modelo padrão.
- Manter o cache no Firestore para evitar custos excessivos de API.
