# APC Engineering Standard

## 1. O Princípio da Precisão
Todo desenvolvimento no modo APC deve ser guiado por **Contexto de Precisão**. Isso significa que o agente de execução não deve carregar a "bíblia" do projeto, mas sim o **Story Pack** e o **Contrato da Lane** dentro do ecossistema NETECMT.

## 2. A Regra de Ouro do Drift
> **"Se o código muda comportamento, o Contrato muda primeiro."**

Qualquer Pull Request que altere a implementação funcional de uma lane **DEVE** incluir uma atualização correspondente no arquivo de contrato (`_netecmt/contracts/<lane>.md`).

## 3. Fluxo de Desenvolvimento
1.  **Discovery**: O PM/Analista cria a Story.
2.  **Contract Gate**: O workflow `create-story` valida se a interface (Contrato) está pronta.
3.  **Story Pack**: É gerado o pacote destilado para o desenvolvedor.
4.  **Execução**: O Dev implementa usando apenas o Pack.
5.  **Audit**: A auditoria automatizada valida o alinhamento entre código e contrato.

## 4. Governança (Kai)
O workflow `sprint-audit` (Kai) é o guardião da arquitetura. Ele tem autoridade para bloquear merges se detectar **CONTRACT_DRIFT**.

## 5. Estrutura de Diretórios (NETECMT Core)
- `_netecmt/contracts/`: Interfaces e definições de dados.
- `_netecmt/packs/`: Contexto destilado para execução.
- `_netecmt/core/contract-map.yaml`: Mapeamento de fronteiras.
- `_netecmt/reports/`: Evidências de auditoria.
