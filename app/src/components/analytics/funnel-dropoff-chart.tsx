'use client';

import { motion } from 'framer-motion';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell,
  LabelList
} from 'recharts';
import { cn } from '@/lib/utils';
import { ArrowDownRight, TrendingDown } from 'lucide-react';

interface FunnelStep {
  name: string;
  value: number;
  dropoff?: number;
}

interface FunnelDropoffChartProps {
  data: FunnelStep[];
  className?: string;
}

export function FunnelDropoffChart({ data, className }: FunnelDropoffChartProps) {
  // Calcular dropoff entre etapas se não fornecido
  const processedData = data.map((step, index) => {
    if (index === 0) return { ...step, dropoff: 0 };
    const prevValue = data[index - 1].value;
    const dropoff = prevValue > 0 ? ((prevValue - step.value) / prevValue) * 100 : 0;
    return { ...step, dropoff };
  });

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900/95 border border-white/10 p-3 rounded-xl shadow-2xl backdrop-blur-md">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">{data.name}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">{data.value.toLocaleString()}</span>
            <span className="text-xs text-zinc-400">usuários</span>
          </div>
          {data.dropoff > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-red-400 text-xs font-medium">
              <TrendingDown className="w-3 h-3" />
              <span>-{data.dropoff.toFixed(1)}% de perda</span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("card-premium p-6 bg-zinc-900/40 border-white/[0.04]", className)}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fluxo de Conversão</h3>
          <p className="text-xs text-zinc-500 mt-1">Análise de drop-off por etapa do funil</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
          <ArrowDownRight className="w-3 h-3 text-red-400" />
          <span className="text-[10px] font-bold text-red-400 uppercase">Deep Intelligence</span>
        </div>
      </div>

      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            barSize={60}
          >
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="dropoffGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }}
              dy={10}
            />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'white', opacity: 0.03 }} />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {processedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.dropoff && entry.dropoff > 30 ? "url(#dropoffGradient)" : "url(#barGradient)"} 
                />
              ))}
              <LabelList 
                dataKey="value" 
                position="top" 
                fill="#fff" 
                fontSize={11} 
                fontWeight={700}
                formatter={(val: number) => val.toLocaleString()}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {processedData.map((step, i) => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-tighter mb-1 truncate">{step.name}</p>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-bold text-white">{step.value}</span>
              {step.dropoff! > 0 && (
                <span className="text-[10px] text-red-500 font-bold">-{step.dropoff?.toFixed(0)}%</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
