'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  BarChart3,
  PieChart,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Funnel, Decision } from '@/types/database';

interface FunnelAnalyticsProps {
  funnels: Funnel[];
  decisions: Decision[];
  className?: string;
}

interface StatusCount {
  status: string;
  count: number;
  color: string;
  label: string;
}

const STATUS_COLORS: Record<string, { color: string; label: string }> = {
  draft: { color: '#71717a', label: 'Rascunho' },
  generating: { color: '#3b82f6', label: 'Gerando' },
  review: { color: '#f59e0b', label: 'Avaliar' },
  approved: { color: '#10b981', label: 'Aprovado' },
  adjusting: { color: '#8b5cf6', label: 'Ajustando' },
  executing: { color: '#06b6d4', label: 'Executando' },
  completed: { color: '#10b981', label: 'Concluído' },
  killed: { color: '#ef4444', label: 'Cancelado' },
};

function MiniBarChart({ data, maxValue }: { data: StatusCount[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((item, i) => {
        const height = maxValue > 0 ? (item.count / maxValue) * 100 : 0;
        return (
          <motion.div
            key={item.status}
            initial={{ height: 0 }}
            animate={{ height: `${height}%` }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
            className="flex-1 rounded-t-sm transition-all hover:opacity-80"
            style={{ backgroundColor: item.color, minHeight: item.count > 0 ? '8px' : '2px' }}
            title={`${item.label}: ${item.count}`}
          />
        );
      })}
    </div>
  );
}

function DonutChart({ data, total }: { data: StatusCount[]; total: number }) {
  let cumulativePercent = 0;
  
  return (
    <div className="relative w-32 h-32">
      <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
        {/* Background circle */}
        <circle
          cx="18"
          cy="18"
          r="15.9"
          fill="none"
          stroke="#27272a"
          strokeWidth="3"
        />
        {/* Data segments */}
        {data.map((item, i) => {
          const percent = total > 0 ? (item.count / total) * 100 : 0;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = -cumulativePercent;
          cumulativePercent += percent;
          
          return (
            <motion.circle
              key={item.status}
              cx="18"
              cy="18"
              r="15.9"
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
            />
          );
        })}
      </svg>
      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{total}</span>
        <span className="text-xs text-zinc-500">total</span>
      </div>
    </div>
  );
}

function MetricCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = 'emerald',
}: { 
  icon: any; 
  label: string; 
  value: number | string;
  trend?: { value: number; positive: boolean };
  color?: 'emerald' | 'amber' | 'red' | 'blue';
}) {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-400',
    red: 'bg-red-500/10 text-red-400',
    blue: 'bg-blue-500/10 text-blue-400',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-zinc-500">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-semibold text-white">{value}</p>
          {trend && (
            <span className={cn(
              'flex items-center text-xs',
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            )}>
              {trend.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FunnelAnalytics({ funnels, decisions, className }: FunnelAnalyticsProps) {
  const analytics = useMemo(() => {
    // Count by status
    const statusCounts: StatusCount[] = Object.entries(STATUS_COLORS).map(([status, config]) => ({
      status,
      count: funnels.filter(f => f.status === status).length,
      ...config,
    }));
    
    // Total and active
    const total = funnels.length;
    const active = funnels.filter(f => 
      !['completed', 'killed', 'draft'].includes(f.status)
    ).length;
    const approved = funnels.filter(f => f.status === 'approved').length;
    const killed = funnels.filter(f => f.status === 'killed').length;
    
    // Decision metrics
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const decisionsThisMonth = decisions.filter(d => {
      const date = d.createdAt?.toDate?.() || new Date(d.createdAt as any);
      return date >= thisMonth;
    }).length;
    
    const approvedDecisions = decisions.filter(d => d.type === 'approve').length;
    const adjustDecisions = decisions.filter(d => d.type === 'adjust').length;
    const killDecisions = decisions.filter(d => d.type === 'kill').length;
    
    // Approval rate
    const totalDecisions = approvedDecisions + adjustDecisions + killDecisions;
    const approvalRate = totalDecisions > 0 
      ? Math.round((approvedDecisions / totalDecisions) * 100) 
      : 0;
    
    // Objectives breakdown
    const objectives = ['leads', 'sales', 'calls', 'retention'];
    const objectiveCounts = objectives.map(obj => ({
      objective: obj,
      count: funnels.filter(f => f.context.objective === obj).length,
    }));
    
    return {
      statusCounts,
      total,
      active,
      approved,
      killed,
      decisionsThisMonth,
      approvalRate,
      objectiveCounts,
      maxStatusCount: Math.max(...statusCounts.map(s => s.count)),
    };
  }, [funnels, decisions]);

  if (funnels.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-emerald-400" />
        <h3 className="text-lg font-semibold text-white">Analytics</h3>
      </div>

      {/* Main metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-premium p-4"
        >
          <MetricCard
            icon={Target}
            label="Total de Funis"
            value={analytics.total}
            color="emerald"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-premium p-4"
        >
          <MetricCard
            icon={Zap}
            label="Funis Ativos"
            value={analytics.active}
            color="blue"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-premium p-4"
        >
          <MetricCard
            icon={CheckCircle2}
            label="Taxa de Aprovação"
            value={`${analytics.approvalRate}%`}
            trend={{ value: analytics.approvalRate, positive: analytics.approvalRate >= 50 }}
            color="emerald"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card-premium p-4"
        >
          <MetricCard
            icon={Clock}
            label="Decisões este mês"
            value={analytics.decisionsThisMonth}
            color="amber"
          />
        </motion.div>
      </div>

      {/* Charts row */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Status distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card-premium p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="h-4 w-4 text-zinc-500" />
            <h4 className="text-sm font-medium text-zinc-400">Distribuição por Status</h4>
          </div>
          
          <div className="flex items-center gap-6">
            <DonutChart 
              data={analytics.statusCounts.filter(s => s.count > 0)} 
              total={analytics.total} 
            />
            
            <div className="flex-1 space-y-2">
              {analytics.statusCounts.filter(s => s.count > 0).map((item) => (
                <div key={item.status} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-zinc-400">{item.label}</span>
                  </div>
                  <span className="font-medium text-white">{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Status bar chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card-premium p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-zinc-500" />
            <h4 className="text-sm font-medium text-zinc-400">Funis por Status</h4>
          </div>
          
          <MiniBarChart 
            data={analytics.statusCounts} 
            maxValue={analytics.maxStatusCount} 
          />
          
          <div className="flex justify-between mt-2 text-xs text-zinc-600">
            {analytics.statusCounts.slice(0, 4).map((item) => (
              <span key={item.status}>{item.label.slice(0, 3)}</span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Objectives breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card-premium p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-zinc-500" />
          <h4 className="text-sm font-medium text-zinc-400">Funis por Objetivo</h4>
        </div>
        
        <div className="grid grid-cols-4 gap-4">
          {analytics.objectiveCounts.map((item, i) => {
            const percent = analytics.total > 0 
              ? Math.round((item.count / analytics.total) * 100) 
              : 0;
            const labels: Record<string, { label: string; icon: string }> = {
              leads: { label: 'Leads', icon: '📧' },
              sales: { label: 'Vendas', icon: '💰' },
              calls: { label: 'Chamadas', icon: '📞' },
              retention: { label: 'Retenção', icon: '🔄' },
            };
            
            return (
              <motion.div
                key={item.objective}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                className="text-center p-3 rounded-lg bg-white/[0.02]"
              >
                <div className="text-2xl mb-1">{labels[item.objective]?.icon || '📊'}</div>
                <p className="text-lg font-semibold text-white">{item.count}</p>
                <p className="text-xs text-zinc-500">{labels[item.objective]?.label || item.objective}</p>
                <div className="mt-2 h-1 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percent}%` }}
                    transition={{ delay: 0.8 + i * 0.1, duration: 0.5 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

