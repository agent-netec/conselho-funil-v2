'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { calculateBrandCompleteness, type CompletenessResult } from '@/lib/utils/brand-completeness';
import type { Brand } from '@/types/database';
import Link from 'next/link';

interface BrandCompletenessProps {
  brand: Brand;
  assetCount?: number;
  mode?: 'compact' | 'detailed';
  brandId?: string;
}

export function BrandCompleteness({ brand, assetCount = 0, mode = 'compact', brandId }: BrandCompletenessProps) {
  const result = calculateBrandCompleteness(brand, assetCount);

  if (mode === 'compact') {
    return <CompactView result={result} />;
  }

  return <DetailedView result={result} brandId={brandId || brand.id} />;
}

function CompactView({ result }: { result: CompletenessResult }) {
  const color = result.score >= 80
    ? 'gold'
    : result.score >= 50
      ? 'amber'
      : 'red';

  const colorMap = {
    gold: { bar: 'bg-[#E6B447]', text: 'text-[#E6B447]', bg: 'bg-[#E6B447]/10' },
    amber: { bar: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    red: { bar: 'bg-red-500', text: 'text-red-400', bg: 'bg-red-500/10' },
  };

  const colors = colorMap[color];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        <span>Completude</span>
        <span className={colors.text}>{result.score}%</span>
      </div>
      <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${result.score}%` }}
          className={cn('h-full rounded-full', colors.bar)}
        />
      </div>
    </div>
  );
}

function DetailedView({ result, brandId }: { result: CompletenessResult; brandId: string }) {
  // Score >= 70%: marca está suficientemente completa — não mostrar checklist
  if (result.score >= 70) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-zinc-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-zinc-300">
              Complete sua marca
            </p>
            <span className="text-xs text-zinc-400 font-bold">{result.score}%</span>
          </div>

          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-[#E6B447] rounded-full transition-all"
              style={{ width: `${result.score}%` }}
            />
          </div>

          <p className="text-xs text-zinc-500 mb-3">
            Preencha os campos abaixo para melhorar os resultados da IA.
          </p>

          <div className="space-y-1.5">
            {result.missingFields.map((field) => (
              <div key={field.key} className="flex items-center gap-2 text-xs">
                <Circle className="h-3 w-3 text-zinc-600" />
                {field.href ? (
                  <Link
                    href={`/brands/${brandId}${field.href}`}
                    className="text-zinc-400 hover:text-[#E6B447] transition-colors"
                  >
                    {field.label}
                  </Link>
                ) : (
                  <span className="text-zinc-400">{field.label}</span>
                )}
              </div>
            ))}
            {result.completedFields.length > 0 && (
              <div className="flex items-center gap-2 text-xs text-[#E6B447]/60">
                <CheckCircle2 className="h-3 w-3" />
                <span>{result.completedFields.length} itens completos</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
