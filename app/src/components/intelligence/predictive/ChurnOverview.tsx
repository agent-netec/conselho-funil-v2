"use client";

import { Card } from '@/components/ui/card';
import type { ChurnBatchResult } from '@/types/predictive';

interface Props {
  data: ChurnBatchResult | null;
}

export function ChurnOverview({ data }: Props) {
  if (!data) return <Card className="p-4 border-zinc-800 bg-zinc-900/30">Sem dados de churn.</Card>;
  const critical = data.predictions.filter((p) => p.riskLevel === 'critical').length;
  const warning = data.predictions.filter((p) => p.riskLevel === 'warning').length;
  const safe = data.predictions.filter((p) => p.riskLevel === 'safe').length;
  const top = data.predictions.slice().sort((a, b) => b.churnRisk - a.churnRisk).slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-zinc-800 bg-zinc-900/30">At risk: {data.atRisk}</Card>
        <Card className="p-4 border-zinc-800 bg-zinc-900/30">Critical: {critical}</Card>
        <Card className="p-4 border-zinc-800 bg-zinc-900/30">Warning: {warning}</Card>
        <Card className="p-4 border-zinc-800 bg-zinc-900/30">Safe: {safe}</Card>
      </div>
      <Card className="p-4 border-zinc-800 bg-zinc-900/30">
        <h3 className="text-sm font-semibold text-zinc-100 mb-2">Top 10 risco</h3>
        <div className="space-y-2 text-sm">
          {top.map((item) => (
            <div key={item.leadId} className="flex justify-between border-b border-zinc-800/70 pb-1">
              <span className="text-zinc-300">{item.leadId}</span>
              <span className="text-zinc-100">{(item.churnRisk * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
