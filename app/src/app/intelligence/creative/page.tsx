'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/header';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { useCreativeRanking } from '@/lib/hooks/use-creative-ranking';
import { CreativeCard } from '@/components/creative/creative-card';
import { CopyLabModal } from '@/components/creative/copy-lab-modal';
import { CreativePerformance } from '@/types/creative';
import { 
  BarChart3, 
  LayoutGrid, 
  Filter, 
  ArrowUpDown,
  Sparkles,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function CreativeIntelligencePage() {
  const { activeBrand } = useActiveBrand();
  const { ranking, isLoading } = useCreativeRanking(activeBrand?.id);
  const [selectedCreative, setSelectedCreative] = useState<CreativePerformance | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGenerateCopy = (creative: CreativePerformance) => {
    setSelectedCreative(creative);
    setIsModalOpen(true);
  };

  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Header 
        title="Creative Intelligence" 
        subtitle="Análise de Profit & Lab de Copy em Tempo Real"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-white/[0.05] text-zinc-400 hover:text-white">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </Button>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
              <Zap className="mr-2 h-4 w-4" />
              Sincronizar Ads
            </Button>
          </div>
        }
      />

      <main className="flex-1 p-6 sm:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Stats de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: 'Melhor Profit Score', value: ranking[0]?.profitScore || '0', icon: Sparkles, color: 'text-amber-400' },
              { label: 'Total Ativos', value: ranking.length, icon: LayoutGrid, color: 'text-blue-400' },
              { label: 'Fadiga Média', value: '24%', icon: BarChart3, color: 'text-rose-400' },
              { label: 'ROI Médio', value: '3.2x', icon: Zap, color: 'text-emerald-400' },
            ].map((stat, i) => (
              <div key={i} className="bg-zinc-900/30 border border-white/[0.05] rounded-2xl p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">{stat.label}</p>
                  <p className="text-xl font-black text-white">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Grid de Criativos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <LayoutGrid className="h-5 w-5 text-zinc-500" />
                Ranking de Performance
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">Ordenar por:</span>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-zinc-300 gap-1">
                  Profit Score
                  <ArrowUpDown className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="space-y-4">
                    <Skeleton className="aspect-square w-full rounded-2xl bg-zinc-900" />
                    <Skeleton className="h-4 w-3/4 bg-zinc-900" />
                    <Skeleton className="h-10 w-full rounded-xl bg-zinc-900" />
                  </div>
                ))}
              </div>
            ) : ranking.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {ranking.map((creative) => (
                  <CreativeCard 
                    key={creative.id} 
                    creative={creative} 
                    onGenerateCopy={handleGenerateCopy}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 rounded-3xl border border-dashed border-white/[0.05]">
                <p className="text-zinc-500 font-medium">Nenhum dado de performance disponível para esta marca.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal do Lab */}
      <CopyLabModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        creative={selectedCreative}
        brandId={activeBrand?.id || ''}
      />
    </div>
  );
}
