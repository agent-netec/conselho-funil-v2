'use client';

import * as React from "react";
import { 
  Settings2, 
  History, 
  ShieldCheck, 
  Plus, 
  Play, 
  Pause, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Activity,
  UserCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AutomationRule, AutomationLog } from "@/types/automation";
import { cn } from "@/lib/utils";

interface AutomationControlCenterProps {
  rules: AutomationRule[];
  logs: AutomationLog[];
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onApproveAction: (logId: string) => void;
  onRejectAction: (logId: string) => void;
  onCreateRule: () => void;
}

export function AutomationControlCenter({
  rules,
  logs,
  onToggleRule,
  onApproveAction,
  onRejectAction,
  onCreateRule
}: AutomationControlCenterProps) {
  const pendingActions = logs.filter(l => l.status === 'pending_approval');

  return (
    <div className="space-y-6">
      {/* Header com Stats Rápidos */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Automation Control Center</h2>
          <p className="text-zinc-400">Gerencie regras inteligentes e aprove ações de escala em tempo real.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Activity className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4 text-blue-500" />
            </div>
          </div>
          <Button onClick={onCreateRule} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold">
            <Plus className="mr-2 h-4 w-4" /> Nova Regra
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-white/5 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">
            <Activity className="mr-2 h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="rules" className="data-[state=active]:bg-zinc-800">
            <Settings2 className="mr-2 h-4 w-4" /> Regras Ativas
          </TabsTrigger>
          <TabsTrigger value="audit" className="data-[state=active]:bg-zinc-800">
            <History className="mr-2 h-4 w-4" /> Log de Auditoria
          </TabsTrigger>
          <TabsTrigger value="approvals" className="data-[state=active]:bg-zinc-800 relative">
            <UserCheck className="mr-2 h-4 w-4" /> Aprovações
            {pendingActions.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                {pendingActions.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Ações Executadas (24h)</p>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-white">142</div>
                <p className="text-[10px] text-emerald-500 mt-1">+12% vs ontem</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Budget Otimizado</p>
                  <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-white">R$ 12.450</div>
                <p className="text-[10px] text-blue-500 mt-1">Economia estimada: R$ 2.100</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Aprovações Pendentes</p>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-3xl font-black text-white">{pendingActions.length}</div>
                <p className="text-[10px] text-amber-500 mt-1">Requer atenção imediata</p>
              </CardContent>
            </Card>
          </div>

          {/* Feed Rápido de Atividade */}
          <Card className="bg-zinc-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center",
                        log.status === 'executed' ? "bg-emerald-500/10 text-emerald-500" :
                        log.status === 'failed' ? "bg-rose-500/10 text-rose-500" :
                        "bg-amber-500/10 text-amber-500"
                      )}>
                        {log.status === 'executed' ? <CheckCircle2 className="h-4 w-4" /> :
                         log.status === 'failed' ? <XCircle className="h-4 w-4" /> :
                         <Play className="h-4 w-4" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white capitalize">{log.action.replace('_', ' ')}</p>
                        <p className="text-xs text-zinc-500">ID: {log.context.entityId} • {new Date(log.timestamp.seconds * 1000).toLocaleTimeString()}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase border-white/10">
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {rules.map((rule) => (
              <Card key={rule.id} className="bg-zinc-900/50 border-white/5 hover:border-white/10 transition-all">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">{rule.name}</h3>
                        <Badge variant={rule.isEnabled ? "default" : "secondary"} className={cn(
                          "text-[10px] uppercase",
                          rule.isEnabled ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-zinc-800 text-zinc-500"
                        )}>
                          {rule.isEnabled ? "Ativa" : "Pausada"}
                        </Badge>
                      </div>
                      <p className="text-sm text-zinc-400">
                        Se <span className="text-emerald-400 font-mono">{rule.trigger.metric}</span> {rule.trigger.operator} {rule.trigger.value}, 
                        então <span className="text-blue-400 font-bold">{rule.action.type.replace('_', ' ')}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => onToggleRule(rule.id, !rule.isEnabled)}
                        className={cn(
                          "h-9 px-3",
                          rule.isEnabled ? "text-rose-400 hover:text-rose-300 hover:bg-rose-400/10" : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-400/10"
                        )}
                      >
                        {rule.isEnabled ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                        {rule.isEnabled ? "Pausar" : "Ativar"}
                      </Button>
                      <Button variant="outline" size="sm" className="h-9 px-3 border-white/10 hover:bg-white/5">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6 text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3 text-blue-500" />
                      Aprovação: {rule.guardrails.requireApproval ? "Sim" : "Não"}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <History className="h-3 w-3 text-zinc-500" />
                      Cooldown: {rule.guardrails.cooldownPeriod}h
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Activity className="h-3 w-3 text-zinc-500" />
                      Última Execução: 2h atrás
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audit">
          <Card className="bg-zinc-900/50 border-white/5">
            <CardHeader>
              <CardTitle>Histórico de Execução</CardTitle>
              <CardDescription>Rastreabilidade total de todas as decisões tomadas pelo motor de automação.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <table className="w-full text-sm">
                  <thead className="text-zinc-500 border-b border-white/5">
                    <tr>
                      <th className="text-left py-3 font-bold uppercase text-[10px]">Data/Hora</th>
                      <th className="text-left py-3 font-bold uppercase text-[10px]">Regra</th>
                      <th className="text-left py-3 font-bold uppercase text-[10px]">Ação</th>
                      <th className="text-left py-3 font-bold uppercase text-[10px]">Entidade</th>
                      <th className="text-right py-3 font-bold uppercase text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-white/5 transition-colors group">
                        <td className="py-4 text-zinc-400 text-xs">
                          {new Date(log.timestamp.seconds * 1000).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-4 font-medium text-white">
                          {rules.find(r => r.id === log.ruleId)?.name || 'Regra Deletada'}
                        </td>
                        <td className="py-4">
                          <Badge variant="outline" className="bg-blue-500/5 text-blue-400 border-blue-500/20 text-[10px]">
                            {log.action}
                          </Badge>
                        </td>
                        <td className="py-4 text-zinc-400 font-mono text-xs">
                          {log.context.entityId}
                        </td>
                        <td className="py-4 text-right">
                          <Badge className={cn(
                            "text-[10px] uppercase",
                            log.status === 'executed' ? "bg-emerald-500/10 text-emerald-500" :
                            log.status === 'failed' ? "bg-rose-500/10 text-rose-500" :
                            log.status === 'rejected' ? "bg-zinc-800 text-zinc-500" :
                            "bg-amber-500/10 text-amber-500"
                          )}>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" className="space-y-4">
          {pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-white/10">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Nenhuma ação aguardando aprovação</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingActions.map((action) => (
                <Card key={action.id} className="bg-zinc-900/50 border-amber-500/20 shadow-lg shadow-amber-500/5">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                          <AlertTriangle className="h-6 w-6 text-amber-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-black text-white">Ação de Escala Proposta</h3>
                            <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">P0 GUARDRAIL</Badge>
                          </div>
                          <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                            O motor identificou uma oportunidade de escala para a entidade <span className="text-white font-mono">{action.context.entityId}</span>. 
                            O Profit Score atual é superior a 80. Proposta de aumento de budget em 15%.
                          </p>
                          <div className="mt-3 flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase">
                            <span>Regra: Scale High Performers</span>
                            <span>Contexto: {action.context.funnelId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Button 
                          variant="outline" 
                          onClick={() => onRejectAction(action.id)}
                          className="border-rose-500/20 text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 font-bold"
                        >
                          <XCircle className="mr-2 h-4 w-4" /> Rejeitar
                        </Button>
                        <Button 
                          onClick={() => onApproveAction(action.id)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar Ação
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
