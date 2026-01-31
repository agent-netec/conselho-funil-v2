# ST-22-00 — Checklist de validacao de envs (local + Vercel)

> Atualizado para refletir integracoes por cliente (tenant) via aplicacao.

## 1) Envs globais (obrigatorias no app)
Estas sao usadas por todos os clientes e precisam existir no ambiente.

| Grupo | Variavel | Local (app/.env.local) | Vercel (prod/stg) | Impacto se faltar |
|---|---|---|---|---|
| Firebase | NEXT_PUBLIC_FIREBASE_* | OK | nao verificado | Quebra rotas com Firestore (ver matriz) |
| Google AI | GOOGLE_AI_API_KEY | OK | nao verificado | 500 nas rotas Gemini/AI |
| Google AI | GEMINI_MODEL | OK | nao verificado | 500 nas rotas Gemini/AI |
| Google AI (client) | NEXT_PUBLIC_GOOGLE_AI_API_KEY | VAZIO | nao verificado | Somente se usado no client |
| Pinecone | PINECONE_API_KEY | OK | nao verificado | 500 em RAG/metrics |
| Pinecone | PINECONE_HOST | OK | nao verificado | 500 em RAG/metrics |
| Pinecone | PINECONE_INDEX_NAME | OK | nao verificado | 500 em RAG/metrics |
| Webhooks | CAMPAIGN_WEBHOOK_SECRET | VAZIO | nao verificado | 401/500 em /api/webhooks/ads-metrics |
| Webhooks | CAMPAIGN_WEBHOOK_SECRET_SECONDARY | VAZIO | nao verificado | 401/500 em /api/webhooks/ads-metrics |
| App | NEXT_PUBLIC_APP_URL | OK | nao verificado | Links/callbacks quebrados |
| App | NEXT_PUBLIC_ENCRYPTION_KEY | OK | nao verificado | Erros em criptografia |
| MCP/Workers | FIRECRAWL_API_KEY | OK | nao verificado | Falhas em ingest/scrape |
| MCP/Workers | EXA_API_KEY | OK | nao verificado | Falhas em ingest/search |
| MCP/Workers | BRIGHT_DATA_API_KEY | OK | nao verificado | Falhas em scraping |
| MCP/Workers | BROWSER_WORKER_URL | OK | nao verificado | Falhas em execucao remota |
| MCP/Workers | FIRECRAWL_WORKER_URL | OK | nao verificado | Falhas em execucao remota |
| MCP/Workers | EXA_WORKER_URL | OK | nao verificado | Falhas em execucao remota |
| MCP/Workers | BRIGHT_DATA_WORKER_URL | OK | nao verificado | Falhas em execucao remota |
| Logging | MCP_LOG_LEVEL | OK | nao verificado | Sem impacto funcional |

## 2) Envs por cliente (gerenciados pela aplicacao)
Estas variaveis **nao devem** ser globais no .env quando mudam por cliente.
Armazenar por tenant no banco e resolver via aplicacao.

| Grupo | Variavel | Status local | Observacao |
|---|---|---|---|
| Meta CAPI | META_CAPI_ACCESS_TOKEN | VAZIO | Deve vir do tenant |
| Meta CAPI | META_CAPI_PIXEL_ID | VAZIO | Deve vir do tenant |
| Social | INSTAGRAM_API_KEY | VAZIO | Deve vir do tenant |
| Social | WHATSAPP_BUSINESS_ID | VAZIO | Deve vir do tenant |
| Social | WHATSAPP_ACCESS_TOKEN | VAZIO | Deve vir do tenant |
| Social | LINKEDIN_CLIENT_ID | VAZIO | Deve vir do tenant |
| Social | LINKEDIN_CLIENT_SECRET | VAZIO | Deve vir do tenant |
| Social | SOCIAL_INBOX_WEBHOOK_SECRET | VAZIO | Preferir por tenant |

## 3) Riscos por endpoint (se globais faltarem)
Conforme `env-endpoint-matrix.md`:
- Firebase ausente: /api/intelligence/*, /api/ingest/*, /api/chat, /api/funnels/*, /api/copy/*, /api/social-inbox, /api/reporting/*, /api/webhooks/*, /api/admin/*, /api/campaigns/*
- Google AI ausente: /api/chat, /api/intelligence/autopsy/run, /api/ingest/url, /api/copy/*, /api/social/*, /api/design/*, /api/campaigns/[id]/generate-ads, /api/ai/analyze-visual, /api/design/upscale
- Pinecone ausente: /api/assets/metrics, /api/chat (RAG), /api/campaigns/[id]/generate-ads (RAG), /api/social/* (RAG), /api/design/plan, /api/pinecone/*
- Webhook secret ausente: /api/webhooks/ads-metrics
- NEXT_PUBLIC_APP_URL ausente: /api/funnels/share, /api/decisions, /api/copy/decisions
