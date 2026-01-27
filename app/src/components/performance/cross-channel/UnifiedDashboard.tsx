'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from "lucide-react";
import { CrossChannelMetricDoc } from "@/types/cross-channel";
import { OptimizationInsight } from "@/types/automation";

interface UnifiedDashboardProps {
  metrics: CrossChannelMetricDoc;
  insights: OptimizationInsight[];
  loading?: boolean;
}

const COLORS = {
  meta: '#1877F2',
  google: '#EA4335',
  tiktok: '#000000',
  other: '#6366f1'
};

export function UnifiedCrossChannelDashboard({ metrics, insights, loading }: UnifiedDashboardProps) {
  const pieData = Object.entries(metrics.channels).map(([platform, data]) => ({
    name: platform.toUpperCase(),
    value: data?.shareOfSpend || 0,
    color: COLORS[platform as keyof typeof COLORS] || COLORS.other
  }));

  const rankingData = Object.entries(metrics.channels)
    .map(([platform, data]) => ({
      name: platform.toUpperCase(),
      roas: data?.metrics.roas || 0,
      spend: data?.metrics.spend || 0,
      color: COLORS[platform as keyof typeof COLORS] || COLORS.other
    }))
    .sort((a, b) => b.roas - a.roas);

  return (
    <div className="space-y-8 animate-in-up">
      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Blended ROAS" 
          value={`${metrics.totals.blendedRoas.toFixed(2)}x`}
          icon={<Target className="w-4 h-4 text-purple-500" />}
          trend={+15.2}
        />
        <MetricCard 
          title="Total Spend" 
          value={metrics.totals.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={<DollarSign className="w-4 h-4 text-emerald-500" />}
        />
        <MetricCard 
          title="Blended CPA" 
          value={metrics.totals.blendedCpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={<Zap className="w-4 h-4 text-blue-500" />}
          trend={-8.4}
          inverseTrend
        />
        <MetricCard 
          title="Total Conversions" 
          value={metrics.totals.conversions.toString()}
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Channel Mix Chart */}
        <Card className="card-premium border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-400" />
              Mix de Canais (Spend Share)
            </CardTitle>
            <CardDescription>Distribuição de investimento por plataforma</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => `${(value * 100).toFixed(1)}%`}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Blended ROAS Ranking */}
        <Card className="card-premium border-white/5">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Ranking de Blended ROAS
            </CardTitle>
            <CardDescription>Eficiência por canal vs Investimento</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rankingData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="roas" radius={[0, 4, 4, 0]}>
                  {rankingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Optimization Insights Feed */}
      <Card className="card-premium border-white/5 overflow-hidden">
        <CardHeader className="bg-emerald-500/5 border-b border-white/5">
          <CardTitle className="text-lg font-bold flex items-center gap-2 text-emerald-400">
            <Zap className="w-5 h-5" />
            Insights de Otimização (AI)
          </CardTitle>
          <CardDescription className="text-emerald-400/60">Recomendações baseadas em ROI marginal e performance cross-channel</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {insights.map((insight) => (
              <div key={insight.id} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  insight.type === 'channel_scale' ? 'bg-emerald-500/10 text-emerald-400' : 
                  insight.type === 'budget_reallocation' ? 'bg-blue-500/10 text-blue-400' : 
                  'bg-orange-500/10 text-orange-400'
                }`}>
                  <Info className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white capitalize">
                      {insight.platform}: {insight.type.replace('_', ' ')}
                    </h4>
                    <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500">
                      Confiança: {(insight.confidence * 100).toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-zinc-400 leading-relaxed">{insight.reasoning}</p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="text-xs font-medium text-emerald-400">
                      Impacto: +{(insight.impact.suggestedChange * 100).toFixed(0)}% Budget
                    </div>
                    <div className="text-xs font-medium text-blue-400">
                      Expectativa: +{insight.impact.expectedProfitIncrease.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} Lucro
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  trend, 
  inverseTrend = false 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode;
  trend?: number;
  inverseTrend?: boolean;
}) {
  const isPositive = trend ? trend > 0 : false;
  const isGoodTrend = inverseTrend ? !isPositive : isPositive;

  return (
    <Card className="card-premium border-white/5">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{title}</p>
          <div className="p-2 rounded-lg bg-white/5">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black text-white font-mono">{value}</div>
          {trend !== undefined && (
            <div className={`flex items-center text-xs font-bold ${isGoodTrend ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
