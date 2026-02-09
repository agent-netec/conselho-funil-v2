'use client';

/**
 * StatusBadge — Componente reutilizavel para status de conteudo
 * 6 cores por status (draft, pending_review, approved, scheduled, published, rejected)
 *
 * @component
 * @story S33-APR-03
 */

import type { CalendarItemStatus } from '@/types/content';

const STATUS_CONFIG: Record<CalendarItemStatus, { label: string; className: string }> = {
  draft: {
    label: 'Rascunho',
    className: 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
  },
  pending_review: {
    label: 'Em Revisao',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  approved: {
    label: 'Aprovado',
    className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  },
  scheduled: {
    label: 'Agendado',
    className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  },
  published: {
    label: 'Publicado',
    className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  },
  rejected: {
    label: 'Rejeitado',
    className: 'bg-red-500/20 text-red-300 border-red-500/30',
  },
};

interface StatusBadgeProps {
  status: CalendarItemStatus;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;

  return (
    <span
      className={`
        inline-flex items-center rounded-full border font-medium
        ${size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'}
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}
