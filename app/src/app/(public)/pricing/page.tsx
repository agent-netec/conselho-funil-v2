import { Metadata } from 'next';
import { Check } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Planos — MKTHONEY',
  description: 'Escolha o plano ideal para escalar seu marketing com IA. Starter R$97, Pro R$297, Agency R$597. 14 dias grátis.',
  openGraph: {
    title: 'Planos — MKTHONEY',
    description: 'Escolha o plano ideal para escalar seu marketing com IA. 14 dias grátis, sem cartão.',
    type: 'website',
  },
};

const tiers = [
  {
    name: 'Starter',
    price: 97,
    description: 'Para quem está começando no marketing autônomo.',
    features: [
      '5 marcas',
      '50 gerações/mês',
      '8 conselheiros básicos',
      'Templates padrão',
      'Email support',
    ],
    cta: 'Começar com Starter',
    highlighted: false,
    badge: null,
  },
  {
    name: 'Pro',
    price: 297,
    description: 'Para profissionais que querem o arsenal completo.',
    features: [
      '15 marcas',
      '200 gerações/mês',
      'Todos os 23 conselheiros',
      'Templates premium',
      'Spy Agent',
      'Priority support',
    ],
    cta: 'Escalar com Pro',
    highlighted: true,
    badge: 'Popular',
  },
  {
    name: 'Agency',
    price: 597,
    description: 'Para agências e operações de escala.',
    features: [
      'Marcas ilimitadas',
      'Gerações ilimitadas',
      'Todos os 23 conselheiros',
      'White-label reports',
      'API access',
      'Dedicated support',
    ],
    cta: 'Dominar com Agency',
    highlighted: false,
    badge: null,
  },
];

const pricingSchema = {
  '@context': 'https://schema.org',
  '@type': 'Product',
  name: 'MKTHONEY',
  description: 'Plataforma de marketing autônomo com IA. Crie, gerencie e otimize funis de vendas.',
  brand: { '@type': 'Brand', name: 'MKTHONEY' },
  offers: [
    {
      '@type': 'Offer',
      name: 'Starter',
      price: '97.00',
      priceCurrency: 'BRL',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      url: 'https://mkthoney.com/pricing',
      description: 'Para quem está começando no marketing autônomo. 5 marcas, 50 gerações/mês.',
    },
    {
      '@type': 'Offer',
      name: 'Pro',
      price: '297.00',
      priceCurrency: 'BRL',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      url: 'https://mkthoney.com/pricing',
      description: 'Para profissionais que querem o arsenal completo. 15 marcas, 200 gerações/mês.',
    },
    {
      '@type': 'Offer',
      name: 'Agency',
      price: '597.00',
      priceCurrency: 'BRL',
      priceValidUntil: '2027-12-31',
      availability: 'https://schema.org/InStock',
      url: 'https://mkthoney.com/pricing',
      description: 'Para agências e operações de escala. Marcas e gerações ilimitadas.',
    },
  ],
};

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://mkthoney.com' },
    { '@type': 'ListItem', position: 2, name: 'Planos', item: 'https://mkthoney.com/pricing' },
  ],
};

export default function PricingPage() {
  return (
    <div>
      {/* Header */}
      <div className="text-center mb-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-4">
          [ O PREÇO DA GUERRA ]
        </p>
        <h1 className="text-3xl font-bold text-white mb-4">
          Sua Agência Cobra R$ 15.000 Por Mês.{' '}
          <span className="text-[#E6B447]">Nós Cobramos R$ 297.</span>
        </h1>
        <p className="text-zinc-400 max-w-xl mx-auto text-sm leading-relaxed">
          14 dias grátis com acesso Pro completo. Sem cartão de crédito. Sem contrato. Sem pegadinha.
        </p>
      </div>

      {/* Tiers grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {tiers.map((tier) => (
          <div
            key={tier.name}
            className={`relative rounded-2xl p-6 flex flex-col transition-all ${
              tier.highlighted
                ? 'border-2 border-[#E6B447] bg-[#1A1612] shadow-[0_0_40px_rgba(230,180,71,0.08)] md:-translate-y-2'
                : 'border border-white/[0.06] bg-white/[0.01] hover:border-white/[0.1]'
            }`}
          >
            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[#E6B447] px-3 py-1 text-[11px] font-bold text-[#0D0B09] uppercase tracking-wide">
                  {tier.badge}
                </span>
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-zinc-400 mb-3">
                {tier.name}
              </h2>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-white">R${tier.price}</span>
                <span className="text-zinc-500 text-sm">/mês</span>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">{tier.description}</p>
            </div>

            <ul className="space-y-2.5 mb-8 flex-1">
              {tier.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <Check className="h-4 w-4 text-[#E6B447] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-zinc-300">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/signup"
              className={`block rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                tier.highlighted
                  ? 'bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C]'
                  : 'border border-white/[0.1] text-white hover:bg-white/[0.03]'
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mb-16">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-6 text-center">
          [ COMPARATIVO ]
        </p>

        <div className="space-y-2 max-w-2xl mx-auto">
          {[
            {
              name: 'Agência Tradicional',
              price: 'R$ 5.000 — R$ 30.000/mês',
              caveat: '+ contrato de 6 meses',
              highlighted: false,
            },
            {
              name: 'Equipe Interna Mínima',
              price: 'R$ 15.000 — R$ 60.000/mês',
              caveat: '+ CLT + gestão',
              highlighted: false,
            },
            {
              name: 'Freelancers Avulsos',
              price: 'R$ 2.000 — R$ 8.000/mês',
              caveat: '+ depende de disponibilidade',
              highlighted: false,
            },
            {
              name: 'MKTHONEY',
              price: 'R$ 297/mês',
              caveat: 'Você. Sozinho. Operando tudo.',
              highlighted: true,
            },
          ].map((row) => (
            <div
              key={row.name}
              className={`flex items-center justify-between gap-4 rounded-xl px-5 py-4 transition-all ${
                row.highlighted
                  ? 'border border-[#E6B447]/30 bg-[#E6B447]/[0.06]'
                  : 'border border-white/[0.04] bg-white/[0.01]'
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  row.highlighted ? 'text-[#E6B447]' : 'text-zinc-400'
                }`}
              >
                {row.name}
              </span>
              <div className="text-right">
                <span
                  className={`text-sm font-bold ${
                    row.highlighted ? 'text-[#E6B447]' : 'text-white'
                  }`}
                >
                  {row.price}
                </span>
                <span
                  className={`block text-[11px] ${
                    row.highlighted
                      ? 'text-[#E6B447]/70 font-semibold tracking-wide'
                      : 'text-zinc-600'
                  }`}
                >
                  {row.caveat}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ pricing */}
      <div className="mb-12 space-y-4">
        <h2 className="text-lg font-semibold text-white mb-6">Perguntas sobre os planos</h2>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-2">Preciso de cartão de crédito no trial?</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Não. Os 14 dias são grátis sem precisar cadastrar cartão. Você só paga se decidir continuar.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-2">Posso mudar de plano depois?</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Sim. Upgrade ou downgrade a qualquer momento nas configurações da conta. Mudanças entram em vigor no próximo ciclo de faturamento.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-2">E se eu quiser cancelar?</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Você cancela nas configurações da conta. Acesso fica ativo até o fim do período pago. Sem retenção, sem ligação de vendas.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white mb-2">Existe plano anual?</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Sim, com desconto de 2 meses grátis (equivalente a 16% off). Disponível após o trial ao fazer upgrade.
          </p>
        </div>
      </div>

      {/* Legal footer */}
      <div className="text-center text-sm text-zinc-500 border-t border-white/[0.04] pt-8">
        <p>14 dias grátis com acesso Pro. Sem cartão de crédito.</p>
        <p className="mt-2">
          Veja nossa{' '}
          <Link href="/refund" className="text-[#E6B447] hover:text-[#F0C35C] transition-colors">
            política de reembolso
          </Link>{' '}
          e{' '}
          <Link href="/terms" className="text-[#E6B447] hover:text-[#F0C35C] transition-colors">
            termos de uso
          </Link>
          .
        </p>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </div>
  );
}
