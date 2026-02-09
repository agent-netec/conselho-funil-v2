'use client';

import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Copy, Check, MoreHorizontal } from 'lucide-react';
import { useState, useCallback } from 'react';
import type { MetaFeedAd } from '@/types/creative-ads';

interface MetaFeedCardProps {
  ad: MetaFeedAd;
  brandName?: string;
  estimatedCPS?: number;
  className?: string;
}

export function MetaFeedCard({ ad, brandName = 'Marca', estimatedCPS, className }: MetaFeedCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  return (
    <Card className={cn('w-full max-w-[400px] border-zinc-700/50 bg-zinc-900/80 overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white">
          {brandName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-zinc-200 truncate">{brandName}</p>
          <p className="text-[10px] text-zinc-500">Patrocinado · <MoreHorizontal className="inline h-3 w-3" /></p>
        </div>
        {estimatedCPS !== undefined && (
          <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            CPS {estimatedCPS}
          </span>
        )}
      </div>

      {/* Body text */}
      <div className="px-3 pb-2 group relative">
        <p className="text-sm text-zinc-300 leading-relaxed">{ad.body}</p>
        <button
          onClick={() => handleCopy(ad.body, 'body')}
          className="absolute top-0 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-800/80"
          aria-label="Copiar texto"
        >
          {copiedField === 'body' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
        </button>
      </div>

      {/* Image placeholder */}
      <div className="aspect-square bg-zinc-800/60 flex items-center justify-center border-y border-zinc-700/30">
        <div className="text-center space-y-2">
          <Image className="h-10 w-10 text-zinc-600 mx-auto" />
          {ad.imageSuggestion && (
            <p className="text-[10px] text-zinc-600 max-w-[200px] mx-auto">{ad.imageSuggestion}</p>
          )}
        </div>
      </div>

      {/* Footer: Headline + CTA */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0 group relative">
          <p className="text-sm font-semibold text-zinc-200 truncate">{ad.headline}</p>
          {ad.description && (
            <p className="text-[10px] text-zinc-500 truncate">{ad.description}</p>
          )}
          <button
            onClick={() => handleCopy(ad.headline, 'headline')}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-zinc-800/80"
            aria-label="Copiar headline"
          >
            {copiedField === 'headline' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
          </button>
        </div>
        <Button size="sm" className="shrink-0 text-xs">
          {ad.cta}
        </Button>
      </div>
    </Card>
  );
}
