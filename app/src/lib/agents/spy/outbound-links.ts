/**
 * Outbound Links Extractor — Sprint 09.4
 * Extracts and classifies outbound links from scraped HTML content.
 */

export interface OutboundLink {
  url: string;
  text: string;
  type: 'checkout' | 'thank_you' | 'upsell' | 'whatsapp' | 'form' | 'blog' | 'social' | 'external';
}

const LINK_PATTERNS: { type: OutboundLink['type']; patterns: RegExp[] }[] = [
  {
    type: 'checkout',
    patterns: [
      /checkout|carrinho|cart|pay|comprar|compra|purchase|order/i,
      /hotmart\.com.*\/pay/i,
      /kiwify\.com.*\/pay/i,
      /eduzz\.com.*checkout/i,
      /stripe\.com/i,
    ],
  },
  {
    type: 'thank_you',
    patterns: [
      /obrigado|thank[-_]?you|sucesso|success|confirm/i,
    ],
  },
  {
    type: 'upsell',
    patterns: [
      /upsell|upgrade|oferta[-_]?especial|bump|order[-_]?bump/i,
    ],
  },
  {
    type: 'whatsapp',
    patterns: [
      /wa\.me|api\.whatsapp|whatsapp\.com|chat\.whatsapp/i,
    ],
  },
  {
    type: 'form',
    patterns: [
      /typeform\.com|tally\.so|forms\.gle|google.*forms|jotform|formstack/i,
    ],
  },
  {
    type: 'blog',
    patterns: [
      /\/blog\b|\/artigo|\/post\b|\/article/i,
    ],
  },
  {
    type: 'social',
    patterns: [
      /instagram\.com|facebook\.com|tiktok\.com|youtube\.com|linkedin\.com|twitter\.com|x\.com/i,
    ],
  },
];

function classifyUrl(url: string, anchorText: string): OutboundLink['type'] {
  const combined = `${url} ${anchorText}`;
  for (const { type, patterns } of LINK_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(combined)) return type;
    }
  }
  return 'external';
}

/**
 * Extract and classify outbound links from raw HTML.
 * Only returns links to different domains (outbound).
 */
export function extractOutboundLinks(html: string, sourceUrl: string): OutboundLink[] {
  let sourceDomain: string;
  try {
    sourceDomain = new URL(sourceUrl).hostname.replace(/^www\./, '');
  } catch {
    return [];
  }

  const linkRegex = /<a\s[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  const links: OutboundLink[] = [];

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(html)) !== null) {
    const rawHref = match[1];
    const anchorText = match[2].replace(/<[^>]*>/g, '').trim();

    // Resolve relative URLs
    let fullUrl: string;
    try {
      fullUrl = new URL(rawHref, sourceUrl).href;
    } catch {
      continue;
    }

    // Skip anchors, javascript, mailto
    if (fullUrl.startsWith('javascript:') || fullUrl.startsWith('mailto:') || fullUrl.startsWith('#')) continue;

    // Include both outbound AND same-domain funnel pages
    let linkDomain: string;
    try {
      linkDomain = new URL(fullUrl).hostname.replace(/^www\./, '');
    } catch {
      continue;
    }

    // Deduplicate
    const key = fullUrl.split('?')[0].split('#')[0];
    if (seen.has(key)) continue;
    seen.add(key);

    // Skip same-page anchors
    if (key === sourceUrl.split('?')[0].split('#')[0]) continue;

    const type = classifyUrl(fullUrl, anchorText);

    // For same-domain links, only include if they match a funnel pattern
    if (linkDomain === sourceDomain && type === 'external') continue;

    links.push({ url: fullUrl, text: anchorText || fullUrl, type });
  }

  return links.sort((a, b) => {
    const priority: Record<OutboundLink['type'], number> = {
      checkout: 0, upsell: 1, thank_you: 2, whatsapp: 3, form: 4, blog: 5, social: 6, external: 7,
    };
    return priority[a.type] - priority[b.type];
  });
}
