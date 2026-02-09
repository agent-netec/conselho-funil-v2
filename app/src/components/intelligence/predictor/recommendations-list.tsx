'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, ArrowUp, Minus, Lightbulb, BookOpen } from 'lucide-react';
import type { Recommendation } from '@/types/prediction';

const PRIORITY_CONFIG = {
  critical: {
    icon: AlertTriangle,
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    label: 'Crítico',
  },
  high: {
    icon: ArrowUp,
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    text: 'text-orange-400',
    label: 'Alto',
  },
  medium: {
    icon: Minus,
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    label: 'Médio',
  },
  low: {
    icon: Lightbulb,
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/20',
    text: 'text-zinc-400',
    label: 'Baixo',
  },
};

const PRIORITY_ORDER: Recommendation['priority'][] = ['critical', 'high', 'medium', 'low'];

interface RecommendationsListProps {
  recommendations: Recommendation[];
  className?: string;
}

export function RecommendationsList({ recommendations, className }: RecommendationsListProps) {
  // Ordenar por prioridade
  const sorted = [...recommendations].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority)
  );

  if (sorted.length === 0) {
    return (
      <div className={cn('text-center py-8 text-zinc-500', className)}>
        <Lightbulb className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhuma recomendação — seu funil está excelente!</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {sorted.map((rec, index) => {
        const config = PRIORITY_CONFIG[rec.priority];
        const Icon = config.icon;

        return (
          <Card
            key={`${rec.dimension}-${index}`}
            className={cn('border', config.border, config.bg)}
          >
            <CardContent className="py-3 px-4 space-y-2">
              {/* Header */}
              <div className="flex items-start gap-2">
                <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.text)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn('text-xs font-semibold uppercase tracking-wider', config.text)}>
                      {config.label}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      Score: {rec.currentScore}
                    </span>
                    {rec.framework && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                        <BookOpen className="h-2.5 w-2.5" />
                        {rec.framework}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-300 mt-1">{rec.issue}</p>
                </div>
              </div>

              {/* Suggestion */}
              <div className="pl-6">
                <p className="text-xs text-zinc-400">{rec.suggestion}</p>
                {rec.rewrittenAsset && (
                  <div className="mt-2 p-2 bg-zinc-800/60 rounded border border-zinc-700/50 text-xs text-zinc-300 italic">
                    &quot;{rec.rewrittenAsset}&quot;
                    {rec.basedOnEliteAsset && (
                      <span className="ml-1 text-[10px] text-yellow-400/70 not-italic">
                        (Elite Asset)
                      </span>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
