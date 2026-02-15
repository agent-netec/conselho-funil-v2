"use client";

import React, { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Target, Info } from 'lucide-react';
import { PredictionEngine } from '@/lib/intelligence/predictive/engine';
import { SimulationInput, SimulationOutput } from '@/types/predictive';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChurnOverview } from './ChurnOverview';
import { LTVBreakdown } from './LTVBreakdown';
import { ForecastChart } from './ForecastChart';
import { PredictiveAlerts } from './PredictiveAlerts';
import { useBrandStore } from '@/lib/stores/brand-store';
import { usePredictiveData } from '@/lib/hooks/use-predictive-data';

/**
 * @fileoverview Componente de Simulação de Escala (ST-22.4)
 * @description Interface interativa para simular o futuro do caixa com IA.
 */

export const ScaleSimulator = () => {
  const engine = useMemo(() => new PredictionEngine(), []);
  const { selectedBrand } = useBrandStore();
  const brandId = selectedBrand?.id ?? null;
  const { churn, ltv, forecast, isLoading } = usePredictiveData(brandId);

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

  const simulatorContent = (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in-up">
      <div className="lg:col-span-4 space-y-6">
        <Card className="p-6 card-premium border-white/[0.05]">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Target size={20} />
            </div>
            <h2 className="text-lg font-semibold text-white">Painel de Controle</h2>
            <Badge variant="outline" className="ml-auto text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
              <Info className="h-3 w-3 mr-1" />
              Projecao Simulada
            </Badge>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-zinc-400">Investimento Atual</Label>
              <Slider value={[baseSpend]} min={1000} max={100000} step={1000} onValueChange={([v]) => setBaseSpend(v)} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">Escala Desejada</Label>
              <Slider value={[targetSpend]} min={baseSpend} max={baseSpend * 10} step={1000} onValueChange={([v]) => setTargetSpend(v)} />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-400">CPA Atual</Label>
              <Input type="number" value={currentCPA} onChange={(e) => setCurrentCPA(Number(e.target.value))} />
            </div>
            <div className="flex gap-2">
              {[7, 15, 30].map((days) => (
                <Button key={days} variant={windowDays === days ? 'default' : 'outline'} onClick={() => setWindowDays(days)}>
                  {days}d
                </Button>
              ))}
            </div>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border-zinc-800 bg-zinc-900/30">Lucro Projetado: {simulation.projectedNetProfit.toFixed(2)}</Card>
          <Card className="p-4 border-zinc-800 bg-zinc-900/30">ROI: {simulation.projectedROI.toFixed(2)}x</Card>
          <Card className="p-4 border-zinc-800 bg-zinc-900/30">Degradação CAC: {(simulation.estimatedCacDegradation * 100).toFixed(1)}%</Card>
        </div>
        <Card className="p-4 border-zinc-800 bg-zinc-900/30 h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
              <XAxis dataKey="day" stroke="#3f3f46" />
              <YAxis stroke="#3f3f46" />
              <Tooltip />
              <Area type="monotone" dataKey="atual" stroke="#52525b" fill="#52525b44" />
              <Area type="monotone" dataKey="projetado" stroke="#10b981" fill="#10b98144" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="churn">Churn</TabsTrigger>
        <TabsTrigger value="ltv">LTV</TabsTrigger>
        <TabsTrigger value="forecast">Forecast</TabsTrigger>
        <TabsTrigger value="simulator">Simulador</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <Card className="p-4 border-zinc-800 bg-zinc-900/30">
          {isLoading ? 'Carregando inteligência preditiva...' : 'Resumo preditivo carregado.'}
        </Card>
        {brandId ? <PredictiveAlerts brandId={brandId} churn={churn} ltv={ltv} forecast={forecast} /> : null}
      </TabsContent>
      <TabsContent value="churn">
        <ChurnOverview data={churn} />
      </TabsContent>
      <TabsContent value="ltv">
        <LTVBreakdown data={ltv} />
      </TabsContent>
      <TabsContent value="forecast">
        <ForecastChart data={forecast} />
      </TabsContent>
      <TabsContent value="simulator">{simulatorContent}</TabsContent>
    </Tabs>
  );
};
