'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { GoogleSearchAd } from '@/types/creative-ads';

interface GoogleSearchCardProps {
  ad: GoogleSearchAd;
  estimatedCPS?: number;
  className?: string;
}

export function GoogleSearchCard({ ad, estimatedCPS, className }: GoogleSearchCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const displayUrl = ad.path
    ? `exemplo.com.br/${ad.path.filter(Boolean).join('/')}`
    : 'exemplo.com.br';

  return (
    <Card className={cn('w-full max-w-[600px] border-zinc-700/50 bg-zinc-900/80 p-4', className)}>
      {/* CPS badge */}
      {estimatedCPS !== undefined && (
        <div className="flex justify-end mb-2">
          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            CPS {estimatedCPS}
          </span>
        </div>
      )}

      {/* Ad label */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] font-bold text-zinc-900 bg-zinc-300 px-1 py-0.5 rounded">
          Ad
        </span>
        <span className="text-xs text-emerald-400">{displayUrl}</span>
      </div>

      {/* Headlines */}
      <div className="group relative mb-1">
        <h3 className="text-lg font-medium text-blue-400 hover:underline cursor-pointer leading-tight">
          {ad.headlines.join(' | ')}
        </h3>
        <button
          onClick={() => handleCopy(ad.headlines.join(' | '), 'headlines')}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-800/80"
          aria-label="Copiar headlines"
        >
          {copiedField === 'headlines' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
        </button>
      </div>

      {/* Descriptions */}
      <div className="group relative">
        <p className="text-sm text-zinc-400 leading-relaxed">
          {ad.descriptions.join(' ')}
        </p>
        <button
          onClick={() => handleCopy(ad.descriptions.join(' '), 'descriptions')}
          className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-800/80"
          aria-label="Copiar descrições"
        >
          {copiedField === 'descriptions' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
        </button>
      </div>
    </Card>
  );
}
