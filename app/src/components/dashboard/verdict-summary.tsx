'use client';

import { motion } from 'framer-motion';
import { Target, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

interface VerdictSummaryProps {
  verdict: VerdictOutput | null;
  conversationId: string | null;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Score bar with gold glow on high scores
// ---------------------------------------------------------------------------

function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = (value / 10) * 100;
  const color = value >= 5 ? '#E6B447' : '#C45B3A';

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
          {label}
        </span>
        <span
          className="font-mono text-lg font-bold tabular-nums"
          style={{
            color,
            textShadow: value >= 8 ? '0 0 16px rgba(230,180,71,0.3)' : 'none',
          }}
        >
          {value}/10
        </span>
      </div>
      <div className="h-1.5 bg-[#241F19] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading / Empty states
// ---------------------------------------------------------------------------

function VerdictSkeleton() {
  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg bg-[#241F19]" />
          <div>
            <Skeleton className="h-4 w-32 bg-[#241F19] mb-1.5" />
            <Skeleton className="h-3 w-20 bg-[#1A1612]" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-10 bg-[#241F19] rounded" />
          <Skeleton className="h-10 bg-[#241F19] rounded" />
        </div>
        <Skeleton className="h-14 bg-[#241F19] rounded" />
      </CardContent>
    </Card>
  );
}

function EmptyVerdictCard() {
  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/10 mb-3">
          <MessageSquare className="h-5 w-5 text-[#E6B447]" />
        </div>
        <p className="text-sm font-medium text-[#CAB792] mb-1">Veredito a caminho</p>
        <p className="text-xs text-[#6B5D4A] mb-4 max-w-xs mx-auto">
          Consulte o MKTHONEY para receber sua analise estrategica.
        </p>
        <Link href="/chat">
          <Button size="sm" className="btn-accent text-xs">
            <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
            Consultar MKTHONEY
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// VerdictSummary (exported)
// ---------------------------------------------------------------------------

export function VerdictSummary({ verdict, conversationId, isLoading }: VerdictSummaryProps) {
  if (isLoading) return <VerdictSkeleton />;
  if (!verdict) return <EmptyVerdictCard />;

  const topAction = verdict.actions?.[0];

  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none border-l-2 border-l-[#E6B447]/50">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E6B447]/10">
              <Target className="h-4 w-4 text-[#E6B447]" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F5E8CE]">Veredito Estrategico</h3>
              <p className="text-[11px] text-[#6B5D4A]">{verdict.brandName}</p>
            </div>
          </div>
          {conversationId && (
            <Link
              href={`/chat?id=${conversationId}`}
              className="flex items-center gap-1 text-[11px] font-medium text-[#AB8648] hover:text-[#E6B447] transition-colors"
            >
              Ver completo
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-6 mb-4 p-3 rounded-lg bg-[#0D0B09] border border-[#2A2318]">
          <ScoreBar value={verdict.scores.positioning.value} label="Posicionamento" />
          <ScoreBar value={verdict.scores.offer.value} label="Oferta" />
        </div>

        {/* Top recommended action */}
        {topAction && (
          <div className="p-3 rounded-lg bg-[#0D0B09] border border-[#2A2318]">
            <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#6B5D4A] block mb-1">
              Proxima acao
            </span>
            <p className="text-sm font-medium text-[#F5E8CE]">{topAction.title}</p>
            <p className="text-xs text-[#6B5D4A] mt-0.5">{topAction.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
