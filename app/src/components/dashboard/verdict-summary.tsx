'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Target, ArrowRight, RefreshCcw, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import type { VerdictOutput } from '@/lib/ai/prompts/verdict-prompt';

interface VerdictSummaryProps {
  verdict: VerdictOutput | null;
  previousScores?: { positioning: number | null; offer: number | null } | null;
  brandId?: string;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Score bar with gold glow on high scores + delta indicator
// ---------------------------------------------------------------------------

function ScoreBar({ value, label, previousValue }: { value: number; label: string; previousValue?: number | null }) {
  const pct = (value / 10) * 100;
  const color = value >= 5 ? '#E6B447' : '#C45B3A';
  const delta = previousValue != null ? value - previousValue : null;

  return (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
          {label}
        </span>
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-lg font-bold tabular-nums"
            style={{
              color,
              textShadow: value >= 8 ? '0 0 16px rgba(230,180,71,0.3)' : 'none',
            }}
          >
            {value}/10
          </span>
          {delta !== null && delta !== 0 && (
            <span className={`flex items-center gap-0.5 text-[10px] font-mono font-medium ${delta > 0 ? 'text-[#7A9B5A]' : 'text-[#C45B3A]'}`}>
              {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
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

function GeneratingVerdictCard() {
  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none border-l-2 border-l-[#E6B447]/50">
      <CardContent className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/10 mb-3">
          <Loader2 className="h-5 w-5 text-[#E6B447] animate-spin" />
        </div>
        <p className="text-sm font-medium text-[#CAB792] mb-1">Gerando seu diagnostico...</p>
        <p className="text-xs text-[#6B5D4A] max-w-xs mx-auto">
          23 conselheiros analisando seu posicionamento e oferta
        </p>
      </CardContent>
    </Card>
  );
}

function EmptyVerdictCard({ brandId }: { brandId?: string }) {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!brandId) return;
    setGenerating(true);
    try {
      const h = await getAuthHeaders();
      await fetch(`/api/brands/${brandId}/verdict`, { method: 'POST', headers: h });
      // Hook will auto-update via onSnapshot
    } catch (e) {
      console.error('[VerdictSummary] Generate error:', e);
    } finally {
      setGenerating(false);
    }
  };

  if (generating) return <GeneratingVerdictCard />;

  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#E6B447]/10 mb-3">
          <Target className="h-5 w-5 text-[#E6B447]" />
        </div>
        <p className="text-sm font-medium text-[#CAB792] mb-1">Diagnostico estrategico</p>
        <p className="text-xs text-[#6B5D4A] mb-4 max-w-xs mx-auto">
          Gere seu primeiro diagnostico para entender o posicionamento da sua marca.
        </p>
        <Button onClick={handleGenerate} size="sm" className="btn-accent text-xs" disabled={!brandId}>
          <Target className="mr-1.5 h-3.5 w-3.5" />
          Gerar diagnostico
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// VerdictSummary (exported)
// ---------------------------------------------------------------------------

export function VerdictSummary({ verdict, previousScores, brandId, isLoading }: VerdictSummaryProps) {
  const [refreshing, setRefreshing] = useState(false);

  if (isLoading) return <VerdictSkeleton />;
  if (!verdict) return <EmptyVerdictCard brandId={brandId} />;

  const topAction = verdict.actions?.[0];

  const handleRefresh = async () => {
    if (!brandId) return;
    setRefreshing(true);
    try {
      const h = await getAuthHeaders();
      await fetch(`/api/brands/${brandId}/verdict`, { method: 'POST', headers: h });
    } catch (e) {
      console.error('[VerdictSummary] Refresh error:', e);
    } finally {
      setRefreshing(false);
    }
  };

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
              <h3 className="text-sm font-semibold text-[#F5E8CE]">Health Score</h3>
              <p className="text-[11px] text-[#6B5D4A]">{verdict.brandName}</p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-[11px] font-medium text-[#AB8648] hover:text-[#E6B447] transition-colors disabled:opacity-50"
            title="Atualizar diagnostico (1 credito)"
          >
            <RefreshCcw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>

        {/* Scores */}
        <div className="grid grid-cols-2 gap-6 mb-4 p-3 rounded-lg bg-[#0D0B09] border border-[#2A2318]">
          <ScoreBar
            value={verdict.scores.positioning.value}
            label="Posicionamento"
            previousValue={previousScores?.positioning}
          />
          <ScoreBar
            value={verdict.scores.offer.value}
            label="Oferta"
            previousValue={previousScores?.offer}
          />
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
