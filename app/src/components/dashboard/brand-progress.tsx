'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="rounded-2xl border border-white/[0.06] bg-zinc-900/60 p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-[#E6B447]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#E6B447]">
            Checklist da Marca
          </h3>
        </div>
        <span className="text-sm font-bold text-white">
          {completeness.score}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-6">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${completeness.score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          className="h-full bg-[#E6B447] rounded-full"
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {/* Completed items */}
        {completeness.completedFields.map((field) => (
          <div
            key={field}
            className="flex items-center gap-3 py-2 px-2 text-sm text-zinc-500"
          >
            <Check className="h-4 w-4 text-[#E6B447] flex-shrink-0" />
            <span className="line-through">{FIELD_LABELS[field] || field}</span>
          </div>
        ))}

        {/* Missing items (clickable) */}
        {completeness.missingFields.map((field) => {
          const hasAction = field.modalKey || field.href;
          const inner = (
            <div className="flex items-center justify-between group py-2 px-2 rounded-lg hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 text-sm text-zinc-300">
                <div className="h-4 w-4 rounded-full border border-zinc-600 flex-shrink-0" />
                <span>{field.label}</span>
              </div>
              {hasAction && (
                <ArrowRight className="h-3 w-3 text-zinc-600 group-hover:text-[#E6B447] transition-colors" />
              )}
            </div>
          );

          // Modal-based action
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

          // Link-based action
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
    </motion.div>
  );
}
