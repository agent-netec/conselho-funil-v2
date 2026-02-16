'use client';

/**
 * Sprint O — O-4.2: TrendPanel component
 * Cards with tags, growth indicators, and source links.
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  TrendingUp, ArrowUpRight, ExternalLink, Loader2, Search,
  Flame, Zap, Minus,
} from 'lucide-react';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { getAuthHeaders } from '@/lib/utils/auth-headers';
import { notify } from '@/lib/stores/notification-store';
import { cn } from '@/lib/utils';

interface TrendItem {
  title: string;
  description: string;
  growth: string;
  growthPercent: number;
  tags: string[];
  sourceUrl: string;
}

const GROWTH_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  alto: { icon: Flame, color: 'text-red-400', label: 'Alto' },
  médio: { icon: Zap, color: 'text-amber-400', label: 'Médio' },
  baixo: { icon: Minus, color: 'text-zinc-400', label: 'Baixo' },
};

export function TrendPanel() {
  const activeBrand = useActiveBrand();
  const [loading, setLoading] = useState(false);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [vertical, setVertical] = useState('');
  const [platform, setPlatform] = useState('Instagram');

  const handleSearch = async () => {
    if (!activeBrand?.id) {
      notify.error('Selecione uma marca primeiro.');
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/social/trends', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          platform,
          vertical: vertical || activeBrand.vertical || 'marketing digital',
        }),
      });
      if (!res.ok) throw new Error('Falha na pesquisa');
      const data = await res.json();
      setTrends(data.data?.trends || []);
      notify.success(`${data.data?.trends?.length || 0} tendências encontradas!`);
    } catch {
      notify.error('Erro na pesquisa de tendências.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 bg-zinc-900/50 border-white/[0.04] space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-5 w-5 text-rose-400" />
        <h3 className="text-sm font-bold text-zinc-100">Tendências Sociais</h3>
      </div>

      <div className="flex gap-2">
        <Input
          value={vertical}
          onChange={(e) => setVertical(e.target.value)}
          placeholder="Vertical (ex: marketing digital, fitness, finanças)"
          className="bg-zinc-800/50 border-zinc-700 text-xs"
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 text-xs text-zinc-300"
        >
          <option>Instagram</option>
          <option>TikTok</option>
          <option>YouTube</option>
          <option>LinkedIn</option>
          <option>Twitter/X</option>
        </select>
        <Button onClick={handleSearch} disabled={loading} size="sm" className="bg-rose-500 hover:bg-rose-600 text-white">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
        </Button>
      </div>

      {trends.length > 0 && (
        <div className="grid gap-3">
          {trends.map((trend, i) => {
            const gc = GROWTH_CONFIG[trend.growth] || GROWTH_CONFIG.médio;
            const GrowthIcon = gc.icon;
            return (
              <div
                key={i}
                className="flex items-start gap-3 p-3 border border-zinc-800 rounded-lg bg-zinc-900/30 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-zinc-100 truncate">{trend.title}</span>
                    {trend.sourceUrl && (
                      <a href={trend.sourceUrl} target="_blank" rel="noreferrer" className="text-zinc-600 hover:text-rose-400 shrink-0">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">{trend.description}</p>
                  {trend.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {trend.tags.map((tag, j) => (
                        <Badge key={j} variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className={cn('flex items-center gap-1 shrink-0', gc.color)}>
                  <GrowthIcon className="h-4 w-4" />
                  <span className="text-xs font-bold">
                    {trend.growthPercent > 0 ? `+${trend.growthPercent}%` : gc.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {trends.length === 0 && !loading && (
        <div className="text-center py-6 text-zinc-500 text-xs">
          Pesquise tendências para sua vertical e plataforma.
        </div>
      )}
    </Card>
  );
}
