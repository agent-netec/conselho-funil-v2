/**
 * Briefing Prompt Builder
 *
 * Monta o prompt para o Gemini gerar as seções do briefing
 * a partir dos dados completos da campanha.
 */

import { CampaignContext } from '@/types/campaign';

const BRIEFING_SYSTEM_PROMPT = `Você é um estrategista de marketing sênior da MKTHONEY, a plataforma de IA para planejamento de campanhas digitais.

Sua tarefa é gerar um BRIEFING ESTRATÉGICO COMPLETO a partir dos dados de uma campanha que passou por 5 estágios de planejamento (funil, copywriting, social media, design e ads).

REGRAS:
- Escreva TUDO em português brasileiro
- Seja analítico e estratégico, NÃO faça dump de dados — interprete, conecte e recomende
- Use linguagem profissional mas acessível
- Cada campo string deve ter 1-2 frases CURTAS e diretas (máximo 50 palavras por campo)
- O executionRoadmap deve ter exatamente 5 passos práticos
- O riskAnalysis deve ter exatamente 3 riscos e 3 mitigações correspondentes
- Responda APENAS com o JSON, sem markdown, sem comentários

FORMATO DE SAÍDA (JSON):
{
  "executiveSummary": "string — resumo executivo da campanha em 3-4 frases",
  "strategicContext": {
    "audience": "string — análise do público-alvo",
    "market": "string — contexto de mercado e oportunidades",
    "positioning": "string — posicionamento da marca/oferta",
    "objective": "string — objetivo central e KPIs esperados"
  },
  "funnelStrategy": {
    "type": "string — tipo de funil e por que foi escolhido",
    "architecture": "string — arquitetura e fluxo do funil",
    "stages": "string — análise dos estágios e pontos de conversão",
    "conversionPath": "string — caminho de conversão otimizado"
  },
  "offerAnalysis": {
    "promise": "string — análise da promessa principal",
    "differentiator": "string — diferenciais competitivos",
    "scoringRationale": "string — justificativa do score da oferta"
  },
  "copyStrategy": {
    "bigIdea": "string — análise da big idea e seu poder persuasivo",
    "toneAnalysis": "string — tom de comunicação e adequação ao público",
    "headlines": "string — análise das headlines e potencial de conversão",
    "persuasionFramework": "string — framework de persuasão aplicado"
  },
  "socialStrategy": {
    "platformBreakdown": "string — análise por plataforma social",
    "hookAnalysis": "string — análise dos hooks e gatilhos de atenção",
    "contentHighlights": "string — destaques do plano de conteúdo",
    "viralPotential": "string — potencial viral e estratégias de amplificação"
  },
  "designDirection": {
    "visualIdentity": "string — direção visual e identidade",
    "colorPsychology": "string — psicologia das cores aplicada",
    "assetRecommendations": "string — recomendações para criativos"
  },
  "adsStrategy": {
    "channelAllocation": "string — alocação de canais e priorização",
    "budgetRationale": "string — racional do budget sugerido",
    "audienceTargeting": "string — estratégia de segmentação",
    "benchmarks": "string — benchmarks e metas de performance"
  },
  "executionRoadmap": ["passo 1", "passo 2", "passo 3", "passo 4", "passo 5"],
  "riskAnalysis": {
    "risks": ["risco 1", "risco 2", "risco 3"],
    "mitigations": ["mitigação 1", "mitigação 2", "mitigação 3"]
  }
}`;

export function buildBriefingPrompt(campaign: CampaignContext, brandName: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  const sections: string[] = [
    `# Dados da Campanha: "${campaign.name}"`,
    `Marca: ${brandName}`,
    '',
  ];

  if (campaign.funnel) {
    sections.push(
      '## 1. FUNIL',
      `- Tipo: ${campaign.funnel.type}`,
      `- Arquitetura: ${campaign.funnel.architecture}`,
      `- Público-alvo: ${campaign.funnel.targetAudience}`,
      `- Objetivo principal: ${campaign.funnel.mainGoal}`,
      `- Estágios: ${campaign.funnel.stages?.join(' → ') || 'N/A'}`,
      `- Resumo: ${campaign.funnel.summary}`,
      '',
    );
  }

  if (campaign.offer) {
    sections.push(
      '## 1.5. OFERTA',
      `- Nome: ${campaign.offer.name}`,
      `- Promessa: ${campaign.offer.promise}`,
      `- Score: ${campaign.offer.score}/100`,
      '',
    );
  }

  if (campaign.copywriting) {
    sections.push(
      '## 2. COPYWRITING',
      `- Big Idea: ${campaign.copywriting.bigIdea}`,
      `- Tom: ${campaign.copywriting.tone}`,
      `- Headlines: ${campaign.copywriting.headlines?.join(' | ') || 'N/A'}`,
      `- Script principal: ${campaign.copywriting.mainScript?.slice(0, 500) || 'N/A'}`,
      `- Benefícios-chave: ${campaign.copywriting.keyBenefits?.join(', ') || 'N/A'}`,
      '',
    );
  }

  if (campaign.social) {
    const hookTexts = campaign.social.hooks?.map(h =>
      typeof h === 'string' ? h : h.content
    ).join(' | ') || 'N/A';

    sections.push(
      '## 3. SOCIAL MEDIA',
      `- Tipo de campanha: ${campaign.social.campaignType}`,
      `- Plataformas: ${campaign.social.platforms?.join(', ') || 'N/A'}`,
      `- Hooks: ${hookTexts}`,
      `- Gatilhos virais: ${campaign.social.viralTriggers?.join(', ') || 'N/A'}`,
      '',
    );
  }

  if (campaign.design) {
    sections.push(
      '## 4. DESIGN',
      `- Estilo visual: ${campaign.design.visualStyle}`,
      `- Cores: ${campaign.design.preferredColors?.join(', ') || 'N/A'}`,
      `- Aspect ratios: ${campaign.design.aspectRatios?.join(', ') || 'N/A'}`,
      `- Prompts visuais: ${campaign.design.visualPrompts?.join(' | ') || 'N/A'}`,
      `- Assets gerados: ${campaign.design.assetsUrl?.length || 0}`,
      '',
    );
  }

  if (campaign.ads) {
    sections.push(
      '## 5. ADS & TRÁFEGO',
      `- Canais: ${campaign.ads.channels?.join(', ') || 'N/A'}`,
      `- Audiências: ${campaign.ads.audiences?.join(', ') || 'N/A'}`,
      `- Budget sugerido: ${campaign.ads.suggestedBudget || 'A definir'}`,
      `- CPC alvo: ${campaign.ads.performanceBenchmarks?.targetCPC || 'N/A'}`,
      `- CTR alvo: ${campaign.ads.performanceBenchmarks?.targetCTR || 'N/A'}`,
      `- CPA alvo: ${campaign.ads.performanceBenchmarks?.targetCPA || 'N/A'}`,
      '',
    );
  }

  sections.push(
    '',
    'Gere o briefing estratégico completo em JSON seguindo EXATAMENTE o formato especificado no system prompt.',
  );

  return {
    systemPrompt: BRIEFING_SYSTEM_PROMPT,
    userPrompt: sections.join('\n'),
  };
}
