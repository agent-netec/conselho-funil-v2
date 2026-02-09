---
title: Node.js & NPM - Guia de Liberação
status: approved
owner: Monara (Integrator)
permitted_agents:
  - Darllyson (Dev)
  - Dandara (QA)
  - Monara (Integrator)
last_review: 2026-02-09
---

# O que faz
- `node`: Executa scripts JavaScript no ambiente de servidor.
- `npm`: Gerenciador de pacotes e executor de scripts definidos no `package.json`.
- `npx`: Executor de binários de pacotes locais instalados no `node_modules/.bin` (parte do ecossistema npm).

# Status
- Aprovado para uso em scripts de automação, testes, build e validação de tipos.

# Comandos Permitidos
- `node [caminho_do_script]`: Executar scripts locais (ex: scripts de smoke test).
- `npm run [script]`: Executar comandos definidos no `package.json`.
- `npm test`: Atalho para `npm run test` — executa a suíte de testes.
- `npm install`: Instalar dependências (apenas em ambiente de dev/ci).
- `npx [pacote_local] [args]`: Executar binários de pacotes já instalados no projeto. Exemplos permitidos:
  - `npx tsc --noEmit`: Verificação de tipos TypeScript sem emitir arquivos.
  - `npx jest [args]`: Executar testes com flags adicionais (ex: `--detectOpenHandles`).

# Regras
- Nunca executar scripts de fontes não confiáveis.
- Verificar o conteúdo do script antes de rodar com `node`.
- Não instalar pacotes globais sem autorização.
- `npx` deve ser usado apenas para binários JÁ INSTALADOS no projeto (presentes em `node_modules/.bin`). NUNCA usar `npx` para baixar e executar pacotes remotos sem aprovação prévia da Monara.
- Respeitar o isolamento de ambiente (usar `.env.local` para chaves).

# Exemplo de Uso
- `node app/scripts/firecrawl-smoke.js`: Executa o teste de fumaça do Firecrawl.
- `npm run test` ou `npm test`: Executa a suíte de testes do projeto.
- `npx tsc --noEmit`: Valida tipos TypeScript (QA e Dev).
- `npx jest --detectOpenHandles`: Investiga leaks de handles nos testes.
