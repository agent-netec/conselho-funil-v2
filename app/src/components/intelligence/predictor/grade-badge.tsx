'use client';

import { cn } from '@/lib/utils';
import type { ConversionGrade } from '@/types/prediction';

const GRADE_CONFIG: Record<ConversionGrade, { bg: string; text: string; border: string; label: string }> = {
  S: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40', label: 'Elite' },
  A: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40', label: 'Excelente' },
  B: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40', label: 'Bom' },
  C: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/40', label: 'Médio' },
  D: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/40', label: 'Fraco' },
  F: { bg: 'bg-zinc-700/40', text: 'text-zinc-500', border: 'border-zinc-600/40', label: 'Crítico' },
};

interface GradeBadgeProps {
  grade: ConversionGrade;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function GradeBadge({ grade, size = 'md', showLabel = false, className }: GradeBadgeProps) {
  const config = GRADE_CONFIG[grade];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-2xl px-4 py-2 font-bold',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-semibold',
        config.bg,
        config.text,
        config.border,
        sizeClasses[size],
        className
      )}
    >
      <span>{grade}</span>
      {showLabel && <span className="text-[0.75em] opacity-80">{config.label}</span>}
    </span>
  );
}

export { GRADE_CONFIG };
