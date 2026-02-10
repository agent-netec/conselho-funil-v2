'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Header } from '@/components/layout/header';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { Zap, ChevronRight, Search, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CampaignContext } from '@/types/campaign';

// Calcula quantas etapas da Linha de Ouro estão completas
function getCompletedStages(campaign: CampaignContext) {
  const stages = [
    { id: 'funnel', label: 'Funil', done: Boolean(campaign.funnel) },
    { id: 'copy', label: 'Copy', done: Boolean(campaign.copywriting) },
    { id: 'social', label: 'Social', done: Boolean(campaign.social) },
    { id: 'design', label: 'Design', done: Boolean(campaign.design) },
    { id: 'ads', label: 'Ads', done: Boolean(campaign.ads) },
  ];
  return stages;
}

function getCongruencePercent(campaign: CampaignContext): number {
  const stages = getCompletedStages(campaign);
  const completed = stages.filter(s => s.done).length;
  return Math.round((completed / stages.length) * 100);
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const activeBrand = useActiveBrand();

  useEffect(() => {
    async function loadCampaigns() {
      try {
        // Busca campanhas reais da coleção 'campaigns'
        const campaignsQuery = query(
          collection(db, 'campaigns'),
          where('status', 'in', ['planning', 'active', 'archived'])
        );
        const campaignsSnap = await getDocs(campaignsQuery);
        const campaignsData = campaignsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as CampaignContext[];

        // Também busca funis aprovados que ainda não têm campanha (fallback)
        const funnelsQuery = query(
          collection(db, 'funnels'),
          where('status', 'in', ['approved', 'executing', 'completed', 'review'])
        );
        const funnelsSnap = await getDocs(funnelsQuery);
        const funnelsData = funnelsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        // IDs de funis que já têm campanha
        const funnelIdsWithCampaign = new Set(
          campaignsData.map(c => c.funnelId).filter(Boolean)
        );

        // Funis aprovados sem campanha → criar entrada virtual
        const virtualCampaigns: CampaignContext[] = funnelsData
          .filter(f => !funnelIdsWithCampaign.has(f.id))
          .map(f => ({
            id: f.id,
            funnelId: f.id,
            brandId: f.brandId || '',
            userId: f.userId || '',
            name: f.name || 'Funil sem nome',
            status: 'planning' as const,
            funnel: f.context ? {
              type: f.type || '',
              architecture: '',
              targetAudience: f.context?.audience?.who || '',
              mainGoal: f.context?.objective || '',
              stages: [],
              summary: '',
            } : undefined,
            createdAt: f.createdAt,
            updatedAt: f.updatedAt,
          }));

        const all = [...campaignsData, ...virtualCampaigns];
        all.sort((a, b) => {
          const dateA = (a.updatedAt as any)?.seconds || 0;
          const dateB = (b.updatedAt as any)?.seconds || 0;
          return dateB - dateA;
        });

        setCampaigns(all);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    }

    loadCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Golden Thread Center" subtitle="Governança de Campanhas" />

      <div className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Zap className="h-6 w-6 text-amber-400" />
              </div>
              Suas Campanhas
            </h2>
            <p className="text-zinc-500 text-sm mt-2 max-w-md">
              Acompanhe a evolução estratégica dos seus funis aprovados para a Linha de Ouro.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar campanha..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-zinc-900 border border-white/[0.05] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
            <Link href="/funnels/new">
              <button className="btn-accent bg-amber-600 hover:bg-amber-500 border-amber-500/20 whitespace-nowrap">
                <Plus className="mr-2 h-4 w-4" />
                Nova Campanha
              </button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-56 rounded-2xl bg-zinc-900/50 animate-pulse border border-white/[0.03]" />
            ))}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-premium p-16 text-center border-dashed border-zinc-800"
          >
            <div className="h-20 w-20 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-zinc-700" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {searchQuery ? 'Nenhuma campanha encontrada' : 'O Manifesto está aguardando'}
            </h3>
            <p className="text-zinc-500 max-w-sm mx-auto mb-8 leading-relaxed">
              {searchQuery
                ? `Não encontramos campanhas para "${searchQuery}".`
                : 'Aprove um funil estratégico para ativar a Linha de Ouro e começar sua jornada rumo ao Ads de alta performance.'}
            </p>
            <Link href="/funnels">
              <button className="btn-accent bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-white/[0.05] px-8">
                Ir para Pipeline de Funis
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCampaigns.map((campaign, index) => {
              const stages = getCompletedStages(campaign);
              const congruence = getCongruencePercent(campaign);
              const completedCount = stages.filter(s => s.done).length;
              const isComplete = congruence === 100;

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link href={`/campaigns/${campaign.id}`}>
                    <div className="card-premium group hover:border-amber-500/30 transition-all cursor-pointer h-full flex flex-col p-0 overflow-hidden">
                      <div className="p-6 flex-1">
                        <div className="flex items-center justify-between mb-6">
                          <div className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                            isComplete
                              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/10 border-amber-500/20 text-amber-400 group-hover:bg-amber-500/20"
                          )}>
                            {isComplete ? <CheckCircle2 className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                          </div>
                          <div className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/[0.02]",
                            isComplete ? "bg-emerald-500/10 text-emerald-400" :
                            campaign.status === 'active' ? "bg-amber-500/10 text-amber-400" :
                            "bg-zinc-800 text-zinc-500"
                          )}>
                            {isComplete ? 'Completa' : campaign.status === 'active' ? 'Ativa' : campaign.status}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors mb-3">
                          {campaign.name}
                        </h3>
                        <p className="text-sm text-zinc-500 line-clamp-2 leading-relaxed">
                          {campaign.funnel?.mainGoal || 'Estratégia multicanal'}
                          {campaign.funnel?.targetAudience ? ` • ${campaign.funnel.targetAudience.slice(0, 50)}` : ''}
                        </p>
                      </div>

                      <div className="px-6 py-5 bg-white/[0.01] border-t border-white/[0.04]">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
                            <span className="text-zinc-500">Congruência Estratégica</span>
                            <span className={cn(
                              isComplete ? "text-emerald-400" : congruence >= 60 ? "text-amber-400" : "text-orange-400"
                            )}>{congruence}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                isComplete
                                  ? "bg-gradient-to-r from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                  : "bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                              )}
                              style={{ width: `${congruence}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between pt-3">
                            <div className="flex items-center gap-3">
                              <div className="flex -space-x-1.5">
                                {stages.map((stage) => (
                                  <div
                                    key={stage.id}
                                    title={`${stage.label}: ${stage.done ? 'Completo' : 'Pendente'}`}
                                    className={cn(
                                      "h-6 w-6 rounded-full border-2 border-zinc-950 flex items-center justify-center",
                                      stage.done ? "bg-emerald-500/20" : "bg-zinc-800"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-1.5 w-1.5 rounded-full",
                                      stage.done
                                        ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                                        : "bg-zinc-600"
                                    )} />
                                  </div>
                                ))}
                              </div>
                              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                                {completedCount}/{stages.length} Etapas
                              </span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-amber-500 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
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
