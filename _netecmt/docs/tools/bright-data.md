---
title: Bright Data MCP - Guia de Liberacao
status: approved
owner: Monara (Integrator)
permitted_agents:
  - Monara (Integrator)
  - Darllyson (Dev)
  - Athos (Arch)
last_review: 2026-01-31
---

# O que faz
- Acesso a dados da web em escala via MCP Bright Data.
- Suporta scraping de paginas e redes sociais com bloqueio reduzido.

# Pre-requisitos
- Token de API ativo (Bright Data).
- Variaveis de ambiente do projeto:
  - `BRIGHT_DATA_API_KEY` (token principal).
  - `BRIGHT_DATA_WORKER_URL` (endpoint remoto, quando aplicavel).

# Comandos permitidos (principais)
- `scrape_as_markdown`: converte URL em Markdown limpo.

# Fluxo recomendado
1) Validar `BRIGHT_DATA_API_KEY` no ambiente.
2) Para Cursor/Dev, usar MCP remoto/hosted quando configurado.
3) Usar `scrape_as_markdown` com URL sem dados sensiveis.
4) Aplicar sanitizacao de PII no resultado antes de persistir.

# Regras de seguranca
- Nao enviar credenciais na URL.
- Evitar scraping de areas autenticadas.
- Respeitar ToS e robots dos sites-alvo.

# Referencia oficial
- https://github.com/luminati-io/brightdata-mcp
