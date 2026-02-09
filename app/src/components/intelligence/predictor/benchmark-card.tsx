'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Trophy } from 'lucide-react';
import type { BenchmarkComparison } from '@/types/prediction';

interface BenchmarkCardProps {
  benchmark: BenchmarkComparison;
  currentScore: number;
  className?: string;
}

export function BenchmarkCard({ benchmark, currentScore, className }: BenchmarkCardProps) {
  const percentileDisplay = benchmark.percentileRank >= 50
    ? `Top ${100 - benchmark.percentileRank}%`
    : `Bottom ${benchmark.percentileRank}%`;

  const isAboveAverage = currentScore > benchmark.averageCPS;

  return (
    <Card className={cn('border-zinc-800 bg-zinc-900/60', className)}>
      <CardContent className="py-4 px-5 space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <TrendingUp className="h-4 w-4 text-blue-400" />
          Benchmark Comparativo
        </div>

        {/* Position marker */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>0</span>
            <span>Média: {benchmark.averageCPS.toFixed(0)}</span>
            <span>100</span>
          </div>
          <div className="relative h-3 w-full rounded-full bg-white/[0.06] overflow-hidden">
            {/* Average marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-zinc-500 z-10"
              style={{ left: `${benchmark.averageCPS}%` }}
            />
            {/* Top 10% marker */}
            <div
              className="absolute top-0 h-full w-0.5 bg-yellow-500/50 z-10"
              style={{ left: `${benchmark.topPerformersCPS}%` }}
            />
            {/* Current score position */}
            <motion.div
              className="absolute top-0 h-full w-2 rounded-full bg-blue-400 z-20"
              initial={{ left: '0%' }}
              animate={{ left: `calc(${currentScore}% - 4px)` }}
              transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            />
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center space-y-1">
            <Users className="h-3.5 w-3.5 mx-auto text-zinc-500" />
            <p className="text-lg font-bold tabular-nums text-zinc-200">
              {benchmark.totalFunnelsInBase}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Funis na Base</p>
          </div>
          <div className="text-center space-y-1">
            <TrendingUp className="h-3.5 w-3.5 mx-auto text-zinc-500" />
            <p className={cn(
              'text-lg font-bold tabular-nums',
              isAboveAverage ? 'text-emerald-400' : 'text-red-400'
            )}>
              {percentileDisplay}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Seu Ranking</p>
          </div>
          <div className="text-center space-y-1">
            <Trophy className="h-3.5 w-3.5 mx-auto text-yellow-500" />
            <p className="text-lg font-bold tabular-nums text-yellow-400">
              {benchmark.topPerformersCPS.toFixed(0)}
            </p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Top 10%</p>
          </div>
        </div>

        {/* Comparison label */}
        <p className={cn(
          'text-xs text-center font-medium px-3 py-1.5 rounded-full',
          isAboveAverage
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
        )}>
          {benchmark.comparisonLabel}
        </p>
      </CardContent>
    </Card>
  );
}
