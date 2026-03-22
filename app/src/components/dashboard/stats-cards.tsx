'use client';

import {
  Target,
  BarChart3,
  CheckCircle2,
  MessageSquare,
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

      {/* Benchmarks removed — was using fake sparklines with hardcoded SVG points */}
    </div>
  );
}
