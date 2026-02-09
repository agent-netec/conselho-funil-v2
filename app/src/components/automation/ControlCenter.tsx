'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldAlert,
  Zap,
  ChevronRight,
  Info,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { AutomationLog } from '@/types/automation';

interface AutomationLogCardProps {
  log: AutomationLog;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onViewDetails: (log: AutomationLog) => void;
}

export function AutomationLogCard({ log, onApprove, onReject, onViewDetails }: AutomationLogCardProps) {
  // S31: safe accessor — union type CriticalGap | KillSwitchGap tem campos distintos
  const gapDetails = log.context.gapDetails as unknown as Record<string, unknown>;
  const isCritical = gapDetails?.severity === 'critical' || log.action === 'pause_ads';
  
  const statusConfig = {
    pending_approval: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20', label: 'Aguardando Aprovação' },
    executed: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', label: 'Executado' },
    rejected: { icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-400/10', border: 'border-rose-400/20', label: 'Rejeitado' },
    failed: { icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'Falha na Execução' },
  };

  const config = statusConfig[log.status];

  return (
    <Card className={cn(
      "relative overflow-hidden border-white/[0.03] bg-zinc-900/50 transition-all hover:bg-zinc-900/80 group",
      isCritical && log.status === 'pending_approval' && "border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.05)]"
    )}>
      {isCritical && log.status === 'pending_approval' && (
        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
      )}
      
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg", config.bg)}>
              <config.icon className={cn("h-5 w-5", config.color)} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-zinc-100">{log.action === 'pause_ads' ? 'Kill-Switch: Pausar Tráfego' : 'Otimização Sugerida'}</h3>
                <Badge variant="outline" className={cn("text-[10px] uppercase font-bold tracking-wider", config.bg, config.color, config.border)}>
                  {config.label}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {new Date(log.timestamp.seconds * 1000).toLocaleString('pt-BR')} • ID: {log.id.slice(0, 8)}
              </p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onViewDetails(log)}
          >
            <ExternalLink className="h-4 w-4 text-zinc-500" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Contexto</span>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
              <span>Funil: {log.context.funnelId}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-zinc-300">
              <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
              <span>Entidade: {log.context.entityId}</span>
            </div>
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">Gatilho (Autopsy)</span>
            <div className="flex items-center gap-2 text-sm text-rose-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{(log.context.gapDetails as unknown as Record<string, unknown>)?.reason as string || 'Queda acentuada de conversão'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span>Impacto Estimado:</span>
              <span className="text-rose-400 font-bold">R$ {((log.context.gapDetails as unknown as Record<string, unknown>)?.lossEstimate as number)?.toLocaleString('pt-BR') || '0,00'} / dia</span>
            </div>
          </div>
        </div>

        {log.status === 'pending_approval' && (
          <div className="flex items-center gap-3 pt-4 border-t border-white/[0.03]">
            <Button 
              variant="outline" 
              className="flex-1 border-white/[0.05] bg-zinc-800/50 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20"
              onClick={() => onReject(log.id)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Rejeitar
            </Button>
            <Button 
              className={cn(
                "flex-1 shadow-lg",
                isCritical ? "bg-rose-600 hover:bg-rose-700 shadow-rose-900/20" : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/20"
              )}
              onClick={() => onApprove(log.id)}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Aprovar Ação
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export function ControlCenterHeader({ pendingCount }: { pendingCount: number }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-5 w-5 text-emerald-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Active Optimization Control Center</h1>
        </div>
        <p className="text-zinc-500 text-sm">
          Ações de automação e otimização aguardando supervisão humana (Guardrail P0).
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-zinc-900/80 border border-white/[0.03] rounded-xl px-4 py-2 flex items-center gap-3">
          <div className="relative">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-50" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-500 leading-none mb-1">Status do Motor</span>
            <span className="text-xs font-bold text-emerald-400 leading-none">ATIVO & MONITORANDO</span>
          </div>
        </div>

        <div className="bg-zinc-900/80 border border-white/[0.03] rounded-xl px-4 py-2 flex items-center gap-3">
          <Zap className="h-4 w-4 text-amber-400" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-500 leading-none mb-1">Pendentes</span>
            <span className="text-xs font-bold text-white leading-none">{pendingCount} Ações</span>
          </div>
        </div>
      </div>
    </div>
  );
}
