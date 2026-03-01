'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

const plans = [
  {
    name: 'Starter',
    price: '97',
    cta: 'Começar com Starter',
    ctaHref: '/signup',
    popular: false,
    features: [
      '5 marcas',
      '50 gerações por mês',
      'Conselheiros básicos (8)',
      'Templates padrão',
      'Email support',
      '14 dias grátis',
    ],
  },
  {
    name: 'Pro',
    price: '297',
    cta: 'Escalar com Pro',
    ctaHref: '/signup',
    popular: true,
    features: [
      '15 marcas',
      '200 gerações por mês',
      'Todos os 23 conselheiros',
      'Templates premium',
      'Spy Agent (intel competitiva)',
      'Priority support',
      '14 dias grátis',
    ],
  },
  {
    name: 'Agency',
    price: '597',
    cta: 'Dominar com Agency',
    ctaHref: '/signup',
    popular: false,
    features: [
      'Marcas ilimitadas',
      'Gerações ilimitadas',
      'Todos os 23 conselheiros',
      'White-label reports',
      'API access',
      'Dedicated support',
      '14 dias grátis',
    ],
  },
];

export function LandingPricing() {
  return (
    <section id="pricing" className="py-24 bg-[#0D0B09]">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E6B447]/60 mb-6 text-center">
          [ O PREÇO DA GUERRA ]
        </p>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center mb-4">
          Sua Agência Cobra R$ 15.000 Por Mês
        </h2>
        <p className="text-zinc-400 text-center text-lg mb-4">
          E Você Ainda Precisa Cobrar o Relatório.
        </p>
        <p className="text-zinc-600 text-center text-sm mb-16 max-w-md mx-auto">
          Aqui, você opera sozinho. Espionagem, conteúdo, funil, tracking e otimização.
          Todo dia. Toda hora.
        </p>

        <div className="grid md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 flex flex-col transition-all ${
                plan.popular
                  ? 'border-2 border-[#E6B447] bg-[#1A1612] shadow-[0_0_40px_-10px_rgba(230,180,71,0.2)] md:-translate-y-4'
                  : 'border border-white/[0.06] bg-white/[0.01]'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[#E6B447] px-4 py-1 text-xs font-bold text-[#0D0B09]">
                    Popular
                  </span>
                </div>
              )}

              <h3
                className={`text-xs font-bold uppercase tracking-[0.2em] mb-2 ${
                  plan.popular ? 'text-[#E6B447]' : 'text-zinc-500'
                }`}
              >
                {plan.name}
              </h3>

              <div className="mb-6">
                <span className="text-4xl font-bold text-white">R$ {plan.price}</span>
                <span className="text-sm text-zinc-500"> /mês</span>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check className="h-4 w-4 text-[#E6B447] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-zinc-400">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block w-full text-center rounded-xl py-3 text-sm font-bold transition-all ${
                  plan.popular
                    ? 'bg-[#E6B447] text-[#0D0B09] hover:bg-[#F0C35C]'
                    : 'border border-white/[0.1] text-white hover:border-[#E6B447]/30 hover:text-[#E6B447]'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8">
          Todos os planos incluem 14 dias grátis. Sem cartão na entrada. Cancele a qualquer momento.
        </p>
      </div>
    </section>
  );
}
