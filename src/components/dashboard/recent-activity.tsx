'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { COUNSELORS } from '@/lib/constants';
import type { Funnel } from '@/types/database';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-zinc-400', bg: 'bg-zinc-500/10' },
  generating: { label: 'Gerando', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  review: { label: 'Avaliar', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  adjusting: { label: 'Ajustando', color: 'text-violet-400', bg: 'bg-violet-500/10' },
  executing: { label: 'Executando', color: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  killed: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10' },
};

export function RecentActivity({ funnels, isLoading }: { funnels: Funnel[]; isLoading: boolean }) {
  const recentFunnels = funnels.slice(0, 3);

  return (
    <div className="grid gap-8 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
      {/* Recent Funnels */}
      <motion.div 
        className="lg:col-span-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-widest text-white">Funis em Operação</h3>
          </div>
          <Link href="/funnels" className="group flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-emerald-400 transition-colors">
            Ver pipeline completo
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-premium p-4 animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded bg-zinc-800" />
                    <div className="mt-2 h-3 w-48 rounded bg-zinc-800/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentFunnels.length === 0 ? (
          <div className="card-premium p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800/50">
              <Target className="h-8 w-8 text-zinc-600" />
            </div>
            <h4 className="mt-4 text-lg font-medium text-zinc-300">
              Nenhum funil ainda
            </h4>
            <p className="mt-2 text-sm text-zinc-500 max-w-sm mx-auto">
              Crie seu primeiro funil para começar a usar o Conselho
            </p>
            <Link href="/funnels/new">
              <Button className="mt-6 btn-accent">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Funil
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentFunnels.map((funnel, index) => {
              const status = STATUS_CONFIG[funnel.status] || STATUS_CONFIG.draft;
              return (
                <motion.div
                  key={funnel.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                >
                  <Link href={`/funnels/${funnel.id}`}>
                    <div className="card-premium card-hover p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                            <Target className="h-5 w-5 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{funnel.name}</h4>
                            <p className="text-sm text-zinc-500">
                              {funnel.context.objective} • {funnel.context.channel?.main || funnel.context.channels?.primary}
                            </p>
                          </div>
                        </div>
                        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                          {status.label}
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Council */}
      <motion.div 
        className="lg:col-span-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-white">O Conselho</h3>
        </div>

        <div className="card-premium p-5">
          <div className="grid grid-cols-2 gap-3">
            {Object.values(COUNSELORS).map((counselor, index) => (
              <motion.div
                key={counselor.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.6 + index * 0.05 }}
                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/[0.02] transition-colors cursor-default"
              >
                <div 
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-base transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${counselor.color}15` }}
                >
                  {counselor.icon}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">
                    {counselor.name.split(' ').slice(-1)[0]}
                  </p>
                  <p className="text-xs text-zinc-500 truncate">
                    {counselor.expertise.split(' ').slice(0, 2).join(' ')}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-5 pt-4 border-t border-white/[0.04]">
            <Link href="/chat">
              <Button variant="ghost" className="w-full justify-center text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                <MessageSquare className="mr-2 h-4 w-4" />
                Consultar Agora
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}



