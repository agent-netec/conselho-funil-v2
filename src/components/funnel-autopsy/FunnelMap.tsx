'use client';

import React from 'react';
import { FunnelStep } from '@/types/funnel';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface FunnelMapProps {
  steps: FunnelStep[];
  onUpdateStepMetrics: (stepId: string, metrics: Partial<FunnelStep['metrics']>) => void;
}

export const FunnelMap: React.FC<FunnelMapProps> = ({ steps, onUpdateStepMetrics }) => {
  const getStepIcon = (type: FunnelStep['type']) => {
    switch (type) {
      case 'ads': return '📢';
      case 'optin': return '📧';
      case 'vsl': return '🎥';
      case 'checkout': return '💳';
      case 'upsell': return '🚀';
      case 'thankyou': return '✅';
      default: return '📄';
    }
  };

  const getHealthColor = (deviation: number) => {
    if (deviation > 0) return 'text-green-500';
    if (deviation < -20) return 'text-red-500';
    return 'text-yellow-500';
  };

  return (
    <div className="flex flex-col space-y-8 p-6 overflow-x-auto">
      <div className="flex items-center space-x-4 min-w-max">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <Card className="w-64 flex-shrink-0 border-2 hover:border-primary transition-colors">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <span className="text-2xl">{getStepIcon(step.type)}</span>
                  <Badge variant="outline" className="capitalize">{step.type}</Badge>
                </div>
                <CardTitle className="text-sm font-bold mt-2 truncate">
                  {step.url || `Etapa ${index + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Visitantes</Label>
                    <Input
                      type="number"
                      value={step.metrics.visitors}
                      onChange={(e) => onUpdateStepMetrics(step.id, { visitors: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-muted-foreground">Conversões</Label>
                    <Input
                      type="number"
                      value={step.metrics.conversions}
                      onChange={(e) => onUpdateStepMetrics(step.id, { conversions: Number(e.target.value) })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium">Taxa de Conv.</span>
                    <span className="text-sm font-bold">
                      {(step.metrics.conversionRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  {step.benchmarks && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] text-muted-foreground">Benchmark: {(step.benchmarks.industryAvg * 100).toFixed(1)}%</span>
                      <div className={`flex items-center text-[10px] font-bold ${getHealthColor(step.benchmarks.deviation)}`}>
                        {step.benchmarks.deviation > 0 ? <TrendingUp size={10} className="mr-1" /> : <TrendingDown size={10} className="mr-1" />}
                        {Math.abs(step.benchmarks.deviation)}%
                      </div>
                    </div>
                  )}
                </div>

                {step.benchmarks && step.benchmarks.deviation < -20 && (
                  <div className="flex items-center p-2 bg-red-50 text-red-700 rounded-md text-[10px]">
                    <AlertTriangle size={12} className="mr-2 flex-shrink-0" />
                    Gargalo Crítico Detectado
                  </div>
                )}
              </CardContent>
            </Card>

            {index < steps.length - 1 && (
              <div className="flex flex-col items-center justify-center text-muted-foreground px-2">
                <ArrowRight size={24} />
                <span className="text-[10px] font-bold mt-1">
                  {((steps[index + 1].metrics.visitors / step.metrics.visitors) * 100 || 0).toFixed(1)}% drop
                </span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
