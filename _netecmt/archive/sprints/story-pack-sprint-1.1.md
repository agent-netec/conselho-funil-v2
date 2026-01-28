# 🚑 Sprint 1.1: Correção & Hardening de Ingestão (E21/E13/E18)

> **Objetivo:** Estabilizar a ingestão de URLs e assets (BrandKit), garantindo persistência correta, fallback para páginas visuais, logging observável e cobertura de QA para prevenir regressões futuras.

---

## 📊 Quadro de Tarefas

| ID | Task | Responsável | Status | Notas |
| :--- | :--- | :--- | :--- | :--- |
| **ST-1.1.1** | Hardening `/api/ingest/url` (texto + fallback visão) | Darllyson (Dev) | ✅ Done | Pipeline robusto com Jina/Readability + Gemini Vision; validado via testes. |
| **ST-1.1.2** | Processamento multimodal `/api/ingest/process` | Darllyson (Dev) + Athos (Arch) | ✅ Done | OCR multimodal funcional para PDFs e Imagens via Gemini Vision. |
| **ST-1.1.3** | Observabilidade & logs de ingestão | Monara/Kai (Integrator) | ✅ Done | Logs de depuração e tratamento de erros implementados nas rotas de ingestão. |
| **ST-1.1.4** | QA regressão e testes (URL + assets) | Dandara (QA) | ✅ Done | Suíte de testes de regressão implementada para a API de ingestão. |
| **ST-1.1.5** | UX de mensagens e estados do uploader | Beto/Victor (UX/UI) | ✅ Done | Estados de loading, progresso e feedbacks de erro refinados no AssetUploader. |
| **ST-1.1.6** | Governança & gate de aprovação | Leticia (SM) | ✅ Done | `isApprovedForAI = false` garantido por padrão em todas as rotas de criação. |

---

## 🎯 Épicos desta Sprint

- **E21:** Ingestion Proxy & Data Integrity (URLs)  
- **E13:** Upload/Chunking de arquivos (PDF/Imagem) com processamento server-side  
- **E18:** Governança de assets e aprovação para IA

---
**Última Atualização:** 11/01/2026 - 18:40  
**Responsável:** Leticia (Scrum Master)
