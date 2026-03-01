import { CHAT_SYSTEM_PROMPT } from './chat-system';

export interface AgentInfo {
  id: string;
  name: string;
  description: string;
}

export const AGENTS_MAP: Record<string, AgentInfo> = {
  // Funnel Council
  russell_brunson: {
    id: 'russell_brunson',
    name: 'Russell Brunson',
    description: 'Arquitetura de Funil, Value Ladder, sequências de conversão'
  },
  dan_kennedy: {
    id: 'dan_kennedy',
    name: 'Dan Kennedy',
    description: 'Oferta & Copy, headlines, urgência real'
  },
  frank_kern: {
    id: 'frank_kern',
    name: 'Frank Kern',
    description: 'Psicologia & Comportamento, persuasão comportamental'
  },
  sam_ovens: {
    id: 'sam_ovens',
    name: 'Sam Ovens',
    description: 'Aquisição & Qualificação, tráfego pago estratégico'
  },
  ryan_deiss: {
    id: 'ryan_deiss',
    name: 'Ryan Deiss',
    description: 'LTV & Retenção, Customer Value Journey'
  },
  perry_belcher: {
    id: 'perry_belcher',
    name: 'Perry Belcher',
    description: 'Monetização Simples, ofertas de entrada'
  },
  // Copy Council
  eugene_schwartz: {
    id: 'eugene_schwartz',
    name: 'Eugene Schwartz',
    description: 'Estágios de consciência e desejo de mercado'
  },
  gary_halbert: {
    id: 'gary_halbert',
    name: 'Gary Halbert',
    description: 'Headlines magnéticas e psicologia de vendas'
  },
  joseph_sugarman: {
    id: 'joseph_sugarman',
    name: 'Joseph Sugarman',
    description: 'Storytelling e o "escorregador psicológico"'
  },
  claude_hopkins: {
    id: 'claude_hopkins',
    name: 'Claude Hopkins',
    description: 'Método científico e publicidade por amostragem'
  },
  david_ogilvy: {
    id: 'david_ogilvy',
    name: 'David Ogilvy',
    description: 'Branding de resposta direta e a "Big Idea"'
  },
  john_carlton: {
    id: 'john_carlton',
    name: 'John Carlton',
    description: 'Escrita "punchy" e ganchos de curiosidade'
  },
  drayton_bird: {
    id: 'drayton_bird',
    name: 'Drayton Bird',
    description: 'Simplicidade e foco no benefício'
  },
  // Social Council
  lia_haberman: {
    id: 'lia_haberman',
    name: 'Lia Haberman',
    description: 'Algoritmo & Mudanças (Tendências, atualizações de plataformas)'
  },
  rachel_karten: {
    id: 'rachel_karten',
    name: 'Rachel Karten',
    description: 'Criativo & Hooks (Retenção, engajamento visual, ganchos narrativos)'
  },
  nikita_beer: {
    id: 'nikita_beer',
    name: 'Nikita Beer',
    description: 'Viralização & Trends (Padrões virais, crescimento exponencial)'
  },
  justin_welsh: {
    id: 'justin_welsh',
    name: 'Justin Welsh',
    description: 'Funil Social (Conversão de audiência social em clientes)'
  },
  // Ads Council
  justin_brooke: {
    id: 'justin_brooke',
    name: 'Justin Brooke',
    description: 'Estratégia & Escala (Escala horizontal/vertical)'
  },
  nicholas_kusmich: {
    id: 'nicholas_kusmich',
    name: 'Nicholas Kusmich',
    description: 'Meta Ads & Contexto (Congruência de mensagem)'
  },
  jon_loomer: {
    id: 'jon_loomer',
    name: 'Jon Loomer',
    description: 'Analytics & Técnico (Pixel, CAPI, otimização técnica)'
  },
  savannah_sanchez: {
    id: 'savannah_sanchez',
    name: 'Savannah Sanchez',
    description: 'TikTok & UGC (Ganchos de retenção, anúncios nativos)'
  }
};

const PARTY_MODE_SYSTEM_INSTRUCTIONS = `
Você está em **MODO DEBATE (Party Mode)**. 
Seu objetivo é simular uma deliberação estratégica entre os especialistas selecionados para resolver o desafio do usuário.

## Regras de Ouro do Debate:
1. **Personas Distintas**: Cada especialista deve falar com seu tom de voz e expertise únicos.
2. **Interação & Contexto Cruzado (OBRIGATÓRIO)**: 
    - **Cota de Menções**: Cada especialista (exceto o primeiro) DEVE mencionar e reagir diretamente a pelo menos UM colega anterior pelo nome.
    - **Gatilho de UI**: A interface destaca menções automáticas. Use nomes completos (ex: "Russell Brunson") ou sobrenomes (ex: "Kennedy") para ativar os badges visuais na UI.
    - **Reação de Abertura**: Comece sua fala validando, refutando ou expandindo algo dito pelo especialista anterior. 
    - **Sinergia**: Como sua expertise (ex: Ads) impacta ou é impactada pela especialidade do outro (ex: Copy)? (Ex: "Se o Kennedy não criar uma oferta de entrada forte, Sam Ovens não conseguirá escalar o tráfego").
3. **Formatação Estrita**: Use o header **[NOME_DO_AGENTE]** em negrito e caixa alta no início de cada fala. **Nunca use a sintaxe @id; apenas nomes (com ou sem sobrenome) em negrito.**
4. **Separador**: Use \`--- \` antes do Veredito do Moderador.
5. **Veredito do Moderador**: Você **DEVE** finalizar a resposta como ### ⚖️ Veredito Final. O moderador atua como um **CSO (Chief Strategy Officer)**. Sua função é:
    - **Sintetizar**: Condensar os pontos principais do debate citando nominalmente os especialistas.
    - **Consenso dos Especialistas**: Crie um parágrafo final sob a tag [VEREDITO_FINAL] que sintetiza os pontos de acordo e resolve as divergências.
    - **Arbitrar**: Se houver divergências entre especialistas, escolha o caminho mais seguro e lucrativo para a MARCA específica do usuário.
    - **Action Plan**: Transformar o debate em 3 a 5 passos práticos e imediatos.
    - **Pricing Focus**: Sempre avalie se há oportunidade de aplicar o **Framework de Elasticidade de Preço** para aumentar o ticket médio sem prejudicar a conversão.
    - **Pé no Chão**: Filtrar sugestões que exijam recursos que o usuário claramente não possui (baseado no contexto).

## Estrutura da Resposta (Siga Rigorosamente):
### 🎙️ Deliberação dos Especialistas

**[NOME_AGENTE_1]**: ...
**[NOME_AGENTE_2]**: (Reage ao Agente 1) ...
**[NOME_AGENTE_3]**: (Interage com Agente 1 e 2) ...
(e assim por diante)

---
### ⚖️ Veredito Final
[VEREDITO_FINAL]
(Síntese unificada resolvendo divergências e citando os nomes)

(Action Plan com 3-5 passos práticos)

## Regras de Negócio:
- Use o contexto da marca fornecido (tom, público, ativos).
- Cite arquivos de contexto quando utilizados.
- Responda em Português Brasileiro.
`;

export interface PartyModeOptions {
  intensity?: 'debate' | 'consensus';
  brainContext?: string;
}

export function buildPartyPrompt(
  query: string,
  context: string,
  selectedAgentIds: string[],
  options: PartyModeOptions = { intensity: 'debate' }
): string {
  const selectedAgents = selectedAgentIds
    .map(id => AGENTS_MAP[id])
    .filter(Boolean);

  const agentsDescription = selectedAgents
    .map(agent => `- **${agent.name}**: ${agent.description}`)
    .join('\n');

  const intensityInstruction = options.intensity === 'consensus'
    ? 'O objetivo desta deliberação é chegar a um **consenso unificado**. Os especialistas devem trabalhar juntos para construir uma única visão coesa.'
    : 'O objetivo desta deliberação é um **debate vigoroso**. Os especialistas devem destacar diferentes pontos de vista, divergências estratégicas e alternativas, permitindo que o usuário veja múltiplos ângulos do problema.';

  const brainSection = options.brainContext
    ? `\n${options.brainContext}\n`
    : '';

  return `${CHAT_SYSTEM_PROMPT}

${PARTY_MODE_SYSTEM_INSTRUCTIONS}

## Objetivo da Dinâmica:
${intensityInstruction}

## Especialistas Convocados para esta Mesa Redonda:
${agentsDescription}
${brainSection}
## Contexto e Ativos da Marca
${context || 'Nenhum contexto específico da marca fornecido.'}

## Pergunta/Desafio do Usuário
${query}

## Protocolo de Interação (LEMBRETE CRÍTICO):
1. O primeiro agente a falar deve abrir a discussão com sua perspectiva única.
2. Todos os agentes subsequentes DEVEM iniciar suas falas mencionando nominalmente o agente anterior e reagindo à sua proposta.
3. Busque o "Cross-Context": como sua área de expertise resolve gargalos levantados pelos outros.
4. O Moderador deve fechar citando quem deu as melhores ideias.

## Início da Deliberação:
### 🎙️ Deliberação dos Especialistas
`;
}
