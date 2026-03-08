'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Target,
  GitBranch,
  MoreVertical,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  TrendingUp,
} from 'lucide-react';
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any; glow: string }> = {
  draft: { label: 'Rascunho', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Clock, glow: 'from-zinc-500/5 to-transparent' },
  generating: { label: 'Gerando', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock, glow: 'from-blue-500/5 to-transparent' },
  review: { label: 'Avaliar', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertCircle, glow: 'from-amber-500/5 to-transparent' },
  approved: { label: 'Aprovado', color: 'text-[#E6B447]', bg: 'bg-[#E6B447]/10', icon: CheckCircle2, glow: 'from-[#E6B447]/5 to-transparent' },
  adjusting: { label: 'Ajustando', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: Clock, glow: 'from-violet-500/5 to-transparent' },
  executing: { label: 'Executando', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock, glow: 'from-blue-500/5 to-transparent' },
  completed: { label: 'Concluído', color: 'text-[#E6B447]', bg: 'bg-[#E6B447]/10', icon: CheckCircle2, glow: 'from-[#E6B447]/5 to-transparent' },
  killed: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle, glow: 'from-red-500/5 to-transparent' },
};

const OBJECTIVE_LABELS: Record<string, string> = {
  leads: 'Leads',
  sales: 'Vendas',
  calls: 'Calls',
  retention: 'Retenção',
};

const KANBAN_COLUMNS = [
  { key: 'draft', label: 'Rascunho', statuses: ['draft'], dotColor: 'bg-zinc-500' },
  { key: 'generating', label: 'Gerando', statuses: ['generating', 'adjusting', 'executing'], dotColor: 'bg-blue-400' },
  { key: 'review', label: 'Em Revisão', statuses: ['review'], dotColor: 'bg-amber-400' },
  { key: 'approved', label: 'Concluído', statuses: ['approved', 'completed'], dotColor: 'bg-[#E6B447]' },
];

export default function FunnelsPage() {
  const { funnels, isLoading, remove } = useFunnels();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFunnels = funnels.filter(f => 
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.context.objective.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: funnels.length,
    active: funnels.filter(f => ['approved', 'executing', 'generating', 'review'].includes(f.status)).length,
    completed: funnels.filter(f => f.status === 'completed').length,
  };

  const handleDelete = async (funnelId: string) => {
    if (confirm('Tem certeza que deseja excluir este funil?')) {
      await remove(funnelId);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        title="Pipeline de Funis" 
        subtitle="Governança estratégica"
        actions={
          <Link href="/funnels/new">
            <Button className="btn-accent">
              <Plus className="mr-2 h-4 w-4" />
              Novo Funil
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-4 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* List Header & Stats */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Ativos</span>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="w-px h-10 bg-white/[0.05]" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#E6B447]">Em Operação</span>
                <p className="text-2xl font-bold text-white">{stats.active}</p>
              </div>
              <div className="w-px h-10 bg-white/[0.05]" />
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Concluídos</span>
                <p className="text-2xl font-bold text-white">{stats.completed}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input 
                  placeholder="Buscar funil..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium pl-10"
                />
              </div>
              <Button variant="ghost" className="btn-ghost border border-white/[0.05] h-10 w-10 p-0">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isLoading ? (
            /* Kanban skeleton */
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((col) => (
                <div key={col.key} className="flex-shrink-0 w-72 space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <span className={cn("h-2 w-2 rounded-full", col.dotColor)} />
                    <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{col.label}</span>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 animate-pulse">
                      <div className="h-4 w-28 rounded bg-zinc-800 mb-3" />
                      <div className="h-3 w-36 rounded bg-zinc-800/50 mb-2" />
                      <div className="h-3 w-20 rounded bg-zinc-800/30" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : filteredFunnels.length === 0 ? (
            searchQuery ? (
              <div className="card-premium p-16 text-center">
                <p className="text-zinc-500">
                  Nenhum funil encontrado para &ldquo;{searchQuery}&rdquo;. Tente outro termo.
                </p>
              </div>
            ) : (
              <GuidedEmptyState
                icon={GitBranch}
                title="Nenhum funil criado"
                description="Crie seu primeiro funil de vendas e deixe o MKTHONEY ajudar a estruturar, avaliar e otimizar cada etapa."
                ctaLabel="Criar Primeiro Funil"
                ctaHref="/funnels/new"
                tips={[
                  'Descreva o objetivo e o MKTHONEY sugere a estrutura',
                  'O MKTHONEY avalia cada etapa com score de conversão',
                  'Funis aprovados viram templates reutilizáveis',
                ]}
              />
            )
          ) : (
            /* Kanban board */
            <div className="flex gap-4 overflow-x-auto pb-4">
              {KANBAN_COLUMNS.map((column) => {
                const columnFunnels = filteredFunnels.filter((f) =>
                  column.statuses.includes(f.status)
                );

                return (
                  <div key={column.key} className="flex-shrink-0 w-72 min-h-[200px]">
                    {/* Column header */}
                    <div className="flex items-center gap-2 px-1 mb-3">
                      <span className={cn("h-2 w-2 rounded-full", column.dotColor)} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        {column.label}
                      </span>
                      <span className="ml-auto text-[10px] font-bold text-zinc-600">
                        {columnFunnels.length}
                      </span>
                    </div>

                    {/* Column body */}
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {columnFunnels.map((funnel, index) => {
                          const status = STATUS_CONFIG[funnel.status] || STATUS_CONFIG.draft;
                          const StatusIcon = status.icon;
                          const objective = OBJECTIVE_LABELS[funnel.context.objective] || funnel.context.objective;

                          return (
                            <motion.div
                              key={funnel.id}
                              initial={{ opacity: 0, y: 12 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              transition={{ duration: 0.25, delay: index * 0.04 }}
                            >
                              <Link href={`/funnels/${funnel.id}`}>
                                <div className="group rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:border-[#E6B447]/20 hover:bg-[#E6B447]/[0.02] transition-all relative overflow-hidden">
                                  {/* Glow */}
                                  <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.03] pointer-events-none", status.glow)} />

                                  {/* Top: status badge + actions */}
                                  <div className="flex items-center justify-between mb-3 relative z-10">
                                    <div className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest',
                                      status.color, status.bg
                                    )}>
                                      <StatusIcon className="h-3 w-3" />
                                      {status.label}
                                    </div>

                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-zinc-600 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                          onClick={(e) => e.preventDefault()}
                                        >
                                          <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="bg-zinc-900 border-white/[0.08] text-zinc-300">
                                        <DropdownMenuItem asChild>
                                          <Link href={`/funnels/${funnel.id}`} className="flex items-center cursor-pointer">
                                            <Eye className="mr-2 h-4 w-4" />
                                            Ver Detalhes
                                          </Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.preventDefault();
                                            handleDelete(funnel.id);
                                          }}
                                          className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                        >
                                          <Trash2 className="mr-2 h-4 w-4" />
                                          Excluir
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>

                                  {/* Name + objective */}
                                  <h4 className="text-sm font-bold text-white group-hover:text-[#E6B447] transition-colors truncate mb-1 relative z-10">
                                    {funnel.name}
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold mb-3 relative z-10">
                                    {objective}
                                  </p>

                                  {/* Ticket */}
                                  <div className="flex items-center justify-between text-xs relative z-10 pt-2 border-t border-white/[0.04]">
                                    <span className="text-zinc-600 font-medium">
                                      {funnel.context.channel?.main || funnel.context.channels?.primary || '—'}
                                    </span>
                                    <span className="text-[#E6B447] font-bold text-[11px]">
                                      R$ {(Number(funnel.context.offer?.ticket) || 0).toLocaleString('pt-BR')}
                                    </span>
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
