# 🏗️ Story: Backend: Worker de Processamento de Documentos (ST-10.4)

**Status:** 📦 Ready  
**Prioridade:** P1  
**Épico:** E21: Ingestão de Conhecimento

## 📝 Descrição
Implementar o pipeline de processamento para transformar arquivos brutos (PDF, DOCX, Imagens) em chunks vetorizados no Pinecone. O sistema deve garantir que o texto seja extraído corretamente, dividido em pedaços semânticos e armazenado com metadados de governança.

## 🎯 Critérios de Aceite
- [ ] Implementação de lógica de extração server-side para PDFs (respeitando restrições de ambiente Windows/Next.js).
- [ ] Pipeline de processamento: Extração -> Limpeza -> Chunking (`lib/ai/chunking.ts`) -> Embedding (`lib/ai/embeddings.ts`) -> Pinecone (`lib/ai/pinecone.ts`).
- [ ] Atualização automática do status do `BrandAsset` para `ready` ou `error` no Firestore.
- [ ] Registro de `chunkCount` e metadados de processamento no Firestore.

## 🛡️ Definição de Pronto (DoD)
- Arquivo PDF de teste processado e vetorizado com sucesso.
- Status do asset atualizado para `ready` no Firestore.
- Chunks consultáveis via Pinecone Health Check (contagem incrementada).
