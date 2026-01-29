'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Globe, Building2, Filter, Target, ChevronDown } from 'lucide-react';
import { useContextStore } from '@/lib/stores/context-store';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu';

/**
 * Componente que mostra a hierarquia de contexto atual no Header.
 * Permite visualizar e navegar entre Marca > Funil > Campanha.
 */
export function ContextIndicator() {
  const { currentScope, names, setScope } = useContextStore();

  const renderItem = (label: string | undefined, icon: React.ReactNode, level: string, isActive: boolean) => {
    if (!label && level !== 'universal') return null;
    
    return (
      <div className="flex items-center">
        {level !== 'universal' && (
          <ChevronRight className="h-3.5 w-3.5 text-zinc-600 mx-1" />
        )}
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors",
          isActive ? "bg-white/[0.06] text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]"
        )}>
          {icon}
          <span className="text-xs font-medium truncate max-w-[120px]">
            {label || 'Universal'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex items-center bg-zinc-950/50 border border-white/[0.04] rounded-lg px-1.5 py-1">
      {/* Nível Universal (Sempre visível como base) */}
      {renderItem('Universal', <Globe className="h-3 w-3" />, 'universal', currentScope.level === 'universal')}

      {/* Nível Marca */}
      {names.brand && renderItem(names.brand, <Building2 className="h-3 w-3" />, 'brand', currentScope.level === 'brand')}

      {/* Nível Funil */}
      {names.funnel && renderItem(names.funnel, <Filter className="h-3 w-3" />, 'funnel', currentScope.level === 'funnel')}

      {/* Nível Campanha */}
      {names.campaign && renderItem(names.campaign, <Target className="h-3 w-3" />, 'campaign', currentScope.level === 'campaign')}
      
      {/* Dropdown para troca rápida ou info */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="ml-1 p-1 hover:bg-white/[0.05] rounded-md transition-colors">
            <ChevronDown className="h-3 w-3 text-zinc-500" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-zinc-900 border-white/[0.06]">
          <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-zinc-500">
            Escopo de Dados Ativo
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-white/[0.06]" />
          
          <DropdownMenuItem 
            className="flex items-center gap-2 text-xs py-2.5"
            onClick={() => setScope({ level: 'universal' }, {})}
          >
            <Globe className="h-3.5 w-3.5 text-blue-400" />
            <span>Redefinir para Universal</span>
          </DropdownMenuItem>

          {names.brand && (
            <DropdownMenuItem 
              className="flex items-center gap-2 text-xs py-2.5"
              onClick={() => setScope({ level: 'brand', brandId: currentScope.brandId }, { brand: names.brand })}
            >
              <Building2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Focar na Marca: {names.brand}</span>
            </DropdownMenuItem>
          )}

          {names.funnel && (
            <DropdownMenuItem 
              className="flex items-center gap-2 text-xs py-2.5"
              onClick={() => setScope(
                { level: 'funnel', brandId: currentScope.brandId, funnelId: currentScope.funnelId }, 
                { brand: names.brand, funnel: names.funnel }
              )}
            >
              <Filter className="h-3.5 w-3.5 text-purple-400" />
              <span>Focar no Funil: {names.funnel}</span>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
