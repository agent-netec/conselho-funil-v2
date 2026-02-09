'use client';

import { useState } from 'react';
import { Zap, Loader2, Globe, ShieldCheck, Cpu, BarChart3, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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

interface ScanResult {
  url: string;
  techStack: TechStack;
  durationMs: number;
}

export function SpyAgent({ brandId }: SpyAgentProps) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanStep, setScanStep] = useState<string>('');
  const [progress, setProgress] = useState(0);

  async function handleScan() {
    if (!url.trim()) {
      toast.error('Digite a URL do concorrente');
      return;
    }

    try {
      setLoading(true);
      setResult(null);
      setProgress(10);
      
      // Simulação de passos para UX
      setScanStep('Validando robots.txt...');
      await new Promise(r => setTimeout(r, 800));
      setProgress(30);
      
      setScanStep('Capturando headers HTTP...');
      await new Promise(r => setTimeout(r, 600));
      setProgress(50);

      setScanStep('Analisando scripts e tech stack...');
      
      // Chamada real para a API
      // Nota: Como não temos um competitorId real aqui (é uma busca livre), 
      // vamos ajustar a API ou simular o comportamento do SpyAgent.scan
      // Para o Discovery Hub, idealmente teríamos um endpoint de "Quick Scan"
      
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/autopsy/run', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, url, depth: 'quick' }),
      });

      setProgress(80);
      const contentType = response.headers.get('content-type') || '';
      const data = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (response.ok) {
        setResult({
          url: data.url,
          techStack: {
            cms: data.report?.techStack?.find((t: string) => ['WordPress', 'Webflow', 'Elementor'].includes(t)) || 'Custom',
            analytics: data.report?.techStack?.filter((t: string) => ['Google Analytics', 'Meta Pixel', 'Hotjar'].includes(t)) || [],
            marketing: data.report?.techStack?.filter((t: string) => ['ActiveCampaign', 'Mailchimp'].includes(t)) || [],
            payments: data.report?.techStack?.filter((t: string) => ['Stripe', 'Hotmart', 'Pagar.me'].includes(t)) || [],
            infrastructure: data.report?.techStack?.filter((t: string) => ['Cloudflare', 'AWS'].includes(t)) || [],
          },
          durationMs: Date.now() - (data.timestamp || Date.now()),
        });
        setProgress(100);
        toast.success('Análise de tecnologia concluída!');
      } else {
        toast.error(data.error || 'Erro ao analisar concorrente');
      }
    } catch (error) {
      console.error('Error scanning competitor:', error);
      toast.error('Erro de conexão ao analisar');
    } finally {
      setLoading(false);
      setScanStep('');
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
          Identifique a infraestrutura e ferramentas usadas por qualquer concorrente.
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

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-4 pr-2 custom-scrollbar">
          {result ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-zinc-300 truncate max-w-[200px]">{result.url}</span>
                  </div>
                  <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-zinc-300">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

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
              
              <Button variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:bg-zinc-800" size="sm">
                Salvar no Dossier
              </Button>
            </div>
          ) : !loading && (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl">
              <div className="p-3 rounded-full bg-zinc-800/50 mb-3">
                <Globe className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-500 text-sm">
                Cole a URL de uma Landing Page ou site para dissecar a tecnologia.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
