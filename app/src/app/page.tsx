'use client';

import { motion } from 'framer-motion';
import { Sparkles, Zap } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { useStats } from '@/lib/hooks/use-stats';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { StatsCards } from '@/components/dashboard/stats-cards';
import { QuickActions } from '@/components/dashboard/quick-actions';
import { RecentActivity } from '@/components/dashboard/recent-activity';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function HomePage() {
  const statsData = useStats();
  const stats = statsData?.stats;
  const statsLoading = statsData?.isLoading;
  
  const funnelsData = useFunnels();
  const funnels = funnelsData?.funnels;
  const funnelsLoading = funnelsData?.isLoading;

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 sm:p-8">
        {/* Welcome Section */}
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
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-500/80">Plataforma Ativa • 2026</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                {getGreeting()}, <span className="text-emerald-400">Estrategista</span>.
              </h2>
              <p className="mt-3 text-zinc-400 text-sm sm:text-base max-w-lg leading-relaxed">
                Bem-vindo ao centro de comando. Sua Linha de Ouro está sincronizada com 23 especialistas do Conselho.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[140px] px-4 py-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">RAG Context</div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200">2.4k Ativos</span>
                </div>
              </div>
              <div className="flex-1 min-w-[140px] px-4 py-3 rounded-xl sm:rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-md">
                <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1">Engine</div>
                <div className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-amber-400" />
                  <span className="text-xs sm:text-sm font-semibold text-zinc-200">Flash 2.0</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <StatsCards stats={stats} isLoading={statsLoading} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Two Column Layout (Recent Funnels & Council) */}
        <RecentActivity funnels={funnels} isLoading={funnelsLoading} />
      </div>
    </div>
  );
}
