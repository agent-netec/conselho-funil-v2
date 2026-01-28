# Pinecone (Vector DB)

## O que é
SDK oficial `@pinecone-database/pinecone` para operar o index `cf-dev-assets` (RAG v2).

## Configurações do Índice (Screenshot Ref)
- **Index Name**: `cf-dev-assets`
- **Region**: `us-east-1`
- **Cloud**: `AWS`
- **Dimension**: `768` (text-embedding-004)
- **Capacity Mode**: On-demand (Serverless)

## Variáveis de Ambiente
- `PINECONE_API_KEY` (obrigatório)
- `PINECONE_INDEX` — `cf-dev-assets`
- `PINECONE_ENVIRONMENT` — `us-east-1`

Onde colocar:
- `app/.env.local` (desenvolvimento)
- Vercel Preview/Prod

## SDK Básico (implementado em `app/src/lib/ai/pinecone.ts`)
- `getPineconeClient()`: singleton server-side.
- `getPineconeIndex()`: referência ao índice.
- `upsertToPinecone(records, { namespace })`: upsert de vetores (768 dims, text-embedding-004).
- `queryPinecone({ vector, topK, namespace, filter })`: busca semântica com filtros de metadados.
- `checkPineconeHealth()`: stats + host + namespaces.

- Health check: `GET /api/pinecone/health` (deve mostrar `cf-dev-assets` se o .env estiver carregado).
- Migração: `POST /api/pinecone/migrate` com body opcional:
  ```json
  { 
    "namespace": "cf-dev-assets", 
    "collections": ["brand_assets", "knowledge"] 
  }
  ```
  (Default: `collections: ["brand_assets"]`). Certifique-se de que os chunks já tenham embedding; itens sem embedding serão listados em `errors`.

## Notas de governança
- Gate de dimensão: embeddings devem ter 768 dimensões.
- Use namespaces por marca (`brand-{id}`) para isolamento.
- Não expor API keys em logs ou chat.
