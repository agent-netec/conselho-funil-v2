'use client';

import { useState } from 'react';
import { useActiveBrand } from '@/lib/hooks/use-active-brand';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Share2, 
  Smartphone, 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube,
  Loader2,
  Check,
  Copy,
  Lightbulb,
  FileText,
  ArrowLeft,
  Trophy,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { notify } from '@/lib/stores/notification-store';
import { StructureViewer } from './structure-viewer';
import { ScorecardViewer } from './scorecard-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PLATFORMS = [
  { id: 'TikTok', icon: Smartphone, label: 'TikTok', color: 'text-zinc-100' },
  { id: 'Instagram (Reels)', icon: Instagram, label: 'Instagram', color: 'text-pink-500' },
  { id: 'YouTube Shorts', icon: Youtube, label: 'Shorts', color: 'text-red-500' },
  { id: 'X (Twitter)', icon: Twitter, label: 'X', color: 'text-zinc-400' },
  { id: 'LinkedIn', icon: Linkedin, label: 'LinkedIn', color: 'text-blue-500' },
];

interface Hook {
  style: string;
  content: string;
  reasoning: string;
}

interface GenerationResult {
  platform: string;
  hooks: Hook[];
  best_practices: string[];
}

export function HookGenerator() {
  const activeBrand = useActiveBrand();
  const [platform, setPlatform] = useState(PLATFORMS[0].id);
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isGeneratingScorecard, setIsGeneratingScorecard] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [structure, setStructure] = useState<any | null>(null);
  const [scorecard, setScorecard] = useState<any | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      notify.error('Por favor, informe um tema ou assunto.');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setStructure(null);
    setScorecard(null);

    try {
      const response = await fetch('/api/social/hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          topic
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar hooks');

      const data = await response.json();
      setResult(data);
      notify.success('Hooks gerados com sucesso!');
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao gerar hooks. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    notify.success('Copiado para a área de transferência!');
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleGenerateStructure = async (hook: string) => {
    setIsGeneratingStructure(true);
    setScorecard(null); // Clear previous scorecard
    try {
      const response = await fetch('/api/social/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          hook
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar estrutura');

      const data = await response.json();
      setStructure(data);
      notify.success('Estrutura completa gerada!');
      
      // Auto-generate scorecard after structure
      handleGenerateScorecard(data);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao gerar estrutura. Tente novamente.');
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  const handleGenerateScorecard = async (content: any) => {
    setIsGeneratingScorecard(true);
    try {
      const response = await fetch('/api/social/scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandId: activeBrand?.id,
          platform,
          content
        }),
      });

      if (!response.ok) throw new Error('Falha ao gerar scorecard');

      const data = await response.json();
      setScorecard(data);
    } catch (error) {
      console.error('Error:', error);
      notify.error('Erro ao avaliar conteúdo.');
    } finally {
      setIsGeneratingScorecard(false);
    }
  };

  if (structure) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-20">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => {
              setStructure(null);
              setScorecard(null);
            }}
            className="text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para os Hooks
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-rose-500/30 text-rose-400 bg-rose-500/5 px-3 py-1">
              <Sparkles className="h-3 w-3 mr-1.5 fill-current" />
              Conteúdo Gerado
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="script" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 border border-white/[0.04]">
            <TabsTrigger value="script" className="data-[state=active]:bg-rose-500 data-[state=active]:text-white">
              <FileText className="h-4 w-4 mr-2" />
              Script Estruturado
            </TabsTrigger>
            <TabsTrigger 
              value="scorecard" 
              className="data-[state=active]:bg-rose-500 data-[state=active]:text-white flex items-center gap-2"
              disabled={isGeneratingScorecard && !scorecard}
            >
              {isGeneratingScorecard ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Avaliação do Conselho
              {scorecard && (
                <Badge className="ml-2 bg-white/20 text-white border-none py-0 px-1.5 text-[10px]">
                  {scorecard.overall_score}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="script" className="mt-6">
            <StructureViewer structure={structure} />
          </TabsContent>
          
          <TabsContent value="scorecard" className="mt-6">
            {scorecard ? (
              <ScorecardViewer scorecard={scorecard} />
            ) : (
              <Card className="p-12 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-900/40 border-white/[0.04]">
                <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-rose-500 animate-spin" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-100">Avaliando Conteúdo...</h3>
                  <p className="text-sm text-zinc-500">O Conselho Social está analisando seu roteiro baseado em 4 dimensões críticas.</p>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-8 border-t border-white/[0.05]">
          <Button 
            variant="outline" 
            onClick={() => {
              setStructure(null);
              setScorecard(null);
            }}
            className="border-white/[0.08] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.05]"
          >
            Tentar outro Hook
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-6 bg-zinc-900/50 border-white/[0.04]">
        <div className="flex items-center gap-2 mb-6">
          <Share2 className="h-5 w-5 text-rose-400" />
          <h2 className="text-xl font-semibold text-zinc-100">Gerador de Hooks Sociais</h2>
        </div>

        <div className="space-y-6">
          {/* Seleção de Plataforma */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400">Plataforma</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((p) => {
                const Icon = p.icon;
                const isActive = platform === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPlatform(p.id)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                      isActive
                        ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-[0_0_15px_-3px_rgba(244,63,94,0.2)]'
                        : 'bg-zinc-800/50 border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                    )}
                  >
                    <Icon className={cn('h-4 w-4', isActive ? 'text-rose-400' : p.color)} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tema / Assunto */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-400">Tema ou Assunto do Conteúdo</label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Como estruturar um funil de vendas direto no Instagram..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="bg-zinc-800/50 border-white/[0.04] focus:border-rose-500/50 h-12"
              />
              <Button 
                onClick={handleGenerate} 
                disabled={isLoading}
                className="h-12 px-6 bg-rose-500 hover:bg-rose-600 text-white font-semibold shadow-[0_0_20px_-5px_rgba(244,63,94,0.4)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4 fill-current" />
                    Gerar Hooks
                  </>
                )}
              </Button>
            </div>
            {activeBrand && (
              <p className="text-xs text-zinc-500 flex items-center gap-1.5 px-1">
                <Check className="h-3 w-3 text-emerald-500" />
                Alinhando com a marca: <span className="text-zinc-300 font-medium">{activeBrand.name}</span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Resultados */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid gap-4">
            {result.hooks.map((hook, index) => (
              <Card key={index} className="overflow-hidden bg-zinc-900/40 border-white/[0.04] group hover:border-rose-500/30 transition-all">
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="bg-rose-500/10 text-rose-400 border-rose-500/20 text-[10px] uppercase tracking-wider">
                        Estilo: {hook.style}
                      </Badge>
                      <button 
                        onClick={() => copyToClipboard(hook.content, index)}
                        className="text-zinc-500 hover:text-rose-400 transition-colors"
                      >
                        {copiedIndex === index ? (
                          <Check className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    <p className="text-lg font-medium text-zinc-100 leading-relaxed">
                      "{hook.content}"
                    </p>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-2 bg-white/[0.02] p-3 rounded-lg border border-white/[0.02] flex-1">
                        <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-zinc-400 italic">
                          {hook.reasoning}
                        </p>
                      </div>

                      <Button
                        size="sm"
                        onClick={() => handleGenerateStructure(hook.content)}
                        disabled={isGeneratingStructure}
                        className="shrink-0 bg-white/[0.05] hover:bg-rose-500 hover:text-white border border-white/[0.05] transition-all text-zinc-300 gap-2"
                      >
                        {isGeneratingStructure ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileText className="h-3.5 w-3.5" />
                        )}
                        Estruturar Conteúdo
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Melhores Práticas */}
          <Card className="p-6 bg-rose-500/5 border-rose-500/10">
            <h3 className="text-sm font-semibold text-rose-400 flex items-center gap-2 mb-4">
              <Check className="h-4 w-4" />
              Melhores Práticas para {result.platform}
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.best_practices.map((practice, idx) => (
                <li key={idx} className="text-xs text-zinc-400 flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500/40 mt-1.5 shrink-0" />
                  {practice}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
    </div>
  );
}

