# 🎯 PRD: Ingestão Profunda de Contexto & RAG Alta Fidelidade

**Versão:** 1.0  
**Status:** Draft  
**Responsável:** Iuran (PM)  
**Data:** 14/01/2026

## 1. Problema & Oportunidade
O Conselho de Funil hoje sofre de "conhecimento genérico". Embora tenhamos ingerido livros e vídeos, o RAG atual (hash local e Firestore simples) não consegue recuperar a profundidade heurística necessária. Além disso, o contexto da marca está limitado a metadados básicos, impossibilitando que a IA entenda a estratégia real de um cliente (PDFs de estratégia, Transcrições, URLs de concorrentes).

**Objetivo:** Eliminar a dependência de agências externas entregando uma IA que conhece a marca do usuário e as heurísticas dos mestres com precisão absoluta.

## 2. Requisitos Funcionais

### RF-01: Ingestão Multimodal de Marca (Brand Intelligence)
- O usuário deve poder fazer upload de **PDFs, DOCX e TXT** na seção da Marca.
- O sistema deve permitir a raspagem estratégica de **URLs** (Landing Pages de concorrentes, Blog posts).
- Os documentos devem ser processados, "chunkados" e vetorizados automaticamente.

### RF-02: Pipeline RAG v2 (Deep Brains)
- **Vetorização Real**: Substituir `generateLocalEmbedding` por chamadas nativas ao `text-embedding-004`.
- **Memória de Longo Prazo (Pinecone)**: Implementar integração oficial com Pinecone para busca vetorial de alta performance.
- **Roteamento de Especialista**: O RAG deve priorizar chunks baseados no conselheiro invocado (filtro por metadado).

### RF-03: Grounding & Citação
- A IA não deve responder se não encontrar suporte no contexto (Grounding).
- Cada recomendação estratégica deve vir acompanhada da fonte: "[Fonte: Livro DotCom Secrets, p. 45]" ou "[Fonte: PDF Estratégia de Natal.pdf]".

## 3. Requisitos Técnicos
- **Vector DB**: Pinecone (Index: `funnel-council-brains`).
- **Embeddings**: Google Gemini `text-embedding-004`.
- **Framework**: LangChain ou pipeline nativo customizado em `lib/ai/rag.ts`.

## 4. Métricas de Sucesso
- Aumento de 50% na densidade de termos específicos da marca nas respostas.
- Redução de alucinações (informações inventadas não presentes nos documentos).
- Tempo de resposta para busca em 10k+ chunks inferior a 2s.
