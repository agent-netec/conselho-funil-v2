# 📜 Contrato Técnico: Document Processing Worker (ST-10.4)

## 🏗️ Novo Arquivo: `app/src/lib/ai/worker.ts`
Deve exportar a função principal:
- `processAsset(assetId: string)`: Orquestra todo o fluxo de ingestão para um asset específico.

## 🏗️ Nova Rota: `app/src/app/api/ingest/process/route.ts`
- Método: `POST`
- Input: `{ assetId: string }`
- Comportamento: Dispara o worker e retorna o status da operação.

## 🧩 Integrações Obrigatórias
- **Chunking**: Deve usar `createChunks` de `lib/ai/chunking.ts`.
- **Embeddings**: Deve usar `generateEmbeddingsBatch` de `lib/ai/embeddings.ts`.
- **Pinecone**: Deve usar `upsertToPinecone` de `lib/ai/pinecone.ts`.
- **Firestore**: Atualizar documento em `brand_assets/{assetId}` com `status`, `chunkCount` e `processedAt`.
