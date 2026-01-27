import { CompetitorTechStack } from '@/types/competitors';
import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Motor de descoberta de tecnologias (Tech Stack Discovery)
 * Responsável por analisar HTML e Headers para identificar ferramentas.
 */

export interface TechPattern {
  name: string;
  category: keyof Omit<CompetitorTechStack, 'updatedAt'>;
  patterns: (string | RegExp)[];
  type: 'script' | 'meta' | 'header' | 'dom';
}

export const TECH_PATTERNS: TechPattern[] = [
  // CMS
  {
    name: 'WordPress',
    category: 'cms',
    patterns: ['wp-content', 'wp-includes', '/wp-json/'],
    type: 'script',
  },
  {
    name: 'Webflow',
    category: 'cms',
    patterns: ['data-wf-page', 'data-wf-site'],
    type: 'dom',
  },
  // Analytics
  {
    name: 'GTM',
    category: 'analytics',
    patterns: ['googletagmanager.com/gtm.js', 'gtm.start'],
    type: 'script',
  },
  {
    name: 'Meta Pixel',
    category: 'analytics',
    patterns: ['connect.facebook.net/en_US/fbevents.js', 'fbq('],
    type: 'script',
  },
  {
    name: 'Hotjar',
    category: 'analytics',
    patterns: ['static.hotjar.com', 'hjid'],
    type: 'script',
  },
  // Marketing / CRM
  {
    name: 'ActiveCampaign',
    category: 'marketing',
    patterns: ['activecampaign.com', 'ac_enable_site_tracking'],
    type: 'script',
  },
  {
    name: 'Klaviyo',
    category: 'marketing',
    patterns: ['static.klaviyo.com', 'klaviyo.js'],
    type: 'script',
  },
  // Payments
  {
    name: 'Stripe',
    category: 'payments',
    patterns: ['js.stripe.com', 'stripe-checkout'],
    type: 'script',
  },
  {
    name: 'Hotmart',
    category: 'payments',
    patterns: ['hotmart.com', 'pay.hotmart.com'],
    type: 'script',
  },
  {
    name: 'Kiwify',
    category: 'payments',
    patterns: ['kiwify.com.br', 'pay.kiwify.com.br'],
    type: 'script',
  },
  {
    name: 'Eduzz',
    category: 'payments',
    patterns: ['eduzz.com', 'sun.eduzz.com'],
    type: 'script',
  },
  {
    name: 'TikTok Pixel',
    category: 'analytics',
    patterns: ['analytics.tiktok.com/i18n/pixel/sdk.js', 'ttq.load'],
    type: 'script',
  },
  {
    name: 'Google Ads',
    category: 'marketing',
    patterns: ['googleadservices.com/pagead/conversion.js', 'gtag(\'config\', \'AW-'],
    type: 'script',
  },
  // Infrastructure
  {
    name: 'Cloudflare',
    category: 'infrastructure',
    patterns: ['__cfduid', 'cf-ray', 'cloudflare'],
    type: 'header',
  },
];

export class TechStackDiscovery {
  /**
   * Analisa o HTML e Headers de uma página para descobrir a tech stack
   */
  static discover(html: string, headers: Record<string, string>): Partial<CompetitorTechStack> {
    const techStack: Partial<CompetitorTechStack> = {
      analytics: [],
      marketing: [],
      payments: [],
      infrastructure: [],
      updatedAt: Timestamp.now(),
    };

    for (const tech of TECH_PATTERNS) {
      let found = false;

      switch (tech.type) {
        case 'script':
        case 'dom':
        case 'meta':
          found = tech.patterns.some((pattern) => {
            if (typeof pattern === 'string') {
              return html.includes(pattern);
            }
            return pattern.test(html);
          });
          break;
        case 'header':
          found = tech.patterns.some((pattern) => {
            const headerValues = Object.values(headers).join(' ').toLowerCase();
            const headerKeys = Object.keys(headers).join(' ').toLowerCase();
            const combined = `${headerKeys} ${headerValues}`;
            
            if (typeof pattern === 'string') {
              return combined.includes(pattern.toLowerCase());
            }
            return pattern.test(combined);
          });
          break;
      }

      if (found) {
        if (tech.category === 'cms') {
          techStack.cms = tech.name;
        } else {
          const list = techStack[tech.category] as string[];
          if (!list.includes(tech.name)) {
            list.push(tech.name);
          }
        }
      }
    }

    return techStack;
  }
}
