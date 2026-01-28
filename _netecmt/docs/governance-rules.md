# Governança Avançada e Regras Operacionais NETECMT

Este documento estabelece as leis de convivência e operação do ecossistema, definindo responsabilidades claras e fluxos de exceção para garantir a integridade do projeto.

---

## 🏗️ 1. O Início do Projeto: Quem faz o quê?

Todo projeto NETECMT nasce de uma estrutura de **Governança Primeiro**.

1.  **Fundação (Lanes/Contracts)**: O **Athos (Architect)** é o responsável por definir as Lanes e criar os Contratos iniciais no `contract-map.yaml`. Sem isso, o Darllyson não consegue codificar.
2.  **Branding e Estética**: O **Victor (UI Designer)** define os Design Tokens antes da implementação da UI. O não cumprimento da **Diretiva Victor** bloqueia o mergulho na Story.
3.  **Configuração da CLI**: O **Monara (System Integrator)** é o único com permissão para editar os arquivos da pasta `netecmt-cli/` e `_netecmt/netecmt/commands.yaml`. 
4.  **Dependências e Segurança**: O **Darllyson (Developer)** verifica as dependências e o **Dandara (QA)** valida o scan do Snyk.

---

## 🧩 2. Integrações, MCPs e Especialistas

### O Papel de Leo e Luke (Third-Party Specialists)
- **Leo e Luke** são os especialistas em **integrações com terceiros (API, SDKs, Auth)**.
- **Responsabilidade**: Eles criam os adaptadores e garantem que o sistema externo seja "domado".
- **Permissão**: Eles podem ler a Arquitetura e o PRD, mas devem pedir permissão ao **Athos (Architect)** se a integração exigir uma mudança na estrutura do banco de dados ou em contratos de outras Lanes.

### Gestão de MCPs (Model Context Protocol)
- **Quem comanda**: O **Monara (Integrator)** é o responsável por instalar e configurar novos MCPs.
- **Quem usa**: Todos os agentes podem "chamar" MCPs, mas o acesso deve ser explicitado no arquivo de ativação do agente.
- **Armazenamento**: MCPs e suas chaves devem ser salvos em ambientes seguros (`.env`), nunca na pasta `_netecmt` pública.

---

## 🚧 3. Fluxos de Exceção e Disciplina

### Pular Etapas (Skip Policy)
- **O que acontece**: Se alguém pula uma etapa (ex: codar sem Story), a **Leticia (SM)** gera um alerta de bloqueio.
- **Responsável**: O usuário é o juiz final, mas o **Monara (Integrator)** deve marcar o drift no `audit:sprint`.
- **Como corrigir**: Deve-se retroceder, documentar o que foi feito em uma Story retroativa e validá-la.
- **Drift Visual**: Se o QA detectar uso de cores ou fontes fora dos tokens, a Story volta para "Implementing" imediatamente.

### Debugging e Troubleshooting
- **Regra**: Bugs fatais geram **Stories de Bugfix**. Problemas menores são tratados como **Tasks** dentro da Story atual.
- **O Conselho**: Se o time entrar em loop de erro, o **Iuran (PM)** deve "Chamar o Conselho" (Party Mode) para reavaliar a estratégia.

---

## 📈 4. Evolução do Escopo (Mid-Project)

### Adicionar Funcionalidades
1.  **Iuran (PM)** cria um novo PRD ou adiciona uma nova Epic.
2.  **Athos (Architect)** revisa se a nova funcionalidade quebra contratos existentes.
3.  **Leticia (SM)** atualiza o `sprint-status.yaml`.

### Projetos Existentes (Brownfield)
- **Migração de Sprint**: Não se refaz a sprint inteira. Começa-se a metodologia na **próxima Story**.
- **Mapeamento**: O Athos deve mapear o código antigo como a Lane `legacy` e criar contratos de interface para que o código novo possa interagir com ele sem se contaminar.

---

## 📑 5. Resumo de Permissões (Matriz de Responsabilidade)

| Recurso | Dono (Owner) | Consultor |
| :--- | :--- | :--- |
| **CLI / Netecmt-cli** | Monara | User |
| **Arquitetura / Lanes** | Athos | Iuran |
| **Stories / Sprints** | Leticia | Darllyson |
| **Terceiros / APIs** | Leo / Luke | Athos |
| **Design Visual / CSS** | Victor | Beto |
| **Qualidade Final / QA** | Dandara | Segundinho |
| **Dependências** | Darllyson | Segundinho (TEA) |

---

## 🔄 6. Ciclo de Vida: Aceleração
O NETECMT adiciona o passo de **Aceleração**, que é o uso da CLI para automatizar o que antes era feito manualmente através de prompts. A regra é: **"Se o CLI faz, não peça para o agente fazer via chat."**
