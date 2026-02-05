# Contract: Third-Party Integrations & Services

## 1. Visão Geral
Este documento mapeia todos os serviços de terceiros, APIs e dependências externas utilizadas no **Conselho de Funil**. Ele serve como fonte da verdade para o **Leo (Integration Owner)** e **Luke (Release Orchestrator)**.

## 2. Inventário de Serviços Atual

| Serviço | Finalidade | Status | Key Disponível? |
| :--- | :--- | :--- | :--- |
| **Firebase** | Auth, Firestore, Storage | ✅ Ativo | Sim (`.env.local`) |
| **Google Gemini** | IA Core (Conselho) | ✅ Ativo | Sim (`.env.local`) |
| **Firecrawl** | Scraping Primário (Deep-crawl/Bypass) | 🏗️ Sprint 23 | `FIRECRAWL_API_KEY` |
| **Jina Reader** | Scraping Secundário (Markdown) | ✅ Ativo | `JINA_API_KEY` |
| **PostHog** | Analytics e Tracking | ⚠️ Parcial | Não encontrada no Core Rules |
| **Tesseract.js** | OCR Local (Client) | ✅ Ativo | N/A (Local) |
| **PDF.js** | Processamento de Docs | ✅ Ativo | N/A (Local) |
| **Meta Ads** | Ingestão de métricas e criativos | 🏗️ Em Implantação | `.env.local` + Firestore |
| **Cheerio** | Web Scraping | ⚠️ Limitado | N/A (Bloqueio CORS) |

## 3. Ferramentas de Linha de Comando (CLIs)

| CLI | Finalidade | Status |
| :--- | :--- | :--- |
| **firebase-tools** | Gestão de Firestore, Auth e Deploy de Rules | ✅ Instalada (v15.2.1) |
| **vercel** | Deploy e Gestão de Domínios | ✅ Instalada (v50.1.6) |
| **netecmt-cli** | Orquestração da Metodologia | ✅ Instalada (v0.1.1) |

## 4. Roadblocks & Serviços Faltantes (GAP Analysis)

### 🟢 Resolvidos (Sprint 23)
1. **Scraping Proxy (Firecrawl)**:
   - **Status**: Implementado como motor primário.
   - **Lógica de Fallback**: Firecrawl -> Jina Reader -> Readability Local.

### 🔴 Críticos (Bloqueiam funcionalidades core)
1.  **Pinecone / Vector DB**: 
    - **Necessidade**: Busca semântica escalável para o RAG. Atualmente usamos Firestore, o que limitará a performance com o aumento de chunks.
    - **Sugestão**: Pinecone (Serverless) ou Supabase (pgvector).
2.  **Scraping Proxy (Jina / Firecrawl / ScrapingFish)**:
    - **Necessidade**: Resolver o bloqueio de CORS na extração de contexto de URLs (Roadblock Sprint 6).
    - **Sugestão**: Jina Reader API ou Firecrawl.
3.  **Cloud OCR (Google Vision / Azure AI)**:
    - **Necessidade**: Resolver baixa performance e precisão do Tesseract.js client-side.
    - **Sugestão**: Google Cloud Vision API (respeitando a regra de Client SDK se possível ou via API Route).

### 🟡 Recomendados (Melhoria de Produto)
1.  **Stripe**: Para monetização e planos multi-tenant (mencionado no contexto SaaS).
2.  **Resend / Postmark**: Para disparos de e-mail transacional (boas-vindas, recuperação de senha).
3.  **LogSnag / Sentry**: Para monitoramento de erros e eventos de negócio em tempo real.

## 4. Matriz de Responsabilidade (Integrations)

- **Configuração de Infra**: Monara (System Integrator).
- **Implementação de Adaptadores**: Leo & Luke.
- **Validação de Segurança**: Dandara (QA).
- **Visão de Negócio**: Iuran (PM).

## 5. Próximos Passos
1.  [ ] Validar chaves de produção para PostHog.
2.  [ ] Decidir entre Pinecone vs Supabase para Vector DB.
3.  [ ] Implementar Bridge de Scraping para contornar CORS.

---
*Status: Draft - Aguardando veredito do Iuran e Usuário.*

