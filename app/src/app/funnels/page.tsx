'use client';

import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Target,
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
  approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, glow: 'from-emerald-500/5 to-transparent' },
  adjusting: { label: 'Ajustando', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: Clock, glow: 'from-violet-500/5 to-transparent' },
  executing: { label: 'Executando', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock, glow: 'from-blue-500/5 to-transparent' },
  completed: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2, glow: 'from-emerald-500/5 to-transparent' },
  killed: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle, glow: 'from-red-500/5 to-transparent' },
};

const OBJECTIVE_LABELS: Record<string, string> = {
  leads: 'Leads',
  sales: 'Vendas',
  calls: 'Calls',
  retention: 'Retenção',
};

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
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">Em Operação</span>
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
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card-premium p-5 animate-pulse">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-zinc-800" />
                    <div className="flex-1">
                      <div className="h-5 w-32 rounded bg-zinc-800 mb-2" />
                      <div className="h-4 w-48 rounded bg-zinc-800/50" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredFunnels.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-premium p-16 text-center border-dashed"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/50 mb-6">
                <Target className="h-10 w-10 text-zinc-600" />
              </div>
              <h3 className="text-xl font-semibold text-white">
                {searchQuery ? 'Nenhum funil encontrado' : 'Nenhum funil criado'}
              </h3>
              <p className="mt-2 text-zinc-500 max-w-sm mx-auto">
                {searchQuery 
                  ? `Não encontramos resultados para "${searchQuery}". Tente outro termo.`
                  : 'Crie seu primeiro funil e deixe o Conselho ajudar você a estruturar, avaliar e otimizar.'}
              </p>
              {!searchQuery && (
                <Link href="/funnels/new">
                  <Button className="mt-8 btn-accent px-8">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Funil
                  </Button>
                </Link>
              )}
            </motion.div>
          ) : (
            <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filteredFunnels.map((funnel, index) => {
                  const status = STATUS_CONFIG[funnel.status] || STATUS_CONFIG.draft;
                  const StatusIcon = status.icon;
                  const objective = OBJECTIVE_LABELS[funnel.context.objective] || funnel.context.objective;
                  
                  return (
                    <motion.div
                      key={funnel.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Link href={`/funnels/${funnel.id}`}>
                        <div className="card-premium card-hover group p-6 relative overflow-hidden h-full flex flex-col">
                          {/* Background Glow */}
                          <div className={cn("absolute inset-0 bg-gradient-to-br opacity-[0.03] pointer-events-none", status.glow)} />
                          
                          <div className="flex items-start justify-between mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                                <Target className="h-6 w-6 text-emerald-400" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors truncate">
                                  {funnel.name}
                                </h4>
                                <p className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">
                                  {objective}
                                </p>
                              </div>
                            </div>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-zinc-500 hover:text-white"
                                  onClick={(e) => e.preventDefault()}
                                >
                                  <MoreVertical className="h-4 w-4" />
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

                          <div className="space-y-4 mb-8 flex-1 relative z-10">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500 font-medium">Canal Principal</span>
                              <span className="text-zinc-300 font-bold bg-white/[0.03] px-2 py-1 rounded">
                                {funnel.context.channel?.main || funnel.context.channels?.primary || 'N/A'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-zinc-500 font-medium">Ticket Médio</span>
                              <span className="text-emerald-400 font-bold">
                                R$ {Number(funnel.context.offer?.ticket || 0).toLocaleString('pt-BR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t border-white/[0.04] relative z-10">
                            <div className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/[0.02]',
                              status.color, status.bg
                            )}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {status.label}
                            </div>
                            
                            <div className="flex items-center gap-1 text-emerald-400 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                              <span className="text-[10px] font-bold uppercase tracking-tighter">Gerenciar</span>
                              <TrendingUp className="h-3 w-3" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
