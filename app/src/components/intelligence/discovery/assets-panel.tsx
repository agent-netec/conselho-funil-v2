/**
 * Assets Panel — painel de assets de inteligência com cards, skeleton e badges
 * Sprint 29: S29-FT-01 — Discovery Hub Assets
 */
'use client';

import { Search, Shield, Gift, Eye, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { IntelligenceAsset } from '@/types/intelligence';
import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';

interface AssetsPanelProps {
  brandId: string;
  assets: IntelligenceAsset[];
  isLoading: boolean;
  error?: string | null;
  onRefetch?: () => void;
}

// === Icon mapping por tipo ===
const TYPE_ICONS: Record<IntelligenceAsset['type'], typeof Search> = {
  audience_scan: Search,
  autopsy: Shield,
  offer: Gift,
  spy_dossier: Eye,
};

const TYPE_LABELS: Record<IntelligenceAsset['type'], string> = {
  audience_scan: 'Audience Scan',
  autopsy: 'Autopsia',
  offer: 'Oferta',
  spy_dossier: 'Spy Dossier',
};

const TYPE_COLORS: Record<IntelligenceAsset['type'], string> = {
  audience_scan: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  autopsy: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  offer: 'bg-green-500/20 text-green-400 border-green-500/30',
  spy_dossier: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const STATUS_BADGES: Record<IntelligenceAsset['status'], { label: string; className: string }> = {
  ready: { label: 'Pronto', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  processing: { label: 'Processando', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  error: { label: 'Erro', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function formatDate(ts: Timestamp | unknown): string {
  try {
    if (ts instanceof Timestamp) {
      return ts.toDate().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }
    return 'Data indisponível';
  } catch {
    return 'Data indisponível';
  }
}

function AssetCard({ asset }: { asset: IntelligenceAsset }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = TYPE_ICONS[asset.type] || Search;
  const typeLabel = TYPE_LABELS[asset.type] || asset.type;
  const typeColor = TYPE_COLORS[asset.type] || TYPE_COLORS.audience_scan;
  const statusBadge = STATUS_BADGES[asset.status] || STATUS_BADGES.ready;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const text = `${asset.name}\n${asset.summary}`;
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Copiado para o clipboard');
    }).catch(() => {
      toast.error('Erro ao copiar');
    });
  };

  return (
    <Card
      className={`bg-zinc-900/50 border-white/[0.05] hover:border-white/[0.12] transition-all duration-200 group cursor-pointer ${expanded ? 'lg:col-span-2 xl:col-span-3' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header: Ícone + Tipo + Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md border ${typeColor}`}>
              <Icon className="h-3.5 w-3.5" />
            </div>
            <Badge variant="outline" className={`text-[10px] ${typeColor}`}>
              {typeLabel}
            </Badge>
          </div>
          <Badge variant="outline" className={`text-[10px] ${statusBadge.className}`}>
            {statusBadge.label}
          </Badge>
        </div>

        {/* Nome */}
        <h3 className={`text-sm font-medium text-zinc-200 group-hover:text-white transition-colors ${expanded ? '' : 'line-clamp-1'}`}>
          {asset.name}
        </h3>

        {/* Resumo */}
        <p className={`text-xs text-zinc-500 ${expanded ? 'whitespace-pre-wrap' : 'line-clamp-2'}`}>
          {asset.summary}
        </p>

        {/* Expanded: metadata */}
        {expanded && asset.metadata && Object.keys(asset.metadata).length > 0 && (
          <div className="pt-2 border-t border-white/[0.05] space-y-2">
            {Object.entries(asset.metadata).map(([key, value]) => {
              if (value === null || value === undefined) return null;
              const displayValue = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
              return (
                <div key={key}>
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold">{key}</span>
                  <p className={`text-xs text-zinc-400 mt-0.5 ${typeof value === 'object' ? 'font-mono text-[10px] whitespace-pre-wrap bg-zinc-950 p-2 rounded' : ''}`}>
                    {displayValue}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer: Score + Data + Actions */}
        <div className="flex items-center justify-between pt-1 border-t border-white/[0.03]">
          <div className="flex items-center gap-2">
            {asset.score !== undefined && (
              <span className="text-xs font-mono text-zinc-400">
                {typeof asset.score === 'number' && asset.score <= 1
                  ? `${(asset.score * 100).toFixed(0)}%`
                  : `${asset.score}/10`}
              </span>
            )}
            <span className="text-[10px] text-zinc-600">
              {formatDate(asset.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-600">
              {expanded ? 'Clique para fechar' : 'Clique para expandir'}
            </span>
            <button
              onClick={handleCopy}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5"
              title="Copiar para clipboard"
            >
              <Copy className="h-3 w-3 text-zinc-500" />
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card className="bg-zinc-900/50 border-white/[0.05]">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-md" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-4 w-14 rounded-full" />
        </div>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

export function AssetsPanel({ brandId, assets, isLoading, error, onRefetch }: AssetsPanelProps) {
  const [filterType, setFilterType] = useState<IntelligenceAsset['type'] | 'all'>('all');

  const filteredAssets = filterType === 'all'
    ? assets
    : assets.filter(a => a.type === filterType);

  // Loading state
  if (isLoading) {
    return (
      <Card className="bg-zinc-900/30 border-white/[0.05]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-zinc-200">
            Assets de Inteligência
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-zinc-900/30 border-red-500/20">
        <CardContent className="p-6 text-center space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          {onRefetch && (
            <Button variant="outline" size="sm" onClick={onRefetch} className="gap-2">
              <RefreshCw className="h-3 w-3" />
              Tentar novamente
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (assets.length === 0) {
    return (
      <Card className="bg-zinc-900/30 border-white/[0.05]">
        <CardContent className="p-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-zinc-800/50 border border-white/[0.05]">
              <Search className="h-6 w-6 text-zinc-500" />
            </div>
          </div>
          <div>
            <p className="text-sm text-zinc-400 font-medium">
              Nenhum asset de inteligência encontrado
            </p>
            <p className="text-xs text-zinc-600 mt-1">
              Execute scans de audiência, autópsias de funil ou crie ofertas para preencher este painel.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Normal state with assets
  const typeCounts = assets.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <Card className="bg-zinc-900/30 border-white/[0.05]">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-zinc-200">
            Assets de Inteligência
            <span className="text-xs font-normal text-zinc-500 ml-2">
              ({assets.length})
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {onRefetch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefetch}
                className="h-7 w-7 p-0 text-zinc-500 hover:text-zinc-300"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        {/* Filtros por tipo */}
        <div className="flex gap-1.5 mt-2 flex-wrap">
          <button
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 text-[10px] rounded-full border transition-colors ${
              filterType === 'all'
                ? 'bg-white/10 border-white/20 text-zinc-200'
                : 'border-white/[0.05] text-zinc-500 hover:border-white/10'
            }`}
          >
            Todos ({assets.length})
          </button>
          {(Object.keys(TYPE_LABELS) as IntelligenceAsset['type'][]).map(type => {
            const count = typeCounts[type] || 0;
            if (count === 0) return null;
            return (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 text-[10px] rounded-full border transition-colors ${
                  filterType === type
                    ? 'bg-white/10 border-white/20 text-zinc-200'
                    : 'border-white/[0.05] text-zinc-500 hover:border-white/10'
                }`}
              >
                {TYPE_LABELS[type]} ({count})
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map(asset => (
            <AssetCard key={asset.id} asset={asset} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
