---
title: Playwright - Guia de Liberacao
status: approved
owner: Dandara (QA)
permitted_agents:
  - Dandara (QA)
  - Darllyson (Dev)
last_review: 2026-02-03
---

# O que faz
- Testes E2E e smoke tests automatizados no frontend e APIs.

# Status
- Em validacao (requer aprovacao do QA).

# Dependencias
- Node.js + npm disponiveis no ambiente.

# Comandos permitidos (PowerShell)
- `npx playwright install`
- `npx playwright test`
- `npx playwright test --project=chromium`
- `npx playwright test --grep "@smoke"`
- `npx playwright test --reporter=list`

# Escopo recomendado
- Smoke tests P0 (rotas criticas e fluxos basicos).

# Regras
- Nao executar contra ambientes nao autorizados.
- Nao usar dados sensiveis em testes.
- Registrar evidencias no QA report quando rodar em prod.

# Exemplo (smoke local)
```powershell
npx playwright install
npx playwright test --project=chromium --grep "@smoke" --reporter=list
```
