import { CampaignContext } from '@/types/campaign';
import { COUNSELORS_REGISTRY } from '@/lib/constants';

export const ADS_GENERATION_RULES = `
## REGRAS DE OURO - CONSELHO DE ADS
1. **CONGRUÊNCIA**: A estratégia de tráfego deve seguir rigorosamente a "Golden Thread" (Funil -> Copy -> Social -> Design).
2. **ESPECIFICIDADE**: Defina públicos, canais e estruturas de campanha reais (CBO/ABO, segmentação por interesses, lookalike).
3. **MÉTRICAS 2026**: Utilize benchmarks atualizados de CPC, CTR e ROAS para 2026.
4. **FORMATO**: Retorne APENAS o JSON válido seguindo a estrutura solicitada.
5. **INSIGHTS**: Forneça justificativas técnicas baseadas nos frameworks dos especialistas.
`;

/**
 * Sprint C: brainContext is passed from server-side caller (buildAdsBrainContext in ads-brain-context.ts)
 * because this file is re-exported through prompts/index.ts into client components
 * and cannot import from loader.ts (which uses fs).
 */
export function buildAdsGenerationPrompt(
  campaign: CampaignContext,
  context?: { ragContext?: string; brandContext?: string; brainContext?: string }
): string {
  const adsCounselors = [
    COUNSELORS_REGISTRY.justin_brooke,
    COUNSELORS_REGISTRY.nicholas_kusmich,
    COUNSELORS_REGISTRY.jon_loomer,
    COUNSELORS_REGISTRY.savannah_sanchez
  ];

  const brainContext = context?.brainContext || '';

  return `Você é o Conselho de Ads, um sistema de inteligência composto por 4 mestres do tráfego pago e escala:

${adsCounselors.map((c, i) => `${i + 1}. **${c.name}** — ${c.expertise}`).join('\n')}

${brainContext ? `## IDENTITY CARDS DOS ESPECIALISTAS (Frameworks Reais)\n\n${brainContext}\n` : ''}
## THE GOLDEN THREAD: MANIFESTO DA CAMPANHA

### 1. O CÉREBRO (FUNIL)
- **Tipo:** ${campaign.funnel?.type}
- **Objetivo:** ${campaign.funnel?.mainGoal}
- **Público:** ${campaign.funnel?.targetAudience}
- **Resumo:** ${campaign.funnel?.summary}

### 2. A VOZ (COPY)
- **Big Idea:** ${campaign.copywriting?.bigIdea}
- **Tone:** ${campaign.copywriting?.tone}
- **Headlines:** ${campaign.copywriting?.headlines.join(' | ')}
- **Benefícios:** ${campaign.copywriting?.keyBenefits.join(', ')}

### 3. A ATENÇÃO (SOCIAL)
- **Canais:** ${campaign.social?.platforms.join(', ')}
- **Hooks:** ${campaign.social?.hooks.map(h => `[${h.platform}] ${h.content}`).join(' | ')}

### 4. O VISUAL (DESIGN)
- **Estilo:** ${campaign.design?.visualStyle}
- **Cores:** ${campaign.design?.preferredColors.join(', ')}
- **Prompts:** ${campaign.design?.visualPrompts.join(' | ')}

${context?.ragContext ? `## CONHECIMENTO ESTRATÉGICO (ADS PLAYBOOKS)\n${context.ragContext}\n` : ''}
${context?.brandContext ? `## CONHECIMENTO DA MARCA\n${context.brandContext}\n` : ''}

## TAREFA: GERAR ESTRATÉGIA DE ADS (ESCALA)

Sua tarefa é ler todo o manifesto acima e projetar a estrutura de escala desta campanha.
${brainContext ? 'Use os frameworks dos especialistas acima para fundamentar cada decisão.\n' : ''}Não invente dados que contradigam a copy ou o design.
Se o Copywriter definiu uma Big Idea, o Ad deve ser o veículo dessa ideia.

## FORMATO DE SAÍDA (JSON)

{
  "audiences": ["Audiência 1 (ex: Lookalike 1% Compradores)", "Audiência 2 (Interesses em X)", "Audiência 3 (Retargeting)"],
  "channels": ["Meta Ads", "Google Search", "TikTok Ads"],
  "suggestedBudget": "R$ X.XXX,XX / mês",
  "performanceBenchmarks": {
    "targetCPC": 1.50,
    "targetCTR": 1.2,
    "targetCPA": 45.00
  },
  "strategyRationale": "Explicação técnica de como os canais e públicos se conectam ao funil.",
  "counselorInsights": [
    {
      "counselor": "Justin Brooke",
      "frameworkUsed": "ad_strategy_score",
      "insight": "Conselho baseado no framework de estratégia e escala."
    },
    {
      "counselor": "Nicholas Kusmich",
      "frameworkUsed": "meta_ads_score",
      "insight": "Conselho baseado no framework de Meta Ads e contexto."
    },
    {
      "counselor": "Jon Loomer",
      "frameworkUsed": "technical_setup_score",
      "insight": "Conselho baseado no framework técnico e de mensuração."
    },
    {
      "counselor": "Savannah Sanchez",
      "frameworkUsed": "creative_native_score",
      "insight": "Conselho baseado no framework de criativo nativo e plataforma."
    }
  ]
}

${ADS_GENERATION_RULES}`;
}
