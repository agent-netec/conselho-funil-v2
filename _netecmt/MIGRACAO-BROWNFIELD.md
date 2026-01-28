# 🏚️ Guia de Migração: Legado BMAD para NETECMT v2.0 (Brownfield)

Este guia detalha o processo para usuários que possuem projetos existentes (com ou sem a estrutura antiga da BMAD) e desejam adotar a metodologia **NETECMT v2.0** no modo **Brownfield**.

## 1. Configuração Inicial do Ambiente

O primeiro passo é inicializar a estrutura NETECMT no seu projeto legado usando o CLI:

```bash
# Se estiver dentro da pasta do projeto
netecmt init . --brownfield

# Ou apontando para a pasta
netecmt init minha-pasta-legada --brownfield
```

> [!NOTE]
> Este comando irá copiar a pasta `_netecmt` e configurar o `project_type` como `brownfield` automaticamente.

## 2. O Fluxo Obrigatório de Inicialização

Diferente de projetos novos (Greenfield), o modo Brownfield possui uma trava de segurança. Você **não pode** planejar novas funcionalidades sem antes documentar o que já existe.

### Passo B: Documentação do Código Legado (Obrigatório)
Ative o agente **Wilder (Analista)** para mapear o projeto. Sem isso, os agentes de planejamento não terão contexto sobre seu código real.

**Comando na CLI:**
```bash
netecmt project document
```

> [!IMPORTANT]
> Este comando gera o `project-context.md`. Ele é o bloqueio de segurança: o Iuran não aceitará um novo PRD se o Wilder não tiver documentado o legado primeiro.

### Passo C: Mapeamento de MCPs e CLIs (Novo)
Nesta fase, você deve catalogar quais ferramentas externas (CLIs do sistema, MCPs do Cursor) o projeto utiliza ou precisará utilizar.

1. **Inventário**: Liste as CLIs (ex: docker, aws, git) e MCPs (ex: memory, search, postgres).
2. **Dependências**: Verifique se faltam chaves (`.env`), autenticações ou permissões.
3. **Documentação de Liberação**: Para cada ferramenta, crie um arquivo em `_netecmt/docs/tools/[nome-da-ferramenta].md` com a lista de comandos e exemplos de uso.
4. **Atribuição**: Defina qual agente (Darllyson, Athos, Monara) terá permissão para usar cada ferramenta.

> [!TIP]
> Use o agente **Monara (Integrador)** para validar se as chaves de API estão configuradas corretamente antes de tentar rodar qualquer comando.

---

## 3. Comandos e Fluxo de Trabalho por Agente

Uma vez que o projeto está documentado, siga esta ordem para implementar mudanças:

### 1. Iuran (Product Manager) - Planejamento
Após o Wilder terminar, vá até o Iuran para definir o que será alterado.
**Comando na CLI:**
```bash
netecmt prd create
```
*   **Handoff**: Envie o PRD para o arquiteto.

### 2. Athos (Architect) - Desenho da Solução
O Athos garantirá que a nova ideia não quebre o código antigo.
- `[CA] Create Architecture Document`: Desenhe a solução técnica.
- `[HO] Handoff Arch to SM`: Envie a arquitetura para o Scrum Master.

### 3. Leticia (Scrum Master) - Organização
- `[SP] Generate sprint-status.yaml`: Transforme o plano em tarefas.
- `[CS] Create Story`: Prepare uma história específica para o desenvolvedor.
- `[HO] Handoff Story to Dev`: Envie o "Story Pack" para o Darllyson.

### 4. Darllyson (Developer) - Execução
- `[DS] Execute Dev Story workflow`: Inicie a codificação guiada por testes.
- `[HO] Handoff to QA`: Finalizou? Envie para a Dandara (QA).

---

## 4. Resumo de Comandos Rápidos (BMM-Style)

Se você preferir chamar os workflows diretamente ou via atalhos:

| Agente | Comando | Ação no Modo Brownfield |
| :--- | :--- | :--- |
| **Wilder** | `*DP` | **Obrigatório:** Gera a documentação do código legado. |
| **Iuran** | `*PR` | Define as mudanças (bloqueado se Wilder não rodar). |
| **Athos** | `*CA` | Resolve conflitos arquiteturais entre o novo e o velho. |
| **Leticia** | `*HO` | Empacota o contexto do legado + nova story para o Dev. |
| **Darllyson**| `*DS` | Implementa a mudança respeitando o `project-context.md`. |

---

## 5. Dicas de Ouro para Usuários Brownfield

1.  **Não pule o Wilder:** Se você tentar "forçar" (`--force`) o Iuran a começar sem o Wilder, ele terá alucinações sobre como seu código atual funciona.
2.  **Mantenha a Bíblia atualizada:** Se você fizer grandes mudanças manuais fora da NETECMT, rode o `[DP]` do Wilder novamente para atualizar o `project-context.md`.
3.  **Handoff é Contexto:** O comando `[HO]` é vital no Brownfield pois ele seleciona apenas as partes do código antigo que o Desenvolvedor precisa ver, economizando tokens e aumentando a precisão.

---
*NETECMT v2.0 | Rigor Metodológico para Sistemas Legados*
