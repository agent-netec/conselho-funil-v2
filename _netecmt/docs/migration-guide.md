# Guia de Upgrade: NETECMT para NETECMT (Manual)

O NETECMT funciona perfeitamente de forma manual através dos documentos de governança e regras do Cursor (.mdc).

---

## 🛠️ Passo 1: Transplante de Pastas
Copie as seguintes pastas para o seu projeto:
1. `_netecmt/bmm/agents/`: Dandara, Victor, etc.
2. `_netecmt/docs/`: Spec Mestra, Workflow, etc.
3. `_netecmt/contracts/`: Contratos de Lane.

---

## 🛡️ Passo 2: O "Policial" (Cursor Rules)
Crie `.cursor/rules/netecmt-manual.mdc` e force a IA a ler o `_netecmt/docs/netecmt-master-spec.md` antes de qualquer alteração de código.

---

## 🔄 Passo 3: Execução Manual
1. **Brainstorm**: Chame o PM (`@Iuran`).
2. **Contrato**: Peça ao `@Athos` para criar a Lane em `_netecmt/contracts/`.
3. **Execution**: Peça ao `@Darllyson` para codar seguindo estritamente a Story e o Contrato.

---
*NETECMT: Alta Precisão por Design.*
