# Lógica de Validação de Dependências e CLIs para Agentes

**Data:** 09 de janeiro de 2026
**Autor:** Manus AI
**Status:** Proposta

## 1. Introdução

Para evitar erros como o `TypeError: Cannot read properties of null` e garantir que os agentes sempre usem comandos válidos, propomos uma nova seção `<dependency_check>` a ser adicionada ao XML de todos os agentes que executam comandos de shell.

## 2. Seção `<dependency_check>`

Esta seção será adicionada logo após a `<activation>` e será executada antes de qualquer outra lógica do agente.

```xml
<agent>
  <activation>...</activation>

  <!-- ================================================== -->
  <!-- 2. VALIDAÇÃO DE DEPENDÊNCIAS E AMBIENTE          -->
  <!-- ================================================== -->
  <dependency_check critical="MANDATORY">
    <step n="1">Load `dependencies.yaml` and `cli-reference.yaml`.</step>
    <step n="2">Check all runtimes, package managers, and dev tools listed in `dependencies.yaml`.</step>
    <step n="3">For each CLI command this agent might use, validate against `cli-reference.yaml`.</step>
    <step n="4">IF any check fails, STOP and provide a detailed error message with installation/fix instructions.</step>
  </dependency_check>

  <persona>...</persona>
  ...
</agent>
```

## 3. Lógica de Execução do Agente

O fluxo de trabalho de um agente (como Darllyson ou Segundinho) ao executar um comando de CLI será:

1.  **Carregar Referências:** O agente carrega `dependencies.yaml` e `cli-reference.yaml`.
2.  **Verificar Ambiente:** O agente detecta o shell atual (Bash, PowerShell, etc.).
3.  **Consultar `cli-reference.yaml`:** Antes de executar um comando (ex: `firebase deploy`), o agente consulta o `cli-reference.yaml` para encontrar a variante correta para o shell detectado.
4.  **Executar Comando Válido:** O agente executa o comando exato especificado na variante, incluindo qualquer necessidade de escape de caracteres (como aspas duplas no PowerShell).
5.  **Tratamento de Erro:** Se o comando falhar, o agente consulta a seção `troubleshooting` do `cli-reference.yaml` (se existir) para tentar uma solução alternativa antes de reportar o erro ao usuário.

## 4. Exemplo de Implementação (Agente Segundinho - TEA)

**Cenário:** O usuário pede ao Segundinho para fazer o deploy de produção.

**Comando do Usuário:** `@segundinho deploy:prod`

**Ações do Agente:**

1.  **`<dependency_check>`:**
    *   Verifica se a Vercel CLI está instalada (`vercel --version`).
    *   Verifica se a versão é `>=32.0.0`.
    *   Se falhar, para e informa: "Vercel CLI não encontrada ou desatualizada. Instale com `npm install -g vercel`."

2.  **Lógica de Execução:**
    *   Detecta que o shell é PowerShell.
    *   Consulta `cli-reference.yaml` para o comando `deploy:production` da Vercel CLI.
    *   Encontra a variante para PowerShell: `vercel --prod`.
    *   Executa o comando `vercel --prod`.

## 5. Benefícios

*   **Zero Erros de Comando:** O agente sempre usa a sintaxe correta para o ambiente.
*   **Validação Proativa:** Problemas de dependência são identificados antes da execução, não depois.
*   **Manutenção Centralizada:** Para atualizar um comando, basta editar o `cli-reference.yaml`, e todos os agentes usarão a nova versão automaticamente.
*   **Experiência do Usuário Fluida:** O agente para de "bater cabeça" com comandos inválidos e resolve os problemas de forma autônoma ou fornece instruções claras para o usuário.
