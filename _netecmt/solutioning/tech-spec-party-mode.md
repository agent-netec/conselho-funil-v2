# Tech Spec: Multi-Agent Orchestration (Party Mode)

**Status:** Draft 📐  
**Responsável:** Athos (Arch)  
**Data:** 11/01/2026

## 1. Arquitetura de Orquestração

Para a V1 do Party Mode, utilizaremos o método **Single-Call Multi-Persona (SCMP)**. Este método é mais eficiente em termos de latência e custo do que múltiplas chamadas sequenciais.

### 1.1. O Prompt de Deliberação
O prompt será construído dinamicamente:
1.  **System**: Baseado no `CHAT_SYSTEM_PROMPT` mas com instruções de "Debate Mode".
2.  **Context**: Contexto RAG unificado (filtrado pelos agentes selecionados).
3.  **Instruction**: "Aja como os agentes [X, Y, Z]. Realize um debate sobre a pergunta do usuário. Termine com um Moderador dando o veredito."

## 2. Mudanças no Backend (`/api/chat`)

### 2.1. Payload da Requisição
```typescript
interface PartyChatRequest extends ChatRequest {
  partyMode: boolean;
  selectedAgents: string[]; // IDs dos conselheiros
}
```

### 2.2. Lógica de Prompting (Refatoração de `prompts/chat-system.ts`)
Criar `buildPartyPrompt(query, context, agents)`:
- Injeta as personas específicas de cada agente selecionado.
- **Protocolo CAM**: Adiciona instrução para que agentes usem `@[NOME_AGENTE]` ao referenciar colegas.
- Define o formato de saída: `[AGENTE 1] ... [AGENTE 2] ... [MODERADOR] ...`.

## 3. Mudanças no Frontend

### 3.1. Estado de Agentes
No `ChatPage`, adicionar estado para `selectedAgents`.
Integrar no `ChatInputArea` um seletor múltiplo (Popover com Checkbox).

### 3.2. Renderização
O `ChatMessageBubble` deve ser capaz de:
- Detectar os headers `[NOME_DO_AGENTE]` e aplicar estilos diferentes.
- **Highlight de Menções**: Parsear a sintaxe `@[NOME_AGENTE]` e renderizar como um `AgentBadge` clicável ou destacado.

## 4. Contratos de Dados (`_netecmt/contracts/party-mode.md`)
- Definir o formato de metadados das mensagens em Party Mode para persistência no Firestore.

## 5. Riscos Técnicos
- **Token Limit**: Respostas de múltiplos agentes são longas. *Mitigação*: Aumentar `maxOutputTokens` para 8192 no Gemini 2.0.
- **Confusão de Persona**: A IA misturar os estilos. *Mitigação*: Usar prompts de sistema extremamente rígidos com separadores claros.
