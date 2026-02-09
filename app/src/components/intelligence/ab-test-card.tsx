'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ABTest } from '@/types/ab-testing';

interface ABTestCardProps {
  test: ABTest;
  onSelect: (testId: string) => void;
  isActive?: boolean;
}

const STATUS_STYLES: Record<ABTest['status'], string> = {
  draft: 'bg-zinc-700 text-zinc-200',
  running: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function ABTestCard({ test, onSelect, isActive }: ABTestCardProps) {
  const variantCount = test.variants.length;

  return (
    <Card
      className={`p-4 border ${isActive ? 'border-purple-500/60 bg-zinc-900/70' : 'border-zinc-800 bg-zinc-900/40'} cursor-pointer hover:border-zinc-700 transition-colors`}
      onClick={() => onSelect(test.id)}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-white">{test.name}</h3>
          <p className="text-xs text-zinc-500">
            Segmento: {test.targetSegment.toUpperCase()} • {variantCount} variantes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {test.autoOptimize && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Auto</Badge>
          )}
          <Badge variant="outline" className={STATUS_STYLES[test.status]}>
            {test.status.toUpperCase()}
          </Badge>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-zinc-400">
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Impressions</div>
          <div className="font-semibold text-zinc-200">{test.metrics.totalImpressions}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Conversions</div>
          <div className="font-semibold text-zinc-200">{test.metrics.totalConversions}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-zinc-500">Revenue</div>
          <div className="font-semibold text-zinc-200">${test.metrics.totalRevenue.toFixed(2)}</div>
        </div>
      </div>
    </Card>
  );
}
