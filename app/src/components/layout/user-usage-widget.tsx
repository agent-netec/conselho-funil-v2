'use client';

import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTier } from '@/lib/hooks/use-tier';

export function UserUsageWidget() {
  const { credits, effectiveTier, tierDisplayName, isLoading } = useTier();

  if (isLoading) return null;

  // Free tier has no credits
  if (effectiveTier === 'free') {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex flex-col items-center gap-1 cursor-help group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-700/50 bg-zinc-800/30 text-zinc-500">
              <Zap className="h-5 w-5" />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent
          side="right"
          sideOffset={12}
          className="bg-[#0c0c0e] border-zinc-800/80 p-3 w-56 shadow-xl"
        >
          <p className="text-xs text-zinc-400">Plano Free — limites diários.</p>
          <p className="text-[10px] text-zinc-500 mt-1">Faça upgrade para créditos mensais.</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  const { monthlyCredits, remaining, daysUntilReset } = credits;
  const percentage = monthlyCredits > 0 ? ((monthlyCredits - remaining) / monthlyCredits) * 100 : 0;
  const percentRemaining = monthlyCredits > 0 ? (remaining / monthlyCredits) * 100 : 0;

  const isLow = percentRemaining < 20 && percentRemaining > 5;
  const isCritical = percentRemaining <= 5;
  const isEmpty = remaining <= 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1 cursor-help group">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
            isEmpty
              ? "border-red-500/50 bg-red-500/10 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              : isCritical
                ? "border-red-500/30 bg-red-500/5 text-red-400"
                : isLow
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
                  : "border-white/[0.06] bg-white/[0.02] text-zinc-500 group-hover:border-violet-500/50 group-hover:text-violet-400"
          )}>
            {isEmpty ? (
              <AlertCircle className="h-5 w-5 animate-bounce" />
            ) : isCritical ? (
              <AlertCircle className="h-5 w-5 animate-pulse" />
            ) : (
              <Zap className="h-5 w-5" />
            )}
          </div>

          {/* Credit progress bar */}
          <div className="w-8 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-500 rounded-full",
                isEmpty ? "bg-red-500" : isCritical ? "bg-red-400" : isLow ? "bg-amber-500" : "bg-violet-500"
              )}
              style={{ width: `${percentRemaining}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent
        side="right"
        sideOffset={12}
        className="bg-[#0c0c0e] border-zinc-800/80 p-3 w-56 shadow-xl"
      >
        <div className="space-y-3">
          {/* Credit section */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Créditos {tierDisplayName}
              </span>
              <span className={cn(
                "text-xs font-bold",
                isEmpty ? "text-red-500" : isCritical ? "text-red-400" : isLow ? "text-amber-500" : "text-violet-400"
              )}>
                {remaining}/{monthlyCredits}
              </span>
            </div>
            <Progress
              value={percentage}
              className="h-1"
              indicatorClassName={cn(
                isEmpty ? "bg-red-500" : isCritical ? "bg-red-400" : isLow ? "bg-amber-500" : "bg-violet-500"
              )}
            />
          </div>

          {/* Reset info */}
          {daysUntilReset > 0 && (
            <div className="pt-1 border-t border-white/[0.04]">
              <span className="text-[10px] text-zinc-500">
                Reset em {daysUntilReset} {daysUntilReset === 1 ? 'dia' : 'dias'}
              </span>
            </div>
          )}

          <p className="text-[10px] text-zinc-500 leading-relaxed italic">
            {isEmpty
              ? "Créditos esgotados. Aguarde o reset mensal ou faça upgrade."
              : isCritical
                ? "Créditos acabando! Use com moderação até o próximo reset."
                : "Créditos são consumidos a cada ação de IA."}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
