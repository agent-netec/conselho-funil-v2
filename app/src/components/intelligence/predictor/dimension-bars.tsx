'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { DimensionScore } from '@/types/prediction';

/** Mapeamento de dimensão para label legível */
const DIMENSION_LABELS: Record<string, string> = {
  headline_strength: 'Força da Headline',
  cta_effectiveness: 'Eficácia do CTA',
  hook_quality: 'Qualidade do Hook',
  offer_structure: 'Estrutura da Oferta',
  funnel_coherence: 'Coerência do Funil',
  trust_signals: 'Sinais de Confiança',
};

/** Retorna classes Tailwind para cor da barra baseada no score */
function getBarColor(score: number): string {
  if (score >= 90) return 'bg-yellow-400';
  if (score >= 75) return 'bg-emerald-400';
  if (score >= 60) return 'bg-blue-400';
  if (score >= 45) return 'bg-orange-400';
  if (score >= 30) return 'bg-red-400';
  return 'bg-zinc-600';
}

interface DimensionBarsProps {
  breakdown: DimensionScore[];
  className?: string;
}

export function DimensionBars({ breakdown, className }: DimensionBarsProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {breakdown.map((dim, index) => (
        <Tooltip key={dim.dimension}>
          <TooltipTrigger asChild>
            <div className="group cursor-pointer">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  {DIMENSION_LABELS[dim.dimension] || dim.label}
                </span>
                <span className="text-xs font-mono font-semibold text-zinc-300 tabular-nums">
                  {dim.score}
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  className={cn('h-full rounded-full', getBarColor(dim.score))}
                  initial={{ width: 0 }}
                  animate={{ width: `${dim.score}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                />
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="font-medium mb-1">{dim.explanation}</p>
            {dim.evidence.length > 0 && (
              <ul className="text-[10px] opacity-80 space-y-0.5">
                {dim.evidence.slice(0, 3).map((e, i) => (
                  <li key={i}>• {e}</li>
                ))}
              </ul>
            )}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
