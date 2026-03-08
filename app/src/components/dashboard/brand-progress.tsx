'use client';

import { Check, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { calculateBrandCompleteness, FIELDS, type ModalKey } from '@/lib/utils/brand-completeness';
import type { Brand } from '@/types/database';

interface BrandProgressProps {
  brand: Brand;
  assetCount: number;
  onOpenModal?: (modalKey: ModalKey) => void;
}

const FIELD_LABELS: Record<string, string> = {};
for (const f of FIELDS) {
  FIELD_LABELS[f.key] = f.label;
}

export function BrandProgress({ brand, assetCount, onOpenModal }: BrandProgressProps) {
  const completeness = calculateBrandCompleteness(brand, assetCount);

  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-3.5 w-3.5 text-[#AB8648]" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
              Checklist da Marca
            </span>
          </div>
          <span
            className="font-mono text-sm font-bold tabular-nums text-[#F5E8CE]"
            style={{
              textShadow:
                completeness.score >= 80 ? '0 0 12px rgba(230,180,71,0.3)' : 'none',
            }}
          >
            {completeness.score}%
          </span>
        </div>

        {/* Progress bar */}
        <Progress
          value={completeness.score}
          className="h-1.5 bg-[#241F19] mb-5"
          indicatorClassName="from-[#E6B447] to-[#E6B447]"
        />

        {/* Checklist */}
        <div className="space-y-0.5">
          {/* Completed */}
          {completeness.completedFields.map((field) => (
            <div
              key={field}
              className="flex items-center gap-2.5 py-1.5 px-2 text-xs text-[#6B5D4A]"
            >
              <Check className="h-3.5 w-3.5 text-[#E6B447] flex-shrink-0" />
              <span className="line-through">{FIELD_LABELS[field] || field}</span>
            </div>
          ))}

          {/* Missing (clickable) */}
          {completeness.missingFields.map((field) => {
            const hasAction = field.modalKey || field.href;
            const inner = (
              <div className="flex items-center justify-between group py-1.5 px-2 rounded-md hover:bg-[#241F19] transition-colors">
                <div className="flex items-center gap-2.5 text-xs text-[#CAB792]">
                  <div className="h-3.5 w-3.5 rounded-full border border-[#3D3428] flex-shrink-0" />
                  <span>{field.label}</span>
                </div>
                {hasAction && (
                  <ArrowRight className="h-3 w-3 text-[#3D3428] group-hover:text-[#E6B447] transition-colors" />
                )}
              </div>
            );

            if (field.modalKey && onOpenModal) {
              return (
                <button
                  key={field.key}
                  type="button"
                  onClick={() => onOpenModal(field.modalKey!)}
                  className="w-full text-left cursor-pointer"
                >
                  {inner}
                </button>
              );
            }

            if (field.href) {
              return (
                <Link key={field.key} href={field.href}>
                  {inner}
                </Link>
              );
            }

            return <div key={field.key}>{inner}</div>;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
