# ST-22-00 — Matriz env ↔ endpoint

> Uso: identificar rapidamente quais rotas quebram se uma env faltar.

## Firebase (NEXT_PUBLIC_FIREBASE_*)
Impacto amplo em rotas que usam Firestore (`db`).
- `/api/intelligence/keywords`
- `/api/intelligence/spy`
- `/api/intelligence/ltv/cohorts`
- `/api/intelligence/creative/*`
- `/api/intelligence/journey/*`
- `/api/ingest/*`
- `/api/library`
- `/api/chat`
- `/api/decisions`
- `/api/funnels/*`
- `/api/copy/*`
- `/api/social-inbox`
- `/api/reporting/*`
- `/api/webhooks/*`
- `/api/admin/*`
- `/api/campaigns/*`

## GOOGLE_AI_API_KEY / GEMINI_MODEL
Rotas que chamam Gemini/Google AI.
- `/api/chat`
- `/api/intelligence/autopsy/run`
- `/api/ingest/url` (fallback Vision)
- `/api/copy/*`
- `/api/social/*`
- `/api/design/*`
- `/api/campaigns/[id]/generate-ads`
- `/api/ai/analyze-visual`
- `/api/design/upscale`

## Pinecone (PINECONE_API_KEY / PINECONE_HOST / INDEX)
RAG e métricas de ativos.
- `/api/assets/metrics`
- `/api/chat` (RAG)
- `/api/campaigns/[id]/generate-ads` (RAG)
- `/api/social/*` (RAG)
- `/api/design/plan` (RAG indireto via prompts)
- `/api/pinecone/*`

## Webhooks & Security (CAMPAIGN_WEBHOOK_SECRET, SECONDARY)
- `/api/webhooks/ads-metrics`

## NEXT_PUBLIC_APP_URL
Links e callbacks internos.
- `/api/funnels/share`
- `/api/decisions` (regeneração)
- `/api/copy/decisions` (regeneração)

## Social Command Center (INSTAGRAM_API_KEY, WHATSAPP_*, LINKEDIN_*)
- `/api/social-inbox`

## MCP Relay (BRIGHT_DATA/EXA/FIRECRAWL/BROWSER/GLIMPSE)
- `/api/mcp/execute`

