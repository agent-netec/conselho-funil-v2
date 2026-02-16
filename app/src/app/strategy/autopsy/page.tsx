'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope, Activity, Target, AlertTriangle, Search, Loader2, CheckCircle2, XCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { AutopsyRunResponse, AutopsyReport } from '@/types/autopsy';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

export default function FunnelAutopsyPage() {
  const activeBrand = useActiveBrand();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AutopsyReport | null>(null);

  const handleRunAutopsy = async () => {
    if (!url) {
      toast.error('Por favor, insira uma URL válida.');
      return;
    }

    if (!activeBrand?.id) {
      toast.error('Nenhuma marca ativa selecionada.');
      return;
    }

    setIsLoading(true);
    setReport(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/autopsy/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          url,
          depth: 'quick'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao executar diagnóstico.');
      }

      const data: AutopsyRunResponse = await response.json();
      setReport(data.report);
      toast.success('Diagnóstico concluído com sucesso!');
    } catch (error: any) {
      console.error('[AUTOPSY_UI_ERROR]:', error);
      toast.error(error.message || 'Falha ao processar a URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      default: return <Info className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Forensics de Página</h1>
        <p className="text-muted-foreground">
          Análise profunda de uma página específica — identifica gargalos de conversão, UX e copy.
        </p>
      </div>

      {/* Input Section */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Insira a URL da página para análise (ex: https://lp.exemplo.com)" 
                className="pl-10 bg-zinc-950 border-zinc-800 focus:ring-emerald-500/20"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              onClick={handleRunAutopsy} 
              disabled={isLoading || !url}
              className="bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Analisar Página
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* K-3.3: Info note about full funnel analysis */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-blue-300 font-medium">Quer analisar um funil completo?</p>
          <p className="text-zinc-400 text-xs mt-1">Em breve: Funnel Journey Analysis — análise multi-página com detecção de drop-off entre etapas.</p>
        </div>
      </div>

      {report ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Report Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  Resumo do Diagnóstico
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">Health Score:</span>
                  <div className={cn(
                    "text-2xl font-bold px-3 py-1 rounded-lg",
                    report.score >= 7 ? "text-emerald-500 bg-emerald-500/10" :
                    report.score >= 4 ? "text-amber-500 bg-amber-500/10" :
                    "text-red-500 bg-red-500/10"
                  )}>
                    {report.score}/10
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-zinc-300 leading-relaxed italic">
                  "{report.summary}"
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(report.heuristics).map(([key, result]) => (
                    <div key={key} className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">{key}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{result.score}/10</span>
                          {getStatusIcon(result.status)}
                        </div>
                      </div>
                      <ul className="space-y-2">
                        {result.findings.map((finding, i) => (
                          <li key={i} className="text-xs text-zinc-400 flex gap-2">
                            <span className="text-emerald-500/50">•</span>
                            {finding}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  Plano de Ação Recomendado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {report.recommendations.map((rec, i) => (
                    <div key={i} className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50 flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-[10px] font-bold uppercase px-2 py-0.5 rounded border", getPriorityColor(rec.priority))}>
                            {rec.priority}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-zinc-700 text-zinc-400">
                            {rec.type}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-white">{rec.action}</p>
                        <p className="text-xs text-zinc-500">{rec.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info Column */}
          <div className="space-y-6">
            <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm uppercase tracking-widest text-zinc-500">Preview da Página</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {report.metadata.screenshotUrl ? (
                  <img 
                    src={report.metadata.screenshotUrl} 
                    alt="Funnel Preview" 
                    className="w-full h-auto object-cover border-y border-zinc-800"
                  />
                ) : (
                  <div className="h-40 flex items-center justify-center bg-zinc-950 text-zinc-700">
                    <p className="text-xs">Screenshot indisponível</p>
                  </div>
                )}
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Tempo de Carregamento:</span>
                    <span className="text-zinc-300 font-mono">{report.metadata.loadTimeMs}ms</span>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase text-zinc-500">Tech Stack Detectado:</span>
                    <div className="flex flex-wrap gap-2">
                      {report.metadata.techStack.map((tech, i) => (
                        <span key={i} className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300">
                          {tech}
                        </span>
                      ))}
                      {report.metadata.techStack.length === 0 && (
                        <span className="text-[10px] text-zinc-600 italic">Nenhuma tecnologia identificada</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-emerald-500/5 border-emerald-500/10">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertTriangle className="w-5 h-5 text-emerald-500 shrink-0" />
                  <div className="text-xs space-y-2">
                    <p className="font-bold text-emerald-400">Insight do Athos</p>
                    <p className="text-zinc-400 leading-relaxed">
                      Este diagnóstico foi gerado comparando os dados da página com os playbooks de conversão do Wilder. 
                      Priorize as recomendações de <strong>Alta Prioridade</strong> para ver impacto imediato no ROAS.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : !isLoading && (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-2xl bg-zinc-900/20">
          <Stethoscope className="w-12 h-12 text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-zinc-400">Nenhuma análise ativa</h3>
          <p className="text-sm text-zinc-500 mt-1">Insira uma URL acima para iniciar a análise forense da página.</p>
        </div>
      )}
    </div>
  );
}
