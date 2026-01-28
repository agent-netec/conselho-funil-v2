---
title: Firecrawl MCP - Guia de Liberação
status: planned
owner: Kai (Integrator)
permitted_agents:
  - Athos (Arch)
  - Darllyson (Dev)
  - Kai (Integrator)
last_review: 2026-01-11
---

# O que faz
- URL → Markdown limpo para ingestão/RAG.

# Status
- Planejado (chave `FIRECRAWL_API_KEY` necessária). Só usar quando configurado.

# Comandos (quando ativo)
- `firecrawl_crawl`: converter página em markdown estruturado.

# Regras
- Não enviar dados sensíveis na URL.
- Evitar uso em sites que bloqueiem scraping; respeitar ToS.

# Exemplo (quando habilitado)
- `firecrawl_crawl`: url="https://vero.academy"
