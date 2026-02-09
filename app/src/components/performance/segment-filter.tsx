'use client';

import type { TargetSegment } from '@/types/ab-testing';

interface SegmentFilterProps {
  value: TargetSegment | 'all';
  onChange: (segment: TargetSegment | 'all') => void;
}

export function SegmentFilter({ value, onChange }: SegmentFilterProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-zinc-500 uppercase">Segmento</label>
      <select
        className="h-9 px-3 text-sm border rounded-md bg-background"
        value={value}
        onChange={(e) => onChange(e.target.value as TargetSegment | 'all')}
      >
        <option value="all">All</option>
        <option value="hot">Hot</option>
        <option value="warm">Warm</option>
        <option value="cold">Cold</option>
      </select>
    </div>
  );
}
