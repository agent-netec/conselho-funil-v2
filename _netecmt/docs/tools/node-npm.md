---
title: Node.js & NPM - Guia de Liberação
status: approved
owner: Monara (Integrator)
permitted_agents:
  - Darllyson (Dev)
  - Dandara (QA)
  - Monara (Integrator)
last_review: 2026-02-05
---

# O que faz
- `node`: Executa scripts JavaScript no ambiente de servidor.
- `npm`: Gerenciador de pacotes e executor de scripts definidos no `package.json`.

# Status
- Aprovado para uso em scripts de automação, testes e build.

# Comandos Permitidos
- `node [caminho_do_script]`: Executar scripts locais (ex: scripts de smoke test).
- `npm run [script]`: Executar comandos definidos no `package.json`.
- `npm install`: Instalar dependências (apenas em ambiente de dev/ci).

# Regras
- Nunca executar scripts de fontes não confiáveis.
- Verificar o conteúdo do script antes de rodar com `node`.
- Não instalar pacotes globais sem autorização.
- Respeitar o isolamento de ambiente (usar `.env.local` para chaves).

# Exemplo de Uso
- `node app/scripts/firecrawl-smoke.js`: Executa o teste de fumaça do Firecrawl.
- `npm run test`: Executa a suíte de testes do projeto.
