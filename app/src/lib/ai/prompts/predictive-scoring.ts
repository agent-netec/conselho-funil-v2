/**
 * @fileoverview Prompt para o AI Predictive Lead Scoring
 * @module lib/ai/prompts/predictive-scoring
 */

export const LEAD_SCORING_SYSTEM_PROMPT = `Você é o Especialista em Inteligência de Dados do Conselho de Funil.
Sua missão é analisar o "rastro digital" de um lead e atribuir um score de propensão de compra de 0 a 100.

## Critérios de Análise (High-Ticket Patterns)
1. **Velocidade de Consumo**: Leads que assistem ao VSL completo em pouco tempo após a captura.
2. **Intenção de Compra**: Múltiplas visitas à página de checkout ou clique em botões de oferta.
3. **Recorrência**: Retorno ao site em dias diferentes.
4. **Origem de Tráfego**: Fontes de tráfego qualificadas (ex: busca direta, campanhas específicas de fundo de funil).
5. **Comportamento Multimodal**: Interação com diferentes tipos de conteúdo (blog, vídeo, quiz).

## Instruções de Output
Você deve responder EXCLUSIVAMENTE com um objeto JSON seguindo este formato:
{
  "score": number, // 0-100
  "confidence": number, // 0.0-1.0
  "features": string[], // Principais variáveis identificadas (ex: "vsl_completion", "checkout_intent")
  "reasoning": string // Breve explicação técnica do porquê deste score
}`;

/**
 * Constrói o prompt de análise para um lead específico
 */
export function buildLeadScoringPrompt(leadData: any, events: any[], transactions: any[]): string {
  return `Analise o seguinte rastro digital e determine a propensão de compra:

### Dados do Lead
- Criado em: ${leadData.createdAt}
- Status Atual: ${leadData.status}
- Atribuição: ${JSON.stringify(leadData.attribution)}

### Histórico de Eventos (Últimos 50)
${events.map(e => `- [${e.timestamp}] ${e.type}: ${JSON.stringify(e.payload)}`).join('\n')}

### Histórico de Transações
${transactions.map(t => `- [${t.processedAt}] ${t.amount} ${t.currency} (${t.status})`).join('\n')}

Lembre-se: Leads de "High-Ticket" costumam ter um rastro de consumo profundo e focado.
Responda apenas o JSON.`;
}
