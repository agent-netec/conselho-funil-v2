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
          title="Blended CPA" 
          value={blended.cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<BarChart3 className="w-4 h-4 text-blue-500" />}
          trend={-5.2}
          inverseTrend
        />
        <MetricCard 
          title="Total Conversions" 
          value={blended.conversions.toString()} 
          icon={<TrendingUp className="w-4 h-4 text-orange-500" />}
        />
      </div>

      {/* Platform Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance por Canal</CardTitle>
          <CardDescription>Comparativo detalhado entre Meta, Google e TikTok.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Canal</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Spend</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">ROAS</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">CPA</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">CTR</th>
                  <th className="h-10 px-2 text-right align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {platforms.map((p) => (
                  <tr key={p.platform} className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-2 align-middle font-medium capitalize">{p.platform}</td>
                    <td className="p-2 align-middle text-right">{p.spend.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-2 align-middle text-right font-bold">{p.roas.toFixed(2)}x</td>
                    <td className="p-2 align-middle text-right">{p.cpa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                    <td className="p-2 align-middle text-right">{(p.ctr * 100).toFixed(2)}%</td>
                    <td className="p-2 align-middle text-right">
                      <Badge variant={p.roas >= blended.roas ? "default" : "secondary"} className="text-[10px]">
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          {icon}
        </div>
        <div className="flex items-baseline justify-between">
          <div className="text-2xl font-black">{value}{suffix}</div>
          {showTrend && (
            <div className={`flex items-center text-xs font-bold ${isGoodTrend ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
