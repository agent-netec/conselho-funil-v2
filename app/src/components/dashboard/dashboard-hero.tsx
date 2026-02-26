'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Brand } from '@/types/database';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

export type DashboardState = 'pre-briefing' | 'post-aha' | 'active' | 'loading';

interface DashboardHeroProps {
  state: DashboardState;
  brand?: Brand | null;
  verdict?: VerdictOutput | null;
  onStartBriefing?: () => void;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function getScoreColor(value: number) {
  if (value >= 8) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (value >= 5) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

export function DashboardHero({ state, brand, verdict, onStartBriefing }: DashboardHeroProps) {
  const greeting = getGreeting();

  const subtitleMap: Record<DashboardState, string> = {
    'loading': 'Carregando seu painel...',
    'pre-briefing': 'Configure sua marca em 3 minutos para desbloquear o poder do Conselho.',
    'post-aha': brand
      ? `Sua marca ${brand.name} foi analisada. Veja os proximos passos abaixo.`
      : 'Sua marca foi analisada. Veja os proximos passos abaixo.',
    'active': 'Seu Conselho Estrategico esta sincronizado e monitorando sua marca.',
  };

  const statusMap: Record<DashboardState, string> = {
    'loading': 'Carregando',
    'pre-briefing': 'Aguardando Briefing',
    'post-aha': 'Veredito Recebido',
    'active': 'Plataforma Ativa',
  };

  return (
    <motion.div
      className="mb-8 sm:mb-10 relative overflow-hidden rounded-2xl sm:rounded-3xl bg-zinc-900/40 border border-white/[0.04] p-6 sm:p-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full -mr-20 -mt-20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full -ml-10 -mb-10 pointer-events-none" />

      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className={`h-1.5 w-1.5 rounded-full ${
              state === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-500'
            }`} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">
              {statusMap[state]}
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            {greeting}, <span className="text-emerald-400">Estrategista</span>.
          </h2>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
            {subtitleMap[state]}
          </p>

          {/* Pre-briefing: CTA button inline */}
          {state === 'pre-briefing' && onStartBriefing && (
            <Button
              onClick={onStartBriefing}
              className="mt-5 btn-accent"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Comecar Briefing
            </Button>
          )}
        </div>

        {/* Right section: pills/info cards */}
        <div className="flex flex-wrap items-center gap-3">
          {state === 'post-aha' && verdict && (
            <>
              <div className={`px-4 py-3 rounded-xl sm:rounded-2xl border backdrop-blur-md ${getScoreColor(verdict.scores.positioning.value)}`}>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold mb-1 opacity-70">Posicionamento</div>
                <div className="text-sm sm:text-base font-bold">
                  {verdict.scores.positioning.value}/10
                </div>
              </div>
              <div className={`px-4 py-3 rounded-xl sm:rounded-2xl border backdrop-blur-md ${getScoreColor(verdict.scores.offer.value)}`}>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider font-bold mb-1 opacity-70">Oferta</div>
                <div className="text-sm sm:text-base font-bold">
                  {verdict.scores.offer.value}/10
                </div>
              </div>
            </>
          )}

          {state === 'active' && (
            <>
              <div className="flex-1 min-w-[140px] px-4 py-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Status</div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200">Monitorando</span>
                </div>
              </div>
              <div className="flex-1 min-w-[140px] px-4 py-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Engine</div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200">Gemini 2.5</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
