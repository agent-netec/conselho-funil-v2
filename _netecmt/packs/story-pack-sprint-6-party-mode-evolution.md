# 📦 Story Pack: Sprint 6 - Party Mode Evolution & Governance

**Status:** Draft 🟠  
**Sprint:** 6 (Following Audit V6.0)  
**Épicos:** E20 (Multi-Agent Orchestration), E18 (Governance Hardening)  
**Responsável:** Leticia (SM)

---

## 🎯 Objetivo
Evoluir o sistema de **Party Mode** para suportar deliberações complexas entre múltiplos agentes, ao mesmo tempo que resolvemos os débitos técnicos de arquitetura e segurança identificados na auditoria do Conselho (Athos/Iuran).

---

## 📝 User Stories

### US-6.1: Refatoração de Helpers Core (Audit Gap #1) ✅ [DONE]
**Como** arquiteto, **quero** extrair funções redundantes como `buildBrandContextForFunnel` das rotas de API para módulos utilitários, **para** garantir DRY e facilitar a manutenção do Party Mode.
- **Critérios de Aceite:**
    - [x] Mover helpers de prompt de `app/src/pages/api/funnels/generate.ts` (ou similar) para `app/src/lib/ai/formatters.ts`.
    - [x] Garantir que o Party Mode utilize estes formatadores centralizados.
    - [x] Remover redundâncias em rotas de chat.
- **Responsável:** Darllyson (Dev)
- **Status:** ✅ Concluído (12/01/2026)

### US-6.2: Hardening de Segurança - Admin Knowledge (Audit Gap #2)
**Como** sistema, **quero** garantir que as rotas de ingestão de conhecimento (`api/admin/*`) possuam verificações de role robustas, **para** evitar vazamento de dados durante sessões de Party Mode.
- **Critérios de Aceite:**
    - Revisar middleware/verificações de segurança em todas as rotas sob `/api/admin/`.
    - Implementar log de auditoria para ações administrativas realizadas via Party Mode (se aplicável).
- **Responsável:** Monara (Integrator) / Dandara (QA)

### US-6.3: Expansão de Deliberação Multi-Persona
**Como** usuário, **quero** que o debate entre agentes no Party Mode considere o contexto cruzado entre as especialidades (ex: Copy citando Funil), **para** gerar recomendações mais holísticas.
- **Critérios de Aceite:**
    - Atualizar `buildPartyPrompt` para incluir instruções de "Cross-Reference" entre agentes.
    - [x] Melhorar o parser visual para destacar interações diretas entre conselheiros (ex: "Concordo com o Dan Kennedy...").
- **Responsável:** Athos (Arch) / Darllyson (Dev)

### US-6.4: UI: Visualização de Interação Agente-Agente ✅ [DONE]
**Como** usuário, **quero** visualizar as conexões e o fluxo de debate entre os conselheiros, **para** entender como eles colaboraram na resposta final.
- **Critérios de Aceite:**
    - [x] Implementar detecção automática de menções no `party-parser`.
    - [x] Exibir um resumo do "Fluxo de Debate" no topo da resposta do conselho.
    - [x] Adicionar indicadores de fluxo e cross-reference em cada seção de agente.
    - [x] Estilizar badges de menções com ícones e transições visuais.
- **Responsável:** Victor/Beto
- **Status:** ✅ Concluído (12/01/2026)

---

## 🛠️ Contratos Técnicos
- **Lane Architecture**: Refatoração de `lib/ai/formatters`.
- **Lane Security**: Revisão de Auth em rotas serverless.
- **Docs de Referência**: 
    - `@_netecmt/audit-results.md`
    - `@_netecmt/docs/party-mode.md`

---

## 🏁 Readiness Checklist (Leticia)
- [ ] Gaps de Auditoria mapeados (US-6.1, US-6.2).
- [ ] Objetivo de Expansão definido (US-6.3).
- [ ] Contratos de refatoração validados pelo Athos.
- [ ] Sprint Status atualizado.

**Ação:** Time, foco total em limpar a casa (US-6.1/6.2) antes de avançar na inteligência do debate (US-6.3).
