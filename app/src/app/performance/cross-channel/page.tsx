'use client';

import React from 'react';
import { UnifiedCrossChannelDashboard } from '@/components/performance/cross-channel/UnifiedDashboard';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Download,
  RefreshCcw,
  LayoutDashboard,
  AlertCircle
} from "lucide-react";
import { useCrossChannelMetrics } from '@/lib/hooks/use-cross-channel-metrics';
import { Skeleton } from '@/components/ui/skeleton';

export default function CrossChannelWarRoomPage() {
  const { metrics, insights, loading, error, refresh } = useCrossChannelMetrics(30);

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
            Últimos 30 dias
          </Button>
          <Button variant="outline" className="border-white/5 bg-zinc-900/50 text-zinc-400 gap-2">
            <Download size={18} />
            Exportar
          </Button>
          <Button
            onClick={refresh}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-500 text-white gap-2"
          >
            <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl bg-zinc-800/50" />
            ))}
          </div>
          <Skeleton className="h-64 w-full rounded-xl bg-zinc-800/50" />
          <Skeleton className="h-48 w-full rounded-xl bg-zinc-800/50" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <Card className="p-8 bg-red-950/20 border-red-500/20 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-red-300 mb-2">Erro ao carregar dados</h3>
          <p className="text-sm text-red-400/70 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" className="border-red-500/20 text-red-300">
            Tentar novamente
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!loading && !error && metrics && Object.keys(metrics.channels).length === 0 && (
        <Card className="p-12 bg-zinc-900/50 border-white/5 text-center">
          <LayoutDashboard className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-zinc-400 mb-2">Sem dados de performance</h3>
          <p className="text-sm text-zinc-500 max-w-md mx-auto">
            Conecte suas contas de Meta Ads, Google Ads ou TikTok Ads para visualizar métricas cross-channel consolidadas.
          </p>
        </Card>
      )}

      {/* Main Dashboard Component */}
      {!loading && !error && metrics && Object.keys(metrics.channels).length > 0 && (
        <UnifiedCrossChannelDashboard
          metrics={metrics}
          insights={insights}
        />
      )}

      {/* Footer Status */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/50 border border-white/5">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500'}`} />
            <span className="text-xs text-zinc-500">Data Sync: {error ? 'Error' : 'OK'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-zinc-500">Attribution Bridge: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-purple-500 animate-pulse' : 'bg-emerald-500'}`} />
            <span className="text-xs text-zinc-500">AI Optimizer: {loading ? 'Processing' : 'Ready'}</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 font-mono">
          LAST_REFRESH: {new Date().toISOString()} | ENGINE_V: 2.8.1
        </p>
      </div>
    </div>
  );
}
