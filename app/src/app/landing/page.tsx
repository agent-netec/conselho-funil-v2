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

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mkthoney.com';

// SEO Metadata
export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
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
    url: BASE_URL,
    siteName: 'MKTHONEY',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MKTHONEY — Marketing Autônomo com IA',
    description: 'Pare de contratar. Comece a operar. 23 especialistas de IA, 24/7.',
    creator: '@mkthoney',
  },
  alternates: {
    canonical: BASE_URL,
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
      url: BASE_URL,
      description:
        'Plataforma SaaS de marketing autônomo com 23 conselheiros de IA baseados em lendas do marketing.',
      offers: [
        { '@type': 'Offer', name: 'Starter', price: '97', priceCurrency: 'BRL', billingIncrement: 'P1M' },
        { '@type': 'Offer', name: 'Pro', price: '297', priceCurrency: 'BRL', billingIncrement: 'P1M' },
        { '@type': 'Offer', name: 'Agency', price: '597', priceCurrency: 'BRL', billingIncrement: 'P1M' },
      ],
    },
    {
      '@type': 'Organization',
      name: 'MKTHONEY',
      url: BASE_URL,
      description: 'Marketing autônomo com inteligência artificial.',
      foundingDate: '2026',
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Isso substitui minha agencia?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. Com o MKTHONEY, voce opera inteligencia competitiva, criacao de conteudo, automacao de campanhas e monitoramento de performance sozinho. Funcoes que normalmente exigem de 5 a 10 pessoas. Sua operacao roda 24/7 sem depender de ninguem.',
          },
        },
        {
          '@type': 'Question',
          name: 'E se eu nao entendo de marketing?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Nao precisa. O setup leva 5 minutos. Voce define sua marca, audiencia e tom de voz. A plataforma traduz estrategias complexas em acoes praticas que voce aprova com um clique. Os 23 conselheiros fazem a analise pesada — voce toma a decisao final.',
          },
        },
        {
          '@type': 'Question',
          name: 'Quem sao os 23 conselheiros?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sao sistemas de avaliacao treinados nos frameworks reais de lendas do marketing direto — Gary Halbert, Eugene Schwartz, Dan Kennedy, Russell Brunson, David Ogilvy, entre outros. Multiplos conselheiros analisam, debatem entre si e entregam um veredito unificado com score de confianca.',
          },
        },
        {
          '@type': 'Question',
          name: 'Consigo operar 10+ clientes sozinho?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sim. Cada marca tem seu proprio espaco isolado — tom de voz, identidade visual, conselheiros configurados e metricas independentes. Voce alterna entre marcas instantaneamente.',
          },
        },
        {
          '@type': 'Question',
          name: 'Meus dados ficam seguros?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Isolamento total por marca. Encriptacao AES-256-GCM. Cada marca tem namespace proprio. Nenhum dado cruza de uma marca para outra. Servidores no Brasil.',
          },
        },
        {
          '@type': 'Question',
          name: 'E se eu nao gostar em 14 dias?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Voce sai. Sem pergunta. Sem retencao. Sem cobrar cartao que voce nem cadastrou. Os 14 dias sao reais — nao e trial com funcionalidades cortadas. E o produto inteiro.',
          },
        },
        {
          '@type': 'Question',
          name: 'Que tipo de conteudo consigo produzir?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Posts, stories, carrosseis, reels, headlines, hooks, scripts de anuncio, copies de email, estruturas de funil, ofertas formatadas. Tudo sai com a voz e identidade da sua marca.',
          },
        },
        {
          '@type': 'Question',
          name: 'Funciona para qual nicho?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Qualquer marca que precisa de marketing consistente e nao quer manter uma equipe para isso. Infoprodutores, SaaS, e-commerce, servicos, agencias solo. A plataforma se adapta a sua vertical e tom de voz.',
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
