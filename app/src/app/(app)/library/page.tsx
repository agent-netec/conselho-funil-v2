'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Star, ChevronRight, Layers, Copy } from 'lucide-react';
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';
import { cn } from '@/lib/utils';
import type { LibraryTemplate, ProposalScorecard } from '@/types/database';

const OBJECTIVE_LABEL: Record<string, string> = {
  leads: 'Leads', sales: 'Vendas', calls: 'Calls', retention: 'Retenção',
};

const FILTERS = ['all', 'leads', 'sales', 'calls', 'retention'] as const;
const FILTER_LABELS: Record<string, string> = {
  all: 'Todos', leads: 'Leads', sales: 'Vendas', calls: 'Calls', retention: 'Retenção',
};

export default function LibraryPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<LibraryTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/library');
        const data = await res.json();
        setTemplates(data.templates || []);
      } catch (e) { console.error('Error loading templates:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleUse = (t: LibraryTemplate) => {
    router.push(`/funnels/new?templateId=${t.id}&name=${encodeURIComponent(t.name)}`);
  };

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || t.metadata?.objective === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: templates.length,
    leads: templates.filter(t => t.metadata?.objective === 'leads').length,
    sales: templates.filter(t => t.metadata?.objective === 'sales').length,
    calls: templates.filter(t => t.metadata?.objective === 'calls').length,
    retention: templates.filter(t => t.metadata?.objective === 'retention').length,
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
              Biblioteca
            </h1>
            <Link
              href="/funnels/new"
              className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors"
            >
              NOVO FUNIL →
            </Link>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-5 border border-white/[0.06] divide-x divide-white/[0.06] mb-8">
            {[
              { label: 'Total', value: stats.total },
              { label: 'Leads', value: stats.leads },
              { label: 'Vendas', value: stats.sales },
              { label: 'Calls', value: stats.calls },
              { label: 'Retenção', value: stats.retention },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4 bg-[#0D0B09]">
                <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">{s.label}</p>
                <p className="text-[28px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Search + filters */}
          <div className="flex items-center gap-4 border-b border-white/[0.06] pb-3 -mb-px">
            <div className="relative flex-1">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5D4A]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar templates..."
                className="w-full h-8 pl-7 bg-transparent text-sm text-[#F5E8CE] placeholder:text-[#6B5D4A] focus:outline-none font-mono"
              />
            </div>
            <div className="flex gap-0">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    'px-3 py-1.5 text-[10px] font-mono tracking-wider transition-colors',
                    filter === f ? 'text-[#E6B447] bg-[#E6B447]/5' : 'text-[#6B5D4A] hover:text-[#CAB792]'
                  )}
                >
                  {FILTER_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-[#1A1612] animate-pulse border-b border-white/[0.04]" />)}
          </div>
        ) : filtered.length === 0 ? (
          search || filter !== 'all' ? (
            <div className="py-20 text-center">
              <p className="text-[#6B5D4A] text-sm font-mono">Nenhum template encontrado.</p>
            </div>
          ) : (
            <GuidedEmptyState
              icon={ChevronRight}
              title="Biblioteca vazia"
              description="Crie um funil e salve como template para reutilizar."
              ctaLabel="Criar Primeiro Funil"
              ctaHref="/funnels/new"
              tips={[
                'Templates salvam estrutura, copy e design',
                'Funis aprovados viram templates com 1 clique',
              ]}
            />
          )
        ) : (
          <div className="border border-white/[0.06] divide-y divide-white/[0.04]">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1A1612]/50">
              <div className="col-span-5 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">Template</div>
              <div className="col-span-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">Objetivo</div>
              <div className="col-span-1 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] text-center">Etapas</div>
              <div className="col-span-1 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] text-center">Usos</div>
              <div className="col-span-1 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] text-right">Score</div>
              <div className="col-span-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] text-right">Ação</div>
            </div>

            {filtered.map((template) => {
              const objective = OBJECTIVE_LABEL[(template.metadata?.objective as string) || ''] || 'Funil';
              const metadata = template.metadata as Record<string, unknown> | undefined;
              const scorecard = metadata?.scorecard as ProposalScorecard | undefined;
              const stages = (metadata?.stages as number) || 0;

              return (
                <div key={template.id} className="grid grid-cols-12 gap-4 px-6 py-4 bg-[#0D0B09] hover:bg-[#1A1612] transition-colors group items-center">
                  {/* Name + description */}
                  <div className="col-span-5">
                    <p className="text-[14px] font-bold text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors truncate">
                      {template.name}
                    </p>
                    <p className="text-[11px] text-[#6B5D4A] truncate mt-0.5">
                      {template.description || '—'}
                    </p>
                  </div>

                  {/* Objective */}
                  <div className="col-span-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#AB8648]">{objective}</span>
                  </div>

                  {/* Stages */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-mono font-bold text-[#F5E8CE]">{stages}</span>
                  </div>

                  {/* Usage count */}
                  <div className="col-span-1 text-center">
                    <span className="text-sm font-mono text-[#6B5D4A]">{template.usageCount}×</span>
                  </div>

                  {/* Score */}
                  <div className="col-span-1 text-right">
                    {scorecard ? (
                      <span className={cn(
                        "text-sm font-mono font-bold",
                        scorecard.overall >= 7.5 ? "text-[#E6B447]" : scorecard.overall >= 6 ? "text-[#F5E8CE]" : "text-[#6B5D4A]"
                      )}>
                        {scorecard.overall.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[#6B5D4A] text-sm">—</span>
                    )}
                  </div>

                  {/* Action */}
                  <div className="col-span-2 text-right">
                    <button
                      onClick={() => handleUse(template)}
                      className="text-[10px] font-mono font-bold tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors"
                    >
                      USAR TEMPLATE →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Grow CTA */}
        {templates.length > 0 && templates.length < 3 && (
          <div className="mt-8 border-l-2 border-[#E6B447] bg-[#0D0B09] p-6">
            <p className="text-[10px] font-mono font-bold tracking-[0.2em] text-[#E6B447] mb-2">DICA</p>
            <p className="text-[13px] text-[#CAB792] leading-relaxed">
              Cada funil aprovado pode virar um template. Quanto mais templates, mais rápido você cria novos funis.
            </p>
            <Link href="/funnels" className="text-[10px] font-mono tracking-wider text-[#AB8648] hover:text-[#E6B447] transition-colors mt-2 inline-block">
              VER FUNIS APROVADOS →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
