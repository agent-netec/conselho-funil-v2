'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Target, 
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { UnifiedAdsMetrics, AdPlatform } from "@/types/performance";

interface PlatformMetric extends UnifiedAdsMetrics {
  platform: AdPlatform;
}

interface WarRoomDashboardProps {
  blended: UnifiedAdsMetrics;
  platforms: PlatformMetric[];
  loading?: boolean;
}

export function WarRoomDashboard({ blended, platforms, loading }: WarRoomDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Blended Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard 
          title="Blended ROAS" 
          value={blended.roas.toFixed(2)} 
          suffix="x"
          icon={<Target className="w-4 h-4 text-purple-500" />}
          trend={+12.5}
        />
        <MetricCard 
          title="Total Spend" 
          value={blended.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<DollarSign className="w-4 h-4 text-green-500" />}
        />
        <MetricCard 
          title="Blended CAC" 
          value={blended.cac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
          trend={-5.2}
          inverseTrend
        />
        <MetricCard 
          title="Total Revenue" 
          value={blended.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
        />
      </div>

      {/* Platform Comparison Table */}
      <Card className="bg-zinc-900/40 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-lg text-white font-black uppercase tracking-widest">Performance por Canal</CardTitle>
          <CardDescription className="text-zinc-500">Comparativo detalhado entre Meta, Google e TikTok.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b border-zinc-800">
                <tr className="border-b border-zinc-800 transition-colors hover:bg-zinc-800/50">
                  <th className="h-12 px-4 text-left align-middle font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Canal</th>
                  <th className="h-12 px-4 text-right align-middle font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Spend</th>
                  <th className="h-12 px-4 text-right align-middle font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Revenue</th>
                  <th className="h-12 px-4 text-right align-middle font-bold text-zinc-500 uppercase text-[10px] tracking-widest">ROAS</th>
                  <th className="h-12 px-4 text-right align-middle font-bold text-zinc-500 uppercase text-[10px] tracking-widest">CAC</th>
                  <th className="h-12 px-4 text-right align-middle font-bold text-zinc-500 uppercase text-[10px] tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {platforms.map((p) => (
                  <tr key={p.platform} className="border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30">
                    <td className="p-4 align-middle font-black capitalize text-white">{p.platform}</td>
                    <td className="p-4 align-middle text-right text-zinc-300">{p.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-4 align-middle text-right text-zinc-300">{p.revenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-4 align-middle text-right font-black text-white">{p.roas.toFixed(2)}x</td>
                    <td className="p-4 align-middle text-right text-zinc-300">{p.cac.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-4 align-middle text-right">
                      <Badge variant={p.roas >= blended.roas ? "default" : "secondary"} className={`text-[10px] font-bold uppercase ${p.roas >= blended.roas ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border-zinc-700'}`}>
                        {p.roas >= blended.roas ? "Outperforming" : "Under"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  suffix = "", 
  icon, 
  trend, 
  inverseTrend = false 
}: { 
  title: string; 
  value: string; 
  suffix?: string;
  icon: React.ReactNode;
  trend?: number;
  inverseTrend?: boolean;
}) {
  const isPositive = trend ? trend > 0 : false;
  const showTrend = trend !== undefined;
  
  // For CPA, down is good (inverseTrend)
  const isGoodTrend = inverseTrend ? !isPositive : isPositive;

  return (
    <Card className="bg-zinc-900/40 border-zinc-800 overflow-hidden group">
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{title}</p>
          <div className="p-2 bg-zinc-800/50 rounded-lg group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline justify-between mt-2">
          <div className="text-3xl font-black text-white tracking-tighter">{value}{suffix}</div>
          {showTrend && (
            <div className={`flex items-center text-[10px] font-black px-2 py-0.5 rounded-full ${isGoodTrend ? 'text-emerald-500 bg-emerald-500/10' : 'text-rose-500 bg-rose-500/10'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
