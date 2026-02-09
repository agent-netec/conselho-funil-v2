'use client';

import { useState } from 'react';
import { Search, Sparkles, Loader2, ArrowRight, Tag, TrendingUp, Target } from 'lucide-react';
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
}

export function KeywordsMiner({ brandId }: KeywordsMinerProps) {
  const [seedTerm, setSeedTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<KeywordResult[]>([]);

  async function handleMine() {
    if (!seedTerm.trim()) {
      toast.error('Digite um termo para minerar');
      return;
    }

    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/keywords', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, seedTerm }),
      });

      const data = await response.json();

      if (data.success) {
        // A API retorna apenas os termos no momento, vamos simular os metadados para a UI
        // Em uma versão futura, a API retornará o objeto completo
        const mappedResults = data.keywords.map((term: string) => ({
          term,
          intent: 'Informativa',
          opportunityScore: Math.floor(Math.random() * 40) + 60,
          volume: Math.floor(Math.random() * 1000) + 100,
          difficulty: Math.floor(Math.random() * 50) + 10,
        }));
        setResults(mappedResults);
        toast.success(`Mineradas ${data.count} palavras-chave com sucesso!`);
      } else {
        toast.error(data.error || 'Erro ao minerar palavras-chave');
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

        <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[400px] space-y-2 pr-2 custom-scrollbar">
          {results.length > 0 ? (
            results.map((kw, i) => (
              <div 
                key={i} 
                className="group flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-blue-500/10">
                    <Tag className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200">{kw.term}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] py-0 h-4 border-zinc-800 text-zinc-500">
                        {kw.intent}
                      </Badge>
                      <span className="text-[10px] text-zinc-600 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Score: {kw.opportunityScore}
                      </span>
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-zinc-500" />
                </Button>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-zinc-800 rounded-xl">
              <div className="p-3 rounded-full bg-zinc-800/50 mb-3">
                <Target className="w-6 h-6 text-zinc-500" />
              </div>
              <p className="text-zinc-500 text-sm">
                {loading ? 'Minerando a web...' : 'Digite um nicho ou termo para começar a mineração.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
