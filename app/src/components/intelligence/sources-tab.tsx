'use client';

import * as React from 'react';
import { 
  Plus, 
  Search, 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  AlertCircle,
  CheckCircle2,
  MoreVertical,
  Settings2,
  Trash2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useBrandStore } from '@/lib/stores/brand-store';
import { useContextStore } from '@/lib/stores/context-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { MonitoringSource } from '@/types/intelligence';

/**
 * Aba de Fontes de Monitoramento no Intelligence Dashboard.
 * Permite configurar de onde a IA extrai insights (Exa, Firecrawl, etc).
 */
export function SourcesTab() {
  const { selectedBrand } = useBrandStore();
  const { currentScope } = useContextStore();
  
  const [sources, setSources] = React.useState<Partial<MonitoringSource>[]>([]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <RefreshCw className="h-4 w-4 text-zinc-500 animate-spin" />;
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'reddit': return <Globe className="h-4 w-4 text-orange-500" />;
      case 'twitter': return <Globe className="h-4 w-4 text-blue-400" />;
      default: return <Globe className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Fontes de Inteligência</h2>
          <p className="text-sm text-zinc-500">
            Gerencie de onde extraímos dados para alimentar seus Conselheiros.
          </p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          <Plus className="h-4 w-4" />
          Adicionar Fonte
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sources.length === 0 && (
          <p className="text-sm text-zinc-500 text-center py-8 col-span-full">
            Nenhuma fonte de monitoramento configurada. Configure fontes em Inteligência &rarr; Fontes.
          </p>
        )}
        {sources.map((source) => (
          <Card key={source.id} className="bg-zinc-900/50 border-white/[0.06] hover:border-white/[0.1] transition-all group">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.03] border border-white/[0.06]">
                  {getPlatformIcon(source.platform || '')}
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(source.status || '')}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-white/[0.06]">
                      <DropdownMenuItem className="gap-2 text-xs">
                        <Settings2 className="h-3.5 w-3.5" /> Configurar
                      </DropdownMenuItem>
                      <DropdownMenuItem className="gap-2 text-xs text-red-400 focus:text-red-400">
                        <Trash2 className="h-3.5 w-3.5" /> Remover
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="mt-3">
                <CardTitle className="text-sm font-semibold text-white truncate">
                  {source.displayName}
                </CardTitle>
                <CardDescription className="text-[11px] uppercase tracking-wider font-medium mt-1">
                  {source.platform} • {source.type?.replace('_', ' ')}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="flex items-center justify-between mt-4">
                <Badge variant="outline" className={cn(
                  "text-[10px] px-1.5 py-0 border-white/[0.1]",
                  source.scope?.level === 'brand' ? "text-emerald-400" : "text-purple-400"
                )}>
                  {source.scope?.level === 'brand' ? 'Escopo: Marca' : 'Escopo: Funil'}
                </Badge>
                {source.relevanceScore && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-zinc-500">Relevância:</span>
                    <span className="text-[10px] font-bold text-emerald-500">
                      {Math.round(source.relevanceScore * 100)}%
                    </span>
                  </div>
                )}
              </div>
              {source.status === 'error' && (
                <div className="mt-3 p-2 rounded bg-red-500/5 border border-red-500/10 flex items-start gap-2">
                  <AlertCircle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-[10px] text-red-500/80 leading-tight">
                    {source.lastError}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        {/* Sugestão da IA */}
        <Card className="bg-emerald-500/[0.02] border-emerald-500/20 border-dashed hover:bg-emerald-500/[0.04] transition-all cursor-pointer">
          <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full min-h-[160px]">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
              <RefreshCw className="h-6 w-6 text-emerald-500" />
            </div>
            <h3 className="text-sm font-semibold text-emerald-400">Sugestões da IA</h3>
            <p className="text-[11px] text-zinc-500 mt-1 max-w-[180px]">
              Deixe nossa IA encontrar fontes relevantes para seu nicho.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
