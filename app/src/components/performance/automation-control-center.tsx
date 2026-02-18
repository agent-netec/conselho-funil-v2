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
  TrendingDown,
  Activity,
  UserCheck,
  MessageSquare,
  DollarSign,
  Target,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AutomationRule, AutomationLog, CouncilDebateResult } from "@/types/automation";
import { cn } from "@/lib/utils";

interface AutomationControlCenterProps {
  rules: AutomationRule[];
  logs: AutomationLog[];
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  onApproveAction: (logId: string) => void;
  onRejectAction: (logId: string) => void;
  onCreateRule: () => void;
  onRunEvaluation?: () => Promise<void>;
  isEvaluating?: boolean;
}

export function AutomationControlCenter({
  rules,
  logs,
  onToggleRule,
  onApproveAction,
  onRejectAction,
  onCreateRule,
  onRunEvaluation,
  isEvaluating,
}: AutomationControlCenterProps) {
  const pendingActions = logs.filter(l => l.status === 'pending_approval');

  // Compute real stats from logs (J-4.1, J-4.2, J-4.3)
  const isLast24h = (ts: { seconds: number }) =>
    Date.now() - ts.seconds * 1000 < 24 * 60 * 60 * 1000;

  const executedLast24h = logs.filter(
    l => l.status === 'executed' && isLast24h(l.timestamp)
  );

  const budgetLogs = executedLast24h.filter(l => l.action === 'adjust_budget');
  const totalAdjustment = budgetLogs.reduce((sum, log) => {
    const rule = rules.find(r => r.id === log.ruleId);
    return sum + (rule?.action.params.adjustmentValue || 0);
  }, 0);

  // W-4.3: ROI computation from impact analyses
  const logsWithImpact = logs.filter(l => l.impactAnalysis);
  const totalRevenueDelta = logsWithImpact.reduce((sum, l) =>
    sum + (l.impactAnalysis?.delta?.revenue || 0), 0);
  const totalSpendDelta = logsWithImpact.reduce((sum, l) =>
    sum + (l.impactAnalysis?.delta?.spend || 0), 0);

  const getLastExecution = (ruleId: string) => {
    const lastLog = logs.find(l => l.ruleId === ruleId && l.status === 'executed');
    if (!lastLog) return 'Nunca';
    const diffMs = Date.now() - lastLog.timestamp.seconds * 1000;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}min atrás`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d atrás`;
  };

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
          {onRunEvaluation && (
            <Button
              variant="outline"
              onClick={onRunEvaluation}
              disabled={isEvaluating}
              className="border-white/10 hover:bg-blue-500/10 hover:text-blue-400 hover:border-blue-500/20 font-bold"
            >
              <Play className={cn("mr-2 h-4 w-4", isEvaluating && "animate-spin")} />
              {isEvaluating ? 'Avaliando...' : 'Rodar Avaliação'}
            </Button>
          )}
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
          <TabsTrigger value="roi" className="data-[state=active]:bg-zinc-800">
            <DollarSign className="mr-2 h-4 w-4" /> ROI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Ações Executadas (24h)</p>
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                </div>
                <div className="text-3xl font-black text-white">{executedLast24h.length}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Últimas 24 horas</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Budget Otimizado</p>
                  <ArrowUpRight className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-white">
                  {budgetLogs.length > 0 ? `${totalAdjustment > 0 ? '+' : ''}${totalAdjustment}%` : '—'}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  {budgetLogs.length > 0
                    ? `${budgetLogs.length} ajuste${budgetLogs.length !== 1 ? 's' : ''} nas últimas 24h`
                    : 'Nenhum ajuste nas últimas 24h'}
                </p>
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
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Impacto Medido</p>
                  <Target className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-3xl font-black text-white">{logsWithImpact.length}</div>
                <p className="text-[10px] text-zinc-500 mt-1">Ações com resultado medido</p>
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
                    <div className="flex items-center gap-2">
                      {log.context.councilDebate && (
                        <Badge variant="outline" className="text-[10px] uppercase border-purple-500/20 text-purple-400">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Conselho
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-[10px] uppercase border-white/10">
                        {log.status}
                      </Badge>
                    </div>
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
                        {rule.conditions && rule.conditions.length > 1 && (
                          <Badge variant="outline" className="text-[10px] uppercase border-blue-500/20 text-blue-400">
                            {rule.logicOperator || 'AND'} • {rule.conditions.length} condições
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400">
                        {rule.conditions && rule.conditions.length > 0 ? (
                          rule.conditions.map((c, i) => (
                            <span key={i}>
                              {i > 0 && <span className="text-zinc-600"> {rule.logicOperator || 'AND'} </span>}
                              <span className="text-emerald-400 font-mono">{c.metric || c.type}</span> {c.operator} {c.value}
                            </span>
                          ))
                        ) : (
                          <>
                            Se <span className="text-emerald-400 font-mono">{rule.trigger.metric}</span> {rule.trigger.operator} {rule.trigger.value}
                          </>
                        )}
                        , então <span className="text-blue-400 font-bold">{rule.action.type.replace('_', ' ')}</span>
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
                      Última Execução: {getLastExecution(rule.id)}
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
                      <th className="text-left py-3 font-bold uppercase text-[10px]">Conselho</th>
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
                        <td className="py-4">
                          {log.context.councilDebate ? (
                            <CouncilBadge debate={log.context.councilDebate} />
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
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

        {/* W-2.2: Approvals with council verdict */}
        <TabsContent value="approvals" className="space-y-4">
          {pendingActions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500 bg-zinc-900/30 rounded-xl border border-dashed border-white/10">
              <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-bold uppercase tracking-widest text-xs">Nenhuma ação aguardando aprovação</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingActions.map((action) => {
                const debate = action.context.councilDebate;
                const approveCount = debate?.votes.filter(v => v.recommendation === 'approve').length || 0;
                const totalVotes = debate?.votes.length || 0;

                return (
                  <Card key={action.id} className="bg-zinc-900/50 border-amber-500/20 shadow-lg shadow-amber-500/5">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                          <div className="flex items-start gap-4">
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                              <AlertTriangle className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-black text-white">Ação Proposta</h3>
                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px]">P0 GUARDRAIL</Badge>
                                {debate && (
                                  <Badge className={cn(
                                    "text-[10px]",
                                    approveCount > totalVotes / 2
                                      ? "bg-emerald-500/20 text-emerald-500 border-emerald-500/30"
                                      : "bg-rose-500/20 text-rose-500 border-rose-500/30"
                                  )}>
                                    {approveCount}/{totalVotes} aprovam
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-zinc-400 leading-relaxed max-w-2xl">
                                Ação <span className="text-blue-400 font-bold">{action.action.replace('_', ' ')}</span> para entidade{' '}
                                <span className="text-white font-mono">{action.context.entityId}</span>.
                              </p>
                              <div className="mt-3 flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase">
                                <span>Regra: {rules.find(r => r.id === action.ruleId)?.name || action.ruleId}</span>
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

                        {/* W-2.2: Council Debate Verdict */}
                        {debate && (
                          <CouncilVerdictPanel debate={debate} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* W-4.3: ROI Dashboard */}
        <TabsContent value="roi" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Revenue Delta</p>
                  {totalRevenueDelta >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-rose-500" />
                  )}
                </div>
                <div className={cn("text-3xl font-black", totalRevenueDelta >= 0 ? "text-emerald-400" : "text-rose-400")}>
                  {totalRevenueDelta >= 0 ? '+' : ''}R$ {totalRevenueDelta.toFixed(2)}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Impacto acumulado das automações</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Spend Delta</p>
                  <DollarSign className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-3xl font-black text-white">
                  {totalSpendDelta !== 0 ? `${totalSpendDelta > 0 ? '+' : ''}R$ ${totalSpendDelta.toFixed(2)}` : '—'}
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">Variação de investimento</p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-900/50 border-white/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold text-zinc-500 uppercase">Ações com Impacto</p>
                  <Sparkles className="h-4 w-4 text-purple-500" />
                </div>
                <div className="text-3xl font-black text-white">{logsWithImpact.length}</div>
                <p className="text-[10px] text-zinc-500 mt-1">de {logs.filter(l => l.status === 'executed').length} executadas</p>
              </CardContent>
            </Card>
          </div>

          {/* Impact Timeline */}
          <Card className="bg-zinc-900/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-zinc-500">Timeline de Impacto</CardTitle>
              <CardDescription>Resultados medidos 24-72h após execução das automações.</CardDescription>
            </CardHeader>
            <CardContent>
              {logsWithImpact.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                  <Target className="h-8 w-8 mb-3 opacity-20" />
                  <p className="text-sm">Nenhum impacto medido ainda. Resultados aparecem 24h após execução.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logsWithImpact.map(log => (
                    <div key={log.id} className="p-4 rounded-lg bg-white/5 border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px] uppercase border-blue-500/20 text-blue-400">
                            {log.action}
                          </Badge>
                          <span className="text-xs text-zinc-500">{log.context.entityId}</span>
                        </div>
                        <span className="text-xs text-zinc-600">
                          {log.impactAnalysis?.measuredAt?.seconds
                            ? new Date(log.impactAnalysis.measuredAt.seconds * 1000).toLocaleString('pt-BR')
                            : ''}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300">{log.impactAnalysis?.summary}</p>
                      <div className="mt-2 flex gap-4 text-[10px] text-zinc-500">
                        {Object.entries(log.impactAnalysis?.delta || {})
                          .filter(([, v]) => Math.abs(v as number) > 0.01)
                          .slice(0, 4)
                          .map(([key, val]) => (
                            <span key={key} className={cn(
                              "font-mono",
                              (val as number) > 0 ? "text-emerald-400" : "text-rose-400"
                            )}>
                              {key}: {(val as number) > 0 ? '+' : ''}{(val as number).toFixed(2)}
                            </span>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ---- W-2.2: Council Verdict Sub-components ----

function CouncilBadge({ debate }: { debate: CouncilDebateResult }) {
  const approves = debate.votes.filter(v => v.recommendation === 'approve').length;
  const total = debate.votes.length;
  return (
    <Badge variant="outline" className={cn(
      "text-[10px]",
      approves > total / 2 ? "border-emerald-500/20 text-emerald-400" : "border-rose-500/20 text-rose-400"
    )}>
      {approves}/{total}
    </Badge>
  );
}

function CouncilVerdictPanel({ debate }: { debate: CouncilDebateResult }) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="bg-zinc-900/80 rounded-lg border border-purple-500/10 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-purple-400" />
          <h4 className="text-sm font-bold text-purple-400 uppercase tracking-widest">Parecer do Conselho de Ads</h4>
        </div>
        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
          Confiança: {debate.confidence}%
        </Badge>
      </div>

      {/* Votes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
        {debate.votes.map(vote => (
          <div key={vote.agentId} className={cn(
            "p-2.5 rounded-lg border text-xs",
            vote.recommendation === 'approve'
              ? "bg-emerald-500/5 border-emerald-500/20"
              : "bg-rose-500/5 border-rose-500/20"
          )}>
            <div className="flex items-center gap-1.5 mb-1">
              <div className={cn(
                "h-2 w-2 rounded-full",
                vote.recommendation === 'approve' ? "bg-emerald-500" : "bg-rose-500"
              )} />
              <span className="font-bold text-white text-[11px]">{vote.name.split(' ')[0]}</span>
            </div>
            <p className="text-zinc-500 text-[10px] leading-tight line-clamp-2">{vote.reason}</p>
          </div>
        ))}
      </div>

      {/* Verdict */}
      <div className="text-xs text-zinc-400 leading-relaxed">
        <p className="line-clamp-3">{debate.verdict}</p>
      </div>

      {expanded && (
        <div className="mt-3 p-3 bg-zinc-950 rounded-lg text-xs text-zinc-500 max-h-60 overflow-y-auto">
          <pre className="whitespace-pre-wrap font-sans">{debate.fullText.slice(0, 2000)}</pre>
        </div>
      )}

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-2 text-[10px] text-purple-400 hover:text-purple-300 font-bold uppercase tracking-widest"
      >
        {expanded ? 'Recolher' : 'Ver debate completo'}
      </button>
    </div>
  );
}
