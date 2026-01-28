# 🚀 Guia de Início: Novo Projeto com NETECMT v2.0 (Greenfield)

Este guia detalha o processo para criar um novo projeto do zero utilizando a metodologia **NETECMT v2.0**. No modo **Greenfield**, o foco é a agilidade total, começando da descoberta até a implementação.

## 1. Instalação e Configuração

Para adicionar a NETECMT a um projeto novo:

1.  Crie a pasta do seu projeto e instale a pasta `_netecmt` na raiz.
2.  Abra o arquivo: `_netecmt/core/config.yaml`.
3.  Verifique se o `project_type` está como `greenfield` (padrão):

```yaml
# _netecmt/core/config.yaml
project_type: greenfield
```

## 2. Fluxo Natural da Metodologia

Diferente do Brownfield, você não tem pedágios de documentação legada. O fluxo segue a ordem natural de valor:

### Passo 1: Descoberta (Opcional, mas recomendado)
Fale com o **Wilder (Analista)** para validar a ideia antes de escrever requisitos.
- `[BP] Guided Project Brainstorming`: Para clarear a visão do produto.
- `[PB] Create a Product Brief`: Resuma a proposta de valor.

### Passo 2: Planejamento (Obrigatório)
Ative o **Iuran (Product Manager)** para formalizar o que será construído.
- `[PR] Create PRD`: Defina Requisitos Funcionais e Não-Funcionais.
- `[HO] Handoff PRD to Architect`: Passe o plano para o técnico.

### Passo 3: Solução Técnica
Ative o **Athos (Architect)** para desenhar o sistema.
- `[CA] Create Architecture Document`: Decida tecnologias e padrões.
- `[HO] Handoff Arch to SM`: Passe o plano técnico para o SM organizar as sprints.

### Passo 4: Operacionalização das Sprints
Ative a **Leticia (Scrum Master)**.
- `[SP] Generate sprint-status.yaml`: Quebre a arquitetura em Epics e Stories.
- `[CS] Create Story`: Gere a primeira história "Ready-for-Dev".
- `[HO] Handoff Story to Dev`: Envie o pacote de contexto para o desenvolvedor.

### Passo 5: Desenvolvimento Guiado por Testes (TDD)
Ative o **Darllyson (Developer)**.
- `[DS] Execute Dev Story workflow`: Ele escreverá os testes primeiro e depois o código.

---

## 3. Resumo de Comandos Rápidos na CLI

Estes são os atalhos que você usará no dia a dia:

| Agente | Comando | Objetivo |
| :--- | :--- | :--- |
| **Iuran** | `*PR` | Criar o PRD inicial. |
| **Athos** | `*CA` | Definir a arquitetura do zero. |
| **Leticia** | `*CS` | Criar histórias de usuário. |
| **Darllyson**| `*DS` | Iniciar a codificação. |
| **Dandara** | `*QA` | Validar a qualidade das histórias prontas. |

---

## 4. Dicas de Ouro para Projetos Novos

1.  **Use o Handoff desde o dia 1:** Mesmo sem código legado, o comando `[HO]` garante que o desenvolvedor receba apenas o que está no PRD e na Arquitetura, evitando "chutes".
2.  **Não subestime o Athos:** Em Greenfield, é tentador ir direto pro código. Mas rodar o `[CA]` do Athos primeiro economiza refatorações no futuro.
3.  **Gatekeeper de Sprint:** A Leticia não deixará você criar Stories se o Athos não tiver aprovado a Arquitetura. Siga a ordem!

---
*NETECMT v2.0 | Da Ideia ao Código com Máxima Integridade*
