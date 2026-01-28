---
title: Context7 (MCP) - Guia de Liberação
status: approved
owner: Kai (Integrator)
permitted_agents:
  - Athos (Arch)
  - Darllyson (Dev)
  - Kai (Integrator)
last_review: 2026-01-11
---

# Context7 - Leitura de documentação de libs

> Fonte única para usar o MCP Context7 no Conselho de Funil. Leia antes de executar qualquer comando.

## O que faz
- Resolve IDs de bibliotecas e baixa documentação atualizada em texto para consulta/contexto técnico.
- Usa dois endpoints MCP: `resolve-library-id` (descoberta) e `get-library-docs` (conteúdo).

## Pré-requisitos
- MCP `user-MCP_DOCKER` ativo (já instalado via Docker).
- Nenhuma credencial adicional.
- Uso restrito aos agentes listados em `permitted_agents`.

## Comandos permitidos
### 1) Descobrir ID da biblioteca (obrigatório se ID não for fornecido)
- Tool: `resolve-library-id`
- Args:
  - `libraryName` (string, obrigatório): nome ou palavra-chave da lib.

### 2) Buscar documentação
- Tool: `get-library-docs`
- Args:
  - `context7CompatibleLibraryID` (string, obrigatório): ID no formato `/org/projeto` ou `/org/projeto/versão`.
  - `tokens` (number, opcional): limite de tokens de saída (default 10000).
  - `topic` (string, opcional): recorte temático (ex: "routing", "auth").

## Fluxo de uso (passo a passo)
1. Se o usuário não forneceu o ID já no formato `/org/projeto[/versão]`, execute `resolve-library-id` com o nome da lib.
2. Escolha o ID retornado mais relevante. Em caso de ambiguidade, peça confirmação ao usuário.
3. Execute `get-library-docs` com o ID escolhido. Opcionalmente ajuste `tokens` e `topic` para foco/limite.
4. Não armazene credenciais ou trechos sensíveis; a saída é apenas documentação pública.

## Exemplos
- Resolver ID:
  - `resolve-library-id` → `libraryName: "next.js"`
- Buscar docs completos:
  - `get-library-docs` → `context7CompatibleLibraryID: "/vercel/next.js"`
- Buscar recorte sobre roteamento com menos tokens:
  - `get-library-docs` → `context7CompatibleLibraryID: "/vercel/next.js"`, `topic: "routing"`, `tokens: 4000`

## Checklist de segurança
- ✅ Confirmar que o agente está na lista permitida.
- ✅ Se o ID não for explícito, sempre passar por `resolve-library-id`.
- ✅ Em caso de múltiplas libs possíveis, confirmar com o usuário antes de baixar.
- ✅ Não inserir chaves/env em chamadas; Context7 não exige credenciais.
- ✅ Registrar decisões relevantes em `_netecmt/solutioning/adr/` quando usado em Party Mode.

