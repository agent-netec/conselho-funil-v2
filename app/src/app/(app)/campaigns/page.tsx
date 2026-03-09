'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { Search, Plus, ChevronRight } from 'lucide-react';
import { GuidedEmptyState } from '@/components/ui/guided-empty-state';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { CampaignContext } from '@/types/campaign';

const STAGES = ['funnel', 'copy', 'social', 'design', 'ads'] as const;
const STAGE_LABELS: Record<string, string> = {
  funnel: 'Funil',
  copy: 'Copy',
  social: 'Social',
  design: 'Design',
  ads: 'Ads',
};

function getStageDone(campaign: CampaignContext) {
  return {
    funnel: Boolean(campaign.funnel),
    copy: Boolean(campaign.copywriting),
    social: Boolean(campaign.social),
    design: Boolean(campaign.design),
    ads: Boolean(campaign.ads),
  };
}

function getCongruence(campaign: CampaignContext): number {
  const done = getStageDone(campaign);
  const completed = Object.values(done).filter(Boolean).length;
  return Math.round((completed / STAGES.length) * 100);
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const activeBrand = useActiveBrand();

  useEffect(() => {
    async function load() {
      try {
        const cSnap = await getDocs(
          query(collection(db, 'campaigns'), where('status', 'in', ['planning', 'active', 'archived']))
        );
        const cData = cSnap.docs.map(d => ({ id: d.id, ...d.data() })) as CampaignContext[];

        const fSnap = await getDocs(
          query(collection(db, 'funnels'), where('status', 'in', ['approved', 'executing', 'completed', 'review']))
        );
        const fData = fSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

        const usedFunnelIds = new Set(cData.map(c => c.funnelId).filter(Boolean));
        const virtual: CampaignContext[] = fData
          .filter(f => !usedFunnelIds.has(f.id))
          .map(f => ({
            id: f.id, funnelId: f.id, brandId: f.brandId || '', userId: f.userId || '',
            name: f.name || 'Funil sem nome', status: 'planning' as const,
            funnel: f.context ? { type: f.type || '', architecture: '', targetAudience: f.context?.audience?.who || '', mainGoal: f.context?.objective || '', stages: [], summary: '' } : undefined,
            createdAt: f.createdAt, updatedAt: f.updatedAt,
          }));

        const all = [...cData, ...virtual].sort((a, b) => ((b.updatedAt as any)?.seconds || 0) - ((a.updatedAt as any)?.seconds || 0));
        setCampaigns(all);
      } catch (e) {
        console.error('Error loading campaigns:', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = campaigns.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()));
  const totalActive = campaigns.filter(c => c.status === 'active').length;
  const avgCongruence = campaigns.length > 0
    ? Math.round(campaigns.reduce((sum, c) => sum + getCongruence(c), 0) / campaigns.length)
    : 0;

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ HEADER ══════════════════════════════════════════════════════ */}
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-0 max-w-[1440px] mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">
              Campanhas
            </h1>
            <Link
              href="/funnels/new"
              className="text-[11px] font-mono font-bold tracking-wider text-[#0D0B09] bg-[#E6B447] hover:bg-[#F0C35C] px-4 py-2 transition-colors flex items-center gap-2"
            >
              <Plus className="h-3.5 w-3.5" />
              NOVA CAMPANHA
            </Link>
          </div>

          {/* KPI bar */}
          <div className="grid grid-cols-3 border border-white/[0.06] divide-x divide-white/[0.06] mb-8">
            <div className="px-6 py-5 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Total</p>
              <p className="text-[36px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">{campaigns.length}</p>
            </div>
            <div className="px-6 py-5 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Ativas</p>
              <p className="text-[36px] font-mono font-black tabular-nums text-[#E6B447] leading-none">{totalActive}</p>
            </div>
            <div className="px-6 py-5 bg-[#0D0B09]">
              <p className="text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] mb-1">Congruência Média</p>
              <p className="text-[36px] font-mono font-black tabular-nums text-[#F5E8CE] leading-none">
                {avgCongruence}<span className="text-[11px] font-normal text-[#6B5D4A] ml-1">%</span>
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-0">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B5D4A]" />
            <input
              type="text"
              placeholder="Buscar campanha..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-10 pl-7 pr-4 bg-transparent border-b border-white/[0.06] text-sm text-[#F5E8CE] placeholder:text-[#6B5D4A] focus:outline-none focus:border-[#E6B447]/40 font-mono transition-colors"
            />
          </div>
        </div>
      </header>

      {/* ═══ CONTENT ═════════════════════════════════════════════════════ */}
      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full">
        {loading ? (
          <div className="space-y-px">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-[#1A1612] animate-pulse border-b border-white/[0.04]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          search ? (
            <div className="py-20 text-center">
              <p className="text-[#6B5D4A] text-sm font-mono">
                Nenhuma campanha para "{search}"
              </p>
            </div>
          ) : (
            <GuidedEmptyState
              icon={ChevronRight}
              title="Nenhuma campanha ativa"
              description="Aprove um funil para ativar a Linha de Ouro."
              ctaLabel="Ver Pipeline de Funis"
              ctaHref="/funnels"
              tips={[
                'Funis aprovados ativam automaticamente a estrutura de campanha',
                'A Linha de Ouro conecta funil, copy, social, design e ads',
              ]}
            />
          )
        ) : (
          <div className="border border-white/[0.06] divide-y divide-white/[0.04]">
            {/* Table header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1A1612]/50">
              <div className="col-span-4 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">Campanha</div>
              <div className="col-span-3 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A]">Linha de Ouro</div>
              <div className="col-span-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] text-right">Congruência</div>
              <div className="col-span-2 text-[9px] font-mono font-bold uppercase tracking-[0.2em] text-[#6B5D4A] text-right">Status</div>
              <div className="col-span-1" />
            </div>

            {/* Campaign rows */}
            {filtered.map((campaign) => {
              const done = getStageDone(campaign);
              const congruence = getCongruence(campaign);
              const completedCount = Object.values(done).filter(Boolean).length;
              const isComplete = congruence === 100;

              return (
                <Link key={campaign.id} href={`/campaigns/${campaign.id}`}>
                  <div className="grid grid-cols-12 gap-4 px-6 py-5 bg-[#0D0B09] hover:bg-[#1A1612] transition-colors cursor-pointer group items-center">
                    {/* Name + goal */}
                    <div className="col-span-4">
                      <p className="text-[15px] font-bold text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors truncate">
                        {campaign.name}
                      </p>
                      <p className="text-[11px] text-[#6B5D4A] truncate mt-0.5">
                        {campaign.funnel?.targetAudience || campaign.funnel?.mainGoal || '—'}
                      </p>
                    </div>

                    {/* Stage progress — segmented bar */}
                    <div className="col-span-3 flex items-center gap-1">
                      {STAGES.map((stage) => (
                        <div key={stage} className="flex-1 group/stage" title={`${STAGE_LABELS[stage]}: ${done[stage] ? '✓' : '—'}`}>
                          <div className={cn(
                            "h-2 transition-colors",
                            done[stage]
                              ? "bg-[#E6B447]"
                              : "bg-white/[0.06]"
                          )} />
                          <p className="text-[8px] font-mono text-[#6B5D4A] mt-1 text-center uppercase">
                            {STAGE_LABELS[stage]}
                          </p>
                        </div>
                      ))}
                    </div>

                    {/* Congruence number */}
                    <div className="col-span-2 text-right">
                      <span className={cn(
                        "text-2xl font-mono font-black tabular-nums",
                        isComplete ? "text-[#E6B447]" : congruence >= 60 ? "text-[#F5E8CE]" : "text-[#AB8648]"
                      )}>
                        {congruence}
                      </span>
                      <span className="text-[10px] text-[#6B5D4A] ml-0.5">%</span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 text-right">
                      <span className={cn(
                        "text-[10px] font-mono font-bold uppercase tracking-wider",
                        isComplete ? "text-[#E6B447]" :
                        campaign.status === 'active' ? "text-[#E6B447]" :
                        "text-[#6B5D4A]"
                      )}>
                        {isComplete ? 'Completa' : campaign.status === 'active' ? 'Ativa' : campaign.status}
                      </span>
                    </div>

                    {/* Arrow */}
                    <div className="col-span-1 text-right">
                      <ChevronRight className="h-4 w-4 text-[#6B5D4A] group-hover:text-[#E6B447] group-hover:translate-x-1 transition-all inline-block" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
