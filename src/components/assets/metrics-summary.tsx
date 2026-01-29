'use client';

import { motion } from 'framer-motion';
import { 
  Target, 
  ImageIcon, 
  FileText, 
  Zap,
  TrendingUp,
  Award
} from 'lucide-react';
import { MetricsSummary } from '@/lib/hooks/use-asset-metrics';

interface SummaryProps {
  summary: MetricsSummary | null;
  isLoading: boolean;
}

export function AssetMetricsSummary({ summary, isLoading }: SummaryProps) {
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
      trend: { value: "+2.4%", positive: true },
      delay: 0.25
    }
  ];

  return (
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-8">
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
            {card.trend && (
              <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-tighter">
                <TrendingUp className="h-3 w-3" />
                {card.trend.value}
              </div>
            )}
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
  );
}
