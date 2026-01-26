'use client';

import React from 'react';
import { AutopsyReport } from '@/types/funnel';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle2, TrendingDown, DollarSign, Lightbulb } from 'lucide-react';

interface AutopsyReportViewProps {
  report: AutopsyReport;
}

export const AutopsyReportView: React.FC<AutopsyReportViewProps> = ({ report }) => {
  const getHealthColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {/* Resumo de Saúde */}
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle className="text-lg">Saúde do Funil</CardTitle>
          <CardDescription>Score geral baseado em benchmarks</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-4">
          <div className="relative flex items-center justify-center">
            <svg className="w-32 h-32">
              <circle
                className="text-muted-foreground/20"
                strokeWidth="8"
                stroke="currentColor"
                fill="transparent"
                r="58"
                cx="64"
                cy="64"
              />
              <circle
                className={report.overallHealth >= 50 ? 'text-primary' : 'text-destructive'}
                strokeWidth="8"
                strokeDasharray={364.4}
                strokeDashoffset={364.4 - (364.4 * report.overallHealth) / 100}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                r="58"
                cx="64"
                cy="64"
              />
            </svg>
            <span className="absolute text-3xl font-bold">{report.overallHealth}%</span>
          </div>
          <Badge className={getHealthColor(report.overallHealth)}>
            {report.overallHealth >= 80 ? 'Saudável' : report.overallHealth >= 50 ? 'Atenção' : 'Crítico'}
          </Badge>
        </CardContent>
      </Card>

      {/* Gaps Críticos e Perda Financeira */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <TrendingDown className="mr-2 text-destructive" />
            Vazamentos de Receita
          </CardTitle>
          <CardDescription>Onde você está perdendo dinheiro</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {report.criticalGaps.length > 0 ? (
            report.criticalGaps.map((gap, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-destructive/5 border-destructive/20">
                <div className="space-y-1">
                  <p className="text-sm font-bold capitalize">{gap.stepId.split('_')[0]} - {gap.metric}</p>
                  <p className="text-xs text-muted-foreground">
                    Atual: {(gap.currentValue * 100).toFixed(1)}% vs Alvo: {(gap.targetValue * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-destructive">
                    - R$ {gap.lossEstimate.toLocaleString('pt-BR')}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase">Perda Mensal Est.</p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <CheckCircle2 size={48} className="mb-2 text-green-500" />
              <p>Nenhum vazamento crítico detectado.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano de Ação */}
      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Lightbulb className="mr-2 text-yellow-500" />
            Plano de Ação Prioritário
          </CardTitle>
          <CardDescription>Tarefas ordenadas por impacto financeiro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {report.actionPlan.map((action, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="bg-primary/10 p-2 rounded-full text-primary">
                  <span className="text-xs font-bold">{index + 1}</span>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold">{action.task}</p>
                  <p className="text-xs text-muted-foreground">{action.expectedImpact}</p>
                </div>
                <Badge variant="outline" className="capitalize">
                  {action.difficulty}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
