# 📦 Story Pack: E21 - Advanced Ingestion & Data Integrity

## 🎯 Objetivo
Resolver os gargalos críticos de ingestão de dados (CORS e OCR) e garantir a integridade do fluxo de informações entre o Brand Kit e o Conselho de Especialistas através de contratos de dados rígidos.

## 📝 User Stories

### US-21.1: Proxy Ingestor de URLs (Anti-CORS)
**Como** sistema, **quero** extrair conteúdo de qualquer URL via servidor, **para** evitar bloqueios de CORS e garantir contexto para o RAG.
- **Critérios de Aceite:**
    - Implementação de API Route em `app/src/app/api/ingest/url/route.ts`.
    - Suporte a Jina Reader como provedor principal e fallback para Readability no servidor.
    - Integração com o frontend substituindo a chamada direta.

### US-21.2: OCR Estratégico via Gemini Vision
**Como** consultor, **quero** que o sistema leia prints e PDFs usando visão computacional (Gemini), **para** extrair heurísticas de funis com precisão estratégica.
- **Critérios de Aceite:**
    - Substituição do Tesseract.js por chamada multimodal ao Gemini 2.0 Flash.
    - Prompt especializado em "Estratégia de Marketing" para a extração do OCR.
    - Suporte a múltiplos formatos de imagem e extração de texto estruturado.

### US-21.3: Brand Kit -> RAG Data Contract
**Como** arquiteto, **quero** garantir que o Brand Kit alimente o RAG de forma consistente, **para** que os Conselheiros arbitrem com base na identidade real da marca.
- **Critérios de Aceite:**
    - Definição de contrato de metadados em `_netecmt/contracts/ingestion-contracts.md`.
    - Validação de integridade no momento do upload (isApprovedForAI).
    - Mapeamento automático de IDs de Marca nos chunks do Firestore.

## 🛠️ Contrato Técnico (Athos)
- **Lane:** Ingestion / AI
- **Contracts:** `_netecmt/contracts/ingestion-contracts.md`
- **Security:** NUNCA usar bibliotecas bloqueadas no Windows 11 24H2 (firebase-admin).

## 📋 Handoff (Leticia)
- **Status:** Ready for Sprint Planning
- **Prioridade:** Máxima (Bloqueador de funcionalidades Core)

