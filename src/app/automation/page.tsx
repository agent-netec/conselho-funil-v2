'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  Zap, 
  History, 
  Settings2, 
  Filter,
  Search,
  LayoutDashboard,
  BrainCircuit,
  Plus
} from 'lucide-react';
import { ControlCenterHeader, AutomationLogCard } from '@/components/automation/ControlCenter';
import { CopyRefactorWizard } from '@/components/automation/CopyRefactorWizard';
import { AutomationControlCenter } from '@/components/performance/automation-control-center';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import type { AutomationLog, AutomationRule } from '@/types/automation';

// Mocks para visualização (Victor/Beto)
const MOCK_RULES: AutomationRule[] = [
  {
    id: 'rule_1',
    name: 'Scale High Performers',
    isEnabled: true,
    trigger: {
      type: 'profit_score',
      operator: '>',
      value: 80,
    },
    action: {
      type: 'adjust_budget',
      params: {
        adjustmentValue: 15,
        targetLevel: 'adset'
      }
    },
    guardrails: {
      requireApproval: true,
      cooldownPeriod: 24
    }
  },
  {
    id: 'rule_2',
    name: 'Kill Underperformers',
    isEnabled: true,
    trigger: {
      type: 'metric_threshold',
      metric: 'roas',
      operator: '<',
      value: 1.2,
    },
    action: {
      type: 'pause_ads',
      params: {
        targetLevel: 'campaign'
      }
    },
    guardrails: {
      requireApproval: true,
      cooldownPeriod: 6
    }
  }
];

const MOCK_LOGS: AutomationLog[] = [
  {
    id: 'log_1',
    ruleId: 'rule_1',
    action: 'adjust_budget',
    status: 'pending_approval',
    context: {
      funnelId: 'high-ticket-vsl-1',
      entityId: 'meta_adset_7721',
      gapDetails: {
        reason: 'Profit Score > 80',
        severity: 'info',
      }
    },
    timestamp: { seconds: Date.now() / 1000 - 3600, nanoseconds: 0 } as any
  },
  {
    id: 'log_2',
    ruleId: 'rule_2',
    action: 'pause_ads',
    status: 'executed',
    context: {
      funnelId: 'lead-gen-quiz',
      entityId: 'meta_camp_99283',
      gapDetails: {
        reason: 'ROAS < 1.2',
        severity: 'critical',
      }
    },
    timestamp: { seconds: Date.now() / 1000 - 7200, nanoseconds: 0 } as any
  }
];

const MOCK_VARIATIONS = [
  // ... existing mock variations ...
];

export default function AutomationPage() {
  const [logs, setLogs] = useState<AutomationLog[]>(MOCK_LOGS);
  const [rules, setRules] = useState<AutomationRule[]>(MOCK_RULES);
  const [activeTab, setActiveTab] = useState('v2'); // Inicia na V2 nova

  const pendingLogs = logs.filter(l => l.status === 'pending_approval');

  const handleApprove = (id: string) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'executed' } : l));
    toast.success('Ação aprovada e enviada para execução');
  };

  const handleReject = (id: string) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, status: 'rejected' } : l));
    toast.error('Ação rejeitada pelo usuário');
  };

  const handleToggleRule = (id: string, enabled: boolean) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, isEnabled: enabled } : r));
    toast.info(enabled ? 'Regra ativada' : 'Regra pausada');
  };

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
          {/* Conteúdo antigo da página para referência ou fallback */}
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
            variations={MOCK_VARIATIONS}
            onApply={(v) => {
              toast.success(`Refatoração "${v.headline}" aplicada com sucesso!`);
              setActiveTab('v2');
            }}
            onRegenerate={() => new Promise(resolve => setTimeout(resolve, 2000))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

