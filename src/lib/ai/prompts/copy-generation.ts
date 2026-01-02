import type { Funnel, Proposal, CopyType } from '@/types/database';
import { COPY_COUNSELORS } from '@/lib/constants';

export const COPY_RULES = `
## REGRAS IMPORTANTES

1. Retorne APENAS o JSON válido, sem markdown code blocks
2. Use o português brasileiro
3. Seja específico para o contexto deste funil
4. Aplique os princípios dos copywriters mencionados
5. Scores do scorecard devem ser realistas (6-9 range típico)
6. O campo "primary" deve conter a copy principal ou resumo
7. Inclua insights de pelo menos 2 copywriters relevantes`;

export const COPY_TYPE_INSTRUCTIONS: Record<CopyType, string> = {
  headline: `
## INSTRUÇÕES ESPECÍFICAS - HEADLINES

Gere 5 headlines para este funil, seguindo as regras de Gary Halbert e Eugene Schwartz:

1. **Headline Principal** - A mais forte, com curiosidade + benefício específico
2. **Headline de Dor** - Foca na dor do prospect
3. **Headline de Benefício** - Foca no benefício transformacional
4. **Headline de Prova** - Inclui número ou prova social
5. **Headline de Urgência** - Cria senso de urgência

Para cada headline:
- Use especificidade (números, prazos, valores)
- Desperte curiosidade
- Corresponda ao estágio de consciência do prospect
- Máximo 15 palavras

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Headlines - Nome do Funil",
  "primary": "Headline principal aqui",
  "variations": ["Headline 2", "Headline 3", "Headline 4", "Headline 5"],
  "structure": {
    "headline": "Headline principal",
    "subheadline": "Subheadline de apoio"
  },
  "reasoning": "Explicação estratégica",
  "copywriterInsights": [
    {"copywriterId": "gary_halbert", "copywriterName": "Gary Halbert", "expertise": "Headlines & Psicologia", "insight": "Insight específico"},
    {"copywriterId": "eugene_schwartz", "copywriterName": "Eugene Schwartz", "expertise": "Consciência de Mercado", "insight": "Insight específico"}
  ],
  "scorecard": {
    "headlines": 8, "structure": 7, "benefits": 8, "offer": 7, "proof": 6, "overall": 7.2
  }
}`,

  email_sequence: `
## INSTRUÇÕES ESPECÍFICAS - SEQUÊNCIA DE EMAILS

Gere uma sequência de 5 emails de follow-up, seguindo as regras de Dan Kennedy e Frank Kern:

1. **Email 1 (Dia 0)** - Entrega + Abertura de loop
2. **Email 2 (Dia 1)** - Aprofunda o problema
3. **Email 3 (Dia 3)** - Apresenta a solução
4. **Email 4 (Dia 5)** - Prova social + Urgência
5. **Email 5 (Dia 7)** - Última chamada

Para cada email:
- Subject line que gera curiosidade
- Corpo conversacional e autêntico
- CTA claro
- Transições suaves (Sugarman)

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Sequência de Emails - Nome do Funil",
  "primary": "Visão geral da sequência",
  "emails": [
    {"day": 0, "subject": "Subject 1", "preheader": "Preheader", "body": "Corpo...", "cta": "CTA", "goal": "Objetivo"},
    ...
  ],
  "reasoning": "Explicação da estratégia",
  "copywriterInsights": [...],
  "scorecard": {
    "headlines": 8, "structure": 8, "benefits": 7, "offer": 8, "proof": 7, "overall": 7.6
  }
}`,

  offer_copy: `
## INSTRUÇÕES ESPECÍFICAS - COPY DE OFERTA

Gere a copy completa da oferta, seguindo as regras de Dan Kennedy e Joseph Sugarman:

Estrutura:
1. Abertura, 2. Problema, 3. Agitação, 4. Solução, 5. Benefícios, 6. Prova, 7. Oferta, 8. Bônus, 9. Garantia, 10. Urgência, 11. CTA

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Oferta - Nome do Funil",
  "primary": "Copy completa (markdown)",
  "structure": {
    "headline": "...", "subheadline": "...", "bullets": [...], "cta": "...", "guarantee": "...", "urgency": "...", "proof": "..."
  },
  "reasoning": "...",
  "copywriterInsights": [...],
  "scorecard": {
    "headlines": 7, "structure": 9, "benefits": 8, "offer": 9, "proof": 7, "overall": 8.0
  }
}`,

  vsl_script: `
## INSTRUÇÕES ESPECÍFICAS - SCRIPT DE VSL

Gere um script de VSL (Video Sales Letter), seguindo as regras de Joseph Sugarman e John Carlton:
Estrutura: Hook, Problema, Agitação, Credenciais, Solução, Benefícios, Prova, Oferta, Bônus, Garantia, Urgência, CTA.

## FORMATO DE RESPOSTA (JSON)

{
  "name": "VSL Script - Nome do Funil",
  "primary": "Resumo do VSL",
  "vslSections": [
    {"order": 1, "name": "Hook", "duration": "0-30s", "content": "...", "notes": "..."}
  ],
  "reasoning": "...",
  "copywriterInsights": [...],
  "scorecard": {
    "headlines": 8, "structure": 9, "benefits": 8, "offer": 8, "proof": 7, "overall": 8.0
  }
}`,

  ad_creative: `
## INSTRUÇÕES ESPECÍFICAS - COPY DE ANÚNCIOS

Gere copy para 5 variações de anúncios (Meta/Instagram), seguindo as regras de Gary Halbert e Drayton Bird:
Variações: 1. Dor, 2. Benefício, 3. Curiosidade, 4. Prova Social, 5. Urgência.

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Anúncios - Nome do Funil",
  "primary": "Visão geral",
  "variations": ["🔥 [Hook Dor]\\n\\n[Body]\\n\\n👉 [CTA]", ...],
  "structure": { "headline": "...", "cta": "..." },
  "reasoning": "...",
  "copywriterInsights": [...],
  "scorecard": {
    "headlines": 9, "structure": 7, "benefits": 8, "offer": 7, "proof": 7, "overall": 7.6
  }
}`,

  landing_page: `
## INSTRUÇÕES ESPECÍFICAS - COPY DE LANDING PAGE

Gere a estrutura de copy para landing page ( David Ogilvy e Joseph Sugarman).
Seções: Above the Fold, Problema, Solução, Benefícios, Como Funciona, Prova Social, FAQ, Oferta, Garantia, CTA Final.

## FORMATO DE RESPOSTA (JSON)

{
  "name": "Landing Page - Nome do Funil",
  "primary": "Copy completa (markdown)",
  "structure": { ... },
  "reasoning": "...",
  "copywriterInsights": [...],
  "scorecard": {
    "headlines": 8, "structure": 9, "benefits": 8, "offer": 8, "proof": 8, "overall": 8.2
  }
}`
};

export function buildCopyPrompt(
  funnel: Funnel,
  proposal: Proposal,
  copyType: CopyType,
  awarenessInfo: { label: string; description: string; copyLength: string }
): string {
  const copywriters = Object.values(COPY_COUNSELORS);
  
  return `Você é o Conselho de Copywriting, um sistema de inteligência composto por 9 mestres do copywriting de resposta direta:

${copywriters.map((c, i) => `${i + 1}. **${c.name}** — ${c.expertise}: ${c.specialty}`).join('\n')}

## CONTEXTO DO FUNIL

**Empresa:** ${funnel.context.company}
**Mercado:** ${funnel.context.market}
**Objetivo:** ${funnel.context.objective}

**Audiência:**
- Quem: ${funnel.context.audience.who}
- Dor: ${funnel.context.audience.pain}
- Nível de Consciência: ${awarenessInfo.label} (${awarenessInfo.description})
${funnel.context.audience.objection ? `- Objeção: ${funnel.context.audience.objection}` : ''}

**Oferta:**
- Produto: ${funnel.context.offer.what}
- Ticket: ${funnel.context.offer.ticket}
- Tipo: ${funnel.context.offer.type}

**Canal Principal:** ${funnel.context.channel?.main || funnel.context.channels?.primary || 'Não especificado'}

## PROPOSTA DE FUNIL APROVADA

**Nome:** ${proposal.name}
**Resumo:** ${proposal.summary}

**Etapas do Funil:**
${proposal.architecture?.stages?.map((s, i) => `${i + 1}. ${s.name} — ${s.objective || ''}`).join('\n') || 'Não especificado'}

## TAREFA

Gere ${copyType} para este funil.

**Estágio de Consciência do Mercado:** ${awarenessInfo.label}
- ${awarenessInfo.description}
- Comprimento de copy recomendada: ${awarenessInfo.copyLength}

${COPY_TYPE_INSTRUCTIONS[copyType]}

${COPY_RULES}`;
}

