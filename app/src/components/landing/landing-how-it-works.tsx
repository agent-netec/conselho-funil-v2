'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Settings, Users, Rocket, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STEPS = [
  {
    number: '01',
    icon: Settings,
    title: 'Configure Sua Marca',
    description:
      'Cadastre-se e passe pelo Brand Hub — nosso wizard de identidade. Em 5 minutos, defina sua paleta de cores, tom de voz, publico-alvo, concorrentes e posicionamento.',
  },
  {
    number: '02',
    icon: Users,
    title: 'Ative os Especialistas',
    description:
      'Escolha uma missao: criar uma campanha, diagnosticar seu funil, espionar um concorrente, ou gerar conteudo para a semana inteira. 23 especialistas analisam e debatem.',
  },
  {
    number: '03',
    icon: Rocket,
    title: 'Execute e Escale',
    description:
      'Aprove as sugestoes, ajuste se quiser, e publique direto da plataforma. O MktHoney cuida do calendario editorial, testes A/B e monitoramento de performance.',
  },
];

export function LandingHowItWorks() {
  return (
    <section id="como-funciona" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE] mb-6">
            Como Funciona — Da Configuracao a Execucao em 3 Passos
          </h2>
        </motion.div>

        <div className="space-y-8 mb-12">
          {STEPS.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="flex flex-col md:flex-row items-start gap-6 p-6 rounded-2xl bg-[#1A1612] border border-[#895F29]/20"
            >
              {/* Step number */}
              <div className="flex-shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E6B447]/10 border border-[#E6B447]/20">
                  <span className="text-2xl font-bold text-[#E6B447]">{step.number}</span>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <step.icon className="h-5 w-5 text-[#E6B447]" />
                  <h3 className="text-xl font-bold text-[#F5E8CE]">{step.title}</h3>
                </div>
                <p className="text-[#CAB792] leading-relaxed">{step.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09] font-bold px-8 py-6"
            >
              Quero Comecar Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <p className="text-sm text-[#AB8648] mt-4">
            Sem cartao de credito. Cancele quando quiser.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
