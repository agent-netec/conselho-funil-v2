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
import { toast } from 'sonner';
import type { AutomationLog, AutomationRule, DeadLetterItem } from '@/types/automation';
import { getAutomationRules, getAutomationLogs, updateAutomationLogStatus, toggleAutomationRule, getDLQItems } from '@/lib/firebase/automation';
import { getPersonalizationRules } from '@/lib/firebase/personalization';
import { useBrandStore } from '@/lib/stores/brand-store';

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

  useEffect(() => {
    if (!brandId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    Promise.all([
      getAutomationRules(brandId),
      getAutomationLogs(brandId, 50),
      getPersonalizationRules(brandId),
      getDLQItems(brandId),
    ])
      .then(([firestoreRules, firestoreLogs, personalizationRules, firestoreDLQ]) => {
        setRules(firestoreRules);
        setLogs(firestoreLogs);
        setVariations(
          personalizationRules
            .filter(r => r.isActive)
            .flatMap(r => r.contentVariations || []) as typeof variations
        );
        setDlqItems(firestoreDLQ);
      })
      .catch(err => console.error('[Automation Page] Failed to load data:', err))
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

  // S31-DLQ-03: Retry handler
  const handleRetry = async (dlqItemId: string) => {
    setRetryingId(dlqItemId);
    try {
      const res = await fetch('/api/webhooks/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
            onCreateRule={() => toast.info('Abrindo modal de criação de regra...')}
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
    </div>
  );
}
