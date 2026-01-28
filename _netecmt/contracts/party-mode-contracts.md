# Contrato: Party Mode & Orquestração Multi-Agente

**Lane:** AI / Orchestration  
**Status:** 🟠 Draft  
**Versão:** 1.0.0

## 1. Payload de Comunicação (API)

### 1.1. Request Metadata
```typescript
{
  "mode": "party",
  "agents": ["russell_brunson", "dan_kennedy"], // IDs conforme COUNSELORS_REGISTRY
  "options": {
    "intensity": "debate" | "consensus", // Debate foca em divergências, Consensus em acordo
    "max_turns": 1 // Para V1, apenas uma rodada de deliberação
  }
}
```

### 1.2. Response Metadata
```typescript
{
  "metadata": {
    "isPartyMode": true,
    "activeAgents": ["russell_brunson", "dan_kennedy"],
    "moderatorVerdict": "snippet_of_conclusion"
  }
}
```

## 2. Formato de Saída (Markdown Protocol)
A resposta gerada DEVE seguir rigorosamente este formato para parsing no frontend:

```markdown
### 🎙️ Deliberação do Conselho

**[NOME_AGENTE_1]**: Minha perspectiva sobre o problema. @NOME_AGENTE_2, você concorda com a viabilidade técnica disso?

**[NOME_AGENTE_2]**: Em resposta a @NOME_AGENTE_1, acredito que...

---
### ⚖️ Veredito do Moderador
Resumo final consolidando as citações e definindo o plano de ação.
```

## 3. Lógica de Referência (Cross-Agent Mentions - CAM)
- **Sintaxe**: Uso obrigatório de `@[ID_DO_AGENTE]` para citações diretas.
- **Rastreabilidade**: O sistema de logs deve extrair essas menções para criar um grafo de dependências da decisão.
- **Interrupção de Fluxo**: Se um agente marcar outro com uma pergunta direta, o moderador prioriza a resposta desse agente no próximo turno (se aplicável).
