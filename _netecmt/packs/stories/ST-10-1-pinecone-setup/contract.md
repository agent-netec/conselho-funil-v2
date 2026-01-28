# 📜 Contrato Técnico: Pinecone Setup (ST-10.1)

## 🏗️ Novo Arquivo: `lib/ai/pinecone.ts`
Deve exportar as seguintes funções:
- `getPineconeClient()`: Retorna a instância do SDK.
- `upsertToPinecone(chunks, namespace)`: Envia vetores para o banco.
- `queryPinecone(vector, namespace, topK)`: Busca semântica rápida.
- `checkPineconeHealth()`: Retorna status e metadados do índice.

## 🏗️ Nova Rota: `app/api/pinecone/health/route.ts`
- Método: `GET`
- Response: `{ status: 'connected', index: 'funnel-council-brains', dimensions: 768, namespaces: [...] }`

## ⚙️ Variáveis de Ambiente
- `PINECONE_API_KEY`: Necessária para autenticação.
- `PINECONE_INDEX`: Nome do índice (default: `funnel-council-brains`).
