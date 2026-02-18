'use client';

import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  ArrowUpRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface CohortData {
  id: string;
  leadCount: number;
  customerCount: number;
  totalLtv: number;
  adSpend: number;
  months: number[];
  isEstimated?: boolean;
  isSimulated?: boolean;
}

interface CohortSummary {
  totalLeads: number;
  totalLtv: number;
  avgPaybackMonths: number;
  isEstimated: boolean;
  isSimulated: boolean;
}

interface CohortDashboardProps {
  data: CohortData[];
  summary?: CohortSummary;
}

/**
 * @fileoverview Dashboard de Cohort e Payback Period.
 * @author Victor (UI) & Beto (UX)
 */
export const CohortDashboard: React.FC<CohortDashboardProps> = ({ data, summary }) => {

  // Formatação de Moeda
  const formatCurrency = (value: number) =>
    (value / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Cálculo de ROI Global
  const totalSpend = data.reduce((acc, c) => acc + c.adSpend, 0);
  const totalLtv = data.reduce((acc, c) => acc + c.totalLtv, 0);
  const globalRoi = totalSpend > 0 ? (totalLtv / totalSpend) : 0;

  // Sprint T-2.5: Real payback from API summary (replaces hardcoded "72 dias")
  const paybackDays = summary?.avgPaybackMonths
    ? Math.round(summary.avgPaybackMonths * 30)
    : null;
  const paybackLabel = paybackDays ? `${paybackDays} dias` : 'N/A';

  // Sprint T-2.4: Data quality badges
  const isEstimated = summary?.isEstimated ?? true;
  const isSimulated = summary?.isSimulated ?? true;

  return (
    <div className="space-y-8">
      {/* Sprint T-2.4: Data quality badges */}
      {(isEstimated || isSimulated) && (
        <div className="flex items-center gap-2 text-sm">
          {!isEstimated && !isSimulated ? (
            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">
              <CheckCircle2 className="w-3 h-3 mr-1" /> Dados Reais
            </Badge>
          ) : (
            <>
              {isEstimated && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  Ad Spend: Estimado
                </Badge>
              )}
              {isSimulated && (
                <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">
                  LTV Distribution: Simulada
                </Badge>
              )}
            </>
          )}
        </div>
      )}

      {/* Top Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="ROI Global (LTV/CAC)"
          value={`${globalRoi.toFixed(2)}x`}
          icon={<TrendingUp className="w-4 h-4 text-emerald-500" />}
          description={isEstimated ? "Estimado — conecte Ads para dados reais" : "Retorno sobre investimento em Ads"}
          badge={!isEstimated ? "Real" : "Estimado"}
        />
        <MetricCard
          title="LTV Total"
          value={formatCurrency(totalLtv)}
          icon={<DollarSign className="w-4 h-4 text-blue-500" />}
          description="Receita vitalícia acumulada"
          badge={!isSimulated ? "Real" : "Estimado"}
        />
        <MetricCard
          title="Total de Leads"
          value={(summary?.totalLeads ?? data.reduce((acc, c) => acc + c.leadCount, 0)).toLocaleString()}
          icon={<Users className="w-4 h-4 text-purple-500" />}
          description="Base total de contatos"
          badge="Real"
        />
        <MetricCard
          title="Payback Médio"
          value={paybackLabel}
          icon={<Calendar className="w-4 h-4 text-amber-500" />}
          description="Tempo para recuperar o CAC"
          badge={!isEstimated && paybackDays ? "Real" : "Estimado"}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart: Payback Evolution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              Evolução do LTV por Safra (Cohort)
            </CardTitle>
            <CardDescription>Comparativo de crescimento do valor acumulado vs investimento inicial</CardDescription>
          </CardHeader>
          <CardContent className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.slice().reverse()}>
                <defs>
                  <linearGradient id="colorLtv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} tickFormatter={(v) => `R$${v/100000}k`} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="totalLtv" name="LTV Acumulado" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLtv)" strokeWidth={3} />
                <Area type="monotone" dataKey="adSpend" name="Investimento Ads" stroke="#f43f5e" fill="transparent" strokeDasharray="5 5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payback Progress by Cohort */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Status de Payback</CardTitle>
            <CardDescription>Progresso para atingir o breakeven</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {data.slice(0, 5).map((cohort) => {
              const progress = Math.min((cohort.totalLtv / cohort.adSpend) * 100, 100);
              const isPaid = cohort.totalLtv >= cohort.adSpend;
              
              return (
                <div key={cohort.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{cohort.id}</span>
                      {isPaid && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={progress} className={isPaid ? "bg-emerald-100 h-2" : "h-2"} />
                  <div className="flex justify-between text-[10px] text-muted-foreground uppercase tracking-tighter">
                    <span>Spend: {formatCurrency(cohort.adSpend)}</span>
                    <span>LTV: {formatCurrency(cohort.totalLtv)}</span>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Retention Grid (BMM-OS Standard) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Grade de Retenção e Maturação de LTV</CardTitle>
          <CardDescription>Valor médio acumulado por lead ao longo dos meses</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Safra</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Leads</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">M0</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">M1</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">M2</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">M3</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">M4</th>
                <th className="text-center py-3 px-4 font-semibold text-muted-foreground">M5+</th>
              </tr>
            </thead>
            <tbody>
              {data.map((cohort) => (
                <tr key={cohort.id} className="border-b border-slate-50 dark:border-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="py-3 px-4 font-medium">{cohort.id}</td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{cohort.leadCount}</td>
                  {cohort.months.map((val, i) => {
                    const avgLtv = val / cohort.leadCount;
                    const opacity = Math.min(avgLtv / 5000, 1); // Heatmap effect base (R$ 50,00)
                    return (
                      <td 
                        key={i} 
                        className="py-3 px-4 text-center font-mono text-xs"
                        style={{ backgroundColor: `rgba(59, 130, 246, ${opacity * 0.2})` }}
                      >
                        {formatCurrency(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

function MetricCard({ title, value, icon, description, trend, badge }: any) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
            {icon}
          </div>
          {badge ? (
            <Badge
              variant="outline"
              className={`text-[10px] ${
                badge === 'Real'
                  ? 'text-emerald-500 border-emerald-100 bg-emerald-50'
                  : 'text-amber-500 border-amber-100 bg-amber-50'
              }`}
            >
              {badge === 'Real' && <CheckCircle2 className="w-3 h-3 mr-1" />}
              {badge}
            </Badge>
          ) : trend ? (
            <Badge variant="outline" className="text-emerald-500 border-emerald-100 bg-emerald-50 text-[10px]">
              <ArrowUpRight className="w-3 h-3 mr-1" /> {trend}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <div className="text-2xl font-bold">{value}</div>
          <p className="text-[10px] text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
