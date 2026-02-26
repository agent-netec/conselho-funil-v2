'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Shield, Globe, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TRUST_SIGNALS = [
  { icon: Shield, label: 'Dados encriptados AES-256' },
  { icon: Globe, label: 'Servidores no Brasil' },
  { icon: Zap, label: '302 testes automatizados, 100% aprovacao' },
];

export function LandingCta() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#F5E8CE] mb-6">
            Comece Agora — Sua Marca Merece uma Agencia de Verdade
          </h2>

          <p className="text-lg text-[#CAB792] mb-10 leading-relaxed">
            Chega de pagar caro por resultados mediocres. Chega de esperar
            semanas por um relatorio que nao muda nada. O MktHoney coloca
            23 dos maiores estrategistas de marketing do mundo trabalhando
            pela sua marca — agora, 24/7, no piloto automatico.
          </p>

          <Link href="/signup">
            <Button
              size="lg"
              className="bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09] font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-[#E6B447]/20"
            >
              Criar Minha Conta Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>

          <p className="text-sm text-[#AB8648] mt-6">
            14 dias gratis. Sem cartao de credito. Setup em 5 minutos. Cancele quando quiser.
          </p>

          {/* Trust Signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12">
            {TRUST_SIGNALS.map((signal, index) => (
              <div key={index} className="flex items-center gap-2 text-sm text-[#AB8648]">
                <signal.icon className="h-4 w-4" />
                <span>{signal.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
