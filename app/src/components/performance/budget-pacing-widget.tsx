'use client';

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from "recharts";
import { CalendarDays, Zap } from "lucide-react";

interface PacingData {
  day: string;
  actual: number;
  projected: number;
}

interface BudgetPacingWidgetProps {
  data: PacingData[];
  monthlyBudget: number;
  currentSpend: number;
  daysRemaining: number;
}

export function BudgetPacingWidget({ data, monthlyBudget, currentSpend, daysRemaining }: BudgetPacingWidgetProps) {
  const percentUsed = (currentSpend / monthlyBudget) * 100;
  const isOverPacing = percentUsed > (100 - (daysRemaining / 30 * 100));

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-blue-500" />
              Budget Pacing
            </CardTitle>
            <CardDescription>
              Gasto acumulado vs. Projeção mensal.
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-muted-foreground">{daysRemaining} dias restantes</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
            <span>Consumo: {percentUsed.toFixed(1)}%</span>
            <span>Budget: {monthlyBudget.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
          </div>
          <Progress value={percentUsed} className="h-2" />
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Zap className={`w-3 h-3 ${isOverPacing ? 'text-amber-500' : 'text-emerald-500'}`} />
            {isOverPacing 
              ? "Atenção: Gasto acima da projeção linear." 
              : "Gasto saudável dentro da projeção."}
          </div>
        </div>

        {/* Daily Chart */}
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fill: '#888' }}
              />
              <YAxis 
                hide
              />
              <Tooltip 
                cursor={{ fill: '#f8f9fa' }}
                contentStyle={{ 
                  borderRadius: '12px', 
                  border: 'none', 
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                }}
                formatter={(value: number) => [
                  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
                  'Gasto'
                ]}
              />
              <Bar dataKey="actual" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.actual > entry.projected ? '#f59e0b' : '#3b82f6'} 
                  />
                ))}
              </Bar>
              <ReferenceLine y={data[0]?.projected} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Target', fill: '#ef4444', fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
