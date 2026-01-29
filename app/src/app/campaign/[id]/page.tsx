'use client';

import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Target, 
  Layout, 
  ShieldCheck, 
  ArrowRight, 
  ImageIcon, 
  FileText, 
  TrendingUp,
  Activity,
  Box,
  Layers
} from 'lucide-react';
import { useCampaignData } from '@/lib/hooks/use-campaign-data';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export default function CampaignPage() {
  const { id } = useParams();
  const { campaign, brand, assets, isCongruent, isLoading, error } = useCampaignData(id as string);

  if (isLoading) return <CampaignLoading />;
  if (error || !campaign) return <CampaignError error={error} />;

  return (
    <div className="flex h-screen flex-col bg-[#09090b] text-white overflow-hidden">
      <Header 
        title="Campaign Command Center" 
        subtitle={`Manifesto: ${campaign.name}`}
        actions={
          <div className="flex items-center gap-3">
            {isCongruent && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <ShieldCheck className="h-4 w-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Congruência Garantida</span>
              </div>
            )}
            <div className="px-3 py-1.5 rounded-full bg-zinc-900 border border-white/5 text-zinc-500 text-[10px] font-mono">
              ID: {campaign.id.split('_').pop()}
            </div>
          </div>
        }
      />

      <main className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Top Row: Eixo Estratégico & Status */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 p-6 rounded-3xl bg-zinc-900/40 border border-white/[0.05] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                <Target className="h-32 w-32" />
              </div>
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Eixo Estratégico</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Objetivo</p>
                  <p className="text-sm font-medium text-zinc-200">{brand?.description || 'Não definido'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Público-Alvo</p>
                  <p className="text-sm font-medium text-zinc-200">{brand?.targetAudience || 'Não definido'}</p>
                </div>
                <div>
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Oferta Principal</p>
                  <p className="text-sm font-medium text-zinc-200">{brand?.toneOfVoice || 'Não definido'}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-6 rounded-3xl bg-emerald-500/[0.02] border border-emerald-500/10 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Performance Real-Time</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">Health Score</span>
                    <span className="text-xs font-black text-emerald-400">98/100</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98%' }}
                      className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center gap-2 text-zinc-500">
                <Activity className="h-4 w-4 animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-widest">Monitorando Golden Thread...</span>
              </div>
            </motion.div>
          </div>

          {/* Middle Row: Funnel Architecture & Copy Assets */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 relative">
            {/* Visual Connection Line (Desktop) */}
            <div className="hidden lg:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
              <motion.div 
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                className="w-16 h-[2px] bg-gradient-to-r from-emerald-500/20 to-indigo-500/20"
              />
            </div>

            {/* Funnel Architecture */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-[2rem] bg-zinc-900/60 border border-white/[0.08] shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <Layers className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Arquitetura do Funil</h3>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">v1.4 APROVADO</span>
              </div>

              <div className="space-y-4">
                {campaign.funnel?.steps.map((step, i) => (
                  <div key={i} className="group relative">
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] transition-all hover:bg-white/[0.04] hover:border-white/[0.1]">
                      <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-white/5">
                        0{i + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-black text-white uppercase tracking-tighter">{step.type}</p>
                        <p className="text-[10px] text-zinc-500 truncate">{step.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-emerald-500 transition-colors" />
                    </div>
                    {i < campaign.funnel.steps.length - 1 && (
                      <div className="ml-4 h-4 w-[1px] bg-white/10" />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Copy Assets */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-8 rounded-[2rem] bg-zinc-900/60 border border-white/[0.08] shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em]">Ativos de Copy</h3>
                </div>
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-6 w-6 rounded-full border-2 border-zinc-900 bg-zinc-800" />
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-indigo-500/[0.03] border border-indigo-500/10">
                  <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mb-2">Headline Principal</p>
                  <p className="text-lg font-black tracking-tight leading-tight text-white italic">
                    "A Revolução da Inteligência Visual no seu Funil de Vendas."
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">CTA Primário</p>
                    <p className="text-xs font-bold text-zinc-200">Invocar o Conselho</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest mb-1">Ângulo de Venda</p>
                    <p className="text-xs font-bold text-zinc-200">Autoridade & Prova</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom Row: Creative Gallery */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-[0.2em]">Galeria de Criativos (Visual AI)</h3>
              </div>
              <button className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-colors">Ver Todos</button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {assets.filter(a => a.type === 'image').slice(0, 5).map((asset, i) => (
                <motion.div
                  key={asset.id}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="aspect-[4/5] rounded-2xl bg-zinc-900 border border-white/[0.05] overflow-hidden relative group cursor-pointer shadow-xl"
                >
                  <img src={asset.url} alt={asset.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-[10px] font-black text-white uppercase tracking-tighter line-clamp-1">{asset.name}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <TrendingUp className="h-3 w-3 text-emerald-400" />
                      <span className="text-[9px] font-bold text-emerald-400">Score 94</span>
                    </div>
                  </div>
                </motion.div>
              ))}
              {assets.filter(a => a.type === 'image').length === 0 && (
                [1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="aspect-[4/5] rounded-2xl bg-zinc-900/40 border border-dashed border-white/5 flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-zinc-800" />
                  </div>
                ))
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

function CampaignLoading() {
  return (
    <div className="flex h-screen flex-col bg-[#09090b] p-6 space-y-8">
      <Skeleton className="h-20 w-full bg-zinc-900/50 rounded-2xl" />
      <div className="grid grid-cols-3 gap-6">
        <Skeleton className="h-40 col-span-2 bg-zinc-900/50 rounded-3xl" />
        <Skeleton className="h-40 bg-zinc-900/50 rounded-3xl" />
      </div>
      <div className="grid grid-cols-2 gap-8">
        <Skeleton className="h-96 bg-zinc-900/50 rounded-[2rem]" />
        <Skeleton className="h-96 bg-zinc-900/50 rounded-[2rem]" />
      </div>
    </div>
  );
}

function CampaignError({ error }: { error: string | null }) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#09090b] text-white p-6 text-center">
      <Box className="h-16 w-16 text-zinc-800 mb-6" />
      <h2 className="text-xl font-black uppercase tracking-widest mb-2">Sistema Offline</h2>
      <p className="text-zinc-500 max-w-md">{error || 'Campanha não encontrada ou acesso negado pelo protocolo de segurança.'}</p>
    </div>
  );
}
