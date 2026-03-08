'use client';

import {
  Target,
  BarChart3,
  CheckCircle2,
  MessageSquare,
  Activity,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useCountUp } from '@/lib/hooks/use-count-up';

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

interface KpiCardProps {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  trend?: { label: string; positive: boolean };
  isLoading?: boolean;
}

function KpiCard({ title, value, subtitle, icon: Icon, trend, isLoading }: KpiCardProps) {
  const animated = useCountUp(isLoading ? 0 : value);
  const hasValue = !isLoading && value > 0;

  return (
    <Card
      className={cn(
        'border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-xl shadow-none transition-colors',
        hasValue && 'border-l-2 border-l-[#E6B447]/40'
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-[#AB8648]">
            {title}
          </span>
          <Icon className="h-4 w-4 text-[#3D3428]" />
        </div>

        {isLoading ? (
          <Skeleton className="h-9 w-16 bg-[#241F19]" />
        ) : (
          <span
            className="block font-mono text-3xl font-bold tabular-nums text-[#F5E8CE]"
            style={{
              textShadow: hasValue
                ? '0 0 24px rgba(230,180,71,0.25), 0 0 8px rgba(230,180,71,0.15)'
                : 'none',
            }}
          >
            {animated}
          </span>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-[#6B5D4A]">{subtitle}</span>
          {trend && (
            <span
              className={cn(
                'text-[10px] font-mono font-medium',
                trend.positive ? 'text-[#7A9B5A]' : 'text-[#C45B3A]'
              )}
            >
              {trend.label}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Benchmark Card (sparkline + metric)
// ---------------------------------------------------------------------------

function MiniChart({ status }: { status: string }) {
  const points =
    status === 'success'
      ? '0,20 10,15 20,18 30,10 40,12 50,5'
      : status === 'danger'
        ? '0,5 10,12 20,10 30,18 40,15 50,20'
        : '0,15 10,13 20,16 30,14 40,15 50,15';

  const color =
    status === 'success'
      ? '#E6B447'
      : status === 'danger'
        ? '#C45B3A'
        : status === 'warning'
          ? '#E6B447'
          : '#6B5D4A';

  return (
    <svg width="50" height="20" viewBox="0 0 50 25" className="opacity-50">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
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
}: {
  metric: string;
  value: string;
  benchmark: string;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}) {
  const statusColor = {
    success: 'text-[#E6B447] border-[#E6B447]/20',
    warning: 'text-amber-400 border-amber-500/20',
    danger: 'text-[#C45B3A] border-[#C45B3A]/20',
    neutral: 'text-[#6B5D4A] border-[#3D3428]',
  }[status];

  return (
    <Card className="border-[#2A2318] bg-[#1A1612] py-0 gap-0 rounded-lg shadow-none">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <span
            className={cn(
              'font-mono text-[9px] font-bold uppercase tracking-wider border rounded px-1.5 py-0.5',
              statusColor
            )}
          >
            {status}
          </span>
          <MiniChart status={status} />
        </div>
        <p className="font-mono text-[10px] text-[#6B5D4A] uppercase tracking-wider mb-1">
          {metric}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-[#F5E8CE] font-mono tabular-nums">{value}</span>
          <span className="text-[10px] text-[#6B5D4A] flex items-center gap-1">
            <ArrowRight className="h-2.5 w-2.5" />
            2026: {benchmark}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// StatsCards (exported)
// ---------------------------------------------------------------------------

export function StatsCards({ stats, isLoading }: { stats: any; isLoading: boolean }) {
  const kpis: KpiCardProps[] = [
    {
      title: 'Funis Ativos',
      value: isLoading ? 0 : (stats?.activeFunnels ?? 0),
      subtitle: stats?.activeFunnels === 0 ? 'Crie seu primeiro' : 'Em andamento',
      icon: Target,
      isLoading,
    },
    {
      title: 'Avaliacoes',
      value: isLoading ? 0 : (stats?.pendingEvaluations ?? 0),
      subtitle: stats?.pendingEvaluations === 0 ? 'Nenhuma pendente' : 'Aguardando',
      icon: BarChart3,
      trend:
        stats?.pendingEvaluations > 0
          ? {
              label: `${stats.pendingEvaluations} pendente${stats.pendingEvaluations > 1 ? 's' : ''}`,
              positive: false,
            }
          : undefined,
      isLoading,
    },
    {
      title: 'Decisoes',
      value: isLoading ? 0 : (stats?.decisionsThisMonth ?? 0),
      subtitle: 'Este mes',
      icon: CheckCircle2,
      isLoading,
    },
    {
      title: 'Conversas',
      value: isLoading ? 0 : (stats?.totalConversations ?? 0),
      subtitle: 'Com o MKTHONEY',
      icon: MessageSquare,
      isLoading,
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Primary KPI Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.title} {...kpi} />
        ))}
      </div>

      {/* Benchmarks Section */}
      {stats?.performance_benchmarks?.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-3.5 w-3.5 text-[#AB8648]" />
            <span className="font-mono text-[10px] font-bold text-[#AB8648] uppercase tracking-[0.15em]">
              Benchmarks 2026
            </span>
          </div>
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {stats.performance_benchmarks.map((bench: any, i: number) => (
              <BenchmarkCard
                key={i}
                metric={bench.metric}
                value={bench.value}
                benchmark={bench.benchmark_2026}
                status={bench.status}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
