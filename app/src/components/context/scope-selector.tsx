'use client';

import * as React from 'react';
import { Shield, ShieldCheck, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataScope, ScopeLevel } from '@/types/scoped-data';
import { useContextStore } from '@/lib/stores/context-store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ScopeSelectorProps {
  onScopeChange: (scope: DataScope) => void;
  className?: string;
}

/**
 * Componente para selecionar o escopo de salvamento de um dado (Marca vs Funil).
 * Usado em formulários de pesquisa e criação de insights.
 */
export function ScopeSelector({ onScopeChange, className }: ScopeSelectorProps) {
  const { currentScope, names } = useContextStore();
  const [selectedLevel, setSelectedLevel] = React.useState<ScopeLevel>(
    currentScope.level === 'funnel' || currentScope.level === 'campaign' ? 'funnel' : 'brand'
  );

  const handleLevelChange = (level: ScopeLevel) => {
    setSelectedLevel(level);
    
    const newScope: DataScope = {
      level,
      brandId: currentScope.brandId,
      funnelId: level === 'funnel' ? currentScope.funnelId : undefined,
    };
    
    onScopeChange(newScope);
  };

  // Se não houver funil no contexto, só permite nível Marca
  const hasFunnelContext = !!currentScope.funnelId;

  return (
    <div className={cn("space-y-3 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.04]", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-medium text-white">Escopo de Visibilidade</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-zinc-500 hover:text-zinc-300">
                <Info className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs bg-zinc-800 border-white/[0.1] text-xs">
              Define quem poderá usar este dado. Dados de Marca são herdados por todos os funis. 
              Dados de Funil são isolados e específicos.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleLevelChange('brand')}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
            selectedLevel === 'brand'
              ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/20"
              : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]"
          )}
        >
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider mb-1",
            selectedLevel === 'brand' ? "text-emerald-400" : "text-zinc-500"
          )}>
            Toda a Marca
          </span>
          <span className="text-[11px] text-zinc-400 leading-tight">
            Disponível para todos os funis e campanhas de {names.brand || 'esta marca'}.
          </span>
        </button>

        <button
          onClick={() => hasFunnelContext && handleLevelChange('funnel')}
          disabled={!hasFunnelContext}
          className={cn(
            "flex flex-col items-start p-3 rounded-lg border transition-all text-left",
            selectedLevel === 'funnel'
              ? "bg-purple-500/10 border-purple-500/50 ring-1 ring-purple-500/20"
              : "bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04]",
            !hasFunnelContext && "opacity-50 cursor-not-allowed grayscale"
          )}
        >
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider mb-1",
            selectedLevel === 'funnel' ? "text-purple-400" : "text-zinc-500"
          )}>
            Apenas este Funil
          </span>
          <span className="text-[11px] text-zinc-400 leading-tight">
            Isolado para {names.funnel || 'o funil atual'}. Ideal para pesquisas específicas.
          </span>
        </button>
      </div>

      {selectedLevel === 'brand' && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-emerald-500/5 border border-emerald-500/10">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          <span className="text-[10px] text-emerald-500/80 font-medium">
            Herança ativada: Funis filhos verão este dado.
          </span>
        </div>
      )}
    </div>
  );
}
