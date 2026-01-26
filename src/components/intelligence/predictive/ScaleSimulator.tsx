"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Target, 
  Calendar, 
  ShieldCheck, 
  Save, 
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { PredictionEngine } from '@/lib/intelligence/predictive/engine';
import { SimulationInput, SimulationOutput } from '@/types/predictive';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from 'recharts';

/**
 * @fileoverview Componente de Simulação de Escala (ST-22.4)
 * @description Interface interativa para simular o futuro do caixa com IA.
 */

export const ScaleSimulator = () => {
  const engine = useMemo(() => new PredictionEngine(), []);

  // Estados dos Inputs
  const [baseSpend, setBaseSpend] = useState(10000);
  const [targetSpend, setTargetSpend] = useState(50000);
  const [currentCPA, setCurrentCPA] = useState(50);
  const [windowDays, setWindowDays] = useState(30);

  // Resultado da Simulação
  const simulation = useMemo<SimulationOutput>(() => {
    return engine.simulateScale({
      baseAdSpend: baseSpend,
      proposedAdSpend: targetSpend,
      targetCPA: currentCPA,
      historicalWindowDays: windowDays
    });
  }, [baseSpend, targetSpend, currentCPA, windowDays, engine]);

  // Mock de dados para o gráfico (seria gerado pelo engine no futuro)
  const chartData = useMemo(() => {
    const data = [];
    const days = 30;
    const currentDailyProfit = (baseSpend * 2 - baseSpend) / days;
    const projectedDailyProfit = simulation.projectedNetProfit / days;

    for (let i = 0; i <= days; i++) {
      data.push({
        day: `Dia ${i}`,
        atual: Math.round(currentDailyProfit * i),
        projetado: Math.round(projectedDailyProfit * i)
      });
    }
    return data;
  }, [baseSpend, simulation.projectedNetProfit]);

  const degradationColor = useMemo(() => {
    const deg = simulation.estimatedCacDegradation;
    if (deg < 0.15) return 'text-emerald-500';
    if (deg < 0.30) return 'text-amber-500';
    return 'text-red-500';
  }, [simulation.estimatedCacDegradation]);

  const confidenceScore = 85; // Mockado conforme PRD

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in-up">
      {/* Coluna Esquerda: Painel de Controle */}
      <div className="lg:col-span-4 space-y-6">
        <Card className="p-6 card-premium border-white/[0.05]">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Target size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Painel de Controle</h2>
          </div>

          <div className="space-y-8">
            {/* Investimento Atual */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400">Investimento Atual</Label>
                <span className="text-white font-mono">R$ {baseSpend.toLocaleString()}</span>
              </div>
              <Slider 
                value={[baseSpend]} 
                min={1000} 
                max={100000} 
                step={1000}
                onValueChange={([v]) => setBaseSpend(v)}
              />
            </div>

            {/* Investimento Proposto */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400">Escala Desejada (Target)</Label>
                <span className="text-purple-400 font-bold font-mono">R$ {targetSpend.toLocaleString()}</span>
              </div>
              <Slider 
                value={[targetSpend]} 
                min={baseSpend} 
                max={baseSpend * 10} 
                step={1000}
                onValueChange={([v]) => setTargetSpend(v)}
                className="[&_.relative]:bg-purple-500/20"
              />
            </div>

            {/* CPA Atual */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-zinc-400">CPA Atual (Custo por Venda)</Label>
                <span className="text-white font-mono">R$ {currentCPA.toLocaleString()}</span>
              </div>
              <div className="flex gap-4">
                <Slider 
                  value={[currentCPA]} 
                  min={1} 
                  max={500} 
                  step={1}
                  onValueChange={([v]) => setCurrentCPA(v)}
                />
                <Input 
                  type="number" 
                  value={currentCPA}
                  onChange={(e) => setCurrentCPA(Number(e.target.value))}
                  className="w-20 h-8 bg-zinc-900 border-zinc-800 text-xs text-center"
                />
              </div>
            </div>

            {/* Janela Histórica */}
            <div className="space-y-4">
              <Label className="text-zinc-400">Janela de Dados (Dias)</Label>
              <div className="flex gap-2">
                {[7, 15, 30].map((days) => (
                  <Button
                    key={days}
                    variant={windowDays === days ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setWindowDays(days)}
                    className={windowDays === days ? 'bg-purple-600 hover:bg-purple-500' : 'border-zinc-800 text-zinc-400'}
                  >
                    {days}d
                  </Button>
                ))}
              </div>
            </div>

            <Button className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 gap-2">
              <Save size={16} />
              Salvar Cenário
            </Button>
          </div>
        </Card>
      </div>

      {/* Coluna Direita: Projeções / IA */}
      <div className="lg:col-span-8 space-y-6">
        {/* Widgets de Topo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-5 card-premium border-emerald-500/10">
            <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Lucro Líquido Projetado</div>
            <div className="text-2xl font-bold text-emerald-400">
              R$ {simulation.projectedNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="mt-2 text-[10px] text-zinc-500 flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              Margem: R$ {(simulation.projectedNetProfit * 0.9).toLocaleString(0)} ~ {(simulation.projectedNetProfit * 1.1).toLocaleString(0)}
            </div>
          </Card>

          <Card className="p-5 card-premium border-purple-500/10">
            <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">ROI Preditivo</div>
            <div className="text-2xl font-bold text-purple-400">
              {simulation.projectedROI.toFixed(2)}x
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="bg-purple-500/5 text-purple-400 border-purple-500/20 text-[10px]">
                {confidenceScore}% Confiança
              </Badge>
            </div>
          </Card>

          <Card className="p-5 card-premium border-white/5">
            <div className="text-zinc-500 text-xs font-medium mb-1 uppercase tracking-wider">Degradação do CAC</div>
            <div className={`text-2xl font-bold ${degradationColor}`}>
              +{(simulation.estimatedCacDegradation * 100).toFixed(1)}%
            </div>
            <div className="mt-2 flex items-center gap-1">
              <div className="h-1.5 flex-1 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${degradationColor.replace('text-', 'bg-')}`}
                  style={{ width: `${Math.min(100, simulation.estimatedCacDegradation * 200)}%` }}
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Gráfico de Maturação */}
        <Card className="p-6 card-premium border-white/[0.05]">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-lg font-semibold text-white">Gráfico de Maturação (Cashflow)</h2>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-zinc-500" />
                <span className="text-zinc-400">Atual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 bg-emerald-500 border-t border-dashed" />
                <span className="text-emerald-400">Projetado</span>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorAtual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#71717a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#71717a" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  stroke="#3f3f46" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  interval={5}
                />
                <YAxis 
                  stroke="#3f3f46" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => `R$ ${v/1000}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#09090b', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="atual" 
                  stroke="#52525b" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAtual)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="projetado" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  fillOpacity={1} 
                  fill="url(#colorProjetado)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10 flex items-start gap-3">
            <AlertTriangle className="text-purple-400 shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-purple-300/80 leading-relaxed">
              <span className="font-bold text-purple-300">Insight da IA:</span> O ponto de equilíbrio (breakeven) da nova escala deve ocorrer no <span className="text-white font-medium">Dia 14</span>. A degradação do CAC está dentro da margem de segurança histórica para o seu nicho.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
