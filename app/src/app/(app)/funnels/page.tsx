'use client';

import Link from 'next/link';
import {
  Plus,
  MoreVertical,
  Trash2,
  Eye,
  Search,
  ChevronRight,
} from 'lucide-react';
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFunnels } from '@/lib/hooks/use-funnels';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Rascunho',
  generating: 'Gerando',
  review: 'Avaliar',
  approved: 'Aprovado',
  adjusting: 'Ajustando',
  executing: 'Executando',
  completed: 'Concluído',
  killed: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'border-l-zinc-600',
  generating: 'border-l-[#5B8EC4]',
  review: 'border-l-[#E6B447]',
  approved: 'border-l-[#E6B447]',
  adjusting: 'border-l-[#AB8648]',
  executing: 'border-l-[#5B8EC4]',
  completed: 'border-l-[#7A9B5A]',
  killed: 'border-l-[#C45B3A]',
};

const OBJECTIVE_LABELS: Record<string, string> = {
  leads: 'Leads', sales: 'Vendas', calls: 'Calls', retention: 'Retenção',
};

const COLUMNS = [
  { key: 'draft', label: 'Rascunho', statuses: ['draft'] },
  { key: 'wip', label: 'Em Progresso', statuses: ['generating', 'adjusting', 'executing'] },
  { key: 'review', label: 'Revisão', statuses: ['review'] },
  { key: 'done', label: 'Concluído', statuses: ['approved', 'completed'] },
];

export default function FunnelsPage() {
  const { funnels, isLoading, remove } = useFunnels();
  const [search, setSearch] = useState('');

  const filtered = funnels.filter(f =>
    f.name.toLowerCase().includes(search.toLowerCase()) ||
    f.context.objective.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    total: funnels.length,
    active: funnels.filter(f => ['approved', 'executing', 'generating', 'review'].includes(f.status)).length,
    done: funnels.filter(f => f.status === 'completed').length,
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este funil?')) await remove(id);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
              Funis
            </h1>
            <Link
              href="/funnels/new"
              className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              NOVO FUNIL
            </Link>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-3 border border-white/[0.06] divide-x divide-white/[0.06] mb-8">
            <div className="px-6 py-5 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Total</p>
              <p className="text-[36px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">{stats.total}</p>
            </div>
            <div className="px-6 py-5 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Em Operação</p>
              <p className="text-[36px] font-mono font-black tabular-nums text-[#E6B447] leading-none">{stats.active}</p>
            </div>
            <div className="px-6 py-5 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Concluídos</p>
              <p className="text-[36px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">{stats.done}</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5D4A]" />
            <input
              type="text"
              placeholder="Buscar funil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-7 pr-4 bg-transparent border-b border-white/[0.06] text-sm text-[#F5E8CE] placeholder:text-[#6B5D4A] focus:outline-none focus:border-[#E6B447]/40 font-mono transition-colors"
            />
          </div>
        </div>
      </header>

      {/* ═══ KANBAN ══════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full overflow-x-auto">
        {isLoading ? (
          <div className="grid grid-cols-4 gap-px bg-white/[0.04]">
            {COLUMNS.map((col) => (
              <div key={col.key} className="bg-[#0D0B09] p-4 min-h-[400px]">
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-4">{col.label}</p>
                <div className="space-y-2">
                  {[1, 2].map(i => <div key={i} className="h-20 bg-[#1A1612] animate-pulse" />)}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search ? (
            <div className="py-20 text-center">
              <p className="text-[#6B5D4A] text-sm font-mono">Nenhum funil para "{search}"</p>
            </div>
          ) : (
            <GuidedEmptyState
              icon={ChevronRight}
              title="Nenhum funil criado"
              description="Crie seu primeiro funil e deixe o MKTHONEY estruturar, avaliar e otimizar cada etapa."
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
          <div className="grid grid-cols-4 gap-px bg-white/[0.04] border border-white/[0.06]">
            {COLUMNS.map((column) => {
              const items = filtered.filter(f => column.statuses.includes(f.status));

              return (
                <div key={column.key} className="bg-[#0D0B09] min-h-[400px] flex flex-col">
                  {/* Column header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">
                      {column.label}
                    </span>
                    <span className="text-[11px] font-mono font-black text-[#F5E8CE]">
                      {items.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 p-2 space-y-1">
                    {items.map((funnel) => {
                      const objective = OBJECTIVE_LABELS[funnel.context.objective] || funnel.context.objective;
                      const ticket = Number(funnel.context.offer?.ticket) || 0;

                      return (
                        <Link key={funnel.id} href={`/funnels/${funnel.id}`}>
                          <div className={cn(
                            "group border-l-2 bg-[#1A1612] hover:bg-[#241F19] transition-colors cursor-pointer px-3 py-3",
                            STATUS_COLOR[funnel.status] || 'border-l-zinc-600'
                          )}>
                            {/* Name */}
                            <div className="flex items-center justify-between gap-2">
                              <h4 className="text-[13px] font-bold text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors truncate">
                                {funnel.name}
                              </h4>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    className="shrink-0 h-5 w-5 flex items-center justify-center text-[#6B5D4A] hover:text-[#F5E8CE] opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => e.preventDefault()}
                                  >
                                    <MoreVertical className="h-3 w-3" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1A1612] border-white/[0.08] text-[#CAB792]">
                                  <DropdownMenuItem asChild>
                                    <Link href={`/funnels/${funnel.id}`} className="flex items-center cursor-pointer">
                                      <Eye className="mr-2 h-3.5 w-3.5" /> Detalhes
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => { e.preventDefault(); handleDelete(funnel.id); }}
                                    className="text-[#C45B3A] focus:text-[#C45B3A] focus:bg-[#C45B3A]/10 cursor-pointer"
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>

                            {/* Meta row */}
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#6B5D4A]">
                                {objective}
                              </span>
                              {ticket > 0 && (
                                <span className="text-[11px] font-mono font-bold text-[#E6B447] tabular-nums">
                                  R$ {ticket.toLocaleString('pt-BR')}
                                </span>
                              )}
                            </div>

                            {/* Status text */}
                            <div className="flex items-center justify-between mt-1.5">
                              <p className="text-[9px] font-mono uppercase tracking-[0.15em] text-[#AB8648]">
                                {STATUS_LABEL[funnel.status] || funnel.status}
                              </p>
                              {(funnel.status === 'approved' || funnel.status === 'executing') && (
                                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-[#E6B447] bg-[#E6B447]/10 px-1.5 py-0.5 rounded">
                                  Iniciar Campanha →
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}

                    {items.length === 0 && (
                      <div className="py-8 text-center">
                        <p className="text-[10px] font-mono text-[#6B5D4A]/50 uppercase tracking-wider">Vazio</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
