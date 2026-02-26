import type { Metadata } from 'next';
import {
  LandingNavbar,
  LandingHero,
  LandingPain,
  LandingSolution,
  LandingHowItWorks,
  LandingCouncil,
  LandingPricing,
  LandingFaq,
  LandingCta,
  LandingFooter,
} from '@/components/landing';

/**
 * Landing Page — R5.3
 *
 * Public landing page for non-authenticated users.
 * Uses MKTHONEY honey/gold color palette.
 * Follows structure from landpage-mkthoney-structure.md.
 */

// SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://mkthoney.com'),
  title: 'MktHoney — Sua Agência de Marketing com IA | 23 Conselheiros, 24/7',
  description:
    'MktHoney é a plataforma de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, análise competitiva e automação — tudo com a voz da sua marca, 24/7.',
  keywords: [
    'marketing com inteligência artificial',
    'agência de marketing IA',
    'automação de marketing',
    'marketing autônomo',
    'conselheiros de marketing IA',
    'funil de vendas IA',
    'plataforma de marketing SaaS',
    'criação de conteúdo IA',
    'análise competitiva IA',
    'MktHoney',
  ],
  authors: [{ name: 'MktHoney' }],
  creator: 'MktHoney',
  publisher: 'MktHoney',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large' as const,
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://mkthoney.com',
    siteName: 'MktHoney',
    title: 'MktHoney — Sua Agência de Marketing com IA | 23 Conselheiros, 24/7',
    description:
      'MktHoney é a plataforma de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, análise competitiva e automação — tudo com a voz da sua marca.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'MktHoney — Plataforma de Marketing Autônomo com IA',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MktHoney — Sua Agência de Marketing com IA',
    description:
      '23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, análise e automação — 24/7, com a voz da sua marca.',
    creator: '@mkthoney',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: 'https://mkthoney.com',
  },
};

// Schema.org JSON-LD
const schemaOrg = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'MktHoney',
      description:
        'Plataforma SaaS de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing. Substitui agências externas com estratégia, conteúdo, análise competitiva e automação — 24/7.',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web Browser',
      url: 'https://mkthoney.com',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '97',
        highPrice: '597',
        priceCurrency: 'BRL',
        offerCount: '3',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '500',
        bestRating: '5',
      },
      featureList: [
        '23 AI Marketing Counselors',
        'Multi-Agent Debate System',
        'Funnel Autopsy Diagnostic',
        'Competitive Intelligence (Spy Agent)',
        'Content Calendar with Auto-Publishing',
        'A/B Testing with Statistical Significance',
        'Brand Voice Compliance Gate',
        'Multi-Brand Management',
        'Offer Engineering Lab',
        'Social Listening & Trend Radar',
      ],
    },
    {
      '@type': 'Organization',
      name: 'MktHoney',
      url: 'https://mkthoney.com',
      logo: 'https://mkthoney.com/images/logo.png',
      description: 'Plataforma de marketing autônomo com inteligência artificial.',
      foundingDate: '2026',
      sameAs: [
        'https://www.linkedin.com/company/mkthoney',
        'https://www.instagram.com/mkthoney',
        'https://twitter.com/mkthoney',
      ],
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        availableLanguage: ['Portuguese', 'English'],
        url: 'https://mkthoney.com/contato',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'O que é o MktHoney?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'MktHoney é uma plataforma SaaS de marketing autônomo com inteligência artificial. Ela reúne 23 conselheiros de IA modelados em lendas do marketing como Gary Halbert, David Ogilvy e Russell Brunson. A plataforma cobre estratégia, criação de conteúdo, análise competitiva, automação de campanhas e gestão de funil — tudo personalizado com a identidade e voz da sua marca, operando 24/7.',
          },
        },
        {
          '@type': 'Question',
          name: 'Como os 23 conselheiros de IA funcionam?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Cada conselheiro é modelado com os frameworks reais de uma lenda do marketing. Quando você faz uma consulta, múltiplos conselheiros analisam usando seus critérios específicos, debatem entre si e entregam um veredito unificado com score de confiança.',
          },
        },
        {
          '@type': 'Question',
          name: 'O MktHoney substitui minha agência de marketing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim, esse é o objetivo. O MktHoney entrega inteligência estratégica, criação de conteúdo, análise competitiva, automação de campanhas e monitoramento de performance — funções que normalmente exigem uma equipe de 5-10 pessoas.',
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <div className="min-h-screen bg-[#0D0B09] text-white">
        {/* Background effects */}
        <div className="fixed inset-0 bg-dot-pattern opacity-10 pointer-events-none" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.06),transparent)] pointer-events-none" />

        {/* Navigation */}
        <LandingNavbar />

        {/* Main content */}
        <main>
          <LandingHero />
          <LandingPain />
          <LandingSolution />
          <LandingHowItWorks />
          <LandingCouncil />
          <LandingPricing />
          <LandingFaq />
          <LandingCta />
        </main>

        {/* Footer */}
        <LandingFooter />
      </div>
    </>
  );
}
