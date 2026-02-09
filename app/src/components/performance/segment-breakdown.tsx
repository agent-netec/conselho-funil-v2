'use client';

import { Card } from '@/components/ui/card';
import type { SegmentBreakdownData, SegmentMetrics } from '@/types/ab-testing';

interface SegmentBreakdownProps {
  data: SegmentBreakdownData | null;
  loading?: boolean;
  selectedSegment?: 'hot' | 'warm' | 'cold' | 'all';
}

function SegmentCard({
  title,
  metrics,
  accent,
  highlighted = false,
}: {
  title: string;
  metrics: SegmentMetrics;
  accent: string;
  highlighted?: boolean;
}) {
  return (
    <Card
      className={`p-4 border-zinc-800 bg-zinc-900/40 border-l-4 ${accent} ${
        highlighted ? 'ring-2 ring-zinc-300/40 shadow-lg shadow-zinc-950/40' : ''
      }`}
    >
      <div className="text-xs uppercase text-zinc-400">{title}</div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Leads</div>
          <div className="text-sm font-semibold text-zinc-200">{metrics.totalLeads}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Conversions</div>
          <div className="text-sm font-semibold text-zinc-200">{metrics.conversions}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Avg Revenue</div>
          <div className="text-sm font-semibold text-zinc-200">${metrics.avgRevenue.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500">CR</div>
          <div className="text-sm font-semibold text-zinc-200">{metrics.conversionRate.toFixed(1)}%</div>
        </div>
      </div>
    </Card>
  );
}

export function SegmentBreakdown({ data, loading, selectedSegment = 'all' }: SegmentBreakdownProps) {
  if (loading) {
    return (
      <Card className="p-6 border-zinc-800 bg-zinc-900/30 text-center text-sm text-zinc-500">
        Carregando segmentos...
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="p-6 border-zinc-800 bg-zinc-900/30 text-center text-sm text-zinc-500">
        Nenhum dado de segmento disponível.
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <SegmentCard
        title="HOT"
        metrics={data.hot}
        accent="border-l-red-500"
        highlighted={selectedSegment === 'hot'}
      />
      <SegmentCard
        title="WARM"
        metrics={data.warm}
        accent="border-l-yellow-500"
        highlighted={selectedSegment === 'warm'}
      />
      <SegmentCard
        title="COLD"
        metrics={data.cold}
        accent="border-l-blue-500"
        highlighted={selectedSegment === 'cold'}
      />
    </div>
  );
}
