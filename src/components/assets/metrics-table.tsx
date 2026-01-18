'use client';

import { motion } from 'framer-motion';
import { 
  BarChart3, 
  ExternalLink, 
  Eye, 
  FileText, 
  ImageIcon, 
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { AssetMetric } from '@/lib/hooks/use-asset-metrics';
import { cn } from '@/lib/utils';

interface AssetMetricsTableProps {
  assets: AssetMetric[];
  isLoading: boolean;
  viewMode?: 'list' | 'grid';
}

export function AssetMetricsTable({ assets, isLoading, viewMode = 'list' }: AssetMetricsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-lg bg-zinc-800/50" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800/50">
          <AlertCircle className="h-6 w-6 text-zinc-500" />
        </div>
        <h3 className="mt-4 text-sm font-medium text-white">Nenhum ativo encontrado</h3>
        <p className="mt-1 text-xs text-zinc-500 max-w-[200px]">
          Analise seus primeiros criativos ou suba brand books para ver as métricas.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card Layout (Always visible on small screens if not in grid mode, or just use grid) */}
      <div className={cn(
        "grid grid-cols-1 gap-3 md:hidden",
        viewMode === 'grid' && "hidden" // If already in grid, don't double show
      )}>
        {assets.map((asset, i) => (
          <motion.div
            key={asset.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-xl bg-zinc-900/50 border border-white/[0.05]"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg border",
                  asset.namespace === 'visual' 
                    ? "bg-purple-500/10 border-purple-500/20" 
                    : "bg-blue-500/10 border-blue-500/20"
                )}>
                  {asset.namespace === 'visual' ? (
                    <ImageIcon className="h-5 w-5 text-purple-400" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white line-clamp-1">{asset.name || asset.assetType}</h4>
                  <p className="text-[10px] text-zinc-500 uppercase">{asset.assetType} • {new Date(asset.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <span className={cn(
                  "text-xs font-bold px-2 py-0.5 rounded-full",
                  asset.score >= 80 ? "text-emerald-400 bg-emerald-500/10" : asset.score >= 50 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"
                )}>
                  {asset.score}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-3 border-t border-white/[0.05]">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">CTR</p>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-sm font-semibold text-zinc-200">{asset.metrics.ctr}%</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1">Conversão</p>
                <span className="text-sm font-semibold text-zinc-200">{asset.metrics.conversion}%</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-white/[0.05]">
              <button className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-zinc-800 text-xs font-medium text-zinc-300">
                <Eye className="h-3.5 w-3.5" />
                Visualizar
              </button>
              {asset.imageUri && (
                <a 
                  href={asset.imageUri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Grid View (Desktop & Tablet) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
          {assets.map((asset, i) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="group relative flex flex-col rounded-2xl border border-white/[0.05] bg-zinc-900/40 hover:bg-zinc-900/60 hover:border-white/[0.1] transition-all overflow-hidden shadow-sm"
            >
              {/* Asset Header/Icon */}
              <div className="p-4 flex items-start justify-between">
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl border shadow-inner",
                  asset.namespace === 'visual' 
                    ? "bg-purple-500/10 border-purple-500/20" 
                    : "bg-blue-500/10 border-blue-500/20"
                )}>
                  {asset.namespace === 'visual' ? (
                    <ImageIcon className="h-5 w-5 text-purple-400" />
                  ) : (
                    <FileText className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div className="flex flex-col items-end">
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                    asset.score >= 80 ? "text-emerald-400 bg-emerald-500/10" : asset.score >= 50 ? "text-amber-400 bg-amber-500/10" : "text-red-400 bg-red-500/10"
                  )}>
                    Score {asset.score}
                  </span>
                </div>
              </div>

              {/* Asset Info */}
              <div className="px-4 pb-4 flex-1">
                <h4 className="text-sm font-bold text-white line-clamp-2 min-h-[40px] leading-tight mb-1 group-hover:text-emerald-400 transition-colors">
                  {asset.name || asset.assetType}
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase tracking-tight">
                  {asset.assetType} • {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 border-t border-white/[0.05] bg-white/[0.01]">
                <div className="p-3 border-r border-white/[0.05] text-center">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">CTR</p>
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="text-xs font-bold text-zinc-200">{asset.metrics.ctr}%</span>
                  </div>
                </div>
                <div className="p-3 text-center">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold mb-1">Conv.</p>
                  <span className="text-xs font-bold text-zinc-200">{asset.metrics.conversion}%</span>
                </div>
              </div>

              {/* Action Overlay */}
              <div className="p-2 bg-zinc-950/50 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[10px] font-bold text-zinc-300 flex items-center justify-center gap-1.5 transition-all">
                  <Eye className="h-3.5 w-3.5" /> Detalhes
                </button>
                {asset.imageUri && (
                  <a 
                    href={asset.imageUri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="h-8 w-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-all"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* List View (Desktop) */}
      {viewMode === 'list' && (
        <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-zinc-400">
          <thead className="text-[10px] uppercase tracking-widest text-zinc-500 border-b border-white/[0.05]">
            <tr>
              <th className="px-4 py-3 font-semibold">Ativo</th>
              <th className="px-4 py-3 font-semibold text-center">Tipo</th>
              <th className="px-4 py-3 font-semibold text-center">Score</th>
              <th className="px-4 py-3 font-semibold text-center">CTR</th>
              <th className="px-4 py-3 font-semibold text-center">Conversão</th>
              <th className="px-4 py-3 font-semibold text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {assets.map((asset, i) => (
              <motion.tr
                key={asset.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group hover:bg-white/[0.02] transition-colors"
              >
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg border",
                      asset.namespace === 'visual' 
                        ? "bg-purple-500/10 border-purple-500/20" 
                        : "bg-blue-500/10 border-blue-500/20"
                    )}>
                      {asset.namespace === 'visual' ? (
                        <ImageIcon className="h-4 w-4 text-purple-400" />
                      ) : (
                        <FileText className="h-4 w-4 text-blue-400" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-white line-clamp-1 max-w-[200px]">
                        {asset.name || asset.assetType}
                      </span>
                      <span className="text-[10px] text-zinc-500 uppercase">
                        {new Date(asset.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400 border border-white/[0.05]">
                    {asset.assetType}
                  </span>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-1.5 w-12 rounded-full bg-zinc-800 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          asset.score >= 80 ? "bg-emerald-500" : asset.score >= 50 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${asset.score}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-white">{asset.score}</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="font-medium text-zinc-300">{asset.metrics.ctr}%</span>
                  </div>
                </td>
                <td className="px-4 py-4 text-center font-medium text-zinc-300">
                  {asset.metrics.conversion}%
                </td>
                <td className="px-4 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    {asset.imageUri && (
                      <a 
                        href={asset.imageUri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
