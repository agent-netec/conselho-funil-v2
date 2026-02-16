import type { Brand, Funnel, Proposal } from '@/types/database';

/**
 * Formatters for AI Prompt Context
 * Centralizes how data structures are presented to the LLM
 */

/**
 * Personality instructions mapped to AI profile presets.
 * Injected into prompts alongside voiceTone to guide generation style.
 * Sprint J-6: Brand Hub AI Config — personality is now textual, not just numbers.
 */
export const PERSONALITY_INSTRUCTIONS: Record<string, string> = {
  agressivo: 'Use headlines disruptivas e provocativas. CTAs diretos e urgentes. Desafie o status quo. Linguagem de impacto com frases curtas. Aposte em FOMO e escassez.',
  sobrio: 'Mantenha tom institucional e profissional. Priorize dados, fatos e credibilidade. Evite hipérboles, exclamações excessivas e promessas infladas. Clareza acima de tudo.',
  criativo: 'Explore metáforas, storytelling e ângulos inesperados. Surpreenda o leitor com analogias originais. Use humor quando apropriado. Busque o "fator WOW" em cada peça.',
  equilibrado: 'Balance criatividade com clareza. Tom conversacional mas informado. Headlines atraentes sem exagero. Persuasão sutil baseada em benefícios reais.',
};

/**
 * Returns the personality instruction for a brand's AI profile.
 * Falls back to empty string if no profile is set.
 */
export function getPersonalityInstruction(profile?: string): string {
  if (!profile) return '';
  return PERSONALITY_INSTRUCTIONS[profile] || '';
}

/**
 * Formats brand information for funnel generation prompts.
 * Includes specific instructions for the AI to follow the brand guidelines.
 */
export function formatBrandContextForFunnel(brand: Brand): string {
  return `## CONTEXTO DA MARCA (PRIORIDADE MÁXIMA)
**Marca:** ${brand.name}
**Vertical:** ${brand.vertical}
**Posicionamento:** ${brand.positioning}
**Tom de Voz:** ${brand.voiceTone}

### Público-Alvo da Marca
- **Perfil:** ${brand.audience.who}
- **Dor Principal:** ${brand.audience.pain}
- **Consciência:** ${brand.audience.awareness}
${brand.audience.objections.length > 0 ? `- **Objeções Conhecidas:** ${brand.audience.objections.join(', ')}` : ''}

### Oferta Principal
- **Produto/Serviço:** ${brand.offer.what}
- **Ticket:** R$ ${brand.offer.ticket.toLocaleString('pt-BR')}
- **Tipo:** ${brand.offer.type}
- **Diferencial Competitivo:** ${brand.offer.differentiator}

---

**INSTRUÇÕES IMPORTANTES:**
1. Todas as propostas DEVEM alinhar-se com o tom de voz "${brand.voiceTone}"
2. As headlines e copy DEVEM refletir o posicionamento da marca
3. O funil DEVE endereçar as objeções conhecidas do público
4. Use o diferencial competitivo como eixo central da estratégia
5. Considere o ticket de R$ ${brand.offer.ticket.toLocaleString('pt-BR')} ao sugerir estratégias de conversão

---
`;
}

/**
 * Formats brand information for general chat/counselor context.
 */
export function formatBrandContextForChat(brand: Brand): string {
  let context = `### Marca: ${brand.name}
- **Vertical**: ${brand.vertical}
- **Posicionamento**: ${brand.positioning}
- **Tom de Voz**: ${brand.voiceTone}

### Público-Alvo da Marca
- **Quem**: ${brand.audience.who}
- **Dor Principal**: ${brand.audience.pain}
- **Nível de Consciência**: ${brand.audience.awareness}
${brand.audience.objections.length > 0 ? `- **Objeções**: ${brand.audience.objections.join(', ')}` : ''}

### Oferta da Marca
- **Produto/Serviço**: ${brand.offer.what}
- **Ticket Médio**: R$ ${brand.offer.ticket.toLocaleString('pt-BR')}
- **Tipo**: ${brand.offer.type}
- **Diferencial**: ${brand.offer.differentiator}\n`;

  if (brand.brandKit) {
    const kit = brand.brandKit;
    context += `\n### BrandKit (Identidade Visual)
- **Estilo Visual**: ${kit.visualStyle}
- **Cores**: Primária: ${kit.colors.primary}, Secundária: ${kit.colors.secondary}, Accent: ${kit.colors.accent}, Background: ${kit.colors.background}
- **Tipografia**: Principal: ${kit.typography.primaryFont}, Secundária: ${kit.typography.secondaryFont} (Fallback: ${kit.typography.systemFallback})
- **Logo**: ${kit.logoLock.locked ? 'USAR APENAS LOGO OFICIAL (LOCKED)' : 'Permite variações'}
- **URL Logo Principal**: ${kit.logoLock.variants.primary.url}
${kit.logoLock.variants.horizontal ? `- **URL Logo Horizontal**: ${kit.logoLock.variants.horizontal.url}\n` : ''}${kit.logoLock.variants.icon ? `- **URL Ícone**: ${kit.logoLock.variants.icon.url}\n` : ''}`;
  }

  context += `\n**⚠️ IMPORTANTE:** Todas as respostas devem respeitar o tom de voz, posicionamento e contexto desta marca.`;
  return context;
}

/**
 * Formats funnel and its proposals for chat context.
 */
export function formatFunnelContextForChat(funnel: Funnel, proposals: Proposal[] = []): string {
  const ctx = funnel.context;
  const channel = ctx.channel?.main || ctx.channels?.primary || 'N/A';
  
  let context = `### Funil: ${funnel.name}
- **Status**: ${funnel.status}
- **Objetivo**: ${ctx.objective}
- **Empresa**: ${ctx.company}
- **Mercado**: ${ctx.market}

### Público-Alvo
- **Quem**: ${ctx.audience?.who || 'N/A'}
- **Dor**: ${ctx.audience?.pain || 'N/A'}
- **Nível de Consciência**: ${ctx.audience?.awareness || 'N/A'}

### Oferta
- **Produto**: ${ctx.offer?.what || 'N/A'}
- **Ticket**: ${ctx.offer?.ticket || 'N/A'}
- **Tipo**: ${ctx.offer?.type || 'N/A'}

### Canais
- **Principal**: ${channel}
`;

  if (proposals.length > 0) {
    context += `\n### Propostas Geradas (${proposals.length})\n`;
    proposals.slice(0, 2).forEach((p, i) => {
      const score = (p.scorecard as { overall?: number })?.overall || 'N/A';
      context += `\n**${i + 1}. ${p.name}** (Score: ${score})\n`;
      context += `- ${p.summary?.slice(0, 200) || 'Sem resumo'}...\n`;
      if (p.strategy?.risks?.length) {
        context += `- Riscos: ${p.strategy.risks.slice(0, 2).join(', ')}\n`;
      }
    });
  }

  return context;
}

/**
 * Parses JSON from a string that might be wrapped in markdown code blocks or contain extra text.
 */
export function parseAIJSON(text: string): any {
  let cleaned = text.trim();
  
  // Try to find a JSON block using regex
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch && jsonMatch[1]) {
    cleaned = jsonMatch[1].trim();
  } else {
    // If no code block, try to find the first '{' and last '}'
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }
  }
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse JSON. Original text:', text);
    console.error('Cleaned text:', cleaned);
    throw e;
  }
}
