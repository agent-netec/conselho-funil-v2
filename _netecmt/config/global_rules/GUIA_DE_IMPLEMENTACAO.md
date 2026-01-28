# Guia de Implementação: Melhorias nas Cursor Rules da NETECMT

**Data:** 08 de janeiro de 2026
**Autor:** Manus AI

Este guia fornece instruções passo a passo para implementar as melhorias propostas nas Cursor Rules da sua metodologia NETECMT, incluindo User Rules globais, templates para projetos greenfield e brownfield, e a integração do gerenciamento de portas.

## Visão Geral dos Arquivos Entregues

A estrutura de arquivos entregue está organizada da seguinte forma:

```
netecmt_rules_proposal/
├── user_rules/
│   ├── 01-port-management.md
│   ├── 02-communication-standards.md
│   ├── 03-security-baseline.md
│   └── 04-netecmt-global-principles.md
├── project_templates/
│   ├── .cursorrules.greenfield
│   └── .cursorrules.brownfield
├── project_rules/
│   └── netecmt/
│       └── bmm/
│           └── agents/
│               └── dev_with_port_management.mdc
└── GUIA_DE_IMPLEMENTACAO.md (este arquivo)
```

## Parte 1: Configurar User Rules Globais

As **User Rules** são configuradas no próprio aplicativo Cursor e se aplicam a **todos os seus projetos**. Elas resolvem problemas recorrentes de forma centralizada.

### Passo 1.1: Acessar as Configurações do Cursor

1.  Abra o **Cursor**.
2.  Acesse **Settings** (Configurações) usando o atalho `Ctrl+,` (Windows/Linux) ou `Cmd+,` (macOS).
3.  No menu lateral esquerdo, procure por **"Cloud Agents"** ou **"Agents"**.
4.  Dentro dessa seção, localize a opção **"User Rules"** ou **"Global Rules"**.

### Passo 1.2: Adicionar as User Rules

Para cada um dos 4 arquivos em `user_rules/`, você irá criar uma nova User Rule:

1.  Clique em **"Add Rule"** ou **"+ New Rule"**.
2.  **Nome da Rule:** Use o nome do arquivo sem a extensão (ex: `port-management`).
3.  **Conteúdo:** Copie e cole o conteúdo completo do arquivo `.md` correspondente.
4.  **Opção `alwaysApply`:** Certifique-se de que está marcada como `true` (ou equivalente, dependendo da interface do Cursor).
5.  Clique em **"Save"** ou **"Salvar"**.

Repita este processo para os 4 arquivos:
- `01-port-management.md`
- `02-communication-standards.md`
- `03-security-baseline.md`
- `04-netecmt-global-principles.md`

**Resultado Esperado:** Após esta etapa, todos os agentes em todos os seus projetos seguirão automaticamente estas regras globais.

## Parte 2: Aplicar Templates de Projeto

Os templates `.cursorrules` são específicos para cada projeto e devem ser copiados para a raiz do projeto.

### Para Projetos Greenfield (Novos)

1.  Navegue até a raiz do seu novo projeto.
2.  Copie o arquivo `project_templates/.cursorrules.greenfield` para a raiz do projeto.
3.  Renomeie o arquivo para `.cursorrules` (remova o sufixo `.greenfield`).
4.  Abra o arquivo e revise as regras. Ajuste os caminhos se necessário (geralmente não é necessário se você seguiu a estrutura padrão da NETECMT).
5.  Salve o arquivo.

### Para Projetos Brownfield (Legado)

1.  Navegue até a raiz do seu projeto existente.
2.  Copie o arquivo `project_templates/.cursorrules.brownfield` para a raiz do projeto.
3.  Renomeie o arquivo para `.cursorrules`.
4.  **Ação Adicional Crítica:** Você precisará criar o arquivo de contrato da Lane de Legado.
    - Crie o arquivo `_netecmt/contracts/legacy_lane_contract.md` na raiz do seu projeto.
    - Este arquivo deve documentar as interfaces públicas do código legado que o código novo pode usar.
    - Peça ao **Athos (Arquiteto)** para criar este contrato, mapeando o código existente.
5.  Salve o arquivo `.cursorrules`.

**Resultado Esperado:** Cada projeto agora terá uma configuração de rules específica para seu cenário (greenfield ou brownfield).

## Parte 3: Integrar Gerenciamento de Portas no Agente Dev

Esta etapa modifica a rule do agente de desenvolvimento (Darllyson) para incluir o procedimento de limpeza de portas.

### Opção A: Substituir a Rule Existente (Recomendado)

1.  Navegue até `.cursor/rules/netecmt/bmm/agents/` no seu projeto (ou no template da NETECMT).
2.  **Faça um backup** do arquivo `dev.mdc` original (renomeie para `dev.mdc.backup`).
3.  Copie o arquivo `project_rules/netecmt/bmm/agents/dev_with_port_management.mdc` para este diretório.
4.  Renomeie o arquivo copiado para `dev.mdc`.

### Opção B: Criar uma Variante (Alternativa)

Se você preferir manter a rule original intacta e criar uma variante:

1.  Copie o arquivo `project_rules/netecmt/bmm/agents/dev_with_port_management.mdc` para `.cursor/rules/netecmt/bmm/agents/`.
2.  Mantenha o nome `dev_with_port_management.mdc`.
3.  No seu `.cursorrules`, referencie esta nova variante:

    ```yaml
    - id: netecmt-dev-agent-with-ports
      path: .cursor/rules/netecmt/bmm/agents/dev_with_port_management.mdc
      type: project
      alwaysApply: false
    ```

**Resultado Esperado:** O agente Darllyson agora sempre limpará a porta antes de iniciar um servidor, eliminando conflitos.

## Parte 4: Validação e Testes

Após implementar todas as mudanças, valide a configuração:

1.  **Teste de User Rules:** Inicie uma nova conversa com o agente em qualquer projeto e peça para ele "iniciar o servidor de desenvolvimento". Ele deve automaticamente executar `npx kill-port <PORTA>` antes de `npm run dev`.
2.  **Teste de Formatação:** Peça ao agente para gerar um relatório com números. Verifique se ele usa vírgula para decimal e ponto para milhar (padrão brasileiro).
3.  **Teste de Segurança:** Peça ao agente para adicionar uma nova dependência. Ele deve sugerir executar `snyk test`.
4.  **Teste de Greenfield:** Crie um novo projeto usando o template `.cursorrules.greenfield` e verifique se o agente solicita a criação de Contratos de Lane antes de qualquer implementação.
5.  **Teste de Brownfield:** Em um projeto existente com o template `.cursorrules.brownfield`, verifique se o agente respeita o `legacy_lane_contract.md`.

## Parte 5: Manutenção e Evolução

- **User Rules:** Atualize as User Rules no Cursor Settings sempre que identificar novos padrões recorrentes.
- **Templates de Projeto:** Mantenha os templates `.cursorrules` versionados no repositório da NETECMT para facilitar a criação de novos projetos.
- **Feedback:** Documente qualquer problema ou melhoria e compartilhe com a equipe ou comunidade NETECMT.

## Conclusão

Com estas implementações, sua metodologia NETECMT estará ainda mais robusta, com regras globais que eliminam problemas recorrentes e templates que facilitam a adoção em diferentes cenários de projeto. O gerenciamento de portas integrado garante um ambiente de desenvolvimento mais estável e previsível.
