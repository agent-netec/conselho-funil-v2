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

export function UserUsageWidget() {
  const { user, isLoading } = useUser();

  if (isLoading || !user) return null;

  const credits = user.credits ?? 0;
  const usage = user.usage ?? 0;
  const total = credits + usage || 10; // Fallback to 10 if both are 0
  const percentage = (credits / total) * 100;
  
  // Alert if credits are low (<= 2)
  // CRITICAL Alert if credits are 0 AND limit is enabled
  const isLow = credits <= 2; 
  const isZero = credits <= 0;
  const isBlocked = isZero && CONFIG.ENABLE_CREDIT_LIMIT;

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
          
          <div className="w-8 h-1 rounded-full bg-white/[0.06] overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-500",
                isBlocked ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-violet-500"
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent 
        side="right" 
        sideOffset={12}
        className="bg-[#0c0c0e] border-zinc-800/80 p-3 w-48 shadow-xl"
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Créditos Disponíveis</span>
            <span className={cn(
              "text-xs font-bold",
              isBlocked ? "text-red-500" : isLow ? "text-amber-500" : "text-white"
            )}>
              {credits}
            </span>
          </div>
          
          <Progress 
            value={percentage} 
            className="h-1.5"
            indicatorClassName={cn(
              "bg-none", // Remove default gradient
              isBlocked ? "bg-red-500" : isLow ? "bg-amber-500" : "bg-violet-500"
            )} 
          />
          
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            {isBlocked 
              ? "Seu limite de créditos gratuito foi atingido." 
              : `Cada resposta do conselho consome 1 crédito. Seu uso atual é de ${usage} mensagens.`}
          </p>
          
          {isBlocked ? (
            <div className="pt-1">
              <div className="rounded bg-red-500/10 px-2 py-1 text-[10px] text-red-500 font-bold text-center">
                LIMITE ATINGIDO
              </div>
            </div>
          ) : isLow ? (
            <div className="pt-1">
              <div className="rounded bg-amber-500/10 px-2 py-1 text-[10px] text-amber-500 font-medium">
                Saldo baixo! Faça upgrade em breve.
              </div>
            </div>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

