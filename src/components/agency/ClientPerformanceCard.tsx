"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  ArrowUpRight, 
  DollarSign, 
  Activity,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ClientPerformanceCardProps {
  client: {
    id: string;
    name: string;
    adSpend: number;
    roi: number;
    healthScore: number;
    status: 'active' | 'paused' | 'archived';
    alerts: number;
    trend: 'up' | 'down' | 'stable';
    predictiveROI: number;
  };
}

export const ClientPerformanceCard = ({ client }: ClientPerformanceCardProps) => {
  const isHealthy = client.healthScore >= 80;
  const isWarning = client.healthScore < 80 && client.healthScore >= 60;
  const isCritical = client.healthScore < 60;

  return (
    <Link href={`/campaigns?clientId=${client.id}`}>
      <Card className="group p-5 card-premium border-white/[0.05] hover:border-emerald-500/20 transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
              {client.name}
            </h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-zinc-900 text-[10px] h-5 border-white/5">
                {client.status.toUpperCase()}
              </Badge>
              {client.alerts > 0 && (
                <Badge variant="destructive" className="h-5 px-1.5 gap-1 text-[10px] animate-pulse">
                  <AlertCircle size={10} />
                  {client.alerts} Alertas
                </Badge>
              )}
            </div>
          </div>
          <div className={cn(
            "p-2 rounded-lg bg-zinc-900 border border-white/5 group-hover:bg-emerald-500/10 group-hover:text-emerald-400 transition-all",
            "text-zinc-500"
          )}>
            <ArrowUpRight size={18} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">Ad Spend</p>
            <p className="text-lg font-mono font-bold text-white">
              R$ {client.adSpend.toLocaleString()}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">ROI Atual</p>
            <div className="flex items-center gap-1.5">
              <p className="text-lg font-mono font-bold text-white">{client.roi.toFixed(2)}x</p>
              {client.trend === 'up' ? (
                <TrendingUp size={14} className="text-emerald-500" />
              ) : (
                <TrendingDown size={14} className="text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Predictive & Health */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-purple-500/10 text-purple-400">
                <Activity size={12} />
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">ROI Preditivo (S22)</span>
            </div>
            <span className="text-xs font-bold text-purple-400">{client.predictiveROI.toFixed(2)}x</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-zinc-500 uppercase tracking-wider">Health Score</span>
              <span className={cn(
                "font-bold",
                isHealthy ? "text-emerald-500" : isWarning ? "text-amber-500" : "text-red-500"
              )}>
                {client.healthScore}%
              </span>
            </div>
            <div className="h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-500",
                  isHealthy ? "bg-emerald-500" : isWarning ? "bg-amber-500" : "bg-red-500"
                )}
                style={{ width: `${client.healthScore}%` }}
              />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};
