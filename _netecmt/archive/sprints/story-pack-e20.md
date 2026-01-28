# Story Pack: E20-1 (Ingestão do Design Brain)

## 🎯 Objetivo
Ingerir o conhecimento especializado de design para que os agentes possam gerar briefings e scorecards precisos.

## 📝 User Stories
- **US-20.1**: Ingestão de frameworks de Design (Thumbnails, Carrosséis, Estáticos).

## 🛠️ Contrato Técnico
- **Coleção:** `knowledge` (Firestore).
- **Metadados:** `metadata.counselor: 'design_director'`, `metadata.docType: 'heuristics' | 'framework' | 'case'`.
- **Filtro RAG:** Os chunks devem estar disponíveis para consultas relacionadas a criativos e design.

## 📋 Tasks para o Script de Ingestão
1. [x] Mapear arquivos em `templates/designer/design_brain/council/`.
2. [x] Implementar script `app/scripts/ingest-design-brain.ts` (baseado nos scripts de ingestão existentes).
3. [x] Processar:
    - `frameworks/*.md` -> Heurísticas e estruturas.
    - `scorecards/*.md` -> Critérios de avaliação.
    - `anti-patterns/*.md` -> O que não fazer.
    - `case-library/*.md` -> Exemplos reais.
4. [x] Gerar embeddings e salvar no Firestore.

## 🧪 Critérios de Aceite
- Execução do script sem erros.
- Chunks visíveis no Firestore com a tag `design_director`.
- Teste de busca semântica retornando resultados do novo brain.

