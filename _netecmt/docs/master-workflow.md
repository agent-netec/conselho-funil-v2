# Guia Mestre: Workflow e Integração com Cursor Rules (NETECMT)

Este documento é o manual definitivo de **Execução Passo a Passo**. Ele transforma a teoria da governança em ações práticas dentro do Cursor, utilizando o poder dos arquivos `.mdc`.

---

## 🔄 1. O Ciclo Perpétuo de 5 Etapas (BMM-OS)

Para cada funcionalidade ou épico, o workflow **DEVE** seguir esta ordem:

1.  **Exploração (Discovery)**: Chamada do Wilder/Iuran para entender o problema.
    - *Saída:* `product-brief.md` e `research.md`.
2.  **Definição (Analysis)**: Criação do PRD formal passo a passo.
    - *Saída:* `_netecmt/planning/prd.md` (com stepsCompleted).
3.  **Desenho (Solutioning)**: Chamada do Athos/Beto para arquitetura e UX.
    - *Ação Victor:* Refinamento Visual e Tokens de Design.
    - *Saída:* `_netecmt/solutioning/architecture.md` e Styleguide.
4.  **Preparação (Orchestration)**: Chamada da Leticia para criar Story Packs.
    - *Saída:* `_netecmt/implementation/stories/story-xxx.md`.
5.  **Execução (Execution)**: Chamada do Darllyson/Terceirinho para código.
    - *Ação Dandara:* Validação final de QA antes do encerramento.
    - *Saída:* Código validado, testes e `audit:sprint`.

---

## 🚫 2. Proibições e Portões (The Council's Gates)

Para evitar que o projeto colapse, estas regras são **inquebráveis**:

### 🛑 PROIBIÇÕES (NUNCA faça):
- **Copa do Mundo sem Treino**: NUNCA escreva código sem uma Story válida em estado `ready`.
- **Arquitetura Invisível**: NUNCA altere arquivos de uma Lane sem atualizar o contrato em `_netecmt/contracts/`.
- **Salto Temporal**: NUNCA pule do PRD direto para o Código.
- **Batatada de Contexto**: NUNCA carregue o projeto inteiro (`CTRL/CMD + A`) para o chat.

### 🛡️ OS PORTÕES DE QUALIDADE (GATES):

| De → Para | Portão | Quem Valida? | Critério de Sucesso |
| :--- | :--- | :--- | :--- |
| **Analysis → Solutioning** | **PRD Sign-off** | Iuran (PM) | Todas as FRs e NFRs estão mapeadas. |
| **Solutioning → Orchestration** | **Architecture Audit** | Athos (Arch) | Sem dependências circulares entre Lanes. |
| **Orchestration → Execution** | **Definition of Ready**| Leticia (SM) | Story com Lane, Contrato e Mocks definidos. |
| **Execution → Quality Gate**| **QA Validation** | Dandara (QA) | Todos os ACs aprovados via navegador/código. |
| **Execution → Complete** | **Contract Drift Check** | Monara (INT) | `audit:sprint` reporta 0 desvios. |

### ⚠️ AVISOS E BOAS PRÁTICAS:
- **Commits Atômicos**: Cada Task de uma Story deve gerar um commit/checkpoint próprio.
- **Sync OBRIGATÓRIO**: Mudou a implementação de um contrato? Execute o workflow `sync-contracts` imediatamente.
- **Handoff Darllyson (Dev) → Dandara (QA)**: "Dandara, a implementação da Story X foi concluída. Por favor, valide os ACs (critérios de aceitação) e verifique se o visual está fiel ao Styleguide do Victor."
- **Handoff Dandara (QA) → Segundinho (TEA)**: "Segundinho, a funcionalidade passou no QA funcional. Por favor, finalize os testes E2E baseando-se no relatório de validação em `@_netecmt/implementation/qa/report.md`."
- **Ambiguidade**: Se a Story tiver menos de 3 Acceptance Criteria (ACs), a Leticia deve bloqueá-la.

---

## 🛠️ 3. Integração com Cursor Rules (`.mdc`)

O segredo para o Cursor seguir o workflow é usar os arquivos de regra (.mdc).

### Como Configurar:
1.  Crie o arquivo `.cursor/rules/netecmt-governance.mdc`.
2.  Adicione as seguintes instruções de **globs**:
    - `globs: **/*`
    - `alwaysApply: true`

### Conteúdo Mandatório da Regra:
```markdown
# Regra de Governança NETECMT

Sempre que o usuário pedir uma tarefa, verifique:
1. Em qual etapa estamos? (Discovery, Analysis, Solutioning, Implementation).
2. Existe um documento de saída para a etapa anterior?
3. Se o usuário pedir CÓDIGO, exija o caminho da Story: `@_netecmt/implementation/stories/story-xxx.md`.
4. Se a Story não existir, chame a Leticia (SM) automaticamente.
```

---

## 📋 4. O "Passo-a-Passo" do Novo Projeto

1.  **Inite a CLI**: `npx netecmt init <project-name>`.
2.  **Aponte o Cursor**: Abra a pasta e crie a regra `.mdc` citada acima.
3.  **Ative o Iuran**: Peça: "Iuran, inicie o workflow de PRD para o projeto [Nome]."
4.  **Siga os micro-passos**: A IA dirá "[C] Continue". Só digite 'C' quando ler e concordar com o que foi gerado.
5.  **Valide o Contrato**: Antes do primeiro byte de código, peça ao Athos: "Crie o mapa de contratos inicial".

---

## 💡 5. Sugestão Extra: O "Modo de Emergência"
Adicione uma regra de **"Stop & Review"**. Se a IA errar 3 vezes a mesma coisa, o workflow deve exigir que você apague os arquivos temporários e reinicie o passo atual do workflow.
