'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity } from 'lucide-react';
import { CPSGauge } from './cps-gauge';
import { DimensionBars } from './dimension-bars';
import { BenchmarkCard } from './benchmark-card';
import { RecommendationsList } from './recommendations-list';
import type { PredictScoreResponse } from '@/types/prediction';

interface PredictionPanelProps {
  data: PredictScoreResponse | null;
  loading?: boolean;
  className?: string;
}

/** Skeleton para loading state (~3-5s) */
function PredictionSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gauge skeleton */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="py-6 flex flex-col items-center">
            <Skeleton className="h-[140px] w-[240px] rounded-t-full" />
            <Skeleton className="h-6 w-16 mt-4" />
          </CardContent>
        </Card>

        {/* Dimensions skeleton */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardContent className="py-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-8" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Benchmark skeleton */}
      <Skeleton className="h-[180px] w-full" />

      {/* Recommendations skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}

export function PredictionPanel({ data, loading, className }: PredictionPanelProps) {
  if (loading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Activity className="h-4 w-4 animate-pulse text-purple-400" />
          Calculando Conversion Probability Score...
        </div>
        <PredictionSkeleton />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Hero Row: CPS Gauge + Dimension Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CPS Gauge (Hero) */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400 font-medium">
              Conversion Probability Score
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center pb-6">
            <CPSGauge score={data.score} grade={data.grade} />
          </CardContent>
        </Card>

        {/* Dimension Bars */}
        <Card className="border-zinc-800 bg-zinc-900/60">
          <CardHeader>
            <CardTitle className="text-sm text-zinc-400 font-medium">
              Diagnóstico por Dimensão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DimensionBars breakdown={data.breakdown} />
          </CardContent>
        </Card>
      </div>

      {/* Benchmark */}
      {data.benchmark && (
        <BenchmarkCard benchmark={data.benchmark} currentScore={data.score} />
      )}

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-400">
            Recomendações de Melhoria ({data.recommendations.length})
          </h3>
          <RecommendationsList recommendations={data.recommendations} />
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex items-center gap-4 text-[10px] text-zinc-600 px-1">
        <span>Modelo: {data.metadata.modelUsed}</span>
        <span>Tokens: {data.metadata.tokensUsed.toLocaleString('pt-BR')}</span>
        <span>Tempo: {(data.metadata.processingTimeMs / 1000).toFixed(1)}s</span>
      </div>
    </div>
  );
}
