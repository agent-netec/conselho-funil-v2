# Workflow Avançado: Party Mode (Sessão de Deliberação NETECMT)

Este documento eleva o "Party Mode" de uma simples conversa para uma **Sessão de Deliberação Técnica**.

---

## ⚖️ 1. O Protocolo do "Alto Conselho"

Em sessões multi-agente, o conflito é esperado e saudável, mas precisa de resolução.

### A Regra do Desempate (Tie-breaker):
1.  **Exposição**: Os agentes em conflito (ex: Athos vs Darllyson) devem expor seus argumentos em bullet points de "Prós e Contras".
2.  **Facilitação**: O **Iuran (PM)** deve intervir para avaliar o impacto no negócio e no cronograma.
3.  **Veredito**: O **Usuário** é o juiz final. Se o usuário estiver indeciso, a recomendação do **Iuran (PM)** prevalece por ser o guardião do valor do produto.

### Proibições Criminais (Council's Prohibitions):
- 🛑 **Falar sobre o outro (Citações Obrigatórias)**: Agentes não devem ignorar uns aos outros. Eles DEVEM citar o nome do colega ao concordar ou discordar: "Dando continuidade ao que o Athos disse...".
- 💡 **Dica de UI**: O sistema agora possui badges automáticas de menção. Use o nome completo ou sobrenome do especialista para ativar o destaque visual na interface.
- 🛑 **Modificação Direta**: NENHUM agente pode modificar arquivos de código durante o Party Mode. O Party Mode serve para **DECIDIR**, não para **EXECUTAR**.
- 🛑 **Loop de Concordância**: É proibido que todos os agentes apenas concordem com o usuário. O Orquestrador tem o dever de pedir uma "Voz Contrariante" se houver consenso imediato.
- 🔄 **Cross-Reference**: Busque como sua especialidade resolve gargalos ou complementa a visão do especialista anterior.

---

## 🛠️ 2. Gestão de Ferramentas e MCPs

No Party Mode, o controle de ferramentas segue uma hierarquia:

- **Dono do MCP**: Somente o agente cuja especialidade toca o MCP deve usá-lo.
- **Evitar Duplicidade**: Se o Segundinho (TEA) já usou o MCP de busca no Google, o Wilder (Analyst) deve ler o log e não rodar a mesma busca.
- **Solicitação de Ferramenta**: Um agente pode pedir a outro: "Segundinho, use seu MCP de cobertura de testes para nos dar o dado real antes da decisão".

---

## 📄 3. O "Decision Memo" (Resultado Obrigatório)

Nenhuma sessão de Party Mode pode acabar sem um registro formal.

**Obrigação**: Ao digitar `exit` ou encerrar, deve-se gerar um resumo em: `_netecmt/solutioning/adr/ADR-XXX-decisao-party-mode.md`.

**Conteúdo do Memo**:
- **Data e Participantes**: Quem estava na sala.
- **O Conflito**: Qual era o dilema.
- **A Decisão**: O que foi escolhido.
- **Próximos Passos**: Qual agente recebeu a tarefa de execução.

---

## 🤖 4. Integração com Cursor Rules (`.mdc`)

### Arquivo: `.cursor/rules/netecmt-party-mode.mdc`
```markdown
# Regra de Execução: Party Mode (Multi-Persona)

Esta regra é ativada quando o usuário usa o comando `/party-mode` ou `*party-mode`.

## Filtro de Personas:
1. Quando em Party Mode, identifique o ID do agente no início de cada resposta (Ex: [ATHOS], [IURAN]).
2. Mantenha o Orquestrador como o mediador que decide quem fala a seguir.

## Restrições de Escrita:
1. BLOQUEIE qualquer tentativa de edição de código fonte durante esta sessão.
2. Apenas a criação de DOCUMENTAÇÃO (.md) é permitida.

## Handoff:
Sempre termine pedindo ao usuário o veredito final.
```

---
*Assinado: O Alto Conselho NETECMT.*
