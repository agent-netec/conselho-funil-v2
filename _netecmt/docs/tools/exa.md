---
title: Exa MCP - Guia de Liberação
status: approved
owner: Iuran (PM)
permitted_agents:
  - Iuran (PM)
  - Kai (Integrator)
  - Athos (Arch)
  - Darllyson (Dev)
last_review: 2026-01-11
---

# O que faz
- Pesquisa estratégica/benchmark na web (texto) via Exa AI.

# Pré-requisitos
- Variável `EXA_API_KEY` no ambiente.

# Comandos permitidos
- `web_search_exa`: busca por termos, retorna links/snippets.

# Fluxo recomendado
1) Definir termo claro e filtros (ex.: “vero academy brand logo”).
2) Executar `web_search_exa` e revisar os top resultados.
3) Usar links retornados como entrada para Browser/Firecrawl se precisar de conteúdo completo.

# Regras de segurança
- Não enviar dados sensíveis na query.
- Respeitar ToS das fontes; não automatizar scraping pesado pelo Exa.

# Exemplo
- `web_search_exa`: query="vero academy brand logo" limit=5
