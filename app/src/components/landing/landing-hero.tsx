'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';

export function LandingHero() {
  return (
    <section id="hero" className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,180,71,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Floating proof cards */}
      <div className="absolute top-32 right-[12%] hidden lg:block z-10">
        <div className="rounded-xl border border-[#E6B447]/20 bg-[#1A1612]/80 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#E6B447]" />
            <span className="text-xs font-medium text-[#F5E8CE]">Funil diagnosticado em 47s</span>
          </div>
        </div>
      </div>
      <div className="absolute top-52 right-[6%] hidden lg:block z-10">
        <div className="rounded-xl border border-[#E6B447]/15 bg-[#1A1612]/70 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#E6B447]" />
            <span className="text-xs font-medium text-[#F5E8CE]">+312% de conversão detectado</span>
          </div>
        </div>
      </div>
      <div className="absolute top-44 left-[8%] hidden xl:block z-10">
        <div className="rounded-xl border border-[#E6B447]/15 bg-[#1A1612]/70 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#E6B447]" />
            <span className="text-xs font-medium text-[#F5E8CE]">1 operador. 14 campanhas ativas.</span>
          </div>
        </div>
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12 pt-32 pb-16 md:pt-44 md:pb-20 w-full">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 inline-block"
          >
            <span className="inline-flex items-center gap-3 rounded-full border border-[#E6B447]/30 bg-[#E6B447]/[0.06] px-5 py-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#E6B447] animate-pulse" />
              <span className="text-[#E6B447] font-bold">OPERACIONAL</span>
              <span className="h-3 w-px bg-[#E6B447]/30" />
              <span className="text-[#F5E8CE]/70">500+ marcas em combate</span>
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-6 uppercase"
          >
            Não é uma
            <br />
            <span className="text-[#E6B447]">Luta Justa.</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Uma pessoa. Uma plataforma. A operação de marketing inteira.
            <br className="hidden sm:block" />
            Espionagem, conteúdo, funil, tracking e otimização —
            sem agência, sem equipe, sem depender de ninguém.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4"
          >
            <Link
              href="/signup"
              className="group flex items-center gap-2 rounded-xl bg-[#E6B447] px-8 py-3.5 text-base font-black text-[#0D0B09] hover:bg-[#F0C35C] transition-colors tracking-wide uppercase"
            >
              Iniciar Guerra
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#arsenal"
              className="flex items-center gap-2 rounded-xl border border-white/[0.1] px-8 py-3.5 text-base font-medium text-zinc-300 hover:border-[#E6B447]/20 hover:text-white transition-colors"
            >
              Ver Demonstração
            </a>
          </motion.div>

          {/* Micro-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-sm text-zinc-500 mb-16"
          >
            Sem cartão. Sem contrato. Sem depender de ninguém.
          </motion.p>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-2xl border border-[#E6B447]/20 bg-[#1A1612] shadow-[0_20px_80px_-20px_rgba(230,180,71,0.15)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-white/[0.04] bg-[#0D0B09]/80 px-5 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/40" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/40" />
                <span className="h-3 w-3 rounded-full bg-green-500/40" />
              </div>
              <div className="ml-4 flex-1 max-w-xs rounded-md bg-[#0D0B09]/60 px-3 py-1">
                <span className="text-xs text-[#E6B447]/50 font-mono">app.mkthoney.com/dashboard</span>
              </div>
            </div>

            {/* Dashboard skeleton */}
            <div className="p-5 md:p-8 bg-gradient-to-br from-[#0D0B09] via-[#1A1612] to-[#0D0B09]">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {[
                  { val: '147', label: 'Conteúdos' },
                  { val: '23', label: 'Conselheiros' },
                  { val: '8.4K', label: 'Alcance' },
                  { val: '94%', label: 'Satisfação' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-[#E6B447]/[0.08] bg-[#1A1612]/80 p-4">
                    <div className="text-xl font-bold text-[#E6B447] mb-1">{s.val}</div>
                    <div className="text-xs text-zinc-500">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-8 rounded-xl border border-white/[0.04] bg-[#0D0B09]/60 p-4 h-28 flex flex-col justify-between">
                  <span className="text-xs text-zinc-600">Performance Semanal</span>
                  <div className="flex items-end gap-1 h-16">
                    {[35, 55, 40, 70, 50, 85, 65, 90, 55, 80, 68, 95, 72, 88].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t-sm bg-gradient-to-t from-[#E6B447]/40 to-[#E6B447]/10"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="col-span-4 rounded-xl border border-white/[0.04] bg-[#0D0B09]/60 p-4 h-28 space-y-2">
                  <span className="text-xs text-zinc-600">Atividade</span>
                  {['Post gerado', 'Relatório pronto', 'Campanha ativa'].map((t) => (
                    <div key={t} className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#E6B447]/50" />
                      <span className="text-[11px] text-zinc-500">{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Bottom fade */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0D0B09] to-transparent pointer-events-none" />
        </motion.div>

        {/* Answer Capsule — AEO */}
        <p className="sr-only">
          MKTHONEY é uma plataforma de marketing autônomo que permite a uma única pessoa operar
          espionagem competitiva, criação de conteúdo, gestão de funil, automação de campanhas e
          monitoramento de performance — com a mesma profundidade de uma agência de 10 pessoas.
          Utiliza 23 conselheiros baseados nos frameworks de lendas do marketing mundial, operando 24/7.
        </p>
      </div>
    </section>
  );
}
