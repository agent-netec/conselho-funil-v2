'use client';

import { useUser } from '@/lib/hooks/use-user';
import { Progress } from '@/components/ui/progress';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import { Zap, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CONFIG } from '@/lib/config';

import { useActiveBrand } from '@/lib/hooks/use-active-brand';

export function UserUsageWidget() {
  const userData = useUser();
  const activeBrand = useActiveBrand();
  const user = userData?.user;
  const isLoading = userData?.isLoading;

  if (isLoading || !user) return null;

  const credits = user.credits ?? 0;
  const usage = user.usage ?? 0;
  
  // ST-21.6: Consumo real da marca ativa
  const brandUsage = activeBrand?.usageLimit?.currentDailyUsage || 0;
  const brandLimit = activeBrand?.usageLimit?.dailyLimit || 5.0;
  const brandPercentage = Math.min((brandUsage / brandLimit) * 100, 100);

  const total = credits + usage || 10; // Fallback to 10 if both are 0
  const percentage = (credits / total) * 100;
  
  // Alert if credits are low (<= 2)
  // CRITICAL Alert if credits are 0 AND limit is enabled
  const isLow = credits <= 2 || brandPercentage > 80; 
  const isZero = credits <= 0 || brandPercentage >= 100;
  const isBlocked = (credits <= 0 && CONFIG.ENABLE_CREDIT_LIMIT) || (brandPercentage >= 100);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center gap-1 cursor-help group">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl border transition-all duration-200",
            isBlocked
              ? "border-red-500/50 bg-red-500/10 text-red-500 shadow-[0_0_12px_rgba(239,68,68,0.3)]"
              : isLow 
                ? "border-amber-500/50 bg-amber-500/10 text-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.2)]" 
                : "border-white/[0.06] bg-white/[0.02] text-zinc-500 group-hover:border-violet-500/50 group-hover:text-violet-400"
          )}>
            {isBlocked ? <AlertCircle className="h-5 w-5 animate-bounce" /> : isLow ? <AlertCircle className="h-5 w-5 animate-pulse" /> : <Zap className="h-5 w-5" />}
          </div>
          
          {/* Barra de progresso dupla: Créditos (Violeta) e Marca (Esmeralda se OK, Amber se alto) */}
          <div className="w-8 h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex flex-col gap-0.5">
            <div 
              className={cn(
                "h-0.5 transition-all duration-500",
                credits <= 0 ? "bg-red-500" : "bg-violet-500"
              )}
              style={{ width: `${percentage}%` }}
            />
            <div 
              className={cn(
                "h-0.5 transition-all duration-500",
                brandPercentage > 90 ? "bg-red-500" : brandPercentage > 70 ? "bg-amber-500" : "bg-emerald-500"
              )}
              style={{ width: `${brandPercentage}%` }}
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
          {/* Seção de Créditos do Usuário */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Créditos Pessoais</span>
              <span className={cn(
                "text-xs font-bold",
                credits <= 0 ? "text-red-500" : "text-violet-400"
              )}>
                {credits}
              </span>
            </div>
            <Progress value={percentage} className="h-1" indicatorClassName="bg-violet-500" />
          </div>

          {/* Seção de Orçamento da Marca */}
          {activeBrand && (
            <div className="space-y-1.5 pt-2 border-t border-white/[0.04]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Budget: {activeBrand.name}</span>
                <span className={cn(
                  "text-xs font-bold",
                  brandPercentage >= 100 ? "text-red-500" : brandPercentage > 80 ? "text-amber-500" : "text-emerald-400"
                )}>
                  ${brandUsage.toFixed(2)} / ${brandLimit.toFixed(0)}
                </span>
              </div>
              <Progress 
                value={brandPercentage} 
                className="h-1" 
                indicatorClassName={cn(
                  brandPercentage > 90 ? "bg-red-500" : brandPercentage > 70 ? "bg-amber-500" : "bg-emerald-500"
                )} 
              />
            </div>
          )}
          
          <p className="text-[10px] text-zinc-500 leading-relaxed italic">
            {isBlocked 
              ? "Limite atingido. As chamadas de IA foram suspensas para evitar custos excedentes." 
              : "O consumo é calculado com base em tokens e requisições de API."}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}


