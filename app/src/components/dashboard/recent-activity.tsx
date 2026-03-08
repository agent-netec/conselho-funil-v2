'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Target, ArrowRight, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Funnel } from '@/types/database';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Rascunho', className: 'border-[#3D3428] text-[#6B5D4A]' },
  generating: { label: 'Gerando', className: 'border-[#5B8EC4]/30 text-[#5B8EC4]' },
  review: { label: 'Avaliar', className: 'border-amber-500/30 text-amber-400' },
  approved: { label: 'Aprovado', className: 'border-[#E6B447]/30 text-[#E6B447]' },
  adjusting: { label: 'Ajustando', className: 'border-violet-500/30 text-violet-400' },
  executing: { label: 'Executando', className: 'border-[#5B8EC4]/30 text-[#5B8EC4]' },
  completed: { label: 'Concluido', className: 'border-[#7A9B5A]/30 text-[#7A9B5A]' },
  killed: { label: 'Cancelado', className: 'border-[#C45B3A]/30 text-[#C45B3A]' },
};

export function RecentActivity({ funnels, isLoading }: { funnels: Funnel[]; isLoading: boolean }) {
  const recent = funnels?.slice(0, 5) ?? [];

  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-[#E6B447]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
              Funis em Operacao
            </span>
          </div>
          <Link
            href="/funnels"
            className="flex items-center gap-1 text-[11px] font-medium text-[#6B5D4A] hover:text-[#E6B447] transition-colors"
          >
            Pipeline
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-[#241F19]" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-28 bg-[#241F19] mb-1.5" />
                  <Skeleton className="h-3 w-40 bg-[#1A1612]" />
                </div>
              </div>
            ))}
          </div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#241F19] mb-3">
              <Target className="h-5 w-5 text-[#3D3428]" />
            </div>
            <p className="text-sm font-medium text-[#CAB792] mb-1">Nenhum funil ainda</p>
            <p className="text-xs text-[#6B5D4A] mb-4">
              Crie seu primeiro funil para ativar o painel
            </p>
            <Link href="/funnels/new">
              <Button size="sm" className="btn-accent text-xs">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Criar Funil
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[#2A2318]">
            {recent.map((funnel, i) => {
              const status = STATUS_CONFIG[funnel.status] ?? STATUS_CONFIG.draft;
              return (
                <motion.div
                  key={funnel.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: i * 0.05 }}
                >
                  <Link
                    href={`/funnels/${funnel.id}`}
                    className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[#241F19]"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6B447]/10 flex-shrink-0">
                      <Target className="h-4 w-4 text-[#E6B447]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-sm font-medium text-[#F5E8CE] group-hover:text-[#E6B447] transition-colors truncate">
                        {funnel.name}
                      </span>
                      <span className="block text-[11px] text-[#6B5D4A] truncate">
                        {funnel.context?.objective} · {funnel.context?.channel?.main || funnel.context?.channels?.primary}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`font-mono text-[10px] rounded-md flex-shrink-0 ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
