# 🔐 Contract: Auth, API Keys & Webhooks (One-Time Setup)

Este documento é a **checklist única** para você configurar **todas as credenciais** do projeto de uma vez, evitando retrabalho.

> Regra: nenhuma integração “conta como ativa” sem constar aqui + estar no `_netecmt/core/tools-registry.md`.

## ✅ Regra de Governança (anti-retrabalho)
**Sempre que uma ferramenta nova for adotada e ela exigir autenticação (API key, webhook, token, service account etc.), ela DEVE ser adicionada imediatamente em:**
1. `_netecmt/core/tools-registry.md` (inventário + quem usa + status)
2. `_netecmt/contracts/auth-secrets-spec.md` (o que pegar / onde pegar / onde colocar)
3. Se houver comandos ou configuração:
   - `_netecmt/core/cli-reference.yaml` (comandos)
   - `_netecmt/core/mcp-reference.yaml` (MCP + env)

**Responsável por enforcement:** Kai (Integrator) no Integration Gate.

---

## 1) Onde colocar cada credencial (mapa rápido)

- **Desenvolvimento local (app)**: `app/.env.local`
- **Vercel (Preview/Prod)**: Environment Variables do projeto (Vercel Dashboard)
- **Cloud Run**: Secrets / Service Account (GCP)
- **MCPs (Claude/Cursor)**: variáveis de ambiente no config do MCP (nunca hardcode no repo)

---

## 2) Credenciais por ferramenta (o que pegar + onde pegar + onde colocar)

### A) Google Gemini (IA)
- **O que você precisa**:
  - `GOOGLE_AI_API_KEY` (ou equivalente usado no app)
- **Onde pegar**:
  - Google AI Studio / Console (chave da API Gemini)
- **Onde colocar**:
  - `app/.env.local`
  - Vercel (Preview/Prod)

### B) Firebase (Auth/Firestore/Storage)
- **O que você precisa**:
  - Variáveis públicas do Firebase (client) usadas pelo Next (ex: `NEXT_PUBLIC_FIREBASE_*`)
- **Onde pegar**:
  - Firebase Console → Project Settings → General → Web App config
- **Onde colocar**:
  - `app/.env.local`
  - Vercel (Preview/Prod)

### C) Stripe (Billing) — MCP + Webhooks
- **O que você precisa**:
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
- **Onde pegar**:
  - Stripe Dashboard → Developers → API keys (Secret key)
  - Stripe Dashboard → Developers → Webhooks → endpoint → Signing secret (whsec_…)
- **Onde colocar**:
  - `app/.env.local` (se o app consumir server-side)
  - Vercel (Preview/Prod)
  - MCP Stripe (env do MCP) se você quiser operar Stripe via MCP

### D) Exa (Pesquisa) — MCP
- **O que você precisa**:
  - `EXA_API_KEY`
- **Onde pegar**:
  - Exa Dashboard → API Keys
- **Onde colocar**:
  - MCP Exa (env do MCP)
  - (Opcional) `app/.env.local` se o app chamar Exa diretamente

### E) Firecrawl (opcional) — MCP
- **O que você precisa**:
  - `FIRECRAWL_API_KEY`
- **Onde pegar**:
  - Firecrawl Dashboard → API Keys
- **Onde colocar**:
  - MCP Firecrawl (env do MCP)
  - (Opcional) `app/.env.local` se o app chamar Firecrawl diretamente

### F) Cloud Run (Heavy Workers) — MCP & CLI
- **O que você precisa**:
  - **gcloud CLI** instalado e autenticado (via `gcloud auth login`).
  - **ADC (Application Default Credentials)** ativado via `gcloud auth application-default login`.
  - **Cloud Run Admin API** habilitada no projeto GCP.
- **Onde colocar (MCP no Docker Desktop)**:
  - Na config do MCP Cloud Run: `credentials_path`
  - **Path final testado e aprovado**: `/mnt/host/c/Users/phsed/AppData/Roaming/gcloud/application_default_credentials.json`
- **Passo-a-passo (Caso precise refazer)**:
  1. Instalar Google Cloud SDK.
  2. Rodar `gcloud auth login` e `gcloud auth application-default login`.
  3. No Docker Desktop MCP Toolkit (Configuration do Cloud Run), apontar o path acima.
- **Observação de segurança**:
  - Esse arquivo ADC concede acesso ao seu Google Cloud. Nunca compartilhe esse arquivo ou seu conteúdo.

### G) PostHog (Analytics) — SDK (não MCP por enquanto)
- **O que você precisa**:
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST`
- **Onde pegar**:
  - PostHog → Project Settings → API Keys
- **Onde colocar**:
  - `app/.env.local`
  - Vercel (Preview/Prod)

### H) Pinecone (Vector DB) — opcional (se decidirmos escalar)
- **O que você precisa**:
  - `PINECONE_API_KEY`
  - (Opcional) `PINECONE_ENVIRONMENT` / `PINECONE_REGION` (depende do plano)
  - Nome do index (ex: `PINECONE_INDEX_NAME`)
- **Onde pegar**:
  - Pinecone Console → API Keys / Project
- **Boas práticas (recomendado)**:
  - **Separar por projeto/ambiente**: crie um projeto Pinecone dedicado para o Conselho de Funil (ex: `conselho-de-funil-dev` e depois `conselho-de-funil-prod`).  
    Isso evita misturar dados/custos e reduz risco operacional.
  - **Menor privilégio**: crie uma API key específica para o app (não reutilize key “default” se estiver compartilhada).
  - **Nunca compartilhe a key em chat**: guarde como secret e, se exposta, **rotacione** imediatamente.
- **Onde colocar**:
  - `app/.env.local` (se usar via API Route)
  - Vercel (Preview/Prod)
  - Cloud Run (se o worker fizer ingestão/queries)

### I) Cohere (Reranking)
- **O que você precisa**:
  - `COHERE_API_KEY`
- **Onde pegar**:
  - [Cohere Dashboard](https://dashboard.cohere.com/api-keys)
- **Onde colocar**:
  - `app/.env.local`
  - Vercel (Preview/Prod)

### J) Meta Ads (Global App)
- **O que você precisa**:
  - `META_APP_ID`
  - `META_APP_SECRET`
- **Onde pegar**:
  - [Meta Developers Portal](https://developers.facebook.com/apps/)
- **Onde colocar**:
  - `app/.env.local`
  - Vercel (Preview/Prod)

### K) Meta Ads (Client Integration)
- **O que você precisa**:
  - `META_AD_ACCOUNT_ID` (ID da conta de anúncios do cliente)
  - `META_ACCESS_TOKEN` (System User Token ou User Access Token)
- **Onde pegar**:
  - Gerenciador de Anúncios do Cliente / Configurações do Negócio
- **Onde colocar**:
  - **Firestore**: Salvo via UI de Integrações na coleção `tenants/{tenantId}/integrations`

---

## 3) Checklist “pronto para eu te guiar”

Quando você disser “estou aqui”, me informe **qual tela** você está (Stripe/Exa/GCP/etc). Eu te digo exatamente:
- qual botão clicar
- qual valor copiar
- onde colar (`app/.env.local` / Vercel env / MCP env / Cloud Run)


