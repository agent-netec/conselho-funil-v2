# 📦 Story Pack: Sprint 1.3 - Party Mode (Multi-Agent Deliberation)

**Status:** Ready for Dev 🟢  
**Sprint:** 1.3  
**Épicos:** E20 (Multi-Agent Orchestration), E17 (UX de Contexto)  
**Responsável:** Leticia (SM)

---

## 🎯 Objetivo
Implementar o sistema de "Mesa Redonda" do Conselho, permitindo que o usuário convoque múltiplos especialistas para um debate estratégico moderado, aumentando a profundidade das recomendações e o diferencial competitivo do SaaS.

---

## 📝 User Stories

### US-1.3.1: Orquestrador de Prompt "Debate Mode"
**Como** sistema, **quero** construir um prompt dinâmico que instrua o LLM a assumir múltiplas personas simultaneamente, **para** gerar uma deliberação entre especialistas com visões complementares ou divergentes.
- **Critérios de Aceite:**
    - Criar função `buildPartyPrompt` em `app/src/lib/ai/prompts/party-mode.ts`.
    - Injetar instruções de "Moderador" para fechar a conversa com um veredito.
    - Suportar a passagem de `selectedAgents` via payload da API.
- **Contrato:** `@_netecmt/contracts/party-mode-contracts.md`

### US-1.3.2: UI - Seletor Múltiplo de Conselheiros
**Como** usuário, **quero** escolher quais especialistas participarão da minha consulta, **para** ter controle sobre a mesa redonda estratégica.
- **Critérios de Aceite:**
    - Implementar componente `PartyAgentSelector` no `ChatInputArea`.
    - Permitir seleção de até 3 agentes simultâneos.
    - Exibir badges dos agentes selecionados de forma visual no input.
- **Responsável:** Beto/Victor (UX/UI)

### US-1.3.3: Parser Visual de Deliberação no Chat
**Como** usuário, **quero** que a resposta da IA seja formatada de forma que eu identifique claramente quem está falando, **para** facilitar a leitura do debate.
- **Critérios de Aceite:**
    - Atualizar `ChatMessageBubble` para detectar o padrão `**[NOME_DO_AGENTE]**`.
    - Aplicar cores e ícones correspondentes a cada seção da fala do agente.
    - Destacar visualmente o "Veredito do Moderador" no final da mensagem.
- **Responsável:** Darllyson (Dev)

### US-1.3.4: Persistência de Metadados de Party Mode
**Como** sistema, **quero** salvar quais agentes participaram de cada deliberação, **para** que o histórico da conversa reflita corretamente o contexto do debate.
- **Critérios de Aceite:**
    - Atualizar a função `addMessage` para suportar `partyAgents` nos metadados.
    - Garantir que ao recarregar a conversa, a UI mostre os badges dos agentes corretos.
- **Contrato:** `@_netecmt/contracts/party-mode-contracts.md`

---

## 🛠️ Contratos Técnicos (Athos/Monara)
- **Lanes:** AI Orchestration, Frontend Components, Firestore Schema.
- **Docs de Referência:** 
    - `@_netecmt/solutioning/tech-spec-party-mode.md`
    - `@_netecmt/contracts/party-mode-contracts.md`
- **Configuração:** O pipeline de RAG (V2) deve continuar funcionando como base, mas o Reranking agora deve priorizar chunks relacionados aos agentes selecionados.

---

## 🏁 Readiness Checklist (Leticia)
- [x] PRD Aprovado pelo Iuran.
- [x] Tech Spec validado pelo Athos.
- [x] Contratos de Party Mode definidos.
- [x] Estrutura de prompt de debate rascunhada.

**Ação:** Time, estamos liberados. **Athos**, comece com a **US-1.3.1** (Orquestrador de Prompt).
