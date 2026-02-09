"use client";

import { Card } from '@/components/ui/card';
import type { LTVBatchResult } from '@/types/predictive';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  data: LTVBatchResult | null;
}

export function LTVBreakdown({ data }: Props) {
  if (!data) return <Card className="p-4 border-zinc-800 bg-zinc-900/30">Sem dados de LTV.</Card>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {data.cohorts.map((cohort) => (
          <Card key={cohort.cohortId} className="p-4 border-zinc-800 bg-zinc-900/30">
            <div className="text-xs text-zinc-400 uppercase">{cohort.segment}</div>
            <div className="text-zinc-100 font-semibold">ARPL: {cohort.avgRevenuePerLead.toFixed(2)}</div>
            <div className="text-zinc-300 text-sm">m3: {cohort.projectedLTV.m3.toFixed(2)}</div>
            <div className="text-zinc-300 text-sm">m6: {cohort.projectedLTV.m6.toFixed(2)}</div>
            <div className="text-zinc-300 text-sm">m12: {cohort.projectedLTV.m12.toFixed(2)}</div>
            <div className="text-zinc-500 text-xs">confiança: {(cohort.confidenceScore * 100).toFixed(0)}%</div>
          </Card>
        ))}
      </div>
      <Card className="p-4 border-zinc-800 bg-zinc-900/30 h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.cohorts.map((c) => ({ segment: c.segment, m12: c.projectedLTV.m12 }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="segment" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            <Bar dataKey="m12" fill="#a855f7" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
