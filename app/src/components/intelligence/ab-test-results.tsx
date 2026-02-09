'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AutoOptimizer } from '@/lib/intelligence/ab-testing/auto-optimizer';
import type { ABTest, ABTestVariant, OptimizationDecision } from '@/types/ab-testing';

interface ABTestResultsProps {
  test: ABTest;
  onAction?: (action: 'start' | 'pause' | 'complete') => void;
  onToggleAutoOptimize?: (nextValue: boolean) => void;
  onRunOptimization?: () => void;
  isUpdating?: boolean;
  logRefreshKey?: number;
}

function getConversionRate(variant: ABTestVariant): number {
  if (variant.impressions === 0) return 0;
  return (variant.conversions / variant.impressions) * 100;
}

function getCtr(variant: ABTestVariant): number {
  if (variant.impressions === 0) return 0;
  return (variant.clicks / variant.impressions) * 100;
}

function getSignificanceBadge(significanceLevel: number | null): { label: string; className: string } {
  const significance = (significanceLevel ?? 0) * 100;
  if (significance >= 95) {
    return { label: `${significance.toFixed(1)}%`, className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  }
  if (significance >= 80) {
    return { label: `${significance.toFixed(1)}%`, className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
  }
  return { label: `${significance.toFixed(1)}%`, className: 'bg-zinc-700 text-zinc-300 border-zinc-600' };
}

export function ABTestResults({
  test,
  onAction,
  onToggleAutoOptimize,
  onRunOptimization,
  isUpdating,
  logRefreshKey,
}: ABTestResultsProps) {
  const [optimizationLog, setOptimizationLog] = useState<OptimizationDecision[]>([]);
  const [logLoading, setLogLoading] = useState(false);

  useEffect(() => {
    const loadLog = async () => {
      setLogLoading(true);
      try {
        const data = await AutoOptimizer.getOptimizationLog(test.brandId, test.id);
        setOptimizationLog(data);
      } catch (error) {
        console.error('Erro ao carregar optimization log:', error);
        setOptimizationLog([]);
      } finally {
        setLogLoading(false);
      }
    };
    loadLog();
  }, [test.brandId, test.id, logRefreshKey]);

  const leader = test.variants.reduce((best, v) => {
    const bestCR = getConversionRate(best);
    const vCR = getConversionRate(v);
    return vCR > bestCR ? v : best;
  }, test.variants[0]);

  const maxCr = Math.max(...test.variants.map(getConversionRate), 1);
  const badge = getSignificanceBadge(test.significanceLevel);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Resultados</h2>
          <p className="text-sm text-zinc-500">
            Variantes com maior CR em destaque. Significancia baseada no teste.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={test.autoOptimize ? 'default' : 'outline'}
            onClick={() => onToggleAutoOptimize?.(!test.autoOptimize)}
            disabled={isUpdating}
          >
            Auto-Optimize: {test.autoOptimize ? 'ON' : 'OFF'}
          </Button>
          <Button variant="secondary" onClick={onRunOptimization} disabled={isUpdating}>
            Run Optimization Now
          </Button>
          {test.status === 'draft' && (
            <Button onClick={() => onAction?.('start')} disabled={isUpdating}>
              Iniciar Teste
            </Button>
          )}
          {test.status === 'running' && (
            <Button variant="outline" onClick={() => onAction?.('pause')} disabled={isUpdating}>
              Pausar
            </Button>
          )}
          {test.status === 'paused' && (
            <Button onClick={() => onAction?.('start')} disabled={isUpdating}>
              Retomar
            </Button>
          )}
          {test.status !== 'completed' && (
            <Button variant="secondary" onClick={() => onAction?.('complete')} disabled={isUpdating}>
              Encerrar
            </Button>
          )}
        </div>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {test.variants.map((variant) => {
            const cr = getConversionRate(variant);
            const ctr = getCtr(variant);
            const isLeader = variant.id === leader.id;

            return (
              <div key={variant.id} className={`border rounded-lg p-4 ${isLeader ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-zinc-800 bg-zinc-900/30'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">{variant.name}</h3>
                    <p className="text-xs text-zinc-500">ID: {variant.id}</p>
                  </div>
                  {isLeader && (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Leader</Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs text-zinc-400">
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">Impressions</div>
                    <div className="font-semibold text-zinc-200">{variant.impressions}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">CTR</div>
                    <div className="font-semibold text-zinc-200">{ctr.toFixed(2)}%</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase text-zinc-500">CR</div>
                    <div className="font-semibold text-zinc-200">{cr.toFixed(2)}%</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <Badge variant="outline" className={badge.className}>
                    Significance {badge.label}
                  </Badge>
                  <div className="text-xs text-zinc-400">Revenue: ${variant.revenue.toFixed(2)}</div>
                </div>

                <div className="mt-3 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-600" style={{ width: `${(cr / maxCr) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/40 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Optimization History</h3>
          <span className="text-xs text-zinc-500">{logLoading ? 'Carregando...' : `${optimizationLog.length} entradas`}</span>
        </div>
        <div className="space-y-3">
          {optimizationLog.map((entry) => (
            <div key={entry.id} className="border border-zinc-800 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <div className="text-xs text-zinc-400">{entry.action.toUpperCase()} • variant {entry.variantId}</div>
                {!entry.executed && (
                  <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Kill-Switch</Badge>
                )}
              </div>
              <div className="text-sm text-zinc-200 mt-1">{entry.reason}</div>
              <div className="text-[10px] text-zinc-500 mt-2">
                Timestamp: {entry.timestamp?.toMillis?.() ?? 0}
              </div>
            </div>
          ))}
          {optimizationLog.length === 0 && !logLoading && (
            <div className="text-sm text-zinc-500">Nenhuma decisão registrada.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
