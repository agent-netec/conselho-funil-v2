/**
 * Sprint O — O-1: Deep Research Task Templates
 * Pre-configured research templates that adjust depth, sources, and prompts.
 */
import type { ResearchTemplate, ResearchTemplateId } from '@/types/research';

export const RESEARCH_TEMPLATES: Record<ResearchTemplateId, ResearchTemplate> = {
  audience_analysis: {
    id: 'audience_analysis',
    label: 'Análise de Audiência',
    description: 'Analise a voz ativa do público: dores, desejos, perguntas e gatilhos de compra.',
    icon: 'Users',
    defaultDepth: 'deep',
    defaultSources: ['YouTube', 'Instagram', 'Reddit', 'Forums'],
    promptHint: 'Foque em comentários reais, linguagem do público, objeções e desejos expressos nas redes sociais.',
  },
  competitor_analysis: {
    id: 'competitor_analysis',
    label: 'Análise de Concorrente',
    description: 'Mapeie estratégias, pontos fortes e fracos de concorrentes específicos.',
    icon: 'Crosshair',
    defaultDepth: 'deep',
    defaultSources: ['Sites', 'LinkedIn', 'Reclame Aqui', 'Redes Sociais'],
    promptHint: 'Analise posicionamento, pricing, estratégia de conteúdo, e presença digital dos concorrentes.',
  },
  trends: {
    id: 'trends',
    label: 'Tendências',
    description: 'Descubra tendências emergentes e oportunidades de mercado.',
    icon: 'TrendingUp',
    defaultDepth: 'standard',
    defaultSources: ['Google Trends', 'Twitter/X', 'Newsletters', 'Reports'],
    promptHint: 'Foque em tendências de busca, padrões de crescimento e sinais fracos que indicam oportunidades.',
  },
  product_research: {
    id: 'product_research',
    label: 'Pesquisa de Produto',
    description: 'Avalie a viabilidade e posicionamento de um produto ou serviço.',
    icon: 'Package',
    defaultDepth: 'standard',
    defaultSources: ['Product Hunt', 'G2', 'Capterra', 'AppStore'],
    promptHint: 'Analise reviews, features mais valorizadas, lacunas de mercado e modelos de precificação.',
  },
  niche_mapping: {
    id: 'niche_mapping',
    label: 'Mapeamento de Nicho',
    description: 'Mapeie o ecossistema completo de um nicho: players, públicos, canais e oportunidades.',
    icon: 'Map',
    defaultDepth: 'deep',
    defaultSources: ['Google', 'YouTube', 'Redes Sociais', 'Marketplaces'],
    promptHint: 'Mapeie os principais players, tamanho de mercado, sub-nichos lucrativos e canais de distribuição.',
  },
  custom: {
    id: 'custom',
    label: 'Pesquisa Personalizada',
    description: 'Configure manualmente todos os parâmetros da pesquisa.',
    icon: 'Settings',
    defaultDepth: 'standard',
    defaultSources: [],
    promptHint: '',
  },
};

export const TEMPLATE_LIST = Object.values(RESEARCH_TEMPLATES).filter(t => t.id !== 'custom');
