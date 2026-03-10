'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Target, AlertTriangle, Search, Loader2, CheckCircle2, XCircle, Info, Library, Save, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { AutopsyRunResponse, AutopsyReport } from '@/types/autopsy';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

interface CaseStudyItem {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  actionableItems: string[];
  score?: number;
  createdAt: { seconds: number };
}

const TABS = [
  { id: 'analyze', label: 'ANALISE' },
  { id: 'library', label: 'BIBLIOTECA' },
] as const;

export default function FunnelAutopsyPage() {
  const activeBrand = useActiveBrand();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<AutopsyReport | null>(null);
  const [activeTab, setActiveTab] = useState('analyze');
  const [caseStudies, setCaseStudies] = useState<CaseStudyItem[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  const [savingCase, setSavingCase] = useState(false);

  useEffect(() => {
    if (activeBrand?.id && activeTab === 'library') {
      loadCaseStudies();
    }
  }, [activeBrand?.id, activeTab]);

  const loadCaseStudies = async () => {
    if (!activeBrand?.id) return;
    setLoadingLibrary(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/intelligence/case-studies?brandId=${activeBrand.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setCaseStudies(data.data?.caseStudies || []);
      }
    } catch (err) {
      console.error('[Forensics] Error loading case studies:', err);
    } finally {
      setLoadingLibrary(false);
    }
  };

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

  // N-4.1: Save current report as permanent case study
  const handleSaveAsCaseStudy = async () => {
    if (!report || !activeBrand?.id) return;
    setSavingCase(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/case-studies', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId: activeBrand.id,
          source: 'page_forensics',
          url,
          title: `Forensics: ${url}`,
          summary: report.summary,
          insights: report.recommendations.map(r => ({
            category: r.type || 'general',
            text: r.action,
            impact: r.priority === 'high' ? 'negative' : 'neutral',
          })),
          actionableItems: report.recommendations.map(r => r.action),
          score: report.score,
          heuristicScores: Object.fromEntries(
            Object.entries(report.heuristics).map(([k, v]) => [k, v.score])
          ),
          techStack: report.metadata?.techStack || [],
        }),
      });
      if (res.ok) {
        toast.success('Salvo como Estudo de Caso permanente!');
        loadCaseStudies();
      } else {
        toast.error('Erro ao salvar estudo de caso');
      }
    } catch {
      toast.error('Erro ao salvar estudo de caso');
    } finally {
      setSavingCase(false);
    }
  };

  const handleDeleteCaseStudy = async (caseStudyId: string) => {
    if (!activeBrand?.id) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/intelligence/case-studies', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ brandId: activeBrand.id, caseStudyId }),
      });
      if (res.ok) {
        setCaseStudies(prev => prev.filter(c => c.id !== caseStudyId));
        toast.success('Estudo de caso removido');
      }
    } catch {
      toast.error('Erro ao remover');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle2 className="w-4 h-4 text-[#E6B447]" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-[#E6B447]" />;
      default: return <Info className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500';
      case 'medium': return 'text-[#E6B447]';
      case 'low': return 'text-blue-500';
      default: return 'text-zinc-500';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="px-8 pt-8 pb-6 max-w-[1440px] mx-auto">
          <h1 className="text-[42px] font-black tracking-[-0.02em] text-[#F5E8CE] leading-none">Forensics de Pagina</h1>
          <p className="text-sm text-[#6B5D4A] font-mono mt-2">
            Analise profunda de uma pagina — identifica gargalos de conversao, UX e copy.
          </p>
        </div>
      </header>

      <main className="flex-1 px-8 py-6 max-w-[1440px] mx-auto w-full space-y-6">
        {/* Tabs */}
        <nav className="flex gap-0 -mb-px border-b border-white/[0.06]">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={cn(
                'px-5 py-3 text-[11px] font-mono tracking-wider transition-colors border-b-2',
                activeTab === t.id
                  ? 'text-[#E6B447] border-[#E6B447] font-bold'
                  : 'text-[#6B5D4A] border-transparent hover:text-[#CAB792]'
              )}
            >
              {t.label}
              {t.id === 'library' && caseStudies.length > 0 && (
                <span className="ml-2 text-[10px] font-mono text-[#6B5D4A]">({caseStudies.length})</span>
              )}
            </button>
          ))}
        </nav>

        {/* Analyze Tab */}
        {activeTab === 'analyze' && (
          <div className="space-y-6">
            {/* Input Section */}
            <Card className="bg-zinc-900/50 border-zinc-800">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                      placeholder="Insira a URL da página para análise (ex: https://lp.exemplo.com)"
                      className="pl-10 bg-zinc-950 border-zinc-800 focus:ring-[#E6B447]/20"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                  <Button
                    onClick={handleRunAutopsy}
                    disabled={isLoading || !url}
                    className="bg-[#AB8648] hover:bg-[#895F29] text-white min-w-[140px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      'Analisar Pagina'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Info note */}
            <div className="flex items-start gap-3 p-4 border border-white/[0.06] rounded-lg">
              <Info className="w-5 h-5 text-[#6B5D4A] shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-[#CAB792] font-mono text-xs">Quer analisar um funil completo?</p>
                <p className="text-[#6B5D4A] text-xs mt-1 font-mono">Em breve: Funnel Journey Analysis — analise multi-pagina com deteccao de drop-off entre etapas.</p>
              </div>
            </div>

            {report ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Main Report Column */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="w-5 h-5 text-[#E6B447]" />
                        Resumo do Diagnostico
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-[#6B5D4A] font-mono tracking-wider">HEALTH SCORE</span>
                        <span className={cn(
                          "text-2xl font-mono font-bold",
                          report.score >= 7 ? "text-[#E6B447]" :
                          report.score >= 4 ? "text-[#E6B447]" :
                          "text-red-500"
                        )}>
                          {report.score}/10
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <p className="text-zinc-300 leading-relaxed italic">
                        &ldquo;{report.summary}&rdquo;
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(report.heuristics).map(([key, result]) => (
                          <div key={key} className="p-4 rounded-lg bg-zinc-950/50 border border-white/[0.06]">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#6B5D4A]">{key}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-medium text-[#CAB792]">{result.score}/10</span>
                                {getStatusIcon(result.status)}
                              </div>
                            </div>
                            <ul className="space-y-2">
                              {result.findings.map((finding, i) => (
                                <li key={i} className="text-xs text-zinc-400 flex gap-2">
                                  <span className="text-[#E6B447]/50">•</span>
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
                        Plano de Acao Recomendado
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {report.recommendations.map((rec, i) => (
                          <div key={i} className="p-4 rounded-lg bg-zinc-950/50 border border-white/[0.06] flex flex-col md:flex-row gap-4">
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-3 mb-1">
                                <span className={cn("text-[10px] font-mono font-bold uppercase tracking-wider", getPriorityColor(rec.priority))}>
                                  {rec.priority}
                                </span>
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B5D4A]">
                                  {rec.type}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-[#F5E8CE]">{rec.action}</p>
                              <p className="text-xs text-[#6B5D4A]">{rec.impact}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  {/* N-4.1: Save as Case Study button */}
                  <Button
                    onClick={handleSaveAsCaseStudy}
                    disabled={savingCase}
                    className="w-full bg-[#AB8648] hover:bg-[#895F29] text-white"
                  >
                    {savingCase ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar como Estudo de Caso Permanente
                  </Button>
                </div>

                {/* Sidebar Info Column */}
                <div className="space-y-6">
                  <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-[11px] font-mono uppercase tracking-widest text-[#6B5D4A]">Preview da Pagina</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {report.metadata.screenshotUrl ? (
                        <img
                          src={report.metadata.screenshotUrl}
                          alt="Funnel Preview"
                          className="w-full h-auto object-cover border-y border-zinc-800"
                        />
                      ) : (
                        <div className="h-40 flex items-center justify-center bg-zinc-950 text-[#6B5D4A]">
                          <p className="text-xs font-mono">Screenshot indisponivel</p>
                        </div>
                      )}
                      <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-[#6B5D4A] font-mono">Tempo de Carregamento:</span>
                          <span className="text-[#CAB792] font-mono">{report.metadata.loadTimeMs}ms</span>
                        </div>
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B5D4A]">Tech Stack Detectado:</span>
                          <div className="flex flex-wrap gap-2">
                            {report.metadata.techStack.map((tech, i) => (
                              <span key={i} className="px-2 py-1 rounded bg-zinc-800 text-[10px] font-mono text-[#CAB792]">
                                {tech}
                              </span>
                            ))}
                            {report.metadata.techStack.length === 0 && (
                              <span className="text-[10px] font-mono text-[#6B5D4A] italic">Nenhuma tecnologia identificada</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#E6B447]/5 border-[#E6B447]/10">
                    <CardContent className="pt-6">
                      <div className="flex gap-3">
                        <AlertTriangle className="w-5 h-5 text-[#E6B447] shrink-0" />
                        <div className="text-xs space-y-2">
                          <p className="font-bold text-[#E6B447] font-mono text-[11px]">Insight do Athos</p>
                          <p className="text-[#6B5D4A] leading-relaxed">
                            Este diagnostico foi gerado comparando os dados da pagina com os playbooks de conversao do Wilder.
                            Priorize as recomendacoes de <strong className="text-[#CAB792]">Alta Prioridade</strong> para ver impacto imediato no ROAS.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : !isLoading && (
              <div className="flex flex-col items-center justify-center py-20 border border-white/[0.06] rounded-lg">
                <Search className="w-10 h-10 text-[#6B5D4A] mb-4 opacity-40" />
                <h3 className="text-sm font-mono text-[#CAB792]">Nenhuma analise ativa</h3>
                <p className="text-xs text-[#6B5D4A] mt-1 font-mono">Insira uma URL acima para iniciar a analise forense da pagina.</p>
              </div>
            )}
          </div>
        )}

        {/* N-4.2: Library Tab */}
        {activeTab === 'library' && (
          <div>
            {loadingLibrary ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-[#6B5D4A]" />
              </div>
            ) : caseStudies.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseStudies.map((cs) => (
                  <Card key={cs.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm truncate">{cs.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6B5D4A]">
                              {cs.source === 'spy_agent' ? 'SPY' : 'FORENSICS'}
                            </span>
                            {cs.score && (
                              <span className={cn(
                                "text-[10px] font-mono font-bold",
                                cs.score >= 7 ? "text-[#E6B447]" :
                                cs.score >= 4 ? "text-[#E6B447]" :
                                "text-red-400"
                              )}>
                                {cs.score}/10
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <a href={cs.url} target="_blank" rel="noopener noreferrer" className="p-1 text-[#6B5D4A] hover:text-[#CAB792]">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => handleDeleteCaseStudy(cs.id)} className="p-1 text-[#6B5D4A] hover:text-red-400">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3">
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{cs.summary}</p>
                      {cs.actionableItems.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[#6B5D4A]">ACOES</span>
                          <ul className="space-y-0.5">
                            {cs.actionableItems.slice(0, 3).map((item, i) => (
                              <li key={i} className="text-[10px] text-zinc-500 truncate">• {item}</li>
                            ))}
                            {cs.actionableItems.length > 3 && (
                              <li className="text-[10px] text-[#6B5D4A] font-mono">+{cs.actionableItems.length - 3} mais</li>
                            )}
                          </ul>
                        </div>
                      )}
                      <div className="text-[9px] text-[#6B5D4A] font-mono">
                        {new Date(cs.createdAt.seconds * 1000).toLocaleDateString('pt-BR')}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 border border-white/[0.06] rounded-lg">
                <Library className="w-10 h-10 text-[#6B5D4A] mb-4 opacity-40" />
                <h3 className="text-sm font-mono text-[#CAB792]">Nenhum estudo de caso</h3>
                <p className="text-xs text-[#6B5D4A] mt-1 font-mono">Analise paginas ou concorrentes e salve como estudo de caso permanente.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
