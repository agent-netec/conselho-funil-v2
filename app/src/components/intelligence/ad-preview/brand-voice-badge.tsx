'use client';

import { cn } from '@/lib/utils';
import { ShieldCheck } from 'lucide-react';

interface BrandVoiceBadgeProps {
  toneMatch: number;
  passed: boolean;
  className?: string;
}

export function BrandVoiceBadge({ toneMatch, passed, className }: BrandVoiceBadgeProps) {
  const percentage = Math.round(toneMatch * 100);

  let colorClasses: string;
  let label: string;
  if (toneMatch >= 0.75) {
    colorClasses = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    label = 'Alinhado';
  } else if (toneMatch >= 0.5) {
    colorClasses = 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
    label = 'Parcial';
  } else {
    colorClasses = 'text-red-400 bg-red-500/10 border-red-500/20';
    label = 'Desalinhado';
  }

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border',
      colorClasses,
      className
    )}>
      <ShieldCheck className="h-3 w-3" />
      <span>Voice {percentage}%</span>
      {!passed && <span className="opacity-60">({label})</span>}
    </span>
  );
}
