'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LandingHero() {
  return (
    <section className="relative pt-32 pb-20 px-6 overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#E6B447]/10 rounded-full blur-[120px] -z-10" />

      <div className="mx-auto max-w-5xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E6B447]/10 border border-[#E6B447]/20 mb-8">
            <Sparkles className="h-4 w-4 text-[#E6B447]" />
            <span className="text-sm text-[#E6B447] font-medium">
              Plataforma de Marketing Autonomo com IA
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#F5E8CE] mb-6 leading-[1.1]">
            Sua Agencia de Marketing com IA
            <br />
            <span className="text-[#E6B447]">24/7, Sem Contratos, Sem Equipe</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-[#CAB792] mb-10 max-w-3xl mx-auto leading-relaxed">
            23 lendas do marketing, como Gary Halbert, Eugene Schwartz e Russell Brunson,
            trabalhando juntas pela sua marca. Estrategia, conteudo, analise e execucao
            — tudo automatizado, tudo com a voz da sua marca.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/signup">
              <Button
                size="lg"
                className="bg-[#E6B447] hover:bg-[#F0C35C] text-[#0D0B09] font-bold text-lg px-10 py-7 rounded-xl shadow-lg shadow-[#E6B447]/20"
              >
                Comecar Gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Micro-copy */}
          <p className="text-sm text-[#AB8648] mb-10">
            Sem cartao de credito. Setup em 5 minutos.
          </p>

          {/* Social Proof */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1A1612] border border-[#895F29]/20">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 text-[#E6B447] fill-[#E6B447]" />
              ))}
            </div>
            <span className="text-sm text-[#CAB792]">
              4.9/5 — Usado por +500 marcas e profissionais de marketing
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
