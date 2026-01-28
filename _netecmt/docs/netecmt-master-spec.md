# Especificação Mestra: Ecossistema NETECMT

O **NETECMT** é um framework de governança e execução de software de alta precisão, focado em eliminar alucinações de IA e reduzir dramaticamente o desperdício de contexto (tokens).

---

## 🛡️ O Motor APC (Architecture of Precision Context)

O diferencial do NETECMT é o **Motor APC**, que substitui o acesso livre à base de código por uma estrutura de **Lanes** e **Contratos**.

### 🛣️ Lanes (Segmentação de Domínio)
O projeto é dividido em domínios estritos chamados Lanes (ex: `ui-components`, `business-logic`, `db-infrastructure`). 
- **Objetivo**: Garantir que cada tarefa tenha apenas o contexto estritamente necessário.
- **Vantagem**: Impede que a IA se confunda com arquivos irrelevantes para a tarefa atual.

### 📜 Contratos de Lane (A Constituição)
Cada Lane possui um contrato (`_netecmt/contracts/lane.md`) que define as regras do jogo.
- **Invariantes**: O que nunca muda.
- **Interfaces**: Como essa Lane fala com as outras.

---

## ⚖️ As Cinco Leis da Engenharia NETECMT

Para garantir a máxima precisão, todo projeto deve seguir estas diretrizes mandatórias:

1. **Desenvolvimento Baseado em Contratos (CBD)**: Nenhuma alteração de código é permitida sem que o contrato da Lane (`_netecmt/contracts/`) seja validado. O contrato é a ÚNICA fonte da verdade para interfaces.
2. **Isolamento de Contexto (Sharding)**: Agentes de execução operam estritamente com **Story Packs**. O vazamento de contexto global (context leakage) é considerado uma falha de governança.
3. **Diretiva Victor (Visual Wow)**: Toda UI deve seguir os **Design Tokens** centrais. Estilos ad-hoc ou desalinhados com o Brand Book são bloqueados no QA.
4. **Segurança Shift-Left**: O escaneamento de vulnerabilidades (`snyk_code_scan`) é parte integrante da definição de "Done" de cada Story.
5. **Governança de IA (Manual Rules)**: É obrigatório o uso das regras em `.cursor/rules/netecmt/` para garantir que os agentes operem sob a persona e o contexto de precisão corretos.

---

## 👥 Personas e Responsabilidades

| Agente | Papel | Responsabilidade Principal |
| :--- | :--- | :--- |
| **Wilder** | Analyst | Elicitação de requisitos brutos. |
| **Iuran** | PM | PRD e priorização de valor. |
| **Athos** | Architect | Definição de Lanes e Contratos. |
| **Leticia** | SM | Preparação de Story Packs isolados. |
| **Darllyson** | Dev | Implementação técnica de precisão. |
| **Victor** | UI Designer | Branding, CSS Tokens e Estética. |
| **Dandara** | QA | Qualidade e Experiência do Usuário. |
| **Monara** | Integrator | Auditoria de Drift e Integridade. |

---

## 🚀 Benefícios Técnicos

### 📉 Otimização de Custo (Tokens)
Redução de até **70% no consumo de tokens** por tarefa através do JIT Context.

### 🧠 Antialucinação Estrita
Menos ruído, ferramentas de auditoria e contratos estritos bloqueiam a invenção da IA.

---
*Este documento é a fonte da verdade para o ecossistema NETECMT.*
