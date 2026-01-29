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
  Minus, 
  Filter,
  ArrowUpDown,
  ExternalLink
} from "lucide-react";
import { KeywordIntelligence, SearchIntent } from "@/types/intelligence";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KeywordRankingProps {
  keywords: KeywordIntelligence[];
  loading?: boolean;
}

const INTENT_LABELS: Record<SearchIntent, { label: string; color: string }> = {
  informational: { label: "Informativa", color: "bg-blue-100 text-blue-700 border-blue-200" },
  navigational: { label: "Navegacional", color: "bg-purple-100 text-purple-700 border-purple-200" },
  commercial: { label: "Comercial", color: "bg-orange-100 text-orange-700 border-orange-200" },
  transactional: { label: "Transacional", color: "bg-green-100 text-green-700 border-green-200" },
};

export function KeywordRanking({ keywords, loading }: KeywordRankingProps) {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [minKOS, setMinKOS] = React.useState(0);
  const [selectedIntent, setSelectedIntent] = React.useState<SearchIntent | 'all'>('all');

  const filteredKeywords = keywords.filter(kw => {
    const matchesSearch = kw.term.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesKOS = kw.metrics.opportunityScore >= minKOS;
    const matchesIntent = selectedIntent === 'all' || kw.intent === selectedIntent;
    return matchesSearch && matchesKOS && matchesIntent;
  }).sort((a, b) => b.metrics.opportunityScore - a.metrics.opportunityScore);

  const getKOSColor = (score: number) => {
    if (score >= 80) return "text-green-600 font-black";
    if (score >= 50) return "text-blue-600 font-bold";
    if (score >= 30) return "text-yellow-600 font-medium";
    return "text-muted-foreground";
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-500" />
              Ranking de Keywords (KOS)
            </CardTitle>
            <CardDescription>
              Priorização de termos baseada em Volume, Relevância e Dificuldade.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar termo..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
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
        </div>
      </CardHeader>
      <CardContent>
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
                <TableHead className="w-[50px]"></TableHead>
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
                    <TableCell></TableCell>
                  </TableRow>
                ))
              ) : filteredKeywords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    Nenhuma keyword encontrada com os filtros atuais.
                  </TableCell>
                </TableRow>
              ) : (
                filteredKeywords.map((kw) => (
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
                      <Badge variant="outline" className={`text-[10px] font-normal ${INTENT_LABELS[kw.intent].color}`}>
                        {INTENT_LABELS[kw.intent].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs">{kw.metrics.volume.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs">{kw.metrics.difficulty}</span>
                        <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-slate-400" 
                            style={{ width: `${kw.metrics.difficulty}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className={`text-right text-sm ${getKOSColor(kw.metrics.opportunityScore)}`}>
                      {kw.metrics.opportunityScore}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
