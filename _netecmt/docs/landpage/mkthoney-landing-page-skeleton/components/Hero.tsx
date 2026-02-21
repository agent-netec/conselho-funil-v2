import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Play, Sparkles, TrendingUp, Users } from 'lucide-react'
import ParticleCanvas from './ParticleCanvas'
import VideoCarousel from './VideoCarousel'

const Hero: React.FC = () => {
  return (
    <section id="hero" aria-label="Introdução" className="relative overflow-hidden">
      {/* === BACKGROUND LAYERS === */}

      {/* Cinematic video carousel — crossfading between clips */}
      <VideoCarousel className="z-0" />

      {/* Particle canvas — interactive overlay on top of video */}
      <div className="absolute inset-0 z-[1]">
        <ParticleCanvas particleCount={40} />
      </div>

      {/* Grid pattern — generated texture */}
      <div className="hero-grid absolute inset-0 z-[1] opacity-50" />

      {/* Film grain overlay */}
      <div className="grain-overlay absolute inset-0 z-[2] pointer-events-none" />

      {/* Radial glow — using generated glow asset */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[20%] w-full max-w-[1200px] h-[500px] z-[1]">
        <img src="/glow-abstract.png" alt="" className="w-full h-full object-cover opacity-30 blur-sm" aria-hidden="true" />
      </div>

      {/* Side accents */}
      <div className="absolute top-1/3 -left-40 w-[400px] h-[400px] bg-honey/[0.04] rounded-full blur-[120px] z-[1]" />
      <div className="absolute top-1/2 -right-40 w-[400px] h-[400px] bg-bronze/[0.06] rounded-full blur-[120px] z-[1]" />

      {/* Gradient overlay for depth — keeps text readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background z-[3]" />

      {/* Floating decorative elements */}
      <div className="absolute top-32 right-[15%] z-[5] hidden lg:block">
        <div className="animate-float rounded-2xl border border-gold/20 bg-surface/60 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-gold" />
            <span className="text-xs font-medium text-sand">AI Gerando conteúdo...</span>
          </div>
        </div>
      </div>
      <div className="absolute top-56 right-[8%] z-[5] hidden lg:block">
        <div className="animate-float-delayed rounded-2xl border border-gold/15 bg-surface/50 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-gold" />
            <span className="text-xs font-medium text-sand">+47% engajamento</span>
          </div>
        </div>
      </div>
      <div className="absolute top-44 left-[8%] z-[5] hidden xl:block">
        <div className="animate-float-slow rounded-2xl border border-gold/15 bg-surface/50 backdrop-blur-sm px-4 py-3 shadow-lg">
          <div className="flex items-center gap-2">
            <Users className="size-4 text-gold" />
            <span className="text-xs font-medium text-sand">23 conselheiros ativos</span>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-32 pb-16 md:pt-44 md:pb-20 lg:px-12">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-8 inline-block"
          >
            <span className="inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/[0.08] px-5 py-2 text-sm backdrop-blur-sm">
              <span className="flex size-2 rounded-full bg-gold animate-pulse" />
              <span className="text-gold font-bold">4.9/5</span>
              <span className="w-px h-3 bg-gold/30" />
              <span className="text-sand">Usado por +500 marcas</span>
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-display mb-8"
          >
            Sua Agência de Marketing
            <br />
            <span className="relative">
              <span className="text-gold">com IA — 24/7</span>
              {/* Underline accent */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.9 }}
                className="absolute -bottom-2 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-gold/50 to-transparent origin-left"
              />
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-body text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            23 lendas do marketing — Gary Halbert, Eugene Schwartz, Russell Brunson
            — trabalhando juntas pela sua marca. Estratégia, conteúdo, análise e
            execução, tudo automatizado.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-5"
          >
            <a
              href="#signup"
              className="btn-gold group flex items-center gap-2 text-base px-8 py-3.5"
            >
              Começar Grátis
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#demo"
              className="btn-outline group flex items-center gap-2 text-base px-8 py-3.5"
            >
              <Play className="size-4" />
              Ver Demo
            </a>
          </motion.div>

          {/* Micro-copy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="text-caption mb-20"
          >
            Sem cartão de crédito · Setup em 5 minutos
          </motion.p>
        </div>
      </div>

      {/* === DASHBOARD SCREENSHOT === */}
      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-4 lg:px-12">
        {/* Glow behind dashboard */}
        <div className="hero-glow absolute inset-x-0 -top-20 h-40 z-0" />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="hero-perspective relative z-10"
        >
          <figure className="hero-dashboard relative overflow-hidden rounded-2xl border border-bronze/30 bg-surface shadow-[0_20px_80px_-20px_rgba(230,180,71,0.15),0_0_0_1px_rgba(137,95,41,0.1)]">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 border-b border-bronze/20 bg-background/80 px-5 py-3">
              <div className="flex gap-2">
                <span className="size-3 rounded-full bg-red-500/40" />
                <span className="size-3 rounded-full bg-yellow-500/40" />
                <span className="size-3 rounded-full bg-green-500/40" />
              </div>
              <div className="ml-4 flex-1 max-w-sm rounded-lg bg-surface px-4 py-1.5">
                <span className="text-xs text-honey/60 font-mono">app.mkthoney.com/dashboard</span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-background via-surface to-background overflow-hidden">
              <div className="absolute inset-0 p-5 md:p-8 lg:p-10">
                {/* Top nav */}
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gold/20 flex items-center justify-center">
                      <div className="h-4 w-4 rounded bg-gold/40" />
                    </div>
                    <div className="hidden sm:block">
                      <div className="h-3 w-24 rounded bg-cream/10 mb-1" />
                      <div className="h-2 w-16 rounded bg-sand/5" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-24 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <div className="h-2 w-14 rounded bg-gold/30" />
                    </div>
                    <div className="h-8 w-8 rounded-full bg-surface border border-bronze/20" />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-3 md:gap-5">
                  {/* Sidebar */}
                  <div className="col-span-3 hidden md:flex flex-col gap-1.5 border-r border-bronze/10 pr-4">
                    {['Dashboard', 'Conselheiros', 'Conteúdo', 'Social', 'Analytics', 'Campanhas'].map((item, i) => (
                      <div
                        key={item}
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-colors ${
                          i === 0
                            ? 'bg-gold/10 border border-gold/20'
                            : 'hover:bg-surface'
                        }`}
                      >
                        <div className={`size-4 rounded ${i === 0 ? 'bg-gold/40' : 'bg-bronze/20'}`} />
                        <span className={`text-xs font-medium ${i === 0 ? 'text-gold' : 'text-sand/40'}`}>{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Main content */}
                  <div className="col-span-12 md:col-span-9 space-y-3 md:space-y-5">
                    {/* Stats cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: '147', label: 'Conteúdos', trend: '+12%', up: true },
                        { value: '23', label: 'Conselheiros', trend: 'Ativos', up: true },
                        { value: '8.4K', label: 'Alcance', trend: '+47%', up: true },
                        { value: '94%', label: 'Satisfação', trend: '+3%', up: true },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl border border-bronze/15 bg-background/60 p-3 md:p-4">
                          <div className="flex items-baseline justify-between mb-1">
                            <span className="text-gold text-lg md:text-2xl font-bold">{stat.value}</span>
                            <span className="text-[10px] text-green-400/70 font-medium">{stat.trend}</span>
                          </div>
                          <span className="text-[11px] text-sand/40">{stat.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Chart + activity */}
                    <div className="grid grid-cols-12 gap-3 md:gap-5">
                      {/* Chart */}
                      <div className="col-span-12 md:col-span-8 rounded-xl border border-bronze/15 bg-background/60 p-4">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-medium text-sand/50">Performance Semanal</span>
                          <div className="flex gap-3">
                            <span className="text-[10px] text-gold/60 flex items-center gap-1"><span className="size-1.5 rounded-full bg-gold/60" />Conteúdo</span>
                            <span className="text-[10px] text-honey/40 flex items-center gap-1"><span className="size-1.5 rounded-full bg-honey/40" />Engajamento</span>
                          </div>
                        </div>
                        <div className="flex items-end justify-between gap-[3px] h-16 md:h-28">
                          {[35, 55, 40, 70, 50, 85, 65, 90, 55, 80, 68, 95, 72, 88].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col gap-[2px]">
                              <div
                                className="w-full rounded-t-sm bg-gradient-to-t from-gold/40 to-gold/15"
                                style={{ height: `${h}%` }}
                              />
                              <div
                                className="w-full rounded-t-sm bg-gradient-to-t from-honey/20 to-honey/5"
                                style={{ height: `${h * 0.6}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent activity */}
                      <div className="col-span-12 md:col-span-4 rounded-xl border border-bronze/15 bg-background/60 p-4">
                        <span className="text-xs font-medium text-sand/50 block mb-3">Atividade Recente</span>
                        <div className="space-y-3">
                          {[
                            { icon: '✍️', text: 'Post gerado', time: '2min' },
                            { icon: '📊', text: 'Relatório pronto', time: '15min' },
                            { icon: '🎯', text: 'Campanha ativa', time: '1h' },
                            { icon: '💡', text: 'Nova estratégia', time: '3h' },
                          ].map((activity) => (
                            <div key={activity.text} className="flex items-center gap-2.5">
                              <span className="text-xs">{activity.icon}</span>
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] text-sand/60 block truncate">{activity.text}</span>
                              </div>
                              <span className="text-[10px] text-honey/30 shrink-0">{activity.time}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sheen overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.015] to-transparent pointer-events-none" />
            </div>

            <figcaption className="sr-only">Dashboard MktHoney com métricas, conselheiros AI e análises em tempo real</figcaption>
          </figure>
        </motion.div>

        {/* Bottom fade into next section */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent z-20 pointer-events-none" />
      </div>

      {/* Answer Capsule — AEO (invisible to design, visible to crawlers) */}
      <div className="relative z-10 mx-auto max-w-7xl px-6 pt-4 pb-8 lg:px-12">
        <p className="max-w-2xl text-[13px] leading-relaxed text-honey/40">
          MktHoney é uma plataforma SaaS de marketing com inteligência artificial que substitui
          agências externas. Reúne 23 conselheiros AI baseados em lendas do marketing — estratégia,
          conteúdo, análise competitiva e automação de campanhas, 24/7, com a voz da sua marca.
        </p>
      </div>
    </section>
  )
}

export default Hero
