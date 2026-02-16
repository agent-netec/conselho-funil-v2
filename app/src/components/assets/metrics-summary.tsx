'use client';

import { motion } from 'framer-motion';
import {
  Target,
  ImageIcon,
  FileText,
  Zap,
  Award,
  RefreshCw
} from 'lucide-react';
import { MetricsSummary } from '@/lib/hooks/use-asset-metrics';

interface RecentAsset {
  id: string;
  name: string;
  status: string;
  processingError?: string;
}

interface SummaryProps {
  summary: MetricsSummary | null;
  isLoading: boolean;
  recentAssets?: RecentAsset[];
  onReprocess?: (assetId: string) => void;
}

export function AssetMetricsSummary({ summary, isLoading, recentAssets, onReprocess }: SummaryProps) {
  const cards = [
    {
      title: "Total de Ativos",
      value: isLoading ? '—' : (summary?.total || 0),
      subtitle: "Vetorizados no Pinecone",
      icon: Target,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      delay: 0.1
    },
    {
      title: "Análises Visuais",
      value: isLoading ? '—' : (summary?.visualCount || 0),
      subtitle: "Criativos analisados",
      icon: ImageIcon,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      delay: 0.15
    },
    {
      title: "Base de Conhecimento",
      value: isLoading ? '—' : (summary?.knowledgeCount || 0),
      subtitle: "Documentos e brand books",
      icon: FileText,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      delay: 0.2
    },
    {
      title: "Score Visual Médio",
      value: isLoading ? '—' : (summary?.avgVisualScore || 0),
      subtitle: "Média das heurísticas",
      icon: Award,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      delay: 0.25
    }
  ];

  return (
    <div className="space-y-6 mb-8">
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: card.delay }}
            className="card-premium card-hover p-5"
          >
            <div className="flex items-start justify-between">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
            </div>
            <div className="mt-4">
              <p className="stat-value">{card.value}</p>
              <p className="mt-1 text-xs text-zinc-500">{card.subtitle}</p>
            </div>
            <p className="mt-3 text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
              {card.title}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Recently Added Assets */}
      {recentAssets && recentAssets.length > 0 && (
        <div className="card-premium p-5">
          <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Recentemente Adicionados</h3>
          <div className="space-y-2">
            {recentAssets.slice(0, 5).map((asset) => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-4 w-4 text-zinc-500 shrink-0" />
                  <span className="text-sm text-white truncate">{asset.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {asset.status === 'processing' && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                      <span className="text-[10px] text-zinc-500">Processando</span>
                    </div>
                  )}
                  {asset.status === 'ready' && (
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">Pronto</span>
                  )}
                  {asset.status === 'error' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-red-500 uppercase">Erro</span>
                      {onReprocess && (
                        <button
                          onClick={() => onReprocess(asset.id)}
                          className="flex items-center gap-1 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-[10px] text-zinc-300 transition-colors"
                        >
                          <RefreshCw className="h-3 w-3" />
                          Reprocessar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
