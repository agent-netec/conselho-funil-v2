'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFunnels } from '@/lib/hooks/use-funnels';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  draft: { label: 'Rascunho', color: 'text-zinc-400', bg: 'bg-zinc-500/10', icon: Clock },
  generating: { label: 'Gerando', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
  review: { label: 'Avaliar', color: 'text-amber-400', bg: 'bg-amber-500/10', icon: AlertCircle },
  approved: { label: 'Aprovado', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  adjusting: { label: 'Ajustando', color: 'text-violet-400', bg: 'bg-violet-500/10', icon: Clock },
  executing: { label: 'Executando', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
  completed: { label: 'Concluído', color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  killed: { label: 'Cancelado', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertCircle },
};

const OBJECTIVE_LABELS: Record<string, string> = {
  leads: 'Leads',
  sales: 'Vendas',
  calls: 'Calls',
  retention: 'Retenção',
};

export default function FunnelsPage() {
  const { funnels, isLoading, remove } = useFunnels();

  const handleDelete = async (funnelId: string) => {
    if (confirm('Tem certeza que deseja excluir este funil?')) {
      await remove(funnelId);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header 
        title="Funis" 
        subtitle={`${funnels.length} funil${funnels.length !== 1 ? 's' : ''}`}
        actions={
          <Link href="/funnels/new">
            <Button className="btn-accent">
              <Plus className="mr-2 h-4 w-4" />
              Novo Funil
            </Button>
          </Link>
        }
      />

      <div className="flex-1 p-8">
        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
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
        ) : funnels.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-16 text-center"
          >
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-800/50">
              <Target className="h-10 w-10 text-zinc-600" />
            </div>
            <h3 className="mt-6 text-xl font-semibold text-white">
              Nenhum funil criado
            </h3>
            <p className="mt-2 text-zinc-500 max-w-sm mx-auto">
              Crie seu primeiro funil e deixe o Conselho ajudar você a estruturar,
              avaliar e otimizar.
            </p>
            <Link href="/funnels/new">
              <Button className="mt-6 btn-accent">
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Funil
              </Button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {funnels.map((funnel, index) => {
              const status = STATUS_CONFIG[funnel.status] || STATUS_CONFIG.draft;
              const StatusIcon = status.icon;
              const objective = OBJECTIVE_LABELS[funnel.context.objective] || funnel.context.objective;
              
              return (
                <motion.div
                  key={funnel.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link href={`/funnels/${funnel.id}`}>
                    <div className="card-premium card-hover group p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                            <Target className="h-6 w-6 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                              {funnel.name}
                            </h4>
                            <p className="text-sm text-zinc-500">
                              {objective} • {funnel.context.channel?.main || funnel.context.channels?.primary}
                            </p>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.preventDefault()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                            <DropdownMenuItem asChild>
                              <Link href={`/funnels/${funnel.id}`} className="flex items-center">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleDelete(funnel.id);
                              }}
                              className="text-red-400 focus:text-red-400 focus:bg-red-500/10"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-zinc-500">Ticket</span>
                          <span className="text-zinc-300 font-medium">
                            R$ {funnel.context.offer.ticket.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.color} ${status.bg}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status.label}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
