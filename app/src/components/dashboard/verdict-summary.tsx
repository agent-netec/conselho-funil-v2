'use client';

import { motion } from 'framer-motion';
import { Target, ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

interface VerdictSummaryProps {
  verdict: VerdictOutput | null;
  conversationId: string | null;
  isLoading: boolean;
}

function MiniScoreBar({ value, label }: { value: number; label: string }) {
  const getColor = (score: number) => {
    if (score >= 8) return { bar: 'bg-emerald-500', text: 'text-emerald-400' };
    if (score >= 5) return { bar: 'bg-yellow-500', text: 'text-yellow-400' };
    return { bar: 'bg-red-500', text: 'text-red-400' };
  };

  const colors = getColor(value);
  const percentage = (value / 10) * 100;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{label}</span>
        <span className={`text-lg font-bold ${colors.text}`}>{value}/10</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className={`h-full ${colors.bar} rounded-full`}
        />
      </div>
    </div>
  );
}

function VerdictSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-zinc-800" />
        <div>
          <div className="h-4 w-40 rounded bg-zinc-800 mb-2" />
          <div className="h-3 w-24 rounded bg-zinc-800/50" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="h-12 rounded bg-zinc-800/50" />
        <div className="h-12 rounded bg-zinc-800/50" />
      </div>
      <div className="h-16 rounded bg-zinc-800/30" />
    </div>
  );
}

function EmptyVerdictCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6 text-center"
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
        <MessageSquare className="h-7 w-7 text-emerald-400" />
      </div>
      <h3 className="text-base font-semibold text-white mb-2">
        Seu veredito esta a caminho
      </h3>
      <p className="text-sm text-zinc-500 mb-4 max-w-sm mx-auto">
        Consulte o Conselho para receber sua analise estrategica personalizada.
      </p>
      <Link href="/chat">
        <Button className="btn-accent">
          <MessageSquare className="mr-2 h-4 w-4" />
          Consultar o Conselho
        </Button>
      </Link>
    </motion.div>
  );
}

export function VerdictSummary({ verdict, conversationId, isLoading }: VerdictSummaryProps) {
  if (isLoading) return <VerdictSkeleton />;
  if (!verdict) return <EmptyVerdictCard />;

  const topAction = verdict.actions?.[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border border-emerald-500/20 border-l-4 border-l-emerald-500 bg-zinc-900/60 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
            <Target className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Veredito Estrategico</h3>
            <p className="text-xs text-zinc-500">{verdict.brandName}</p>
          </div>
        </div>
        {conversationId && (
          <Link
            href={`/chat?id=${conversationId}`}
            className="flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Ver completo
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-6 mb-5 p-4 rounded-xl bg-zinc-800/40 border border-white/[0.04]">
        <MiniScoreBar
          value={verdict.scores.positioning.value}
          label="Posicionamento"
        />
        <MiniScoreBar
          value={verdict.scores.offer.value}
          label="Oferta"
        />
      </div>

      {/* Top action */}
      {topAction && (
        <div className="p-3 rounded-lg bg-zinc-800/30 border border-white/[0.04]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
            Proxima acao recomendada
          </p>
          <p className="text-sm font-medium text-white">{topAction.title}</p>
          <p className="text-xs text-zinc-400 mt-0.5">{topAction.description}</p>
        </div>
      )}
    </motion.div>
  );
}
