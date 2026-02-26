'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    name: 'Starter',
    price: 97,
    description: 'Entenda seu marketing',
    features: [
      '1 marca',
      '50 consultas/mes',
      'Conselho Geral + 1 modo',
      'Page Forensics (3/mes)',
      '1 funil ativo',
      'Biblioteca de Ativos (50)',
      'Brand Hub basico',
    ],
    cta: 'Comecar Gratis',
    popular: false,
  },
  {
    name: 'Pro',
    price: 297,
    description: 'Opere como uma agencia',
    features: [
      '3 marcas',
      '300 consultas/mes',
      'Todos os 6 modos + Party',
      'Page Forensics (15/mes)',
      '5 funis ativos',
      'Biblioteca de Ativos (500)',
      'Intelligence Wing completo',
      'Offer Lab',
      'Automacao de campanhas',
      'Integracoes Meta & Google',
    ],
    cta: 'Comecar Pro',
    popular: true,
  },
  {
    name: 'Agency',
    price: 597,
    description: 'Escale sem equipe',
    features: [
      '10+ marcas',
      '1.000 consultas/mes',
      'Tudo do Pro +',
      'Page Forensics ilimitado',
      'Funis ilimitados',
      'Ativos ilimitados',
      'Vault completo',
      'Acesso API',
      'Suporte prioritario',
      'Onboarding dedicado',
    ],
    cta: 'Falar com Vendas',
    popular: false,
  },
];

export function LandingPricing() {
  return (
    <section id="precos" className="py-20 px-6 bg-[#1A1612]/30">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE] mb-4">
            Planos e Precos — Escolha o Nivel Certo Para Sua Marca
          </h2>
          <p className="text-[#CAB792]">
            Todos os planos incluem 14 dias gratis. Sem cartao de credito. Cancele a qualquer momento.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className={cn(
                'relative p-6 rounded-2xl border',
                plan.popular
                  ? 'bg-[#0D0B09] border-[#E6B447]/40 shadow-xl shadow-[#E6B447]/10'
                  : 'bg-[#0D0B09] border-[#895F29]/20'
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#E6B447] text-[#0D0B09]">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-bold">Mais Popular</span>
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6 pt-2">
                <h3 className="text-xl font-bold text-[#F5E8CE] mb-1">{plan.name}</h3>
                <p className="text-sm text-[#AB8648] mb-4">{plan.description}</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-sm text-[#CAB792]">R$</span>
                  <span className="text-4xl font-bold text-[#F5E8CE]">{plan.price}</span>
                  <span className="text-sm text-[#CAB792]">/mes</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-[#E6B447] flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-[#CAB792]">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/signup" className="block">
                <Button
                  className={cn(
                    'w-full font-semibold',
                    plan.popular
                      ? 'bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09]'
                      : 'bg-[#1A1612] hover:bg-[#241F19] text-[#F5E8CE] border border-[#895F29]/30'
                  )}
                >
                  {plan.popular && <Zap className="mr-2 h-4 w-4" />}
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
