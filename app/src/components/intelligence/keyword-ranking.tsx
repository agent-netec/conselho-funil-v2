'use client';

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Search,
  TrendingUp,
  TrendingDown,
  Filter,
  ArrowUpDown,
  Sparkles,
  Loader2,
  Save,
  Plus,
} from "lucide-react";
import { KeywordIntelligence, SearchIntent } from "@/types/intelligence";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { getAuthHeaders } from "@/lib/utils/auth-headers";

interface KeywordRankingProps {
  keywords: KeywordIntelligence[];
  brandId?: string;
  loading?: boolean;
  onKeywordsSaved?: () => void;
}

const INTENT_LABELS: Record<SearchIntent, { label: string; color: string }> = {
  informational: { label: "Informativa", color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30" },
  navigational: { label: "Navegacional", color: "bg-[#E6B447]/10 text-[#E6B447] border-[#E6B447]/30" },
  commercial: { label: "Comercial", color: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30" },
  transactional: { label: "Transacional", color: "bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/30" },
};

interface MinerResult {
  term: string;
  intent: string;
  opportunityScore: number;
  volume: number;
  difficulty: number;
  suggestion?: string;
}

export function KeywordRanking({ keywords, brandId, loading, onKeywordsSaved }: KeywordRankingProps) {
  const [tab, setTab] = React.useState<string>("saved");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedIntent, setSelectedIntent] = React.useState<SearchIntent | 'all'>('all');

  // Miner state
  const [minerTerm, setMinerTerm] = React.useState("");
  const [mining, setMining] = React.useState(false);
  const [minerResults, setMinerResults] = React.useState<MinerResult[]>([]);
  const [savingAll, setSavingAll] = React.useState(false);
  const [savedTerms, setSavedTerms] = React.useState<Set<string>>(new Set());

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = kw.term.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIntent = selectedIntent === 'all' || kw.intent === selectedIntent;
    return matchesSearch && matchesIntent;
  }).sort((a, b) => b.metrics.opportunityScore - a.metrics.opportunityScore);

  const getKOSColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-black";
    if (score >= 50) return "text-blue-600 font-bold";
    if (score >= 30) return "text-yellow-600 font-medium";
    return "text-muted-foreground";
  };

  async function handleMine() {
    if (!minerTerm.trim()) {
      toast.error('Digite um termo para pesquisar');
      return;
    }
    if (!brandId) {
      toast.error('Brand não selecionado');
      return;
    }

    try {
      setMining(true);
      setSavedTerms(new Set());
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/keywords', {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandId, seedTerm: minerTerm }),
      });

      const body = await response.json();
      if (!response.ok) {
        toast.error(body?.error || `Erro na API (${response.status})`);
        return;
      }

      const data = body.data ?? body;
      if (data.keywords && data.keywords.length > 0) {
        const mapped: MinerResult[] = data.keywords.map((kw: MinerResult | string) => {
          if (typeof kw === 'string') return { term: kw, intent: 'informational', opportunityScore: 50, volume: 0, difficulty: 0 };
          return kw;
        });
        mapped.sort((a: MinerResult, b: MinerResult) => b.opportunityScore - a.opportunityScore);
        setMinerResults(mapped);
        toast.success(`${data.count} keywords encontradas!`);
      } else {
        setMinerResults([]);
        toast.error('Nenhuma keyword encontrada para este termo.');
      }
    } catch {
      toast.error('Erro de conexão ao pesquisar');
    } finally {
      setMining(false);
    }
  }

  async function handleSaveOne(kw: MinerResult) {
    if (!brandId) return;
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/keywords/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          keyword: {
            term: kw.term,
            volume: kw.volume,
            difficulty: kw.difficulty,
            intent: kw.intent,
            opportunityScore: kw.opportunityScore,
            suggestion: kw.suggestion,
          },
        }),
      });

      if (response.ok) {
        setSavedTerms(prev => new Set(prev).add(kw.term.toLowerCase()));
        toast.success(`"${kw.term}" salva!`);
        onKeywordsSaved?.();
      } else {
        const data = await response.json();
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro de conexão');
    }
  }

  async function handleSaveAll() {
    if (!brandId || minerResults.length === 0) return;
    setSavingAll(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/intelligence/keywords/save', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          brandId,
          keywords: minerResults.map(kw => ({
            term: kw.term,
            volume: kw.volume,
            difficulty: kw.difficulty,
            intent: kw.intent,
            opportunityScore: kw.opportunityScore,
            suggestion: kw.suggestion,
          })),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        const count = data.data?.saved || 0;
        setSavedTerms(new Set(minerResults.map(k => k.term.toLowerCase())));
        toast.success(`${count} keywords salvas!`);
        onKeywordsSaved?.();
      } else {
        toast.error(data?.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSavingAll(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Ranking de Keywords (KOS)
            </CardTitle>
            <CardDescription>
              Priorização de termos baseada em Volume, Relevância e Dificuldade.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="saved" className="text-xs h-7">
              Keywords Salvas
              {keywords.length > 0 && (
                <Badge className="ml-1.5 h-4 text-[9px] px-1.5" variant="secondary">{keywords.length}</Badge>
              )}
            </TabsTrigger>
            {brandId && (
              <TabsTrigger value="mine" className="text-xs h-7">
                <Sparkles className="w-3 h-3 mr-1" />
                Pesquisar Novas
              </TabsTrigger>
            )}
          </TabsList>

          {/* Tab: Keywords Salvas */}
          <TabsContent value="saved" className="mt-3">
            <div className="flex items-center gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar keywords salvas..."
                  className="pl-9 h-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Filtrar por intenção">
                    <Filter className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedIntent('all')}>Todas Intenções</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedIntent('informational')}>Informativa</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedIntent('commercial')}>Comercial</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedIntent('transactional')}>Transacional</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSelectedIntent('navigational')}>Navegacional</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <KeywordTable
              keywords={filteredKeywords}
              loading={loading}
              getKOSColor={getKOSColor}
              emptyMessage="Nenhuma keyword salva. Use a aba 'Pesquisar Novas' para minerar."
            />
          </TabsContent>

          {/* Tab: Pesquisar Novas */}
          {brandId && (
            <TabsContent value="mine" className="mt-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: marketing digital, funil de vendas..."
                    className="pl-9 h-9"
                    value={minerTerm}
                    onChange={(e) => setMinerTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !mining && handleMine()}
                    disabled={mining}
                  />
                </div>
                <Button
                  onClick={handleMine}
                  disabled={mining || !minerTerm.trim()}
                  size="sm"
                  className="h-9"
                >
                  {mining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                  Minerar
                </Button>
              </div>

              {minerResults.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    onClick={handleSaveAll}
                    disabled={savingAll}
                  >
                    {savingAll ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Save className="w-3 h-3 mr-1" />}
                    Salvar Todas ({minerResults.length})
                  </Button>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {minerResults.length} resultados para &ldquo;{minerTerm}&rdquo;
                  </span>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Palavra-Chave</TableHead>
                      <TableHead>Intenção</TableHead>
                      <TableHead className="text-right">Volume</TableHead>
                      <TableHead className="text-right">Dificuldade</TableHead>
                      <TableHead className="text-right">KOS</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mining ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-12 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-12 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell><div className="h-4 w-12 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      ))
                    ) : minerResults.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                          Digite um termo e clique em &ldquo;Minerar&rdquo; para pesquisar keywords.
                        </TableCell>
                      </TableRow>
                    ) : (
                      minerResults.map((kw) => {
                        const intentLabel = INTENT_LABELS[kw.intent as SearchIntent] || INTENT_LABELS.informational;
                        const isSaved = savedTerms.has(kw.term.toLowerCase());
                        return (
                          <TableRow key={kw.term}>
                            <TableCell className="font-medium">
                              <span>{kw.term}</span>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] font-normal ${intentLabel.color}`}>
                                {intentLabel.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-xs">{kw.volume.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-xs">{kw.difficulty}</span>
                                <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div className="h-full bg-slate-400" style={{ width: `${kw.difficulty}%` }} />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className={`text-right text-sm ${getKOSColor(kw.opportunityScore)}`}>
                              {kw.opportunityScore}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-7 w-7 ${isSaved ? 'text-green-500' : 'text-muted-foreground hover:text-green-500'}`}
                                onClick={() => !isSaved && handleSaveOne(kw)}
                                disabled={isSaved}
                                aria-label={isSaved ? 'Já salva' : 'Salvar keyword'}
                              >
                                {isSaved ? <Save className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}

/** Reusable table for saved keywords */
function KeywordTable({
  keywords,
  loading,
  getKOSColor,
  emptyMessage,
}: {
  keywords: KeywordIntelligence[];
  loading?: boolean;
  getKOSColor: (score: number) => string;
  emptyMessage: string;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Palavra-Chave</TableHead>
            <TableHead>Intenção</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="text-right">Dificuldade</TableHead>
            <TableHead className="text-right">
              <div className="flex items-center justify-end gap-1">
                KOS
                <ArrowUpDown className="h-3 w-3" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><div className="h-4 w-32 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-12 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-12 ml-auto bg-muted animate-pulse rounded" /></TableCell>
                <TableCell><div className="h-4 w-12 ml-auto bg-muted animate-pulse rounded" /></TableCell>
              </TableRow>
            ))
          ) : keywords.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            keywords.map((kw) => {
              const intentLabel = INTENT_LABELS[kw.intent] || INTENT_LABELS.informational;
              return (
                <TableRow key={kw.term}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{kw.term}</span>
                      {kw.metrics.trend && (
                        <span className={`text-[10px] flex items-center gap-0.5 ${kw.metrics.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {kw.metrics.trend > 0 ? <TrendingUp className="w-2 h-2" /> : <TrendingDown className="w-2 h-2" />}
                          {Math.abs(kw.metrics.trend)}%
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] font-normal ${intentLabel.color}`}>
                      {intentLabel.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs">{kw.metrics.volume.toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs">{kw.metrics.difficulty}</span>
                      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-slate-400" style={{ width: `${kw.metrics.difficulty}%` }} />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className={`text-right text-sm ${getKOSColor(kw.metrics.opportunityScore)}`}>
                    {kw.metrics.opportunityScore}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
