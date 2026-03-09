import Link from 'next/link';
import { ArrowRight, TrendingUp, Users, Zap } from 'lucide-react';

export function LandingHero() {
  return (
    <section id="hero" className="relative overflow-hidden min-h-[90vh] flex items-center">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(230,180,71,0.08)_0%,transparent_60%)] pointer-events-none" />

      {/* Floating proof cards */}
      <div className="absolute top-32 right-[12%] hidden lg:block z-10 animate-fade-in-up [animation-delay:600ms]">
        <div className="rounded-xl border border-[#E6B447]/20 bg-[#1A1612]/80 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#E6B447]" />
            <span className="text-xs font-medium text-[#F5E8CE]">Funil diagnosticado em 47s</span>
          </div>
        </div>
      </div>
      <div className="absolute top-52 right-[6%] hidden lg:block z-10 animate-fade-in-up [animation-delay:700ms]">
        <div className="rounded-xl border border-[#E6B447]/15 bg-[#1A1612]/70 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#E6B447]" />
            <span className="text-xs font-medium text-[#F5E8CE]">+312% de conversao detectado</span>
          </div>
        </div>
      </div>
      <div className="absolute top-44 left-[8%] hidden xl:block z-10 animate-fade-in-up [animation-delay:800ms]">
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
          <div className="mb-8 inline-block animate-fade-in-up">
            <span className="inline-flex items-center gap-3 rounded-full border border-[#E6B447]/30 bg-[#E6B447]/[0.06] px-5 py-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-[#E6B447] animate-pulse" />
              <span className="text-[#E6B447] font-bold">OPERACIONAL</span>
              <span className="h-3 w-px bg-[#E6B447]/30" />
              <span className="text-[#F5E8CE]/70">500+ marcas em combate</span>
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight text-white mb-6 uppercase animate-fade-in-up [animation-delay:100ms]">
            Nao e uma
            <br />
            <span className="text-[#E6B447]">Luta Justa.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-in-up [animation-delay:200ms]">
            Uma pessoa. Uma plataforma. A operacao de marketing inteira.
            <br className="hidden sm:block" />
            Espionagem, conteudo, funil, tracking e otimizacao —
            sem agencia, sem equipe, sem depender de ninguem.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4 animate-fade-in-up [animation-delay:300ms]">
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
              Ver Demonstracao
            </a>
          </div>

          {/* Micro-copy */}
          <p className="text-sm text-zinc-500 mb-16 animate-fade-in [animation-delay:400ms]">
            Sem cartao. Sem contrato. Sem depender de ninguem.
          </p>
        </div>

        {/* Impact stats — floating capsules */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-3xl mx-auto animate-fade-in-up [animation-delay:500ms]">
          {[
            { val: '10x', label: 'mais output por operador' },
            { val: '500+', label: 'marcas em operacao' },
            { val: '24/7', label: 'conselheiros ativos' },
            { val: '<60s', label: 'diagnostico de funil' },
          ].map((stat) => (
            <div
              key={stat.val}
              className="flex items-center gap-3 rounded-xl border border-[#E6B447]/15 bg-[#1A1612]/60 backdrop-blur-sm px-5 py-3"
            >
              <span className="text-2xl font-black text-[#E6B447] tracking-tight">{stat.val}</span>
              <span className="text-[11px] text-[#A89B84] font-medium leading-tight max-w-[100px]">{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Answer Capsule — AEO */}
        <p className="sr-only">
          MKTHONEY e uma plataforma de marketing autonomo que permite a uma unica pessoa operar
          espionagem competitiva, criacao de conteudo, gestao de funil, automacao de campanhas e
          monitoramento de performance — com a mesma profundidade de uma agencia de 10 pessoas.
          Utiliza 23 conselheiros baseados nos frameworks de lendas do marketing mundial, operando 24/7.
        </p>
      </div>
    </section>
  );
}
