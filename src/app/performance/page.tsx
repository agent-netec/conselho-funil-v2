'use client';

import React, { useState, useEffect } from 'react';
import { WarRoomDashboard } from '@/components/performance/war-room-dashboard';
import { AlertCenter } from '@/components/performance/alert-center';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  RefreshCcw, 
  Calendar, 
  Download,
  Zap,
  Activity
} from "lucide-react";
import { PerformanceMetric, PerformanceAnomaly } from '@/types/performance';

export default function PerformanceWarRoomPage() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [anomalies, setAnomalies] = useState<PerformanceAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Mocking the API calls as requested
      const metricsRes = await fetch('/api/performance/metrics?brandId=TEST&mock=true');
      const anomaliesRes = await fetch('/api/performance/anomalies?brandId=TEST&mock=true');
      
      const metricsData = await metricsRes.json();
      const anomaliesData = await anomaliesRes.json();
      
      setMetrics(metricsData);
      setAnomalies(anomaliesData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  // Process blended metrics from the metrics array
  const blendedMetrics = metrics.find(m => m.source === 'aggregated')?.data || {
    spend: 0,
    revenue: 0,
    roas: 0,
    cac: 0,
    ctr: 0,
    cpc: 0,
    conversions: 0
  };

  const platformMetrics = metrics
    .filter(m => m.source !== 'aggregated')
    .map(m => ({
      ...m.data,
      platform: m.source as any,
      cpa: m.data.cac // Mapping cac to cpa for the dashboard component
    }));

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-6 space-y-8">
      {/* War Room Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-800 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-rose-500/50 animate-pulse delay-75" />
            </div>
            <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 px-2 font-black tracking-tighter uppercase text-[10px]">
              Live Ops
            </Badge>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Performance War Room</span>
          </div>
          <h1 className="text-4xl font-black tracking-tighter text-white flex items-center gap-3">
            <Activity className="w-10 h-10 text-rose-600" />
            COMMAND CENTER
          </h1>
          <p className="text-zinc-500 text-sm font-medium max-w-md">
            Monitoramento em tempo real de ROAS, CAC e anomalias críticas multicanal.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-4 mr-4 px-4 py-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 font-bold uppercase">System Status</p>
              <p className="text-xs font-black text-emerald-500">ALL SYSTEMS NOMINAL</p>
            </div>
            <Zap className="w-5 h-5 text-emerald-500" />
          </div>
          
          <Button variant="outline" className="border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-white gap-2 h-11">
            <Calendar size={18} />
            Jan 29, 2026
          </Button>
          
          <Button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="bg-rose-600 hover:bg-rose-500 text-white gap-2 h-11 px-6 font-bold shadow-lg shadow-rose-900/20"
          >
            <RefreshCcw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            SYNC DATA
          </Button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Metrics & Comparison */}
        <div className="lg:col-span-8 space-y-6">
          <WarRoomDashboard 
            blended={blendedMetrics}
            platforms={platformMetrics}
            loading={loading}
          />
          
          {/* LTV & Advanced Metrics Section (Placeholder for ST-18.5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-900/40 border-zinc-800 p-6">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">LTV Prediction (6-Month)</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">R$ 1.240,00</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none">+18% vs prev</Badge>
              </div>
              <div className="mt-4 h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-purple-600 w-[75%]" />
              </div>
            </Card>
            
            <Card className="bg-zinc-900/40 border-zinc-800 p-6">
              <h3 className="text-sm font-black text-zinc-500 uppercase tracking-widest mb-4">CAC Payback Period</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white">22 Days</span>
                <Badge className="bg-emerald-500/10 text-emerald-500 border-none">Optimal</Badge>
              </div>
              <div className="mt-4 flex justify-between text-[10px] font-bold text-zinc-600 uppercase">
                <span>Target: 30 Days</span>
                <span>Current: 22 Days</span>
              </div>
            </Card>
          </div>
        </div>

        {/* Right Column: Alerts & Intelligence */}
        <div className="lg:col-span-4 space-y-6">
          <AlertCenter 
            alerts={anomalies.map(a => ({
              id: a.id,
              severity: a.severity,
              status: a.status === 'new' ? 'active' : 'acknowledged',
              message: a.aiInsight?.explanation || `Anomalia detectada em ${a.metricType}`,
              metricType: a.metricType,
              createdAt: a.detectedAt,
              context: {
                platform: 'Aggregated',
                deviation: a.deviationPercentage,
                entityName: 'Brand TEST'
              }
            })) as any}
            onAcknowledge={(id) => console.log('Acknowledge alert:', id)}
          />

          <Card className="bg-zinc-900/40 border-zinc-800 p-6 border-l-4 border-l-purple-600">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-500" />
              <h3 className="text-sm font-black text-white uppercase tracking-widest">AI Strategic Insight</h3>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              "O ROAS do canal Meta Ads caiu 15% nas últimas 24h, mas o LTV projetado da coorte atual é 20% superior. 
              <span className="text-white font-bold"> Recomendação:</span> Manter budget e focar em criativos de retenção."
            </p>
            <Button variant="link" className="text-purple-500 p-0 h-auto mt-4 text-xs font-bold uppercase tracking-tighter">
              Ver análise completa →
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
