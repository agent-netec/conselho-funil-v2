---
title: Browser MCP (Playwright) - Guia de Liberação
status: approved
owner: Kai (Integrator)
permitted_agents:
  - Darllyson (Dev)
  - Athos (Arch)
  - Kai (Integrator)
last_review: 2026-01-11
---

# O que faz
- Navegar/raspar páginas com JS (anti-CORS) via Playwright.
- Capturar HTML, screenshots e interagir (click/type).

# Pré-requisitos
- MCP `cursor-ide-browser` ou `user-MCP_DOCKER` ativo.
- Sem credenciais extras.

# Comandos permitidos (principais)
- `browser_navigate` (abrir URL)
- `browser_snapshot` / `browser_take_screenshot` (captura)
- `browser_console_messages` / `browser_network_requests` (inspeção)
- `browser_click`, `browser_type`, `browser_press_key`, `browser_hover`
- `browser_wait_for` (aguardar seletor/texto)

# Fluxo recomendado
1) `browser_navigate` para a URL alvo.
2) `browser_snapshot` para extrair HTML + texto.
3) Se precisar de assets visuais, `browser_take_screenshot` ou capturar `network_requests`.
4) Minimizar interações; evitar logins que peçam credenciais.

# Regras de segurança
- Não inserir senhas/chaves em inputs.
- Não automatizar formulários de pagamento/login.
- Respeitar robots/ToS; uso apenas para diagnóstico interno.

# Exemplos rápidos
- Abrir e capturar:
  - `browser_navigate`: url="https://vero.academy"
  - `browser_snapshot`: full_page=true
- Aguardar texto:
  - `browser_wait_for`: text="Cursos"
