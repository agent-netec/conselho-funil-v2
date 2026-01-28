# 🔍 Contexto Permitido: RAG v2 (ST-10.2)

Os arquivos abaixo são as únicas lanes permitidas para alteração nesta story:

- `app/src/lib/ai/rag.ts`: Lógica principal de recuperação.
- `app/src/lib/ai/embeddings.ts`: Geração de vetores via Gemini API.
- `app/src/lib/ai/rerank.ts`: Refinamento de resultados via Cohere.
- `app/src/lib/ai/prompts/chat-system.ts`: Ajuste de grounding (opcional).
- `app/src/lib/constants.ts`: Mapeamento de conselheiros.
