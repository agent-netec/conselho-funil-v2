import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { TargetIcon, CrownIcon, BoltIcon, PlayPauseIcon, SuccessIcon } from "./animated-state-icons";

const FEATURES = ["Espionagem", "Conteúdo", "Funil", "Tracking", "Automação", "Analytics"];

const StatItem = ({ value, label }) => (
  <div className="flex flex-col items-center justify-center transition-transform hover:-translate-y-1 cursor-default">
    <span className="text-xl font-bold text-[#FAF8F5] sm:text-2xl">{value}</span>
    <span className="text-[10px] uppercase tracking-wider text-[#C9A84C]/70 font-medium sm:text-xs">{label}</span>
  </div>
);

export default function GlassmorphismHero() {
  return (
    <section className="relative w-full min-h-[100dvh] bg-[#050505] text-[#FAF8F5] overflow-hidden font-sans">
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(201, 168, 76, 0.3); }
          50% { box-shadow: 0 0 40px rgba(201, 168, 76, 0.5); }
        }
        .animate-fade-in {
          animation: fadeSlideIn 0.8s ease-out forwards;
          opacity: 0;
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-glow {
          animation: glow 3s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
      `}</style>

      {/* Image Background with Overlays */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/Gemini_Generated_Image_lonmylonmylonmyl.jpeg')",
          }}
        />
        <div className="absolute inset-0 bg-[#050505]/70" />
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            background: "linear-gradient(135deg, rgba(201, 168, 76, 0.2) 0%, transparent 50%, rgba(201, 168, 76, 0.1) 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse at center, transparent 30%, rgba(5, 5, 5, 0.8) 100%)",
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#FAF8F5] to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-28 pb-16 sm:px-6 md:pt-36 md:pb-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-8 items-center min-h-[80vh]">

          {/* LEFT COLUMN */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-8">

            {/* Badge - usando BoltIcon animado */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-4 py-2 backdrop-blur-md">
                <BoltIcon size={14} color="#C9A84C" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-[#C9A84C]">
                  Arma Secreta de Marketing
                </span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black tracking-tighter leading-[0.85] uppercase">
                <span className="text-[#FAF8F5]">Não é uma</span>
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-serif italic text-[#C9A84C] mt-2 drop-shadow-[0_0_40px_rgba(201,168,76,0.4)]">
                Luta Justa.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              className="max-w-xl text-lg text-[#FAF8F5]/60 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <strong className="text-[#FAF8F5] font-semibold">Uma pessoa. Uma plataforma. A operação inteira.</strong>
              <br />
              Espionagem, conteúdo, funil, tracking e otimização — sem agência, sem equipe, sem depender de ninguém.
            </motion.p>

            {/* CTA Buttons - usando PlayPauseIcon animado */}
            <motion.div
              className="flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <button
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C77A] px-8 py-4 text-sm font-bold uppercase tracking-widest text-[#0D0D12] transition-all hover:scale-[1.02] active:scale-[0.98] animate-glow"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Iniciar Guerra
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>

              <button className="group inline-flex items-center justify-center gap-3 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/5 px-8 py-4 text-sm font-semibold text-[#FAF8F5] backdrop-blur-sm transition-all hover:bg-[#C9A84C]/10 hover:border-[#C9A84C]/50">
                <PlayPauseIcon size={18} color="#C9A84C" duration={3000} />
                Ver Demonstração
              </button>
            </motion.div>

            <p className="text-xs text-[#FAF8F5]/40 font-medium tracking-wide">
              Sem cartão. Sem contrato. Cancele quando quiser.
            </p>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-5 space-y-6">

            {/* Stats Card - usando TargetIcon animado */}
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-[#C9A84C]/20 bg-[#0D0D12]/80 p-8 backdrop-blur-xl shadow-2xl"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#C9A84C]/10 blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#C9A84C] to-[#E5C77A] ring-2 ring-[#C9A84C]/30">
                    <TargetIcon size={28} color="#0D0D12" />
                  </div>
                  <div>
                    <div className="text-4xl font-black tracking-tight text-[#FAF8F5]">10x</div>
                    <div className="text-sm text-[#C9A84C]">Mais Rápido que Agências</div>
                  </div>
                </div>

                {/* Progress Bar com SuccessIcon */}
                <div className="space-y-3 mb-8">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#FAF8F5]/60">Resultados em 30 dias</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#C9A84C] font-bold">97%</span>
                      <SuccessIcon size={18} color="#C9A84C" duration={3000} />
                    </div>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#2A2A35]">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[#C9A84C] to-[#E5C77A]"
                      initial={{ width: 0 }}
                      animate={{ width: "97%" }}
                      transition={{ duration: 1.5, delay: 0.8, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <div className="h-px w-full bg-[#C9A84C]/20 mb-6" />

                {/* Mini Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <StatItem value="500+" label="Usuários" />
                  <StatItem value="24/7" label="Automação" />
                  <StatItem value="∞" label="Escala" />
                </div>

                {/* Tags - usando CrownIcon animado */}
                <div className="mt-8 flex flex-wrap gap-2">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-[10px] font-bold tracking-wide text-[#C9A84C]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C9A84C] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#C9A84C]"></span>
                    </span>
                    VAGAS ABERTAS
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A84C]/30 bg-[#C9A84C]/10 px-3 py-1 text-[10px] font-bold tracking-wide text-[#C9A84C]">
                    <CrownIcon size={12} color="#C9A84C" />
                    ACESSO VITALÍCIO
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Features - APENAS TEXTO, sem ícones genéricos */}
            <motion.div
              className="relative overflow-hidden rounded-3xl border border-[#C9A84C]/20 bg-[#0D0D12]/80 py-6 backdrop-blur-xl"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <h3 className="mb-4 px-6 text-xs font-bold uppercase tracking-widest text-[#C9A84C]">
                Tudo em um só lugar
              </h3>

              <div
                className="relative flex overflow-hidden"
                style={{
                  maskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)",
                  WebkitMaskImage: "linear-gradient(to right, transparent, black 10%, black 90%, transparent)"
                }}
              >
                <div className="animate-marquee flex gap-6 whitespace-nowrap px-4">
                  {[...FEATURES, ...FEATURES, ...FEATURES].map((feature, i) => (
                    <span
                      key={i}
                      className="text-sm font-bold tracking-tight text-[#FAF8F5]/40 hover:text-[#C9A84C] transition-colors cursor-default"
                    >
                      {feature}
                      <span className="mx-3 text-[#C9A84C]/30">•</span>
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
