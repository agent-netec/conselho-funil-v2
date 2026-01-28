# 🔄 Story Pack: Deep Intelligence (Sprint 10)

**Objetivo:** Elevar o Conselho ao nível de agência sênior através de RAG de Alta Fidelidade e Ingestão Profunda de Marca.

## 📋 Lista de Stories

| ID | Story | Prioridade | Status |
| :--- | :--- | :--- | :--- |
| **ST-10.1** | **Infra: Ativação do Pinecone Vector DB** | P0 | 📦 Ready |
| **ST-10.2** | **AI: Embeddings Gemini & RAG Semântico v2** | P0 | 📦 Ready |
| **ST-10.3** | **UX: Seção de Ingestão de Contexto da Marca (Files/URLs)** | P1 | 📦 Ready |
| **ST-10.4** | **Backend: Worker de Processamento de Documentos (OCR/PDF)** | P1 | 📦 Ready |
| **ST-10.5** | **Agent: Grounding & Citação Estratégica Obrigatória** | P2 | 📦 Ready |

---

## 🏗️ ST-10.1: Infra: Ativação do Pinecone Vector DB
**Como** arquiteto, **quero** integrar o Pinecone como banco de vetores principal, **para** que o sistema suporte o crescimento massivo de brains e assets de marca sem perda de performance.

**Critérios de Aceite:**
- Pacote `@pinecone-database/pinecone` instalado e configurado.
- Endpoint de health-check para conexão com o Index.
- Migração básica: Script para mover chunks do Firestore para o Pinecone.

## 🏗️ ST-10.4: Backend: Worker de Processamento de Documentos
**Como** sistema, **quero** processar automaticamente os arquivos subidos, **para** que o conteúdo seja indexado sem intervenção manual.

**Critérios de Aceite:**
- Pipeline completo: Extração -> Chunking -> Embeddings -> Pinecone.
- Suporte a PDF e metadados de governança.
- Pack detalhado em: `_netecmt/packs/stories/ST-10-4-worker-processing/`

## 🏗️ ST-10.3: UX: Ingestão de Contexto da Marca
**Como** consultor, **quero** subir documentos estratégicos da marca, **para** que a IA não seja genérica e conheça meu produto profundamente.

**Critérios de Aceite:**
- Nova tab "Contexto Estratégico" dentro da página de Marca.
- Componente de upload múltiplo (Dropzone) com suporte a PDF/DOCX.
- Campo para inserção de URLs para scraping automático.
- Lista de documentos processados com status (Vetorizado/Erro).
