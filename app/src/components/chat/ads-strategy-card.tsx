'use client';

import { useState } from 'react';
import {
  Target,
  Megaphone,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  Loader2,
  Users,
  BarChart3,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { updateCampaignManifesto } from '@/lib/firebase/firestore';
import { toast } from 'sonner';
import Link from 'next/link';

export interface AdsStrategyData {
  audiences: string[];
  channels: string[];
  suggestedBudget?: string;
  performanceBenchmarks?: {
    targetCPC?: number;
    targetCTR?: number;
    targetCPA?: number;
  };
  strategyRationale?: string;
  counselorInsights?: Array<{
    counselor: string;
    insight: string;
  }>;
}

interface AdsStrategyCardProps {
  strategyData: AdsStrategyData;
  campaignId?: string | null;
}

export function AdsStrategyCard({ strategyData, campaignId }: AdsStrategyCardProps) {
  const [isSelecting, setIsSelecting] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  const handleSelectForCampaign = async () => {
    if (!campaignId) return;

    setIsSelecting(true);
    try {
      await updateCampaignManifesto(campaignId, {
        ads: {
          audiences: strategyData.audiences || [],
          channels: strategyData.channels || [],
          suggestedBudget: strategyData.suggestedBudget,
          performanceBenchmarks: strategyData.performanceBenchmarks,
        },
        status: 'active',
      });

      setIsSelected(true);
      toast.success('Estratégia de Ads salva na Linha de Ouro!');
    } catch (err) {
      console.error('Erro ao salvar estratégia de ads:', err);
      toast.error('Erro ao salvar estratégia. Tente novamente.');
    } finally {
      setIsSelecting(false);
    }
  };

  const benchmarks = strategyData.performanceBenchmarks;

  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-emerald-500/10 bg-emerald-500/[0.05]">
        <Megaphone className="h-4 w-4 text-emerald-400" />
        <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">
          Estratégia de Ads
        </span>
      </div>

      <div className="p-4 space-y-4">
        {/* Audiences */}
        {strategyData.audiences?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Users className="h-3.5 w-3.5 text-blue-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Audiências</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {strategyData.audiences.map((audience, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300"
                >
                  <Target className="h-3 w-3" />
                  {audience}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Channels */}
        {strategyData.channels?.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Megaphone className="h-3.5 w-3.5 text-purple-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Canais</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {strategyData.channels.map((channel, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300"
                >
                  {channel}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Budget + Benchmarks row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {strategyData.suggestedBudget && (
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <DollarSign className="h-3 w-3 text-green-400" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase">Budget</span>
              </div>
              <p className="text-sm font-bold text-green-300">{strategyData.suggestedBudget}</p>
            </div>
          )}
          {benchmarks?.targetCPC != null && (
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <BarChart3 className="h-3 w-3 text-amber-400" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase">CPC</span>
              </div>
              <p className="text-sm font-bold text-amber-300">R$ {benchmarks.targetCPC.toFixed(2)}</p>
            </div>
          )}
          {benchmarks?.targetCTR != null && (
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-cyan-400" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase">CTR</span>
              </div>
              <p className="text-sm font-bold text-cyan-300">{benchmarks.targetCTR}%</p>
            </div>
          )}
          {benchmarks?.targetCPA != null && (
            <div className="rounded-lg bg-zinc-800/50 border border-zinc-700/50 p-3">
              <div className="flex items-center gap-1 mb-1">
                <Target className="h-3 w-3 text-rose-400" />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase">CPA</span>
              </div>
              <p className="text-sm font-bold text-rose-300">R$ {benchmarks.targetCPA.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Counselor Insights */}
        {strategyData.counselorInsights && strategyData.counselorInsights.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 mb-1">
              <Lightbulb className="h-3.5 w-3.5 text-yellow-400" />
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Insights dos Conselheiros</span>
            </div>
            {strategyData.counselorInsights.map((item, i) => (
              <div key={i} className="flex gap-2 p-2 rounded-lg bg-zinc-800/30 border border-zinc-700/30">
                <span className="text-[11px] font-bold text-emerald-400 whitespace-nowrap">{item.counselor}:</span>
                <span className="text-[11px] text-zinc-400">{item.insight}</span>
              </div>
            ))}
          </div>
        )}

        {/* Strategy Rationale */}
        {strategyData.strategyRationale && (
          <p className="text-xs text-zinc-500 italic border-t border-zinc-800 pt-3">
            {strategyData.strategyRationale}
          </p>
        )}

        {/* Action Buttons */}
        {campaignId && (
          <div className="border-t border-emerald-500/10 pt-3 space-y-2">
            {isSelected ? (
              <>
                <div className="flex items-center gap-2 justify-center text-emerald-400 py-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-semibold">Estratégia salva na Linha de Ouro!</span>
                </div>
                <Link
                  href={`/campaigns/${campaignId}`}
                  className={cn(
                    'flex items-center justify-center gap-2 w-full rounded-lg px-4 py-2.5',
                    'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300',
                    'hover:bg-emerald-500/30 transition-colors text-sm font-semibold'
                  )}
                >
                  Ver Command Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <Button
                onClick={handleSelectForCampaign}
                disabled={isSelecting}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                {isSelecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Selecionar para Linha de Ouro
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
