# 🏗️ Story: Infra: Ativação do Pinecone Vector DB (ST-10.1)

**Status:** 📦 Ready  
**Prioridade:** P0  
**Épico:** E15: RAG & Busca Vetorial

## 📝 Descrição
Integrar o Pinecone como o Vector Database oficial do projeto. Embora o Firestore suporte vetores, o Pinecone permitirá escala para milhões de chunks (livros, vídeos, transcrições) com latência de milissegundos e filtros de metadados avançados.

## 🎯 Critérios de Aceite
- [ ] Instalação e configuração do SDK oficial `@pinecone-database/pinecone`.
- [ ] Implementação de um `PineconeClient` singleton em `lib/ai/pinecone.ts`.
- [ ] Endpoint `GET /api/pinecone/health` para validar conectividade e dimensões do índice.
- [ ] Definição de estratégia de Namespace (ex: `global-brains`, `brand-{id}`).

## 🛡️ Definição de Pronto (DoD)
- Conexão estável com o índice `funnel-council-brains`.
- Documentação de variáveis de ambiente em `_netecmt/docs/tools/pinecone.md`.
- Teste de Upsert/Query bem-sucedido.
