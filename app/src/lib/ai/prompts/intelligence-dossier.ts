import { CompetitorTechStack, IntelligenceAsset } from '@/types/competitors';

/**
 * @fileoverview Prompts para geração de Dossiês de Inteligência Competitiva
 */

export const BUILD_DOSSIER_PROMPT = (
  competitorName: string,
  techStack: CompetitorTechStack,
  assets: IntelligenceAsset[]
) => {
  const assetsSummary = assets.map(a => `- [${a.pageType.toUpperCase()}] URL: ${a.url}`).join('\n');
  
  const techSummary = [
    techStack.cms ? `CMS: ${techStack.cms}` : null,
    techStack.analytics.length > 0 ? `Analytics: ${techStack.analytics.join(', ')}` : null,
    techStack.marketing.length > 0 ? `Marketing: ${techStack.marketing.join(', ')}` : null,
    techStack.payments.length > 0 ? `Payments: ${techStack.payments.join(', ')}` : null,
    techStack.infrastructure.length > 0 ? `Infrastructure: ${techStack.infrastructure.join(', ')}` : null,
  ].filter(Boolean).join('\n');

  return `
Você é um Analista de Inteligência Competitiva sênior. Sua tarefa é gerar um Dossiê Estratégico sobre o concorrente "${competitorName}".

### DADOS COLETADOS:
**Infraestrutura Técnica (Tech Stack):**
${techSummary || 'Nenhuma tecnologia detectada.'}

**Ativos de Funil Identificados:**
${assetsSummary || 'Nenhum ativo específico coletado.'}

### SUA TAREFA:
Gere uma análise profunda e estruturada em JSON seguindo exatamente o formato abaixo:

{
  "headline": "Uma frase que resume a estratégia principal deste concorrente",
  "offerType": "Tipo de oferta (ex: High Ticket Service, SaaS Subscription, Low Ticket Info-product)",
  "visualStyle": ["Lista de adjetivos sobre o estilo visual, ex: Minimalista, Agressivo, Corporativo"],
  "swot": {
    "strengths": ["Mínimo 3 forças baseadas na tech stack ou funil"],
    "weaknesses": ["Mínimo 3 fraquezas ou gaps identificados"],
    "opportunities": ["Mínimo 2 oportunidades para nossa marca superar este concorrente"],
    "threats": ["Mínimo 2 ameaças que este concorrente representa"]
  },
  "executiveSummary": "Um parágrafo de 3-4 linhas resumindo a maturidade digital e o foco de conversão deste concorrente."
}

### REGRAS CRÍTICAS:
1. Responda APENAS o JSON.
2. Seja específico. Se usam ActiveCampaign, fale sobre automação de e-mail. Se usam Hotmart, fale sobre foco em infoprodutos.
3. A análise deve ser em Português.
`;
};
