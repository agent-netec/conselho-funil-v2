# 🏗️ Story: AI: Embeddings Gemini & RAG Semântico v2 (ST-10.2)

**Status:** 🚀 In Progress  
**Prioridade:** P0  
**Épico:** E15: RAG & Busca Vetorial

## 📝 Descrição
Substituir o atual sistema de busca por "hash matemático" (local) por busca semântica real utilizando o modelo `text-embedding-004` do Google Gemini. Esta mudança é crítica para que o Conselho consiga "puxar" os trechos profundos dos livros e heurísticas ingeridos, eliminando respostas genéricas.

## 🎯 Critérios de Aceite
- [ ] Substituir `generateLocalEmbedding` em `lib/ai/rag.ts` por chamadas reais à API do Gemini via `generateEmbedding`.
- [ ] Implementar lógica de fallback: se a busca vetorial falhar, utilizar busca por palavra-chave (keyword match).
- [ ] O RAG deve retornar no mínimo 8 chunks de alta relevância (similarity > 0.6).
- [ ] Logs no console devem mostrar `[RAG v2] Semantic search successful` com o tempo de resposta.

## 🛡️ Definição de Pronto (DoD)
- Código limpo e seguindo Clean Architecture.
- Sem erros de linter.
- Validado via Chat: As respostas devem citar termos específicos dos playbooks.
