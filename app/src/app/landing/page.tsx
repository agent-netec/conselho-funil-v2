import type { Metadata } from 'next';
import {
  LandingNavbar,
  LandingHero,
  LandingMetrics,
  LandingProblem,
  LandingSolution,
  LandingArsenal,
  LandingHowItWorks,
  LandingFeatures,
  LandingComparison,
  LandingPricing,
  LandingFaq,
  LandingCta,
  LandingFooter,
} from '@/components/landing';

// SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL('https://mkthoney.com'),
  title: 'MKTHONEY — Marketing Autônomo com IA | 23 Especialistas 24/7',
  description:
    'Plataforma SaaS que reúne 23 conselheiros de IA baseados em lendas do marketing. Estratégia, conteúdo, funis e automação — tudo numa tela, na sua mão.',
  keywords: [
    'marketing autonomo',
    'marketing com IA',
    'automacao de marketing',
    'funil de vendas',
    'SaaS marketing',
    'inteligencia artificial marketing',
    'conselheiros de marketing',
    'MKTHONEY',
    'agencia de marketing IA',
    'marketing digital automatizado',
  ],
  authors: [{ name: 'MKTHONEY' }],
  creator: 'MKTHONEY',
  publisher: 'MKTHONEY',
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
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Pare de contratar. Comece a operar. 23 especialistas de IA, 24/7.',
    type: 'website',
    locale: 'pt_BR',
    url: 'https://mkthoney.com',
    siteName: 'MKTHONEY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Pare de contratar. Comece a operar. 23 especialistas de IA, 24/7.',
    creator: '@mkthoney',
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
      name: 'MKTHONEY',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: 'https://mkthoney.com',
      description:
        'Plataforma SaaS de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing.',
      offers: [
        { '@type': 'Offer', name: 'Starter', price: '97', priceCurrency: 'BRL', billingIncrement: 'P1M' },
        { '@type': 'Offer', name: 'Pro', price: '297', priceCurrency: 'BRL', billingIncrement: 'P1M' },
        { '@type': 'Offer', name: 'Agency', price: '597', priceCurrency: 'BRL', billingIncrement: 'P1M' },
      ],
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.9',
        reviewCount: '500',
        bestRating: '5',
      },
    },
    {
      '@type': 'Organization',
      name: 'MKTHONEY',
      url: 'https://mkthoney.com',
      description: 'Marketing autônomo com inteligência artificial.',
      foundingDate: '2026',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Isso substitui minha agência?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. Com o MKTHONEY, você opera inteligência competitiva, criação de conteúdo, automação de campanhas e monitoramento de performance sozinho. Funções que normalmente exigem de 5 a 10 pessoas. Sua operação roda 24/7 sem depender de ninguém.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quem são os 23 conselheiros?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'São sistemas de avaliação treinados nos frameworks reais de lendas do marketing direto — Gary Halbert, Eugene Schwartz, Dan Kennedy, Russell Brunson, David Ogilvy, entre outros. Múltiplos conselheiros analisam, debatem entre si e entregam um veredito unificado com score de confiança.',
          },
        },
        {
          '@type': 'Question',
          name: 'E se eu não gostar em 14 dias?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Você sai. Sem pergunta. Sem retenção. Sem cobrar cartão que você nem cadastrou. Os 14 dias são reais — não é trial com funcionalidades cortadas. É o produto inteiro.',
          },
        },
        {
          '@type': 'Question',
          name: 'Meus dados ficam seguros?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Isolamento total por marca. Encriptação AES-256-GCM. Cada marca tem namespace próprio. Nenhum dado cruza de uma marca para outra. Servidores no Brasil.',
          },
        },
        {
          '@type': 'Question',
          name: 'Funciona para qual nicho?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Qualquer marca que precisa de marketing consistente e não quer manter uma equipe para isso. Infoprodutores, SaaS, e-commerce, serviços, agências solo. A plataforma se adapta à sua vertical e tom de voz.',
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#0D0B09] text-[#F5E8CE]">
      {/* Background texture */}
      <div className="pointer-events-none fixed inset-0 bg-noise opacity-[0.02]" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(230,180,71,0.06),transparent)]" />

      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />

      <LandingNavbar />

      <main>
        <LandingHero />
        <LandingMetrics />
        <LandingProblem />
        <LandingSolution />
        <LandingArsenal />
        <LandingHowItWorks />
        <LandingFeatures />
        <LandingComparison />
        <LandingPricing />
        <LandingFaq />
        <LandingCta />
      </main>

      <LandingFooter />
    </div>
  );
}
