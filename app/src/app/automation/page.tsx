'use client';

import { useState, useEffect } from 'react';
import { 
  Zap, 
  History, 
  BrainCircuit,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { ControlCenterHeader, AutomationLogCard } from '@/components/automation/ControlCenter';
import { CopyRefactorWizard } from '@/components/automation/CopyRefactorWizard';
import { AutomationControlCenter } from '@/components/performance/automation-control-center';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import type { AutomationLog, AutomationRule, DeadLetterItem } from '@/types/automation';
import { getAutomationRules, getAutomationLogs, updateAutomationLogStatus, toggleAutomationRule, getDLQItems, saveAutomationRule } from '@/lib/firebase/automation';
import { getPersonalizationRules } from '@/lib/firebase/personalization';
import { useBrandStore } from '@/lib/stores/brand-store';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

export default function AutomationPage() {
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id;

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [variations, setVariations] = useState<{ id: string; headline: string; hook: string; justification: string; impactScore: number }[]>([]);
  const [dlqItems, setDlqItems] = useState<DeadLetterItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('v2');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    triggerType: 'metric_threshold' as AutomationRule['trigger']['type'],
    metric: '',
    operator: '>' as AutomationRule['trigger']['operator'],
    value: 0,
    stepType: '' as string,
    actionType: 'notify' as AutomationRule['action']['type'],
    platform: 'meta' as 'meta' | 'google',
    targetLevel: 'campaign' as 'campaign' | 'adset',
    adjustmentValue: 0,
    cooldownPeriod: 24,
  });

  useEffect(() => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    Promise.allSettled([
      getAutomationRules(brandId),
      getAutomationLogs(brandId, 50),
      getPersonalizationRules(brandId),
      getDLQItems(brandId),
    ])
      .then(([rulesResult, logsResult, personalizationResult, dlqResult]) => {
        if (rulesResult.status === 'fulfilled') setRules(rulesResult.value);
        else console.error('[Automation] Failed to load rules:', rulesResult.reason);

        if (logsResult.status === 'fulfilled') setLogs(logsResult.value);
        else console.error('[Automation] Failed to load logs:', logsResult.reason);

        if (personalizationResult.status === 'fulfilled') {
          setVariations(
            personalizationResult.value
              .filter(r => r.isActive)
              .flatMap(r => r.contentVariations || []) as typeof variations
          );
        } else {
          console.error('[Automation] Failed to load personalization:', personalizationResult.reason);
        }

        if (dlqResult.status === 'fulfilled') setDlqItems(dlqResult.value);
        else console.error('[Automation] Failed to load DLQ:', dlqResult.reason);
      })
      .finally(() => setIsLoading(false));
  }, [brandId]);

  // S31-AUTO-03 DT-02: Null check obrigatório para selectedBrand
  if (!selectedBrand) {
    return (
      <div className="flex items-center justify-center h-96 text-zinc-500">
        Selecione uma marca para continuar.
      </div>
    );
  }

  const pendingLogs = logs.filter(l => l.status === 'pending_approval');

  const handleApprove = async (id: string) => {
    await updateAutomationLogStatus(brandId!, id, 'executed', selectedBrand?.name || 'user');
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'executed' as const } : l));
    toast.success('Ação aprovada e enviada para execução');
  };

  const handleReject = async (id: string) => {
    await updateAutomationLogStatus(brandId!, id, 'rejected', selectedBrand?.name || 'user');
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' as const } : l));
    toast.error('Ação rejeitada pelo usuário');
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    await toggleAutomationRule(brandId!, id, enabled);
    setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: enabled } : r));
    toast.info(enabled ? 'Regra ativada' : 'Regra pausada');
  };

  const handleCreateRule = async () => {
    if (!newRule.name.trim()) {
      toast.error('Nome da regra é obrigatório');
      return;
    }
    if (!newRule.metric.trim()) {
      toast.error('Métrica é obrigatória');
      return;
    }
    setSaving(true);
    try {
      const rule: Omit<AutomationRule, 'id'> = {
        name: newRule.name,
        isEnabled: true,
        trigger: {
          type: newRule.triggerType,
          metric: newRule.metric,
          operator: newRule.operator,
          value: newRule.value,
          ...(newRule.stepType ? { stepType: newRule.stepType as AutomationRule['trigger']['stepType'] } : {}),
        },
        action: {
          type: newRule.actionType,
          params: {
            platform: newRule.platform,
            targetLevel: newRule.targetLevel,
            ...(newRule.actionType === 'adjust_budget' ? { adjustmentValue: newRule.adjustmentValue } : {}),
          },
        },
        guardrails: {
          requireApproval: true,
          cooldownPeriod: newRule.cooldownPeriod,
        },
      };
      const id = await saveAutomationRule(brandId!, rule);
      setRules(prev => [...prev, { id, ...rule }]);
      setShowCreateModal(false);
      setNewRule({
        name: '', triggerType: 'metric_threshold', metric: '', operator: '>',
        value: 0, stepType: '', actionType: 'notify', platform: 'meta',
        targetLevel: 'campaign', adjustmentValue: 0, cooldownPeriod: 24,
      });
      toast.success('Regra criada com sucesso!');
    } catch (err) {
      console.error('[Automation] Failed to create rule:', err);
      toast.error('Erro ao criar regra');
    } finally {
      setSaving(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!brandId) return;
    setIsEvaluating(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/automation/evaluate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId }),
      });
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        toast.success(`Avaliação concluída: ${d.logsCreated} ações criadas, ${d.rulesEvaluated} regras avaliadas`);
        if (d.logsCreated > 0) {
          const freshLogs = await getAutomationLogs(brandId, 50);
          setLogs(freshLogs);
        }
      } else {
        toast.error(data.error || 'Erro na avaliação');
      }
    } catch {
      toast.error('Falha ao rodar avaliação');
    } finally {
      setIsEvaluating(false);
    }
  };

  // S31-DLQ-03: Retry handler
  const handleRetry = async (dlqItemId: string) => {
    setRetryingId(dlqItemId);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/webhooks/retry', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId: brandId!, dlqItemId }),
      });
      const data = await res.json();
      if (data.success) {
        setDlqItems(prev => prev.filter(d => d.id !== dlqItemId));
        toast.success('Webhook re-processado com sucesso');
      } else {
        toast.error(data.error || 'Falha no retry');
        // Atualizar retryCount localmente
        setDlqItems(prev => prev.map(d =>
          d.id === dlqItemId ? { ...d, retryCount: d.retryCount + 1 } : d
        ));
      }
    } catch {
      toast.error('Erro ao tentar retry');
    } finally {
      setRetryingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 p-8">
        <div className="h-8 bg-zinc-800 rounded w-1/3" />
        <div className="h-64 bg-zinc-800 rounded" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/[0.03] pb-1">
          <TabsList className="bg-transparent border-none gap-8 h-12 p-0">
            <TabsTrigger 
              value="v2" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none h-full px-2 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <Zap className="mr-2 h-4 w-4" />
              Automation V2
            </TabsTrigger>
            <TabsTrigger 
              value="legacy" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-zinc-400 data-[state=active]:border-b-2 data-[state=active]:border-zinc-400 rounded-none h-full px-2 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <History className="mr-2 h-4 w-4" />
              Legacy View
            </TabsTrigger>
            <TabsTrigger 
              value="refactor" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-emerald-400 data-[state=active]:border-b-2 data-[state=active]:border-emerald-400 rounded-none h-full px-2 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <BrainCircuit className="mr-2 h-4 w-4" />
              Refatoração
            </TabsTrigger>
            <TabsTrigger 
              value="deadletter" 
              className="data-[state=active]:bg-transparent data-[state=active]:text-rose-400 data-[state=active]:border-b-2 data-[state=active]:border-rose-400 rounded-none h-full px-2 font-bold text-xs uppercase tracking-widest transition-all"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Dead Letter
              {dlqItems.length > 0 && (
                <span className="ml-2 bg-rose-500 text-white text-[10px] rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                  {dlqItems.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="v2" className="mt-0 outline-none">
          <AutomationControlCenter 
            rules={rules}
            logs={logs}
            onToggleRule={handleToggleRule}
            onApproveAction={handleApprove}
            onRejectAction={handleReject}
            onCreateRule={() => setShowCreateModal(true)}
            onRunEvaluation={handleRunEvaluation}
            isEvaluating={isEvaluating}
          />
        </TabsContent>

        <TabsContent value="legacy" className="mt-0 outline-none">
          <ControlCenterHeader pendingCount={pendingLogs.length} />
          <div className="grid gap-4 mt-6">
            {logs.map(log => (
              <AutomationLogCard 
                key={log.id} 
                log={log} 
                onApprove={handleApprove}
                onReject={handleReject}
                onViewDetails={(l) => console.log('Details:', l)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="refactor" className="mt-0 outline-none h-[700px]">
          <CopyRefactorWizard 
            frictionPoint="Usuários abandonam o vídeo nos primeiros 15 segundos devido a uma promessa genérica."
            originalCopy="Como ganhar dinheiro online usando apenas o seu celular e 2 horas por dia."
            variations={variations}
            onApply={(v) => {
              toast.success(`Refatoração "${v.headline}" aplicada com sucesso!`);
              setActiveTab('v2');
            }}
            onRegenerate={() => new Promise(resolve => setTimeout(resolve, 2000))}
          />
        </TabsContent>

        {/* S31-DLQ-03: Dead Letter Queue Tab */}
        <TabsContent value="deadletter" className="mt-0 outline-none">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-zinc-100">Dead Letter Queue</h2>
              <span className="text-xs text-zinc-500">
                {dlqItems.length} webhook{dlqItems.length !== 1 ? 's' : ''} falhado{dlqItems.length !== 1 ? 's' : ''}
              </span>
            </div>

            {dlqItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-500">
                <AlertTriangle className="h-8 w-8 mb-3 opacity-30" />
                <p className="text-sm">Nenhum webhook falhado na fila.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dlqItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-zinc-900/50 border border-white/[0.03] rounded-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                          {item.webhookType}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                          item.status === 'abandoned' 
                            ? 'bg-rose-500/10 text-rose-400' 
                            : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {item.status}
                        </span>
                        <span className="text-[10px] text-zinc-600">
                          Retry: {item.retryCount}/3
                        </span>
                      </div>
                      <p className="text-sm text-rose-400 truncate">{item.error}</p>
                      <p className="text-[10px] text-zinc-600 mt-1">
                        {item.timestamp?.seconds 
                          ? new Date(item.timestamp.seconds * 1000).toLocaleString('pt-BR')
                          : 'N/A'
                        }
                        {' • '}ID: {item.id.slice(0, 12)}...
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={item.retryCount >= 3 || item.status === 'abandoned' || retryingId === item.id}
                      onClick={() => handleRetry(item.id)}
                      className="shrink-0 border-white/[0.05] hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${retryingId === item.id ? 'animate-spin' : ''}`} />
                      Retry
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Criação de Regra */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-zinc-950 border-white/10 sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-black">Nova Regra de Automação</DialogTitle>
            <DialogDescription>Configure o gatilho, a ação e os guardrails.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Nome da Regra</Label>
              <Input
                placeholder="Ex: Pausar ads se CVR < 1%"
                value={newRule.name}
                onChange={e => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                className="bg-zinc-900 border-white/10"
              />
            </div>

            {/* Trigger */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Gatilho</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-zinc-500">Tipo</Label>
                  <Select value={newRule.triggerType} onValueChange={v => setNewRule(prev => ({ ...prev, triggerType: v as AutomationRule['trigger']['type'] }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric_threshold">Threshold de Métrica</SelectItem>
                      <SelectItem value="autopsy_gap">Gap de Autópsia</SelectItem>
                      <SelectItem value="profit_score">Profit Score</SelectItem>
                      <SelectItem value="fatigue_index">Índice de Fadiga</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Métrica</Label>
                  <Input
                    placeholder="Ex: checkout_cvr"
                    value={newRule.metric}
                    onChange={e => setNewRule(prev => ({ ...prev, metric: e.target.value }))}
                    className="bg-zinc-900 border-white/10"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] text-zinc-500">Operador</Label>
                  <Select value={newRule.operator} onValueChange={v => setNewRule(prev => ({ ...prev, operator: v as AutomationRule['trigger']['operator'] }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="<">{'<'} Menor que</SelectItem>
                      <SelectItem value=">">{'>'} Maior que</SelectItem>
                      <SelectItem value="<=">{'<='} Menor ou igual</SelectItem>
                      <SelectItem value=">=">{'>='} Maior ou igual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Valor</Label>
                  <Input
                    type="number"
                    value={newRule.value}
                    onChange={e => setNewRule(prev => ({ ...prev, value: Number(e.target.value) }))}
                    className="bg-zinc-900 border-white/10"
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Etapa (opcional)</Label>
                  <Select value={newRule.stepType} onValueChange={v => setNewRule(prev => ({ ...prev, stepType: v }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10"><SelectValue placeholder="—" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ads">Ads</SelectItem>
                      <SelectItem value="optin">Opt-in</SelectItem>
                      <SelectItem value="vsl">VSL</SelectItem>
                      <SelectItem value="checkout">Checkout</SelectItem>
                      <SelectItem value="upsell">Upsell</SelectItem>
                      <SelectItem value="thankyou">Thank You</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="space-y-3">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Ação</Label>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[10px] text-zinc-500">Tipo</Label>
                  <Select value={newRule.actionType} onValueChange={v => setNewRule(prev => ({ ...prev, actionType: v as AutomationRule['action']['type'] }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notify">Notificar</SelectItem>
                      <SelectItem value="pause_ads">Pausar Ads</SelectItem>
                      <SelectItem value="adjust_budget">Ajustar Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Plataforma</Label>
                  <Select value={newRule.platform} onValueChange={v => setNewRule(prev => ({ ...prev, platform: v as 'meta' | 'google' }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meta">Meta</SelectItem>
                      <SelectItem value="google">Google</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Nível</Label>
                  <Select value={newRule.targetLevel} onValueChange={v => setNewRule(prev => ({ ...prev, targetLevel: v as 'campaign' | 'adset' }))}>
                    <SelectTrigger className="bg-zinc-900 border-white/10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">Campanha</SelectItem>
                      <SelectItem value="adset">Adset</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {newRule.actionType === 'adjust_budget' && (
                <div>
                  <Label className="text-[10px] text-zinc-500">Ajuste (%)</Label>
                  <Input
                    type="number"
                    placeholder="Ex: 15 para +15%"
                    value={newRule.adjustmentValue}
                    onChange={e => setNewRule(prev => ({ ...prev, adjustmentValue: Number(e.target.value) }))}
                    className="bg-zinc-900 border-white/10"
                  />
                </div>
              )}
            </div>

            {/* Guardrails */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-widest text-zinc-400">Guardrails</Label>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 p-3 bg-zinc-900/50 rounded-lg border border-white/5">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-400">Aprovação obrigatória</span>
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Cooldown (horas)</Label>
                  <Input
                    type="number"
                    value={newRule.cooldownPeriod}
                    onChange={e => setNewRule(prev => ({ ...prev, cooldownPeriod: Number(e.target.value) }))}
                    className="bg-zinc-900 border-white/10"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-white/10">
              Cancelar
            </Button>
            <Button
              onClick={handleCreateRule}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {saving ? 'Salvando...' : 'Criar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
