'use client';

import { useState } from 'react';
import { Search, Sparkles, Loader2, Tag, TrendingUp, Target, ChevronDown, ShoppingCart, Eye, Compass, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { getAuthHeaders } from '@/lib/utils/auth-headers';

interface KeywordsMinerProps {
  brandId: string;
}

interface KeywordResult {
  term: string;
  intent: string;
  opportunityScore: number;
  volume: number;
  difficulty: number;
  suggestion?: string;
}

const INTENT_CONFIG: Record<string, { label: string; color: string; icon: typeof Search; hint: string }> = {
  transactional: {
    label: 'Compra',
    color: 'text-green-400 border-green-500/30 bg-green-500/10',
    icon: ShoppingCart,
    hint: 'Pessoa pronta para comprar. Use em anúncios de oferta direta e páginas de venda.',
  },
  commercial: {
    label: 'Comparação',
    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10',
    icon: Eye,
    hint: 'Pessoa avaliando opções. Use em comparativos, reviews e provas sociais.',
  },
  navigational: {
    label: 'Navegação',
    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    icon: Compass,
    hint: 'Pessoa buscando algo específico. Oportunidade de brand awareness.',
  },
  informational: {
    label: 'Informativa',
    color: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    icon: Info,
    hint: 'Pessoa pesquisando. Use em conteúdo educacional, blog posts e hooks de vídeo.',
  },
};

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-400';
  if (score >= 40) return 'text-amber-400';
  return 'text-zinc-500';
}

function getDifficultyLabel(difficulty: number): string {
  if (difficulty >= 60) return 'Alta';
  if (difficulty >= 30) return 'Média';
  return 'Baixa';
}

export function KeywordsMiner({ brandId }: KeywordsMinerProps) {
  const [seedTerm, setSeedTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  async function handleMine() {
    if (!seedTerm.trim()) {
      toast.error('Digite um termo para minerar');
      return;
    }

    try {
      setLoading(true);
      setExpandedIndex(null);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/keywords', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, seedTerm }),
      });

      const body = await response.json();

      if (!response.ok) {
        const errorMsg = body?.error || body?.message || `Erro na API (${response.status})`;
        toast.error(errorMsg);
        return;
      }

      const data = body.data ?? body;

      if (data.keywords && data.keywords.length > 0) {
        // API now sends full objects { term, intent, volume, difficulty, opportunityScore }
        const mappedResults: KeywordResult[] = data.keywords.map((kw: KeywordResult | string) => {
          if (typeof kw === 'string') {
            // Fallback for old API format
            return { term: kw, intent: 'informational', opportunityScore: 50, volume: 0, difficulty: 0 };
          }
          return kw;
        });
        // Sort by opportunityScore descending
        mappedResults.sort((a, b) => b.opportunityScore - a.opportunityScore);
        setResults(mappedResults);
        toast.success(`Mineradas ${data.count} palavras-chave com sucesso!`);
      } else {
        toast.error('Nenhuma keyword encontrada para este termo.');
      }
    } catch (error) {
      console.error('Error mining keywords:', error);
      toast.error('Erro de conexão ao minerar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-500" />
          Keywords Miner
        </CardTitle>
        <CardDescription>
          Descubra o que seu público está buscando no Google em tempo real.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <Input
              placeholder="Ex: marketing digital, funil de vendas..."
              value={seedTerm}
              onChange={(e) => setSeedTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMine()}
              className="pl-9 bg-zinc-950 border-zinc-800 focus-visible:ring-blue-500"
              disabled={loading}
            />
          </div>
          <Button
            onClick={handleMine}
            disabled={loading || !seedTerm.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Minerar
          </Button>
        </div>

        {/* Summary bar */}
        {results.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(
              results.reduce((acc, kw) => {
                acc[kw.intent] = (acc[kw.intent] || 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            ).map(([intent, count]) => {
              const config = INTENT_CONFIG[intent] || INTENT_CONFIG.informational;
              return (
                <Badge key={intent} variant="outline" className={`text-[10px] ${config.color}`}>
                  {config.label}: {count}
                </Badge>
              );
            })}
            <span className="text-[10px] text-zinc-600 ml-auto">{results.length} termos</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-2 pr-2 custom-scrollbar">
          {results.length > 0 ? (
            results.map((kw, i) => {
              const isExpanded = expandedIndex === i;
              const intentConfig = INTENT_CONFIG[kw.intent] || INTENT_CONFIG.informational;
              const IntentIcon = intentConfig.icon;

              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg bg-zinc-950/50 border transition-all cursor-pointer ${
                    isExpanded ? 'border-blue-500/50' : 'border-zinc-800/50 hover:border-zinc-700/50'
                  }`}
                  onClick={() => setExpandedIndex(isExpanded ? null : i)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`p-1.5 rounded-md shrink-0 ${intentConfig.color}`}>
                        <IntentIcon className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200 truncate">{kw.term}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className={`text-[9px] py-0 h-4 ${intentConfig.color}`}>
                            {intentConfig.label}
                          </Badge>
                          <span className={`text-[10px] flex items-center gap-0.5 ${getScoreColor(kw.opportunityScore)}`}>
                            <TrendingUp className="w-3 h-3" />
                            {kw.opportunityScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-600 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-zinc-800/50 space-y-3">
                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded bg-zinc-900 text-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">Score</p>
                          <p className={`text-lg font-bold ${getScoreColor(kw.opportunityScore)}`}>{kw.opportunityScore}</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 text-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">Volume</p>
                          <p className="text-lg font-bold text-zinc-300">{kw.volume}</p>
                        </div>
                        <div className="p-2 rounded bg-zinc-900 text-center">
                          <p className="text-[9px] uppercase tracking-wider text-zinc-600 font-bold">Dificuldade</p>
                          <p className="text-lg font-bold text-zinc-300">{getDifficultyLabel(kw.difficulty)}</p>
                        </div>
                      </div>

                      {/* Intent insight */}
                      <div className="p-2.5 rounded-lg bg-zinc-900/80 border border-zinc-800/50">
                        <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-bold mb-1">
                          Insight de Intenção
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {intentConfig.hint}
                        </p>
                      </div>

                      {/* AI Suggestion */}
                      <div className="p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/10">
                        <p className="text-[10px] uppercase tracking-wider text-blue-400/60 font-bold mb-1 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Sugestão da IA
                        </p>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          {kw.suggestion || intentConfig.hint}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl">
              <div className="p-3 rounded-full bg-zinc-800/50 mb-3">
                <Target className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-500 text-sm">
                {loading ? 'Minerando a web e analisando com IA...' : 'Digite um nicho ou termo para começar a mineração.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
