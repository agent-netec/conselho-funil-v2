'use client';

import { cn } from '@/lib/utils';
import { Zap, BookOpen, Shield, Target, Layers } from 'lucide-react';
import type { DesignPieceRole } from '@/types/design-system';

const roleConfig: Record<DesignPieceRole, { label: string; icon: typeof Zap; color: string }> = {
  hook: { label: 'Hook', icon: Zap, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
  development: { label: 'Desenvolvimento', icon: BookOpen, color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  proof: { label: 'Prova', icon: Shield, color: 'text-green-400 bg-green-500/10 border-green-500/30' },
  retargeting: { label: 'Retargeting', icon: Target, color: 'text-red-400 bg-red-500/10 border-red-500/30' },
  standalone: { label: 'Standalone', icon: Layers, color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/30' },
};

interface PieceRoleBadgeProps {
  role: DesignPieceRole;
  className?: string;
  size?: 'sm' | 'md';
}

export function PieceRoleBadge({ role, className, size = 'sm' }: PieceRoleBadgeProps) {
  const config = roleConfig[role] || roleConfig.standalone;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-bold uppercase tracking-wider',
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[11px]',
        className
      )}
    >
      <Icon className={size === 'sm' ? 'w-2.5 h-2.5' : 'w-3.5 h-3.5'} />
      {config.label}
    </span>
  );
}
