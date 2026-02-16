'use client';

import { useState } from 'react';
import { Zap, Loader2, Globe, ShieldCheck, Cpu, BarChart3, ExternalLink, Save, Lightbulb, ThumbsUp, ThumbsDown, Palette, Type, Layout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

interface SpyAgentProps {
  brandId: string;
}

interface TechStack {
  cms?: string;
  analytics: string[];
  marketing: string[];
  payments: string[];
  infrastructure: string[];
}

interface StrategicAnalysis {
  qualitative: {
    strengths: string[];
    weaknesses: string[];
    emulate: string[];
    avoid: string[];
  };
  designSystem: {
    colors: string[];
    typography: string;
    spacing: string;
    components: string[];
  };
  strategicRationale: string[];
  actionableInsights: string[];
}

interface ScanResult {
  url: string;
  techStack: TechStack;
  durationMs: number;
  strategicAnalysis?: StrategicAnalysis;
}

export function SpyAgent({ brandId }: SpyAgentProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanStep, setScanStep] = useState<string>('');
  const [progress, setProgress] = useState(0);
  const [savingCaseStudy, setSavingCaseStudy] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('tech');

  async function handleScan() {
    if (!url.trim()) {
      toast.error('Digite a URL do concorrente');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setProgress(10);

      setScanStep('Validando robots.txt...');
      await new Promise(r => setTimeout(r, 500));
      setProgress(20);

      setScanStep('Capturando headers HTTP...');
      await new Promise(r => setTimeout(r, 400));
      setProgress(35);

      setScanStep('Analisando scripts e tech stack...');
      setProgress(50);

      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/autopsy/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, url, depth: 'quick' }),
      });

      setProgress(65);
      const contentType = response.headers.get('content-type') || '';
      const autopsyData = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) {
        toast.error(autopsyData.error || 'Erro ao analisar concorrente');
        return;
      }

      // N-3: Strategic Analysis with Gemini
      setScanStep('Análise estratégica com IA...');
      setProgress(75);

      let strategicAnalysis: StrategicAnalysis | undefined;
      try {
        const analyzeRes = await fetch('/api/intelligence/spy', {
          method: 'POST',
          headers,
          body: JSON.stringify({ brandId, action: 'analyze', url }),
        });
        if (analyzeRes.ok) {
          const analyzeData = await analyzeRes.json();
          strategicAnalysis = analyzeData.data?.analysis;
        }
      } catch (err) {
        console.warn('[SpyAgent] Strategic analysis failed, showing tech only:', err);
      }

      setResult({
        url: autopsyData.url || url,
        techStack: {
          cms: autopsyData.report?.techStack?.find((t: string) => ['WordPress', 'Webflow', 'Elementor', 'Wix', 'Shopify'].includes(t)) || 'Custom',
          analytics: autopsyData.report?.techStack?.filter((t: string) => ['Google Analytics', 'Meta Pixel', 'Hotjar', 'GTM'].includes(t)) || [],
          marketing: autopsyData.report?.techStack?.filter((t: string) => ['ActiveCampaign', 'Mailchimp', 'RD Station', 'HubSpot'].includes(t)) || [],
          payments: autopsyData.report?.techStack?.filter((t: string) => ['Stripe', 'Hotmart', 'Pagar.me', 'PagSeguro'].includes(t)) || [],
          infrastructure: autopsyData.report?.techStack?.filter((t: string) => ['Cloudflare', 'AWS', 'Vercel', 'Netlify'].includes(t)) || [],
        },
        durationMs: Date.now() - (autopsyData.timestamp || Date.now()),
        strategicAnalysis,
      });
      setProgress(100);
      toast.success(strategicAnalysis ? 'Scan + Análise Estratégica concluídos!' : 'Análise de tecnologia concluída!');
    } catch (error) {
      console.error('Error scanning competitor:', error);
      toast.error('Erro de conexão ao analisar');
    } finally {
      setLoading(false);
      setScanStep('');
    }
  }

  async function handleSaveCaseStudy() {
    if (!result?.strategicAnalysis) return;
    setSavingCaseStudy(true);
    try {
      const headers = await getAuthHeaders();
      const sa = result.strategicAnalysis;
      const res = await fetch('/api/intelligence/case-studies', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          source: 'spy_agent',
          url: result.url,
          title: `Spy: ${new URL(result.url).hostname}`,
          summary: sa.strategicRationale[0] || 'Análise estratégica de concorrente',
          insights: [
            ...sa.qualitative.strengths.map(s => ({ category: 'strength' as const, text: s, impact: 'positive' as const })),
            ...sa.qualitative.weaknesses.map(w => ({ category: 'weakness' as const, text: w, impact: 'negative' as const })),
          ],
          designSystem: sa.designSystem,
          strategicRationale: sa.strategicRationale,
          actionableItems: sa.actionableInsights,
          techStack: Object.values(result.techStack).flat().filter(Boolean),
        }),
      });
      if (res.ok) {
        toast.success('Salvo como Estudo de Caso!');
      } else {
        toast.error('Erro ao salvar estudo de caso');
      }
    } catch {
      toast.error('Erro ao salvar estudo de caso');
    } finally {
      setSavingCaseStudy(false);
    }
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Spy Agent
        </CardTitle>
        <CardDescription>
          Identifique a infraestrutura, ferramentas e estratégia de qualquer concorrente.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="https://concorrente.com.br"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="pl-9 bg-zinc-950 border-zinc-800 focus-visible:ring-amber-500"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleScan}
            disabled={loading || !url.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
            Scan
          </Button>
        </div>

        {loading && (
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              <span>{scanStep}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1 bg-zinc-800" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[500px] space-y-4 pr-2 custom-scrollbar">
          {result ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {/* URL Header */}
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-zinc-300 truncate max-w-[200px]">{result.url}</span>
                </div>
                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Tabs: Tech / Strategic / Design */}
              <Tabs value={activeResultTab} onValueChange={setActiveResultTab}>
                <TabsList className="bg-zinc-950 border border-zinc-800 w-full">
                  <TabsTrigger value="tech" className="flex-1 text-xs data-[state=active]:bg-amber-500/10 data-[state=active]:text-amber-400">
                    <Cpu className="w-3 h-3 mr-1" /> Tech
                  </TabsTrigger>
                  <TabsTrigger value="strategy" className="flex-1 text-xs data-[state=active]:bg-emerald-500/10 data-[state=active]:text-emerald-400" disabled={!result.strategicAnalysis}>
                    <Lightbulb className="w-3 h-3 mr-1" /> Estratégia
                  </TabsTrigger>
                  <TabsTrigger value="design" className="flex-1 text-xs data-[state=active]:bg-blue-500/10 data-[state=active]:text-blue-400" disabled={!result.strategicAnalysis}>
                    <Palette className="w-3 h-3 mr-1" /> Design
                  </TabsTrigger>
                </TabsList>

                {/* Tech Tab */}
                <TabsContent value="tech" className="mt-3">
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1">
                          <Cpu className="w-3 h-3" /> CMS / Engine
                        </label>
                        <Badge variant="secondary" className="bg-zinc-800 text-zinc-300 border-none">
                          {result.techStack.cms}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" /> Analytics
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {result.techStack.analytics.length > 0 ? (
                            result.techStack.analytics.map(t => <Badge key={t} variant="outline" className="text-[9px] border-zinc-800">{t}</Badge>)
                          ) : <span className="text-[10px] text-zinc-600">Nenhum detectado</span>}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Marketing & Sales</label>
                      <div className="flex flex-wrap gap-1">
                        {result.techStack.marketing.length > 0 ? (
                          result.techStack.marketing.map(t => <Badge key={t} variant="outline" className="text-[9px] border-zinc-800 text-amber-400/80">{t}</Badge>)
                        ) : <span className="text-[10px] text-zinc-600">Nenhum detectado</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Payments</label>
                      <div className="flex flex-wrap gap-1">
                        {result.techStack.payments.length > 0 ? (
                          result.techStack.payments.map(t => <Badge key={t} variant="outline" className="text-[9px] border-zinc-800 text-green-400/80">{t}</Badge>)
                        ) : <span className="text-[10px] text-zinc-600">Nenhum detectado</span>}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Strategy Tab — N-3 */}
                <TabsContent value="strategy" className="mt-3 space-y-3">
                  {result.strategicAnalysis && (
                    <>
                      {/* Strengths & Weaknesses */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                          <div className="flex items-center gap-1 mb-2">
                            <ThumbsUp className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Pontos Fortes</span>
                          </div>
                          <ul className="space-y-1">
                            {result.strategicAnalysis.qualitative.strengths.map((s, i) => (
                              <li key={i} className="text-[11px] text-zinc-400 flex gap-1.5">
                                <span className="text-emerald-500 shrink-0">+</span>{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                          <div className="flex items-center gap-1 mb-2">
                            <ThumbsDown className="w-3 h-3 text-red-400" />
                            <span className="text-[10px] uppercase tracking-wider font-bold text-red-400">Fraquezas</span>
                          </div>
                          <ul className="space-y-1">
                            {result.strategicAnalysis.qualitative.weaknesses.map((w, i) => (
                              <li key={i} className="text-[11px] text-zinc-400 flex gap-1.5">
                                <span className="text-red-500 shrink-0">-</span>{w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Emulate / Avoid */}
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400">Emular</span>
                          <ul className="mt-1 space-y-1">
                            {result.strategicAnalysis.qualitative.emulate.map((e, i) => (
                              <li key={i} className="text-[11px] text-zinc-400">• {e}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Evitar</span>
                          <ul className="mt-1 space-y-1">
                            {result.strategicAnalysis.qualitative.avoid.map((a, i) => (
                              <li key={i} className="text-[11px] text-zinc-500">✕ {a}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Actionable Insights */}
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-amber-400 flex items-center gap-1 mb-2">
                          <Lightbulb className="w-3 h-3" /> Ações Imediatas
                        </span>
                        <ul className="space-y-1.5">
                          {result.strategicAnalysis.actionableInsights.map((insight, i) => (
                            <li key={i} className="text-[11px] text-zinc-300 flex gap-1.5">
                              <span className="text-amber-500 shrink-0 font-bold">{i + 1}.</span>{insight}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Design Tab — N-3.2 */}
                <TabsContent value="design" className="mt-3 space-y-3">
                  {result.strategicAnalysis?.designSystem && (
                    <>
                      <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 space-y-3">
                        {/* Colors */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
                            <Palette className="w-3 h-3" /> Paleta de Cores
                          </span>
                          <div className="flex gap-2 mt-2">
                            {result.strategicAnalysis.designSystem.colors.map((color, i) => (
                              <div key={i} className="flex flex-col items-center gap-1">
                                <div className="w-8 h-8 rounded-lg border border-zinc-700" style={{ backgroundColor: color }} />
                                <span className="text-[9px] text-zinc-500 font-mono">{color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Typography */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
                            <Type className="w-3 h-3" /> Tipografia
                          </span>
                          <p className="text-[11px] text-zinc-400 mt-1">{result.strategicAnalysis.designSystem.typography}</p>
                        </div>
                        {/* Spacing */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Espaçamento</span>
                          <p className="text-[11px] text-zinc-400 mt-1">{result.strategicAnalysis.designSystem.spacing}</p>
                        </div>
                        {/* Components */}
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500 flex items-center gap-1">
                            <Layout className="w-3 h-3" /> Componentes UI
                          </span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {result.strategicAnalysis.designSystem.components.map((comp, i) => (
                              <Badge key={i} variant="outline" className="text-[9px] border-zinc-700 text-blue-400/80">{comp}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </TabsContent>
              </Tabs>

              {/* Action Buttons — N-3.5 / N-3.6 */}
              <div className="flex gap-2">
                {result.strategicAnalysis && (
                  <Button
                    variant="outline"
                    className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                    size="sm"
                    onClick={handleSaveCaseStudy}
                    disabled={savingCaseStudy}
                  >
                    {savingCaseStudy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Save className="w-3 h-3 mr-1" />}
                    Salvar Estudo de Caso
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 border-zinc-800 text-zinc-400 hover:bg-zinc-800"
                  size="sm"
                  onClick={() => toast.info('Em breve: Aplicar insights ao brain context do funil.')}
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Aplicar Insights
                </Button>
              </div>
            </div>
          ) : !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl">
              <div className="p-3 rounded-full bg-zinc-800/50 mb-3">
                <Globe className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-500 text-sm">
                Cole a URL de uma Landing Page ou site para dissecar a tecnologia e estratégia.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
