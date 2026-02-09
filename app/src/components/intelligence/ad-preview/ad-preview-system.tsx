'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MetaFeedCard } from './meta-feed-card';
import { MetaStoriesCard } from './meta-stories-card';
import { GoogleSearchCard } from './google-search-card';
import { BrandVoiceBadge } from './brand-voice-badge';
import type { GeneratedAd, AdFormat } from '@/types/creative-ads';

interface AdPreviewSystemProps {
  ads: GeneratedAd[];
  brandName?: string;
  loading?: boolean;
  className?: string;
}

/** Agrupa ads por formato */
function groupByFormat(ads: GeneratedAd[]): Record<AdFormat, GeneratedAd[]> {
  return ads.reduce((acc, ad) => {
    if (!acc[ad.format]) acc[ad.format] = [];
    acc[ad.format].push(ad);
    return acc;
  }, {} as Record<AdFormat, GeneratedAd[]>);
}

const FORMAT_LABELS: Record<AdFormat, string> = {
  meta_feed: 'Meta Feed',
  meta_stories: 'Meta Stories',
  google_search: 'Google Search',
};

export function AdPreviewSystem({ ads, brandName, loading, className }: AdPreviewSystemProps) {
  const [variationIndex, setVariationIndex] = useState<Record<string, number>>({});
  const grouped = groupByFormat(ads);
  const formats = Object.keys(grouped) as AdFormat[];

  const getIndex = (format: string) => variationIndex[format] ?? 0;
  const setIndex = (format: string, idx: number) =>
    setVariationIndex(prev => ({ ...prev, [format]: idx }));

  if (loading) {
    return (
      <Card className={cn('border-zinc-800 bg-zinc-900/60', className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-purple-400" />
            Gerando Anúncios...
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (ads.length === 0) return null;

  const defaultTab = formats[0] || 'meta_feed';

  return (
    <Card className={cn('border-zinc-800 bg-zinc-900/60', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-purple-400" />
          Preview de Anúncios
          <span className="text-xs text-zinc-500 font-normal ml-auto">
            {ads.length} variações geradas
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            {formats.map(format => (
              <TabsTrigger key={format} value={format}>
                {FORMAT_LABELS[format]}
                <span className="ml-1 text-[10px] text-zinc-500">
                  ({grouped[format].length})
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          {formats.map(format => {
            const formatAds = grouped[format];
            const currentIdx = getIndex(format);
            const currentAd = formatAds[currentIdx];
            if (!currentAd) return null;

            return (
              <TabsContent key={format} value={format} className="mt-4">
                {/* Variation selector */}
                {formatAds.length > 1 && (
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={currentIdx === 0}
                      onClick={() => setIndex(format, currentIdx - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {formatAds.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setIndex(format, i)}
                          className={cn(
                            'h-2 w-2 rounded-full transition-all',
                            i === currentIdx
                              ? 'bg-purple-400 w-4'
                              : 'bg-zinc-600 hover:bg-zinc-500'
                          )}
                          aria-label={`Variação ${i + 1}`}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      disabled={currentIdx === formatAds.length - 1}
                      onClick={() => setIndex(format, currentIdx + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Badges row */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-[10px] font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                    CPS {currentAd.estimatedCPS}
                  </span>
                  <BrandVoiceBadge
                    toneMatch={currentAd.brandVoice.toneMatch}
                    passed={currentAd.brandVoice.passed}
                  />
                  <span className="text-[10px] text-purple-400 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20">
                    {currentAd.framework}
                  </span>
                  <span className="text-[10px] text-zinc-500 ml-auto">
                    Variação {currentIdx + 1}/{formatAds.length}
                  </span>
                </div>

                {/* Preview Card */}
                <div className="flex justify-center">
                  {format === 'meta_feed' && currentAd.content.type === 'meta_feed' && (
                    <MetaFeedCard
                      ad={currentAd.content}
                      brandName={brandName}
                      estimatedCPS={currentAd.estimatedCPS}
                    />
                  )}
                  {format === 'meta_stories' && currentAd.content.type === 'meta_stories' && (
                    <MetaStoriesCard
                      ad={currentAd.content}
                      brandName={brandName}
                      estimatedCPS={currentAd.estimatedCPS}
                    />
                  )}
                  {format === 'google_search' && currentAd.content.type === 'google_search' && (
                    <GoogleSearchCard
                      ad={currentAd.content}
                      estimatedCPS={currentAd.estimatedCPS}
                    />
                  )}
                </div>

                {/* Framework explanation */}
                {currentAd.frameworkExplanation && (
                  <p className="mt-4 text-xs text-zinc-500 italic text-center max-w-md mx-auto">
                    {currentAd.frameworkExplanation}
                  </p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
