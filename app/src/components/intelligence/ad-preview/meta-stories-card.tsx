'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Copy, Check, ChevronUp } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { MetaStoriesAd } from '@/types/creative-ads';

interface MetaStoriesCardProps {
  ad: MetaStoriesAd;
  brandName?: string;
  estimatedCPS?: number;
  className?: string;
}

export function MetaStoriesCard({ ad, brandName = 'Marca', estimatedCPS, className }: MetaStoriesCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return (
    <Card className={cn(
      'relative w-full max-w-[320px] aspect-[9/16] border-zinc-700/50 bg-gradient-to-b from-zinc-900 via-zinc-900/95 to-zinc-800 overflow-hidden flex flex-col',
      className
    )}>
      {/* CPS badge */}
      {estimatedCPS !== undefined && (
        <div className="absolute top-3 right-3 z-10">
          <span className="text-[10px] font-mono font-bold text-blue-400 bg-zinc-900/80 backdrop-blur px-1.5 py-0.5 rounded border border-blue-500/20">
            CPS {estimatedCPS}
          </span>
        </div>
      )}

      {/* Brand avatar bar */}
      <div className="flex items-center gap-2 px-3 pt-3">
        <div className="h-7 w-7 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-pink-500/40">
          {brandName.charAt(0).toUpperCase()}
        </div>
        <span className="text-xs font-semibold text-white/90">{brandName}</span>
      </div>

      {/* Hook (top emphasis) */}
      <div className="flex-1 flex flex-col justify-between px-4 py-6">
        <div className="group relative">
          <p className="text-lg font-bold text-white leading-tight drop-shadow-lg">
            {ad.hook}
          </p>
          <button
            onClick={() => handleCopy(ad.hook, 'hook')}
            className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-900/80"
            aria-label="Copiar hook"
          >
            {copiedField === 'hook' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
          </button>
        </div>

        {/* Body (center) */}
        <div className="group relative">
          <p className="text-sm text-white/80 leading-relaxed">
            {ad.body}
          </p>
          <button
            onClick={() => handleCopy(ad.body, 'body')}
            className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-900/80"
            aria-label="Copiar body"
          >
            {copiedField === 'body' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
          </button>
        </div>

        {/* CTA overlay (bottom) */}
        <div className="text-center space-y-2">
          <ChevronUp className="h-5 w-5 text-white/60 mx-auto animate-bounce" />
          <div className="group relative inline-block">
            <span className="inline-block px-6 py-2.5 bg-white text-zinc-900 text-sm font-bold rounded-full">
              {ad.ctaOverlay}
            </span>
            <button
              onClick={() => handleCopy(ad.ctaOverlay, 'cta')}
              className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-900/80"
              aria-label="Copiar CTA"
            >
              {copiedField === 'cta' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
            </button>
          </div>
        </div>
      </div>

      {/* Visual direction footnote */}
      {ad.visualDirection && (
        <div className="px-3 pb-2">
          <p className="text-[9px] text-zinc-600 italic truncate">Visual: {ad.visualDirection}</p>
        </div>
      )}
    </Card>
  );
}
