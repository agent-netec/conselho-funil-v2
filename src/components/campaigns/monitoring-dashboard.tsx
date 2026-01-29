import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Target, 
  MousePointer2, 
  RefreshCcw,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export interface Metric {
  label: string;
  value: string | number;
  change?: number;
  target?: number;
  unit: string;
  status: 'success' | 'warning' | 'danger' | 'neutral';
}

interface MonitoringDashboardProps {
  metrics: Metric[];
  anomalies?: string[];
  onRefresh: () => void;
}

export function MonitoringDashboard({ metrics, anomalies, onRefresh }: MonitoringDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white uppercase tracking-tight">Real-Time Performance</h2>
        </div>
        <Button variant="ghost" size="sm" onClick={onRefresh} className="text-zinc-500 hover:text-white">
          <RefreshCcw className="h-4 w-4 mr-2" />
          Atualizar Dados
        </Button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card-premium p-4 border-t-2 border-t-zinc-800"
          >
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
              {metric.label}
            </div>
            <div className="flex items-end justify-between">
              <div className="text-2xl font-black text-white">
                {metric.unit === 'currency' ? `R$ ${metric.value}` : metric.value}{metric.unit === '%' ? '%' : ''}
              </div>
              {metric.change !== undefined && (
                <div className={cn(
                  "flex items-center text-xs font-bold",
                  metric.change >= 0 ? "text-emerald-400" : "text-red-400"
                )}>
                  {metric.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(metric.change)}%
                </div>
              )}
            </div>
            {metric.target && (
              <div className="mt-3 pt-3 border-t border-white/[0.03]">
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="text-zinc-600 font-bold uppercase">Meta: {metric.target}{metric.unit === '%' ? '%' : ''}</span>
                  <span className={cn(
                    "font-bold",
                    metric.status === 'success' ? "text-emerald-500" : 
                    metric.status === 'danger' ? "text-red-500" : "text-amber-500"
                  )}>
                    {metric.status === 'success' ? 'No Alvo' : 'Desvio'}
                  </span>
                </div>
                <div className="h-1 bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      metric.status === 'success' ? "bg-emerald-500" : 
                      metric.status === 'danger' ? "bg-red-500" : "bg-amber-500"
                    )}
                    style={{ width: `${Math.min((Number(metric.value) / metric.target) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* AI Insights & Anomalies (ST-11.18) */}
      {anomalies && anomalies.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card-premium p-5 border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Detecção de Anomalia Estratégica</h3>
          </div>
          
          <div className="space-y-4">
            {anomalies.map((anomaly, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-zinc-300 leading-relaxed">
                    {anomaly}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-white/[0.05] flex justify-end">
            <Button size="sm" className="btn-accent h-8 text-[10px] uppercase font-bold tracking-widest">
              Aplicar Ajustes no Funil
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
