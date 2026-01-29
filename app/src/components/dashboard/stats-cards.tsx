'use client';

import { motion } from 'framer-motion';
import { 
  Target, 
  BarChart3, 
  CheckCircle2, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown,
  Activity,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: { value: string; positive: boolean };
  delay?: number;
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon, 
  trend, 
  delay = 0 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="card-premium card-hover p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <Icon className="h-5 w-5 text-emerald-400" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${
            trend.positive ? 'text-emerald-400' : 'text-red-400'
          }`}>
            {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend.value}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="stat-value">{value}</p>
        <p className="mt-1 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <p className="mt-3 text-xs text-zinc-600 font-medium uppercase tracking-wider">{title}</p>
    </motion.div>
  );
}

function MiniChart({ status }: { status: string }) {
  // Simple randomized path for sparkline effect based on status
  const points = status === 'success' 
    ? "0,20 10,15 20,18 30,10 40,12 50,5" 
    : status === 'danger' 
    ? "0,5 10,12 20,10 30,18 40,15 50,20"
    : "0,15 10,13 20,16 30,14 40,15 50,15";
    
  const color = status === 'success' ? '#10b981' : status === 'danger' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#71717a';

  return (
    <svg width="60" height="25" viewBox="0 0 50 25" className="opacity-60">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function BenchmarkCard({ 
  metric, 
  value, 
  benchmark, 
  status, 
  delay = 0 
}: { 
  metric: string; 
  value: string; 
  benchmark: string; 
  status: 'success' | 'warning' | 'danger' | 'neutral';
  delay?: number;
}) {
  const statusColors = {
    success: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    danger: 'text-red-400 bg-red-500/10 border-red-500/20',
    neutral: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20'
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      className="card-premium p-4 border border-white/[0.04] bg-zinc-900/40"
    >
      <div className="flex justify-between items-start mb-3">
        <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", statusColors[status])}>
          {status}
        </div>
        <MiniChart status={status} />
      </div>
      
      <div className="space-y-1">
        <h4 className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wider">{metric}</h4>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-bold text-white">{value}</span>
          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
            <ArrowRight className="h-3 w-3" />
            <span>2026: {benchmark}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function StatsCards({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  const mainStats = [
    {
      title: "Funis Ativos",
      value: isLoading ? '—' : stats.activeFunnels,
      subtitle: stats.activeFunnels === 0 ? 'Crie seu primeiro' : 'Em andamento',
      icon: Target,
      delay: 0.1
    },
    {
      title: "Avaliações",
      value: isLoading ? '—' : stats.pendingEvaluations,
      subtitle: stats.pendingEvaluations === 0 ? 'Nenhuma pendente' : 'Aguardando',
      icon: BarChart3,
      trend: stats.pendingEvaluations > 0 ? { value: `${stats.pendingEvaluations} pendente${stats.pendingEvaluations > 1 ? 's' : ''}`, positive: false } : undefined,
      delay: 0.15
    },
    {
      title: "Decisões",
      value: isLoading ? '—' : stats.decisionsThisMonth,
      subtitle: "Este mês",
      icon: CheckCircle2,
      delay: 0.2
    },
    {
      title: "Conversas",
      value: isLoading ? '—' : stats.totalConversations,
      subtitle: "Com o Conselho",
      icon: MessageSquare,
      delay: 0.25
    }
  ];

  return (
    <div className="space-y-6 mb-10">
      {/* Primary Stats Grid */}
      <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {mainStats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Benchmarks Section */}
      {stats.performance_benchmarks && stats.performance_benchmarks.length > 0 && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Benchmarks de Mercado 2026</h3>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {stats.performance_benchmarks.map((bench: any, i: number) => (
              <BenchmarkCard 
                key={i}
                metric={bench.metric}
                value={bench.value}
                benchmark={bench.benchmark_2026}
                status={bench.status}
                delay={0.4 + (i * 0.1)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
