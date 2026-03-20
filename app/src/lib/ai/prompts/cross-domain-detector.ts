// Sprint 05.7: Cross-domain detection for intelligent routing
// Analyzes message content to detect which domain(s) are most relevant

type Domain = 'funnel' | 'copy' | 'social' | 'ads' | 'design';

interface CrossDomainResult {
  primaryDomain: Domain | 'multi';
  secondaryDomains: Domain[];
  confidence: number;
  suggestedCounselor?: string;
  suggestedCounselorReason?: string;
}

// Keyword lists per domain — weighted by specificity
const DOMAIN_KEYWORDS: Record<Domain, { high: string[]; medium: string[] }> = {
  copy: {
    high: [
      'headline', 'copy', 'copywriting', 'vsl', 'script', 'email sequence',
      'landing page', 'carta de vendas', 'big idea', 'lead magnet',
      'subject line', 'assunto do email', 'body copy', 'cta',
      'call to action', 'storytelling', 'bullet points', 'garantia',
      'oferta irresistível', 'escassez', 'urgência', 'prova social',
      'consciência de mercado', 'awareness', 'schwartz', 'halbert',
      'ogilvy', 'sugarman', 'kennedy copy', 'direct response',
    ],
    medium: [
      'escrever', 'texto', 'mensagem', 'persuasão', 'convencer',
      'ângulo', 'gancho', 'argumento', 'benefício', 'promessa',
      'tom de voz', 'narrativa', 'emocional',
    ],
  },
  social: {
    high: [
      'instagram', 'tiktok', 'linkedin', 'twitter', 'reels', 'stories',
      'feed', 'carrossel', 'carousel', 'thread', 'viral', 'viralizar',
      'algoritmo', 'engajamento', 'alcance', 'seguidores', 'followers',
      'hook social', 'creator', 'influencer', 'ugc', 'conteúdo orgânico',
      'rachel karten', 'nikita beer', 'justin welsh', 'lia haberman',
      'hashtag', 'trending', 'trend',
    ],
    medium: [
      'conteúdo', 'postar', 'publicar', 'mídia social', 'redes sociais',
      'calendário editorial', 'frequência', 'crescimento', 'comunidade',
    ],
  },
  ads: {
    high: [
      'ads', 'anúncio', 'anúncios', 'meta ads', 'facebook ads', 'google ads',
      'tiktok ads', 'tráfego pago', 'mídia paga', 'cpc', 'cpa', 'roas',
      'roi', 'pixel', 'conversão', 'custo por clique', 'custo por aquisição',
      'orçamento de mídia', 'budget', 'escala', 'escalar campanha',
      'segmentação', 'targeting', 'lookalike', 'retargeting', 'remarketing',
      'justin brooke', 'nicholas kusmich', 'jon loomer', 'savannah sanchez',
      'criativo de anúncio', 'ad creative', 'display', 'search ads',
    ],
    medium: [
      'investimento', 'custo', 'plataforma', 'canal', 'audiência',
      'público frio', 'público quente', 'performance',
    ],
  },
  design: {
    high: [
      'design', 'visual', 'layout', 'tipografia', 'cores', 'paleta',
      'imagem', 'thumbnail', 'banner', 'criativo visual', 'direção de arte',
      'brand book', 'identidade visual', 'logo', 'fonte', 'estilo visual',
      'chapeu', 'c.h.a.p.e.u', 'contraste', 'hierarquia visual',
      'design director', 'diretor de design',
    ],
    medium: [
      'bonito', 'feio', 'template', 'mockup', 'aspecto', 'formato',
    ],
  },
  funnel: {
    high: [
      'funil', 'funnel', 'value ladder', 'etapa', 'estágio do funil',
      'topo do funil', 'meio do funil', 'fundo do funil', 'tofu', 'mofu', 'bofu',
      'lead', 'qualificação', 'conversão de lead', 'nurturing',
      'upsell', 'downsell', 'order bump', 'tripwire', 'front-end', 'back-end',
      'russell brunson', 'sam ovens', 'ryan deiss', 'perry belcher',
      'customer journey', 'jornada do cliente', 'ltv', 'retenção',
      'aquisição', 'churn', 'ativação',
    ],
    medium: [
      'estratégia', 'plano', 'fluxo', 'sequência', 'automação',
      'pipeline', 'ticket', 'high ticket', 'low ticket',
    ],
  },
};

// Cross-domain routing suggestions
const CROSS_DOMAIN_ROUTES: { from: Domain; to: Domain; counselor: string; reason: string }[] = [
  { from: 'copy', to: 'ads', counselor: 'nicholas_kusmich', reason: 'targeting de audiência para essa copy' },
  { from: 'copy', to: 'social', counselor: 'rachel_karten', reason: 'hooks para Instagram baseados nessa copy' },
  { from: 'funnel', to: 'design', counselor: 'design_director', reason: 'visual do funil e das páginas' },
  { from: 'funnel', to: 'copy', counselor: 'gary_halbert', reason: 'headlines para cada estágio do funil' },
  { from: 'ads', to: 'copy', counselor: 'gary_halbert', reason: 'copy mais forte para os anúncios' },
  { from: 'ads', to: 'social', counselor: 'savannah_sanchez', reason: 'criativos UGC para os ads' },
  { from: 'social', to: 'copy', counselor: 'eugene_schwartz', reason: 'estágio de consciência do público social' },
  { from: 'social', to: 'ads', counselor: 'justin_brooke', reason: 'escalar o conteúdo que já performa organicamente' },
  { from: 'design', to: 'copy', counselor: 'david_ogilvy', reason: 'alinhar copy com direção de arte' },
];

export function detectCrossDomain(message: string): CrossDomainResult {
  const lowerMessage = message.toLowerCase();
  const scores: Record<Domain, number> = {
    funnel: 0,
    copy: 0,
    social: 0,
    ads: 0,
    design: 0,
  };

  // Score each domain
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS) as [Domain, typeof DOMAIN_KEYWORDS[Domain]][]) {
    for (const kw of keywords.high) {
      if (lowerMessage.includes(kw)) scores[domain] += 3;
    }
    for (const kw of keywords.medium) {
      if (lowerMessage.includes(kw)) scores[domain] += 1;
    }
  }

  // Sort by score
  const sorted = (Object.entries(scores) as [Domain, number][])
    .sort((a, b) => b[1] - a[1])
    .filter(([, score]) => score > 0);

  if (sorted.length === 0) {
    return { primaryDomain: 'funnel', secondaryDomains: [], confidence: 0.3 };
  }

  const [primaryDomain, primaryScore] = sorted[0];
  const secondaryDomains = sorted.slice(1).filter(([, s]) => s >= 2).map(([d]) => d);

  // Multi-domain if second domain scores within 60% of primary
  const isMulti = sorted.length >= 2 && sorted[1][1] >= primaryScore * 0.6;
  const confidence = Math.min(1, primaryScore / 10);

  // Cross-domain routing suggestion
  let suggestedCounselor: string | undefined;
  let suggestedCounselorReason: string | undefined;

  if (secondaryDomains.length > 0) {
    const route = CROSS_DOMAIN_ROUTES.find(
      r => r.from === primaryDomain && secondaryDomains.includes(r.to)
    );
    if (route) {
      suggestedCounselor = route.counselor;
      suggestedCounselorReason = route.reason;
    }
  }

  return {
    primaryDomain: isMulti ? 'multi' : primaryDomain,
    secondaryDomains,
    confidence,
    suggestedCounselor,
    suggestedCounselorReason,
  };
}

/**
 * Builds a cross-domain hint to inject into the system prompt.
 * Called when detectCrossDomain() finds a secondary domain.
 */
export function buildCrossDomainHint(result: CrossDomainResult): string {
  if (!result.suggestedCounselor) return '';

  return `\n\n## Cross-Reference (OBRIGATÓRIO se relevante)
Se o tema tocar em ${result.secondaryDomains.join(' ou ')}, adicione no final da resposta:
"💬 Quer ouvir [nome do especialista] sobre ${result.suggestedCounselorReason}?"
O especialista sugerido é: ${result.suggestedCounselor}.
Inclua isso como um dos follow-ups [FOLLOW_UP].`;
}
