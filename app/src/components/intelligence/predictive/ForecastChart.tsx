"use client";

import { Card } from '@/components/ui/card';
import type { AudienceForecast } from '@/types/predictive';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface Props {
  data: AudienceForecast | null;
}

export function ForecastChart({ data }: Props) {
  if (!data) return <Card className="p-4 border-zinc-800 bg-zinc-900/30">Sem dados de forecast.</Card>;
  const chartData = [
    { period: 'Hoje', ...data.currentDistribution },
    { period: '7d', ...data.projections.days7 },
    { period: '14d', ...data.projections.days14 },
    { period: '30d', ...data.projections.days30 },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-4 border-zinc-800 bg-zinc-900/30 h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis dataKey="period" stroke="#a1a1aa" />
            <YAxis stroke="#a1a1aa" />
            <Tooltip />
            <Area dataKey="hot" stackId="1" stroke="#ef4444" fill="#ef444466" />
            <Area dataKey="warm" stackId="1" stroke="#f59e0b" fill="#f59e0b66" />
            <Area dataKey="cold" stackId="1" stroke="#3b82f6" fill="#3b82f666" />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
      <Card className="p-4 border-zinc-800 bg-zinc-900/30 text-sm text-zinc-200">
        {data.trendsNarrative}
      </Card>
    </div>
  );
}
