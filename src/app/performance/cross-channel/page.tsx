'use client';

import React, { useState } from 'react';
import { UnifiedCrossChannelDashboard } from '@/components/performance/cross-channel/UnifiedDashboard';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Filter, 
  Download, 
  RefreshCcw,
  LayoutDashboard,
  Zap
} from "lucide-react";
import { Timestamp } from 'firebase/firestore';

// MOCK DATA - Em produção viria de um hook useCrossChannelMetrics
const MOCK_METRICS = {
  id: 'ccm_mock_2026_01',
  brandId: 'brand_123',
  period: {
    start: Timestamp.now(),
    end: Timestamp.now(),
    type: 'monthly' as const
  },
  totals: {
    spend: 125400,
    clicks: 45200,
    impressions: 1250000,
    conversions: 842,
    ctr: 0.036,
    cpc: 2.77,
    cpa: 148.93,
    roas: 3.85,
    blendedRoas: 4.12,
    blendedCpa: 132.40
  },
  channels: {
    meta: {
      metrics: {
        spend: 65000,
        clicks: 28000,
        impressions: 850000,
        conversions: 412,
        ctr: 0.032,
        cpc: 2.32,
        cpa: 157.76,
        roas: 3.2
      },
      shareOfSpend: 0.52,
      shareOfConversions: 0.49
    },
    google: {
      metrics: {
        spend: 45000,
        clicks: 12000,
        impressions: 320000,
        conversions: 310,
        ctr: 0.037,
        cpc: 3.75,
        cpa: 145.16,
        roas: 4.8
      },
      shareOfSpend: 0.36,
      shareOfConversions: 0.37
    },
    tiktok: {
      metrics: {
        spend: 15400,
        clicks: 5200,
        impressions: 80000,
        conversions: 120,
        ctr: 0.065,
        cpc: 2.96,
        cpa: 128.33,
        roas: 5.2
      },
      shareOfSpend: 0.12,
      shareOfConversions: 0.14
    }
  },
  updatedAt: Timestamp.now()
};

const MOCK_INSIGHTS = [
  {
    id: 'ins_1',
    type: 'channel_scale' as const,
    platform: 'tiktok',
    reasoning: 'O TikTok Ads apresenta o maior ROAS marginal (5.2x) com um CPA 15% abaixo da média blended. Há espaço para escala de orçamento sem fadiga de audiência detectada.',
    impact: {
      suggestedChange: 0.25,
      expectedProfitIncrease: 12500
    },
    confidence: 0.92,
    createdAt: Timestamp.now()
  },
  {
    id: 'ins_2',
    type: 'budget_reallocation' as const,
    platform: 'meta',
    reasoning: 'O custo por aquisição no Meta subiu 12% nos últimos 7 dias. Recomendamos realocar 15% do budget de prospecção do Meta para o Google Search (Fundo de Funil) para manter o Blended ROAS.',
    impact: {
      suggestedChange: -0.15,
      expectedProfitIncrease: 8400
    },
    confidence: 0.88,
    createdAt: Timestamp.now()
  }
];

export default function CrossChannelWarRoomPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 px-2">
              Cross-Channel
            </Badge>
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Intelligence Wing</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-purple-500" />
            Unified War Room
          </h1>
          <p className="text-zinc-400 text-sm">Visão holística de performance: Meta, Google e TikTok unificados.</p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="border-white/5 bg-zinc-900/50 text-zinc-400 gap-2">
            <Calendar size={18} />
            Jan 2026
          </Button>
          <Button variant="outline" className="border-white/5 bg-zinc-900/50 text-zinc-400 gap-2">
            <Download size={18} />
            Exportar
          </Button>
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Main Dashboard Component */}
      <UnifiedCrossChannelDashboard 
        metrics={MOCK_METRICS as any} 
        insights={MOCK_INSIGHTS as any} 
      />

      {/* Footer Status */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">Data Sync: OK</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">Attribution Bridge: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            <span className="text-xs text-zinc-500">AI Optimizer: Processing</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 font-mono">
          LAST_REFRESH: {new Date().toISOString()} | ENGINE_V: 2.8.1
        </p>
      </div>
    </div>
  );
}
